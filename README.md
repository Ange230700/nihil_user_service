<!-- nihil_backend\user\README.md -->

# Nihil User Service

<!-- ![Nihil Logo](link-to-logo.png) -->

A **user management microservice** for the Nihil platform.
It provides APIs for user CRUD operations, profiles, and authentication (JWT + refresh tokens with CSRF protection), following clean architecture principles and backed by Prisma with a dedicated database.

---

## Table of Contents

- [Demo](#demo)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)
<!-- * [Acknowledgements](#acknowledgements) -->
- [Contact](#contact)

---

## Demo

API docs are exposed via Swagger UI at:

```
http://localhost:3001/api/docs
```

---

## Tech Stack

**Backend:**

- [Node.js](https://nodejs.org/) (TypeScript, ESM)
- [Express](https://expressjs.com/)
- [Prisma ORM](https://www.prisma.io/) (`nihildbuser` package, MySQL)
- [JWT (RS256)](https://www.rfc-editor.org/rfc/rfc7519) with refresh token rotation
- [Zod](https://zod.dev/) for schema validation

**Security:**

- Helmet, CORS, HPP
- Rate limiting
- CSRF protection (double-submit cookie + header)
- Argon2 password hashing

**Tooling:**

- Nx task runner
- Jest + Supertest + Zod for tests
- ESLint (type-aware) + Prettier
- Husky + lint-staged + commitlint
- Docker multi-stage builds
- GitHub Actions CI (MySQL service, Prisma migrations, tests)

---

## Getting Started

### Prerequisites

- Node.js (>=20.x)
- MySQL (>=8.0)
- Docker (optional, for containerized runs)

### Installation

```bash
git clone https://github.com/Ange230700/nihil_user_service.git
cd nihil_backend/user
npm install
```

---

## Running the Project

### Local Development

```bash
# Push schema to DB (force reset)
npm run prisma:db:push:force

# Run migrations
npm run prisma:migrate:deploy

# Start API
npm run build && npm start
```

API will run on [http://localhost:3001/api](http://localhost:3001/api).

### With Docker

```bash
docker build -t nihil-user .
docker run -p 3001:3000 nihil-user
```

---

## Project Structure

```
user/
├── src/
│   ├── api/            # Express API, controllers, routes, validation
│   ├── application/    # Use cases & repository interfaces
│   ├── auth/           # JWT, CSRF, cookie handling
│   ├── core/           # Domain entities
│   ├── infrastructure/ # Prisma client, repositories
│   └── types/          # Type augmentation (e.g., Express Request)
├── scripts/            # Prisma wrapper (patch schema for native engines)
├── tests/              # Jest + Supertest integration tests
├── package.json
├── tsconfig.json
└── Dockerfile
```

---

## API Documentation

The service exposes a Swagger UI at `/api/docs` based on [`swagger.yaml`](src/api/swagger.yaml).

Main endpoints:

- `POST /auth/login` – Authenticate and receive access/refresh tokens
- `POST /auth/refresh` – Rotate refresh token, issue new access token
- `POST /auth/logout` – Clear refresh token cookie
- `GET /users` – List users (supports pagination/query)
- `POST /users` – Create a new user
- `GET/PUT/DELETE /users/{id}` – Retrieve, update, or delete a user
- `GET/POST/PUT /users/{id}/profile` – Manage user profile

---

## Testing

Run full test suite:

```bash
npm test
```

For CI mode (serial execution, pre-push hook):

```bash
npm run test:ci
```

Tests cover:

- User CRUD
- User Profile CRUD
- Authentication flow
- Validation (Zod schemas)

---

## Deployment

- **Docker:** Multi-stage Dockerfile builds a minimal production image.
- **CI/CD:** GitHub Actions pipeline runs migrations, builds, and tests against MySQL 8.3.
- **Production runtime:** `node dist/api/server.js` under a non-root user.

---

## Environment Variables

Create a `.env` file (see `.env.sample`):

```env
USER_DATABASE_URL=mysql://root:root@localhost:3306/app_db
FRONT_API_BASE_URL=http://localhost:5173
JWT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d
PORT=3001
```

---

## Contributing

We follow **conventional commits** and enforce branch naming rules.
Husky hooks ensure linting, tests, and commit message validation.

Steps:

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit using `npm run commit`
4. Push and open a PR

---

## License

This project is licensed under the ISC License.

<!-- ---

## Acknowledgements

* [Express](https://expressjs.com/)
* [Prisma](https://www.prisma.io/)
* [Zod](https://zod.dev/)
* [Pino](https://getpino.io/)
* [Swagger UI](https://swagger.io/tools/swagger-ui/) -->

---

## Contact

**Ange KOUAKOU**

- [Portfolio](https://ultime-portfolio.vercel.app/)
- [GitHub](https://github.com/Ange230700)
- [LinkedIn](https://www.linkedin.com/in/ange-kouakou/)
