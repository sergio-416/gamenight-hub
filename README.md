<div align="center">

# :game_die: GameNight Hub

**Organise. Discover. Play.**

A full-stack platform for board-game enthusiasts to organise game nights, manage personal collections, and discover events nearby.

[![CI/CD](https://img.shields.io/github/actions/workflow/status/sergio-416/gamenight-hub/ci-deploy.yml?branch=main&label=CI%2FCD&logo=github)](https://github.com/sergio-416/gamenight-hub/actions)
[![Angular](https://img.shields.io/badge/Angular-21-dd0031?logo=angular&logoColor=white)](https://angular.dev)
[![NestJS](https://img.shields.io/badge/NestJS-11-e0234e?logo=nestjs&logoColor=white)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169e1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Bun](https://img.shields.io/badge/Bun-1.3-fbf0df?logo=bun&logoColor=black)](https://bun.sh)
[![License](https://img.shields.io/badge/License-Private-grey)](#)

</div>

---

## Overview

GameNight Hub brings tabletop communities together. Create events with venue maps, RSVP tracking, and capacity limits. Build and share your board-game collection — powered by BoardGameGeek data. Track your progress through an XP and levelling system inspired by D&D 5e. Available in 7 languages.

---

## Key Features

| Feature              | Description                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------- |
| **Event Management** | Create, discover, and join game nights with date/time, venue, cover images, and category tags |
| **RSVP & Capacity**  | Join/leave events, capacity badges, participant avatars, waitlist-ready                       |
| **Game Collection**  | Import from BoardGameGeek, fuzzy search, expansion tracking, player-count filtering           |
| **Interactive Map**  | Leaflet-powered venue map with split-layout toggle and responsive mobile overlay              |
| **Calendar**         | Custom month-grid calendar with event pills, day-click filtering, and detail strip            |
| **XP & Levelling**   | Gamification engine — earn XP for adding games, creating events, and joining nights           |
| **Real-time**        | WebSocket notifications via Socket.IO                                                         |
| **PWA**              | Installable progressive web app with service worker                                           |
| **i18n**             | 7 languages — English, Spanish, Catalan, French, German, Portuguese, Italian                  |
| **Profile & Stats**  | Public profiles, play history, collection sharing, ApexCharts analytics                       |

---

## Tech Stack

### Frontend

| Technology                                          | Purpose                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------- |
| [Angular 21](https://angular.dev)                   | SPA framework — zoneless change detection, signals, standalone components |
| [Tailwind CSS 4](https://tailwindcss.com)           | Utility-first styling with PostCSS                                        |
| [Vite 8](https://vite.dev)                          | Dev server and production bundler                                         |
| [Transloco 8](https://jsverse.github.io/transloco/) | Lazy-loaded i18n with 11 translation scopes                               |
| [Leaflet](https://leafletjs.com)                    | Interactive maps for venue locations                                      |
| [ApexCharts](https://apexcharts.com)                | Data visualisation for stats and analytics                                |
| [FontAwesome](https://fontawesome.com)              | Icon library (brands, solid, regular)                                     |
| [Firebase SDK](https://firebase.google.com)         | Client-side authentication                                                |
| [Socket.IO Client](https://socket.io)               | Real-time event notifications                                             |

### Backend

| Technology                                                     | Purpose                                    |
| -------------------------------------------------------------- | ------------------------------------------ |
| [NestJS 11](https://nestjs.com)                                | Modular REST API with dependency injection |
| [Drizzle ORM v1](https://orm.drizzle.team)                     | Type-safe SQL with zero runtime overhead   |
| [PostgreSQL 18](https://www.postgresql.org)                    | Primary relational database                |
| [Redis 8](https://redis.io)                                    | Caching layer and pub/sub                  |
| [Firebase Admin](https://firebase.google.com/docs/admin/setup) | Server-side auth token verification        |
| [Swagger / OpenAPI](https://swagger.io)                        | Auto-generated API documentation           |
| [Socket.IO](https://socket.io)                                 | WebSocket server for real-time features    |
| [Resend](https://resend.com)                                   | Transactional email delivery               |
| [Pino](https://getpino.io)                                     | Structured JSON logging                    |
| [Helmet](https://helmetjs.github.io)                           | HTTP security headers                      |
| [Throttler](https://docs.nestjs.com/security/rate-limiting)    | Rate limiting                              |

### Shared

| Technology                                               | Purpose                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| [Zod 4](https://zod.dev)                                 | Runtime schema validation shared across frontend and backend |
| [Bun Workspaces](https://bun.sh/docs/install/workspaces) | Monorepo package management                                  |

### DevOps & Tooling

| Technology                                            | Purpose                                             |
| ----------------------------------------------------- | --------------------------------------------------- |
| [Bun 1.3](https://bun.sh)                             | Package manager and script runner                   |
| [Biome 2.4](https://biomejs.dev)                      | Linter + formatter (replaces ESLint + Prettier)     |
| [Vitest 4](https://vitest.dev)                        | Unit and integration testing (backend + frontend)   |
| [Playwright](https://playwright.dev)                  | End-to-end browser testing                          |
| [Testing Library](https://testing-library.com)        | DOM testing utilities for Angular components        |
| [TestContainers](https://testcontainers.com)          | Disposable PostgreSQL for backend integration tests |
| [SWC](https://swc.rs)                                 | Rust-based TypeScript compilation for backend       |
| [Docker Compose](https://docs.docker.com/compose/)    | Container orchestration (dev + production)          |
| [GitHub Actions](https://github.com/features/actions) | CI/CD pipeline — lint, test, build, deploy          |
| [Nginx](https://nginx.org)                            | Reverse proxy, SPA routing, SSL termination         |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         MONOREPO                            │
│  bun workspaces  ·  biome  ·  github actions                │
├──────────────┬──────────────┬───────────────────────────────┤
│   frontend/  │   backend/   │   packages/shared/            │
│   Angular 21 │   NestJS 11  │   Zod schemas                 │
│   Vite 8     │   Drizzle v1 │   Shared types                │
│   Tailwind 4 │   Socket.IO  │                               │
│   PWA        │   Pino       │                               │
├──────────────┴──────────────┴───────────────────────────────┤
│                     INFRASTRUCTURE                          │
│  Docker Compose  ·  Nginx  ·  Let's Encrypt  ·  VPS        │
├─────────────────┬───────────────────┬───────────────────────┤
│  PostgreSQL 18  │     Redis 8       │   Firebase Auth       │
│  Drizzle ORM    │   Cache + Pub/Sub │   Magic Links + SSO   │
└─────────────────┴───────────────────┴───────────────────────┘
```

### Monorepo Structure

```
GameNight_Hub/
├── frontend/           # Angular 21 SPA
│   └── src/app/
│       ├── core/       # Guards, interceptors, config
│       ├── features/   # auth, collection, events, calendar, stats, profile...
│       └── shared/     # Reusable components, models, services
├── backend/            # NestJS 11 REST API
│   └── src/
│       ├── modules/    # auth, events, games, locations, notifications, xp...
│       ├── database/   # Schema, migrations, seed
│       └── common/     # Filters, interceptors, utilities
├── packages/shared/    # Zod schemas + shared types
└── infrastructure/     # Nginx config, deployment scripts
```

---

## Prerequisites

| Requirement             | Version              |
| ----------------------- | -------------------- |
| Node.js                 | 24+                  |
| Bun                     | 1.3.10+              |
| Docker & Docker Compose | Latest               |
| Git                     | 2.x+                 |

> PostgreSQL and Redis run via Docker — no local installation needed.

---

## Getting Started

1. **Clone** the repository
2. **Install** dependencies with `bun install` at the root
3. **Start** the database and cache with `docker compose up -d`
4. **Run migrations** with `cd backend && bun run db:migrate`
5. **Seed** the database with `bun run db:seed`
6. **Start** the backend dev server with `bun run start:dev`
7. **Start** the frontend dev server with `cd frontend && ng serve`
8. Open **http://localhost:4200**

---

## Available Scripts

### Root (monorepo)

| Command          | Description                      |
| ---------------- | -------------------------------- |
| `bun run test`   | Run all backend + frontend tests |
| `bun run lint`   | Lint entire codebase (Biome)     |
| `bun run format` | Format entire codebase (Biome)   |

### Backend

| Command               | Description                                |
| --------------------- | ------------------------------------------ |
| `bun run start:dev`   | Start dev server (tsx)                     |
| `bun run test`        | Run unit tests (Vitest)                    |
| `bun run test:e2e`    | Run integration tests (TestContainers)     |
| `bun run test:cov`    | Generate coverage report                   |
| `bun run db:migrate`  | Apply database migrations                  |
| `bun run db:generate` | Generate new migration from schema changes |
| `bun run db:seed`     | Populate database with sample data         |
| `bun run db:studio`   | Open Drizzle Studio (visual DB browser)    |
| `bun run build`       | Compile TypeScript for production          |

### Frontend

| Command           | Description                               |
| ----------------- | ----------------------------------------- |
| `ng serve`        | Start Angular dev server (Vite)           |
| `ng test`         | Run unit tests (Vitest + Testing Library) |
| `ng build`        | Production build with AOT compilation     |
| `ng e2e`          | Run Playwright end-to-end tests           |
| `bun run test:ui` | Open Vitest UI dashboard                  |

---

## Testing

| Layer               | Runner     | Libraries                      | Command            |
| ------------------- | ---------- | ------------------------------ | ------------------ |
| Backend unit        | Vitest 4   | Supertest, NestJS Testing      | `bun run test`     |
| Backend integration | Vitest 4   | TestContainers (PostgreSQL 17) | `bun run test:e2e` |
| Frontend unit       | Vitest 4   | Testing Library, happy-dom     | `ng test`          |
| Frontend E2E        | Playwright | Chromium, Firefox, WebKit      | `bun run test:e2e` |

---

## Deployment

### Production Stack

| Component   | Image                        | Exposed        |
| ----------- | ---------------------------- | -------------- |
| Nginx       | `nginx:alpine`               | 80, 443        |
| Backend API | `node:25-alpine`             | Internal :3000 |
| PostgreSQL  | `postgres:18-alpine`         | Internal :5432 |
| Redis       | `redis:8-alpine`             | Internal :6379 |
| Frontend    | Static files served by Nginx | —              |

### CI/CD Pipeline

```
Push to main
    │
    ▼
┌─────────────────────────┐
│  GitHub Actions CI       │
│  ├─ Lint (Biome)        │
│  ├─ Backend tests       │
│  ├─ Frontend tests      │
│  └─ Build               │
└──────────┬──────────────┘
           │ all green
           ▼
┌─────────────────────────┐
│  Deploy (approval gate) │
│  ├─ Build & push image  │
│  ├─ SCP frontend dist   │
│  ├─ Run DB migrations   │
│  └─ Rolling restart     │
└─────────────────────────┘
```

### SSL & Security

- TLS 1.2/1.3 via Let's Encrypt with auto-renewal
- HTTP/2 enabled
- Security headers: HSTS, CSP, X-Frame-Options, Referrer-Policy
- Non-root container user (UID 1001)
- Health checks on all services
- Rate limiting via NestJS Throttler

---

## Internationalisation

| Language   | Code | Status             |
| ---------- | ---- | ------------------ |
| English    | `en` | Complete (default) |
| Spanish    | `es` | Placeholder        |
| Catalan    | `ca` | Placeholder        |
| French     | `fr` | Placeholder        |
| German     | `de` | Placeholder        |
| Portuguese | `pt` | Placeholder        |
| Italian    | `it` | Placeholder        |

11 translation scopes: shared, home, auth, game-nights, calendar, collection, profile, events, create-event, stats, feature-tour.

---

## Environment Variables

| Variable                | Required | Description                                       |
| ----------------------- | -------- | ------------------------------------------------- |
| `POSTGRES_URL`          | Yes      | PostgreSQL connection string                      |
| `FIREBASE_PROJECT_ID`   | Yes      | Firebase project identifier                       |
| `FIREBASE_CLIENT_EMAIL` | Yes      | Firebase service account email                    |
| `FIREBASE_PRIVATE_KEY`  | Yes      | Firebase service account private key              |
| `RESEND_API_KEY`        | Yes      | Resend API key for transactional email            |
| `REDIS_URL`             | No       | Redis connection string (caching + pub/sub)       |
| `FRONTEND_URL`          | No       | Frontend origin for CORS (default: localhost:4200)|
| `NODE_ENV`              | No       | `development`, `production`, or `test`            |
| `PORT`                  | No       | API port (default: 3000)                          |
| `EMAIL_FROM`            | No       | Sender email address (default: onboarding@resend.dev) |
| `BGG_API_TOKEN`         | No       | BoardGameGeek API token                           |
| `GOOGLE_GENAI_API_KEY`  | No       | Google Generative AI API key                      |
| `ENABLE_SWAGGER`        | No       | Set to `true` to enable Swagger UI at `/api/docs` |
| `REDIS_PASSWORD`        | Prod     | Redis authentication (production only)            |

---

<div align="center">

Built with :purple_heart: at IT Academy Barcelona

</div>
