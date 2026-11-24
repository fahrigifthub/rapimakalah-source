# MANUAL BOOK RAPIMAKALAH

**Panduan Instalasi, Penggunaan, dan Pemeliharaan Aplikasi Web Perapi Format Dokumen Akademik**

Versi aplikasi: 1.0.0
Situs: isi sesuai alamat deployment Anda


Disusun sebagai dokumentasi resmi penggunaan aplikasi.

Nama penyusun: ................................................
Institusi: ....................................................
Program studi: ...............................................
Tahun: 2026

> Catatan: RapiMakalah membantu memeriksa dan merapikan format dokumen, tetapi tidak menggantikan pemeriksaan akhir di Microsoft Word. Pratinjau di aplikasi bersifat struktural dan jumlah halaman merupakan estimasi.

---

## KATA PENGANTAR

RapiMakalah adalah aplikasi web untuk memeriksa dan merapikan format dokumen akademik berformat Microsoft Word (`.docx`), seperti makalah, laporan praktikum, proposal, laporan PKL, dan skripsi. Berbeda dari konverter biasa, RapiMakalah memodifikasi struktur OOXML di dalam file Word asli. Isi dokumen, tabel, gambar, hyperlink, dan catatan kaki tetap dipertahankan dan tetap dapat diedit di Microsoft Word.

Manual book ini disusun untuk tiga kelompok pembaca:

1. **Pengguna akhir (mahasiswa, asisten dosen, laboran)** yang ingin mengunggah dokumen, memeriksa format, menerapkan perbaikan, menulis makalah langsung di aplikasi, serta mengelola template dan akun.
2. **Pemilik atau operator aplikasi** yang memasang, menjalankan, memelihara, mencadangkan, dan memperbarui instalasi RapiMakalah.
3. **Penguji atau pengembang** yang perlu memahami alur, batasan, dan cara memverifikasi hasil pemrosesan.

Manual ini dibagi menjadi enam bab: pendahuluan, instalasi, panduan penggunaan, pemeliharaan dan pencadangan, pengujian, serta penutup. Lampiran berisi ringkasan API, daftar masalah umum, dan penjelasan arti status pemeriksaan.

Setiap kampus memiliki pedoman format yang dapat berbeda. Template bawaan pada aplikasi adalah titik awal berdasarkan format akademik yang umum dipakai di Indonesia, bukan klaim bahwa semua institusi memakai angka yang sama. Selalu cocokkan hasil akhir dengan pedoman resmi program studi Anda.

Kritik dan saran dapat disampaikan kepada pengelola aplikasi agar manual ini terus diperbarui mengikuti perkembangan fitur.

---

## DAFTAR ISI

1. BAB I PENDAHULUAN
   - 1.1 Deskripsi Program
   - 1.2 Tujuan dan Manfaat
   - 1.3 Sasaran Pengguna
   - 1.4 Fitur Utama
   - 1.5 Batasan yang Diketahui
   - 1.6 Teknologi yang Digunakan
   - 1.7 Struktur Proyek
   - 1.8 Peta Halaman Aplikasi
2. BAB II INSTALASI DAN KONFIGURASI
   - 2.1 Persyaratan Perangkat Keras
   - 2.2 Persyaratan Perangkat Lunak
   - 2.3 Instalasi Lokal
   - 2.4 Konfigurasi Environment
   - 2.5 Penyiapan Database
   - 2.6 Menjalankan Mode Pengembangan
   - 2.7 Build dan Menjalankan Mode Produksi
   - 2.8 Deploy di balik Cloudflare Tunnel
   - 2.9 Verifikasi dan Menghentikan Layanan
   - 2.10 Troubleshooting Instalasi
3. BAB III PANDUAN PENGGUNAAN
   - 3.1 Halaman Publik
   - 3.2 Membuat Akun dan Masuk
   - 3.3 Dashboard
   - 3.4 Membuat Dokumen Baru
   - 3.5 Mengenal Workspace Pemformatan
   - 3.6 Memilih Template dan Mengatur Aturan
   - 3.7 Mengisi Data Cover dan Logo
   - 3.8 Mengatur Tipografi, Kertas, Heading, dan Penomoran
   - 3.9 Memeriksa Format Dokumen
   - 3.10 Menerapkan Formatting
   - 3.11 Membandingkan dan Mengunduh Hasil
   - 3.12 Membatalkan Hasil dan Menghapus Dokumen
   - 3.13 Riwayat Dokumen
   - 3.14 Pustaka Template
   - 3.15 Membuat Template Kustom
   - 3.16 Berbagi, Menerbitkan, Mengimpor, dan Mencabut Template
   - 3.17 Workspace Menulis: Daftar Draft
   - 3.18 Workspace Menulis: Antarmuka Editor
   - 3.19 Workspace Menulis: Ribbon dan Perintah
   - 3.20 Workspace Menulis: Penggaris dan Jarak Paragraf
   - 3.21 Workspace Menulis: Navigasi, Pencarian, dan Daftar Isi
   - 3.22 Workspace Menulis: Gambar, Tabel, dan Pemisah Halaman
   - 3.23 Workspace Menulis: Penyimpanan dan Ekspor
   - 3.24 Mengimpor DOCX ke Workspace Menulis
   - 3.25 Pengaturan Akun dan Keamanan
   - 3.26 Keluar dari Aplikasi
   - 3.27 Admin Panel
4. BAB IV PEMELIHARAAN DAN PENCADANGAN
   - 4.1 Apa yang Perlu Dicadangkan
   - 4.2 Cara Mencadangkan
   - 4.3 Cara Memulihkan
   - 4.4 Memperbarui Aplikasi
   - 4.5 Pemantauan Rutin
   - 4.6 Keamanan Operasional
   - 4.7 SEO dan Visibilitas
5. BAB V PENGUJIAN
   - 5.1 Smoke Test Mesin DOCX
   - 5.2 Uji Alur Berbagi Template
   - 5.3 Checklist Pengguna
   - 5.4 Checklist Operator
6. BAB VI PENUTUP
7. DAFTAR PUSTAKA
8. LAMPIRAN A — RINGKASAN API
9. LAMPIRAN B — FAQ DAN MASALAH UMUM
10. LAMPIRAN C — ARTI STATUS PEMERIKSAAN
11. LAMPIRAN D — NILAI BAWAAN DAN BATAS INPUT

## DAFTAR TABEL

Tabel 1. Fitur utama dan lokasi penggunaannya
Tabel 2. Batasan aplikasi
Tabel 3. Teknologi per lapisan
Tabel 4. Struktur direktori proyek
Tabel 5. Peta halaman dan rute aplikasi
Tabel 6. Prasyarat perangkat lunak
Tabel 7. Variabel environment server
Tabel 8. Perintah npm yang tersedia
Tabel 9. Aturan formatting di panel workspace
Tabel 10. Kategori pemeriksaan format
Tabel 11. Tombol dan aksi di workspace pemformatan
Tabel 12. Tab ribbon workspace menulis
Tabel 13. Status dokumen di riwayat
Tabel 14. Status temuan pemeriksaan
Tabel 15. Nilai bawaan template
Tabel 16. Batas input panel workspace dan editor template

---

# BAB I PENDAHULUAN

## 1.1 Deskripsi Program

RapiMakalah adalah platform berbasis web untuk memeriksa dan merapikan format dokumen akademik. Pengguna mengunggah file Word (`.docx`) atau menempelkan teks, memilih template pedoman, menjalankan pemeriksaan, lalu menerapkan perbaikan. Hasilnya diunduh sebagai file `.docx` yang sudah rapi dan tetap dapat diedit di Microsoft Word.

Ada empat hal yang membedakan RapiMakalah dari konverter atau generator dokumen biasa:

1. **Mengedit file asli, bukan membangun ulang.** Aplikasi membuka paket OOXML (ZIP berisi XML), lalu memodifikasi `word/document.xml`, `styles.xml`, `numbering.xml`, `settings.xml`, dan bagian terkait. Tabel, gambar, hyperlink, dan footnote tidak dibangun ulang dari HTML.
2. **Aturan yang transparan.** Setiap temuan menyebut lokasi paragraf, nilai yang ditemukan, nilai yang diharapkan, dan rekomendasi. Pengguna memilih aturan mana yang diterapkan.
3. **Penomoran dan daftar isi nyata.** Penomoran halaman dibuat sebagai section break dan field `PAGE`; daftar isi dibuat sebagai field `TOC`, bukan teks statis. Keduanya dapat diperbarui di Word.
4. **Template yang dapat disesuaikan.** Tersedia template bawaan dan template kustom yang menyimpan seluruh konfigurasi pedoman, serta fitur berbagi template melalui kode 8 karakter.

Aplikasi juga menyediakan workspace menulis mandiri. Pengguna dapat membuat draft, menulis langsung dari ponsel atau laptop, menyimpan otomatis ke akun, dan mengekspor hasilnya sebagai DOCX.

## 1.2 Tujuan dan Manfaat

Tujuan pengembangan RapiMakalah:

1. Mempercepat perapian format dokumen akademik tanpa mengatur margin, font, dan spasi satu per satu.
2. Menjelaskan temuan format secara terbuka sehingga pengguna belajar dari kesalahannya.
3. Menyediakan template pedoman yang dapat disesuaikan dengan aturan kampus.
4. Mempertahankan isi dokumen asli ketika formatting diterapkan.
5. Menyediakan tempat menulis makalah langsung di browser, dengan ekspor ke Word.
6. Menyimpan riwayat dokumen, hasil formatting, dan template di akun pengguna.

| Tujuan | Manfaat bagi pengguna |
| --- | --- |
| Menyeragamkan format | Margin, font, spasi, indentasi, dan heading konsisten dalam satu langkah |
| Mengurangi kesalahan penomoran | Cover tanpa nomor, bagian awal Romawi kecil, bagian isi Arab mulai 1 |
| Mengotomatiskan daftar isi | Field TOC diisi perkiraan nomor halaman dan dapat diperbarui di Word |
| Menjelaskan temuan | Pengguna melihat nilai ditemukan, nilai diharapkan, dan saran perbaikan |
| Menyimpan riwayat | File asli tetap tersimpan; hasil dapat dibandingkan, diunduh ulang, atau dibatalkan |
| Menyediakan editor | Makalah dapat ditulis dari HP tanpa aplikasi tambahan |

## 1.3 Sasaran Pengguna

- **Mahasiswa** yang menyusun makalah, laporan praktikum, proposal, laporan PKL, dan skripsi.
- **Asisten dosen, laboran, atau pembimbing** yang sering merapikan format dokumen mahasiswa.
- **Pemilik atau operator aplikasi** yang memasang, menjalankan, mencadangkan, dan memelihara instalasi.
- **Administrator** yang memantau statistik penggunaan dan mengelola akun pengguna.

## 1.4 Fitur Utama

Tabel 1. Fitur utama dan lokasi penggunaannya

| Kelompok | Fitur | Lokasi |
| --- | --- | --- |
| Publik | Halaman penjelasan produk, alur kerja, keamanan, dan tautan panduan | `/` |
| Publik | Delapan artikel panduan format makalah dan skripsi | `/panduan` |
| Publik | Halaman template yang dibagikan melalui tautan | `/t/<kode>` |
| Akun | Registrasi, login, sesi cookie httpOnly | `/register`, `/login` |
| Dashboard | Statistik dokumen, temuan, halaman, kata, dokumen terakhir, aktivitas | `/app` |
| Input | Unggah DOCX maksimum 20 MB dengan validasi OOXML | `/app/documents/new` |
| Input | Membuat dokumen dari teks atau Markdown yang ditempel | `/app/documents/new` |
| Pemeriksa | Analisis font, ukuran, spasi, indentasi, perataan, heading, margin, halaman kosong, keterangan | Workspace tab Pemeriksaan |
| Format | Margin, tipografi, heading, jarak paragraf, penomoran, daftar isi, cover, kata pengantar | Workspace tab Formatting |
| Pratinjau | Tampilan asli dan hasil, perbandingan berdampingan, navigasi halaman dan outline | Workspace |
| Unduh | Unduh file hasil atau file asli dengan nama yang dapat diubah | Workspace dan Riwayat |
| Riwayat | Pencarian, filter status, pagination, unduh ulang, hapus | `/app/documents` |
| Template | Pustaka template, duplikasi, editor konfigurasi, pemakaian langsung | `/app/templates` |
| Berbagi | Kode 8 karakter, tautan publik, impor salinan identik, pencabutan tautan | `/app/templates`, `/t/<kode>` |
| Menulis | Draft, autosave, Heading 1–3, format teks, tabel, gambar, penggaris, daftar isi editor | `/app/writing` |
| Ekspor | Unduh draft sebagai DOCX A4, Times New Roman 12 pt, spasi 1,5 | `/app/writing/:id` |
| Akun | Profil, institusi, program studi, ganti password, hapus akun | `/app/settings` |
| Admin | Statistik penggunaan, daftar pengguna, reset password, hapus akun | `/app/admin` |

