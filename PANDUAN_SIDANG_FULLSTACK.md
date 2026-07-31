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

## 7. Bedah Kode (Potongan Kode Krusial yang Wajib Dikuasai)

Berikut adalah beberapa potongan kode (*code snippet*) paling penting dari aplikasi ini yang wajib Anda pahami logika dan cara kerjanya. Penguji sering meminta Anda untuk menunjukkan dan menjelaskan bagian-bagian ini.

### A. Backend (`server.ts`) - Validasi Hapus Anggota (Member)
**Lokasi Kode:** `app.delete("/api/members/:id", ...)`

Ini adalah logika pengaman (*guard logic*) untuk mencegah Admin menghapus anggota yang belum mengembalikan buku.

```typescript
// 1. Terima Request Delete dari Frontend
app.delete("/api/members/:id", async (req, res) => {
  const id = req.params.id; // Mengambil ID dari URL
  try {
    // 2. Mengecek apakah member ini masih punya transaksi 'BERJALAN' (Buku belum dikembalikan)
    const [borrowingCheck]: any = await db.execute(
      "SELECT COUNT(*) as count FROM transactions WHERE member_id = ? AND status = 'BERJALAN'",
      [Number(id)]
    );
    
    // 3. Jika count lebih dari 0, berarti masih ada pinjaman aktif. TOLAK request.
    if (borrowingCheck[0].count > 0) {
      // Mengirimkan status 400 (Bad Request) dan pesan error ke frontend
      return res.status(400).json({ error: "Anggota masih memiliki pinjaman buku yang belum dikembalikan" });
    }

    // 4. Jika lolos pengecekan, HAPUS riwayat transaksi terdahulu agar tidak error constraint
    await db.execute("DELETE FROM transactions WHERE member_id = ?", [Number(id)]);

    // 5. Terakhir, HAPUS data member itu sendiri dari database
    const [result]: any = await db.execute("DELETE FROM members WHERE id = ?", [Number(id)]);
    
    // Kirim response sukses (200 OK)
    res.json({ message: "Member deleted" });
  } catch (err: any) {
    res.status(500).json({ error: "Delete failed: " + err.message });
  }
});
```
**Poin Penjelasan untuk Dosen:**
Jelaskan bahwa Anda tidak langsung melakukan `DELETE FROM members`. Anda menggunakan `SELECT COUNT` terlebih dahulu untuk validasi bisnis. Ini menunjukkan Anda paham bahwa Data Integrity (Kerapian Data) sangat penting.

### B. Frontend (`src/App.tsx`) - Deteksi Scanner RFID
**Lokasi Kode:** `useEffect` pada saat proses pendaftaran/peminjaman.

Hardware RFID Scanner kita terdeteksi oleh komputer sebagai *Keyboard Simulator*. Saat kartu ditempel, alat akan mengetik UID dan diakhiri dengan tombol `Enter`.

```typescript
useEffect(() => {
  // Hanya jalankan listener ini saat state regStep adalah 'SCANNING' (Sedang proses daftar/tunggu tap)
  if (regStep !== 'SCANNING') return;

  // Fungsi yang akan terpanggil setiap kali ada tombol keyboard yang ditekan
  const handleKeyDown = (e: KeyboardEvent) => {
    // Jika tombol yang ditekan adalah 'Enter' dan inputan tidak kosong
    if (e.key === 'Enter' && scannedInput.trim()) {
      const uid = scannedInput.trim();
      
      // Mengecek apakah UID RFID ini sudah pernah didaftarkan oleh orang lain (Validasi Frontend)
      const isRegistered = members.some(m => m.rfid_uid === uid);
      
      if (isRegistered) {
         setErrorMsg("ID RFID sudah terdaftar pada anggota lain!");
      } else {
         // Lanjut ke form pendaftaran jika kartu baru (Belum terdaftar)
         setFormData(prev => ({ ...prev, rfid_uid: uid }));
         setRegStep('FORM');
      }
      
      // Kosongkan kembali input sementara untuk scan berikutnya
      setScannedInput("");
    } 
    // Jika bukan Enter, tampung karakter yang sedang "diketik" oleh alat RFID ke state scannedInput
    else if (e.key.length === 1) {
      setScannedInput(prev => prev + e.key);
    }
  };

  // Memasang (Mount) Event Listener ke layar (Window)
  window.addEventListener('keydown', handleKeyDown);
  
  // Cleanup Function (Unmount): Menghapus listener agar tidak bocor di memory jika halaman berpindah
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [regStep, scannedInput, members]); // Array Dependencies React
```
**Poin Penjelasan untuk Dosen:**
Jelaskan alasan mengapa menggunakan `window.addEventListener('keydown')` daripada `<input type="text">` biasa, yaitu agar Kiosk tidak memerlukan kursor/mouse sama sekali. Scanner langsung terdeteksi walaupun Kiosk tidak sedang diklik.

