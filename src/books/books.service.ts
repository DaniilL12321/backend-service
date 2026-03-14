import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Book, BookInput, BookRow } from './book.types';

type ValidationMode = 'create' | 'replace' | 'patch';

@Injectable()
export class BooksService {
  private readonly allowedGenres = [
    'fiction',
    'non-fiction',
    'fantasy',
    'science',
    'history',
    'education',
  ];

  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(): Promise<Book[]> {
    await this.databaseService.initialize();
    const result = await this.databaseService.query<BookRow>(
      `
        SELECT id, title, author, genre, year, available, description, created_at
        FROM books
        ORDER BY id ASC
      `,
    );

    return result.rows.map((row) => this.mapBook(row));
  }

  async findOne(id: number): Promise<Book> {
    await this.databaseService.initialize();
    const result = await this.databaseService.query<BookRow>(
      `
        SELECT id, title, author, genre, year, available, description, created_at
        FROM books
        WHERE id = $1
      `,
      [id],
    );

    const row = result.rows[0];

    if (!row) {
      throw new NotFoundException({
        message: `Book with id ${id} not found`,
        details: null,
      });
    }

    return this.mapBook(row);
  }

  async create(body: unknown): Promise<Book> {
    await this.databaseService.initialize();
    const payload = this.validateBook(body, 'create');
    const result = await this.databaseService.query<BookRow>(
      `
        INSERT INTO books (title, author, genre, year, available, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, title, author, genre, year, available, description, created_at
      `,
      [
        payload.title,
        payload.author,
        payload.genre,
        payload.year,
        payload.available,
        payload.description ?? null,
      ],
    );

    return this.mapBook(result.rows[0]);
  }

  async update(id: number, body: unknown): Promise<Book> {
    await this.ensureExists(id);
    const payload = this.validateBook(body, 'replace');
    const result = await this.databaseService.query<BookRow>(
      `
        UPDATE books
        SET title = $2,
            author = $3,
            genre = $4,
            year = $5,
            available = $6,
            description = $7
        WHERE id = $1
        RETURNING id, title, author, genre, year, available, description, created_at
      `,
      [
        id,
        payload.title,
        payload.author,
        payload.genre,
        payload.year,
        payload.available,
        payload.description ?? null,
      ],
    );

    return this.mapBook(result.rows[0]);
  }

  async patch(id: number, body: unknown): Promise<Book> {
    const current = await this.findOne(id);
    const patch = this.validateBook(body, 'patch');
    const nextValue: BookInput = {
      title: patch.title ?? current.title,
      author: patch.author ?? current.author,
      genre: patch.genre ?? current.genre,
      year: patch.year ?? current.year,
      available: patch.available ?? current.available,
      description:
        patch.description === undefined
          ? current.description
          : patch.description,
    };

    const result = await this.databaseService.query<BookRow>(
      `
        UPDATE books
        SET title = $2,
            author = $3,
            genre = $4,
            year = $5,
            available = $6,
            description = $7
        WHERE id = $1
        RETURNING id, title, author, genre, year, available, description, created_at
      `,
      [
        id,
        nextValue.title,
        nextValue.author,
        nextValue.genre,
        nextValue.year,
        nextValue.available,
        nextValue.description ?? null,
      ],
    );

    return this.mapBook(result.rows[0]);
  }

  async remove(id: number) {
    await this.ensureExists(id);
    await this.databaseService.query(`DELETE FROM books WHERE id = $1`, [id]);

    return {
      message: `Book with id ${id} deleted successfully`,
    };
  }

