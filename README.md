# Sullair Francos

Sistema web para administrar los francos internos del personal, por sector.

Producción: https://sullair-francos.vercel.app

## Descripción

Se usa en el día a día para registrar y consultar los francos. Cada técnico pertenece a un sector, y cada movimiento (franco ganado o usado) queda guardado para poder revisarlo después.

## Roles

- **Administrador:** gestiona sectores, técnicos y usuarios.
- **Encargado:** trabaja con el personal de su sector.
- **Técnico:** consulta y registra lo suyo.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Backend | NestJS 10, TypeORM |
| Base de datos | PostgreSQL (Neon) |
| Autenticación | JWT, bcrypt |
| Hosting | Vercel (frontend), Render (backend) |

## Estructura

```
backend/             API
frontend/            aplicación web
docker-compose.yml   entorno local
DEPLOY.md            notas de deploy
```

## Desarrollo local

```bash
docker compose up --build
```

Frontend en `localhost:3001`, API en `localhost:3000`. Las credenciales del compose son solo para desarrollo.

Para correr cada parte por separado hace falta un Postgres propio y las variables de abajo (`backend/.env` y `frontend/.env.local`).

## Variables de entorno

Backend

| Variable | Descripción |
|---|---|
| `DB_host` `DB_port` `DB_database` `DB_username` `DB_password` | conexión a Postgres |
| `DB_ssl` | `true` para Neon |
| `JWT_SECRET` | secreto para firmar los tokens |
| `APP_port` | puerto de la API |

Frontend

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL del backend, sin barra final |

## Estado

En uso. Los cambios que entran a `main` se despliegan solos en Vercel y Render.
