# Analisis desain workspace Word / RapiMakalah

## Acuan resmi

- [Word help & learning](https://support.microsoft.com/en-us/word/)
- [Format teks dan kelompok Font pada Home](https://support.microsoft.com/en-us/word/training/add-and-edit-text)
- [Layout → Margins](https://support.microsoft.com/en-us/word/training/change-margins)
- [Insert → Pictures](https://support.microsoft.com/en-us/word/training/insert-pictures)
- [Ruler dan penanda indentasi](https://support.microsoft.com/en-gb/word/using-the-ruler-in-word)

Dokumentasi membedakan Word Windows, Mac, dan web; tampilan dan kemampuan tidak selalu identik. RapiMakalah menggunakan pola interaksi tersebut dengan istilah Indonesia dan identitas sendiri.

## Temuan dan rancangan

| Area | Masalah sebelumnya | Rancangan |
| --- | --- | --- |
| Judul | Status, judul, tombol dan shell bersaing mengambil ruang | Judul dokumen dan autosave dalam title bar, akses cepat simpan/undo/redo |
| Perintah | Format dan Insert bertumpuk, kontrol paragraf selalu tampil | Ribbon bertab dan kelompok Font, Paragraf, Gaya, Sisipkan |
| Kertas | Font tetap ukuran desktop saat kertas mengecil di HP sehingga jumlah halaman membengkak | Zoom-fit mengubah skala seluruh lembar (isi, margin, ruler, dan spasi) bersama; zoom kustom hanya mengubah tampilan |
| Navigasi | Dokumen panjang hanya bisa digulir | Panel heading dan pencarian teks, lompat ke posisi dalam dokumen |
| Konteks | Operasi tabel/gambar bercampur dengan toolbar umum | Tab kontekstual Tabel/Gambar saat objek dipilih |
| Status | Informasi halaman terpisah dari kontrol tampilan | Status bar jumlah kata, halaman, format A4 dan zoom |
| HP | Toolbar panjang dan tinggi | Tab dapat digeser; isi ribbon bergulir horizontal, tombol sentuh dan mode fokus |

## Cakupan implementasi

Berfungsi: autosave/pemulihan lokal, upload DOCX ke draft baru, unduh DOCX, font/ukuran/warna/highlight, bold/italic/underline/strike, hapus format, gaya heading, perataan/list, indent dan spasi paragraf, gambar lokal/ukuran, tabel/operasi sel, garis horizontal, page break, pagination tampilan, ruler, navigasi heading/cari, jumlah kata, zoom dan mode fokus.

Masih perlu pengembangan yang berguna untuk editor: margin dan ukuran/orientasi kertas kustom per section, header/footer dan nomor halaman DOCX, daftar isi/rujukan/footnote, kolom, rumus, bentuk/grafik, image wrapping, tab stop, spellchecker, print/PDF, dan kompatibilitas penuh dokumen Word. Komentar tim, track changes dan kolaborasi real time sengaja tidak diprioritaskan karena bukan kebutuhan inti penulisan mandiri. Mail merge dan proteksi dokumen juga di luar fokus aplikasi makalah.

Pengaturan font baru harus dipertahankan saat autosave dan ekspor. Pembagian halaman editor mengikuti pengukuran browser; Word dapat menghitung baris dan halaman berbeda. Zoom hanya mengubah tampilan, bukan ukuran font dalam draft atau DOCX. Fitur upload/pemformatan lama tidak menggunakan komponen workspace baru ini.
