import type { JwtPayload } from '../auth/jwt.service';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}
