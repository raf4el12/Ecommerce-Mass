# 🛒 Tiendas Mass — Plataforma E-commerce

Plataforma de comercio electrónico para **Tiendas Mass** (hard discount peruano), con tienda pública, carrito, checkout con MercadoPago y panel de administración. Rediseñada con el design system **"Barrio Moderno"** (Stitch).

> Monorepo con dos aplicaciones: **backend** (API REST) y **frontend** (SPA).

---

## ✨ Características

- **Catálogo** con filtro por categoría y subcategoría, búsqueda y modal de detalle.
- **Carrito** y **checkout** multi-paso con integración de **MercadoPago**.
- **Cuenta de usuario**: perfil, pedidos, direcciones y métodos de pago.
- **Localizador de tiendas** con datos reales.
- **Panel de administración**: productos, categorías, subcategorías, estados, métodos de pago, usuarios, roles/permisos, tiendas y reportes.
- **Autenticación** con JWT + verificación por OTP/email.
- Páginas legales (Términos, Privacidad, Libro de Reclamaciones).

---

## 🧰 Stack

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18, Vite, React Router, Tailwind CSS, Axios, SweetAlert2, lucide-react |
| **Backend** | Node.js, Express, TypeScript, TypeORM, JWT, Multer |
| **Base de datos** | MySQL 8.0 |
| **Pagos** | MercadoPago |

---

## 📋 Requisitos previos

- **Node.js** ≥ 18 (recomendado 20+)
- **npm**
- **MySQL 8.0** — local o vía **Docker** (incluido `docker-compose.yml`)
- Cuenta de **MercadoPago** (credenciales de prueba sirven)

---

## 🚀 Instalación

### 1) Clonar el repositorio

```bash
git clone https://github.com/raf4el12/TIENDAS_MASS_ADMIN.git
cd TIENDAS_MASS_ADMIN
```

### 2) Base de datos (MySQL)

**Opción A — Docker (recomendado):**

```bash
cd TiendasMassBack-main
docker compose up -d        # levanta MySQL 8.0 en el puerto 3306 (db: tiendasmass)
```

**Opción B — MySQL local:** crea una base de datos llamada `tiendasmass`.

### 3) Backend

```bash
cd TiendasMassBack-main
cp .env.example .env         # completa tus valores (BD, JWT, MercadoPago, email)
npm install
npm run seed                 # (opcional) carga datos de ejemplo: categorías, productos, etc.
npm run dev                  # API en http://localhost:5001
```

### 4) Frontend

```bash
cd TiendasMassFront-main
cp .env.example .env         # completa VITE_API_URL y la public key de MercadoPago
npm install
npm run dev                  # app en http://localhost:5173
```

Abre **http://localhost:5173** 🎉

---

## 🔐 Variables de entorno

### Backend (`TiendasMassBack-main/.env`)

| Variable | Descripción |
|----------|-------------|
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASS` / `DB_NAME` | Conexión MySQL |
| `PORT` | Puerto del API (por defecto `5001`) |
| `BASE_URL` | URL base del backend |
| `JWT_SECRET` | Secreto para firmar tokens |
| `MP_ACCESS_TOKEN` | Access token de MercadoPago |
| `MP_USE_SANDBOX` / `MP_BINARY_MODE` | Configuración de MercadoPago |
| `MP_SUCCESS_URL` / `MP_FAILURE_URL` / `MP_PENDING_URL` | URLs de retorno del pago |
| `EMAIL_USER` / `EMAIL_PASSWORD` | Credenciales para envío de correos (OTP) |

### Frontend (`TiendasMassFront-main/.env`)

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL del backend (ej. `http://localhost:5001`) |
| `VITE_MP_PUBLIC_KEY` | Public key de MercadoPago |

> ⚠️ Los archivos `.env` **no se versionan** (están en `.gitignore`). Usa los `.env.example` como plantilla y **nunca subas credenciales reales**.

---

## 📜 Scripts disponibles

### Backend

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor en modo desarrollo (hot-reload) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta la versión compilada |
| `npm run seed` | Carga datos de ejemplo en la BD |

### Frontend

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Build de producción |
| `npm run preview` | Previsualiza el build |
| `npm run lint` | Linter (ESLint) |
| `npm test` | Tests (Vitest) |

---

## 📁 Estructura

```
TIENDAS_MASS_ADMIN/
├── TiendasMassBack-main/        # API REST (Express + TypeORM)
│   ├── src/
│   │   ├── controllers/         # Lógica de endpoints
│   │   ├── services/            # Lógica de negocio
│   │   ├── entities/            # Modelos TypeORM
│   │   ├── routes/              # Rutas del API
│   │   ├── middlewares/         # Auth, validación, errores
│   │   ├── validators/          # Esquemas de validación
│   │   ├── scripts/             # seed y migraciones
│   │   └── public/uploads/      # Imágenes de productos
│   └── docker-compose.yml       # MySQL 8.0
│
└── TiendasMassFront-main/       # SPA (React + Vite + Tailwind)
    ├── src/
    │   ├── pages/               # Páginas públicas
    │   ├── components/          # Componentes (catálogo, checkout, perfil, ui…)
    │   ├── admin/               # Panel de administración
    │   ├── context/             # Contextos (usuario, carrito)
    │   └── styles/              # Estilos / design system
    └── tailwind.config.js       # Tokens del design system "Barrio Moderno"
```

---

## 🎨 Design System

La UI sigue el sistema **"Barrio Moderno"**: paleta **trust-blue** (`#0033A0`) + **mass-yellow** (`#FFD100`), tipografías **Plus Jakarta Sans** (titulares) e **Inter** (cuerpo), esquinas redondeadas generosas y sombras suaves. Los tokens viven en `TiendasMassFront-main/tailwind.config.js`.

---

## 📄 Licencia

Proyecto privado/educativo. Uso de marcas e imágenes de Tiendas Mass con fines demostrativos.
