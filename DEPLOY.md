# Guía de deploy — paso a paso

Esta guía asume que arrancás desde cero, con el `.tar.gz` que te bajaste y
nada más. Vas a necesitar cuentas (gratis) en tres servicios:

- **GitHub** → donde vive el código
- **Render** → donde corre el backend (NestJS) + la base Postgres
- **Vercel** → donde corre el frontend (Next.js)

Calculá unos 20-30 minutos la primera vez.

---

## 0. Extraer el proyecto

Descomprimí el archivo que te pasé donde quieras trabajar:

```bash
tar xzf sullair-francos.tar.gz
cd sullair
```

Te vas a encontrar con:

```
sullair/
  backend/         → API NestJS
  frontend/        → app Next.js
  docker-compose.yml
  README.md
```

No hace falta instalar nada localmente para deployar (Render y Vercel
instalan las dependencias ellos solos). Node.js solo lo necesitás si querés
probar algo en tu máquina antes de subirlo.

---

## 1. Subir el proyecto a GitHub

1. Andá a [github.com/new](https://github.com/new) y creá un repositorio
   nuevo. Nombre sugerido: `sullair-francos`. Dejalo público o privado, como
   prefieras. **No** marques "Add a README" (ya tenés uno).
2. En tu terminal, parado en la carpeta `sullair/`:

   ```bash
   git init
   git add .
   git commit -m "Primer commit: backend NestJS + frontend Next.js"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/sullair-francos.git
   git push -u origin main
   ```

   (Reemplazá `TU_USUARIO` por tu usuario de GitHub. Si te pide login, usá
   un [token de acceso personal](https://github.com/settings/tokens) como
   contraseña.)

3. Verificá en GitHub que se hayan subido las carpetas `backend/` y
   `frontend/` con todos sus archivos.

A partir de acá, backend y frontend se deployan **por separado**, cada uno
apuntando al mismo repo pero a una subcarpeta distinta.

---

## 2. Deploy del backend en Render

### 2.1 Crear la base de datos Postgres

1. Entrá a [dashboard.render.com](https://dashboard.render.com) y logueate
   (podés hacerlo con tu cuenta de GitHub directamente).
2. Click en **New +** (arriba a la derecha) → **PostgreSQL**.
3. Completá:
   - **Name**: `sullair-db` (o el nombre que quieras)
   - **Database**: `sullair_francos`
   - **Region**: la más cercana (ej. Ohio si estás en Argentina, suele ser
     la de menor latencia disponible en el plan free)
   - **Plan**: Free
4. Click en **Create Database**. Esperá 1-2 minutos a que quede lista
   (estado "Available").
5. Entrá a la base recién creada. En la sección **Connections** vas a ver:
   - `Hostname`
   - `Port` (normalmente `5432`)
   - `Database`
   - `Username`
   - `Password`

   **Dejá esta pestaña abierta**, vas a copiar estos datos en el paso
   siguiente.

### 2.2 Crear el Web Service del backend

1. Click en **New +** → **Web Service**.
2. Elegí **Build and deploy from a Git repository** → conectá tu cuenta de
   GitHub si no lo hiciste antes → seleccioná el repo `sullair-francos`.
3. Completá el formulario:
   - **Name**: `sullair-backend`
   - **Region**: la misma que usaste para la base
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Render debería detectar el `Dockerfile` solo y mostrar
     **Docker** como environment. Si te aparece un dropdown de "Runtime",
     elegí **Docker**.
   - **Instance Type**: Free
4. **Antes de crear el servicio**, bajá hasta **Environment Variables** y
   cargá estas (con los datos que copiaste en el paso 2.1):

   | Key            | Value                                                     |
   |----------------|------------------------------------------------------------|
   | `DB_database`  | el valor de `Database` de tu Postgres de Render             |
   | `DB_host`      | el valor de `Hostname` de tu Postgres de Render              |
   | `DB_port`      | el valor de `Port` (normalmente `5432`)                     |
   | `DB_username`  | el valor de `Username`                                      |
   | `DB_password`  | el valor de `Password`                                      |
   | `DB_ssl`       | `true`                                                       |
   | `JWT_SECRET`   | un texto largo y random (ver cómo generarlo abajo)           |

   Para generar el `JWT_SECRET`, corré en tu terminal:
   ```bash
   openssl rand -hex 32
   ```
   Si no tenés `openssl` a mano, cualquier texto largo y difícil de adivinar
   sirve (mínimo 32 caracteres, mezclando letras y números).

5. Click en **Create Web Service**. Render va a buildear la imagen Docker y
   levantar el backend — mirá la pestaña **Logs**, tarda entre 2 y 5 minutos
   la primera vez.
6. Cuando el log diga algo como `Nest application successfully started` y el
   estado pase a **Live**, copiá la URL que te asigna Render, arriba del
   todo de la página del servicio. Tiene esta forma:

   ```
   https://sullair-backend.onrender.com
   ```

   **Guardá esta URL**, la necesitás para el frontend.

### 2.3 Verificar que el backend funciona

Abrí en el navegador:

```
https://sullair-backend.onrender.com/auth/opciones
```

Tendrías que ver un JSON como:

```json
{"setupPendiente":true,"sectores":[],"tecnicos":[],"encargados":[],"admins":[]}
```

Si ves eso, el backend y la base están conectados correctamente. También
podés explorar todos los endpoints en Swagger:

```
https://sullair-backend.onrender.com/api
```

> **Nota sobre el plan free de Render**: el servicio se "duerme" tras 15
> minutos sin tráfico y tarda unos 30-50 segundos en despertar con el
> próximo pedido. Es normal que la primera carga del día tarde un poco.

---

## 3. Deploy del frontend en Vercel

1. Entrá a [vercel.com/new](https://vercel.com/new) y logueate (podés
   hacerlo con GitHub).
2. Click en **Import** al lado del repo `sullair-francos` (si no aparece,
   click en **Adjust GitHub App Permissions** y dale acceso al repo).
3. En la pantalla de configuración del proyecto:
   - **Framework Preset**: Vercel debería detectar **Next.js** solo.
   - **Root Directory**: click en **Edit** al lado de Root Directory y
     elegí la carpeta `frontend`.
4. Abrí la sección **Environment Variables** (en la misma pantalla) y
   cargá:

   | Name                   | Value                                          |
   |--------------------------|-----------------------------------------------|
   | `NEXT_PUBLIC_API_URL`    | la URL de Render del paso 2.2 (sin barra al final), ej: `https://sullair-backend.onrender.com` |

5. Click en **Deploy**. Tarda 1-2 minutos.
6. Cuando termine, Vercel te da una URL tipo:

   ```
   https://sullair-francos.vercel.app
   ```

   Esa es tu app ya funcionando en producción.

---

## 4. Primer uso

1. Entrá a la URL de Vercel.
2. Como todavía no hay ningún administrador cargado, te va a aparecer la
   pantalla **"Primer acceso"**. Completá tu nombre y una contraseña —
   esto crea el usuario admin y dos sectores por defecto ("Altura" y
   "Compresores").
3. Con la sesión de admin iniciada:
   - Pestaña **Sectores**: agregá o eliminá sectores según necesites.
   - Pestaña **Técnicos**: cargá los técnicos (nombre, sector, PIN
     opcional).
   - Pestaña **Usuarios**: cargá los encargados de cada sector y, si
     necesitás, otros administradores.
4. Desde ahí ya podés cerrar sesión y entrar como técnico o encargado
   eligiendo el rol correspondiente en la pantalla de login.

---

## 5. ¿Qué hacer si cambio el código?

Como quedó conectado a GitHub, cualquier `git push` a la rama `main`:

- dispara un **redeploy automático** en Render (backend) si tocaste algo
  dentro de `backend/`
- dispara un **redeploy automático** en Vercel (frontend) si tocaste algo
  dentro de `frontend/`

No hace falta volver a configurar nada, solo:

```bash
git add .
git commit -m "lo que cambiaste"
git push
```

---

## Problemas comunes

**El JSON de `/auth/opciones` no carga / da error de CORS en el navegador**
→ Revisá que `NEXT_PUBLIC_API_URL` en Vercel sea exactamente la URL de
Render, sin `/` al final y con `https://`.

**Render dice "Deploy failed" en el build del backend**
→ Andá a la pestaña **Logs** del Web Service y fijate el error. Lo más común
es una variable de entorno mal cargada (revisá que `DB_host`, `DB_username`,
etc. sean copia exacta de lo que muestra la base en **Connections**).

**El backend arranca pero `/auth/opciones` tira error 500**
→ Casi seguro `DB_ssl` no está en `true`. Render exige SSL para conexiones
externas a Postgres.

**Quiero resetear todo y volver a empezar (borrar admin, técnicos, etc.)**
→ En Render, entrá a tu base Postgres → pestaña **Shell** (o conectate con
`psql` usando los datos de **Connections**) y corré:
```sql
TRUNCATE movimientos, tecnicos, usuarios, sectores CASCADE;
```
Al volver a entrar a la app te va a pedir crear el admin de nuevo.

**Cambié el `JWT_SECRET` en Render**
→ Todas las sesiones activas quedan invalidadas (los usuarios van a tener
que volver a loguearse). Es normal y esperable.
