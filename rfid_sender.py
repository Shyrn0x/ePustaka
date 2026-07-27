import requests
import time
import sys

# Konfigurasi URL Lokal. 
# Jika website berjalan di Raspberry Pi yang sama, gunakan localhost.
# Jika website berjalan di laptop dalam jaringan WiFi yang sama, ganti IP_LAYANAN_LOCAL 
# dengan IP Laptop Anda (contoh: 192.168.1.10)
# Pastikan menggunakan format http://...:3000
API_URL = "http://localhost:3000/api/rfid/scan"

def send_rfid_scan(uid):
    """Fungsi untuk mengirim UID Kartu RFID ke server aplikasi Kios lokal"""
    print(f"Mengirim UID: {uid} ke {API_URL} ...")
    try:
        response = requests.post(API_URL, json={"uid": str(uid)}, timeout=5)
        if response.status_code == 200:
            print(" Berhasil terkirim!")
        else:
            print(f" Gagal: {response.text}")
    except Exception as e:
        print(f" Error koneksi: {e} - Pastikan server menyala di {API_URL}")

# ==========================================================
# RASPBERRY PI HARDWARE MODE (MFRC522 SPI)
# ==========================================================
# Pastikan library terinstall: 
# pip3 install mfrc522 RPi.GPIO requests

def start_hardware_scanner():
    try:
        import RPi.GPIO as GPIO
        from mfrc522 import SimpleMFRC522
    except ImportError:
        print("Library RPi.GPIO atau mfrc522 tidak ditemukan.")
        print("Jalankan: pip3 install mfrc522 RPi.GPIO")
        sys.exit(1)

    reader = SimpleMFRC522()
    print('=============================================')
    print(f'SISTEM MFRC522 SIAP - Target: {API_URL}')
    print('Silakan tempelkan kartu pada reader RFID.')
    print('Tekan Ctrl+C untuk keluar.')
    print('=============================================')

    try:
        last_id = None
        last_time = 0
        while True:
            # Membaca id kartu
            id, text = reader.read()
            current_time = time.time()
            
            # Debouncing untuk mencegah kirim berulang-ulang dari tap yang sama
            if id != last_id or (current_time - last_time) > 3.0:
                print(f"\nKartu terdeteksi: {id}")
                send_rfid_scan(str(id))
                last_id = id
                last_time = current_time
                
            time.sleep(0.5)

    except KeyboardInterrupt:
        print("\nKeluar dari program.")
    finally:
        GPIO.cleanup()

if __name__ == "__main__":
    start_hardware_scanner()
