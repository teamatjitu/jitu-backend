# ADMIN MODULE KNOWLEDGE BASE

**Generated:** 2026-01-29
**Type:** "God Module" / Aggregator

## OVERVIEW
The `admin` module is a complex feature module that handles administrative functions across various domains (users, payments, content). It aggregates multiple services.

## STRUCTURE
```
src/modules/admin/
├── admin.controller.ts  # Main entry point
├── admin.module.ts      # Module definition
├── services/            # Sub-services for specific domains
│   ├── admin.service.ts
│   ├── user.service.ts
│   ├── payment.service.ts
│   └── ...
└── dto/                 # Large collection of DTOs
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| **User Management** | `services/user.service.ts` | Admin actions on users |
| **Content Mgmt** | `services/question.service.ts` | Exam/Tryout content |
| **Finance** | `services/payment.service.ts` | Payment processing |
| **Validation** | `dto/*.dto.ts` | Input validation |

## CONVENTIONS
- **Service Segregation**: Although one module, logic is split into domain-specific services in `services/`.
- **Controller Delegation**: The controller delegates to specific services based on the route.

## ANTI-PATTERNS
- **Monolithic Service**: Do not add everything to `admin.service.ts`. Create a new service in `services/` if needed.
