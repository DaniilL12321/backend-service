import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult, QueryResultRow } from 'pg';
import { createHash } from 'crypto';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool | null = null;
  private initialized = false;

  constructor(private readonly configService: ConfigService) {}

  async initialize() {
    if (this.initialized || !this.hasDatabaseConfig()) {
      return;
    }

    const pool = this.getPool();

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id BIGSERIAL PRIMARY KEY,
          login VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(64) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS books (
          id BIGSERIAL PRIMARY KEY,
          title VARCHAR(100) NOT NULL,
          author VARCHAR(100) NOT NULL,
          genre VARCHAR(50) NOT NULL,
          year INTEGER NOT NULL,
          available BOOLEAN NOT NULL DEFAULT true,
          description TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      const login = this.configService.get<string>('AUTH_LOGIN') ?? 'student';
      const password =
        this.configService.get<string>('AUTH_PASSWORD') ?? 'student123';

      await pool.query(
        `
          INSERT INTO users (login, password_hash)
          VALUES ($1, $2)
          ON CONFLICT (login) DO UPDATE
          SET password_hash = EXCLUDED.password_hash;
        `,
        [login, createHash('sha256').update(password).digest('hex')],
      );

      this.initialized = true;
      this.logger.log('Database schema initialized');
    } catch (error) {
      this.logger.error('Database initialization failed', error);
      throw new InternalServerErrorException({
        message: 'Database connection or initialization failed',
        details: null,
      });
    }
  }

  async query<T extends QueryResultRow>(
    text: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    try {
      const pool = this.getPool();
      return await pool.query<T>(text, params);
    } catch (error) {
      this.logger.error('Database query failed', error);
      throw new InternalServerErrorException({
        message: 'Database query failed',
        details: null,
      });
    }
  }

  private getPool() {
    if (!this.pool) {
      const host = this.configService.get<string>('DB_HOST');
      const port = Number(this.configService.get<string>('DB_PORT') ?? '5432');
      const database = this.configService.get<string>('DB_NAME');
      const user = this.configService.get<string>('DB_USER');
      const password = this.configService.get<string>('DB_PASSWORD');

      if (!host || !database || !user || !password) {
        throw new InternalServerErrorException({
          message: 'Database configuration is missing',
          details: {
            required: [
              'DB_HOST',
              'DB_PORT',
              'DB_NAME',
              'DB_USER',
              'DB_PASSWORD',
            ],
          },
        });
      }

      this.pool = new Pool({
        host,
        port,
        database,
        user,
        password,
      });
    }

    return this.pool;
  }

  private hasDatabaseConfig() {
    return ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'].every((key) =>
      Boolean(this.configService.get<string>(key)),
    );
  }
}