### C. Frontend (`src/App.tsx`) - Pemanggilan REST API (Delete)
**Lokasi Kode:** Fungsi `executeDelete`

Ini adalah contoh nyata bagaimana Frontend (*React*) memanggil (Hit) URL Backend untuk meminta penghapusan data.

```typescript
const executeDelete = async (id: number) => {
  // 1. Merangkai URL Endpoint
  const url = `/api/members/${id}`;
  
  try {
    // 2. Menggunakan fungsi 'fetch' bawaan browser dengan metode 'DELETE'
    const res = await fetch(url, { method: 'DELETE', cache: 'no-cache' });
    
    // 3. Cek apakah response dari Server GAGAL (Bukan 2xx)
    if (!res.ok) {
        // Ambil isi teks / JSON penolakan dari server
        const text = await res.text();
        let errorMsg = text;
        try {
          const json = JSON.parse(text);
          if (json.error) errorMsg = json.error; // Contoh menangkap teks "Anggota masih memiliki pinjaman..."
        } catch (e) {}
        
        // Munculkan notifikasi alert penolakan ke user Kiosk
        alert(`Gagal menghapus anggota: ${errorMsg}`);
    } else {
        // 4. Jika sukses (res.ok = true), muat ulang tabel member agar langsung ter-update di layar
        await loadMembers();
    }
  } catch (e) {
    alert('Terjadi kesalahan jaringan saat menghapus anggota');
  }
};
```
**Poin Penjelasan untuk Dosen:**
Buktikan bahwa Anda menangani (handle) kegagalan *response* dengan baik menggunakan blok `try...catch` dan memilah `!res.ok`. Jelaskan alur bagaimana pesan "Gagal menghapus" yang dibuat di `server.ts` dilempar ke `App.tsx` dan akhirnya bisa dibaca oleh pengguna di Kiosk.

### D. Database (`schema.sql`) - Sintaks Relasi (Primary Key & Foreign Key)
**Lokasi Kode:** `schema.sql` (File definisi database)

Dalam basis data relasional (SQL), penguji pasti akan bertanya tentang arsitektur tabel, khususnya konsep **Primary Key (PK)** dan **Foreign Key (FK)** yang berfungsi menjaga konsistensi data (*Data Integrity*).

```sql
-- Tabel Master (Data Utama)
CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY, -- [Ini adalah Primary Key]
    name VARCHAR(255) NOT NULL,
    rfid_uid VARCHAR(100) UNIQUE NOT NULL
    -- ...
);

CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY, -- [Ini adalah Primary Key]
    title VARCHAR(255) NOT NULL
    -- ...
);

-- Tabel Transaksi (Tabel Relasi/Pivot)
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    book_id INT NOT NULL,
    status ENUM('BERJALAN', 'SELESAI', 'TERLAMBAT') DEFAULT 'BERJALAN',
    
    -- [Ini adalah deklarasi Foreign Key]
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
);
```

**Poin Penjelasan (Jawaban) untuk Dosen:**
1. **Primary Key (PK):** Kunci Utama. Ini adalah *identitas unik* untuk setiap baris (record) data di sebuah tabel. 
   * *Contoh di kode:* Kolom `id` di tabel `members`. PK memastikan tidak ada data ganda (duplikat) yang bisa mengacaukan sistem saat proses *update* atau *delete*.
