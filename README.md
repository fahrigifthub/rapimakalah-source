# RapiMakalah

**RapiMakalah** adalah aplikasi web untuk **memeriksa dan merapikan format dokumen akademik `.docx`** — makalah, laporan praktikum, proposal, laporan PKL, dan skripsi. Format diterapkan langsung ke OOXML di dalam file Word asli, bukan dengan membangun ulang dokumen dari HTML, sehingga isi, tabel, gambar, hyperlink, dan catatan kaki tetap utuh.

- URL situs dan health check: isi sesuai alamat deployment Anda (`/api/health`)

> RapiMakalah membantu, bukan menggantikan pemeriksaan akhir di Microsoft Word. Preview bersifat struktural dan pagination adalah estimasi.

**Versi:** 1.0.0 | **Tech stack:** React + Vite, Express, Prisma, JSZip/OOXML | **Nama internal kode:** Paperly

## Tangkapan Layar

| Beranda | Dashboard |
| --- | --- |
| ![Beranda RapiMakalah](docs/screenshots/01-beranda.png) | ![Dashboard pengguna](docs/screenshots/03-dashboard.png) |

| Pemeriksaan format | Hasil formatting |
| --- | --- |
| ![Pemeriksaan format](docs/screenshots/06-pemeriksaan.png) | ![Hasil formatting](docs/screenshots/07-hasil-format.png) |

| Workspace menulis | Panel administrator |
| --- | --- |
| ![Workspace menulis](docs/screenshots/11-menulis.png) | ![Panel administrator](docs/screenshots/12-admin.png) |

Seluruh tangkapan layar tersedia di [`docs/screenshots`](docs/screenshots) dan dipakai sebagai gambar pada manual book.

## Changelog

Workspace Menulis memakai susunan ribbon terinspirasi Word: File, Beranda, Sisipkan, Tata Letak, Tampilan, dan tab kontekstual Tabel/Gambar. Font (Times New Roman, Arial, Calibri, Cambria, Georgia, Verdana), ukuran 8–72 pt, warna teks, sorotan, coret dan hapus format tersedia di Beranda; format tersebut ikut tersimpan dan diekspor ke DOCX. Panel navigasi dapat mencari paragraf dan melompat ke heading. Status bar menampilkan jumlah kata/halaman dan zoom (sesuaikan layar, 50–150%); tersedia mode fokus. Zoom-fit menskalakan halaman dan kontennya bersama agar tampilan serta jumlah halaman konsisten di HP dan laptop. Analisis desain, referensi Microsoft, dan daftar fitur lanjutan yang belum tersedia ada di [docs/word-workspace-design.md](docs/word-workspace-design.md). Workspace ini belum memiliki seluruh kemampuan Microsoft Word.

