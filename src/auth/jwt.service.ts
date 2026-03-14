import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

export type JwtPayload = {
  sub: number;
  login: string;
  iat?: number;
  exp?: number;
};

@Injectable()
export class JwtService {
  constructor(private readonly configService: ConfigService) {}

  sign(payload: JwtPayload) {
    const now = Math.floor(Date.now() / 1000);
    const expiresInSeconds = Number(
      this.configService.get<string>('JWT_EXPIRES_IN_SECONDS') ?? '3600',
    );

    const fullPayload: JwtPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
    };

    const header = this.toBase64Url({ alg: 'HS256', typ: 'JWT' });
    const body = this.toBase64Url(fullPayload);
    const signature = this.signPart(`${header}.${body}`);

    return `${header}.${body}.${signature}`;
  }

  verify(token: string): JwtPayload {
    const parts = token.split('.');

    if (parts.length !== 3) {
      throw new UnauthorizedException({
        message: 'Authorization token is invalid',
        details: null,
      });
    }

    const [header, body, signature] = parts;
    const expectedSignature = this.signPart(`${header}.${body}`);

    if (signature.length !== expectedSignature.length) {
      throw new UnauthorizedException({
        message: 'Authorization token is invalid',
        details: null,
      });
    }

    if (
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      throw new UnauthorizedException({
        message: 'Authorization token is invalid',
        details: null,
      });
    }

    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as JwtPayload;

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException({
        message: 'Authorization token has expired',
        details: null,
      });
    }

    return payload;
  }

  private toBase64Url(value: object) {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }

  private signPart(value: string) {
    const secret = this.configService.get<string>('JWT_SECRET') ?? 'dev-secret';

    return createHmac('sha256', secret).update(value).digest('base64url');
  }
}
