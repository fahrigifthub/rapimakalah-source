# RapiMakalah — Perintah Cepat

## Instalasi dari nol

```powershell
cd /path/to/rapimakalah
npm install
npm run install:all
Copy-Item server\.env.example server\.env       # lalu isi JWT_SECRET
npm run db:setup   # clone baru/database kosong saja
npm run dev
```

## Menjalankan produksi

```powershell
powershell -ExecutionPolicy Bypass -File deploy\run.ps1
# atau klik ganda: deploy\start.cmd
```

## Cek server hidup

```powershell
# lokal
curl http://localhost:4001/api/health

# publik
curl https://domain-anda.example/api/health
```

## Build client saja

```powershell
npm run build --prefix client
```

## Setup database + seed template

Hanya untuk database baru/kosong, atau setelah backup terverifikasi:

```powershell
npm --prefix server run db:push
npm --prefix server run db:seed
```

## Smoke test DOCX engine

```powershell
npm --prefix server run test:engine
```

## Stop server produksi (port 4001)

```powershell
Get-NetTCPConnection -LocalPort 4001 -State Listen | Stop-Process -Force
```

## Stop tunnel

```powershell
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
```

## Backup cepat (database + storage)

```powershell
$stamp = Get-Date -Format 'yyyy-MM-dd'
Compress-Archive -Path server\prisma\dev.db, server\storage -DestinationPath "backup\rapimakalah-data-$stamp.zip" -Force
```

## Restore

1. `Ctrl+C` (stop server + tunnel)
2. Ekstrak backup ke folder baru
3. `Copy-Item deploy\env.production.example server\.env.production` — isi `JWT_SECRET`
4. `npm install && npm run install:all`
5. Periksa schema dan `DATABASE_URL`; jangan `db:push` sebelum backup terverifikasi
6. `deploy\start.cmd`

## Deploy script (yang dijalankan otomatis)

| Script | Isi |
| --- | --- |
| `deploy/run.ps1` | Build client → node (port 4001) → cloudflared tunnel |
| `deploy/start.cmd` | Jalankan `run.ps1` (klik ganda) |
| Skrip DNS | Tidak disertakan; buat record DNS manual atau simpan skrip privat di mesin deploy |
| `deploy/env.production.example` | Template `.env.production` (PORT=4001, COOKIE_SECURE=true) |

## File sensitif (jangan di-commit / backup)

| File | Alasan |
| --- | --- |
| `server/.env` | secret pengembangan |
| `server/.env.production` | secret produksi (JWT, dll.) |
| `server/prisma/dev.db` | database lokal berisi data pengguna |
| `server/storage/` | file DOCX pengguna |

## Port yang dipakai

| Port | Fungsi |
| --- | --- |
| 4000 | Server pengembangan (dev mode) |
| 4001 | Server produksi (Express + client/dist) |
| 5173 | Vite dev server (hot reload) |
| 5432 | PostgreSQL (opsional, via Docker) |

## Template bawaan

| ID | Nama |
| --- | --- |
| 1 | Makalah |
| 2 | Laporan Praktikum |
| 3 | Proposal |
| 4 | Laporan PKL |
| 5 | Skripsi |

## Struktur URL utama

| URL | Fungsi |
| --- | --- |
| `/` | Landing page |
| `/register` | Registrasi |
| `/login` | Login |
| `/app` | Workspace utama (noindex) |
| `/app/documents` | Riwayat dokumen |
| `/app/templates` | Kelola template |
| `/app/writing` | Daftar draft workspace menulis |
| `/app/writing/<id>` | Editor makalah manual dan ekspor DOCX |
| `/app/admin` | Admin panel (khusus admin) |
| `/panduan` | Daftar panduan format |
| `/panduan/<slug>` | Artikel panduan |
| `/t/<kode>` | Halaman publik template dibagikan (noindex) |
| `/api/health` | Health check |
| `/sitemap.xml` | Sitemap |
| `/robots.txt` | Robots directive |