Penggaris Menulis mengikuti [dokumentasi resmi Microsoft Word](https://support.microsoft.com/en-gb/word/using-the-ruler-in-word): segitiga atas mengatur baris pertama, segitiga bawah mengatur hanging indent sambil mempertahankan posisi baris pertama, kotak bawah menggeser kedua penanda kiri bersama, dan segitiga kanan mengatur batas kanan paragraf. Skala cm mencakup lebar A4 dengan zona margin abu-abu dan area teks putih. Panel angka Indentasi paragraf dapat dibuka bila diperlukan; penanda mendukung drag dan tombol panah (0,1 cm), Home, serta End. Penggaris vertikal dan garis batas teks dibuat lebih halus. Tab stop dan pengubahan margin halaman lewat ruler belum tersedia.

Workspace Menulis membagi area editor menjadi kertas A4 terpisah secara otomatis. Saat isi melewati batas area teks, kertas berikutnya muncul dengan jarak antarhalaman; saat isi dihapus, kertas kosong yang tidak diperlukan ikut hilang. Pagination otomatis hanya mengubah tampilan dan tidak menambah node pada JSON draft. Pemisah halaman manual dari menu Insert tetap tersimpan dan ikut diekspor. Jumlah halaman DOCX dapat berbeda karena pengukuran font dan tata letak aplikasi Word. Baris tabel yang lebih tinggi dari area teks belum dapat dipecah otomatis.

Workspace Menulis memiliki penggaris vertikal berskala A4 dan batas area teks yang dapat disembunyikan. Kontrol Paragraf mengatur jarak Sebelum/Sesudah (pt) dan Spasi baris; nilainya tersimpan pada paragraf dan ikut diekspor ke Word. Garis panduan hanya tampil di editor dan tidak dicetak. Penggaris vertikal dimulai ulang pada setiap lembar A4 editor.

Workspace **Menulis** tersedia terpisah di `/app/writing` untuk membuat makalah dari HP atau laptop. Mendukung heading 1–3, bold/italic/underline, perataan, bullet/nomor, undo/redo, autosave ke akun, pemulihan perubahan lokal, dan unduh DOCX. Format ekspor: A4, Times New Roman 12 pt, spasi 1,5, margin kiri 4 cm dan sisi lain 3 cm. Komentar dan track changes belum tersedia. Alur unggah dan workspace pemformatan lama tetap terpisah.

Workspace Menulis juga mendukung penggaris indent kiri/kanan/baris pertama (drag sentuh, keyboard, atau angka cm), Insert gambar PNG/JPG (maksimum 700 KB per gambar), tabel dengan tambah/hapus baris/kolom dan gabung/pisah sel, serta pemisah halaman. Pengaturan tersebut ikut diekspor ke DOCX. Tombol Upload Word mengimpor `.docx` melalui `POST /api/writing/import` lalu membuka salinan sebagai draft baru; draft sekarang disimpan dahulu. Impor mengambil teks, heading, tabel dan gambar, tetapi tata halaman, header/footer, field daftar isi dan fitur Word lanjutan dapat berubah atau hilang. Editor ini belum setara Microsoft Word penuh. Ukuran draft termasuk gambar dibatasi oleh batas JSON API 2 MB.

Draft editor disimpan di `server/storage/writing/<userId>/<draftId>.json`; ikut sertakan seluruh folder storage saat backup. Endpoint `/api/writing` (GET/POST), `/api/writing/:id` (GET/PUT/DELETE), dan `/api/writing/:id/download` (GET) memerlukan login dan hanya mengakses folder pengguna yang bersangkutan.

| Tanggal | Ringkasan (terbaru di atas) |
| --- | --- |
| 2026-11-24 | Login/daftar dengan Google opsional, kelola password dan hapus akun dengan verifikasi ulang; JWT produksi wajib memakai secret kuat |
| 2026-11-24 | Perlindungan upload DOCX memeriksa ukuran ZIP sebelum ekstraksi; preview terbaru tidak lagi tertukar dengan cache lama |
| 2026-11-24 | Preview cover menahan blok institusi di bagian bawah; tabel Markdown dari DOCX lama dipulihkan meski antarbaris disela paragraf kosong |
| 2026-11-24 | Daftar bernomor literal dari DOCX lama dikonversi ke numbering Word dan paragraf penjelas sejajar dengan teks item |
| 2026-11-22 | Cover anggota: tabel transparan dua kolom menjaga nama dan NIM tetap sejajar |
| 2026-11-22 | Perbaikan DOCX hasil teks tempel: content type `rapimakalah/source.json` didaftarkan agar Microsoft Word tidak menganggap file rusak |
| 2026-11-21 | Galeri template publik `/galeri`: terbitkan/tarik template kustom, pencarian dan filter kategori, salin ke akun |
| 2026-11-15 | Berbagi template: kode 8 karakter, halaman publik `/t/<kode>` (noindex), impor salinan identik, cabut tautan |
| 2026-11-14 | Admin panel (analitik + reset password) dan 8 halaman panduan SEO `/panduan` dengan JSON-LD Article |
| 2026-11-13 | README lengkap, aksesibilitas kontras, heading landmark, backup script |

## Catatan Teknis

Beberapa identifier di kode masih bernama `paperly`: cookie `paperly_token`, ekstensi `.paperly.docx`, rel `rIdPaperly*`, nama layanan pada health check, dan nama folder/node_modules. Ini sengaja tidak diubah agar data dan template lama tetap valid.

---

## Daftar Isi

- [Bab I Pendahuluan](#bab-i-pendahuluan)
  - [1.1 Deskripsi Program](#11-deskripsi-program)
  - [1.2 Tujuan dan Manfaat](#12-tujuan-dan-manfaat)
  - [1.3 Sasaran Pengguna](#13-sasaran-pengguna)
  - [1.4 Teknologi yang Digunakan](#14-teknologi-yang-digunakan)
  - [1.5 Struktur Proyek](#15-struktur-proyek)
  - [1.6 Persyaratan Sistem](#16-persyaratan-sistem)
- [Bab II Fitur Program](#bab-ii-fitur-program)
  - [2.1 Ringkasan](#21-ringkasan)
  - [2.2 Pemrosesan Dokumen](#22-pemrosesan-dokumen)
  - [2.3 Pemeriksa Format](#23-pemeriksa-format)
  - [2.4 Tata Letak Akademik](#24-tata-letak-akademik)
  - [2.5 Cover, Kata Pengantar, Daftar Pustaka](#25-cover-kata-pengantar-daftar-pustaka)
  - [2.6 Template Pedoman](#26-template-pedoman)
  - [2.7 Akun, Riwayat, Dashboard](#27-akun-riwayat-dashboard)
  - [2.8 Keamanan dan Privasi](#28-keamanan-dan-privasi)
  - [2.9 Batasan yang Diketahui](#29-batasan-yang-diketahui)
- [Bab III Instalasi](#bab-iii-instalasi)
  - [3.1 Prasyarat](#31-prasyarat)
  - [3.2 Proses Instalasi Lokal](#32-proses-instalasi-lokal)
  - [3.3 Konfigurasi Environment](#33-konfigurasi-environment)
  - [3.4 Database](#34-database)
  - [3.5 Menjalankan Mode Pengembangan](#35-menjalankan-mode-pengembangan)
  - [3.6 Build Produksi](#36-build-produksi)
  - [3.7 Deployment (opsional)](#37-deployment-opsional)
  - [3.8 Deploy Alternatif (VPS / Docker)](#38-deploy-alternatif-vps--docker)
  - [3.9 SEO dan Google Search Console](#39-seo-dan-google-search-console)
  - [3.10 Troubleshooting Instalasi](#310-troubleshooting-instalasi)
- [Bab IV Penggunaan Program](#bab-iv-penggunaan-program)
  - [4.1 Untuk Pengguna (Mahasiswa)](#41-untuk-pengguna-mahasiswa)
  - [4.2 Untuk Pemilik / Operator](#42-untuk-pemilik--operator)
- [Bab V Pemeliharaan dan Backup](#bab-v-pemeliharaan-dan-backup)
  - [5.1 Apa yang Dibackup](#51-apa-yang-dibackup)
  - [5.2 Cara Backup](#52-cara-backup)
  - [5.3 Cara Restore](#53-cara-restore)
  - [5.4 Update Aplikasi](#54-update-aplikasi)
  - [5.5 Pemantauan](#55-pemantauan)
- [Bab VI Pengujian](#bab-vi-pengujian)
- [Lampiran A — Ringkasan API](#lampiran-a--ringkasan-api)
- [Lampiran B — FAQ dan Masalah Umum](#lampiran-b--faq-dan-masalah-umum)

---

# Bab I Pendahuluan

## 1.1 Deskripsi Program

RapiMakalah adalah platform perapi format dokumen akademik berbasis web. Pengguna mengunggah file Word (`.docx`) atau menulis isi makalah langsung di aplikasi, memilih template pedoman, menjalankan pemeriksaan, lalu menerapkan perbaikan format. Hasilnya diunduh sebagai file `.docx` yang sudah rapi dan tetap bisa diedit di Microsoft Word.

Yang membedakan RapiMakalah dari konverter atau generator dokumen biasa:

1. **Mengedit file asli.** Aplikasi membuka paket OOXML (ZIP berisi XML), lalu memodifikasi `word/document.xml`, `styles.xml`, `numbering.xml`, `settings.xml`, dan bagian terkait. Tabel, gambar, hyperlink, footnote, dan teks tidak dibangun ulang.
2. **Aturan yang transparan.** Setiap temuan menyebut paragraf, nilai yang ditemukan, nilai yang diharapkan, dan rekomendasi. Pengguna memilih aturan mana yang diterapkan.
3. **Penomoran dan daftar isi nyata.** Penomoran halaman dibuat sebagai section break + field `PAGE`, dan daftar isi sebagai field `TOC`, bukan teks statis.
4. **Template yang bisa disesuaikan.** Lima template bawaan disediakan, dan pengguna dapat membuat template kustom sesuai pedoman kampusnya.

## 1.2 Tujuan dan Manfaat

| Tujuan | Manfaat bagi pengguna |
| --- | --- |
| Menyeragamkan format dokumen | Tidak perlu mengatur margin, font, dan spasi paragraf satu per satu |
| Mengurangi kesalahan penomoran | Cover tanpa nomor, bagian awal Romawi kecil, bagian isi Arab mulai 1 |
| Mengotomatiskan daftar isi | Field TOC diisi perkiraan nomor halaman dan bisa diperbarui di Word |
| Menjelaskan temuan format | Pengguna belajar apa yang salah, bukan hanya menerima hasil jadi |
| Menyimpan riwayat | File asli selalu tersimpan, hasil bisa dibandingkan dan diunduh ulang |

## 1.3 Sasaran Pengguna

- **Mahasiswa** yang menyusun makalah, laporan praktikum, proposal, laporan PKL, dan skripsi.
- **Asisten dosen / laboran** yang sering merapikan format dokumen mahasiswa.
- **Pemilik aplikasi** yang menjalankan dan memelihara instalasi (deploy, backup, template bawaan).

## 1.4 Teknologi yang Digunakan

| Lapisan | Teknologi |
| --- | --- |
| Frontend | React 18, Vite, React Router, Tailwind CSS, Lucide Icons |
| Backend | Node.js 20+, Express, Zod, JWT (cookie httpOnly), bcryptjs |
| Database | Prisma ORM — SQLite untuk lokal, varian PostgreSQL disediakan |
| DOCX | JSZip + pemrosesan OOXML langsung (tanpa LibreOffice) |
| Upload | Multer (memory storage) + validasi magic bytes |
| Rumus | LaTeX sederhana → OMML untuk Word, OMML → MathML untuk preview |
| Deploy | Express satu origin di belakang reverse proxy atau tunnel opsional |

## 1.5 Struktur Proyek

```text
rapihinmakalah/
├─ client/                      # React + Vite
│  ├─ public/                   # favicon, robots.txt, sitemap, manifest
│  └─ src/
│     ├─ components/
│     │  ├─ ui/                 # komponen UI umum
│     │  ├─ workspace/          # panel formatting dan preview
│     │  └─ writing/            # ribbon, pagination, ekstensi editor Menulis
│     ├─ content/guides.js      # konten panduan publik (dipakai client + server)
│     ├─ context/               # Auth dan Toast
│     ├─ lib/                   # API client dan helper
│     └─ pages/                 # halaman/rute React
├─ server/
│  ├─ prisma/                   # schema SQLite/PostgreSQL dan seed
│  ├─ scripts/                  # engine test dan alat pemeriksaan
│  ├─ src/
│  │  ├─ docx/                  # baca, format, perbaikan, preview OOXML
│  │  ├─ lib/                   # utilitas, konfigurasi template, storage
│  │  ├─ middleware/            # auth, upload, error handling
│  │  ├─ repairs/               # loader untuk lapisan repair alternatif
│  │  ├─ routes/                # endpoint API per area fitur
│  │  ├─ templates/             # template bawaan
│  │  ├─ validation/            # skema Zod
│  │  ├─ app.js                 # konfigurasi Express dan routing
│  │  └─ index.js               # bootstrap server
│  ├─ storage/                  # DATA PENGGUNA; lokal, tidak di-commit
│  └─ .env.example              # contoh environment; secret asli tidak di-commit
├─ deploy/                      # contoh konfigurasi dan skrip deploy
├─ docs/                        # manual dan catatan desain
├─ docker-compose.yml           # PostgreSQL opsional
├─ package.json                # skrip workspace root
└─ README.md
```

Database lokal (`server/prisma/dev.db`), `server/storage/`, `.env` privat, dependency, hasil build, dan arsip backup sengaja dikecualikan oleh `.gitignore`.

## 1.6 Persyaratan Sistem

**Pengembangan lokal**

- Node.js 20 atau lebih baru, npm 10+
- Windows, macOS, atau Linux
- Tidak wajib Docker; SQLite sudah cukup

**Produksi**

- Node.js 20+
- `cloudflared` dan domain hanya diperlukan bila memilih Cloudflare Tunnel; reverse proxy lain juga didukung
- RAM minimal 1 GB, penyimpanan sesuai jumlah dokumen (rata-rata 1–2 MB per dokumen)

---

# Bab II Fitur Program

## 2.1 Ringkasan

| Kelompok | Fitur |
| --- | --- |
| Input | Unggah DOCX (maks. 20 MB), tulis teks makalah langsung di aplikasi |
| Pemeriksa | Font, ukuran, spasi, indentasi, perataan, heading, margin, halaman kosong, caption |
| Format | Margin, typography, heading, spasi, indentasi, perataan, tabel, style default |
| Halaman | Cover tanpa nomor, bagian awal Romawi, bagian isi Arab dengan restart |
| Navigasi | Field TOC, preview struktural, outline halaman, penanda temuan |
| Cover | Judul, jenis dokumen, mata kuliah, dosen, anggota + NIM, logo, institusi, departemen |
| Isi | Sub-bab menggantung, label A/B/C, rumus LaTeX, daftar pustaka bertaut |
| Template | Template Makalah bawaan, template kustom, duplikasi, editor konfigurasi, isian cover bawaan |
| Galeri | Terbitkan template kustom ke galeri publik `/galeri`, cari/filter, salin ke akun |
| Akun | Registrasi/login email-password atau Google, profil, password lokal opsional, hapus akun dengan verifikasi |
| Riwayat | Pencarian, filter status, pagination, unduh ulang, hapus dokumen |

## 2.2 Pemrosesan Dokumen

### 2.2.1 Unggah DOCX

Validasi berlapis sebelum file diproses:

1. Ekstensi `.docx` dan MIME type.
2. Signature ZIP (`PK`) pada byte awal file.
3. Keberadaan `[Content_Types].xml` dan `word/document.xml`.
4. Batas ukuran hasil ekstraksi (proteksi zip bomb).
5. Batas ukuran upload `MAX_UPLOAD_MB` (default 20 MB).

Isi DOCX baru diparse setelah ukuran dekompresi seluruh ZIP diverifikasi (maksimum 200 MB); entri yang ukurannya tidak dapat diverifikasi ditolak.

File disimpan dengan nama UUID di `server/storage/<userId>/`. Nama asli hanya disimpan sebagai metadata.

### 2.2.2 Input Teks

Selain unggah, pengguna bisa menulis isi makalah langsung. Teks diubah menjadi DOCX dasar oleh `server/src/docx/fromText.js`:

- `# Judul` menjadi heading level 1 (biasanya judul bab).
- `##` dan `###` menjadi sub-bab.
- Daftar bernomor dan berbutir tetap berupa daftar.
- `$$...$$` atau `$...$` diubah dari LaTeX menjadi OMML (rumus native Word).

Hasilnya kemudian melewati pipeline format yang sama dengan file unggahan.

### 2.2.3 Pemeriksa Format

Kategori yang diperiksa: `font`, `fontSize`, `lineSpacing`, `indentation`, `alignment`, `headings`, `margins`, `blankPages`, `captions`.

Setiap temuan berisi blok/paragraf, nilai ditemukan, nilai diharapkan, tingkat keparahan (`ok` / `warning` / `error`), dan rekomendasi. Skor 0–100 dihitung dari temuan dan ditampilkan di dashboard.

### 2.2.4 Penerapan Format

Pengguna memilih aturan yang ingin diterapkan. Format paragraf dan run diterapkan pada `word/document.xml`; teks dalam tabel ikut diproses. Proses selalu berangkat dari file asli, sehingga hasil disimpan terpisah dan file asli tetap utuh.

### 2.2.5 Preview dan Perbandingan

- Preview dirender dari struktur OOXML, bukan mesin layout Word.
- Tersedia tampilan **asli** dan **hasil** untuk dibandingkan.
- Preview ikut memperbarui pengaturan secara langsung (debounce 700 ms), tanpa harus menekan tombol format.
- Rumus OMML ditampilkan sebagai MathML, URL pada daftar pustaka menjadi tautan.

## 2.3 Pemeriksa Format

| Pemeriksaan | Contoh temuan |
| --- | --- |
| Margin | "Margin halaman 2,5 cm, template 4 cm" |
| Font | "Calibri 11 pt ditemukan. Template: Times New Roman" |
| Spasi baris | "1,0× pada 6 paragraf. Template: 1,5×" |
| Indentasi | "Baris pertama tidak menjorok 1,25 cm" |
| Perataan | "Paragraf isi rata kiri, template justify" |
| Heading | "BAB tidak memakai style heading" |
| Halaman kosong | "Halaman kosong setelah BAB II" |
| Caption | "Gambar tanpa keterangan" (opsional) |

## 2.4 Tata Letak Akademik

### 2.4.1 Penomoran Halaman

Dibuat dengan section break nyata + footer + `w:pgNumType`:

| Bagian | Format | Mulai |
| --- | --- | --- |
| Cover | tanpa nomor | — |
| Bagian awal (kata pengantar, daftar isi) | Romawi kecil (`i, ii, iii`) | 1 |
| Bagian isi (BAB I dst.) | Arab (`1, 2, 3`) | 1 |

Posisi nomor (bawah tengah / kanan) dan format bagian awal dapat diubah di panel format atau template.

### 2.4.2 Heading dan Sub-bab

- Heading dideteksi dari style (`Heading 1..N`), `w:outlineLvl`, dan pola teks seperti `BAB I`.
- Penomoran BAB/sub-bab memakai `abstractNum` dan `numId` khusus agar tidak bertabrakan dengan penomoran pengguna.
- Sub-bab memakai hanging indent dengan tab (default 1,25 cm atau 1,5 cm), badan paragraf sejajar dengan teks judul.
- Daftar literal lama seperti `1.` pada DOCX dikonversi ke numbering Word asli; paragraf penjelas setelah item rata sejajar dengan teks item.
- Label **A/B/C** di bawah sub-bab bukan heading: paragraf tebal `keepNext`, menjorok 425 twip dari sub-bab, dengan tab setelah huruf. Isi di bawahnya sejajar dengan teks label.

### 2.4.3 Daftar Isi

- Disisipkan sebagai field `TOC \o "1-N" \h \z \u`, bukan daftar statis.
- Entri diisi lebih dulu oleh RapiMakalah (estimasi nomor halaman), jadi daftar tidak kosong saat dibuka.
- Judul "DAFTAR ISI" bisa ikut didaftarkan atau tidak (opsi template `toc.includeTocTitle`).
- Kedalaman heading dapat diatur (1–5).
- Word bisa memperbarui field jika pengguna ingin pagination Word yang sebenarnya.

### 2.4.4 Rumus

- `$...$` dan `$$...$$` diubah menjadi OMML di Word dan MathML di preview.
- Rumus yang belum lengkap (misalnya `θ_1` tanpa blok) dipertahankan sebagai teks.

## 2.5 Cover, Kata Pengantar, Daftar Pustaka

### 2.5.1 Cover

- Semua baris cover rata tengah dan memakai placeholder yang jelas bila kosong.
- Isian: jenis dokumen, judul, mata kuliah, dosen pengampu, anggota (nama + NIM), program studi, departemen, fakultas, universitas, tahun.
- **Logo** diunggah atau ditempel dari clipboard, dengan slider ukuran. Rasio asli gambar dipertahankan sehingga logo tidak gepeng.
- **Blok bawah** (program studi sampai tahun) ditempel di dasar halaman memakai frame, ukurannya sama dengan judul.
- Preview hasil mengenali blok institusi berbingkai sebagai bagian cover dan menahannya di bawah halaman, termasuk pada DOCX dengan batas halaman sumber yang tidak biasa.
- Baris tabel Markdown lama yang tersimpan sebagai paragraf dipulihkan menjadi tabel Word, termasuk bila paragraf kosong menyela baris-barisnya; tabel tampil sebagai tabel di preview.
- `coverFit` menyusutkan jarak antar-baris otomatis supaya cover tetap satu halaman walau anggota bertambah.
- Anggota bisa ditambah dan dihapus satu per satu.
- Bila anggota lebih dari satu, nama dan NIM disusun dalam tabel dua kolom dengan **border transparan**. Kolom tetap sejajar saat anggota bertambah, tetapi tabel tidak terlihat sebagai tabel di Word.
- Tabel cover lama yang masih bergaris (mis. tabel buatan pengguna dengan judul "Nama | NIM") ikut dirapikan: bordernya disembunyikan dan baris judulnya dibuang saat dokumen diformat ulang. Tabel isi makalah tidak disentuh.
- Isian cover bawaan dapat disimpan di template; isian di workspace menimpa nilai template.

### 2.5.2 Kata Pengantar

- Dibuat otomatis bila belum ada: judul, paragraf pembuka, dan blok tanda tangan.
- Blok tanda tangan berisi `Tempat, tanggal`, ruang kosong untuk tanda tangan, lalu nama.
- Jika baris tanggal tidak memuat angka hari, tanggal hari ini ditambahkan otomatis. Baris yang sudah memuat angka hari tidak diubah.

### 2.5.3 Daftar Pustaka

- Tanpa nomor, menggantung (default 1,27 cm), style Bibliography.
- URL otomatis menjadi hyperlink biru yang bisa diklik di Word.
- Perataan dapat diatur (default justify).

## 2.6 Template Pedoman

- **Template bawaan yang ditampilkan: Makalah.** Template bawaan lain yang lama tetap disimpan agar dokumen lama dapat dibuka; template kustom pengguna tetap tersedia. Template bawaan bersifat read-only; duplikat dahulu untuk mengedit.
- **Template kustom** menyimpan seluruh konfigurasi: kertas, margin, typography, heading, penomoran, daftar isi, daftar pustaka, cover (ukuran judul/institusi, tampil/tidak departemen, logo, isian bawaan), caption.
- **Editor template** memiliki preview konfigurasi dan validasi skema Zod di server.
- **Berbagi template**: pemilik template kustom dapat membuat kode 8 karakter (tanpa `0/O/1/I/l`) dan membagikan tautan `/t/<kode>`. Halaman berbagi bersifat publik untuk dilihat (memuat ringkasan margin, font, heading, penomoran, daftar isi, serta nama pemilik), tetapi **tidak diindeks mesin pencari**. Penerima yang masuk/daftar dapat menekan “Simpan ke akun saya”; salinan dibuat dengan menyalin JSON konfigurasi apa adanya, jadi hasilnya identik, lalu menjadi milik penerima (bebas diubah tanpa memengaruhi aslinya). Nama yang bentrok otomatis menjadi `Nama (2)`. Pemilik dapat mencabut tautan kapan saja; tautan lama langsung 404.
- **Galeri publik**: template kustom dapat diterbitkan lewat tombol globe di halaman Template, lalu muncul di `/galeri` dan dapat diindeks mesin pencari. Berbeda dari tautan berbagi, galeri bisa dicari dan difilter berdasarkan kategori tanpa perlu tautan. Pengguna yang login dapat menyimpan salinan (`POST /api/gallery/:id/use`); salinan independen dan tidak otomatis ikut terbit. Pemilik dapat menarik template dari galeri kapan saja. Status `isPublished` sengaja terpisah dari `shareId` agar template yang hanya dibagikan ke teman tidak otomatis tampil untuk umum. Template bawaan tidak dapat diterbitkan; duplikat dahulu. Template yang diterbitkan akun **admin** ditampilkan dengan nama **“Anonim”** di galeri dan halaman berbagi; institusi serta program studi tidak ikut ditampilkan.
- Template lama yang belum memiliki bagian baru tetap valid karena semua field baru punya nilai default.

Contoh konfigurasi:

```json
{
  "page": { "size": "A4", "orientation": "portrait", "margins": { "top": 3, "right": 3, "bottom": 3, "left": 4 } },
  "typography": { "fontFamily": "Times New Roman", "fontSize": 12, "lineSpacing": 1.5, "firstLineIndent": 1.25 },
  "headings": { "chapter": {}, "subheading": {}, "subsubheading": {} },
  "pageNumbering": { "enabled": true, "frontMatter": "lowerRoman", "body": "decimal" },
  "toc": { "enabled": true, "depth": 3, "includeTocTitle": true, "title": "DAFTAR ISI" },
  "bibliography": { "linkUrls": true, "hangingIndent": 1.27, "alignment": "justify" },
  "cover": { "titleSize": 16, "institutionSize": 16, "showDepartment": true, "institutionAtBottom": true }
}
```

## 2.7 Akun, Riwayat, Dashboard

- Registrasi dan login memakai cookie httpOnly, bukan token di `localStorage`.
- Login/pendaftaran Google opsional melalui Google Identity Services. Akun lokal yang sudah ada tidak otomatis ditautkan hanya karena alamat emailnya sama.
- Akun Google dapat menambahkan password lokal dari Pengaturan; penghapusan akun perlu password atau verifikasi ulang Google.
- Dashboard menampilkan jumlah dokumen, skor format terakhir, dokumen terbaru, aktivitas, dan template terpakai.
- Riwayat mendukung pencarian, filter status, pagination, unduh ulang, dan hapus.
- Pengaturan akun: ubah nama/institusi/prodi, kelola password, hapus akun beserta seluruh file.

## 2.8 Keamanan dan Privasi

- Password di-hash dengan bcrypt (cost 12).
- JWT di cookie httpOnly; `COOKIE_SECURE=true` di produksi HTTPS.
- `JWT_SECRET` harus diatur eksplisit, acak, dan minimal 32 karakter di produksi; server menolak nilai default atau placeholder.
- Rate limit global 600 permintaan / 15 menit, plus limit terpisah untuk autentikasi.
- Token Google diverifikasi server terhadap OAuth Client ID aplikasi; email harus terverifikasi.
- Validasi DOCX menolak ZIP yang ukuran dekompresinya tidak bisa diverifikasi atau melebihi batas.
- Semua endpoint dokumen dan template memeriksa kepemilikan pengguna.
- Nama file penyimpanan UUID; path diverifikasi agar tidak keluar dari direktori pengguna.
- Helmet, CORS terbatas pada `CLIENT_ORIGIN`, dan `X-Content-Type-Options: nosniff` pada unduhan.
- Isi dokumen tidak digunakan untuk pelatihan model.

## 2.9 Batasan yang Diketahui

- Hanya `.docx`; `.doc`, `.pdf`, dan DOCX rusak/terenkripsi ditolak.
- Tidak ada konversi ke PDF dan tidak ada render identik dengan Word.
- Pagination preview adalah estimasi; jumlah halaman final ditentukan Word.
- Tabel kompleks (merge sel, text box, shape) ditampilkan sederhana di preview.
- Tabel Markdown lama yang masih berupa paragraf dipulihkan bila pola header/pemisah/barisnya konsisten; paragraf kosong di antara baris juga didukung.
- Heuristik cover dan batas bagian awal/isi bisa perlu penyesuaian pada struktur dokumen yang tidak umum.
- Nomor halaman pada daftar isi bisa berbeda tipis dari Word; perbarui field bila perlu.

---

# Bab III Instalasi

## 3.1 Prasyarat

| Kebutuhan | Versi | Catatan |
| --- | --- | --- |
| Node.js | 20 atau lebih baru | `node -v` |
| npm | 10+ | ikut Node |
| Git | opsional | untuk versioning |
| `cloudflared` | terbaru | opsional, hanya untuk Cloudflare Tunnel |

Cek cepat:

```powershell
node -v
npm -v
```

Jika eksekusi script npm diblokir di PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

## 3.2 Proses Instalasi Lokal

1. **Masuk ke folder proyek**

   ```powershell
   cd /path/to/rapimakalah
   ```

2. **Install dependency root, server, dan client**

   ```powershell
   npm install
   npm run install:all
   ```

3. **Salin konfigurasi environment server**

   ```powershell
   Copy-Item server\.env.example server\.env
   ```

   Lalu buka `server\.env` dan ganti `JWT_SECRET` dengan string acak panjang (minimal 32 karakter).

4. **Siapkan database dan template bawaan**

   Pada clone baru dengan database lokal kosong, buat schema dan seed template:

   ```powershell
   npm run db:setup
   ```

   `db:setup` menjalankan `prisma db push` lalu seed template bawaan. Jangan gunakan pada database berisi data sebelum backup terverifikasi dan rencana perubahan schema diperiksa. `npm run setup` hanya memasang dependency.

   Login Google opsional. Untuk development, isi `GOOGLE_CLIENT_ID` pada `server/.env` dan daftarkan `http://localhost:5173` sebagai **Authorized JavaScript origin** di Google Cloud Console. Jika memakai database lama, backup dahulu dan tinjau perubahan schema (`googleSub`, password nullable) sebelum menjalankan `npm --prefix server run db:push`.

5. **Jalankan aplikasi**

   ```powershell
   npm run dev
   ```

6. **Buka browser**

   - Frontend: <http://localhost:5173>
   - API: <http://localhost:4000>
   - Vite mem-proxy `/api` ke backend.

## 3.3 Konfigurasi Environment

Berkas: `server/.env` (pengembangan) dan `server/.env.production` (produksi).

| Variable | Default | Keterangan |
| --- | --- | --- |
| `PORT` | `4000` | Port API/Express. Produksi di proyek ini memakai `4001` |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Origin yang diizinkan CORS |
| `CANONICAL_URL` | sama dengan `CLIENT_ORIGIN` | URL publik untuk canonical, Open Graph, JSON-LD (tidak boleh diakhiri `/`) |
| `JWT_SECRET` | placeholder | Wajib diganti; produksi menolak secret default/placeholder dan secret kurang dari 32 karakter |
| `GOOGLE_CLIENT_ID` | kosong | Opsional; OAuth Client ID tipe Web application untuk login Google |
| `DATABASE_URL` | `file:./dev.db` | SQLite lokal atau URL PostgreSQL |
| `STORAGE_DIR` | `./storage` | Direktori file, relatif terhadap `server/` |
| `MAX_UPLOAD_MB` | `20` | Batas ukuran upload |
| `COOKIE_SECURE` | `false` | Set `true` bila memakai HTTPS |
| `NODE_ENV` | — | Set `production` di server produksi |

Membuat JWT secret acak:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## 3.4 Database

### 3.4.1 SQLite (default)

```powershell
# Hanya untuk database baru/kosong, atau setelah backup terverifikasi:
npm --prefix server run db:push
npm --prefix server run db:seed
```

Untuk setup lokal dari nol di clone baru, `db:push` membentuk schema pada database lokal tersebut. Jangan arahkan perintah setup ke database produksi/aktif.

- Database: `server/prisma/dev.db`
- File upload: `server/storage/<userId>/`

### 3.4.2 PostgreSQL (opsional)

1. Jalankan PostgreSQL (contoh memakai Docker bawaan proyek):

   ```powershell
   docker compose up -d db
   ```

2. Simpan schema SQLite lalu pakai schema PostgreSQL:

   ```powershell
   Copy-Item server\prisma\schema.prisma server\prisma\schema.sqlite.prisma.bak
   Copy-Item server\prisma\schema.postgres.prisma server\prisma\schema.prisma
   ```

3. Ubah `server/.env`:

   ```env
   DATABASE_URL="postgresql://paperly:paperly_dev_password@localhost:5432/paperly?schema=public"
   ```

4. Generate Prisma Client dan seed:

   ```powershell
   # Hanya untuk database PostgreSQL baru/kosong atau setelah backup terverifikasi:
   npm --prefix server run prisma:generate
   npm --prefix server run db:push
   npm --prefix server run db:seed
   ```

Kembali ke SQLite: pulihkan `schema.sqlite.prisma.bak` menjadi `schema.prisma` dan set `DATABASE_URL="file:./dev.db"`. Jalankan `db:push` hanya setelah memverifikasi target database serta backup dan memeriksa perubahan schema.

> Proyek memakai `prisma db push` (cocok untuk pengembangan). Untuk produksi jangka panjang, buat migrasi `prisma migrate deploy`.

## 3.5 Menjalankan Mode Pengembangan

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server (`node --watch`, port 4000) + Vite (5173) sekaligus |
| `npm --prefix server run dev` | Backend saja |
| `npm --prefix client run dev` | Frontend saja |
| `npm run setup` | Install dependency saja (tanpa migrasi database) |
| `npm run db:setup` | `db push` + seed template; hanya clone baru/database kosong |
| `npm run build` | Build client ke `client/dist` |
| `npm start` | Jalankan server produksi (menyajikan `client/dist`) |

## 3.6 Build Produksi

```powershell
npm run build      # build client ke client/dist
npm start          # Express menyajikan API + client/dist di PORT
```

Server otomatis menyajikan `client/dist` bila folder itu ada, sehingga frontend dan API berada di satu origin. Ini yang membuat deploy cukup satu domain dan satu tunnel.

## 3.7 Deployment (opsional)

Arsitektur contoh: **Express → reverse proxy/tunnel → domain Anda**. Hostname dan kredensial tunnel dikonfigurasi lokal dan tidak disimpan di Git.

### 3.7.1 Berkas Deploy

| Berkas | Fungsi |
| --- | --- |
| `deploy/cloudflared-config.example.yml` | Template tunnel generik; salin ke `cloudflared-config.yml` dan isi konfigurasi lokal (file aktual di-ignore Git) |
| `deploy/run.ps1` | Build client, lalu jalankan server produksi dan tunnel; migrasi database dijalankan manual setelah backup |
| `deploy/start.cmd` | Klik dua kali untuk menjalankan `run.ps1` |
| Skrip DNS lokal | Tidak disertakan; buat record DNS di dashboard provider Anda atau simpan skrip privat di mesin deploy |
| `deploy/env.production.example` | Contoh isi `server/.env.production` |
| `server/.env.production` | Konfigurasi produksi lokal; jangan commit (contoh ada di `deploy/env.production.example`) |

### 3.7.2 Prasyarat Domain

1. Domain dan DNS dikelola oleh provider pilihan Anda.
2. Jika memakai Cloudflare Tunnel, buat tunnel pada akun Anda dan salin `deploy/cloudflared-config.example.yml` menjadi `deploy/cloudflared-config.yml`.
3. Ganti `YOUR_TUNNEL_ID`, path `credentials-file`, dan hostname dengan milik Anda. Buat record DNS yang diarahkan ke tunnel tersebut melalui dashboard Cloudflare.

### 3.7.3 Menyiapkan Konfigurasi Produksi

```powershell
Copy-Item deploy\env.production.example server\.env.production
```

Isi `server/.env.production`:

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

`PORT=4001` dipakai supaya server pengembangan di port 4000 tidak bentrok.

### 3.7.4 Menjalankan Situs

```powershell
powershell -ExecutionPolicy Bypass -File deploy\run.ps1
```

atau klik dua kali `deploy\start.cmd`.

`run.ps1` melakukan:

1. `npm --prefix client run build`
2. Menjalankan `node src/index.js` dengan environment dari `server/.env.production`
3. Menjalankan `cloudflared tunnel --config deploy\cloudflared-config.yml run`

> `run.ps1` tidak menjalankan migrasi database otomatis. Backup database dan storage dulu; untuk schema yang berubah, jalankan migrasi secara eksplisit setelah memeriksa target `DATABASE_URL`.

Jendela harus tetap terbuka selama situs dipakai. `Ctrl+C` menghentikan tunnel sekaligus server.

### 3.7.5 Verifikasi

Pastikan `CANONICAL_URL` di environment produksi sama dengan origin publik (tanpa slash akhir). Server mengganti placeholder di `robots.txt` dan `sitemap.xml` dengan nilai tersebut.

```powershell
curl.exe https://<domain-anda>/api/health
```

Respons yang diharapkan:

```json
{ "ok": true, "service": "paperly", "time": "..." }
```

Cek juga:

- Beranda domain Anda → 200
- `/robots.txt` pada domain Anda → 200
- `/sitemap.xml` pada domain Anda → 200

### 3.7.6 HTTPS

1. Pastikan sertifikat TLS provider aktif.
2. Paksa HTTPS di reverse proxy/provider.
3. Karena `COOKIE_SECURE=true`, login hanya berfungsi lewat HTTPS.

### 3.7.7 Menjalankan Otomatis Saat Boot (opsional)

1. Jalankan tunnel sebagai service sesuai petunjuk provider tunnel yang Anda gunakan.
2. Server produksi: buat service/process manager dengan working directory `server` pada clone proyek dan environment produksi yang aman.

## 3.8 Deploy Alternatif (VPS / Docker)

Tanpa Cloudflare Tunnel, gunakan reverse proxy (Nginx/Caddy) ke `http://localhost:4001`.

1. Install Node.js 20+ di server.
2. Clone/copy proyek, lalu:

   ```bash
   npm install
   npm run install:all
   cp deploy/env.production.example server/.env.production
   npm run build
   ```

3. Pastikan `PORT`, `CLIENT_ORIGIN`, `CANONICAL_URL`, `COOKIE_SECURE`, dan `JWT_SECRET` sesuai deployment Anda. Backup database serta storage sebelum migrasi; deploy tidak melakukan migrasi otomatis.
4. Jalankan dengan process manager (PM2/systemd):

   ```bash
   npm --prefix server run start
   ```

5. Arahkan reverse proxy ke port 4001 dan pasang sertifikat HTTPS.

## 3.9 SEO dan Google Search Console

Sudah tersedia di kode:

- `client/public/robots.txt` dan `client/public/sitemap.xml` (beranda, `/panduan`, 8 artikel, daftar, masuk)
- **Halaman panduan publik** di `/panduan` dan `/panduan/<slug>`: margin 4-4-3-3, daftar pustaka, penomoran halaman, struktur makalah, kata pengantar, format tabel, daftar tabel/gambar, serta kutipan dan sitasi. Konten bersama ada di `client/src/content/guides.js` dan dipakai juga oleh server.
- Metadata per rute, canonical, Open Graph, dan JSON-LD di `server/src/seo.js`. Halaman artikel mendapat `Article` + `BreadcrumbList` 3 tingkat, `og:type=article`, dan `article:published_time`.
- `<noscript>` per rute: halaman panduan mengirim ringkasan artikelnya sendiri untuk crawler tanpa JavaScript.
- `X-Robots-Tag: noindex` untuk `/app/*`, `/api/*`, dan rute yang tidak dikenal.
- Favicon SVG + PNG 512/192/32 dan `apple-touch-icon`
- Tautan internal dari beranda (menu “Panduan”, bagian “Panduan”, dan footer) agar artikel ditemukan crawler.

Catatan: `server/src/seo.js` mengimpor konten dari `client/src/content/guides.js` saat server dinyalakan. Setelah mengubah artikel, restart server (bukan hanya build client) agar metadata ikut berubah.

Langkah sekali pakai:

1. Buka <https://search.google.com/search-console>, tambahkan properti **Domain** milik deployment Anda.
2. Verifikasi lewat DNS TXT di Cloudflare.
3. Kirim URL `https://<domain-anda>/sitemap.xml` di menu **Sitemaps**.
4. **URL Inspection** → tempel halaman utama → **Request indexing**.
5. Ulangi URL Inspection untuk `/panduan` dan tiap artikel agar cepat ditemukan.

## 3.10 Troubleshooting Instalasi

| Gejala | Penyebab umum | Solusi |
| --- | --- | --- |
| `EADDRINUSE :4000` | Server dev sudah jalan | Hentikan proses lama atau pakai port lain |
| Login "berhasil" tapi sesi hilang | Diakses lewat HTTP | Buka lewat HTTPS; `COOKIE_SECURE=true` |
| `502 Bad Gateway` di domain | Server/tunnel belum siap | Tunggu build selesai, cek `api/health` |
| `ERR_TOO_MANY_REDIRECTS` | Redirect ganda (Cloudflare + origin) | Matikan redirect HTTP→HTTPS di origin |
| Halaman "can't reach" padahal server hidup | Cache DNS router/PC | Flush DNS atau ganti DNS ke 1.1.1.1 |
| Template kustom tidak memakai setting baru | Template dibuat sebelum field baru ada | Buka template, simpan ulang |
| Daftar isi bernomor 1 semua | Word menghitung ulang field | Klik kanan daftar isi → Update Field |

---

# Bab IV Penggunaan Program

## 4.1 Untuk Pengguna (Mahasiswa)

### 4.1.1 Membuat Akun dan Masuk

1. Buka URL situs Anda.
2. Klik **Mulai gratis** → isi nama, email, password (minimal 8 karakter).
3. Jika Google Sign-In diaktifkan operator, Anda juga dapat mendaftar atau masuk dengan tombol Google.
4. Setelah akun dibuat, Anda langsung masuk ke dashboard.
5. Lupa sesi? Buka **Masuk** dan login kembali.

### 4.1.2 Dashboard

Berisi ringkasan jumlah dokumen, skor format, dokumen terbaru, aktivitas terakhir, dan pintasan membuat dokumen baru. Menu samping: **Dashboard**, **Dokumen**, **Template**, **Galeri template**, **Pengaturan akun**.

### 4.1.3 Membuat Dokumen Baru

1. Klik **Dokumen baru**.
2. Pilih salah satu cara:
   - **Unggah DOCX** — seret file ke area upload atau klik untuk memilih file (maks. 20 MB).
   - **Tulis teks** — tempel isi makalah di kotak teks. `#` untuk judul bab, `##` untuk sub-bab, `$$...$$` untuk rumus.
3. Tunggu proses selesai; dokumen muncul di workspace.

### 4.1.4 Mengisi Data Cover

Di panel kanan workspace:

1. Isi **Jenis dokumen**, **Judul**, **Mata kuliah**, **Dosen pengampu**.
2. Tambah **anggota** satu per satu (nama + NIM). Gunakan tombol tambah/hapus.
3. Unggah **logo** (klik, tarik, atau Ctrl+V). Atur ukuran dengan slider.
4. Isi **Program studi**, **Departemen**, **Fakultas**, **Institusi**, **Kota**, **Tahun**.
5. Cover di preview langsung berubah; tidak perlu menekan tombol format.

Judul panjang otomatis turun baris, ukuran blok bawah tetap sama dengan judul, dan jarak menyusut agar cover tetap satu halaman.

### 4.1.5 Memilih Template

1. Di panel format, pilih template Makalah atau salah satu template kustom Anda.
2. Angka pada template menjadi acuan pemeriksaan: margin, font, spasi, indentasi, penomoran, daftar isi.
3. Ingin pedoman kampus sendiri? Lihat [4.1.10](#4110-membuat-template-kustom).

### 4.1.6 Memeriksa Format

1. Buka tab **Periksa**.
2. Klik **Jalankan pemeriksaan**.
3. HASIL dibagi menjadi **Sesuai**, **Perlu diperiksa**, dan **Tidak sesuai**, lengkap dengan paragraf, nilai ditemukan, nilai diharapkan, dan rekomendasi.
4. Klik temuan untuk menyorot bagian terkait di preview.

### 4.1.7 Menerapkan Format

1. Buka tab **Format**.
2. Pilih aturan yang ingin diterapkan (margin, font, ukuran, spasi, indentasi, perataan, heading, paragraf, penomoran halaman, daftar isi).
3. Klik **Terapkan formatting**.
4. Periksa hasil di preview; bandingkan dengan tab **Asli**.

### 4.1.8 Melihat Hasil dan Mengunduh

- Gunakan pemilih **Asli / Hasil** untuk membandingkan.
- Klik **Unduh** untuk mengambil file `.docx` hasil.
- **Reset** menghapus hasil dan kembali ke file asli tanpa menghilangkan dokumen.
- Buka file di Microsoft Word: jika diminta, klik **Enable Editing**, lalu perbarui field daftar isi bila nomor halaman terasa meleset.

### 4.1.9 Riwayat Dokumen

Menu **Dokumen** menampilkan semua dokumen: judul, template, status pemeriksaan, jumlah temuan, dan waktu. Tersedia pencarian, filter status, pagination, unduh ulang, dan hapus.

### 4.1.10 Membuat Template Kustom

1. Buka **Template**.
2. Pilih template bawaan → **Duplikat** (bawaan tidak bisa diedit langsung).
3. Buka salinannya di editor, lalu atur:
   - **Halaman**: ukuran kertas, orientasi, margin.
   - **Tipografi**: font, ukuran, spasi, indentasi.
   - **Heading**: ukuran dan format BAB, sub-bab, sub-sub-bab.
   - **Penomoran halaman**: aktif/tidak, format bagian awal (Romawi kecil/besar), bagian isi, posisi nomor.
   - **Daftar isi**: aktif/tidak, kedalaman, ikut sertakan judul "DAFTAR ISI".
   - **Daftar pustaka**: indentasi menggantung, perataan, tautan URL.
   - **Cover**: ukuran judul/institusi, tampilkan departemen, logo, isian cover bawaan (jenis dokumen, mata kuliah, dosen, anggota, program studi, fakultas, institusi, kota, tahun).
4. Simpan. Template muncul di pustaka dan bisa dipakai untuk dokumen berikutnya.

Isian cover bawaan dipakai otomatis bila kolom di workspace dibiarkan kosong; isian workspace selalu menang.

### 4.1.11 Pengaturan Akun

- **Profil**: ubah nama, institusi, program studi.
- **Password**: ganti password (minimal 8 karakter).
- **Hapus akun**: menghapus akun, seluruh dokumen, file asli/hasil, dan template kustom secara permanen. Perlu password.

## 4.2 Untuk Pemilik / Operator

### 4.2.1 Menyalakan dan Mematikan Layanan

- Nyalakan: `deploy\start.cmd` atau `powershell -File deploy\run.ps1`.
- Matikan: `Ctrl+C` di jendela tersebut.
- Tunnel dan server berhenti bersamaan. Jangan menutup jendela selama situs dipakai.

### 4.2.2 Memantau Kesehatan Layanan

| Cek | Cara |
| --- | --- |
| API hidup | `https://<domain-anda>/api/health` |
| Halaman utama | `https://<domain-anda>/` |
| Tunnel (jika digunakan) | Dashboard tunnel pada provider Anda |
| Server lokal | `curl.exe http://localhost:4001/api/health` |

Jika menggunakan tunnel, pastikan statusnya **healthy** dengan koneksi aktif.

### 4.2.3 Mengelola Template Bawaan

Template bawaan berasal dari `server/prisma/seed.js`. Setelah mengubah seed:

```powershell
npm --prefix server run db:seed
```

Template milik pengguna tidak tersentuh oleh seed.

### 4.2.4 Menghapus Data Pengguna

- Pengguna dapat menghapus akunnya sendiri dari halaman Pengaturan.
- Sebagai pemilik, hapus manual hanya bila perlu:
  1. Hentikan server.
  2. Hapus baris pengguna dan relasinya di database (`Users`, `Documents`, `Templates` sesuai schema).
  3. Hapus folder `server/storage/<userId>/`.
  4. Jalankan server kembali.

### 4.2.5 Keamanan Operasional

- `JWT_SECRET` hanya di `server/.env.production`, jangan dibagikan.
- `COOKIE_SECURE=true` wajib di HTTPS.
- Jangan membuka port 4001 ke internet; cukup lewat tunnel.
- Batasi akses fisik ke `server/prisma/dev.db` dan `server/storage`.
- Perbarui dependency secara berkala: `npm outdated`, lalu uji ulang.

### 4.2.6 Meningkatkan Batas Upload

Ubah `MAX_UPLOAD_MB` di `.env`/`.env.production`, lalu restart. Pastikan penyimpanan dan memori server cukup.

### 4.2.7 SEO dan Visibilitas

Lihat [3.9](#39-seo-dan-google-search-console). Setelah mengubah halaman publik, minta pengindeksan ulang lewat URL Inspection.

### 4.2.8 Admin Panel (Analitik dan Reset Password)

Hanya akun dengan peran **admin** yang melihat menu **Admin panel** di sidebar dan dapat membuka `/app/admin`.

**Siapa yang menjadi admin?**
- Pengguna pertama yang mendaftar saat database masih kosong otomatis mendapat peran `admin`.
- Untuk instalasi yang sudah berisi pengguna sebelum fitur ini ada, jalankan sekali:

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

**Tab Analitik** menampilkan jumlah pengguna, dokumen, dokumen yang sudah diformat, pemakaian penyimpanan, grafik dokumen per hari (30 hari terakhir), template paling sering dipakai, dan peringatan bila ada dokumen berstatus gagal.

**Tab Pengguna** menampilkan daftar akun (nama, email, institusi, jumlah dokumen, tanggal daftar) dengan pencarian dan pagination. Tersedia dua aksi:
- **Reset password** — menghasilkan password acak baru dan menampilkannya sekali. Salin dan kirim ke pengguna; password tidak bisa dilihat lagi setelah dialog ditutup. Akun admin lain tidak bisa direset dari panel.
- **Hapus akun** — menghapus akun beserta dokumen dan template miliknya secara permanen. Akun admin tidak bisa dihapus dari panel.

Semua endpoint `/api/admin/*` memerlukan login dan peran admin; pengguna biasa mendapat `403`.

---

# Bab V Pemeliharaan dan Backup

## 5.1 Apa yang Dibackup

| Data | Lokasi | Isi |
| --- | --- | --- |
| Kode sumber | seluruh proyek kecuali `node_modules`, `client/dist`, `backup` | aplikasi |
| Database | `server/prisma/dev.db` | akun, dokumen, template, aktivitas |
| File upload | `server/storage/<userId>/` | DOCX asli dan hasil |
| Konfigurasi | `server/.env.production`, `deploy/` | port, JWT, tunnel, domain |

Yang **tidak** perlu dibackup: `node_modules`, `client/dist`, `*.zip` lama, file fixture.

## 5.2 Cara Backup

Folder `backup/` sudah berisi hasil backup:

| Berkas | Isi | Ukuran |
| --- | --- | --- |
| `backup/rapimakalah-source-<tanggal>.zip` | kode sumber + deploy + README, tanpa `node_modules`, `dist`, `storage`, database, dan file `.env` | ±0,3 MB |
| `backup/rapimakalah-data-<tanggal>.zip` | seluruh proyek termasuk `server/prisma/dev.db` dan `server/storage` | ±16 MB |

Membuat backup baru (PowerShell, jalankan dari root proyek):

```powershell
$stamp = Get-Date -Format 'yyyy-MM-dd'
Compress-Archive -Path server\prisma\dev.db, server\storage -DestinationPath "backup\rapimakalah-data-$stamp.zip" -Force
```

Untuk kode sumber, zip manual tanpa `node_modules`:

```powershell
robocopy . "$env:TEMP\rapimakalah-src" /E /XD node_modules dist .git backup /XF .env .env.production *.zip
Compress-Archive -Path "$env:TEMP\rapimakalah-src\*" -DestinationPath "backup\rapimakalah-source-$stamp.zip" -Force
Remove-Item "$env:TEMP\rapimakalah-src" -Recurse -Force
```

Simpan salinan backup di luar komputer ini (Google Drive, OneDrive, atau hard disk eksternal). Backup di folder yang sama tidak melindungi dari kerusakan disk.

## 5.3 Cara Restore

1. **Hentikan layanan** (`Ctrl+C`).
2. **Pulihkan kode**: ekstrak `rapimakalah-source-<tanggal>.zip` ke folder baru, atau timpa proyek lama.
3. **Pulihkan data**: ekstrak `rapimakalah-data-<tanggal>.zip`, ambil `server/prisma/dev.db` dan folder `server/storage`, lalu timpa ke lokasi yang sama.
4. **Buat ulang konfigurasi** (file `.env` sengaja tidak ikut backup):

   ```powershell
   Copy-Item deploy\env.production.example server\.env.production
   Copy-Item server\.env.example server\.env
   ```

   Isi `JWT_SECRET` baru (atau yang lama bila ingin sesi lama tetap valid), `PORT`, `CLIENT_ORIGIN`, `CANONICAL_URL`, `COOKIE_SECURE`, serta URL database yang dipulihkan.
5. **Install dependency**:

   ```powershell
   npm install
   npm run install:all
   ```

   Jangan jalankan `db:push` tanpa memeriksa schema dan memastikan backup terverifikasi; data hasil restore harus bisa dibaca aplikasi sebelum migrasi apa pun.

6. **Jalankan ulang**: `deploy\start.cmd`, lalu cek `api/health`.

Catatan: mengganti `JWT_SECRET` membuat semua pengguna harus login ulang. Data dokumen tidak hilang.

## 5.4 Update Aplikasi

1. Backup dulu (lihat 5.2).
2. Hentikan layanan.
3. Ganti kode sumber dengan versi baru.
4. `npm run install:all`
5. Jika schema memang berubah, periksa `DATABASE_URL` agar menunjuk ke database yang benar, lakukan backup database dan storage yang bisa dipulihkan, lalu jalankan `npm --prefix server run db:push` dan baca output Prisma sebelum menyetujui perubahan.
   - Jangan jalankan `--accept-data-loss` secara otomatis. Bila Prisma memperingatkan potensi kehilangan data, berhenti, pahami operasi yang diminta, dan siapkan rencana migrasi/restore sebelum melanjutkan.
6. `npm run build`
7. `deploy\start.cmd`
8. Uji: health, login, unggah dokumen, format, unduh.

Bila ada perubahan template default, jalankan `npm --prefix server run db:seed` agar template bawaan diperbarui. Template kustom pengguna tetap.

## 5.5 Pemantauan

- Cek `api/health` secara berkala (bisa lewat layanan uptime gratis).
- Pantau ukuran `server/storage`; bila membesar, minta pengguna menghapus dokumen lama atau tambah disk.
- Cek log `cloudflared` untuk error `Unable to reach the origin service` (artinya server lokal mati).
- Perbarui `npm audit` secara berkala.

---

# Bab VI Pengujian

## 6.1 Smoke Test Mesin DOCX

Tidak memerlukan akun:

```powershell
npm --prefix server run test:engine
```

Script membaca `server/test-fixture.docx`, menerapkan formatting, menulis hasil sementara ke direktori temporary sistem, lalu memeriksa:

- section dan `pgNumType`
- footer per bagian
- field TOC
- tabel, gambar, dan hyperlink yang dipertahankan
- hasil preview

File hasil bisa dibuka langsung di Microsoft Word untuk verifikasi manual.

Uji regresi DOCX mencakup tabel Markdown legacy (juga saat antarbaris disela paragraf kosong), preview format/cover, numbering Word, dan tabel cover anggota:

```powershell
node server/scripts/test-text-tables.js
node server/scripts/test-formatting-preview.js
node server/scripts/test-list-indent.js
node server/scripts/test-cover-members-table.js
node server/scripts/test-cover-members.js
node server/scripts/test-cover-table-existing.js
```

Untuk memastikan preview sebelum/sesudah format tetap konsisten, jalankan juga:

```powershell
node server/scripts/test-preview-format-parity.js
```

## 6.2 Uji Alur Berbagi Template

Jalankan hanya terhadap database pengembangan/tes yang tidak berisi data pengguna (jangan targetkan produksi). Server harus hidup (default `http://localhost:4001`). Script membuat dua akun uji sementara, lalu memverifikasi pembuatan kode, akses publik, impor salinan identik, penanganan nama bentrok, pencabutan tautan, dan `noindex`:

```powershell
node server/scripts/test-share.mjs
```

Akun uji dihapus otomatis di akhir (kecuali dijalankan dengan `KEEP=1`). Untuk menunjuk server lain: `$env:BASE='http://localhost:4000'; node server/scripts/test-share.mjs`.

## 6.2b Uji Galeri Template

Jalankan hanya terhadap database pengembangan/tes yang tidak berisi data pengguna. Server harus hidup (default `http://localhost:4000`). Script membuat dua akun uji sementara, lalu memverifikasi penerbitan, daftar/detail publik, penolakan template bawaan, salin ke akun, pencabutan, dan metadata `/galeri`:

```powershell
node server/scripts/test-gallery.mjs
```

Akun uji dihapus otomatis di akhir (kecuali `KEEP=1`). Untuk menunjuk server lain: `$env:BASE='http://localhost:4001'; node server/scripts/test-gallery.mjs`.

## 6.3 Checklist Manual

**Pengguna**

1. Registrasi akun baru, lalu login ulang.
2. Unggah DOCX dan pastikan dokumen muncul di riwayat.
3. Isi cover: judul panjang, 4 anggota, logo. Pastikan cover tetap satu halaman dan logo tidak gepeng.
4. Jalankan pemeriksaan; pastikan temuan menyebut paragraf dan nilai.
5. Terapkan format; bandingkan asli vs hasil; unduh.
6. Buka hasil di Word: cek margin, font, spasi, heading, nomor halaman, daftar isi, daftar pustaka.
7. Reset hasil, lalu hapus dokumen.
8. Bagikan template kustom: salin tautan `/t/<kode>`, buka di jendela privat, lalu impor dengan akun lain dan pastikan pengaturannya sama persis.
9. Cabut tautan berbagi dan pastikan tautan lama menampilkan “Tautan template tidak tersedia”.
10. Terbitkan template kustom, buka `/galeri` di jendela privat, lalu simpan salinannya dengan akun lain. Tarik template dari galeri dan pastikan salinan yang sudah tersimpan tetap ada.

**Pemilik**

1. `api/health` 200 dari domain publik.
2. Login lewat HTTPS berhasil dan sesi bertahan setelah refresh.
3. Halaman `/app` tidak muncul di hasil pencarian (`X-Robots-Tag: noindex`).
4. Backup, restore ke folder sementara, dan jalankan ulang.
5. Tunnel berstatus healthy setelah reboot.

---

# Lampiran A — Ringkasan API

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/api/auth/config` | Konfigurasi publik login Google |
| POST | `/api/auth/register` | Registrasi + cookie sesi |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/google` | Verifikasi credential Google, lalu login/registrasi |
| POST | `/api/auth/logout` | Hapus cookie sesi |
| GET | `/api/auth/me` | Profil sesi aktif |
| PATCH | `/api/auth/profile` | Update nama/institusi/prodi |
| POST | `/api/auth/password` | Ubah password |
| DELETE | `/api/account` | Hapus akun + seluruh file (perlu password atau verifikasi Google) |
| GET | `/api/dashboard` | Statistik, dokumen terakhir, aktivitas |
| GET | `/api/documents` | Daftar dokumen (search, status, pagination) |
| POST | `/api/documents` | Upload DOCX (`multipart/form-data`, field `file`) |
| POST | `/api/documents/text` | Buat dokumen dari teks |
| GET | `/api/documents/:id` | Detail dokumen milik pengguna |
| GET | `/api/documents/:id/preview` | Preview `variant=original\|processed` |
| POST | `/api/documents/:id/analyze` | Jalankan checker |
| POST | `/api/documents/:id/format` | Terapkan formatting |
| POST | `/api/documents/:id/live-preview` | Preview cepat untuk perubahan pengaturan |
| POST | `/api/documents/:id/reset` | Hapus hasil, kembali ke asli |
| GET | `/api/documents/:id/download` | Unduh asli/hasil |
| DELETE | `/api/documents/:id` | Hapus dokumen + file |
| GET | `/api/templates` | Template bawaan + milik pengguna |
| GET/POST/PUT/DELETE | `/api/templates...` | Detail, buat, ubah, hapus template |
| POST | `/api/templates/:id/duplicate` | Duplikasi template |
| POST | `/api/templates/:id/share` | Buat/ambil kode berbagi template (auth, pemilik saja) |
| DELETE | `/api/templates/:id/share` | Cabut tautan berbagi (auth, pemilik saja) |
| POST | `/api/templates/:id/publish` | Terbitkan template ke galeri publik (auth, pemilik saja) |
| DELETE | `/api/templates/:id/publish` | Tarik template dari galeri publik (auth, pemilik saja) |
| GET | `/api/gallery` | Daftar template terbit, `?q=&category=` (publik) |
| GET | `/api/gallery/:id` | Detail template galeri (publik) |
| POST | `/api/gallery/:id/use` | Simpan salinan template galeri ke akun (auth) |
| GET | `/api/share/:shareId` | Ringkasan template dibagikan (publik, tanpa auth) |
| POST | `/api/share/:shareId/import` | Simpan salinan identik ke akun (auth) |
| GET | `/api/admin/stats` | Statistik global (admin) |
| GET | `/api/admin/users` | Daftar pengguna, `?search=&page=&limit=` (admin) |
| POST | `/api/admin/users/:id/reset-password` | Reset password pengguna (admin) |
| DELETE | `/api/admin/users/:id` | Hapus akun pengguna (admin) |
| GET | `/api/health` | Status server |

Semua endpoint dokumen dan template memeriksa kepemilikan. Format error: `{ "error": "..." }`.

---

# Lampiran B — FAQ dan Masalah Umum

**Daftar isi di Word semua nomornya 1.**
Buka Word, klik kanan pada daftar isi → **Update Field** → **Update entire table** dengan mode tampilan bukan Protected View.

**Login berhasil tapi langsung logout.**
Pastikan membuka lewat `https://`. Dengan `COOKIE_SECURE=true`, cookie tidak dikirim lewat HTTP.

**Logo di cover gepeng.**
Versi terbaru membaca ukuran asli gambar. Unggah ulang logo setelah menerapkan format terbaru.

**Cover pecah dua halaman.**
Tambahkan pengaturan jarak pada template atau kurangi anggota; `coverFit` menyesuaikan jarak otomatis, tetapi judul yang sangat panjang dan banyak anggota tetap bisa melebihi satu halaman.

**Preview beda dengan Word.**
Preview adalah render struktural. Nomor halaman dan pagination final milik Word.

**Template kustom tidak mengikuti setting baru.**
Template lama memakai nilai default untuk field baru. Buka template dan simpan ulang.

**Situs 502 / can't reach.**
Cek server (port 4001) dan tunnel. Kalau hanya satu perangkat yang gagal, coba flush DNS.

**Dokumen ditolak saat diunggah.**
Pastikan file benar-benar `.docx` (bukan `.doc` yang di-rename), tidak terenkripsi password, dan ukurannya di bawah `MAX_UPLOAD_MB`.

---

## Lisensi dan Atribusi

Proyek internal. Nama tampilan produk: **RapiMakalah**. Beberapa identifier internal masih memakai nama lama (`paperly`) — cookie `paperly_token`, ekstensi `.paperly.docx`, rel `rIdPaperly*`, dan nama layanan pada health check — dan sengaja tidak diubah agar data lama tetap valid.

---

# Lisensi

Proyek ini adalah proprietary / internal. Tidak ada lisensi open source yang diberikan. Hak cipta © {tahun} RapiMakalah. Penggunaan, reproduksi, atau distribusi di luar konteks internal tanpa izin tertulis tidak diperkenankan.

---

# Kontribusi

Karena ini proyek internal, kontribusi dari luar tidak diterima melalui pull request. Untuk melaporkan bug atau meminta fitur:

1. Buat ringkasan tertulis (via email atau media lain yang disepakati).
2. Sertakan langkah untuk reproduksi dan hasil yang diharapkan vs actual.
3. Untuk perubahan besar, tunggu konfirmasi sebelum mulai bekerja.

Sebelum mengubah kode produk:

1. Backup (`backup/`).
2. Jalankan smoke test: `npm --prefix server run test:engine`.
3. Verifikasi `npm run build` dan `npm run dev` berjalan normal.
4. Untuk perubahan yang memengaruhi format DOCX: buat test fixture baru dan jalankan `test-engine.js` sebelum-sesudah.

---

# Kontak dan Dukungan

| Kebutuhan | Cara |
| --- | --- |
| Laporan bug | Hubungi pengembang dengan ringkasan + langkah reproduksi |
| Permintaan fitur | Kirim deskripsi fitur dan kasus penggunaan |
| Masalah DNS / domain | Dashboard Cloudflare: Networks → Tunnels |
| Masalah server lokal | Cek `curl http://localhost:4001/api/health` dan log `node` |

---
