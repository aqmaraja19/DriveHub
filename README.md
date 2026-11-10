# DriveHub - source code

## Struktur
- `index.html` — halaman utama.
- `upload-folder-1.html` — halaman upload folder 1.
- `upload-folder-2.html` — halaman upload folder 2.
- `upload-folder-3.html` — halaman upload folder 3.
- `apps-script/Code.gs` — backend Google Apps Script.

## 1. Siapkan folder Google Drive
Buat tiga folder di Google Drive. Buka setiap folder, salin ID yang ada pada URL setelah `/folders/`.

## 2. Pasang backend Apps Script
1. Buka https://script.google.com/ dan buat project baru.
2. Ganti isi `Code.gs` dengan kode pada `apps-script/Code.gs`.
3. Isi `FOLDER_1`, `FOLDER_2`, dan `FOLDER_3` dengan ID folder Drive yang benar (tanpa tanda kutip tambahan; pertahankan tanda kutip yang ada).
4. Klik Deploy > New deployment > Select type > Web app.
5. Execute as: Me.
6. Who has access: Anyone.
7. Deploy, izinkan akses yang diminta, lalu salin URL Web App yang berakhiran `/exec`.

## 3. Hubungkan halaman website
Di bagian paling bawah ketiga file `upload-folder-*.html`, cari:
`const SCRIPT_URL = "PASTE_URL_WEB_APP_GOOGLE_APPS_SCRIPT_DI_SINI";`
Ganti teks tersebut dengan URL `/exec` hasil deployment. Lakukan pada ketiga halaman.

## 4. Publikasikan di GitHub Pages
1. Buat repository GitHub.
2. Unggah empat file HTML ke root repository.
3. Aktifkan Settings > Pages > Deploy from a branch > `main` > `/ (root)`.
4. Tunggu proses publikasi, lalu buka URL GitHub Pages.

## 5. Uji
Coba unggah file kecil terlebih dahulu, misalnya PDF atau JPG di bawah 1 MB. Pastikan file masuk ke folder Drive yang sesuai.

## Catatan penting keamanan dan batas
- Website ini bersifat publik. Siapa pun yang mengetahui URL dapat mencoba mengunggah file ke Drive pemilik Apps Script.
- Tidak ada API key di frontend karena kunci yang ditaruh di HTML publik dapat dibaca siapa pun. Kode ini juga tidak menyediakan autentikasi, CAPTCHA, atau pembatasan frekuensi.
- Backend berjalan sebagai akun Google pemilik deployment. Penggunaan publik dapat menghabiskan kuota penyimpanan/Apps Script dan berpotensi disalahgunakan. Untuk layanan publik sungguhan, tambahkan CAPTCHA dan proteksi server-side atau gunakan backend perantara dengan rate limit.
- Batas antarmuka dan backend contoh ini 5 MB. Base64 menambah ukuran payload sekitar sepertiga; batas aktual Google Apps Script dapat lebih rendah/berubah. Jika gagal pada file besar, uji file lebih kecil.
- Progress bar menunjukkan pembacaan file dan tahap proses, bukan persentase transfer jaringan sebenarnya.
- Jangan membagikan ID folder atau mengubah izin folder menjadi publik hanya demi menerima upload. Apps Script menggunakan akses pemilik.
