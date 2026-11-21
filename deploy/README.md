# Deployment

Dokumen ini menjelaskan pola deploy generik. Detail domain, kredensial tunnel, token DNS, dan konfigurasi produksi harus diisi pada mesin deploy sendiri dan tidak disimpan di repository.

## Reverse proxy atau Cloudflare Tunnel

Server Express menyajikan API dan hasil build client (`client/dist`) dari satu origin. Arahkan reverse proxy atau tunnel ke port server yang dikonfigurasi (`PORT`, umumnya `4000` untuk lokal atau `4001` untuk produksi).

Untuk Cloudflare Tunnel:

1. Buat tunnel pada akun Cloudflare milik Anda.
2. Salin `cloudflared-config.example.yml` menjadi `cloudflared-config.yml`.
3. Isi tunnel ID, lokasi file kredensial, hostname, dan target service. File konfigurasi aktual di-ignore Git.
4. Buat record DNS hostname tersebut lewat dashboard Cloudflare.
5. Salin `env.production.example` ke `server/.env.production`, lalu isi secret dan konfigurasi sesuai server. Jangan commit file hasil salinan.

Jalankan dari root proyek:

```powershell
npm run build
powershell -ExecutionPolicy Bypass -File deploy\run.ps1
```

`run.ps1` memeriksa environment lokal lalu menjalankan server dan tunnel. Periksa endpoint `/api/health` di domain Anda setelah deploy. `db:push` tidak dijalankan otomatis: untuk database baru yang kosong, siapkan schema secara eksplisit; untuk database berisi data, backup database dan storage, periksa perubahan schema dan target `DATABASE_URL` terlebih dahulu.

## Data dan backup

Database SQLite berada di lokasi sesuai `DATABASE_URL` (default `server/prisma/dev.db`) dan file pengguna berada di `server/storage/`. Backup keduanya secara berkala ke lokasi privat di luar repository sebelum deploy atau perubahan skema.