2. **Foreign Key (FK):** Kunci Tamu. Ini adalah kolom pada suatu tabel yang merujuk (*refer*) ke *Primary Key* di tabel lain. FK ini yang bertugas menciptakan **"Relasi" (Hubungan)** antar tabel.
   * *Contoh di kode:* Kolom `member_id` di dalam tabel `transactions` yang diikat (`REFERENCES`) ke `id` milik tabel `members`.
3. **Mengapa FK itu Sangat Penting? (Referential Integrity Constraint):**
   * Ini adalah jantung dari *database relasional*. Berkat adanya `FOREIGN KEY`, sistem database (MySQL/MariaDB) memiliki "aturan kaku" untuk mencegah data menjadi *yatim piatu (orphan)* atau rusak (inkonsisten).
   * **Kasus nyata di aplikasi ini (Wajib dijelaskan saat sidang):** *"Jika admin menghapus seorang anggota, tetapi anggota itu masih tercatat pernah meminjam buku di tabel transaksi, maka MySQL akan **menolak (ERROR)** penghapusan tersebut karena ada FK Constraint. Karena itulah, di backend (`server.ts`) saya membuat logika validasi: Jika dia sedang meminjam buku (`BERJALAN`), hapus ditolak! Tetapi jika admin memaksa menghapus atau dia tidak ada pinjaman aktif, maka riwayat di tabel transaksinya yang dihapus terlebih dahulu, barulah data anggotanya dihapus. Dengan begitu, tidak ada aturan database relasional yang dilanggar."*

---

## 8. Pustaka (Library) yang Digunakan dan Alasannya

Jika dosen penguji bertanya: *"Kamu pakai library apa saja untuk membangun sistem ini, dan kenapa tidak buat dari nol (scratch)?"* 

Jawablah dengan percaya diri bahwa penggunaan *library* di industri perangkat lunak modern (termasuk tugas akhir) adalah praktik yang sangat dianjurkan untuk efisiensi, keamanan, dan standardisasi. Berikut adalah daftar *library* krusial yang kita gunakan:

### 🚀 Frontend (Kiosk UI)
1. **`react` & `react-dom`**
   * **Fungsi:** Kerangka kerja (*framework*) utama untuk membangun antarmuka pengguna (UI).
   * **Alasan:** Memungkinkan pembuatan *Single Page Application (SPA)*. State (seperti input scanner RFID) bisa ditangani secara reaktif dan seketika tanpa harus *refresh* halaman. Sangat mulus untuk digunakan pada layar Kiosk.
2. **`tailwindcss`**
   * **Fungsi:** *Framework* CSS yang menggunakan pendekatan *Utility-First*.
   * **Alasan:** Mempercepat proses desain (*styling*). Daripada menulis ratusan baris file `.css` terpisah, kita cukup menambahkan nama *class* (seperti `flex`, `text-center`, `bg-blue-500`) langsung di dalam komponen HTML (JSX). Hasil desain juga otomatis responsif dan modern.
3. **`lucide-react`**
   * **Fungsi:** Kumpulan ikon berformat SVG.
   * **Alasan:** Ikon-ikonnya terlihat bersih, profesional, ringan (karena berbasis *vector*), dan sangat mudah diubah ukuran/warnanya hanya menggunakan *class* dari Tailwind.
4. **`html5-qrcode`** (atau sejenisnya untuk pembaca QR)
   * **Fungsi:** Modul untuk mengakses kamera (Webcam) pada browser dan mendeteksi pola QR Code.
   * **Alasan:** Proses pemindaian QR code melibatkan perhitungan matriks gambar yang sangat rumit secara matematis. Daripada membuat algoritma pengenalan gambar dari nol (yang bukan fokus utama TA ini), *library* ini mempermudah kita mendeteksi ID buku lewat tangkapan Webcam Kiosk secara *real-time*.
