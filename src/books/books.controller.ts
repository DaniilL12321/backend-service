import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { BooksService } from './books.service';

@ApiTags('Books')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'JWT token is required' })
@Controller('books')
@UseGuards(AuthGuard)
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all books' })
  @ApiOkResponse({ description: 'Books list returned successfully' })
  findAll() {
    return this.booksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one book by id' })
  @ApiOkResponse({ description: 'Book returned successfully' })
  @ApiNotFoundResponse({ description: 'Book not found' })
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.booksService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new book' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'author', 'genre', 'year', 'available'],
      properties: {
        title: { type: 'string', example: 'Clean Code' },
        author: { type: 'string', example: 'Robert Martin' },
        genre: { type: 'string', example: 'education' },
        year: { type: 'integer', example: 2008 },
        available: { type: 'boolean', example: true },
        description: {
          type: 'string',
          nullable: true,
          example: 'Book about code quality',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Book created successfully' })
  @ApiUnprocessableEntityResponse({ description: 'Book validation failed' })
  create(@Body() body: unknown) {
    return this.booksService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace a book completely' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'author', 'genre', 'year', 'available'],
      properties: {
        title: { type: 'string', example: 'Refactoring' },
        author: { type: 'string', example: 'Martin Fowler' },
        genre: { type: 'string', example: 'education' },
        year: { type: 'integer', example: 1999 },
        available: { type: 'boolean', example: false },
        description: {
          type: 'string',
          nullable: true,
          example: 'Updated description',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Book updated successfully' })
  @ApiNotFoundResponse({ description: 'Book not found' })
  @ApiUnprocessableEntityResponse({ description: 'Book validation failed' })
  update(@Param('id', ParseIdPipe) id: number, @Body() body: unknown) {
    return this.booksService.update(id, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update selected book fields' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Clean Architecture' },
        author: { type: 'string', example: 'Robert Martin' },
        genre: { type: 'string', example: 'education' },
        year: { type: 'integer', example: 2017 },
        available: { type: 'boolean', example: true },
        description: {
          type: 'string',
          nullable: true,
          example: 'Partially updated description',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Book patched successfully' })
  @ApiNotFoundResponse({ description: 'Book not found' })
  patch(@Param('id', ParseIdPipe) id: number, @Body() body: unknown) {
    return this.booksService.patch(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a book' })
  @ApiOkResponse({ description: 'Book deleted successfully' })
  @ApiNotFoundResponse({ description: 'Book not found' })
  remove(@Param('id', ParseIdPipe) id: number) {
    return this.booksService.remove(id);
  }
}
