import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../src/app.controller';
import { AppModule } from '../src/app.module';

describe('AppController (pseudo-e2e)', () => {
  let appController: AppController;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    appController = moduleFixture.get(AppController);
  });

  it('/ (GET)', () => {
    expect(appController.getInfo()).toEqual({
      name: 'Books REST API',
      version: '1.0.0',
      entity: 'Book',
      docs: {
        login: 'POST /auth/login',
        logout: 'POST /auth/logout',
        books: '/books',
      },
    });
  });
});