5. **`qrcode.react`**
   * **Fungsi:** *Library* pembuat (Generator) visual QR Code dari sekumpulan teks (String).
   * **Alasan:** Dipakai oleh Admin saat menambahkan buku baru. ID/Kode buku otomatis dikonversi menjadi gambar QR yang kemudian bisa dicetak/di-print untuk ditempel di fisik buku perpustakaan.

### ⚙️ Backend (Server & Database)
1. **`express`**
   * **Fungsi:** *Framework* *backend* minimalis untuk Node.js.
   * **Alasan:** Sangat mudah untuk mengatur Rute (Routes) seperti `GET /api/books` atau `POST /api/transactions`. Express mengurus banyak hal teknis (seperti penerimaan HTTP header dan parsing JSON) secara *under-the-hood*.
2. **`mysql2`**
   * **Fungsi:** Driver/Konektor yang menghubungkan server Express (Node.js) dengan database MySQL/MariaDB.
   * **Alasan:** Berbeda dengan driver versi lama, versi `mysql2` sudah mendukung *Promises* secara *native*. Artinya kita bisa memakai sintaks `async/await` di Javascript (yang lebih rapi daripada mekanisme *callback* tradisional) untuk mengambil data, dan mendukung fitur `Connection Pool` yang sangat stabil.
3. **`dotenv`**
   * **Fungsi:** Modul untuk membaca file `.env`.
   * **Alasan:** Keamanan. Kredensial database (seperti *username*, *password*, *port*) tidak boleh diketik mentah-mentah (*hardcode*) di dalam kode `server.ts` agar saat *source code* diunggah (misal ke GitHub), *password* tidak bocor. Modul ini menyembunyikan konfigurasi tersebut.

---

## 9. Pertanyaan Seputar TypeScript vs JavaScript (PENTING)

Jika Anda khawatir atau ditanya *"Kenapa menggunakan TypeScript (.ts/.tsx) dan bukan JavaScript (.js/.jsx) biasa?"*, berikut adalah penjelasan dan cara memahaminya:

### Mengapa Proyek Ini Harus Tetap Memakai TypeScript?
Mengubah ekstensi secara paksa dari `.ts` menjadi `.js` dalam ekosistem modern (seperti Vite + React) sangat berisiko menyebabkan *Build Error* dan aplikasi gagal berjalan (*Crash*). Konfigurasi server (esbuild, Vite) sudah diatur khusus untuk mengkompilasi TypeScript. Oleh karena itu, kita **wajib** mempertahankan format `.ts / .tsx`.

### Cara Mudah Membaca TypeScript layaknya JavaScript
Jangan panik! **TypeScript pada dasarnya adalah JavaScript 100%.** Bedanya hanyalah penambahan "label tipe data" untuk mencegah error. Jika Anda terbiasa dengan JavaScript, Anda cukup **mengabaikan teks yang berada setelah tanda titik dua (`:`)**.

**Contoh 1: Variabel**
* **TypeScript:** `const nama: string = "Zaidan";`
* **Cara Membacanya (JS):** Abaikan `: string`. Bayangkan saja tertulis `const nama = "Zaidan";`

**Contoh 2: Parameter Fungsi**
* **TypeScript:** `const executeDelete = async (id: number) => { ... }`
* **Cara Membacanya (JS):** Abaikan `: number`. Bayangkan saja tertulis `const executeDelete = async (id) => { ... }`

**Contoh 3: Interface / Type**
* **TypeScript:** 
  ```typescript
  interface Member {
    id: number;
    name: string;
  }
  ```
* **Cara Membacanya (JS):** Anggap saja blok kode `interface` ini **tidak ada**. Di JavaScript murni, ini memang tidak ada. Ini hanya "cetak biru" (*blueprint*) catatan agar Visual Studio Code tahu kolom apa saja yang ada di dalam variabel Member. Saat aplikasi dijalankan, kode `interface` ini akan dihapus secara otomatis.

**Contoh 4: Penggunaan `any`**
* **TypeScript:** `const [result]: any = await db.execute(...)`
* **Cara Membacanya (JS):** Kata `any` artinya "tipe data apa saja boleh". Abaikan `: any`. Bayangkan saja tertulis `const [result] = await db.execute(...)`