## 1.5 Batasan yang Diketahui

Tabel 2. Batasan aplikasi

| No | Batasan |
| --- | --- |
| 1 | Hanya memproses `.docx`. File `.doc`, PDF, DOCX rusak, atau DOCX terenkripsi ditolak. |
| 2 | Pratinjau adalah render struktural, bukan mesin layout Word. Pagination dan nomor halaman final ditentukan Word. |
| 3 | Nomor halaman pada daftar isi hasil aplikasi adalah estimasi sampai Word memperbarui field TOC. |
| 4 | Tabel kompleks, text box, dan shape dapat tampil sederhana pada pratinjau. |
| 5 | Heuristik cover dan batas bagian awal/isi dapat perlu penyesuaian pada struktur dokumen yang tidak umum. |
| 6 | Workspace menulis menerima gambar PNG/JPG maksimum 700 KB per gambar. |
| 7 | Ukuran draft menulis dibatasi oleh batas JSON API 2 MB; klien menolak draft yang melewati sekitar 1,8 MB. |
| 8 | Impor Word ke editor menolak isi HTML di atas 1,5 MB; daftar isi Word dibuka sebagai teks statis. |
| 9 | Editor menulis tidak menyediakan komentar, track changes, tab stop, atau pengubahan margin halaman langsung. |
| 10 | Template bawaan bersifat baca-saja dan tidak dapat dibagikan. |
| 11 | Hanya template bawaan **Makalah** yang ditampilkan di pustaka dan pilihan workspace saat ini. Template bawaan lain tetap tersimpan agar dokumen lama dapat dibuka. |
| 12 | Preview perubahan pengaturan bersifat pratinjau; file hasil baru tersimpan setelah tombol **Terapkan formatting** dijalankan. |

## 1.6 Teknologi yang Digunakan

Tabel 3. Teknologi per lapisan

| Lapisan | Teknologi |
| --- | --- |
| Frontend | React 18, Vite, React Router, Tailwind CSS, Lucide Icons |
| Editor menulis | Tiptap / ProseMirror, ekstensi kustom untuk tabel, gambar, penggaris, dan pagination |
| Backend | Node.js 20+, Express, Zod, JWT (cookie httpOnly), bcryptjs |
| Database | Prisma ORM; SQLite untuk lokal, varian PostgreSQL disediakan |
| DOCX | JSZip dan pemrosesan OOXML langsung tanpa LibreOffice |
| Upload | Multer memory storage, validasi magic bytes, batas ukuran |
| Rumus | LaTeX sederhana menjadi OMML untuk Word, OMML menjadi MathML untuk pratinjau |
| Pratinjau sumber | docx-preview untuk menampilkan file Word asli di editor menulis |
| Deploy | Satu origin Express dan Cloudflare Tunnel (`cloudflared`) |

## 1.7 Struktur Proyek

Tabel 4. Struktur direktori proyek

| Direktori atau berkas | Keterangan |
| --- | --- |
| `client/` | Frontend React dan Vite |
| `client/src/pages/` | Halaman landing, dashboard, workspace, riwayat, template, pengaturan, admin |
| `client/src/components/` | Komponen UI, workspace, preview, editor menulis |
| `client/src/content/guides.js` | Konten delapan artikel panduan yang dipakai klien dan server |
| `client/dist/` | Hasil build frontend yang disajikan Express pada mode produksi |
| `server/src/routes/` | Endpoint API: auth, account, documents, templates, share, writing, dashboard, admin |
| `server/src/docx/` | Reader, checker, format, numbering, TOC, preview, ekspor menulis, impor Word |
| `server/prisma/schema.prisma` | Skema database SQLite |
| `server/prisma/dev.db` | Database lokal |
| `server/prisma/seed.js` | Lima template bawaan |
| `server/storage/<userId>/` | File DOCX asli dan hasil per pengguna |
| `server/storage/writing/<userId>/` | Draft menulis (`<draftId>.json`) dan file Word asli impor |
| `deploy/` | Skrip dan konfigurasi Cloudflare Tunnel |
| `docs/` | Dokumentasi desain dan manual book |
| `package.json` | Script instalasi, development, build, dan start |

## 1.8 Peta Halaman Aplikasi

Tabel 5. Peta halaman dan rute aplikasi

| Rute | Akses | Fungsi |
| --- | --- | --- |
| `/` | Publik | Halaman utama dan penjelasan produk |
| `/panduan` | Publik | Indeks artikel panduan format |
| `/panduan/<slug>` | Publik | Artikel panduan |
| `/galeri` | Publik | Galeri template yang diterbitkan pengguna |
| `/login` | Publik | Masuk ke akun |
| `/register` | Publik | Membuat akun |
| `/t/<shareId>` | Publik | Melihat template yang dibagikan |
| `/app` | Login | Dashboard |
| `/app/documents` | Login | Riwayat dokumen |
| `/app/documents/new` | Login | Membuat dokumen baru |
| `/app/documents/<id>` | Login | Workspace pemformatan |
| `/app/writing` | Login | Daftar draft menulis |
| `/app/writing/<id>` | Login | Editor menulis |
| `/app/templates` | Login | Pustaka template |
| `/app/templates/new` | Login | Membuat template kustom |
| `/app/templates/<id>` | Login | Editor template |
| `/app/settings` | Login | Pengaturan akun |
| `/app/admin` | Login sebagai admin | Panel administrator |

Alur kerja utama pengguna:

1. Membuat akun atau masuk.
2. Mengunggah DOCX atau menempel teks pada halaman dokumen baru.
3. Memilih template, mengisi data cover, dan mengaktifkan aturan yang diinginkan.
4. Memeriksa temuan pada tab Pemeriksaan.
5. Menjalankan **Terapkan formatting**, membandingkan asli dan hasil, lalu mengunduh DOCX.
6. Membuka hasil di Microsoft Word dan memperbarui field daftar isi bila diperlukan.

---

# BAB II INSTALASI DAN KONFIGURASI

## 2.1 Persyaratan Perangkat Keras

Kebutuhan minimum yang disarankan untuk penggunaan lokal:

- Prosesor dua inti atau lebih.
- RAM minimal 4 GB; 8 GB lebih nyaman saat membuka banyak dokumen.
- Ruang penyimpanan minimal 2 GB untuk dependency, database, dan file pengguna.
- Koneksi internet untuk mengunduh dependency.
- Ruang tambahan untuk file DOCX pengguna, rata-rata 1–2 MB per dokumen.

Untuk server produksi, sediakan RAM minimal 1 GB khusus aplikasi, penyimpanan sesuai jumlah dokumen, serta koneksi yang stabil. Server harus menyala selama situs digunakan.

## 2.2 Persyaratan Perangkat Lunak

Tabel 6. Prasyarat perangkat lunak

| Perangkat lunak | Versi | Keterangan |
| --- | --- | --- |
| Node.js | 20 atau lebih baru | Wajib; cek dengan `node -v` |
| npm | 10 atau lebih baru | Ikut terpasang bersama Node.js |
| Browser modern | Chrome, Edge, Firefox, atau Safari terbaru | Untuk mengakses aplikasi |
| Git | Opsional | Mengambil atau memperbarui source code |
| PostgreSQL | Opsional | Bila tidak memakai SQLite |
| Docker | Opsional | Menjalankan PostgreSQL melalui `docker-compose.yml` |
| cloudflared | Terbaru | Hanya untuk deploy melalui Cloudflare Tunnel |

Jika eksekusi skrip npm diblokir PowerShell, jalankan sekali untuk sesi tersebut:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

## 2.3 Instalasi Lokal

1. Buka PowerShell dan masuk ke folder proyek.

```powershell
cd /path/to/rapimakalah
```

2. Pasang dependency root, server, dan client.

```powershell
npm install
npm run install:all
```

3. Salin konfigurasi environment server.

```powershell
Copy-Item server\.env.example server\.env
```

4. Buka `server\.env`, lalu ganti `JWT_SECRET` dengan string acak panjang (minimal 32 karakter). Contoh membuat nilai acak:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

5. Pada clone baru dengan database lokal kosong, siapkan schema dan template bawaan.

```powershell
npm run db:setup
```

Perintah tersebut menjalankan `prisma db push` lalu `prisma/seed.js` untuk mengisi lima template bawaan. Jangan gunakan pada database berisi data sebelum backup terverifikasi dan rencana perubahan schema diperiksa. `npm run setup` hanya memasang dependency.

6. Jalankan mode pengembangan.

```powershell
npm run dev
```

7. Buka browser pada `http://localhost:5173`. API berjalan pada `http://localhost:4000`, dan Vite meneruskan permintaan `/api` ke backend.

## 2.4 Konfigurasi Environment

Konfigurasi pengembangan berada di `server/.env`. Konfigurasi produksi berada di `server/.env.production`.

Tabel 7. Variabel environment server

| Variabel | Nilai umum | Keterangan |
| --- | --- | --- |
| `PORT` | `4000` | Port API dan Express. Produksi proyek ini memakai `4001` |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Origin yang diizinkan CORS |
| `CANONICAL_URL` | sama dengan `CLIENT_ORIGIN` | URL publik untuk canonical, Open Graph, dan JSON-LD (tanpa `/` di akhir) |
| `JWT_SECRET` | string acak | Wajib diganti; dipakai menandatangani sesi |
| `DATABASE_URL` | `file:./dev.db` | Path SQLite atau URL PostgreSQL |
| `STORAGE_DIR` | `./storage` | Direktori file, relatif terhadap folder `server/` |
| `MAX_UPLOAD_MB` | `20` | Batas ukuran upload dokumen |
| `COOKIE_SECURE` | `false` | Harus `true` bila aplikasi diakses melalui HTTPS |
| `NODE_ENV` | `production` | Diisi pada server produksi |

Jangan membagikan file `.env` atau `.env.production`, dan jangan menyimpan `JWT_SECRET` di dalam repositori publik.

## 2.5 Penyiapan Database

### 2.5.1 SQLite (bawaan)

Hanya untuk database baru/kosong atau setelah backup terverifikasi:

```powershell
npm --prefix server run db:push
npm --prefix server run db:seed
```

Database tersimpan di `server/prisma/dev.db`; file pengguna tersimpan di `server/storage/<userId>/`. Cara ini cukup untuk pengembangan dan instalasi kecil.

### 2.5.2 PostgreSQL (opsional)

1. Jalankan PostgreSQL, misalnya melalui Docker:

```powershell
docker compose up -d db
```

2. Simpan skema SQLite, lalu gunakan skema PostgreSQL:

```powershell
Copy-Item server\prisma\schema.prisma server\prisma\schema.sqlite.prisma.bak
Copy-Item server\prisma\schema.postgres.prisma server\prisma\schema.prisma
```

3. Ubah `DATABASE_URL` di `server/.env`:

```env
DATABASE_URL="postgresql://paperly:paperly_dev_password@localhost:5432/paperly?schema=public"
```

4. Generate Prisma Client, dorong skema, lalu seed:

```powershell
npm --prefix server run prisma:generate
npm --prefix server run db:push
npm --prefix server run db:seed
```

Untuk kembali ke SQLite, pulihkan `schema.sqlite.prisma.bak` menjadi `schema.prisma`, set `DATABASE_URL="file:./dev.db"`, lalu jalankan `db:push` dan `db:seed`.

