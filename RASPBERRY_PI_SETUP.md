# Setup Otomatis Kiosk Raspberry Pi (Folder Baru)

Jika Anda ingin menginstall ulang aplikasi ke dalam folder baru di Raspberry Pi agar bersih, ikuti panduan pasti berikut ini.

### 1. Download & Persiapan Folder Baru
Buka terminal di Raspberry Pi Anda dan jalankan perintah berikut:

```bash
# Buka folder Documents atau folder root pilihan Anda
cd ~

# Buat folder baru (misalnya KioskV5) dan masuk ke dalamnya
mkdir KioskV5
cd KioskV5

# (Opsional) Download/clone kode aplikasi ke dalam folder ini
# misal: git clone <url-repo-anda> .  ATAU  download file ZIP dan ekstrak disini
```

Pastikan semua file project (termasuk `server.ts`, `package.json`, dan `rfid_sender.py`) sudah berada di dalam folder `~/KioskV5` tersebut.

### 2. Install Dependencies Aplikasi & Python
Masih di terminal dalam folder aplikasi yang baru:

```bash
# Install package Node.js
npm install

# Build aplikasi agar siap untuk dijalankan
npm run build

# Install library Python untuk RFID
pip3 install mfrc522 RPi.GPIO requests --break-system-packages
```
*(Catatan: flag `--break-system-packages` mungkin diperlukan di Debian 12 / Bookworm terbaru, jangan khawatir, ini aman untuk lingkungan Raspberry Pi lokal).*

### 3. Setup Database (Import file database.sql)
Aplikasi ini memerlukan database MariaDB/MySQL. File struktur dan data awal sudah tersedia di file `database.sql`.

Buka terminal dan jalankan perintah berikut secara berurutan:

```bash
# Pastikan Anda berada di folder aplikasi baru (misal: ~/KioskV5)
cd ~/KioskV5

# 1. Login ke MariaDB (kosongkan password jika defaultnya tanpa password, langsung tekan Enter)
# Jika ditolak, gunakan: sudo mariadb -u root
mariadb -u root -p

# Di dalam prompt MariaDB (MariaDB [(none)]>), jalankan:
CREATE DATABASE IF NOT EXISTS pustaka_kiosk;
EXIT;

# 2. Import file database.sql ke dalam database pustaka_kiosk
mariadb -u root -p pustaka_kiosk < database.sql
# (Atau gunakan: sudo mariadb -u root pustaka_kiosk < database.sql)

# 3. Setup file .env
# Copy template konfigurasi env
cp .env.example .env

# (Opsional) Edit file .env jika password database Anda bukan kosong
nano .env
```
*(Pastikan di dalam file `.env`, isi dari `DB_USER` dan `DB_PASSWORD` sesuai dengan konfigurasi database Raspberry Pi Anda. Jika Anda baru menginstall MariaDB di Raspberry Pi, biasanya `DB_USER=root` dan `DB_PASSWORD=` (kosong)).*

### 4. Setup PM2 (Agar Web Server & RFID Auto-run)
PM2 bertugas menjalankan web server dan script python RFID di background secara otomatis saat booting.

```bash
# Pastikan Anda berada di folder aplikasi baru
cd ~/KioskV5

# Hapus proses PM2 yang lama (jika ada)
pm2 delete epustaka || true
pm2 delete rfid || true

# Jalankan server web (Pastikan file dist/server.cjs sudah ada dari npm run build)
pm2 start npm --name "epustaka" -- run start

# Jalankan script RFID
pm2 start python3 --name "rfid" -- rfid_sender.py

# SIMPAN PROSES (Ini yang membuat aplikasi otomatis jalan)
pm2 save

# (Opsional) Pastikan pm2 sudah terdaftar di startup system
pm2 startup
```

### 5. Autostart Brave Browser (Kiosk Mode)
Agar tampilan browser otomatis fullscreen (Kiosk Mode) saat Raspi menyala:

**Langkah A: Buat Script Launcher**
```bash
nano ~/start_kiosk.sh
```
Masukkan baris kode berikut ke dalam file tersebut:
```bash
#!/bin/bash
# Tunggu 15 detik agar PM2, Database dan WiFi siap
sleep 15

# Jalankan Brave di mode Kiosk (Wayland native)
brave-browser http://localhost:3000 --kiosk --noerrdialogs --disable-infobars --no-first-run --enable-features=UseOzonePlatform --ozone-platform=wayland
```
Simpan dengan **Ctrl+X**, tekan **Y**, lalu **Enter**.

**Langkah B: Jadikan Script Bisa Dieksekusi**
```bash
chmod +x ~/start_kiosk.sh
```

**Langkah C: Daftarkan ke Autostart GUI**
Hapus autostart labwc lama (jika ada) dan buat file `.desktop` baru:
```bash
rm -f ~/.config/labwc/autostart
mkdir -p ~/.config/autostart
nano ~/.config/autostart/kiosk.desktop
```
Masukkan kode berikut:
```ini
[Desktop Entry]
Type=Application
Name=Kiosk Browser
Exec=/home/admin/start_kiosk.sh
Terminal=false
X-GNOME-Autostart-enabled=true
```
*(Catatan: Pastikan `Exec=` menunjuk ke lokasi yang benar. Jika username Anda bukan `admin`, ganti `/home/admin` menjadi `/home/username_anda`)*. Simpan dengan **Ctrl+X**, tekan **Y**, lalu **Enter**.

### 6. Tes & Restart Raspberry Pi
Sebelum restart, pastikan koneksi database di file `.env` (di dalam folder baru) sudah benar.
Lalu lakukan restart total:
```bash
sudo reboot
```

---
**Tanya Jawab (FAQ)**
- **Q: Apakah saat mengembalikan buku, status 'Peminjaman' di aktivitas terakhir hilang?**
- **A:** Betul. Karena sistem kita mengupdate data transaksi yang sama (dari status PINJAM berubah menjadi KEMBALI). Hal ini membuat daftar di aktivitas terakhir hanya menampilkan status *terbaru* dari transaksi tersebut (yaitu "mengembalikan"). Ini mencegah duplikasi data transaksi di database.
- **Q: Muncul peringatan `Xlib: extension "DRI2" missing` atau `vaInitialize failed` di terminal saat Kiosk berjalan. Apakah ini masalah?**
- **A:** **Tidak.** Itu adalah peringatan normal (harmless) dari engine Chromium/Brave di OS Linux/Raspberry Pi. Peringatan tersebut hanya menginformasikan bahwa *Hardware Video Acceleration* (untuk rendering video kualitas tinggi) tidak terdeteksi. Karena aplikasi ePustaka ini tidak digunakan untuk rendering video berat, peringatan ini **tidak akan** mempengaruhi performa maupun fungsionalitas aplikasi. Anda bisa mengabaikannya dengan aman.
- **Q: Kenapa tidak tersambung dengan database saya (pustaka_kiosk)?**
- **A:** Pastikan Anda sudah membuat file `.env` di dalam folder project dan mengisi konfigurasi koneksi database Anda (biasanya user `root` tanpa password, atau sesuaikan dengan pengaturan MariaDB/MySQL Anda). Juga pastikan service database sudah berjalan (`sudo systemctl status mariadb`). Jika menggunakan PM2, Anda mungkin perlu merestart prosesnya dengan perintah `pm2 restart epustaka --update-env` setelah mengubah file `.env`.