**Jawaban untuk Dosen Penguji (Jika Ditanya):**
*"Saya memilih TypeScript karena aplikasi Kiosk ini berjalan secara terus-menerus dan menangani perangkat eksternal (RFID, Kamera). TypeScript mencegah bug (error) sepele seperti salah ketik nama variabel atau salah tipe data (contoh: angka ditambahkan dengan teks) sebelum aplikasi dijalankan. Namun, secara logika bisnis, ia menggunakan dasar JavaScript (Node.js) yang sama persis."*

---

## 10. Komunikasi Hardware RFID (Mengapa Tidak Memakai WebSocket?)

Jika dosen bertanya: *"Bagaimana cara alat RFID Scanner mengirim data ke sistem? Apakah menggunakan WebSocket?"*

**Jawaban Singkat:**
**Tidak. Sistem ini menggunakan metode HTTP Polling (REST API) atau *Keyboard Emulation*, bukan WebSocket.**

**Penjelasan Teknis:**
Aplikasi kita mendukung 2 jenis alat RFID:
1. **Alat RFID model USB (Keyboard Emulator):**
   * Ini adalah alat yang paling banyak dijual di pasaran. Alat ini menancap lewat USB Kiosk. Komputer menganggapnya sebagai keyboard biasa.
   * Saat kartu ditepel, alat ini otomatis "mengetik" nomor UID dan menekan `Enter`.
   * **Cara kerjanya di aplikasi:** Di React (`App.tsx`), kita memasang `window.addEventListener('keydown')` untuk menangkap ketikan *keyboard* gaib ini secara langsung.

2. **Alat RFID eksternal berbasis Mikrokontroler (ESP8266/NodeMCU):**
   * Jika alat RFID terpisah dari Kiosk dan menggunakan WiFi (ESP8266/ESP32), kita menggunakan metode **HTTP Polling**.
   * **Mengapa tidak WebSocket?** Karena mikrokontroler murah seperti ESP8266 terkadang tidak stabil jika harus mempertahankan koneksi WebSocket yang nyala terus-menerus (*persistent connection*).
   * **Solusi HTTP Polling:**
     - Hardware (NodeMCU) menempelkan kartu dan cukup mengirim **1x HTTP POST** ke `http://ip-kiosk:3000/api/rfid/scan`.
     - Server (`server.ts`) menyimpan data ini sementara (sekitar 3 detik) di variabel memori server (`lastRFIDScan`).
     - Frontend Kiosk (React) menggunakan `setInterval` melakukan ping (*polling*) dengan cara memanggil `GET /api/rfid/consume` setiap **1 detik**.
     - Jika ada data UID baru, server memberikannya ke React lalu mengosongkan antrean memori.

Metode HTTP Polling sangat ringan dan sudah lebih dari cukup karena interaksi di mesin Kiosk perpustakaan ini tidak membutuhkan real-time mili-detik (seperti di game online).

---

## 🎯 Tips Sukses saat Demo Sidang:
1. **Gunakan Istilah Teknis yang Tepat:** Jangan bilang *"Aplikasinya ngirim data"*, tapi katakan *"Frontend melakukan request HTTP POST melalui endpoint REST API ke Backend"*.
2. **Beri Tekanan pada Validasi:** Jika ditanya, pamerkan fitur pengaman Anda. *"Untuk keamanan, saya memastikan di Backend jika admin menghapus member, sistem akan menolak jika member tersebut masih meminjam buku. Jika diizinkan (paksa), sistem akan otomatis mengembalikan (refund) stok buku dan menghapus riwayatnya agar database tidak error akibat constraint Foreign Key."*
3. **Jelaskan Peran Anda:** Jika Anda *Full Stack*, perjelas bahwa Anda membangun Jembatannya (API), Otaknya (Backend Node.js/Query Database), dan Wajahnya (React UI).

Tetap tenang, kuasai flow-nya, dan sukses untuk sidangnya!
