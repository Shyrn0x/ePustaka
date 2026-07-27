# Panduan Sidang Tugas Akhir - Full Stack Developer (ePustaka)

Selamat atas pencapaian Anda hingga tahap sidang Tugas Akhir! Sebagai **Full Stack Developer** dalam proyek ePustaka (Kiosk Perpustakaan Mandiri dengan RFID & QR Code), dosen penguji biasanya akan menguji pemahaman Anda secara menyeluruh dari sisi antarmuka (Frontend), logika server (Backend), hingga manajemen data (Database). 

Berikut adalah rangkuman materi, konsep krusial, dan kemungkinan pertanyaan (FAQ) yang **wajib** Anda pahami untuk menjawab pertanyaan saat sidang.

---

## 1. Arsitektur Sistem (Secara Keseluruhan)
**Konsep yang harus dipahami:**
- **Client-Server Architecture:** Proyek ini menggunakan model Client-Server. Frontend (React) bertindak sebagai *Client* yang berjalan di browser (Kiosk), sedangkan *Server* (Express.js/Node.js) memproses logika bisnis dan menjembatani komunikasi ke Database (MySQL/MariaDB).
- **Alur Komunikasi (REST API):** Frontend meminta atau mengirim data ke Backend melalui protokol HTTP dengan format data **JSON** (JavaScript Object Notation). Backend memprosesnya ke Database, lalu mengembalikan *response* (status kode 200 OK, 400 Bad Request, 500 Internal Server Error, dll).

## 2. Frontend (React.js, Tailwind CSS)
Anda bertanggung jawab atas antarmuka interaktif pada layar sentuh/Kiosk.
- **State Management (React Hooks):**
  - `useState`: Digunakan untuk menyimpan data sementara di tampilan, seperti teks yang sedang diketik, status loading, daftar buku hasil scan, dll.
  - `useEffect`: Digunakan untuk menjalankan efek samping, misalnya memanggil (fetch) data buku dan member dari backend tepat setelah halaman dimuat pertama kali.
- **Integrasi Hardware di Frontend:**
  - **Scanner QR Code (Webcam):** Menggunakan pustaka (library) berbasis web. Kamera secara konstan menangkap frame gambar, mencari pola QR code, dan jika ditemukan, membaca teks/kode dari QR tersebut.
  - **Scanner RFID (Kartu Anggota):** RFID Reader umumnya terdeteksi sebagai *Keyboard Emulator* (USB). Saat kartu ditempelkan, alat akan mengetikkan UID kartu dengan sangat cepat dan diakhiri dengan tombol `Enter`.

## 3. Backend (Node.js & Express.js)
Backend adalah otak dari aplikasi Anda. Penguji sering bertanya tentang validasi dan *Business Logic*.
- **Connection Pool:** 
  - Di aplikasi kita, koneksi ke MySQL menggunakan *Connection Pool* (`mysql.createPool()`). Ini menjaga beberapa koneksi tetap hidup (*keep-alive*) sehingga mencegah aplikasi terputus ke database jika sedang *idle* (diam) lama, dan siap menerima banyak *request* bersamaan.
- **Validasi Keamanan Sistem:**
  - Contoh: Mencegah Admin menghapus Member jika Member tersebut masih memiliki status transaksi peminjaman yang aktif / `BERJALAN`.

## 4. Database (MySQL / MariaDB)
- **Struktur Tabel (Schema):**
  1. `books`: Menyimpan data buku (judul, pengarang, stok, kode qr).
  2. `members`: Menyimpan data peminjam (nama, UID RFID, nomor identitas).
  3. `transactions`: Tabel **Transaksional/Pivot** yang mencatat aktivitas. (Menyimpan `member_id`, `book_id`, `borrow_date`, `status`).
- **Relasi & Foreign Key (Integritas Data):**
  - Tabel `transactions` memiliki `member_id` dan `book_id`. Jika *Member* dihapus, kita wajib menghapus atau menyinkronkan data di `transactions` terlebih dahulu agar tidak error (pelanggaran Foreign Key constraint).

---

## 5. Pertanyaan Populer Dosen Penguji (FAQ & Alasan Penggunaan)

### Q: Kenapa memilih React.js untuk Frontend?
**Jawaban (Hafalkan poin ini):**
1. **Single Page Application (SPA):** React memungkinkan aplikasi berjalan di satu halaman tanpa perlu *reload/refresh* ke server secara penuh. Ini *wajib* untuk mesin Kiosk agar interaksi pengguna terasa mulus, instan, dan tidak ada layar putih/loading *browser*.
2. **State Management yang Handal:** Aplikasi ini menerima input alat eksternal (RFID Scanner & Kamera QR) secara *real-time*. React sangat tangguh dalam menangani perubahan *state* (kondisi) secara cepat tanpa membuat *lag* pada tampilan.
3. **Component-based:** Kodingan UI dipisah menjadi blok-blok kecil (komponen) sehingga mudah dirawat jika sistemnya akan diperbesar (Scalability).