> Proyek memakai `prisma db push`, yang cocok untuk pengembangan. Untuk produksi jangka panjang, buat migrasi dengan `prisma migrate deploy`.

## 2.6 Menjalankan Mode Pengembangan

Tabel 8. Perintah npm yang tersedia

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan server (port 4000) dan Vite (5173) sekaligus |
| `npm --prefix server run dev` | Menjalankan backend saja dengan `node --watch` |
| `npm --prefix client run dev` | Menjalankan frontend saja |
| `npm run setup` | Memasang dependency saja, tanpa migrasi database |
| `npm run db:setup` | Menjalankan `db push` dan seed template; hanya database lokal baru/kosong |
| `npm run build` | Build frontend ke `client/dist` |
| `npm start` | Menjalankan server produksi yang menyajikan `client/dist` |
| `npm --prefix server run test:engine` | Smoke test mesin DOCX |

Alamat yang umum dipakai:

- Frontend Vite: `http://localhost:5173`
- API: `http://localhost:4000`
- Health check: `http://localhost:4000/api/health`

## 2.7 Build dan Menjalankan Mode Produksi

```powershell
npm run build
npm start
```

Server menyajikan API dan hasil build frontend dalam satu origin. Karena itu deploy cukup memakai satu domain dan satu tunnel.

Sebelum menjalankan mode produksi, pastikan:

- `server/.env.production` sudah dibuat.
- `JWT_SECRET` sudah diisi nilai acak, bukan placeholder.
- `CLIENT_ORIGIN` menunjuk domain HTTPS yang dipakai.
- `COOKIE_SECURE=true` bila memakai HTTPS.
- Port yang dipakai tidak bentrok dengan proses lain.

## 2.8 Deploy di balik Cloudflare Tunnel (opsional)

Arsitektur contoh: Express pada port yang dikonfigurasi diteruskan melalui reverse proxy atau Cloudflare Tunnel ke domain deployment Anda. Kredensial dan konfigurasi lokal tidak disimpan di repository.

### 2.8.1 Berkas Deploy

| Berkas | Fungsi |
| --- | --- |
| `deploy/cloudflared-config.example.yml` | Template tunnel generik; salin ke file lokal yang di-ignore Git |
| `deploy/run.ps1` | Build client, menjalankan server dan tunnel; tidak memigrasikan database otomatis |
| `deploy/start.cmd` | Menjalankan `run.ps1` dengan klik dua kali |
| DNS | Buat record melalui dashboard provider domain Anda |
| `deploy/env.production.example` | Contoh isi `server/.env.production` |
| `server/.env.production` | Konfigurasi produksi lokal; jangan commit (gunakan file contoh sebagai dasar) |

### 2.8.2 Prasyarat Domain

1. Domain terdaftar dan DNS-nya dikelola provider pilihan Anda.
2. Untuk Cloudflare Tunnel, buat tunnel pada akun Anda dan simpan kredensialnya hanya pada mesin deploy.
3. Salin file contoh konfigurasi lokal dan buat record DNS tunnel melalui dashboard provider:

| Type | Name | Target | Proxy |
| --- | --- | --- | --- |
| CNAME | `@` | `<tunnel-id>.cfargotunnel.com` | Proxied (oranye) |
| CNAME | `www` | `<tunnel-id>.cfargotunnel.com` | Proxied (oranye) |

Salin `deploy/cloudflared-config.example.yml` menjadi `deploy/cloudflared-config.yml`, lalu isi tunnel ID, path kredensial, hostname, dan service milik Anda. Buat record DNS tunnel melalui dashboard Cloudflare.

### 2.8.3 Menyiapkan Konfigurasi Produksi

```powershell
Copy-Item deploy\env.production.example server\.env.production
```

Isi `server/.env.production` seperti contoh berikut:

```env
NODE_ENV=production
PORT=4001
CLIENT_ORIGIN=https://domain-anda.example
CANONICAL_URL=https://domain-anda.example
COOKIE_SECURE=true
JWT_SECRET=<hasil generate acak>
DATABASE_URL="file:./dev.db"
STORAGE_DIR=./storage
MAX_UPLOAD_MB=20
```

Port 4001 dipakai agar tidak bentrok dengan server pengembangan pada port 4000.

### 2.8.4 Menjalankan Situs

Atur `CANONICAL_URL` sama dengan origin HTTPS publik tanpa slash akhir. Server memakai nilai ini untuk metadata SEO dan mengganti placeholder domain pada `robots.txt` serta `sitemap.xml`.

```powershell
powershell -ExecutionPolicy Bypass -File deploy\run.ps1
```

Atau klik dua kali `deploy\start.cmd`.

Skrip akan:

1. Memeriksa keberadaan `.env.production` dan konfigurasi tunnel.
2. Menolak berjalan bila `JWT_SECRET` masih berisi `GANTI_DENGAN`.
3. Melakukan build frontend.
4. Menjalankan server Express dengan environment produksi.
5. Menjalankan `cloudflared tunnel` sesuai konfigurasi.

> Deploy tidak menjalankan migrasi database otomatis. Backup database dan storage, periksa perubahan schema dan target `DATABASE_URL`, lalu jalankan migrasi secara eksplisit.

Jendela PowerShell harus tetap terbuka selama situs digunakan. Menutup jendela atau menekan `Ctrl+C` akan menghentikan server dan tunnel.

### 2.8.5 HTTPS

1. Aktifkan sertifikat TLS pada provider atau reverse proxy.
2. Wajibkan HTTPS untuk domain aplikasi.
3. Karena `COOKIE_SECURE=true`, login hanya berfungsi melalui HTTPS.

### 2.8.6 Menjalankan Otomatis Saat Boot (opsional)

1. Jalankan tunnel sebagai service sesuai dokumentasi provider tunnel Anda.
2. Jalankan server dengan process manager/service yang memakai working directory `server` pada clone proyek dan environment produksi yang aman.

## 2.9 Verifikasi dan Menghentikan Layanan

Periksa API publik:

```powershell
curl.exe https://domain-anda.example/api/health
```

Respons yang diharapkan:

```json
{ "ok": true, "service": "paperly", "time": "2026-11-19T00:00:00.000Z" }
```

Cek juga halaman utama, `robots.txt`, dan `sitemap.xml`.

Untuk memeriksa server lokal produksi:

```powershell
curl.exe http://localhost:4001/api/health
```

Menghentikan server yang menempati port 4001:

```powershell
Get-NetTCPConnection -LocalPort 4001 -State Listen | Stop-Process -Force
```

Menghentikan Cloudflare Tunnel:

```powershell
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
```

## 2.10 Troubleshooting Instalasi

| Gejala | Penyebab umum | Solusi |
| --- | --- | --- |
| `EADDRINUSE :4000` | Server pengembangan sudah berjalan | Hentikan proses lama atau ganti port |
| Halaman Vite tidak tampil | Dependency belum lengkap atau server error | Jalankan `npm run install:all`, cek terminal |
| Login berhasil tetapi sesi hilang | Diakses lewat HTTP saat `COOKIE_SECURE=true` | Buka melalui HTTPS |
| `502 Bad Gateway` di domain | Server atau tunnel belum siap | Tunggu build, cek `/api/health` |
| `ERR_TOO_MANY_REDIRECTS` | Redirect ganda Cloudflare dan origin | Matikan redirect HTTP ke HTTPS di origin |
| Situs tidak terjangkau padahal server hidup | Cache DNS perangkat | Flush DNS atau ganti DNS ke 1.1.1.1 |
| `P1001` saat `db:push` | Database PostgreSQL belum siap | Jalankan database, periksa `DATABASE_URL` |
| Prisma memperingatkan potensi kehilangan data | Perubahan schema dapat mengubah atau menghapus data | Berhenti, buat backup terverifikasi, dan rencanakan migrasi; jangan memakai `--accept-data-loss` tanpa memahami dampaknya |
| Template baru tidak memakai field terbaru | Template dibuat sebelum field baru ada | Buka template, simpan ulang |

---

# BAB III PANDUAN PENGGUNAAN

Bab ini menjelaskan penggunaan aplikasi dari sudut pandang pengguna akhir. Urutannya mengikuti alur kerja yang paling umum: membuka situs, membuat akun, mengunggah dokumen, memeriksa, memformat, mengunduh, lalu mengelola data.

## 3.1 Halaman Publik

### 3.1.1 Halaman Utama

Halaman utama menjelaskan fungsi RapiMakalah, fitur inti, alur kerja empat langkah, template, keamanan, dan tautan panduan.

1. Buka alamat aplikasi pada browser.
2. Untuk mulai, klik **Mulai rapikan sekarang** (membuka registrasi) atau **Buka workspace** bila sudah masuk.
3. Klik **Lihat cara kerjanya** untuk membaca ringkasan alur.
4. Tautan **Panduan** membuka kumpulan artikel format.

### 3.1.2 Halaman Panduan

Halaman `/panduan` memuat delapan artikel:

1. Margin makalah 4-4-3-3.
2. Format daftar pustaka.
3. Penomoran halaman makalah.
4. Struktur makalah yang rapi.
5. Kata pengantar makalah.
6. Format tabel makalah.
7. Daftar tabel dan daftar gambar.
8. Kutipan dan sitasi.

Setiap artikel berisi penjelasan, langkah di Microsoft Word, kesalahan umum, dan catatan. Artikel dapat dibaca tanpa login.

### 3.1.3 Halaman Template yang Dibagikan

Tautan `/t/<kode>` menampilkan ringkasan template: ukuran halaman, margin, font, spasi, indentasi, perataan, heading, penomoran halaman, daftar isi, dan daftar pustaka, beserta nama pemilik template.

- Pengunjung dapat melihat isi template tanpa login.
- Untuk menyimpan salinan, pengunjung harus masuk atau mendaftar.
- Halaman ini tidak diindeks mesin pencari.

### 3.1.4 Popup Grup WhatsApp

Sekitar 1,5 detik setelah halaman publik dibuka, aplikasi menampilkan popup ajakan bergabung ke grup WhatsApp RapiMakalah untuk memperoleh info update fitur, tips format, dan bantuan dari pengguna lain.

| Tindakan | Efek |
| --- | --- |
| Gabung grup WhatsApp | Membuka grup di tab baru; popup tidak ditampilkan lagi |
| Nanti saja, tombol tutup, tombol `Esc`, atau klik latar | Menutup popup dan menyembunyikannya selama 14 hari |
| Jangan tampilkan lagi | Menyembunyikan popup secara permanen di perangkat tersebut |

Catatan:

- Popup hanya tampil di halaman publik: beranda, `/panduan`, artikel panduan, dan halaman template yang dibagikan.
- Popup tidak tampil di `/login`, `/register`, dan seluruh area `/app` agar tidak mengganggu pekerjaan.
- Pilihan disimpan di penyimpanan lokal browser, bukan di akun, sehingga perlu diulang bila memakai perangkat atau browser lain.
- Tautan grup juga tersedia permanen di footer halaman utama.

## 3.2 Membuat Akun dan Masuk

### 3.2.1 Membuat Akun

1. Buka `/register` atau klik **Daftar gratis**.
2. Isi **Nama lengkap** (minimal 2 karakter).
3. Isi **Email** yang aktif.
4. Isi **Password** minimal 8 karakter.
5. Ulangi password pada kolom konfirmasi.
6. Klik **Buat akun**.
7. Bila berhasil, akun langsung masuk dan diarahkan ke dashboard.

Catatan:

- Pengguna pertama yang mendaftar saat database masih kosong otomatis mendapat peran `admin`.
- Email harus unik. Bila sudah terdaftar, gunakan halaman masuk.
- Percobaan registrasi dan login dibatasi 30 kali per 15 menit per alamat IP.

### 3.2.2 Masuk

1. Buka `/login`.
2. Masukkan email dan password.
3. Klik **Masuk**.
4. Setelah berhasil, Anda diarahkan ke dashboard.

Sesi disimpan sebagai cookie httpOnly bertanda tangan JWT. Password di-hash dengan bcrypt dan tidak disimpan dalam bentuk teks biasa.

### 3.2.3 Bila Lupa Password

