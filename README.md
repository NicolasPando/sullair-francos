# Sullair · Gestión de Francos y Guardias

Reescritura del prototipo HTML (Firebase) en dos partes independientes, con la
misma estructura que usás en AgroManager:

- **backend/**: API REST en NestJS + TypeORM + PostgreSQL (auth con JWT, roles
  técnico / encargado / admin, bcrypt para passwords y PIN).
- **frontend/**: Next.js + TypeScript (App Router), consume la API por HTTP.

Mismas funciones que la página original: técnicos declaran francos generados
por trabajar un día libre, piden tomarse francos, registran guardias pasivas;
encargados aprueban/rechazan movimientos de su sector; admin gestiona
sectores, técnicos, encargados/admins, hace ajustes manuales de saldo y
exporta todo a CSV.

## Correr todo local con Docker

Necesitás Docker Desktop (o Docker Engine + docker compose) instalado. Desde
la raíz del proyecto:

```bash
docker compose up --build
```

Esto levanta:
- Postgres en `localhost:5432`
- Backend (NestJS) en `http://localhost:3000` (Swagger en `/api`)
- Frontend (Next.js) en `http://localhost:3001`

La primera vez que entrás al frontend te va a pedir crear el usuario admin
inicial (pantalla de "Primer acceso"). Desde ahí cargás sectores y técnicos.

## Correr sin Docker (como venís acostumbrado con AgroManager)

### Backend

```bash
cd backend
cp .env.example .env   # completá con tu Postgres local
npm install
npm run start:dev
```

Necesitás una base Postgres corriendo (local o en un contenedor suelto:
`docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16-alpine`).

Opcional, para tener datos de prueba (un admin, un sector, un técnico y un
encargado):

```bash
npm run seed
```

### Frontend

```bash
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:3000
npm install
npm run dev
```

## Deploy: Vercel (frontend) + Render (backend)

Subí el repo a tu GitHub (podés dejarlo como monorepo, cada plataforma te
deja apuntar a una subcarpeta).

### 1. Backend en Render

1. En Render, **New > PostgreSQL** → creá una base (plan free sirve para
   arrancar). Copiá el "Internal Database URL" o los datos sueltos
   (host, puerto, usuario, password, nombre de base) que te muestra Render.
2. **New > Web Service** → conectá tu repo → **Root Directory: `backend`**.
3. Render detecta el `Dockerfile` de `backend/` automáticamente (o elegís
   "Docker" como Environment si te lo pregunta).
4. Variables de entorno a cargar en Render (Settings → Environment):

   | Variable       | Valor                                              |
   |----------------|-----------------------------------------------------|
   | `DB_database`  | el nombre de la base que te dio Render               |
   | `DB_host`      | el host que te dio Render (termina en `.render.com` o similar) |
   | `DB_port`      | `5432`                                               |
   | `DB_username`  | el usuario que te dio Render                         |
   | `DB_password`  | el password que te dio Render                        |
   | `DB_ssl`       | `true` (Render exige SSL en la conexión externa)     |
   | `JWT_SECRET`   | un string largo y random, ej: generalo con `openssl rand -hex 32` |
   | `APP_port`     | `3000` (Render igual puede pisarlo con su propia variable `PORT`, el backend ya la respeta si existe) |

5. Deploy. Cuando termine, vas a tener una URL tipo
   `https://sullair-backend.onrender.com`. Probala entrando a
   `https://sullair-backend.onrender.com/api` (Swagger) y
   `https://sullair-backend.onrender.com/auth/opciones`.

### 2. Frontend en Vercel

1. En Vercel, **Add New > Project** → importá el mismo repo →
   **Root Directory: `frontend`**. Vercel detecta Next.js solo, no hace
   falta el Dockerfile ahí (ese Dockerfile queda para cuando quieras correr
   todo con `docker compose`).
2. Variable de entorno en Vercel (Settings → Environment Variables):

   | Variable               | Valor                                         |
   |-------------------------|-----------------------------------------------|
   | `NEXT_PUBLIC_API_URL`   | la URL de Render del paso anterior, sin barra final, ej: `https://sullair-backend.onrender.com` |

3. Deploy. Listo, `https://tu-proyecto.vercel.app` ya habla con el backend
   de Render.

### 3. Primer uso en producción

Entrá a la URL de Vercel: como todavía no hay admins, te va a aparecer la
pantalla de "Primer acceso" para crear el usuario administrador. A partir de
ahí cargás sectores, técnicos y encargados desde el panel de Admin.

## Variables de entorno (resumen)

**backend/.env**
```
DB_database=sullair_francos
DB_host=localhost
DB_port=5432
DB_username=postgres
DB_password=postgres
DB_ssl=false
JWT_SECRET=cambiame-por-un-secreto-largo
APP_port=3000
```

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Estructura (igual filosofía que AgroManager)

```
backend/src/
  auth/            login (técnico con PIN, encargado/admin con password), guards, JWT
  usuarios/        encargados y admins (entidad Usuario con rol)
  tecnicos/        entidad Tecnico + CRUD
  sectores/        entidad Sector + CRUD
  movimientos/     franco generado / consumido / guardia / ajuste, saldo, aprobar/rechazar, CSV
  entities/        entidades compartidas (Sector)
  configs/         configuración de TypeORM

frontend/
  app/             páginas: login (/), /tecnico, /encargado, /admin
  components/      Modal, Toast, MovimientoCard, SessionHeader
  lib/             cliente de API, tipos, manejo de sesión (JWT en localStorage)
```

Cada módulo del backend sigue el patrón `entity → repository → service →
controller → module` con decorators separados para Swagger/guards, igual que
en AgroManager, para que te resulte familiar.

## Sobre las contraseñas y el PIN

Se hashean con `bcryptjs` (versión pura en JS, sin compilación nativa — evita
problemas de build en Render). El login de técnico es opcional-con-PIN: si no
le cargás PIN a un técnico, entra solo eligiendo su nombre, igual que en el
HTML original.

## Próximos pasos posibles

- Migrar `synchronize: true` de TypeORM a migraciones reales antes de un uso
  más serio en producción.
- Vista de calendario (la del HTML original) — el backend ya tiene todos los
  datos (`guardiaDesde`/`guardiaHasta`/`fechaTrabajo`/`fechaDeseada`), falta
  el componente visual en el frontend.
- Notificaciones (mail o push) cuando un encargado aprueba/rechaza.
