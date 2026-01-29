# BACKEND KNOWLEDGE BASE

**Generated:** 2026-01-29
**Framework:** NestJS 11
**Database:** PostgreSQL (Prisma)

## OVERVIEW
Backend API server for Jitu. Built with NestJS 11, using Prisma for ORM and Better Auth for authentication.

## STRUCTURE
```
jitu-backend/
├── src/
│   ├── modules/       # Feature modules (Controller, Service, Entity)
│   ├── guards/        # Auth guards (e.g. JWT)
│   ├── decorators/    # Custom decorators (User, Roles)
│   └── lib/           # Shared utilities
├── prisma/            # Schema and migrations
└── test/              # E2E tests
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| **Feature Logic** | `src/modules/{feature}` | Controller/Service pattern |
| **Database Models** | `prisma/schema.prisma` | Single source of truth |
| **Auth Setup** | `src/modules/auth` | Better Auth config |
| **Admin Logic** | `src/modules/admin` | Complex multi-service module |
| **DTOs** | `src/modules/{feature}/dto` | Validation classes |

## CONVENTIONS
- **Modules**: Each feature (e.g., `exam`) has its own module, controller, and service.
- **DTOs**: Use `class-validator` in `dto/` folders for request validation.
- **Entities**: Define response shapes in `entities/`.
- **Prisma**: Use `PrismaService` (likely global or imported) for DB access.

## ANTI-PATTERNS
- **Raw SQL**: Avoid raw queries; use Prisma Client.
- **Fat Controllers**: Keep business logic in Services.
- **Circular Dependencies**: Watch out for cross-module imports; use forwardRef if needed.

## COMMANDS
```bash
npm run start:dev   # Watch mode
npm run build       # Build (includes prisma generate)
npx prisma studio   # UI for database
```