Aplikasi belum menyediakan fitur lupa password mandiri. Hubungi administrator; admin dapat mereset password dari Admin Panel. Password baru ditampilkan satu kali dan harus segera disalin.

## 3.3 Dashboard

Dashboard merangkum aktivitas akun.

Empat kartu statistik:

1. **Total dokumen** — jumlah seluruh dokumen milik akun.
2. **Selesai dirapikan** — dokumen yang sudah memiliki file hasil.
3. **Total halaman** — estimasi halaman dari dokumen yang dianalisis, disertai jumlah kata terindeks.
4. **Rata-rata temuan** — jumlah temuan pada analisis terakhir.

Bagian lain:

- **Dokumen terakhir** — daftar dokumen terbaru dengan ukuran, template, waktu, status, dan jumlah temuan. Klik nama dokumen untuk membuka workspace.
- **Aktivitas terbaru** — jejak unggahan, formatting, penghapusan, perubahan template, dan aktivitas akun.
- **Mulai cepat** — area unggah DOCX langsung dari dashboard.
- **Template sering dipakai** — template yang paling banyak dipakai beserta jumlah pemakaian.
- **Pengingat** — pengingat bahwa pratinjau bersifat struktural dan hasil akhir harus diperiksa di Word.

Tombol pada dashboard: **Template** dan **Upload dokumen**.

## 3.4 Membuat Dokumen Baru

Buka `/app/documents/new` melalui menu **Dokumen baru** atau tombol **Upload dokumen**. Tersedia dua cara input.

### 3.4.1 Unggah DOCX

1. Pilih tab **Unggah DOCX**.
2. Klik area unggah atau seret file ke area tersebut.
3. Pilih file berekstensi `.docx` dengan ukuran maksimum 20 MB.
4. Tunggu indikator unggahan selesai.
5. Setelah valid, dokumen disimpan dan workspace terbuka.

Validasi yang dilakukan server sebelum file diproses:

1. Ekstensi `.docx` dan MIME type.
2. Signature ZIP (`PK`) pada awal file.
3. Keberadaan `[Content_Types].xml` dan `word/document.xml`.
4. Batas ukuran hasil ekstraksi untuk mencegah zip bomb.
5. Batas ukuran unggahan sesuai `MAX_UPLOAD_MB`.

File disimpan dengan nama UUID internal. Nama asli hanya disimpan sebagai metadata.

### 3.4.2 Tempel Teks

1. Pilih tab **Tempel teks**.
2. Tempel isi makalah pada kotak teks. Teks biasa atau Markdown dari aplikasi lain dapat dipakai.
3. Klik **Buat dokumen**.

Aturan penulisan teks:

| Penulisan | Hasil |
| --- | --- |
| `# Judul` | Heading level 1, biasanya judul bab |
| `## Subjudul` | Heading level 2 |
| `### Sub-subjudul` | Heading level 3 |
| `1.` atau `-` di awal baris | Daftar bernomor atau berbutir |
| `---` | Pemisah halaman |
| `$...$` dan `$$...$$` | Rumus LaTeX yang diubah menjadi OMML |

Batas: minimal 20 karakter dan maksimum 500.000 karakter. Hasil konversi kemudian melewati pipeline format yang sama dengan file unggahan.

## 3.5 Mengenal Workspace Pemformatan

Workspace adalah halaman utama untuk memeriksa dan merapikan dokumen. Susunannya:

1. **Bilah atas** — tombol kembali, nama file, status dokumen, ukuran, template aktif, estimasi halaman, dan waktu unggah.
2. **Tombol tampilan** — **Asli**, **Hasil**, dan **Bandingkan** (bila hasil sudah ada).
3. **Tombol Unduh** — membuka dialog unduhan.
4. **Menu aksi lainnya** — unduh file asli, batalkan hasil format, hapus dokumen.
5. **Sidebar kiri** — daftar halaman dan outline heading. Klik halaman atau heading untuk melompat.
6. **Area pratinjau** — halaman dokumen dengan kontrol halaman sebelumnya/berikutnya, perkecil, perbesar, dan reset zoom.
7. **Panel kanan** — dua tab: **Formatting** dan **Pemeriksaan**. Pada layar kecil, panel dibuka melalui tombol **Format**.

Tabel 11. Tombol dan aksi di workspace pemformatan

| Tombol atau aksi | Fungsi |
| --- | --- |
| Asli | Menampilkan pratinjau file asli |
| Hasil | Menampilkan pratinjau file hasil; nonaktif sebelum formatting |
| Bandingkan | Menampilkan asli dan hasil berdampingan |
| Unduh | Membuka dialog unduh hasil atau asli |
| Aksi lainnya → Unduh file asli | Mengunduh file asli tanpa perubahan |
| Aksi lainnya → Batalkan hasil format | Menghapus file hasil dan kembali ke kondisi belum diproses |
| Aksi lainnya → Hapus dokumen | Menghapus dokumen beserta file asli dan hasil |
| Periksa ulang | Menjalankan analisis dengan konfigurasi aktif |
| Terapkan formatting | Memproses file dan menyimpan hasil DOCX |

Penting: perubahan pengaturan memicu pratinjau otomatis setelah jeda sekitar 700 ms. Pratinjau tersebut **belum** menyimpan file hasil. File hasil baru dibuat setelah **Terapkan formatting** ditekan.

## 3.6 Memilih Template dan Mengatur Aturan

### 3.6.1 Template Pedoman

Pada tab **Formatting**, bagian **Template pedoman** menyediakan pilihan:

- **Konfigurasi manual** — memakai nilai yang sedang tampil di panel.
- **Template bawaan** — saat ini hanya template **Makalah** yang tampil.
- **Template saya** — template kustom milik akun.

Mengganti template langsung memuat konfigurasinya dan menjalankan ulang pemeriksaan. Tautan **Kelola** membuka pustaka template.

### 3.6.2 Aturan yang Diterapkan

Panel menampilkan dua belas aturan yang dapat dinyalakan atau dimatikan satu per satu. Penghitung di kanan menunjukkan jumlah aturan aktif, misalnya `12/12`.

Tabel 9. Aturan formatting di panel workspace

| Aturan | Fungsi |
| --- | --- |
| Margin halaman | Mengatur margin setiap sisi sesuai konfigurasi |
| Jenis font | Menyelaraskan font seluruh run teks |
| Ukuran teks | Mengatur ukuran teks, termasuk teks dalam tabel |
| Spasi baris | Mengatur line spacing paragraf |
| Indentasi | Mengatur indentasi baris pertama |
| Perataan | Menetapkan justify, kiri, tengah, atau kanan |
| Heading BAB & subbab | Mengatur tebal, ukuran, dan perataan heading |
| Jarak antarparagraf | Mengatur spasi sebelum dan sesudah paragraf |
| Penomoran halaman | Membuat section, format, posisi, dan restart nomor |
| Sisipkan daftar isi | Menyisipkan field TOC yang dapat diperbarui |
| Buat cover otomatis | Membuat cover bila dokumen belum memilikinya |
| Kata pengantar & tanda tangan | Membuat atau merapikan kata pengantar |

Matikan aturan yang tidak ingin diubah. Misalnya, bila nomor halaman sudah benar, matikan **Penomoran halaman** agar tidak ditimpa.

## 3.7 Mengisi Data Cover dan Logo

Bagian **Data dokumen** dipakai untuk cover dan kata pengantar otomatis. Isian yang tersedia:

- Jenis dokumen (contoh: Makalah, Laporan Praktikum)
- Judul
- Mata kuliah
- Dosen pengampu
- Nama penulis untuk blok tanda tangan
- Program studi
- Departemen (opsional)
- Fakultas
- Institusi
- Kota untuk tanda tangan
- Tahun

Tambahan:

1. **Anggota** — tambahkan nama dan NIM satu per satu; gunakan tombol tambah dan hapus. Bila anggota lebih dari satu, nama dan NIM disusun dalam tabel dua kolom dengan border transparan agar tetap sejajar tanpa terlihat seperti tabel di Word.
2. **Logo atau foto cover** — unggah dengan klik, seret ke area, atau tempel dengan `Ctrl+V`.
3. **Ukuran logo** — atur tinggi logo antara 1 dan 8 cm melalui slider.

Ketentuan logo:

- Format gambar apa pun yang dikenali browser; file maksimum 8 MB.
- Gambar diperkecil hingga sisi terpanjang 600 piksel sebelum disimpan.
- Rasio asli dipertahankan agar logo tidak gepeng.
- Logo pada template dipakai otomatis, tetapi logo yang diunggah di workspace menimpa logo template.

Perilaku cover:

- Cover dibuat otomatis hanya bila dokumen belum memiliki cover.
- Seluruh baris cover dibuat rata tengah, tanpa indentasi warisan dan tanpa penomoran otomatis.
- Blok institusi dapat ditempel di dasar halaman.
- Jarak antar-baris menyusut otomatis agar cover tetap satu halaman, meskipun judul panjang dan anggota banyak.
- Judul yang sangat panjang dengan anggota sangat banyak tetap dapat melebihi satu halaman.

## 3.8 Mengatur Tipografi, Kertas, Heading, dan Penomoran

### 3.8.1 Tipografi Isi

| Pengaturan | Pilihan atau rentang |
| --- | --- |
| Font | Times New Roman, Arial, Calibri, Cambria, Georgia, Book Antiqua, Segoe UI, Verdana |
| Ukuran | 8–24 pt |
| Spasi baris | 1–3 kali |
| Indentasi baris pertama | 0–3 cm |
| Perataan | Justify, kiri, tengah, kanan |
| Perataan daftar pustaka | Justify, kiri, tengah, kanan |
| Jarak sebelum paragraf | 0–36 pt |
| Jarak sesudah paragraf | 0–36 pt |

### 3.8.2 Ukuran Kertas dan Margin

| Pengaturan | Pilihan |
| --- | --- |
| Kertas | A4, F4/Folio, Letter, A5 |
| Orientasi | Portrait, landscape |
| Margin tiap sisi | 1–6 cm |

Nilai margin yang umum untuk makalah Indonesia adalah atas 3 cm, kiri 4 cm, bawah 3 cm, dan kanan 3 cm. Beberapa kampus memakai atas 4 cm atau margin lain; sesuaikan dengan pedoman.

### 3.8.3 Heading

| Pengaturan | Pilihan atau rentang |
| --- | --- |
| Ukuran BAB | 10–24 pt |
| Ukuran subbab | 8–20 pt |
| Perataan BAB | Tengah atau kiri |
| BAB tebal | Aktif atau tidak |
| BAB kapital | Menampilkan kapital tanpa mengubah teks asli |
| Subbab tebal | Aktif atau tidak |

Heading dikenali dari style (`Heading 1..N`), `w:outlineLvl`, dan pola teks seperti `BAB I`. Penomoran BAB dan subbab memakai definisi khusus agar tidak bertabrakan dengan penomoran pengguna.

### 3.8.4 Penomoran Halaman

Penomoran dibuat dengan section break nyata, footer, dan `w:pgNumType`.

| Pengaturan | Pilihan |
| --- | --- |
| Aktifkan penomoran | Ya atau tidak |
| Format bagian awal | `I, II, III`, `i, ii, iii`, atau `1, 2, 3` |
| Format bagian isi | `1, 2, 3` atau `I, II, III` |
| Posisi nomor | Bawah tengah, bawah kanan, atas tengah, atas kanan |
| Cover tanpa nomor | Ya atau tidak |
| Mulai dari 1 di bagian isi | Ya atau tidak |

Pola yang paling umum:

| Bagian | Isi | Format | Mulai |
| --- | --- | --- | --- |
| Cover | Halaman judul | Tanpa nomor | — |
| Bagian awal | Kata pengantar, daftar isi, daftar tabel, daftar gambar | Romawi kecil | i |
| Bagian isi | BAB I sampai daftar pustaka | Arab | 1 |

### 3.8.5 Daftar Isi dan Keterangan

- **Sisipkan field daftar isi** menyisipkan field `TOC` yang dapat diperbarui di Word.
- **Kedalaman heading** menentukan level heading yang masuk daftar isi, 1–4.
- **Wajib keterangan gambar** menandai gambar tanpa paragraf keterangan di dekatnya.
- **Wajib keterangan tabel** menandai tabel tanpa paragraf keterangan di dekatnya.

