# Todo App Backend

A RESTful API for a task management application built with Node.js, Express, TypeScript, and MongoDB.

## Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js 20+ |
| Framework | Express 5 |
| Language | TypeScript 5 |
| Database | MongoDB with Mongoose 9 |
| Authentication | JWT (jsonwebtoken) |
| Validation | Zod 4 |
| Logging | Pino + pino-http |
| Password Hashing | bcrypt |
| Containerization | Docker + Docker Compose |
| Code Quality | ESLint + TypeScript ESLint |

## Project Structure

```
backend/
├── src/
│   ├── controllers/       # Request handlers
│   │   ├── auth.controller.ts
│   │   └── task.controller.ts
│   ├── database/          # Database connection utilities
│   │   └── connectDB.db.util.ts
│   ├── middleware/        # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   ├── models/            # Mongoose models
│   │   ├── ModelErrorHandlers.ts
│   │   ├── task.model.ts
│   │   └── user.model.ts
│   ├── routes/            # API route definitions
│   │   ├── auth.routes.ts
│   │   └── task.routes.ts
│   ├── schema/            # Zod validation schemas
│   │   ├── auth.schema.ts
│   │   └── task.schema.ts
│   ├── types/             # TypeScript type definitions
│   │   └── express.d.ts
│   ├── utils/             # Utility functions
│   │   ├── AppError.error.util.ts
│   │   ├── catchAsync.error.util.ts
│   │   ├── logger.global.util.ts
│   │   └── token.auth.util.ts
│   ├── app.ts             # Express app configuration
│   └── server.ts          # Server entry point
├── dist/                  # Compiled JavaScript output
├── logs/                  # Application logs
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
└── eslint.config.mts
```

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- MongoDB (local installation or Docker)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/sourabh945/todo-list.git
   cd todo-list/backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the backend root:

   ```env
   # Server
   PORT=3000
   NODE_ENV=development

   # Database
   DATABASE_URL=mongodb://localhost:27017/todo-app

   # JWT
   JWT_SECRET=your-super-secret-key-at-least-32-characters
   JWT_EXPIRES_IN=7

   # Logging
   LOG_LEVEL=info
   LOG_FILE_NAME=./logs/app.logs
   TERMINAL_LOG=allow
   TERMINAL_LOG_LEVEL=info
   FILE_LOG_LEVEL=info
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

### Using Docker

Start both the application and MongoDB with Docker Compose:

```bash
docker-compose up --build
```

This will:
- Build the Node.js application
- Start MongoDB on port 27017
- Start the API server on port 3000
- Persist MongoDB data in `./mongo-data`
- Persist logs in `./logs`

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `NODE_ENV` | Environment (`development`/`production`) | `production` | No |
| `DATABASE_URL` | MongoDB connection string | - | Yes (production) |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) | Auto-generated | Yes (production) |
| `JWT_EXPIRES_IN` | Token expiration in days | `7` | No |
| `LOG_LEVEL` | Global log level | `info` | No |
| `LOG_FILE_NAME` | Log file path | `./app/logs/app.logs` | No |
| `TERMINAL_LOG` | Enable terminal logging (`allow`/`true`) | Enabled in dev | No |
| `TERMINAL_LOG_LEVEL` | Terminal log level | Inherits `LOG_LEVEL` | No |
| `FILE_LOG_LEVEL` | File log level | Inherits `LOG_LEVEL` | No |

## API Reference

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

All task endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

### Auth Endpoints

#### Register a new user

```http
POST /auth/signup
```

**Request Body:**

```json
{
  "username": "johndoe123",
  "name": "John Doe",
  "password": "securepassword123"
}
```

**Validation Rules:**
- `username`: Exactly 10 alphanumeric characters
- `name`: Optional, max 100 characters
- `password`: 8-100 characters

**Response (201 Created):**

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "data": {
    "username": "johndoe123",
    "name": "John Doe"
  }
}
```

#### Login

```http
POST /auth/login
```

**Request Body:**

```json
{
  "username": "johndoe123",
  "password": "securepassword123"
}
```

