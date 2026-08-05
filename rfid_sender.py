#!/usr/bin/env python3
import sys
import os
import glob

# Sertakan site-packages user lokal agar `sudo python3` tetap dapat menemukan library mfrc522 dan requests
for path in glob.glob('/home/*/.local/lib/python*/site-packages'):
    if path not in sys.path:
        sys.path.append(path)

import requests
import time

# Konfigurasi URL Server ePustaka. 
# Secara default mengirim ke http://localhost:3000/api/rfid/scan
# Jika server berjalan di HP/Laptop lain dalam WiFi yang sama, sertakan IP sebagai argumen, contoh:
# python3 rfid_sender.py http://192.168.1.10:3000
DEFAULT_HOST = "http://localhost:3000"

if len(sys.argv) > 1 and sys.argv[1].startswith("http"):
    target = sys.argv[1].rstrip("/")
    if not target.endswith("/api/rfid/scan"):
        API_URL = f"{target}/api/rfid/scan"
    else:
        API_URL = target
else:
    API_URL = f"{DEFAULT_HOST}/api/rfid/scan"

def send_rfid_scan(uid):
    """Fungsi untuk mengirim UID Kartu RFID ke server aplikasi ePustaka"""
    print(f"[-->] Mengirim UID: {uid} ke {API_URL} ...")
    try:
        response = requests.post(API_URL, json={"uid": str(uid)}, timeout=5)
        if response.status_code == 200:
            data = response.json()
            member = data.get('member')
            member_str = f"({member.get('name')})" if member else "(Belum Terdaftar)"
            print(f"[V] Berhasil terkirim ke ePustaka! Member: {member_str}")
        else:
            print(f"[X] Gagal: Server merespon {response.status_code} - {response.text}")
    except Exception as e:
        print(f"[X] Error koneksi: {e}")
        print(f"    Pastikan server ePustaka berjalan di: {API_URL}")

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
        print("Jalankan: pip3 install mfrc522 RPi.GPIO requests")
        sys.exit(1)

    print('=============================================')
    print(f'SISTEM MFRC522 SIAP - Target: {API_URL}')
    print('Silakan tempelkan kartu pada reader RFID.')
    print('Tekan Ctrl+C untuk keluar.')
    print('=============================================')

    reader = None
    try:
        reader = SimpleMFRC522()
    except Exception as e:
        print(f"Warning saat inisialisasi MFRC522: {e}")

    last_id = None
    last_time = 0

    try:
        while True:
            try:
                if reader is None:
                    reader = SimpleMFRC522()

                # Gunakan read_id_no_block() agar tidak menggantung (blocking) di library mfrc522
                card_id = None
                if hasattr(reader, 'read_id_no_block'):
                    card_id = reader.read_id_no_block()
                else:
                    # Fallback ke read_no_block()
                    id_res, _ = reader.read_no_block()
                    card_id = id_res

                if card_id is not None:
                    current_time = time.time()
                    clean_id = str(card_id).trim() if hasattr(str(card_id), 'trim') else str(card_id).strip()
                    
                    # Cek jika kartu baru atau jeda tap sudah > 2.5 detik
                    if clean_id != str(last_id) or (current_time - last_time) > 2.5:
                        print(f"\n[+] Kartu RFID Terdeteksi: {clean_id}")
                        send_rfid_scan(clean_id)
                        last_id = clean_id
                        last_time = current_time

                # Reset register antenna MFRC522 agar kartu berikutnya dapat langsung terbaca
                try:
                    if hasattr(reader, 'READER'):
                        reader.READER.MFRC522_Init()
                except Exception:
                    pass

            except Exception as read_err:
                # Jika terjadi glitch pada koneksi SPI/GPIO, re-create instance reader
                try:
                    reader = SimpleMFRC522()
                except Exception:
                    pass

            time.sleep(0.3)

    except KeyboardInterrupt:
        print("\n[!] Keluar dari program rfid_sender.")
    finally:
        try:
            GPIO.cleanup()
        except Exception:
            pass

if __name__ == "__main__":
    start_hardware_scanner()
