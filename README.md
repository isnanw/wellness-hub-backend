# Wellness Hub Backend

Backend API untuk Wellness Hub menggunakan Bun, Hono, dan Drizzle ORM dengan PostgreSQL.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Hono](https://hono.dev/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Database**: PostgreSQL

## Prasyarat

- [Bun](https://bun.sh/) >= 1.0
- [PostgreSQL](https://www.postgresql.org/) >= 14

## Instalasi

1. **Install dependencies**
   ```bash
   bun install
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env
   ```

   Edit file `.env` dan sesuaikan dengan konfigurasi database Anda:
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/wellness_hub
   PORT=3000
   CORS_ORIGIN=http://localhost:8080
   ```

3. **Buat database**
   ```bash
   # Masuk ke PostgreSQL
   psql -U postgres

   # Buat database
   CREATE DATABASE wellness_hub;
   ```

4. **Generate migrations**
   ```bash
   bun run db:generate
   ```

5. **Jalankan migrations**
   ```bash
   bun run db:migrate
   ```

6. **Seed data (opsional)**
   ```bash
   bun run db:seed
   ```

## Menjalankan Server

**Development mode (dengan hot reload):**
```bash
bun run dev
```

**Production mode:**
```bash
bun run start
```

Server akan berjalan di `http://localhost:3000`

## Drizzle Studio

Untuk melihat dan mengelola database:
```bash
bun run db:studio
```

## API Endpoints

### Health Check
- `GET /` - Info API
- `GET /health` - Status kesehatan

### Users
- `GET /api/users` - Semua users
- `GET /api/users/:id` - User by ID
- `POST /api/users` - Buat user baru
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Hapus user

### Services
- `GET /api/services` - Semua layanan
- `GET /api/services/:id` - Layanan by ID
- `GET /api/services/slug/:slug` - Layanan by slug
- `POST /api/services` - Buat layanan baru
- `PUT /api/services/:id` - Update layanan
- `DELETE /api/services/:id` - Hapus layanan

### News
- `GET /api/news` - Semua berita
- `GET /api/news/published` - Berita yang sudah publish
- `GET /api/news/:id` - Berita by ID
- `GET /api/news/slug/:slug` - Berita by slug
- `POST /api/news` - Buat berita baru
- `PUT /api/news/:id` - Update berita
- `DELETE /api/news/:id` - Hapus berita

### Programs
- `GET /api/programs` - Semua program
- `GET /api/programs/active` - Program aktif
- `GET /api/programs/:id` - Program by ID
- `GET /api/programs/slug/:slug` - Program by slug
- `POST /api/programs` - Buat program baru
- `PUT /api/programs/:id` - Update program
- `DELETE /api/programs/:id` - Hapus program

### Registrations
- `GET /api/registrations` - Semua pendaftaran
- `GET /api/registrations/status/:status` - Pendaftaran by status
- `GET /api/registrations/:id` - Pendaftaran by ID
- `GET /api/registrations/check/:nik` - Cek pendaftaran by NIK
- `POST /api/registrations` - Buat pendaftaran baru
- `PUT /api/registrations/:id` - Update pendaftaran
- `PATCH /api/registrations/:id/status` - Update status
- `DELETE /api/registrations/:id` - Hapus pendaftaran

### Schedules
- `GET /api/schedules` - Semua jadwal
- `GET /api/schedules/upcoming` - Jadwal mendatang
- `GET /api/schedules/type/:type` - Jadwal by type
- `GET /api/schedules/status/:status` - Jadwal by status
- `GET /api/schedules/:id` - Jadwal by ID
- `POST /api/schedules` - Buat jadwal baru
- `PUT /api/schedules/:id` - Update jadwal
- `PATCH /api/schedules/:id/status` - Update status
- `PATCH /api/schedules/:id/register` - Daftar ke jadwal
- `DELETE /api/schedules/:id` - Hapus jadwal

## Struktur Folder

```
wellness-hub-backend/
├── src/
│   ├── db/
│   │   ├── index.ts      # Database connection
│   │   ├── schema.ts     # Drizzle schema
│   │   ├── migrate.ts    # Migration runner
│   │   └── seed.ts       # Data seeder
│   ├── routes/
│   │   ├── users.ts
│   │   ├── services.ts
│   │   ├── news.ts
│   │   ├── programs.ts
│   │   ├── registrations.ts
│   │   └── schedules.ts
│   └── index.ts          # Entry point
├── drizzle/              # Generated migrations
├── .env
├── .env.example
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

## License

MIT
