# Deploy

El proyecto se despliega en tres lados:

- **Neon**: base de datos Postgres
- **Render**: backend (NestJS, con el Dockerfile de `backend/`)
- **Vercel**: frontend (Next.js)

Las dos plataformas están conectadas al repo. Un push a `main` redespliega solo lo que cambió: Render mira `backend/` y Vercel mira `frontend/`.

## Base de datos (Neon)

1. Crear un proyecto en Neon y una base.
2. En el panel de conexión, copiar host, base, usuario y contraseña.

Neon exige SSL, así que en el backend `DB_ssl` tiene que estar en `true`. En el plan gratuito la base se suspende cuando no se usa, y la primera consulta después de un rato tarda un poco más.

## Backend (Render)

Web Service nuevo, conectado al repo:

- Root Directory: `backend`
- Runtime: Docker
- Branch: `main`

Variables de entorno:

| Variable | Valor |
|---|---|
| `DB_host` | host de Neon |
| `DB_port` | `5432` |
| `DB_database` | nombre de la base |
| `DB_username` | usuario |
| `DB_password` | contraseña |
| `DB_ssl` | `true` |
| `JWT_SECRET` | texto largo y aleatorio (`openssl rand -hex 32`) |

Con el servicio en estado Live, copiar la URL que asigna Render.

El plan gratuito de Render duerme el servicio si no recibe tráfico, por lo que el primer pedido después de un rato puede tardar.

## Frontend (Vercel)

Proyecto nuevo, importando el mismo repo:

- Root Directory: `frontend`
- Framework: Next.js (lo detecta solo)

Variable de entorno:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL del backend en Render, sin barra al final |

Esta variable se toma en el build, así que si cambia hay que volver a desplegar el frontend.

## Si algo falla

- **El frontend no conecta con el backend:** revisar `NEXT_PUBLIC_API_URL` (con `https://` y sin `/` final) y redesplegar.
- **El backend no levanta:** mirar los logs en Render; casi siempre es una variable de la base mal copiada.
- **Error de conexión a la base:** confirmar que `DB_ssl` esté en `true`.
- **Después de cambiar `JWT_SECRET`:** se cierran todas las sesiones y hay que volver a iniciar sesión.