### Q: Kenapa memilih Express.js (Node.js) untuk Backend?
**Jawaban:**
1. **Bahasa Pemrograman yang Sama (JavaScript/TypeScript):** Baik antarmuka (React) maupun server (Express) ditulis menggunakan bahasa ekosistem yang sama. Ini mempercepat proses *development* (Full-Stack JS).
2. **Asynchronous & Non-blocking I/O:** Node.js didesain untuk menangani *request* tanpa menghentikan (mem-blokir) proses lain. Ketika mesin Kiosk sedang melakukan verifikasi ke database, sistem tetap berjalan lancar dan siap memproses perintah lain (Sangat cocok untuk perangkat *Single Board Computer* seperti Raspberry Pi/Mini PC).
3. **Ringan & Ekosistem Terbesar:** Tidak memakan banyak memori, dan library NPM memudahkan integrasi apapun.

### Q: Apa itu REST API dan kenapa kita memakainya?
**Jawaban:**
- **Definisi:** REST API adalah arsitektur yang bertindak sebagai "jembatan komunikasi" internet. Frontend (Kiosk) dan Backend (Database) berbincang menggunakan format **JSON** via jalur *HTTP Request* (GET, POST, PUT, DELETE).
- **Mengapa dipakai (Alasan Skalabilitas/Decoupling):** Menggunakan REST API berarti kita memisahkan (Decouple) sistem Visual dengan sistem Data. **Kelebihannya:** Jika tahun depan pihak kampus/sekolah meminta dibuatkan "Aplikasi Mobile Android ePustaka" untuk mahasiswa, kita *TIDAK PERLU* membuat Backend/Database baru. Aplikasi Android tersebut cukup memanggil (Hit) URL REST API yang saat ini sudah berjalan.

---

## 6. Flow (Alur) Sistem ePustaka

Berikut adalah skema alur data (Data Flow) yang terjadi dari mulai pengguna menekan layar hingga data masuk ke database:

### A. Flow Peminjaman Buku (Borrow Flow)
1. **Trigger Hardware (Frontend):** Pengguna menempelkan kartu mahasiswa ke RFID Reader. Hardware mengetikkan UID kartu (contoh: `0123456789`).
2. **Request API (Frontend -> Backend):** React menangkap UID tersebut dan mengirim *HTTP Request* ke backend untuk mengecek apakah ID ini ada di tabel `members`.
3. **Validasi Member (Backend -> Database):** Express.js mengeksekusi `SELECT * FROM members WHERE rfid = ...`. Jika valid, profil member dikembalikan ke layar.
4. **Scan Buku (Frontend):** Kamera Kiosk diaktifkan. Pengguna meletakkan kode QR buku ke kamera. Library React mendeteksi ID buku dan mengirimkannya ke backend.
5. **Konfirmasi Final (Frontend -> Backend):** Setelah selesai scan, pengguna menekan tombol **"Konfirmasi Pinjam"**. Frontend mengirim `POST /api/transactions` berisi `(ID Member, Array[ID Buku])`.
6. **Logika Transaksional (Backend -> Database):**
   - Backend memverifikasi stok buku `available_copies > 0`.
   - Melakukan eksekusi `INSERT INTO transactions` dengan status `'BERJALAN'`.
   - Melakukan eksekusi `UPDATE books SET available_copies = available_copies - 1`.
7. **Response Akhir:** Backend mengirim status `200 OK`. React memunculkan pesan "Berhasil Dipinjam" dan Kiosk me-reset halaman ke awal.

### B. Flow Pengembalian Buku (Return Flow)
1. **Trigger (Frontend):** Pengguna memilih menu Pengembalian. Kamera Kiosk langsung membaca kode QR buku.
2. **Request API (Frontend -> Backend):** Kode QR langsung dikirim ke Backend (`POST /api/transactions/return` atau sejenisnya).
3. **Validasi (Backend -> Database):** 
   - Express mengeksekusi `SELECT` ke tabel `transactions` untuk mencari apakah ada transaksi buku ini yang berstatus `'BERJALAN'`.
4. **Logika Transaksional (Backend -> Database):**
   - Jika ditemukan, ubah/`UPDATE` status di tabel `transactions` menjadi `'SELESAI'`.
   - Ubah/`UPDATE` tabel `books` dengan menambah stok (`available_copies = available_copies + 1`).
5. **Response Akhir:** Backend mengirim respons sukses. React menampilkan "Buku berhasil dikembalikan" di layar Kiosk.

---

## 🎯 Tips Sukses saat Demo Sidang:
1. **Gunakan Istilah Teknis yang Tepat:** Jangan bilang *"Aplikasinya ngirim data"*, tapi katakan *"Frontend melakukan request HTTP POST melalui endpoint REST API ke Backend"*.
2. **Beri Tekanan pada Validasi:** Jika ditanya, pamerkan fitur pengaman Anda. *"Untuk keamanan, saya memastikan di Backend jika admin menghapus member, sistem akan menolak jika member tersebut masih meminjam buku. Jika diizinkan (paksa), sistem akan otomatis mengembalikan (refund) stok buku dan menghapus riwayatnya agar database tidak error akibat constraint Foreign Key."*
3. **Jelaskan Peran Anda:** Jika Anda *Full Stack*, perjelas bahwa Anda membangun Jembatannya (API), Otaknya (Backend Node.js/Query Database), dan Wajahnya (React UI).

Tetap tenang, kuasai flow-nya, dan sukses untuk sidangnya!