Nomor halaman pada daftar isi baru akurat setelah Microsoft Word memperbarui field. RapiMakalah tidak melakukan pagination final.

## 3.9 Memeriksa Format Dokumen

1. Buka tab **Pemeriksaan**.
2. Bila belum ada hasil, klik **Periksa dokumen**.
3. Tunggu proses selesai. Panel menampilkan skor, ringkasan status, dan daftar kategori.
4. Klik salah satu temuan untuk menuju halaman dan paragraf terkait di pratinjau.

Ringkasan pada panel:

- **Skor 0–100** dengan label:
  - 90–100: **Dokumen konsisten**.
  - 65–89: **Perlu perhatian**.
  - Di bawah 65: **Banyak ketidaksesuaian**.
- Jumlah temuan dan jumlah kategori yang diperiksa.
- Hitungan status: sesuai, perlu diperiksa, dan tidak sesuai.

Tabel 10. Kategori pemeriksaan format

| Kategori | Contoh temuan |
| --- | --- |
| Konsistensi font | Calibri 11 pt ditemukan; template meminta Times New Roman |
| Ukuran teks | Ukuran 11 pt pada enam paragraf; template 12 pt |
| Spasi baris | Spasi 1,0 pada paragraf isi; template 1,5 |
| Indentasi | Baris pertama tidak menjorok 1,25 cm |
| Perataan | Paragraf isi rata kiri; template justify |
| Heading | BAB tidak memakai style heading |
| Margin & halaman | Margin 2,5 cm; template 4 cm |
| Halaman kosong | Halaman kosong setelah BAB II |
| Keterangan gambar/tabel | Gambar tanpa keterangan, bila aturan diaktifkan |

Setiap temuan memuat paragraf atau blok, nilai yang ditemukan, nilai yang diharapkan, tingkat keparahan, dan rekomendasi.

## 3.10 Menerapkan Formatting

1. Pilih template atau atur konfigurasi manual.
2. Isi data dokumen bila cover atau kata pengantar akan dibuat.
3. Aktifkan aturan yang ingin diterapkan.
4. Periksa kembali margin, font, ukuran, spasi, heading, penomoran, dan daftar isi.
5. Klik **Terapkan formatting**.
6. Tunggu hingga proses selesai. Tombol menampilkan status pemrosesan.
7. Setelah berhasil, aplikasi menampilkan notifikasi berisi estimasi halaman dan temuan tersisa.
8. Pratinjau beralih ke tampilan **Hasil**, dan panel berpindah ke tab Pemeriksaan.

Yang terjadi di server:

- Dokumen selalu diproses dari file asli.
- Format paragraf dan run diterapkan pada `word/document.xml`; teks dalam tabel ikut diproses.
- Section, footer, field `PAGE`, dan field `TOC` ditambahkan sesuai konfigurasi.
- Hasil disimpan sebagai file terpisah, sehingga file asli tetap utuh.
- Bila proses gagal, status dokumen menjadi gagal, pesan kesalahan ditampilkan, dan file asli tidak diubah.

Bila muncul peringatan proses, periksa daftar **Catatan proses** pada panel. Peringatan biasanya menjelaskan bagian yang dilewati atau perlu diperiksa manual.

## 3.11 Membandingkan dan Mengunduh Hasil

1. Klik **Bandingkan** untuk melihat asli dan hasil berdampingan.
2. Gunakan **Asli** atau **Hasil** untuk tampilan satu halaman.
3. Periksa panel Pemeriksaan untuk melihat temuan yang masih tersisa.
4. Klik **Unduh**.
5. Pada dialog, pilih versi:
   - **Hasil formatting** — file yang sudah diproses.
   - **File asli** — file yang diunggah tanpa perubahan.
6. Ubah nama file bila perlu, lalu konfirmasi.
7. File hasil diunduh dengan akhiran `-rapimakalah.docx`.

Setelah diunduh:

1. Buka file di Microsoft Word.
2. Klik **Enable Editing** bila Word membuka dalam Protected View.
3. Klik kanan pada daftar isi, pilih **Update Field**, lalu **Update entire table**.
4. Periksa margin, font, spasi, heading, penomoran halaman, tabel, gambar, dan daftar pustaka.
5. Simpan ulang setelah pemeriksaan.

Pratinjau aplikasi hanya render struktural. Pemeriksaan akhir wajib dilakukan di Microsoft Word sebelum dokumen dikumpulkan.

## 3.12 Membatalkan Hasil dan Menghapus Dokumen

### 3.12.1 Membatalkan Hasil Format

1. Buka menu **Aksi lainnya** pada bilah atas workspace.
2. Pilih **Batalkan hasil format**.
3. Konfirmasi tindakan.

Efeknya: file hasil dihapus, status kembali menjadi belum diproses, dan file asli tetap tersedia. Dokumen tidak hilang dari riwayat.

### 3.12.2 Menghapus Dokumen

1. Buka menu **Aksi lainnya**.
2. Pilih **Hapus dokumen**.
3. Baca peringatan, lalu konfirmasi.

Penghapusan bersifat permanen: file asli, file hasil, dan data dokumen dihapus. Tindakan ini tidak dapat dibatalkan.

## 3.13 Riwayat Dokumen

Menu **Dokumen** membuka riwayat seluruh dokumen milik akun.

Fitur halaman:

- **Muat ulang** untuk mengambil data terbaru.
- **Upload dokumen** untuk membuat dokumen baru.
- **Pencarian** berdasarkan nama dokumen.
- **Filter status**.
- **Pagination** bila dokumen banyak.
- **Buka workspace** melalui nama atau ikon panah.
- **Unduh hasil formatting** bila tersedia.
- **Hapus dokumen** dengan konfirmasi.

Tabel 13. Status dokumen di riwayat

| Status internal | Label tampilan | Arti |
| --- | --- | --- |
| `uploaded` | Belum diproses | File sudah diunggah, hasil belum dibuat |
| `processing` | Sedang diproses | Formatting sedang berjalan |
| `ready` | Siap diunduh | File hasil tersedia |
| `failed` | Gagal | Pemrosesan terakhir gagal; file asli tetap aman |

Tombol unduh pada riwayat hanya aktif bila file hasil sudah ada. Nama file unduhan memakai nama asli ditambah `-rapimakalah.docx`.

## 3.14 Pustaka Template

Menu **Template** menampilkan seluruh template yang tersedia bagi akun.

Fitur halaman:

1. **Filter** Semua, Bawaan, dan Template saya, lengkap dengan jumlah.
2. **Pencarian** nama template.
3. **Impor template** untuk memasukkan template dari kode atau tautan berbagi.
4. **Template kustom** untuk membuat konfigurasi baru.

Aksi pada kartu template:

| Aksi | Template bawaan | Template kustom |
| --- | --- | --- |
| Pakai | Ya | Ya |
| Duplikat | Ya, menghasilkan salinan `Nama (kustom)` | Ya |
| Edit | Tidak langsung; duplikat dulu | Ya |
| Bagikan | Tidak perlu | Ya |
| Hapus | Tidak bisa | Ya |

Template bawaan bersifat baca-saja. Bila ingin mengubah angkanya, duplikat terlebih dahulu.

Catatan penting: saat ini hanya template bawaan **Makalah** yang ditampilkan. Template bawaan lain tetap tersimpan di database agar dokumen lama yang memakainya masih dapat dibuka, tetapi tidak muncul di daftar.

## 3.15 Membuat Template Kustom

### 3.15.1 Dari Template Bawaan

1. Buka **Template**.
2. Pada kartu **Makalah**, klik **Duplikat**.
3. Buka salinan hasil duplikasi.
4. Sesuaikan nilainya.
5. Klik **Simpan perubahan**.

### 3.15.2 Dari Nol

1. Buka **Template**.
2. Klik **Template kustom**.
3. Isi identitas template:
   - Nama template (maksimum 80 karakter).
   - Kategori.
   - Deskripsi (maksimum 300 karakter).
4. Atur bagian berikut sesuai pedoman kampus.

Bagian konfigurasi editor template:

1. **Ukuran kertas & margin** — ukuran kertas, orientasi, margin atas/kanan/bawah/kiri.
2. **Tipografi isi** — font, perataan, ukuran, spasi baris, indentasi baris pertama, jarak sebelum dan sesudah paragraf.
3. **Heading BAB & subbab** — font, perataan, ukuran, jarak sebelum/sesudah, tebal, dan kapital untuk Heading BAB, subbab, dan sub-sub bab.
4. **Penomoran halaman** — aktif/tidak, format bagian awal, format bagian isi, posisi, cover tanpa nomor, mulai ulang dari 1.
5. **Daftar isi** — aktif/tidak, kedalaman 1–5, judul daftar isi, penyertaan judul DAFTAR ISI sebagai entri.
6. **Cover** — logo bawaan, ukuran judul, ukuran blok institusi, isian cover bawaan, blok institusi di dasar halaman, tampilkan baris departemen.
7. **Daftar pustaka** — indent gantung, perataan, ubah URL menjadi tautan.
8. **Keterangan gambar & tabel** — wajib keterangan gambar, wajib keterangan tabel.

Fitur tambahan editor:

- **Pratinjau template** di sisi kanan menampilkan ringkasan konfigurasi.
- **Pakai template** langsung membuka halaman dokumen baru dengan template tersebut.
- **Reset konfigurasi ke bawaan** mengembalikan nilai ke default.
- Template baru dapat disimpan dengan tombol **Simpan template**.

Isian cover bawaan dipakai otomatis pada setiap dokumen yang memakai template. Isian yang diubah di workspace selalu menimpa nilai template.

## 3.16 Berbagi, Menerbitkan, Mengimpor, dan Mencabut Template

### 3.16.1 Membagikan Template

1. Buka **Template**.
2. Pada template kustom, klik ikon **Bagikan**.
3. Tunggu hingga kode berbagi dibuat.
4. Salin **tautan berbagi** atau **kode template** 8 karakter.
5. Kirimkan kepada penerima.

Ketentuan:

- Kode memakai alfabet tanpa karakter yang mudah tertukar (`0`, `O`, `1`, `I`, `l`).
- Tautan berbentuk `/t/<kode>` dan dapat dibuka tanpa login.
- Halaman berbagi menampilkan ringkasan konfigurasi dan nama pemilik.
- Template bawaan tidak perlu dan tidak dapat dibagikan karena semua pengguna sudah memilikinya.

### 3.16.2 Mengimpor Template

1. Buka **Template**.
2. Klik **Impor template**.
3. Masukkan kode 8 karakter atau tautan berbagi.
4. Konfirmasi impor.
5. Salinan identik tersimpan sebagai template milik Anda.

Hasil impor:

- Konfigurasi disalin apa adanya sehingga hasilnya identik.
- Salinan menjadi milik penerima dan bebas diubah tanpa memengaruhi template asli.
- Bila nama sudah dipakai, aplikasi menambahkan akhiran seperti `Nama (2)`.

### 3.16.3 Mencabut Tautan

1. Buka **Template**.
2. Pada template yang sudah dibagikan, buka dialog **Bagikan**.
3. Pilih **Cabut tautan** dan konfirmasi.

Setelah dicabut, tautan lama langsung tidak berlaku dan menampilkan pesan bahwa tautan tidak ditemukan atau sudah dicabut. Kode baru dapat dibuat kembali kapan saja.

### 3.16.4 Menerbitkan ke Galeri Publik

1. Buka **Template**.
2. Pada template kustom, klik ikon **globe** untuk menerbitkan.
3. Buka `/galeri` atau menu **Galeri template** untuk melihat hasilnya.
4. Untuk menariknya, klik ikon globe yang sama pada template tersebut.

Ketentuan:

- Galeri dapat dicari dan difilter tanpa memerlukan tautan atau kode.
- Template bawaan tidak dapat diterbitkan; duplikat dahulu menjadi template kustom.
- Status galeri terpisah dari tautan berbagi. Mencabut tautan tidak otomatis menarik template dari galeri, dan sebaliknya.
- Pengguna yang login dapat menyimpan salinan. Salinan tersebut independen dan tidak otomatis ikut terbit.
- Menarik template hanya menghilangkan template asli dari galeri; salinan yang sudah disimpan pengguna lain tetap ada.
- Bila yang menerbitkan adalah akun **admin**, nama yang tampil di galeri dan halaman berbagi menjadi **“Anonim”**, tanpa institusi atau program studi.

