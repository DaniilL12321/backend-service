# Books REST API

REST API на NestJS для управления книгами. Проект сделан под требования задания по дисциплине "Бэкенд разработка веб-приложений" и использует PostgreSQL 17, JWT-авторизацию, CRUD-операции, валидацию и единый JSON-формат ошибок.

## Предметная область

Основная сущность: `Book`.

Поля:

- `id` - уникальный идентификатор
- `title` - название книги
- `author` - автор
- `genre` - жанр
- `year` - год издания
- `available` - доступна ли книга
- `description` - необязательное описание
- `createdAt` - дата создания записи

## Стек технологий

- NestJS
- TypeScript
- PostgreSQL 17
- `pg`
- JWT на базе Node.js `crypto`

## Структура проекта

- `src/auth` - авторизация и JWT
- `src/books` - CRUD для книг
- `src/common` - фильтры ошибок, middleware, pipes
- `src/database` - подключение к PostgreSQL и инициализация схемы
- `.env.example` - пример переменных окружения

## Как запустить

1. Установить зависимости:

```bash
npm install
```

2. Создать `.env` на основе `.env.example`.

3. Указать данные вашей БД преподавателя:

```env
PORT=3000
DB_HOST=109.198.190.115
DB_PORT=32322
DB_NAME=your_database_name
DB_USER=student
DB_PASSWORD=5432
AUTH_LOGIN=student
AUTH_PASSWORD=student123
JWT_SECRET=super-secret-key
JWT_EXPIRES_IN_SECONDS=3600
```

4. Запустить проект:

```bash
npm run start:dev
```

При первом запуске приложение автоматически создаёт таблицы `users` и `books`, а также пользователя для входа из переменных `AUTH_LOGIN` и `AUTH_PASSWORD`.

Swagger UI будет доступен по адресу:

```text
http://localhost:3000/docs
```

Scalar API Reference будет доступен по адресу:

```text
http://localhost:3000/reference
```

## Авторизация

Используется JWT.

Защищены все ручки `/books`. Для доступа нужно:

1. Выполнить `POST /auth/login`
2. Получить `accessToken`
3. Передавать заголовок:

```http
Authorization: Bearer <token>
```

### POST /auth/login

Запрос:

```json
{
  "login": "student",
  "password": "student123"
}
```

Успешный ответ `200 OK`:

```json
{
  "accessToken": "jwt-token",
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "login": "student"
  }
}
```

### POST /auth/logout

Требует токен. Для JWT ручка реализована формально: добавляет токен в память приложения как отозванный.

Успешный ответ `200 OK`:

```json
{
  "message": "Logout completed successfully"
}
```

## Маршруты API

### GET /books

Возвращает список всех книг.

Ответ `200 OK`:

```json
[
  {
    "id": 1,
    "title": "Clean Code",
    "author": "Robert Martin",
    "genre": "education",
    "year": 2008,
    "available": true,
    "description": "Book about code quality",
    "createdAt": "2026-03-14T10:00:00.000Z"
  }
]
```

### GET /books/{id}

Возвращает одну книгу по идентификатору.

### POST /books

Создаёт книгу.

Пример запроса:

```json
{
  "title": "Clean Code",
  "author": "Robert Martin",
  "genre": "education",
  "year": 2008,
  "available": true,
  "description": "Book about code quality"
}
```

Успешный ответ `201 Created`:

```json
{
  "id": 1,
  "title": "Clean Code",
  "author": "Robert Martin",
  "genre": "education",
  "year": 2008,
  "available": true,
  "description": "Book about code quality",
  "createdAt": "2026-03-14T10:00:00.000Z"
}
```

### PUT /books/{id}

Полностью обновляет книгу. Нужно передать все обязательные поля.

### PATCH /books/{id}

Частично обновляет книгу. Можно передать только изменяемые поля.

### DELETE /books/{id}

Удаляет книгу.

Успешный ответ `200 OK`:

```json
{
  "message": "Book with id 1 deleted successfully"
}
```

## Валидация

Реализованы проверки:

- `title` - строка от 2 до 100 символов
- `author` - строка от 2 до 100 символов
- `genre` - одно из значений: `fiction`, `non-fiction`, `fantasy`, `science`, `history`, `education`
- `year` - целое число от 1900 до 2100
- `available` - boolean
- `description` - необязательная строка до 500 символов или `null`

## Формат ошибок

Все ошибки возвращаются в едином JSON-формате:

```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "Book validation failed",
  "details": [
    {
      "field": "title",
      "message": "title length must be between 2 and 100 characters"
    }
  ],
  "timestamp": "2026-03-14T10:00:00.000Z",
  "path": "/books"
}
```

### Реализованные коды ошибок

- `400 Bad Request` - некорректный JSON, неверный `id`, неподдерживаемые поля в PATCH, неверный формат запроса
- `401 Unauthorized` - отсутствует токен, токен неверный, токен истёк, пользователь не прошёл аутентификацию
- `404 Not Found` - книга не найдена, ресурс не существует
- `405 Method Not Allowed` - метод не поддерживается для маршрута
- `422 Unprocessable Entity` - ошибки бизнес-валидации для `POST`, `PUT`, `POST /auth/login`
- `500 Internal Server Error` - ошибка базы данных или непредвиденный сбой сервера

## Примеры запросов

### Логин

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"student","password":"student123"}'
```

### Создание книги

```bash
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Clean Code","author":"Robert Martin","genre":"education","year":2008,"available":true,"description":"Book about code quality"}'
```

### Ошибка авторизации

```bash
curl http://localhost:3000/books
```

Ответ:

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Authorization token is missing",
  "details": null,
  "timestamp": "2026-03-14T10:00:00.000Z",
  "path": "/books"
}
```

## Проверка

```bash
npm run build
npm run test
```