**Response (200 OK):**

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "data": {
    "username": "johndoe123",
    "name": "John Doe"
  }
}
```

#### Test Auth Token

```http
POST /auth/test
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "status": "success",
  "error": []
}
```

---

### Task Endpoints

#### Create a task

```http
POST /tasks
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "title": "Complete project documentation",
  "desc": "Write comprehensive README and API docs",
  "priority": "high",
  "status": "pending",
  "dueDate": "2026-03-01T00:00:00.000Z"
}
```

**Field Details:**
- `title`: Required, min 3 characters
- `desc`: Required
- `priority`: Optional (`low`, `medium`, `high`), default: `medium`
- `status`: Optional (`pending`, `in-progress`, `done`), default: `pending`
- `dueDate`: Optional, must be in the future

**Response (201 Created):**

```json
{
  "status": "success",
  "task": {
    "_id": "507f1f77bcf86cd799439011",
    "user_id": "507f1f77bcf86cd799439012",
    "title": "Complete project documentation",
    "desc": "Write comprehensive README and API docs",
    "status": "pending",
    "priority": "high",
    "dueDate": "2026-03-01T00:00:00.000Z",
    "createdAt": "2026-02-16T06:00:00.000Z",
    "updatedAt": "2026-02-16T06:00:00.000Z"
  }
}
```

#### Update a task

```http
PUT /tasks/:id
Authorization: Bearer <token>
```

**Request Body (all fields optional):**

```json
{
  "title": "Updated title",
  "status": "in-progress",
  "priority": "low"
}
```

**Response (203):**

```json
{
  "status": "success",
  "message": "Task updated successfully"
}
```

#### Delete a task

```http
DELETE /tasks/:id
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "Task deleted"
}
```

#### Get active tasks

```http
GET /tasks/active?page=1&limit=20
Authorization: Bearer <token>
```

Returns tasks with status `pending` or `in-progress`, sorted by due date and creation date.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (1-25, default: 20)

**Response (200 OK):**

```json
{
  "status": "success",
  "tasks": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Task 1",
      "desc": "Description",
      "status": "pending",
      "priority": "high",
      "dueDate": "2026-03-01T00:00:00.000Z",
      "createdAt": "2026-02-16T06:00:00.000Z",
      "updatedAt": "2026-02-16T06:00:00.000Z"
    }
  ]
}
```

#### Get completed tasks

```http
GET /tasks/done?page=1&limit=20
Authorization: Bearer <token>
```

Returns tasks with status `done`, sorted by most recently updated.

**Response (200 OK):**

```json
{
  "status": "success",
  "tasks": [...]
}
```

#### Get task statistics

```http
GET /tasks/stats
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "status": "success",
  "stats": {
    "pending": 5,
    "in-progress": 3,
    "due-this-week": 2,
    "due-today": 1
  }
}
```

---

## Error Handling

The API uses a consistent error response format:

```json
{
  "status": "error",
  "message": "User-friendly error message"
}
```

In development mode, additional debugging info is included:

```json
{
  "status": "error",
  "message": "User-friendly error message",
  "errorType": "ValidationError",
  "internalError": "Detailed internal error message",
  "stack": "Error stack trace..."
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 203 | Updated (Non-Authoritative Information) |
| 400 | Bad Request (validation errors) |
| 401 | Unauthorized (invalid/missing token) |
| 404 | Not Found |
| 409 | Conflict (duplicate key, version conflict) |
| 500 | Internal Server Error |

### Handled Error Types

- **Validation Errors**: Invalid input data
- **Cast Errors**: Invalid MongoDB ObjectId
- **Duplicate Key Errors**: Unique constraint violations
- **JWT Errors**: Token expired, invalid token
- **Document Not Found**: Resource doesn't exist

---

## Data Models

### User

```typescript
{
  _id: ObjectId,
  username: string,    // Unique, 10 chars, alphanumeric
  name: string | null,
  password: string     // Hashed with bcrypt (12 rounds)
}
```

### Task

```typescript
{
  _id: ObjectId,
  user_id: ObjectId,           // Reference to User (immutable)
  title: string,               // Min 3 characters
  desc: string | null,
  status: "pending" | "in-progress" | "done",   // Default: "pending"
  priority: "low" | "medium" | "high",          // Default: "medium"
  dueDate: Date | null,        // Must be in the future
  createdAt: Date,             // Auto-generated
  updatedAt: Date              // Auto-generated
}
```

**Database Indexes:**
- `{ user_id: 1, _status: 1 }` - Optimized for querying user tasks by status

---

## Logging

The application uses Pino for structured JSON logging with the following features:

- **File logging**: Logs are written to the configured log file path
- **Terminal logging**: Colored, pretty-printed output in development
- **HTTP request logging**: All requests are logged with pino-http
- **Sensitive data redaction**: Authorization headers and cookies are automatically redacted

### Log Format

Logs follow a structured tagging convention:

```
[Phase] [Event] [Module] Message
```

- **Phase**: `Start`, `Running`, `Shutdown`, `Precheck`
- **Event**: `Done`, `Fail`, `Exception`, `Rejection`, `SIGTERM`, `SIGINT`, `Timeout`, `Exit`
- **Module**: `MongoDB`, `ENV`, `JWT Auth`, `App`, `Server`

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm test` | Run tests (placeholder) |

---

## Graceful Shutdown

The server handles graceful shutdown for:

- **SIGTERM**: Container/orchestrator stop signals
- **SIGINT**: Ctrl+C interrupts
- **Unhandled Promise Rejections**: Logs error and shuts down gracefully

Shutdown process:
1. Stop accepting new connections
2. Wait for in-flight requests to complete (10s timeout)
3. Close database connections
4. Exit process

---

## Security Features

- **Password Hashing**: Bcrypt with 12 salt rounds
- **JWT Authentication**: Configurable expiration, secure secret validation
- **Input Validation**: Zod schemas for all request bodies
- **Header Security**: `x-powered-by` disabled
- **Sensitive Data Redaction**: Auth headers excluded from logs

### Production Security Requirements

- `JWT_SECRET` must be at least 32 characters
- `DATABASE_URL` must be explicitly configured

---

## Development

### Code Style

The project uses ESLint with TypeScript-ESLint for code quality:

```bash
# Lint the codebase
npx eslint .

# Fix auto-fixable issues
npx eslint . --fix
```

### TypeScript Configuration

- **Target**: ESNext
- **Module**: NodeNext (ESM)
- **Strict Mode**: Enabled
- **Source Maps**: Enabled for debugging

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

GNU General Public License v3 © [sourabh945](https://github.com/sourabh945)

---

## Author

**Sourabh Sheokand**
- GitHub: [@sourabh945](https://github.com/sourabh945)
- Email: sheokand.sourabh.anil@gmail.com