  private async ensureExists(id: number) {
    await this.databaseService.initialize();
    const result = await this.databaseService.query<{ id: string }>(
      `SELECT id FROM books WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException({
        message: `Book with id ${id} not found`,
        details: null,
      });
    }
  }

  private validateBook(
    body: unknown,
    mode: ValidationMode,
  ): Partial<BookInput> | BookInput {
    if (!this.isRecord(body)) {
      throw this.validationException(
        mode === 'patch'
          ? 'PATCH request body must be a JSON object'
          : 'Request body must be a JSON object',
        null,
        mode,
      );
    }

    const allowedFields = [
      'title',
      'author',
      'genre',
      'year',
      'available',
      'description',
    ];
    const unknownFields = Object.keys(body).filter(
      (field) => !allowedFields.includes(field),
    );

    if (unknownFields.length > 0) {
      throw this.validationException(
        'Request contains unsupported fields',
        unknownFields.map((field) => ({
          field,
          message: 'field is not allowed',
        })),
        mode,
      );
    }

    if (mode === 'patch' && Object.keys(body).length === 0) {
      throw new BadRequestException({
        message: 'PATCH request body must contain at least one field',
        details: null,
      });
    }

    const errors: { field: string; message: string }[] = [];
    const value: Partial<BookInput> = {};

    const requiredFields =
      mode === 'patch' ? [] : ['title', 'author', 'genre', 'year', 'available'];

    for (const field of requiredFields) {
      if (!(field in body)) {
        errors.push({
          field,
          message: 'field is required',
        });
      }
    }

    this.validateStringField(body, 'title', 2, 100, errors, value, mode);
    this.validateStringField(body, 'author', 2, 100, errors, value, mode);
    this.validateStringField(body, 'genre', 3, 50, errors, value, mode);

    if ('genre' in body && typeof body.genre === 'string') {
      const genre = body.genre.trim().toLowerCase();
      value.genre = genre;

      if (!this.allowedGenres.includes(genre)) {
        errors.push({
          field: 'genre',
          message: `genre must be one of: ${this.allowedGenres.join(', ')}`,
        });
      }
    }

    if ('year' in body) {
      const year = body.year;

      if (!Number.isInteger(year)) {
        errors.push({
          field: 'year',
          message: 'year must be an integer',
        });
      } else if ((year as number) < 1900 || (year as number) > 2100) {
        errors.push({
          field: 'year',
          message: 'year must be between 1900 and 2100',
        });
      } else {
        value.year = year as number;
      }
    }

    if ('available' in body) {
      if (typeof body.available !== 'boolean') {
        errors.push({
          field: 'available',
          message: 'available must be a boolean',
        });
      } else {
        value.available = body.available;
      }
    }

    if ('description' in body) {
      if (
        body.description !== null &&
        (typeof body.description !== 'string' ||
          body.description.trim().length > 500)
      ) {
        errors.push({
          field: 'description',
          message:
            'description must be null or a string with maximum length of 500 characters',
        });
      } else {
        value.description =
          typeof body.description === 'string' ? body.description.trim() : null;
      }
    }

    if (errors.length > 0) {
      throw this.validationException('Book validation failed', errors, mode);
    }

    return value as Partial<BookInput> | BookInput;
  }

  private validateStringField(
    body: Record<string, unknown>,
    field: 'title' | 'author' | 'genre',
    min: number,
    max: number,
    errors: { field: string; message: string }[],
    target: Partial<BookInput>,
    mode: ValidationMode,
  ) {
    if (!(field in body)) {
      return;
    }

    if (typeof body[field] !== 'string') {
      errors.push({
        field,
        message: `${field} must be a string`,
      });
      return;
    }

    const normalized = body[field].trim();

    if (normalized.length < min || normalized.length > max) {
      errors.push({
        field,
        message: `${field} length must be between ${min} and ${max} characters`,
      });
      return;
    }

    target[field] = mode === 'patch' ? normalized : normalized;
  }

  private validationException(
    message: string,
    details: { field: string; message: string }[] | null,
    mode: ValidationMode,
  ) {
    if (mode === 'patch') {
      return new BadRequestException({
        message,
        details,
      });
    }

    return new UnprocessableEntityException({
      message,
      details,
    });
  }

  private mapBook(row: BookRow): Book {
    return {
      id: Number(row.id),
      title: row.title,
      author: row.author,
      genre: row.genre,
      year: row.year,
      available: row.available,
      description: row.description,
      createdAt: row.created_at,
    };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
