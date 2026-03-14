import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { JwtPayload, JwtService } from './jwt.service';

type LoginBody = {
  login: string;
  password: string;
};

type UserRow = {
  id: string;
  login: string;
  password_hash: string;
};

@Injectable()
export class AuthService {
  private readonly revokedTokens = new Set<string>();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async login(body: unknown) {
    const payload = this.validateLoginBody(body);

    await this.databaseService.initialize();

    const result = await this.databaseService.query<UserRow>(
      `SELECT id, login, password_hash FROM users WHERE login = $1 LIMIT 1`,
      [payload.login],
    );

    const user = result.rows[0];
    const passwordHash = createHash('sha256')
      .update(payload.password)
      .digest('hex');

    if (!user || user.password_hash !== passwordHash) {
      throw new UnauthorizedException({
        message: 'Invalid login or password',
        details: null,
      });
    }

    const tokenPayload: JwtPayload = {
      sub: Number(user.id),
      login: user.login,
    };

    return {
      accessToken: this.jwtService.sign(tokenPayload),
      tokenType: 'Bearer',
      user: {
        id: Number(user.id),
        login: user.login,
      },
    };
  }

  logout(token: string) {
    this.revokedTokens.add(token);

    return {
      message: 'Logout completed successfully',
    };
  }

  verifyAccessToken(token: string) {
    if (!token) {
      throw new UnauthorizedException({
        message: 'Authorization token is missing',
        details: null,
      });
    }

    if (this.revokedTokens.has(token)) {
      throw new UnauthorizedException({
        message: 'Authorization token is revoked',
        details: null,
      });
    }

    return this.jwtService.verify(token);
  }

  private validateLoginBody(body: unknown): LoginBody {
    if (!this.isRecord(body)) {
      throw new UnprocessableEntityException({
        message: 'Login and password are required',
        details: [
          { field: 'login', message: 'login must be a non-empty string' },
          { field: 'password', message: 'password must be a non-empty string' },
        ],
      });
    }

    const login = body.login;
    const password = body.password;
    const errors: { field: string; message: string }[] = [];

    if (typeof login !== 'string' || login.trim().length < 3) {
      errors.push({
        field: 'login',
        message: 'login must be a string with at least 3 characters',
      });
    }

    if (typeof password !== 'string' || password.trim().length < 4) {
      errors.push({
        field: 'password',
        message: 'password must be a string with at least 4 characters',
      });
    }

    if (errors.length > 0) {
      throw new UnprocessableEntityException({
        message: 'Login validation failed',
        details: errors,
      });
    }

    return {
      login: (login as string).trim(),
      password: (password as string).trim(),
    };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
