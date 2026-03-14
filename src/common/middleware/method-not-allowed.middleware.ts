import {
  HttpStatus,
  Injectable,
  MethodNotAllowedException,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

type RouteRule = {
  pattern: RegExp;
  methods: string[];
};

@Injectable()
export class MethodNotAllowedMiddleware implements NestMiddleware {
  private readonly rules: RouteRule[] = [
    { pattern: /^\/auth\/login\/?$/, methods: ['POST'] },
    { pattern: /^\/auth\/logout\/?$/, methods: ['POST'] },
    { pattern: /^\/books\/?$/, methods: ['GET', 'POST'] },
    {
      pattern: /^\/books\/[^/]+\/?$/,
      methods: ['GET', 'PUT', 'PATCH', 'DELETE'],
    },
  ];

  use(request: Request, response: Response, next: NextFunction) {
    const matchedRule = this.rules.find((rule) =>
      rule.pattern.test(request.path),
    );

    if (!matchedRule) {
      next();
      return;
    }

    if (matchedRule.methods.includes(request.method.toUpperCase())) {
      next();
      return;
    }

    throw new MethodNotAllowedException({
      message: `Method ${request.method.toUpperCase()} is not allowed for ${request.path}`,
      details: {
        allowedMethods: matchedRule.methods,
        statusCode: HttpStatus.METHOD_NOT_ALLOWED,
      },
    });
  }
}