## 3.17 Workspace Menulis: Daftar Draft

Menu **Menulis** menampilkan daftar draft.

1. Klik **Makalah baru** atau **Mulai menulis**.
2. Draft baru dibuat dengan judul awal `Makalah baru` dan langsung dibuka.
3. Draft yang ada menampilkan judul dan waktu edit terakhir.
4. Klik judul draft untuk membuka editor.
5. Klik ikon hapus untuk menghapus draft, lalu konfirmasi.

Draft disimpan di akun, bukan hanya di browser, sehingga dapat dibuka dari perangkat lain setelah login.

## 3.18 Workspace Menulis: Antarmuka Editor

Bagian antarmuka editor:

1. **Bilah judul** — tombol kembali, ikon dokumen, kolom judul, status penyimpanan, tombol **Simpan**, dan **Unduh Word**.
2. **Ribbon** — deretan tab perintah: File, Beranda, Sisipkan, Tata Letak, Tampilan, serta tab kontekstual Tabel atau Gambar.
3. **Panel navigasi** (opsional) — daftar heading dan pencarian paragraf.
4. **Panel cari dan ganti** (opsional).
5. **Kanvas** — lembar A4 dengan penggaris horizontal, batas area teks, dan pemisah halaman otomatis.
6. **Status bar** — jumlah halaman, jumlah kata, ukuran halaman, dan pilihan zoom.

Lembar A4 ditampilkan terpisah secara otomatis. Saat isi melewati batas area teks, lembar berikutnya muncul; saat isi dihapus, lembar kosong yang tidak diperlukan hilang. Pagination ini hanya mengubah tampilan dan tidak menambah node ke draft. Pemisah halaman manual yang disisipkan dari menu tetap tersimpan dan ikut diekspor.

## 3.19 Workspace Menulis: Ribbon dan Perintah

Tabel 12. Tab ribbon workspace menulis

| Tab | Perintah |
| --- | --- |
| File | Simpan, Buka Word, Unduh Word |
| Beranda | Urungkan, Ulangi, font, ukuran, tebal, miring, garis bawah, coret, warna teks, sorotan, hapus format, daftar bullet, daftar nomor, spasi dan indentasi, perataan, gaya Normal/Heading 1–3, cari dan ganti |
| Sisipkan | Perbarui daftar isi, pemisah halaman, tabel 3 × 3, gambar perangkat, garis horizontal |
| Tata Letak | Informasi halaman A4 dan margin, jarak paragraf, pengaturan indentasi melalui penggaris |
| Tampilan | Mode Edit/Asli, penggaris dan batas teks, panel navigasi, zoom, mode fokus |
| Tabel | Tambah baris, tambah kolom, hapus baris, hapus kolom, gabung sel, pisah sel, hapus tabel |
| Gambar | Lebar gambar 40–480 piksel, hapus gambar |

Penjelasan perintah penting:

- **Gaya** menyediakan Normal, Heading 1 (judul BAB), Heading 2 (subbab), dan Heading 3 (subjudul). Heading dipakai untuk navigasi dan daftar isi editor.
- **Warna teks** dan **sorotan** memakai pemilih warna; keduanya ikut tersimpan dan diekspor.
- **Hapus format teks** menghapus mark teks, bukan isi.
- **Spasi & indent** membuka tab Tata Letak untuk mengatur jarak dan spasi baris.
- **Mode fokus** menyembunyikan elemen sekitar agar area menulis lebih lega; klik **Keluar fokus** untuk kembali.
- **Bantuan Word** membuka dokumentasi Microsoft Word di tab baru.

## 3.20 Workspace Menulis: Penggaris dan Jarak Paragraf

Penggaris horizontal berskala sentimeter mencakup lebar A4, dengan zona margin abu-abu dan area teks putih.

Terdapat empat penanda:

| Penanda | Fungsi |
| --- | --- |
| Segitiga atas | Mengatur indentasi baris pertama |
| Segitiga bawah | Mengatur hanging indent sambil mempertahankan posisi baris pertama |
| Kotak bawah | Menggeser kedua penanda kiri bersama |
| Segitiga kanan | Mengatur batas kanan paragraf |

Cara memakai:

1. Letakkan kursor pada paragraf yang ingin diatur.
2. Seret penanda dengan mouse atau sentuh.
3. Untuk presisi, fokuskan penanda lalu gunakan tombol panah (0,1 cm), `Home` (minimum), atau `End` (maksimum).
4. Buka bagian **Indentasi paragraf** di bawah penggaris untuk mengisi angka kiri, kanan, dan baris pertama secara langsung.

Jarak paragraf pada tab Tata Letak:

- **Sebelum** dan **Sesudah** dalam satuan pt, rentang 0–120.
- **Spasi baris** dengan pilihan 1, 1,15, 1,5, 2, 2,5, atau 3.
- Nilai tersimpan pada paragraf atau heading dan ikut diekspor ke Word.

Penggaris vertikal dan batas area teks dapat disembunyikan melalui tab Tampilan. Garis panduan hanya tampil di editor dan tidak dicetak. Tab stop dan pengubahan margin halaman lewat penggaris belum tersedia.

## 3.21 Workspace Menulis: Navigasi, Pencarian, dan Daftar Isi

### 3.21.1 Panel Navigasi

Aktifkan melalui tab Tampilan → **Panel navigasi**.

- Tanpa kata kunci, panel menampilkan daftar heading.
- Dengan kata kunci, panel menampilkan jumlah dan daftar paragraf yang cocok.
- Klik salah satu item untuk melompat ke bagian tersebut.

### 3.21.2 Cari dan Ganti

Buka melalui Beranda → **Cari & ganti**.

1. Isi **Cari**.
2. Panel menampilkan posisi hasil, misalnya `2 dari 7`.
3. Gunakan **Berikutnya** atau **Sebelumnya** untuk berpindah.
4. Isi **Ganti dengan**.
5. Klik **Ganti** untuk satu hasil atau **Ganti semua** untuk seluruh hasil.

### 3.21.3 Daftar Isi Editor

Pada tab Sisipkan tersedia **Perbarui daftar isi**.

- Perintah ini mengisi ulang entri daftar isi yang sudah ada berdasarkan Heading 1–3.
- Nomor halaman mengikuti halaman web, termasuk cover.
- Bila draft belum memiliki baris daftar isi, muncul pesan bahwa daftar isi belum tersedia dan pengguna diminta mengimpor dokumen yang memiliki daftar isi.
- Daftar isi ini berbeda dari field TOC Word; saat diekspor, isinya menjadi teks dengan penanda, bukan field yang otomatis diperbarui.

## 3.22 Workspace Menulis: Gambar, Tabel, dan Pemisah Halaman

### 3.22.1 Menyisipkan Gambar

1. Letakkan kursor pada posisi yang diinginkan.
2. Buka tab Sisipkan → **Gambar perangkat**.
3. Pilih file PNG atau JPG.

Ketentuan gambar:

- Maksimum 700 KB per gambar.
- Format harus PNG atau JPG.
- Lebar awal mengikuti ukuran gambar, maksimum 480 piksel.
- Draft yang akan melewati sekitar 1,8 MB ditolak agar tidak melampaui batas API.
- Setelah gambar terpilih, tab **Gambar** muncul untuk mengubah lebar 40–480 piksel atau menghapus gambar.

### 3.22.2 Menyisipkan Tabel

1. Buka tab Sisipkan → **Tabel 3 × 3**.
2. Tabel dibuat dengan baris header.
3. Saat kursor berada di tabel, tab **Tabel** muncul.
4. Gunakan perintah tambah/hapus baris, tambah/hapus kolom, gabung sel, pisah sel, atau hapus tabel.

### 3.22.3 Pemisah Halaman dan Garis

- **Pemisah halaman** menambahkan pemisah manual yang tersimpan dan ikut diekspor.
- **Garis horizontal** menambahkan garis pemisah di posisi kursor.

## 3.23 Workspace Menulis: Penyimpanan dan Ekspor

### 3.23.1 Autosave

- Setiap perubahan memicu penyimpanan otomatis setelah jeda sekitar 1,2 detik.
- Status pada bilah judul menunjukkan kondisi: belum tersimpan, sedang menyimpan, tersimpan ke akun, atau gagal menyimpan.
- Salinan lokal disimpan di browser sebagai pemulihan. Bila salinan lokal lebih baru dari versi server, aplikasi memulihkannya saat draft dibuka.
- Bila koneksi kembali online, aplikasi mencoba menyimpan lagi.
- Menutup tab saat ada perubahan yang belum tersimpan memunculkan peringatan browser.

Gunakan tombol **Simpan** untuk menyimpan segera. Tombol kembali juga menyimpan terlebih dahulu sebelum meninggalkan editor.

### 3.23.2 Unduh Word

1. Klik **Unduh Word**.
2. Aplikasi menyimpan draft terlebih dahulu, lalu mengunduh file.
3. Nama file mengikuti judul draft; karakter yang tidak valid diganti tanda hubung.

Format ekspor draft:

- Kertas A4.
- Margin kiri 4 cm; atas, kanan, dan bawah 3 cm.
- Times New Roman 12 pt.
- Spasi baris 1,5.
- Heading, tabel, gambar, dan pemisah halaman ikut diekspor.

Bila draft diimpor dari Word, ukuran halaman dan margin hasil impor dipakai untuk tampilan editor. Namun ekspor draft tetap mengikuti format baku editor.

## 3.24 Mengimpor DOCX ke Workspace Menulis

1. Buka draft yang ingin dijadikan tujuan atau draft kosong.
2. Buka tab File → **Buka Word**.
3. Pilih file `.docx`.
4. Tunggu proses membaca file.
5. Baca dialog konfirmasi. Dialog menjelaskan bahwa draft saat ini tetap disimpan dan salinan dibuat sebagai draft baru.
6. Klik **Buka salinan**.

Yang diimpor:

- Teks dan paragraf.
- Heading.
- Tabel.
- Gambar yang didukung.
- Perataan paragraf dan struktur cover yang dikenali.
- Ukuran halaman dan margin, bila terbaca.

Yang dapat berubah atau hilang:

- Daftar isi Word menjadi teks statis, bukan field yang dapat memperbarui nomor halaman.
- Header, footer, dan sebagian tata letak lanjutan.
- Fitur Word lanjutan yang tidak didukung editor.

Bila impor gagal atau dibatalkan, draft baru yang terlanjur dibuat akan dibersihkan. Periksa kembali hasil impor sebelum menyimpan atau mengunduh.

## 3.25 Pengaturan Akun dan Keamanan

Buka menu **Pengaturan**.

### 3.25.1 Profil

1. Ubah **Nama lengkap** (maksimum 80 karakter).
2. Email ditampilkan tetapi tidak dapat diubah dari halaman ini.
3. Ubah **Institusi/kampus** dan **Program studi** (masing-masing maksimum 120 karakter).
4. Klik **Simpan profil**.

Tanggal bergabung ditampilkan di bagian bawah formulir.

### 3.25.2 Ubah Password

1. Isi **Password saat ini**.
2. Isi **Password baru**, minimal 8 karakter.
3. Ulangi password baru.
4. Klik **Perbarui password**.

Setelah password diubah, sesi di perangkat lain sebaiknya dianggap tidak lagi tepercaya. Untuk keluar dari perangkat lain, ubah password lalu masuk kembali.

### 3.25.3 Privasi dan Data

Panel samping menampilkan:

- **Privasi & keamanan** — sesi memakai cookie httpOnly, kepemilikan dokumen diperiksa pada setiap endpoint, file disimpan dengan nama UUID, dan isi dokumen tidak dipakai untuk pelatihan model.
- **Data tersimpan** — jumlah dokumen, jumlah dokumen yang sudah diformat, dan ukuran file asli.
- **Sesi** — tombol **Keluar dari akun**.

