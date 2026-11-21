/**
 * Konten panduan publik.
 *
 * Dipakai dua sisi:
 * - client/src/pages/Guides.jsx dan GuideArticle.jsx untuk merender halaman
 * - server/src/seo.js untuk <title>, deskripsi, canonical, JSON-LD Article,
 *   dan teks <noscript> pada HTML awal
 *
 * Blok sengaja berupa data, bukan JSX, supaya bisa dibaca Node tanpa build.
 */

export const GUIDE_INDEX = {
  slug: 'panduan',
  path: '/panduan',
  title: 'Panduan Format Makalah & Skripsi — RapiMakalah',
  description:
    'Panduan praktis format makalah dan skripsi: margin 4-4-3-3, daftar pustaka menggantung, penomoran halaman Romawi dan Arab, serta struktur bab yang rapi di Microsoft Word.',
  heading: 'Panduan format makalah',
  intro:
    'Kumpulan panduan singkat dan praktis untuk merapikan format makalah, laporan, dan skripsi di Microsoft Word. Semua angka di bawah mengikuti pedoman yang paling umum dipakai kampus di Indonesia — selalu cek pedoman resmi institusi Anda.',
};

export const GUIDES = [
  {
    slug: 'margin-makalah-4-4-3-3',
    path: '/panduan/margin-makalah-4-4-3-3',
    category: 'Format halaman',
    title: 'Margin Makalah 4-4-3-3: Arti, Cara Mengatur di Word, dan Kesalahan Umum',
    description:
      'Arti margin 4-4-3-3 pada makalah, cara mengaturnya di Microsoft Word dalam sentimeter, dan kesalahan yang sering membuat dokumen ditolak dosen.',
    keywords: 'margin makalah, margin 4 4 3 3, margin skripsi word, ukuran margin a4, cara mengatur margin',
    date: '2026-11-14',
    readingMinutes: 5,
    related: ['penomoran-halaman-makalah', 'struktur-makalah-yang-rapi'],
    blocks: [
      {
        type: 'p',
        text: 'Banyak pedoman kampus menulis syarat margin dengan singkat: “4-4-3-3”. Angka ini selalu dibaca berurutan dari atas, lalu kiri, kanan, dan bawah — bukan dari kiri searah jarum jam. Kesalahan membaca urutan ini adalah penyebab paling umum margin dokumen tidak sesuai, padahal angkanya sudah benar.',
      },
      { type: 'h2', text: 'Arti angka 4-4-3-3' },
      {
        type: 'table',
        head: ['Sisi halaman', 'Ukuran', 'Keterangan'],
        rows: [
          ['Atas', '4 cm', 'Memberi ruang untuk nomor halaman dan judul bab'],
          ['Kiri', '4 cm', 'Ruang jilid; sering ditambah 0,5 cm bila dijilid tebal'],
          ['Kanan', '3 cm', 'Batas kanan teks'],
          ['Bawah', '3 cm', 'Ruang untuk nomor halaman bawah'],
        ],
      },
      { type: 'h2', text: 'Cara mengatur di Microsoft Word' },
      { type: 'p', text: 'Lakukan sekali di awal, sebelum menulis, agar seluruh dokumen mewarisi pengaturan yang sama.' },
      {
        type: 'ul',
        items: [
          'Buka tab Layout (tata letak) → Margins → Custom Margins.',
          'Pada jendela Page Setup, pastikan unit sudah Centimeters, bukan Inches.',
          'Isi Top 4, Left 4, Bottom 3, Right 3.',
          'Pilih Apply to: Whole document, lalu OK.',
          'Buka Layout → Size dan pastikan kertas A4 (21 × 29,7 cm).',
          'Cek Layout → Paragraph → Spacing untuk memastikan jarak antarparagraf tidak menambah tinggi halaman secara berlebihan.',
        ],
      },
      { type: 'h2', text: 'Kesalahan yang sering terjadi' },
      {
        type: 'ul',
        items: [
          'Mengira urutannya kiri-atas-kanan-bawah sehingga kiri dan kanan tertukar.',
          'Satuan masih inci: 4 inci sama dengan 10,16 cm, bukan 4 cm.',
          'Mengatur margin hanya pada satu section, lalu section berikutnya kembali ke default.',
          'Mengaktifkan Mirror Margins tanpa sengaja sehingga halaman genap dan ganjil berbeda.',
          'Gutter diisi angka besar sehingga teks terdorong dan margin kiri efektif melebihi 4 cm.',
        ],
      },
      {
        type: 'note',
        text: 'Beberapa kampus memakai 4-3-3-3 atau 4-4-3-4. Selalu cocokkan dengan pedoman resmi program studi Anda sebelum menyerahkan dokumen.',
      },
      { type: 'h2', text: 'Memeriksa margin tanpa mengukur manual' },
      {
        type: 'p',
        text: 'RapiMakalah memeriksa margin setiap section dan menyebut nilai yang ditemukan beserta nilai yang diharapkan pedoman. Setelah dirapikan, hasilnya tetap berupa DOCX yang bisa diedit di Word — bukan gambar atau PDF.',
      },
    ],
  },
  {
    slug: 'format-daftar-pustaka',
    path: '/panduan/format-daftar-pustaka',
    category: 'Daftar pustaka',
    title: 'Format Daftar Pustaka: Tanpa Nomor, Menggantung, dan Urut Abjad',
    description:
      'Cara menyusun daftar pustaka makalah dan skripsi: tanpa nomor, indentasi menggantung 1,27 cm, urutan abjad, spasi, dan tautan URL yang benar di Word.',
    keywords: 'daftar pustaka, format daftar pustaka, hanging indent, daftar pustaka tanpa nomor, urut abjad',
    date: '2026-11-14',
    readingMinutes: 6,
    related: ['margin-makalah-4-4-3-3', 'struktur-makalah-yang-rapi'],
    blocks: [
      {
        type: 'p',
        text: 'Daftar pustaka adalah bagian yang paling sering dirapikan ulang oleh dosen. Kesalahannya biasanya sederhana: masih bernomor, tidak menggantung, atau urutannya mengikuti kemunculan di teks padahal pedoman meminta urutan abjad.',
      },
      { type: 'h2', text: 'Aturan dasar yang paling umum' },
      {
        type: 'ul',
        items: [
          'Tanpa nomor dan tanpa bullet.',
          'Diurutkan menurut nama belakang penulis (A–Z).',
          'Baris pertama rata kiri, baris berikutnya menjorok ke dalam sekitar 1,27 cm (indentasi menggantung).',
          'Jarak antarbaris dalam satu entri umumnya 1,0; jarak antar-entri satu baris kosong atau 6–12 pt.',
          'Judul buku dicetak miring; judul artikel tidak dicetak miring dan diapit tanda kutip bila pedoman memintanya.',
          'Nama penulis ditulis “Nama Belakang, Inisial.” tanpa gelar.',
          'Semua sumber yang dikutip di teks harus muncul, dan sebaliknya.',
        ],
      },
      { type: 'h2', text: 'Contoh bentuk entri' },
      {
        type: 'table',
        head: ['Jenis sumber', 'Pola penulisan'],
        rows: [
          ['Buku', 'Nama belakang, Inisial. (Tahun). Judul buku (cetak miring). Kota: Penerbit.'],
          ['Artikel jurnal', 'Nama belakang, Inisial. (Tahun). Judul artikel. Nama Jurnal, volume(nomor), halaman.'],
          ['Skripsi/tesis', 'Nama belakang, Inisial. (Tahun). Judul (cetak miring) [skripsi]. Nama institusi, Kota.'],
          ['Situs web', 'Nama organisasi. (Tahun). Judul halaman. Diakses pada tanggal, dari URL.'],
        ],
      },
      {
        type: 'note',
        text: 'Gaya APA, MLA, dan pedoman kampus tidak selalu sama pada tanda baca dan urutan tahun. Contoh di atas adalah pola umum; ikuti pedoman program studi bila berbeda.',
      },
      { type: 'h2', text: 'Membuat indentasi menggantung di Word' },
      {
        type: 'ul',
        items: [
          'Pilih seluruh entri daftar pustaka.',
          'Buka Paragraph → Indents and Spacing.',
          'Pada Special, pilih Hanging, lalu isi 1,27 cm.',
          'Pastikan Left indent 0 cm agar baris pertama tetap rata margin.',
          'Hapus penomoran otomatis: Home → Numbering → None.',
          'Matikan AutoFormat yang mengubah daftar menjadi bernomor saat mengetik.',
        ],
      },
      { type: 'h2', text: 'Tautan URL' },
      {
        type: 'p',
        text: 'URL sebaiknya ditulis lengkap dan bisa diklik. Di Word, tautan otomatis berwarna biru dan bergaris bawah; bila pedoman meminta teks hitam, klik kanan tautan → Remove Hyperlink setelah URL tercatat. Alamat tanpa http atau https sering tidak dikenali otomatis dan perlu dibuat manual dengan Ctrl+K.',
      },
      { type: 'h2', text: 'Spasi dan perataan' },
      {
        type: 'p',
        text: 'Sebagian pedoman meminta perataan justify, sebagian meminta rata kiri. Perataan justify pada entri menggantung kadang membuat celah antarkata melebar, terutama pada URL panjang. Bila hasilnya terlihat berantakan, rata kiri adalah pilihan yang lebih aman selama pedoman tidak melarangnya.',
      },
    ],
  },
  {
    slug: 'penomoran-halaman-makalah',
    path: '/panduan/penomoran-halaman-makalah',
    category: 'Penomoran halaman',
    title: 'Penomoran Halaman Makalah: Romawi untuk Awal, Arab untuk Isi',
    description:
      'Cara membuat penomoran halaman makalah: cover tanpa nomor, bagian awal angka Romawi kecil (i, ii, iii), bagian isi angka Arab mulai 1, memakai section break di Word.',
    keywords: 'penomoran halaman makalah, nomor halaman romawi, section break word, restart page numbering',
    date: '2026-11-14',
    readingMinutes: 6,
    related: ['margin-makalah-4-4-3-3', 'struktur-makalah-yang-rapi'],
    blocks: [
      {
        type: 'p',
        text: 'Penomoran halaman makalah biasanya tiga bagian: cover tanpa nomor, bagian awal dengan angka Romawi kecil, dan bagian isi dengan angka Arab yang dimulai lagi dari 1. Semua ini dibuat dengan section break, bukan dengan mengetik nomor manual.',
      },
      { type: 'h2', text: 'Pola yang paling umum' },
      {
        type: 'table',
        head: ['Bagian', 'Isi', 'Format nomor', 'Mulai'],
        rows: [
          ['Cover', 'Halaman judul', 'Tidak ada nomor', '—'],
          ['Bagian awal', 'Kata pengantar, daftar isi, daftar tabel, daftar gambar', 'Romawi kecil (i, ii, iii)', 'i'],
          ['Bagian isi', 'BAB I sampai daftar pustaka', 'Arab (1, 2, 3)', '1'],
        ],
      },
      { type: 'h2', text: 'Langkah di Microsoft Word' },
      {
        type: 'ul',
        items: [
          'Letakkan kursor di akhir halaman cover, lalu Page Layout → Breaks → Next Page.',
          'Klik dua kali area footer bagian awal, lalu matikan Link to Previous agar nomor cover tidak ikut.',
          'Insert → Page Number → Format Page Numbers → pilih i, ii, iii, Start at 1.',
          'Ulangi section break sebelum BAB I.',
          'Pada section isi, pilih format 1, 2, 3 dan Start at 1.',
          'Atur posisi nomor: Bottom of Page → Plain Number 2 (tengah) atau rata kanan sesuai pedoman.',
          'Hapus nomor pada footer cover bila masih muncul.',
        ],
      },
      { type: 'h2', text: 'Kesalahan yang sering terjadi' },
      {
        type: 'ul',
        items: [
          'Nomor ikut muncul di cover karena footer masih terhubung ke section berikutnya.',
          'Semua halaman bernomor 1 karena setiap section memakai Start at 1 tanpa restart yang benar.',
          'Nomor halaman di daftar isi tidak berubah setelah isi diedit — perlu Update Field.',
          'Mengetik nomor manual sehingga penomoran berantakan saat halaman bergeser.',
          'Format Romawi dipakai sampai BAB I, padahal pedoman meminta bagian awal saja.',
        ],
      },
      {
        type: 'note',
        text: 'Setelah mengubah isi, perbarui daftar isi dengan klik kanan → Update Field → Update entire table. Nomor halaman final selalu ditentukan Word, bukan perkiraan aplikasi lain.',
      },
    ],
  },
  {
    slug: 'struktur-makalah-yang-rapi',
    path: '/panduan/struktur-makalah-yang-rapi',
    category: 'Struktur dokumen',
    title: 'Struktur Makalah yang Rapi: Urutan Bagian, Heading, dan Sub-bab',
    description:
      'Urutan bagian makalah dari cover sampai lampiran, aturan heading BAB dan sub-bab, label A/B/C, spasi, indentasi, serta daftar isi otomatis di Word.',
    keywords: 'struktur makalah, urutan makalah, heading bab, sub bab, daftar isi otomatis, format skripsi',
    date: '2026-11-14',
    readingMinutes: 7,
    related: ['margin-makalah-4-4-3-3', 'format-daftar-pustaka'],
    blocks: [
      {
        type: 'p',
        text: 'Dokumen yang isinya bagus tetap terlihat berantakan bila urutan bagian dan tingkat judulnya tidak konsisten. Struktur yang rapi juga membuat daftar isi bisa diperbarui otomatis dan penomoran bab tidak perlu diketik manual.',
      },
      { type: 'h2', text: 'Urutan bagian yang umum' },
      {
        type: 'table',
        head: ['Urutan', 'Bagian', 'Nomor halaman'],
        rows: [
          ['1', 'Cover / halaman judul', 'Tanpa nomor'],
          ['2', 'Kata pengantar', 'Romawi kecil'],
          ['3', 'Daftar isi', 'Romawi kecil'],
          ['4', 'Daftar tabel dan daftar gambar (bila ada)', 'Romawi kecil'],
          ['5', 'BAB I Pendahuluan sampai BAB V Penutup', 'Arab mulai 1'],
          ['6', 'Daftar pustaka', 'Arab, lanjut'],
          ['7', 'Lampiran (bila ada)', 'Arab, lanjut'],
        ],
      },
      { type: 'h2', text: 'Heading dan sub-bab' },
      {
        type: 'ul',
        items: [
          'Judul bab ditulis “BAB I” lalu nama bab, rata tengah, huruf kapital, tebal, ukuran 12–14 pt sesuai pedoman.',
          'Sub-bab memakai nomor bertingkat: 1.1, 1.1.1, dan seterusnya, rata kiri, tebal.',
          'Badan paragraf di bawah sub-bab sejajar dengan awal teks judul, bukan dengan nomornya.',
          'Label A, B, C di bawah sub-bab bukan heading. Tulis sebagai paragraf tebal, menjorok sedikit dari sub-bab, lalu isi paragraf sejajar dengan teks labelnya.',
          'Jangan mencampur penomoran manual dengan penomoran otomatis Word; pilih salah satu.',
          'Gunakan style Heading 1 untuk bab dan Heading 2/3 untuk sub-bab agar daftar isi terbentuk otomatis.',
        ],
      },
      { type: 'h2', text: 'Spasi dan indentasi' },
      {
        type: 'ul',
        items: [
          'Spasi baris 1,5 untuk badan teks, 1,0 untuk isi tabel, keterangan gambar, dan daftar pustaka.',
          'Baris pertama paragraf menjorok sekitar 1,25 cm; paragraf setelah judul sub-bab juga menjorok.',
          'Jarak antarparagraf 0 pt bila memakai spasi 1,5; jangan menambah baris kosong manual.',
          'Perataan justify untuk badan teks, rata kiri untuk URL panjang dan isi tabel.',
        ],
      },
      { type: 'h2', text: 'Daftar isi otomatis' },
      {
        type: 'p',
        text: 'Sisipkan daftar isi lewat References → Table of Contents → Custom Table of Contents, lalu atur kedalaman sampai Heading 3. Setelah isi berubah, klik kanan pada daftar isi → Update Field → Update entire table. Bila nomor halaman semua menjadi 1, biasanya karena heading tidak memakai style atau penomoran section belum di-restart.',
      },
      {
        type: 'note',
        text: 'Pedoman kampus dapat meminta urutan tambahan seperti abstrak, kata pengantar, atau daftar lambang. Sesuaikan urutan di atas dengan pedoman resmi Anda.',
      },
      { type: 'h2', text: 'Merapikan tanpa menulis ulang' },
      {
        type: 'p',
        text: 'RapiMakalah menerapkan aturan struktur langsung ke DOCX asli: margin, font, spasi, indentasi, heading, penomoran halaman, daftar isi, dan daftar pustaka. Isi, tabel, gambar, dan tautan tetap utuh sehingga Anda hanya perlu memeriksa hasilnya di Word.',
      },
    ],
  },
  {
    slug: 'kata-pengantar-makalah',
    path: '/panduan/kata-pengantar-makalah',
    category: 'Bagian awal',
    title: 'Kata Pengantar Makalah: Struktur, Format, dan Blok Tanda Tangan',
    description:
      'Susunan kata pengantar makalah yang benar: urutan paragraf, aturan format, penulisan tempat dan tanggal, ruang tanda tangan, serta kesalahan yang sering muncul.',
    keywords: 'kata pengantar makalah, contoh kata pengantar, tanda tangan kata pengantar, format kata pengantar',
    date: '2026-11-14',
    readingMinutes: 5,
    related: ['penomoran-halaman-makalah', 'struktur-makalah-yang-rapi'],
    blocks: [
      {
        type: 'p',
        text: 'Kata pengantar bukan sekadar formalitas. Bagian ini menjelaskan tujuan penulisan, ruang lingkup, dan ucapan terima kasih. Karena berada di bagian awal, formatnya mengikuti penomoran Romawi kecil dan tidak diberi nomor bab.',
      },
      { type: 'h2', text: 'Struktur yang umum dipakai' },
      {
        type: 'table',
        head: ['Bagian', 'Isi'],
        rows: [
          ['Pembuka', 'Ucapan syukur dan alasan penulisan makalah'],
          ['Isi', 'Tujuan, ruang lingkup, dan garis besar pembahasan'],
          ['Ucapan terima kasih', 'Dosen pengampu, institusi, dan pihak yang membantu'],
          ['Penutup', 'Harapan atas saran dan kritik'],
          ['Tanda tangan', 'Tempat, tanggal, ruang tanda tangan, nama, dan NIM'],
        ],
      },
      { type: 'h2', text: 'Aturan format' },
      {
        type: 'ul',
        items: [
          'Judul “KATA PENGANTAR” ditulis kapital, rata tengah, tebal, tanpa nomor bab.',
          'Badan teks memakai spasi 1,5 dan baris pertama menjorok sekitar 1,25 cm.',
          'Bahasa baku, kalimat efektif, dan tidak memakai bullet atau penomoran.',
          'Panjang wajar satu sampai dua halaman; hindari pengantar yang bertele-tele.',
          'Jangan menyalin kata pengantar dari dokumen lain tanpa menyesuaikan isinya.',
        ],
      },
      { type: 'h2', text: 'Blok tanda tangan' },
      { type: 'p', text: 'Blok tanda tangan diletakkan di akhir, umumnya rata kanan atau sejajar dengan margin kanan, dan tidak memakai garis.' },
      {
        type: 'ul',
        items: [
          'Baris pertama: tempat dan tanggal penulisan, misalnya “Semarang, 14 November 2026”.',
          'Sisakan dua sampai tiga baris kosong untuk tanda tangan dan cap bila diperlukan.',
          'Tulis nama lengkap tanpa gelar, lalu NIM di baris berikutnya.',
          'Samakan nama pada kata pengantar, cover, dan halaman pengesahan.',
        ],
      },
      { type: 'h2', text: 'Kesalahan yang sering terjadi' },
      {
        type: 'ul',
        items: [
          'Tanggal ditulis dengan format berbeda dari cover dan halaman pengesahan.',
          'Nama pada kata pengantar tidak sama dengan nama di cover.',
          'Ruang tanda tangan terlalu sempit sehingga tanda tangan menabrak teks.',
          'Kata pengantar ikut diberi nomor halaman Arab.',
          'Ucapan terima kasih menyebut pihak yang tidak terlibat dalam penulisan.',
        ],
      },
      {
        type: 'note',
        text: 'Beberapa kampus meminta kata pengantar ditulis dengan spasi 1,0 atau diberi jarak antarparagraf. Ikuti pedoman resmi program studi Anda.',
      },
    ],
  },
  {
    slug: 'format-tabel-makalah',
    path: '/panduan/format-tabel-makalah',
    category: 'Tabel dan gambar',
    title: 'Format Tabel Makalah: Judul di Atas, Garis, Font, dan Sumber',
    description:
      'Aturan penulisan tabel dalam makalah dan skripsi: nomor dan judul tabel di atas, garis horizontal, ukuran font, spasi 1,0, sumber, serta tabel yang terpotong halaman.',
    keywords: 'format tabel makalah, judul tabel, tabel skripsi, caption tabel, tabel terpotong word',
    date: '2026-11-14',
    readingMinutes: 6,
    related: ['daftar-tabel-dan-gambar', 'struktur-makalah-yang-rapi'],
    blocks: [
      {
        type: 'p',
        text: 'Tabel yang isinya benar tetap terlihat tidak rapi bila judulnya di bawah, garisnya penuh seperti tabel Excel, atau ukuran hurufnya sama dengan badan teks. Aturan tabel biasanya lebih ketat daripada paragraf biasa.',
      },
      { type: 'h2', text: 'Aturan umum' },
      {
        type: 'table',
        head: ['Elemen', 'Aturan yang paling umum'],
        rows: [
          ['Nomor', 'Tabel 1.1, 1.2, atau Tabel 1, 2 — ikuti pedoman kampus'],
          ['Judul', 'Di atas tabel, kapital di awal kata, tanpa titik di akhir'],
          ['Garis', 'Garis horizontal atas, bawah, dan kepala tabel; garis vertikal umumnya dihilangkan'],
          ['Font', '10–11 pt, spasi 1,0, boleh beda dari badan teks'],
          ['Perataan', 'Angka rata kanan atau desimal sejajar; teks rata kiri'],
          ['Sumber', 'Di bawah tabel bila data bukan hasil penelitian sendiri'],
          ['Jarak', 'Satu baris kosong atau 6–12 pt sebelum dan sesudah tabel'],
        ],
      },
      { type: 'h2', text: 'Membuat tabel yang rapi di Word' },
      {
        type: 'ul',
        items: [
          'Sisipkan tabel dengan Insert → Table, lalu atur jumlah kolom sejak awal.',
          'Pilih Table Design → Borders dan hilangkan garis vertikal serta garis dalam yang tidak perlu.',
          'Atur lebar kolom dengan Table Properties → Column, bukan dengan menekan spasi.',
          'Matikan AutoFit to Window bila tabel menjadi terlalu melebar.',
          'Klik kanan tabel → Table Properties → Row dan aktifkan “Allow row to break across pages” hanya bila tabel memang panjang.',
          'Setelah selesai, klik kanan → Insert Caption untuk membuat judul bernomor otomatis.',
        ],
      },
      { type: 'h2', text: 'Tabel panjang yang terpotong halaman' },
      {
        type: 'p',
        text: 'Untuk tabel yang lebih dari satu halaman, ulangi baris kepala di setiap halaman: klik baris kepala → Table Layout → Repeat Header Rows. Hindari memotong tabel secara manual dengan Enter; biarkan Word yang membagi baris, atau pecah tabel menjadi Tabel 1.1 dan Tabel 1.1 (lanjutan) bila pedoman menghendaki.',
      },
      { type: 'h2', text: 'Kesalahan yang sering terjadi' },
      {
        type: 'ul',
        items: [
          'Judul tabel diletakkan di bawah tabel.',
          'Judul diakhiri titik atau ditulis dengan huruf kapital semua.',
          'Nomor tabel tidak berurutan setelah ada tabel yang dihapus.',
          'Sumber data tidak dicantumkan padahal tabel mengutip penelitian lain.',
          'Tabel melebar melewati margin kanan sehingga terpotong saat dicetak.',
          'Ukuran font tabel sama dengan badan teks sehingga tabel memakan dua halaman.',
        ],
      },
      {
        type: 'note',
        text: 'Keterangan gambar umumnya di bawah gambar, sedangkan judul tabel di atas tabel. Jangan menukar keduanya — ini kesalahan yang paling mudah terlihat.',
      },
    ],
  },
  {
    slug: 'daftar-tabel-dan-gambar',
    path: '/panduan/daftar-tabel-dan-gambar',
    category: 'Bagian awal',
    title: 'Daftar Tabel dan Daftar Gambar: Membuat Otomatis di Word',
    description:
      'Cara membuat daftar tabel dan daftar gambar otomatis di Word memakai caption dan field Table of Figures, lengkap dengan format nomor bab dan pembaruan daftar.',
    keywords: 'daftar tabel, daftar gambar, insert caption word, table of figures, daftar tabel otomatis',
    date: '2026-11-14',
    readingMinutes: 6,
    related: ['format-tabel-makalah', 'penomoran-halaman-makalah'],
    blocks: [
      {
        type: 'p',
        text: 'Daftar tabel dan daftar gambar hanya diperlukan bila dokumen memuat tabel atau gambar. Keduanya ditempatkan di bagian awal, setelah daftar isi, dan memakai penomoran halaman Romawi kecil.',
      },
      { type: 'h2', text: 'Kapan perlu dibuat' },
      {
        type: 'ul',
        items: [
          'Ada minimal satu tabel atau gambar yang diberi nomor dan judul.',
          'Pedoman kampus mewajibkan daftar terpisah untuk tabel dan gambar.',
          'Jumlahnya cukup banyak sehingga pembaca perlu halaman rujukan cepat.',
        ],
      },
      { type: 'h2', text: 'Langkah membuat caption' },
      {
        type: 'ul',
        items: [
          'Klik tabel atau gambar, lalu References → Insert Caption.',
          'Pilih Label: Table untuk tabel, Figure untuk gambar.',
          'Atur Position: Above selected item untuk tabel, Below selected item untuk gambar.',
          'Klik Numbering → Format 1.1 bila nomor ingin mengikuti nomor bab.',
          'Tulis judul setelah nomor, tanpa titik di akhir.',
          'Ulangi untuk semua tabel dan gambar dengan label yang sama.',
        ],
      },
      { type: 'h2', text: 'Membuat daftar otomatis' },
      {
        type: 'ul',
        items: [
          'Letakkan kursor di halaman tempat daftar akan ditulis.',
          'References → Insert Table of Figures.',
          'Pada Caption label, pilih Table untuk daftar tabel dan Figure untuk daftar gambar.',
          'Matikan “Show page numbers” bila pedoman meminta tanpa nomor halaman.',
          'Setelah isi berubah, klik kanan daftar → Update Field → Update entire table.',
        ],
      },
      { type: 'h2', text: 'Format yang umum diminta' },
      {
        type: 'table',
        head: ['Elemen', 'Aturan'],
        rows: [
          ['Judul daftar', 'DAFTAR TABEL / DAFTAR GAMBAR, kapital, rata tengah'],
          ['Isi', 'Nomor, judul, dan nomor halaman'],
          ['Perataan', 'Nomor di kiri, nomor halaman di kanan, diberi titik penuntun'],
          ['Spasi', '1,0 atau 1,15 dengan jarak antarentri 6 pt'],
          ['Penomoran halaman', 'Romawi kecil, melanjutkan daftar isi'],
        ],
      },
      {
        type: 'note',
        text: 'Bila daftar tabel menampilkan “Error! No table of figures entries found”, berarti belum ada caption dengan label yang dipilih. Buat caption dulu, lalu perbarui field.',
      },
    ],
  },
  {
    slug: 'kutipan-dan-sitasi',
    path: '/panduan/kutipan-dan-sitasi',
    category: 'Kutipan',
    title: 'Kutipan Langsung dan Tidak Langsung: Aturan dan Contoh Penulisan',
    description:
      'Perbedaan kutipan langsung dan tidak langsung, aturan kutipan lebih dari 40 kata, penulisan nama dan tahun, nomor halaman, serta kesalahan sitasi yang sering terjadi.',
    keywords: 'kutipan langsung, kutipan tidak langsung, cara mengutip, sitasi, kutipan 40 kata, plagiarisme',
    date: '2026-11-14',
    readingMinutes: 6,
    related: ['format-daftar-pustaka', 'struktur-makalah-yang-rapi'],
    blocks: [
      {
        type: 'p',
        text: 'Kutipan menunjukkan bahwa argumen Anda berpijak pada sumber lain. Kesalahan sitasi bukan hanya soal format — kutipan tanpa sumber dapat dianggap plagiarisme, termasuk saat Anda memparafrase.',
      },
      { type: 'h2', text: 'Tiga bentuk yang paling umum' },
      {
        type: 'table',
        head: ['Bentuk', 'Ciri', 'Penulisan'],
        rows: [
          ['Langsung pendek', 'Kurang dari 40 kata', 'Ditulis dalam tanda kutip, menyatu dengan paragraf'],
          ['Langsung panjang', '40 kata atau lebih', 'Paragraf terpisah, menjorok, spasi 1,0, tanpa tanda kutip'],
          ['Tidak langsung', 'Parafrase', 'Tanpa tanda kutip, tetap mencantumkan sumber'],
        ],
      },
      { type: 'h2', text: 'Aturan penulisan' },
      {
        type: 'ul',
        items: [
          'Cantumkan nama belakang penulis dan tahun, misalnya (Santoso, 2024).',
          'Sertakan nomor halaman untuk kutipan langsung, misalnya (Santoso, 2024, hlm. 35).',
          'Kutipan panjang ditulis sebagai paragraf tersendiri dengan indentasi kiri sekitar 1,25 cm.',
          'Jangan mengubah kata di dalam kutipan; gunakan [sic] atau elipsis (...) bila perlu.',
          'Semua sumber yang dikutip harus muncul di daftar pustaka, dan sebaliknya.',
          'Hindari kutipan beruntun tanpa komentar; jelaskan kaitannya dengan pembahasan Anda.',
        ],
      },
      { type: 'h2', text: 'Contoh' },
      {
        type: 'p',
        text: 'Kutipan langsung pendek: Menurut Santoso (2024), “konsistensi format menunjukkan ketelitian penulis dalam menyusun argumen” (hlm. 35).',
      },
      {
        type: 'p',
        text: 'Kutipan tidak langsung: Ketelitian format sering dianggap cerminan ketelitian isi (Santoso, 2024).',
      },
      { type: 'h2', text: 'Kesalahan yang sering terjadi' },
      {
        type: 'ul',
        items: [
          'Memparafrase tanpa mencantumkan sumber sehingga tetap tergolong plagiarisme.',
          'Menulis tahun terbit yang berbeda antara teks dan daftar pustaka.',
          'Kutipan langsung tanpa nomor halaman.',
          'Mengutip dari sumber sekunder tanpa menyebut sumber aslinya.',
          'Menggabungkan beberapa sumber dalam satu tanda kurung tanpa pemisah yang jelas.',
          'Menyalin kalimat utuh lalu mengubah satu dua kata tanpa tanda kutip.',
        ],
      },
      {
        type: 'note',
        text: 'Gaya APA, MLA, dan pedoman kampus berbeda pada tanda baca serta urutan nama. Contoh di atas mengikuti pola APA yang paling umum; sesuaikan dengan pedoman resmi Anda.',
      },
    ],
  },
];

export const GUIDE_BY_SLUG = new Map(GUIDES.map((guide) => [guide.slug, guide]));

export function guideByPath(pathname) {
  const clean = pathname.replace(/\/+$/, '');
  if (clean === '/panduan') return { index: true, guide: null };
  const match = /^\/panduan\/([a-z0-9-]+)$/.exec(clean);
  if (!match) return null;
  const guide = GUIDE_BY_SLUG.get(match[1]);
  return guide ? { index: false, guide } : null;
}

/** Teks polos untuk <noscript> dan meta bila diperlukan crawler tanpa JS. */
export function guidePlainText(guide, maxChars = 1200) {
  const parts = [];
  for (const block of guide.blocks) {
    if (block.type === 'p' || block.type === 'note') parts.push(block.text);
    else if (block.type === 'h2') parts.push(`${block.text}.`);
    else if (block.type === 'ul') parts.push(block.items.join(' '));
    if (parts.join(' ').length > maxChars) break;
  }
  return parts.join(' ').slice(0, maxChars);
}
