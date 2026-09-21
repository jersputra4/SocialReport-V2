# ReportHub — Full Stack Social Media Reporting System

Full-stack starter implementation for a web system that manages reports about social-media content/accounts.

## Stack

- Frontend: Next.js + TypeScript
- Backend: NestJS + TypeScript
- ORM: Prisma
- Database: PostgreSQL
- Object Storage: MinIO (S3-compatible)
- Authentication: JWT + bcrypt
- API documentation: Swagger
- Containerization: Docker Compose

## Roles

### Admin
Username: `admin`  
Password: `admin123`

### User
Username: `user`  
Password: `user123`

## Run with Docker

Requirements:

- Docker Desktop / Docker Engine
- Docker Compose

Run:

```bash
docker compose up --build
```

Services:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Swagger: http://localhost:4000/docs
- PostgreSQL: localhost:5432
- MinIO Console: http://localhost:9001
- MinIO API: http://localhost:9000

The backend automatically runs Prisma migrations/seed on startup.

## Run locally without Docker

### Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Important

This is a production-oriented foundation, not a claim that the system is production-ready without security review. Before public deployment, configure real secrets, HTTPS, backups, malware scanning for uploads, rate limits, email/notification providers, and production storage.