### 3.25.4 Hapus Akun

1. Pada bagian **Hapus akun**, klik **Hapus akun**.
2. Baca peringatan bahwa seluruh dokumen, file hasil, template kustom, dan riwayat akan dihapus permanen.
3. Masukkan password akun.
4. Klik **Hapus akun saya**.

Setelah berhasil, sesi diakhiri dan pengguna diarahkan ke halaman utama. Tindakan ini tidak dapat dibatalkan.

## 3.26 Keluar dari Aplikasi

1. Klik avatar atau nama pengguna di kanan atas.
2. Pilih **Keluar**.
3. Anda diarahkan ke halaman utama dan cookie sesi dihapus dari browser.

Alternatif: buka Pengaturan, lalu klik **Keluar dari akun** pada panel Sesi.

## 3.27 Admin Panel

Menu **Admin panel** hanya terlihat untuk akun dengan peran `admin`. Pengguna biasa yang membuka `/app/admin` diarahkan kembali ke dashboard.

### 3.27.1 Tab Analitik

- Kartu **Pengguna**, **Dokumen**, **Sudah diformat**, dan **Penyimpanan**.
- Peringatan bila ada dokumen berstatus gagal.
- Grafik **Dokumen per hari** untuk 30 hari terakhir.
- **Template terpakai** berdasarkan dokumen yang pernah diformat.
- Tombol **Muat ulang** untuk mengambil data terbaru.

### 3.27.2 Tab Pengguna

- Pencarian berdasarkan nama atau email.
- Daftar berisi nama, email, institusi/program studi, peran, jumlah dokumen, dan tanggal daftar.
- Pagination 20 pengguna per halaman.
- **Reset password** — menghasilkan password acak baru yang ditampilkan satu kali. Salin dan kirimkan kepada pengguna; password tidak dapat dilihat lagi setelah dialog ditutup.
- **Hapus akun** — menghapus akun beserta dokumen dan template miliknya secara permanen.

Akun administrator tidak dapat direset atau dihapus dari panel. Hal ini mencegah admin terkunci dari sistem.

### 3.27.3 Menjadikan Pengguna sebagai Admin

Pengguna pertama yang mendaftar pada database kosong otomatis menjadi admin. Untuk instalasi lama, jalankan skrip sekali dari folder proyek:

```powershell
@'
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const first = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
await prisma.user.update({ where: { id: first.id }, data: { role: "admin" } });
console.log("Admin:", first.email);
await prisma.$disconnect();
'@ | Set-Content -Encoding utf8 server\scripts\promote-admin.mjs
node server\scripts\promote-admin.mjs
```

---

# BAB IV PEMELIHARAAN DAN PENCADANGAN

## 4.1 Apa yang Perlu Dicadangkan

| Data | Lokasi | Isi |
| --- | --- | --- |
| Kode sumber | Seluruh proyek kecuali `node_modules`, `client/dist`, dan folder backup | Aplikasi, konfigurasi deploy, dokumentasi |
| Database | `server/prisma/dev.db` | Akun, dokumen, template, aktivitas |
| File dokumen | `server/storage/<userId>/` | DOCX asli dan hasil formatting |
| Draft menulis | `server/storage/writing/<userId>/` | Draft JSON dan file Word asli impor |
| Konfigurasi | `server/.env.production`, `deploy/` | Port, JWT, tunnel, domain |

Yang tidak perlu dicadangkan: `node_modules`, `client/dist`, file fixture, dan arsip ZIP lama.

## 4.2 Cara Mencadangkan

Jalankan dari root proyek:

```powershell
$stamp = Get-Date -Format 'yyyy-MM-dd'
Compress-Archive -Path server\prisma\dev.db, server\storage -DestinationPath "backup\rapimakalah-data-$stamp.zip" -Force
```

Untuk kode sumber tanpa dependency:

```powershell
robocopy . "$env:TEMP\rapimakalah-src" /E /XD node_modules dist .git backup /XF .env .env.production *.zip
Compress-Archive -Path "$env:TEMP\rapimakalah-src\*" -DestinationPath "backup\rapimakalah-source-$stamp.zip" -Force
Remove-Item "$env:TEMP\rapimakalah-src" -Recurse -Force
```

Simpan salinan di luar komputer server, misalnya Google Drive, OneDrive, atau hard disk eksternal. Backup di folder yang sama tidak melindungi dari kerusakan disk.

## 4.3 Cara Memulihkan

1. Hentikan layanan dengan `Ctrl+C` pada jendela yang menjalankan server.
2. Pulihkan kode sumber ke folder proyek.
3. Ekstrak arsip data, lalu timpa `server/prisma/dev.db` dan folder `server/storage`.
4. Buat ulang konfigurasi environment karena file `.env` tidak ikut dicadangkan:

```powershell
Copy-Item server\.env.example server\.env
Copy-Item deploy\env.production.example server\.env.production
```

5. Isi kembali `JWT_SECRET`, `PORT`, `CLIENT_ORIGIN`, `CANONICAL_URL`, `COOKIE_SECURE`, serta URL database yang dipulihkan.
6. Pasang dependency:

```powershell
npm install
npm run install:all
```

7. Jalankan kembali aplikasi dan periksa `/api/health`.

Jangan jalankan `db:push` pada database hasil restore sebelum memeriksa schema dan output Prisma. Mengganti `JWT_SECRET` membuat semua pengguna harus login ulang, tetapi tidak menghapus data.

## 4.4 Memperbarui Aplikasi

1. Cadangkan database dan storage.
2. Hentikan layanan.
3. Ganti kode sumber dengan versi baru.
4. Pasang dependency.
5. Jika schema berubah, pastikan `DATABASE_URL` menunjuk database yang benar, buat dan verifikasi backup database serta storage, lalu jalankan `npm --prefix server run db:push` sambil meninjau output Prisma. Jika Prisma memperingatkan potensi kehilangan data, berhenti dan rencanakan migrasi/restore; jangan memakai `--accept-data-loss` tanpa memahami konsekuensinya.
6. Jalankan `npm run build`.
7. Nyalakan layanan dan uji health, login, unggah, format, serta unduh.
8. Bila template bawaan berubah, jalankan `npm --prefix server run db:seed`. Template milik pengguna tidak tersentuh.

## 4.5 Pemantauan Rutin

- Periksa `/api/health` secara berkala, dapat memakai layanan uptime gratis.
- Pantau ukuran `server/storage` dan `server/storage/writing`.
- Periksa log server untuk pesan kegagalan pemrosesan.
- Periksa log `cloudflared` untuk pesan `Unable to reach the origin service`, yang berarti server lokal tidak aktif.
- Jalankan `npm audit` secara berkala dan perbarui dependency setelah diuji.

## 4.6 Keamanan Operasional

1. Simpan `JWT_SECRET` hanya di file environment server.
2. Gunakan `COOKIE_SECURE=true` pada HTTPS.
3. Jangan membuka port server langsung ke internet bila memakai tunnel.
4. Batasi akses fisik ke database dan folder storage.
5. Jangan membagikan akun admin.
6. Lakukan backup terenkripsi bila memuat data pribadi pengguna.
7. Hapus akun pengguna yang tidak lagi berhak memakai layanan.
8. Perbarui Node.js dan dependency secara berkala.

## 4.7 SEO dan Visibilitas

Kode sudah menyiapkan:

- `robots.txt` dan `sitemap.xml` di `client/public`.
- Metadata per rute, canonical, Open Graph, dan JSON-LD di `server/src/seo.js`.
- Halaman panduan dengan JSON-LD Article dan BreadcrumbList.
- Header `X-Robots-Tag: noindex` untuk `/app/*` dan `/api/*`.
- Favicon dan apple-touch-icon.

Langkah sekali pakai:

1. Buka Google Search Console dan tambahkan properti domain.
2. Verifikasi melalui DNS TXT di Cloudflare.
3. Kirim `https://domain-anda.example/sitemap.xml`.
4. Gunakan URL Inspection → Request indexing untuk halaman utama dan tiap artikel.

Setelah mengubah artikel panduan, restart server agar metadata ikut diperbarui.

---

# BAB V PENGUJIAN

## 5.1 Smoke Test Mesin DOCX

Tidak memerlukan akun:

```powershell
npm --prefix server run test:engine
```

Skrip membaca `server/test-fixture.docx`, menerapkan formatting, menulis hasil sementara ke direktori temporary sistem, lalu memeriksa:

- Section dan `pgNumType`.
- Footer per bagian.
- Field TOC.
- Tabel, gambar, dan hyperlink yang dipertahankan.
- Hasil pratinjau.
- Cover yang rata tengah tanpa indentasi dan tanpa penomoran.
- Elemen cover tambahan yang tidak merusak pagination.

Buka file hasil di Microsoft Word untuk verifikasi manual.

## 5.2 Uji Alur Berbagi Template

Jalankan hanya terhadap database pengembangan/tes yang tidak berisi data pengguna (jangan targetkan produksi). Server harus aktif. Script membuat dua akun uji sementara, lalu memverifikasi pembuatan kode, akses publik, impor salinan identik, penanganan nama bentrok, pencabutan tautan, dan `noindex`.

```powershell
node server/scripts/test-share.mjs
```

Untuk menunjuk server lain:

```powershell
$env:BASE='http://localhost:4000'; node server/scripts/test-share.mjs
```

Akun uji dihapus otomatis di akhir, kecuali dijalankan dengan `KEEP=1`.

Galeri template memiliki pengujian terpisah yang memverifikasi penerbitan, daftar/detail publik, penolakan template bawaan, salin ke akun, pencabutan, dan metadata `/galeri`:

```powershell
node server/scripts/test-gallery.mjs
```

## 5.3 Checklist Pengguna

Tabel 16. Checklist pengujian pengguna

| No | Langkah | Hasil yang diharapkan |
| --- | --- | --- |
| 1 | Registrasi akun baru, lalu login ulang | Akun dibuat dan sesi bertahan |
| 2 | Unggah DOCX valid | Dokumen muncul di riwayat dan workspace terbuka |
| 3 | Unggah PDF atau file rusak | Ditolak dengan pesan yang jelas |
| 4 | Isi judul panjang, empat anggota, dan logo | Cover tetap satu halaman; logo tidak gepeng |
| 5 | Jalankan pemeriksaan | Temuan menyebut paragraf dan nilai |
| 6 | Terapkan formatting | Hasil tersedia dan pratinjau beralih ke Hasil |
| 7 | Bandingkan asli dan hasil | Kedua versi tampil berdampingan |
| 8 | Unduh hasil dan buka di Word | Margin, font, spasi, heading, nomor, dan TOC benar setelah Update Field |
| 9 | Batalkan hasil format | File hasil hilang; file asli tetap ada |
| 10 | Hapus dokumen | Dokumen hilang dari riwayat |
| 11 | Buat template kustom | Template muncul di Template saya |
| 12 | Bagikan lalu impor dengan akun lain | Konfigurasi identik; nama bentrok diberi akhiran |
| 13 | Cabut tautan berbagi | Tautan lama tidak dapat dibuka |
| 14 | Buat draft menulis, tunggu autosave | Status tersimpan dan draft muncul di daftar |
| 15 | Impor DOCX ke editor | Teks, heading, tabel, dan gambar terbaca |
| 16 | Unduh draft sebagai Word | Format A4, TNR 12 pt, spasi 1,5 |

## 5.4 Checklist Operator

1. `/api/health` merespons 200 dari domain publik.
2. Login melalui HTTPS berhasil dan sesi bertahan setelah refresh.
3. `/app` tidak muncul di hasil pencarian.
4. Backup dibuat, dipulihkan ke folder sementara, dan aplikasi berjalan.
5. Tunnel berstatus healthy setelah reboot.
6. Ukuran storage dan database masih dalam kapasitas disk.
7. Tidak ada dokumen berstatus gagal yang menumpuk.
8. Akun admin dapat membuka panel dan melakukan reset password pengguna.

---

# BAB VI PENUTUP

RapiMakalah membantu pengguna menyiapkan dokumen akademik dengan format yang lebih konsisten melalui alur unggah atau tulis, analisis, pemilihan pedoman, penerapan format, pratinjau, dan unduh hasil. Aplikasi juga menyediakan template kustom, berbagi template, workspace menulis, riwayat dokumen, artikel panduan, dan pengaturan akun.

