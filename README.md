
# CristinaCRM 🧪

CRM minimalista con **autenticación por Passkeys** (WebAuthn), backend en **Nuxt 4**, base de datos **Turso (SQLite)** y **Redis** para cache / rate-limit.  
100 % TypeScript, sin contraseñas, sin JWT, sin magia.

## Stack

| Capa         | Tecnología                                      |
|--------------|-------------------------------------------------|
| Frontend     | Nuxt 4 + Vue 3 + Tailwind 4                     |
| UI           | `@nuxt/ui` (componentes listos)                 |
| Backend      | Nitro (server/api)                              |
| DB           | Turso (SQLite libSQL)                           |
| Cache        | Redis 6+                                        |
| Auth         | `webauthn-server`                               |
| Tests        | Vitest + `@nuxt/test-utils` + Playwright        |
| Lint         | ESLint 9 flat config                            |

## Requisitos

- Node.js ≥ 20
- Bun ≥ 1.1 (recomendado)
- Redis 6+ (local o Docker)
- Turso CLI (solo si usas remoto)

## Quick start

```bash
git clone <repo>
cd xtnbox
bun install
cp .env.example .env          # edita según tu entorno
docker run -d -p 6379:6379 redis:7-alpine
bun run dev:db                # init-db + dev server
# abre http://localhost:3000
```

## Scripts

| Comando            | Descripción                            |
|--------------------|----------------------------------------|
| `bun run dev`       | Dev server HMR                         |
| `bun run dev:db`    | Inicializa DB y luego `dev`            |
| `bun run build`     | Build producción                       |
| `bun run preview`   | Serve el build                         |
| `bun test`          | Unit tests (Vitest)                    |
| `bun test:e2e`      | Playwright headless                    |
| `bun lint`          | ESLint flat                            |
| `bun typecheck`     | `vue-tsc --noEmit`                     |

## Variables de entorno

```env
NUXT_PUBLIC_ORIGIN=http://localhost:3000
TURSO_URL=file:./db/cristinacrm.db   # o libsql://xxx.turso.io
TURSO_TOKEN=                         # solo para remoto
REDIS_URL=redis://localhost:6379
AUDIT_LOG_PATH=./logs/audit.log
```

## Flujo Passkeys (sin contraseñas)

1. Usuario entra email + nombre → `/api/auth/register`  
2. Servidor genera challenge (60 s en Redis)  
3. Navegador crea credencial (TouchID, FaceID, Yubikey…)  
4. Se envía a `/api/auth/register/verify`  
5. Se crea usuario + credencial + sesión (cookie httpOnly 7 días)  
6. Login igual pero contra `/login/*`

## Testing

```bash
bun test        # rápidos, sin deps externas
bun run build
bun test:e2e    # Playwright
```

## Docker rápido

```yaml
# docker-compose.yml
version: "3.9"
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  app:
    build: .
    ports: ["3000:3000"]
    env_file: [.env]
    volumes: ["./db:/app/db"]
```

```dockerfile
# Dockerfile
FROM oven/bun:1.1-alpine
WORKDIR /app
COPY . .
RUN bun install --production
RUN bun run build
CMD ["bun", "run", "start"]
```

## Logs & auditoría

Todos los eventos críticos se escriben en `logs/audit.log` (rotación externa recomendada).

## Licencia

MIT — úsalo para lo que quieras.
