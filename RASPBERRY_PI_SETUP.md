# Setup Otomatis Kiosk Raspberry Pi

Jika aplikasi tidak berjalan otomatis saat dinyalakan, ikuti panduan pasti berikut ini.

### 1. Simpan Proses PM2 (PENTING)
Dari log terminal Anda, PM2 sudah berhasil di-install ke system startup. Namun, Anda **wajib** menyimpan daftar proses saat ini agar PM2 tahu apa yang harus dijalankan saat boot.

Buka terminal dan jalankan:
```bash
# Pastikan Anda berada di folder aplikasi (misal: ~/PustakaKioskV4)
cd ~/PustakaKioskV4

# PENTING: Lakukan build aplikasi terlebih dahulu agar file server.cjs terbuat
npm run build

# Setelah build selesai, jalankan aplikasi dan rfid:
pm2 start npm --name "epustaka" -- run start
pm2 start python3 --name "rfid" -- rfid_sender.py

# SIMPAN PROSES (Ini yang membuat aplikasi otomatis jalan)
pm2 save
```

### 2. Autostart Brave Browser (Cara Paling Ampuh untuk Labwc)

Karena perintah langsung (inline) seringkali diabaikan oleh beberapa versi sistem operasi, cara paling 100% ampuh adalah membuat sebuah **script khusus** untuk menjalankan kiosk.

Buka terminal dan jalankan perintah-perintah ini secara berurutan:

**Langkah A: Hapus sisa percobaan sebelumnya (agar bersih)**
```bash
rm -f ~/.config/autostart/kiosk.desktop
rm -f ~/.config/labwc/autostart
```

**Langkah B: Buat Script Launcher Kiosk**
```bash
nano ~/start_kiosk.sh
```
Masukkan baris kode berikut ke dalam file tersebut:
```bash
#!/bin/bash
# Tunggu 10 detik agar PM2 dan WiFi terhubung
sleep 10

# Jalankan Brave di mode Kiosk (Wayland native)
brave-browser http://localhost:3000 --kiosk --noerrdialogs --disable-infobars --no-first-run --enable-features=UseOzonePlatform --ozone-platform=wayland
```
Simpan dengan **Ctrl+X**, tekan **Y**, lalu **Enter**.

**Langkah C: Jadikan Script Bisa Dieksekusi**
```bash
chmod +x ~/start_kiosk.sh
```

**Langkah D: Daftarkan ke Autostart (Penting: Gunakan Path Lengkap)**

Buka terminal dan hapus konfigurasi lama:
```bash
rm -f ~/.config/labwc/autostart
mkdir -p ~/.config/autostart
nano ~/.config/autostart/kiosk.desktop
```

Lalu masukkan kode ini ke dalamnya (kita menggunakan file `.desktop` standar karena ini yang paling didukung secara resmi oleh Raspberry Pi OS untuk GUI Autostart):

```ini
[Desktop Entry]
Type=Application
Name=Kiosk Browser
Exec=/home/admin/start_kiosk.sh
Terminal=false
X-GNOME-Autostart-enabled=true
```
Simpan dengan **Ctrl+X**, tekan **Y**, lalu **Enter**.

### 3. Tes & Restart Raspberry Pi
Sebelum restart, Anda bisa mengetesnya secara manual terlebih dahulu dengan menjalankan:
```bash
~/start_kiosk.sh
```
Jika browser berhasil terbuka fullscreen, silakan tutup kembali (Alt+F4 atau Ctrl+W), lalu lakukan restart total:
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
