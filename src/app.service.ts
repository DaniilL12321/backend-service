import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'Books REST API',
      version: '1.0.0',
      entity: 'Book',
      docs: {
        login: 'POST /auth/login',
        logout: 'POST /auth/logout',
        books: '/books',
      },
    };
  }
}
