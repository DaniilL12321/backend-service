import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['login', 'password'],
      properties: {
        login: { type: 'string', example: 'student' },
        password: { type: 'string', example: 'student123' },
      },
    },
  })
  @ApiOkResponse({ description: 'JWT token returned successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid login or password' })
  @ApiUnprocessableEntityResponse({ description: 'Login validation failed' })
  async login(@Body() body: unknown) {
    return this.authService.login(body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiOkResponse({ description: 'Logout completed successfully' })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or revoked token',
  })
  logout(@Req() request: Request) {
    const authHeader = request.headers.authorization ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    return this.authService.logout(token);
  }
}