Hasil dari RapiMakalah sebaiknya selalu dibuka kembali di Microsoft Word. Perbarui field daftar isi, periksa nomor halaman, dan cocokkan seluruh format dengan pedoman resmi kampus. Pratinjau aplikasi dan estimasi halaman bukan pengganti pemeriksaan akhir di Word.

Untuk pengelola, pemeliharaan rutin berupa backup database dan storage, pemantauan health check, serta pembaruan dependency akan menjaga layanan tetap stabil. Simpan manual ini bersama dokumentasi teknis proyek agar dapat dirujuk kembali.

---

# DAFTAR PUSTAKA

1. Microsoft. *Microsoft Word Support* — dokumentasi Page Setup, Styles, Section Break, Page Number, Table of Contents, dan Using the Ruler in Word. https://support.microsoft.com/word
2. React Documentation. https://react.dev/
3. Vite Documentation. https://vite.dev/
4. Express.js Documentation. https://expressjs.com/
5. Prisma Documentation. https://www.prisma.io/docs/
6. Tiptap Documentation. https://tiptap.dev/
7. ECMA International. *Office Open XML File Formats*.
8. Cloudflare. *Cloudflare Tunnel Documentation*. https://developers.cloudflare.com/cloudflare-one/
9. RapiMakalah. Source code, konten panduan, konfigurasi template, dan dokumentasi internal proyek.

---

# LAMPIRAN A — RINGKASAN API

Semua endpoint kecuali yang ditandai publik memerlukan sesi login. Format kesalahan: `{ "error": "..." }`.

| Method | Endpoint | Fungsi | Akses |
| --- | --- | --- | --- |
| GET | `/api/health` | Status server | Publik |
| POST | `/api/auth/register` | Registrasi dan cookie sesi | Publik |
| POST | `/api/auth/login` | Login | Publik |
| POST | `/api/auth/logout` | Hapus cookie sesi | Login |
| GET | `/api/auth/me` | Profil sesi aktif | Login |
| PATCH | `/api/auth/profile` | Ubah nama, institusi, program studi | Login |
| POST | `/api/auth/password` | Ubah password | Login |
| DELETE | `/api/account` | Hapus akun beserta file | Login |
| GET | `/api/dashboard` | Statistik, dokumen terakhir, aktivitas | Login |
| GET | `/api/documents` | Daftar dokumen dengan pencarian dan filter | Login |
| POST | `/api/documents` | Unggah DOCX (`multipart/form-data`, field `file`) | Login |
| POST | `/api/documents/text` | Buat dokumen dari teks | Login |
| GET | `/api/documents/:id` | Detail dokumen | Login |
| GET | `/api/documents/:id/preview` | Pratinjau `variant=original` atau `processed` | Login |
| POST | `/api/documents/:id/analyze` | Jalankan pemeriksaan | Login |
| POST | `/api/documents/:id/live-preview` | Pratinjau cepat perubahan konfigurasi | Login |
| POST | `/api/documents/:id/format` | Terapkan formatting dan simpan hasil | Login |
| POST | `/api/documents/:id/reset` | Hapus hasil, kembali ke asli | Login |
| GET | `/api/documents/:id/download` | Unduh asli atau hasil | Login |
| DELETE | `/api/documents/:id` | Hapus dokumen dan filenya | Login |
| GET | `/api/templates` | Template yang tersedia | Login |
| GET | `/api/templates/:id` | Detail template | Login |
| POST | `/api/templates` | Buat template | Login |
| PUT | `/api/templates/:id` | Ubah template milik sendiri | Login |
| POST | `/api/templates/:id/duplicate` | Duplikasi template | Login |
| DELETE | `/api/templates/:id` | Hapus template milik sendiri | Login |
| POST | `/api/templates/:id/share` | Buat atau ambil kode berbagi | Login |
| DELETE | `/api/templates/:id/share` | Cabut tautan berbagi | Login |
| GET | `/api/share/:shareId` | Ringkasan template dibagikan | Publik |
| POST | `/api/share/:shareId/import` | Simpan salinan ke akun | Login |
| GET | `/api/writing` | Daftar draft | Login |
| POST | `/api/writing` | Buat draft | Login |
| GET | `/api/writing/:id` | Baca draft | Login |
| PUT | `/api/writing/:id` | Simpan draft | Login |
| DELETE | `/api/writing/:id` | Hapus draft | Login |
| POST | `/api/writing/import` | Baca DOCX menjadi HTML editor | Login |
| POST | `/api/writing/:id/original` | Simpan file Word asli draft | Login |
| GET | `/api/writing/:id/original` | Ambil file Word asli draft | Login |
| GET | `/api/writing/:id/download` | Ekspor draft sebagai DOCX | Login |
| GET | `/api/admin/stats` | Statistik global | Admin |
| GET | `/api/admin/users` | Daftar pengguna | Admin |
| POST | `/api/admin/users/:id/reset-password` | Reset password pengguna | Admin |
| DELETE | `/api/admin/users/:id` | Hapus pengguna | Admin |

Contoh pemeriksaan health:

```powershell
curl.exe https://domain-anda.example/api/health
```

```json
{ "ok": true, "service": "paperly", "time": "2026-11-19T00:00:00.000Z" }
```

---

# LAMPIRAN B — FAQ DAN MASALAH UMUM

**Daftar isi di Word semua nomornya 1.**
Buka Word, klik kanan pada daftar isi, pilih **Update Field**, lalu **Update entire table**. Pastikan dokumen tidak sedang dalam Protected View.

**Login berhasil tetapi langsung logout.**
Pastikan membuka situs melalui `https://`. Dengan `COOKIE_SECURE=true`, cookie tidak dikirim melalui HTTP.

**Unggahan ditolak padahal ekstensi `.docx`.**
Pastikan file benar-benar DOCX, bukan file `.doc` yang diganti nama, tidak terenkripsi password, dan ukurannya di bawah 20 MB. Pesan seperti “File bukan DOCX yang valid” berarti struktur OOXML tidak terbaca.

**Preview berbeda dengan Word.**
Pratinjau adalah render struktural. Nomor halaman, pagination, dan tata letak final ditentukan Word.

**Perubahan pengaturan tidak muncul di file unduhan.**
Pratinjau otomatis hanya menampilkan perkiraan. Jalankan **Terapkan formatting** agar file hasil dibuat, lalu unduh.

**Logo cover gepeng.**
Gunakan versi terbaru dan unggah ulang logo. Aplikasi mempertahankan rasio asli dan membatasi sisi terpanjang 600 piksel.

**Cover pecah menjadi dua halaman.**
Kurangi jumlah anggota atau panjang judul. Jarak antar-baris menyusut otomatis, tetapi kombinasi judul sangat panjang dan anggota sangat banyak dapat melebihi satu halaman.

**Dokumen gagal diproses.**
File asli tetap aman. Periksa pesan kesalahan pada bilah merah di workspace. Bila berulang, unduh file asli, buka di Word, simpan ulang sebagai DOCX baru, lalu unggah kembali.

**Template kustom tidak mengikuti pengaturan baru.**
Template lama memakai nilai default untuk field yang baru ditambahkan. Buka template, periksa bagian yang dimaksud, lalu simpan ulang.

**Kode template tidak ditemukan.**
Tautan mungkin sudah dicabut pemilik. Minta kode baru. Kode terdiri dari 8 karakter dan peka terhadap karakter yang mirip.

**Draft menulis gagal menyimpan.**
Periksa status pada bilah judul. Bila muncul “Gagal menyimpan”, tekan **Simpan**. Bila draft terlalu besar, kurangi gambar atau teks.

**Gambar tidak bisa disisipkan di editor.**
Pastikan format PNG/JPG dan ukuran maksimal 700 KB. Draft juga dibatasi sekitar 1,8 MB.

**Impor Word ke editor kehilangan daftar isi otomatis.**
Daftar isi Word diimpor sebagai teks statis. Perbarui melalui **Sisipkan → Perbarui daftar isi** atau susun ulang setelah impor.

**Halaman menulis tidak bisa mengganti margin.**
Editor menulis memakai A4 dengan margin kiri 4 cm dan sisi lain 3 cm. Margin khusus hanya terbaca dari impor Word; ekspor tetap memakai format baku editor.

**Situs menampilkan 502 atau tidak dapat dijangkau.**
Cek server pada port 4001 dan status tunnel. Bila hanya satu perangkat yang gagal, flush DNS atau ganti DNS ke 1.1.1.1.

**Lupa password.**
Hubungi administrator. Admin dapat membuat password sementara dari Admin Panel.

---

# LAMPIRAN C — ARTI STATUS PEMERIKSAAN

Tabel 14. Status temuan pemeriksaan

| Status | Arti | Tindakan yang disarankan |
| --- | --- | --- |
| Sesuai (`ok`) | Nilai pada dokumen sesuai konfigurasi | Tidak perlu diubah |
| Perlu diperiksa (`warning`) | Ada ketidaksesuaian kecil atau nilai yang diwarisi dari style | Periksa manual bagian terkait |
| Tidak sesuai (`error`) | Nilai jelas berbeda dari pedoman | Terapkan formatting atau perbaiki di Word |

Skor pemeriksaan dihitung dari temuan dan ditampilkan pada panel. Skor tinggi bukan jaminan dokumen diterima dosen karena pedoman dapat memuat aturan tambahan di luar yang diperiksa aplikasi.

Catatan teknis: pemeriksaan membaca properti OOXML secara langsung. Nilai efektif yang diwarisi dari style kompleks dapat berbeda dari tampilan Word. Selalu verifikasi hasil akhir.

---

# LAMPIRAN D — NILAI BAWAAN DAN BATAS INPUT

Tabel 15. Nilai bawaan template

| Pengaturan | Nilai bawaan |
| --- | --- |
| Ukuran kertas | A4, portrait |
| Margin | Atas 3 cm, kanan 3 cm, bawah 3 cm, kiri 4 cm |
| Font isi | Times New Roman 12 pt |
| Spasi baris | 1,5 |
| Indentasi baris pertama | 1,25 cm |
| Perataan | Justify |
| Jarak sebelum/sesudah paragraf | 0 pt / 0 pt |
| Heading BAB | Times New Roman 14 pt, tebal, tengah, kapital, sesudah 12 pt |
| Heading subbab | Times New Roman 12 pt, tebal, kiri, sebelum 6 pt, sesudah 6 pt |
| Heading sub-sub bab | Times New Roman 12 pt, tebal, kiri, sebelum 4 pt, sesudah 4 pt |
| Penomoran halaman | Aktif, bawah tengah, cover tanpa nomor, awal Romawi kecil, isi Arab mulai 1 |
| Daftar isi | Aktif, kedalaman 3, judul DAFTAR ISI, judul ikut terdaftar |
| Daftar pustaka | Hanging 1,27 cm, justify, URL jadi tautan |
| Cover | Judul 16 pt, institusi 16 pt, departemen tampil, institusi di dasar halaman |
| Keterangan gambar/tabel | Tidak wajib (dapat diaktifkan) |

Tabel 16. Batas input panel workspace dan editor template

| Nilai | Panel workspace | Editor template |
| --- | --- | --- |
| Ukuran font isi | 8–24 pt | 6–72 pt |
| Spasi baris | 1–3 | 0,8–4 |
| Indentasi baris pertama | 0–3 cm | 0–5 cm |
| Jarak sebelum/sesudah | 0–36 pt | 0–72 pt |
| Margin | 1–6 cm | 0–10 cm |
| Ukuran heading BAB | 10–24 pt | 6–72 pt |
| Ukuran heading subbab | 8–20 pt | 6–72 pt |
| Kedalaman daftar isi | 1–4 | 1–5 |
| Nama template | — | 80 karakter |
| Deskripsi template | — | 300 karakter |
| Judul draft menulis | 120 karakter | — |
| Gambar draft menulis | 700 KB per gambar | — |
| Unggahan DOCX | 20 MB | — |
| Teks yang ditempel | 500.000 karakter | — |

---

*Akhir manual book.*
