import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

let lastRFIDScan: { uid: string | null, timestamp: number } = { uid: null, timestamp: 0 };
let transactionVersion = 0;


const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user && req.user.role === 'ADMIN') {
      next();
    } else {
      res.sendStatus(403);
    }
  });
}

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Database connection
  let db: mysql.Pool | null = null;
  
  try {
    db = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "pustaka_kiosk",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    // Test the connection
    await db.query("SELECT 1");
    console.log("Connected to MySQL database pool");

    // Auto-migrate tables
    try {
      await db.execute("ALTER TABLE members ADD COLUMN max_borrow_limit INT DEFAULT 5");
    } catch(e: any) { /* ignore if exists */ }
    
    try {
      await db.execute("ALTER TABLE transactions ADD COLUMN fine_amount INT DEFAULT 0");
    } catch(e: any) { /* ignore if exists */ }

    try {
      await db.execute("ALTER TABLE transactions ADD COLUMN due_date DATETIME");
    } catch(e: any) { /* ignore if exists */ }

    try {
      await db.execute("ALTER TABLE transactions ADD COLUMN fine_status VARCHAR(20) DEFAULT 'BELUM_LUNAS'");
    } catch(e: any) { /* ignore if exists */ }

    try {
      await db.execute("ALTER TABLE transactions ADD COLUMN return_date DATETIME");
    } catch(e: any) { /* ignore if exists */ }
    
    // Insert dummy user for testing if it doesn't exist
    try {
      const [existing]: any = await db.execute("SELECT id FROM users WHERE student_id = '12345678'");
      if (existing.length === 0) {
        await db.execute(
          "INSERT INTO users (rfid_uid, name, student_id, role, max_borrow_limit) VALUES (?, ?, ?, ?, ?)",
          ['dummy123', 'Budi Santoso (Test User)', '12345678', 'SISWA', 5]
        );
        console.log("Inserted dummy user: 12345678");
      }
    } catch(e: any) { 
      console.error("Failed to insert dummy user", e);
    }


  } catch (err) {
    console.error("Failed to connect to MySQL database:", err);
    db = null; // Set to null so fallback mode activates
  }

  // --- Mock Data for Demo/Preview Mode ---
  let mockMembers = [
    { id: 1, username: 'admin', password: 'admin123', name: 'Administrator', role: 'ADMIN', max_borrow_limit: 999 }
  ];
  let mockBooks = [
    {
        "id": 3,
        "qr_code": "BK-749965NP",
        "title": "Membuat Kacang Lebih Enak",
        "author": "Karmila",
        "isbn": "ISBN 978-602-8266-83-3",
        "category": "Teknologi & Ilmu Terapan",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 5,
        "qr_code": "BK-8213028K",
        "title": "Gaya Bahasa dan Peribahasa dalam Bahasa Indonesia",
        "author": "Diah Erna Triningsih",
        "isbn": "ISBN 979-28-0599-4",
        "category": "Bahasa",
        "total_copies": 1,
        "available_copies": 2
    },
    {
        "id": 6,
        "qr_code": "BK-952159SO",
        "title": "Masjid Kuno di Jawa Tengah",
        "author": "Santoso, Budi, Sudaryanto, dan Djoko Dwi Nugroho.",
        "isbn": "ISBN 978-979-704-683-5",
        "category": "Agama",
        "total_copies": 2,
        "available_copies": 2
    },
    {
        "id": 7,
        "qr_code": "BK-248149AB",
        "title": "Pohon-Pohon Raksasa di Rimba Nusantara",
        "author": "Korrie Layun Rampan",
        "isbn": "ISBN 979-407-760-7",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 8,
        "qr_code": "BK-4024218I",
        "title": "Manifes Partai Komunis",
        "author": "Karl Marx dan Friedrich Engels",
        "isbn": " ",
        "category": "Sejarah & Geografi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 10,
        "qr_code": "BK-617099XD",
        "title": "Pedoman Umum Ejaan Bahasa Indonesia yang Disempurnakan",
        "author": "Lukman Ali",
        "isbn": "-",
        "category": "Bahasa",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 12,
        "qr_code": "BK-877168OV",
        "title": "Ayo Meresensi Buku",
        "author": "Sudaryanto",
        "isbn": "ISBN 978-979-026-184-6",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 14,
        "qr_code": "BK-1979734B",
        "title": "Pakinangan Masyarakat Jawa Tengah",
        "author": "Suhartati, Rina Prayekti, & Laela Nurhayati Dewi.",
        "isbn": "ISBN 978-979-704-684-2",
        "category": "Kesenian & Rekreasi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 16,
        "qr_code": "BK-188196AP",
        "title": "Segalanya untuk Rakyat",
        "author": "Sardan Marbun",
        "isbn": "-",
        "category": "Ilmu Sosial",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 20,
        "qr_code": "BK-01556034",
        "title": "Pedoman Umum Ejaan Bahasa Indonesia & Pedoman Umum Pembentukan Istilah",
        "author": "Badan Pengembangan dan Pembinaan Bahasa, Kementerian Pendidikan dan Kebudayaan Republik Indonesia",
        "isbn": "-",
        "category": "Bahasa",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 21,
        "qr_code": "BK-251396ER",
        "title": "Jurus Bisnis Rakyat: 12 Jawara Usaha Kecil",
        "author": "Ari Gunawan & Sulistiyono",
        "isbn": "ISBN 978-602-736-500-1",
        "category": "Ilmu Sosial",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 23,
        "qr_code": "BK-992272EJ",
        "title": "Puisi Dunia I (Gema Jiwa Slavia dan Latin)",
        "author": "M. Taslim Ali",
        "isbn": "ISBN 979-407-567-1",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 24,
        "qr_code": "BK-261377A3",
        "title": "Belajar Menulis",
        "author": "Monica Abigail W.",
        "isbn": "ISBN 978-602-8567-08-4",
        "category": "Buku Pendidikan",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 25,
        "qr_code": "BK-478012MB",
        "title": "Tas Plastik",
        "author": "Nyoman Sri Utami",
        "isbn": "-",
        "category": "Buku Fiksi Anak",
        "total_copies": 3,
        "available_copies": 3
    },
    {
        "id": 26,
        "qr_code": "BK-633060ML",
        "title": "Anak Kecil dengan Biolanya ",
        "author": "Pavel Vezhinov ",
        "isbn": "ISBN 979-666-606-5",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 27,
        "qr_code": "BK-857620VN",
        "title": "Sejarah Indonesia Jilid 7: Zaman Kemerdekaan dan Diplomasi Mempertahankan Kemerdekaan",
        "author": "Eko Praptanto",
        "isbn": "ISBN 978-979-050-021-1",
        "category": "Sejarah & Geografi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 28,
        "qr_code": "BK-301734ZL",
        "title": "Serendipity: Penemuan-Penemuan di Bidang Sains yang Tidak Disengaja",
        "author": "Royston M. Roberts",
        "isbn": "ISBN 0-471-50658-3",
        "category": "Sejarah & Geografi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 29,
        "qr_code": "BK-742363UE",
        "title": "Jangir Bali",
        "author": "Nur Sutan Iskandar",
        "isbn": "ISBN 979-666-225-6",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 30,
        "qr_code": "BK-9428142K",
        "title": "RPUL & RIPAL",
        "author": " Drs. Satyo Adi",
        "isbn": "ISBN 602-864-411-0 ",
        "category": "Sejarah & Geografi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 31,
        "qr_code": "BK-027545YO",
        "title": "Tanaman Kelapa yang Berdaya Guna",
        "author": "Westriningsih",
        "isbn": " ISBN 978-602-8266-91-8",
        "category": "Sains & Matematika",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 32,
        "qr_code": "BK-161301OU",
        "title": "30 Menit Beres Ulangan Harian & Dapat Nilai 100 SD/MI Kelas 5",
        "author": "Asosiasi Guru Bangsa",
        "isbn": "ISBN 978-602-7732-28-5",
        "category": "Buku Pendidikan",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 33,
        "qr_code": "BK-276135QG",
        "title": "Ke Rumah Kakek",
        "author": "Nyoman Sri Utami",
        "isbn": " ISBN 978-602-0832-30-2",
        "category": "Karya Fiksi Anak",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 34,
        "qr_code": "BK-324959D2",
        "title": "Bagian Seri: Bagaimana Kita Mengukur Luas",
        "author": "Chris Woodford",
        "isbn": "ISBN 979-534-536-7",
        "category": "Sains & Matematika",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 35,
        "qr_code": "BK-3961310W",
        "title": "Lima Masalah Terbesar Sains yang Belum Terpecahkan",
        "author": "Arthur W. Wiggins & Charles M. Wynn",
        "isbn": "ISBN 978-979-534-709-5",
        "category": "Sains & Matematika",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 38,
        "qr_code": "BK-709927CW",
        "title": "Mempelajari Banguan Ruang Limas ",
        "author": "Evi Rine Hartuti",
        "isbn": "-",
        "category": "Sains & Matematika",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 39,
        "qr_code": "BK-811387C1",
        "title": "Kerajinan Tangan dan Kesenian 5",
        "author": "Dra. Yati Priyati Sofyan dan Drs. Djamhur",
        "isbn": "ISBN 979-571-044-3",
        "category": "Kesenian & Rekreasi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 40,
        "qr_code": "BK-9110119H",
        "title": "Kesebangunan",
        "author": "Dewi Marsiyah",
        "isbn": "ISBN 978-979-28-0636-6",
        "category": "Sains & Matematika",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 41,
        "qr_code": "BK-0116827F",
        "title": "Himpunan Lengkap",
        "author": " ",
        "isbn": " ",
        "category": "Pendidikan",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 42,
        "qr_code": "BK-940439IN",
        "title": "Kisah Raden Patah Adipati Unus & Sultan Trenggono",
        "author": "Ahmad Shodikin",
        "isbn": "-",
        "category": "Sejarah & Geografi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 43,
        "qr_code": "BK-352066Y3",
        "title": "Terapi Jus untuk Kesehatan",
        "author": "Rianti Amanda",
        "isbn": "ISBN 978-602-99898-2-6",
        "category": "Teknologi & Ilmu Terapan",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 44,
        "qr_code": "BK-438051R0",
        "title": "Lelagon Dolanan: Seneng Nembang",
        "author": "Ign. Supardjo (Ignatius Supardjo)",
        "isbn": "-",
        "category": "Bahasa",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 45,
        "qr_code": "BK-562982XS",
        "title": "Akhir Sebuah Gerhana",
        "author": "Deriawan D.",
        "isbn": "ISBN 979-9117-02-X",
        "category": "Karya Fiksi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 46,
        "qr_code": "BK-6991780H",
        "title": "Rumah Mati di Siberia",
        "author": "F.M. Destojewski (Fyodor Dostoevsky)",
        "isbn": "ISBN 979-666-658-8",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 47,
        "qr_code": "BK-82455651",
        "title": "Mengapa Disebut Bentuk Baku dan Tidak Baku?",
        "author": "Dirgo Sabariyanto",
        "isbn": "ISBN 979-507-090-8; ISBN 979-507-091-6",
        "category": "Bahasa",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 48,
        "qr_code": "BK-952927V5",
        "title": "Lari, Gung! Lari!",
        "author": "Mahfud Ikhwan",
        "isbn": "ISBN 979-3632-88-9",
        "category": "Karya Fiksi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 49,
        "qr_code": "BK-0176495X",
        "title": "Evaluasi Hasil Belajar Bahasa Indonesia: Jilid 5",
        "author": "Tim Bakti Guru",
        "isbn": "-",
        "category": "Buku Pendidikan",
        "total_copies": 2,
        "available_copies": 2
    },
    {
        "id": 50,
        "qr_code": "BK-222363ZJ",
        "title": "Tuntunan Sekar Macapat",
        "author": "Ki Tentrem Warsena, L.C.",
        "isbn": "-",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 51,
        "qr_code": "BK-408571SD",
        "title": "Mengenal Alat Ukur",
        "author": "Alnurrizk Muthfisari",
        "isbn": "ISBN 979-28-0173-6",
        "category": "Sains & Matematika",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 52,
        "qr_code": "BK-523441YB",
        "title": "Bagaimana Hewan dan Tumbuhan Mempertahankan Diri",
        "author": "Wigati Hadi Omegawati",
        "isbn": "ISBN 979-28-0540-6",
        "category": "Sains & Matematika",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 53,
        "qr_code": "BK-560588XM",
        "title": "Menentukan Debit",
        "author": "Muklis",
        "isbn": "ISBN 979-28-0203-0",
        "category": "Sains & Matematika",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 54,
        "qr_code": "BK-667756SG",
        "title": "Sejarah Indonesia Jilid 2: Zaman Sejarah Kuna",
        "author": "Eko Praptanto",
        "isbn": "ISBN 978-979-050-016-7",
        "category": "Sejarah & Geografi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 55,
        "qr_code": "BK-741840FM",
        "title": "Kerajinan Tangan dan Kesenian 1: Untuk Sekolah Dasar Kelas 1",
        "author": "Tim Bina Karya Guru",
        "isbn": "ISBN 979-741-201-6",
        "category": "Pendidikan Dasar",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 56,
        "qr_code": "BK-818356BE",
        "title": "Bunga Rampai Peribahasa & Pantun untuk SD, SMP, SMA, dan Umum",
        "author": "M. Syamsul Hidayat, S.Pd.",
        "isbn": "-",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 57,
        "qr_code": "BK-924727H8",
        "title": "Museum Ranggawarsita sebagai Media dan Sumber Belajar Berbasis Kompetensi di SD/MI, SMP/MTs, SMA/MA",
        "author": "Dra. Hermawati, M.T., Drs. Sunarto, & Rohayati, B.B.A.",
        "isbn": "-",
        "category": "Pendidikan",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 58,
        "qr_code": "BK-1759553G",
        "title": "Habis Gelap Terbitlah Terang",
        "author": "Raden Adjeng (R.A.) Kartini",
        "isbn": "ISBN 978-979-407-063-5",
        "category": "Sejarah & Geografi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 59,
        "qr_code": "BK-219372F8",
        "title": "Budidaya dan Manfaat Mengkudu, Blustru, Ciplukan, & Mahkota Dewa",
        "author": "Kardono",
        "isbn": "ISBN 978-979-050-077-8",
        "category": "Teknologi & Ilmu Terapan",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 60,
        "qr_code": "BK-297454MY",
        "title": "Pertanian Organik",
        "author": "Nashshar F.M.",
        "isbn": "ISBN 978-602-8701-06-8",
        "category": "Sains & Matematika",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 61,
        "qr_code": "BK-406348BY",
        "title": "Kawruh Pepak Basa Jawa",
        "author": "Sunarto Wiguno / Sutopo",
        "isbn": "ISBN 978-602-9792-64-5",
        "category": "Bahasa",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 62,
        "qr_code": "BK-520676IB",
        "title": "Menuju Ginjal Sehat",
        "author": "Prof. Dr. dr. Djoko Santoso, Sp.PD-KGH, FINASIM",
        "isbn": "ISBN 979-1490-47-4",
        "category": "Teknologi & Ilmu Terapan",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 63,
        "qr_code": "BK-768794Y1",
        "title": "Dongeng Basa Jawi",
        "author": "Drs. Slamet Raharjo",
        "isbn": "-",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 64,
        "qr_code": "BK-829727QE",
        "title": "30 Tahun Indonesia Merdeka 1974-1975",
        "author": "Sudharmono, S.H.,",
        "isbn": "-",
        "category": "Sejarah & Geografis",
        "total_copies": 2,
        "available_copies": 2
    },
    {
        "id": 65,
        "qr_code": "BK-9879410T",
        "title": "Detik-Detik USBN SD/MI (untuk Tahun Pelajaran 2018/2019)",
        "author": "Muklis, Anton Suparyanta, dan Suparyanta",
        "isbn": "ISBN 978-979-28-2377-6",
        "category": "Buku Sekolah",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 66,
        "qr_code": "BK-227367C8",
        "title": "Ayo Kita Belajar Bertanam Palawija (Buku Pertama)",
        "author": "Tatang M.H.",
        "isbn": "ISBN 978-602-8063-01-2",
        "category": "Sains & Matematika",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 67,
        "qr_code": "BK-3444742A",
        "title": "Piknik",
        "author": "Nyoman Sri Utami",
        "isbn": "-",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 68,
        "qr_code": "BK-435865BV",
        "title": "Memahami Ilmu Pengetahuan Sosial Kelas 4, 5, 6 SD",
        "author": "Redaksi Kawan Pustaka",
        "isbn": "ISBN 979-757-042-8",
        "category": "Pendidikan",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 69,
        "qr_code": "BK-549756S8",
        "title": "Detik-Detik Ujian Sekolah/Madrasah Tahun Pelajaran 2016/2017 untuk SD/MI",
        "author": "Maya Gustina Sucipto",
        "isbn": "ISBN 979-28-1624-2",
        "category": "Pendidikan",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 70,
        "qr_code": "BK-705898BK",
        "title": "50 Tahun Indonesia Merdeka (1945-1965)",
        "author": "Nami Mulyani, Didik Djumadiono, Budi Salan",
        "isbn": "ISBN 979-8796-02-0",
        "category": "Sejarah",
        "total_copies": 2,
        "available_copies": 2
    },
    {
        "id": 71,
        "qr_code": "BK-838413UF",
        "title": "Kehidupan di Kolam",
        "author": "Nyoman Sri Utami",
        "isbn": "-",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 72,
        "qr_code": "BK-900582K3",
        "title": "Sudut dan Besaaarannya",
        "author": "Dewi Utama",
        "isbn": "ISBN 979-28-0369-3",
        "category": "Sains & Matematika",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 73,
        "qr_code": "BK-285449MS",
        "title": "Panggilan Tanah Kelahiran",
        "author": "Dt. B. Nurdin Jacub",
        "isbn": "ISBN 979-407-869-7",
        "category": "Buku Fiksi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 74,
        "qr_code": "BK-398667MJ",
        "title": "Pakan Udang: Nutrisi, Formulasi, Pembuatan, Pemberian",
        "author": "M. Ghufran H. Kordi K.",
        "isbn": "ISBN 978-602-838-120-8",
        "category": "Ilmu dan Teknologi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 75,
        "qr_code": "BK-489318PI",
        "title": "Kawruh Buku Pinter Basa Jawa Pepak",
        "author": "Angger Maulana F. dan M. Abi Totani",
        "isbn": "-",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 76,
        "qr_code": "BK-557464XP",
        "title": "Cerita Tematik: Aku Cinta Kebersihan",
        "author": "Rian F. Rahman",
        "isbn": "-",
        "category": "Buku Fiksi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 77,
        "qr_code": "BK-617647CX",
        "title": "Pertanian Organik",
        "author": "Nashshar",
        "isbn": "ISBN 978-602-8701-06-8",
        "category": "Ilmu dan Teknologi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 78,
        "qr_code": "BK-673564WK",
        "title": "Pak Haji yang Sok Tahu",
        "author": "Achmad Sunarto",
        "isbn": "-",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 79,
        "qr_code": "BK-7371840H",
        "title": "Eti Si Anak Teladan",
        "author": "Hudoyo M.Z.",
        "isbn": "-",
        "category": "Buku Fiksi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 80,
        "qr_code": "BK-801319V9",
        "title": "Kayu Jati: Si Bangsawan Dari Tanah Tandus",
        "author": "Dandang A. Dahlan",
        "isbn": "ISBN 978-602-8024-55-6",
        "category": "Ilmu & Teknologi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 81,
        "qr_code": "BK-961551EI",
        "title": "Ajang Apresiasi Ekspresi & Kreasi Siswa",
        "author": "Pelangi Pendidikan",
        "isbn": "-",
        "category": "Majalah",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 82,
        "qr_code": "BK-042521YF",
        "title": "Hikayat Kalilah dan Dimnah",
        "author": "Baidaba",
        "isbn": "ISBN 979-407-132-3",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 83,
        "qr_code": "BK-105524Y5",
        "title": "Garis dan Kedudukannya",
        "author": "Dewi Marsiyah",
        "isbn": "ISBN 979-28-0368-6",
        "category": "Sains & Matematika",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 84,
        "qr_code": "BK-214218IJ",
        "title": "Yuk... Membuat Pupuk Kompos",
        "author": "Ibnu Ahmad Ismail",
        "isbn": "ISBN 978-602-8266-70-3",
        "category": "Ilmu & Teknologi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 85,
        "qr_code": "BK-271263DE",
        "title": "Terjemah Juz`Amma",
        "author": "Ust. Chairul",
        "isbn": "-",
        "category": "Agama",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 86,
        "qr_code": "BK-329918KP",
        "title": "Blencong 45",
        "author": "Drs. H. Sutadi dan Dr. RMA. Sudi Yatmana",
        "isbn": "ISBN 979-736-460-7",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 87,
        "qr_code": "BK-402934SF",
        "title": "Asyiknya Matematika",
        "author": "Illah, S.T.",
        "isbn": "ISBN 978-602-96239-4-9",
        "category": "Sains & Matematika",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 88,
        "qr_code": "BK-478883QC",
        "title": "Pelajaran Baca Tulis Huruf Al-Quran dan Hafalan Surat Pendek Sekolah Dasar",
        "author": "H. Musafak, S.Ag, Suramin, S.Pd.I, dan Hudarrohman, S.Pd.I",
        "isbn": "-",
        "category": "Agama",
        "total_copies": 2,
        "available_copies": 2
    },
    {
        "id": 89,
        "qr_code": "BK-638743R0",
        "title": "Hikmah Abadi: Nilai-Nilai Tradisional dalam Wayang",
        "author": "Barnas Sumantri dan Kanti Walujo",
        "isbn": "ISBN 979-9289-05-X",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 90,
        "qr_code": "BK-69871520",
        "title": "Sari Kata Bahasa Indonesia Lengkap Untuk: Sekolah Dasar Kelas 3, 4, 5, 6",
        "author": "M. Abi Tofani & G.S. Nugroho",
        "isbn": "-",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 91,
        "qr_code": "BK-769954E8",
        "title": "Kisah Nabi Luth",
        "author": "MB. Rahimsyah. AR",
        "isbn": "-",
        "category": "Sejarah",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 92,
        "qr_code": "BK-830641M7",
        "title": "Manggis Buah Eksotik dari Tropis",
        "author": "Edi Warsidi",
        "isbn": "ISBN 978-602-99898-3-3",
        "category": "Ilmu & Teknologi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 93,
        "qr_code": "BK-686429PS",
        "title": "Naruto Vol. 63 (Dream World / Dunia Impian)",
        "author": "Masashi Kishimoto",
        "isbn": "ISBN 978-602-02-3174-7",
        "category": "Komik",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 94,
        "qr_code": "BK-939041E9",
        "title": "Sister Red - Dua Saudari Bertudung Merah",
        "author": "Jackson Pearce",
        "isbn": "ISBN 978-979-024-464-1",
        "category": "Fiksi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 95,
        "qr_code": "BK-119894RB",
        "title": "Pengorbanan",
        "author": "Rani Akyun, dkk",
        "isbn": "ISBN 978-602-5455-64-3",
        "category": "Motivasi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 96,
        "qr_code": "BK-28659939",
        "title": "Diary si Bocah Tengil: Usaha Terakhir",
        "author": "Jeff Kinney",
        "isbn": "ISBN 978-979-1411-24-0",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 97,
        "qr_code": "BK-545837AL",
        "title": "Warped: Sang Penenun Kehidupan",
        "author": "Maurissa Guibord",
        "isbn": "ISBN 978-979-024-497-9",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 98,
        "qr_code": "BK-71213909",
        "title": "Rooftoppers: Para Penghuni Atap",
        "author": "Katherine Rundell",
        "isbn": "ISBN 978-602-9251-31-9",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 99,
        "qr_code": "BK-928329P3",
        "title": "Little Stories: Lotus Creative Project",
        "author": "Adeste Adipriyanti, dkk",
        "isbn": "ISBN 978-602-03-0190-7",
        "category": "Fiksi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 100,
        "qr_code": "BK-0742614A",
        "title": "Seribu Warna Turkiye: Potret Lain Beasiswa, Pendidikan, Sastra, dan Kesenian",
        "author": "Turkish Spirits",
        "isbn": "ISBN 978-602-7696-46-4",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 101,
        "qr_code": "BK-333584EF",
        "title": "Cinta Paling Rumit",
        "author": "Boy Candra",
        "isbn": "ISBN 978-602-6475-96-1",
        "category": "Sastra",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 102,
        "qr_code": "BK-488515QT",
        "title": "Sherlock, Lupin & Aku 2: Babak Terakhir Drama Opera",
        "author": "Irene Adler",
        "isbn": "ISBN 978-602-4553-36-4",
        "category": "Fiksi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 103,
        "qr_code": "BK-6272301N",
        "title": "Cahaya Cinta Pesantren",
        "author": "Ira Madan",
        "isbn": "ISBN 978-602-257-928-1",
        "category": "Fiksi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 104,
        "qr_code": "BK-721095PQ",
        "title": "Crenshaw: Sahabat Beda Dunia",
        "author": "Katherine Applegate",
        "isbn": "ISBN 978-602-61099-2-7",
        "category": "Fiksi",
        "total_copies": 1,
        "available_copies": 1
    },
    {
        "id": 105,
        "qr_code": "BK-931321A3",
        "title": "Buku Pintar dan ATLAS Indonesia Dunia",
        "author": " ",
        "isbn": " ",
        "category": "pengetahuan umum",
        "total_copies": 1,
        "available_copies": 1
    }
];
  let mockTransactions: any[] = [];

  // --- API Routes ---

  // Get all members
  app.get("/api/members", requireAdmin, async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: "DB not connected" });
      const [rows] = await db.execute(`
        SELECT u.*, 
        (SELECT COUNT(*) FROM transactions t WHERE t.member_id = u.id AND t.status IN ('BERJALAN', 'TERLAMBAT')) as active_borrows 
        FROM users u WHERE u.role = 'SISWA' OR u.role = 'GURU' ORDER BY u.created_at DESC
      `);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Get member by RFID / username
  app.get("/api/members/:id", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: "DB not connected" });
      const [rows]: any = await db.execute(
        "SELECT u.*, (SELECT COUNT(*) FROM transactions t WHERE t.member_id = u.id AND t.status IN ('BERJALAN', 'TERLAMBAT')) as active_borrows FROM users u WHERE u.rfid_uid = ? OR u.username = ?", 
        [req.params.id, req.params.id]
      );
      if (rows.length === 0) return res.status(404).json({ error: "Member not found" });
      res.json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Create member
  app.post("/api/members", requireAdmin, async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: "DB not connected" });
      const { rfid_uid, name, role, max_borrow_limit, username, password } = req.body;
      const hash = password ? await bcrypt.hash(password, 10) : null;
      await db.execute(
        "INSERT INTO users (rfid_uid, name, role, max_borrow_limit, username, password) VALUES (?, ?, ?, ?, ?, ?)",
        [rfid_uid || null, name, role || 'SISWA', max_borrow_limit || 5, username || null, hash]
      );
      res.json({ message: "Member created" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Delete member
  app.delete("/api/members/:id", requireAdmin, async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: "DB not connected" });
      await db.execute("DELETE FROM users WHERE id = ?", [req.params.id]);
      res.json({ message: "Member deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Get all books
  app.get("/api/books", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: "DB not connected" });
      const { search } = req.query;
      let query = "SELECT * FROM books ORDER BY created_at DESC";
      let params: any[] = [];
      if (search) {
        query = "SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR category LIKE ? ORDER BY created_at DESC";
        const val = `%${search}%`;
        params = [val, val, val];
      }
      const [rows] = await db.execute(query, params);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Get book by QR / ID
  app.get("/api/books/:id", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: "DB not connected" });
      const [rows]: any = await db.execute("SELECT * FROM books WHERE qr_code = ? OR id = ?", [req.params.id, req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: "Book not found" });
      res.json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Create book
  app.post("/api/books", requireAdmin, async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: "DB not connected" });
      const { qr_code, title, author, isbn, category, publisher, total_copies, available_copies } = req.body;
      await db.execute(
        "INSERT INTO books (qr_code, title, author, isbn, category, publisher, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [qr_code, title, author, isbn || '-', category, publisher || '-', total_copies, available_copies]
      );
      res.json({ message: "Book created" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });
  
  // Delete book
  app.delete("/api/books/:id", requireAdmin, async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: "DB not connected" });
      await db.execute("DELETE FROM books WHERE id = ?", [req.params.id]);
      res.json({ message: "Book deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: "DB not connected" });
      const [rows] = await db.execute(`
        SELECT t.*, u.name as member_name, b.title as book_title, u.rfid_uid, b.qr_code 
        FROM transactions t 
        JOIN users u ON t.member_id = u.id 
        JOIN books b ON t.book_id = b.id 
        ORDER BY t.transaction_date DESC
      `);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: "DB not connected" });
      const { member_id, book_id, return_date, due_date } = req.body;
      if (req.body.status === 'SELESAI' || return_date) {
        // Return book logic
        await db.execute("UPDATE transactions SET status = 'SELESAI', return_date = NOW() WHERE member_id = ? AND book_id = ? AND status IN ('BERJALAN', 'TERLAMBAT')", [member_id, book_id]);
        await db.execute("UPDATE books SET available_copies = available_copies + 1 WHERE id = ?", [book_id]);
        transactionVersion++;
        return res.json({ message: "Returned" });
      } else {
        // Borrow book
        await db.execute("INSERT INTO transactions (member_id, book_id, status, due_date) VALUES (?, ?, 'BERJALAN', DATE_ADD(NOW(), INTERVAL 7 DAY))", [member_id, book_id]);
        await db.execute("UPDATE books SET available_copies = available_copies - 1 WHERE id = ?", [book_id]);
        transactionVersion++;
        return res.json({ message: "Borrowed" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.put("/api/transactions/:id/fine", requireAdmin, async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: "DB not connected" });
      await db.execute("UPDATE transactions SET fine_status = ? WHERE id = ?", [req.body.status, req.params.id]);
      transactionVersion++;
      res.json({ message: "Updated fine" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/transactions/version", (req, res) => {
    res.json({ version: transactionVersion });
  });

  // Stats
  app.get("/api/stats", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: "DB not connected" });
      const [totalBooks]: any = await db.execute("SELECT SUM(total_copies) as count FROM books");
      const [borrowedBooks]: any = await db.execute("SELECT COUNT(*) as count FROM transactions WHERE status IN ('BERJALAN', 'TERLAMBAT')");
      const [activeMembers]: any = await db.execute("SELECT COUNT(*) as count FROM users WHERE role = 'SISWA' OR role = 'GURU'");
      res.json({
        totalBooks: totalBooks[0].count || 0,
        borrowedBooks: borrowedBooks[0].count || 0,
        activeMembers: activeMembers[0].count || 0,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/stats/visitors", requireAdmin, async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: "DB not connected" });
      const [rows]: any = await db.execute(`
        SELECT DATE_FORMAT(transaction_date, '%Y-%m') as month, COUNT(DISTINCT member_id) as visitors
        FROM transactions
        GROUP BY month
        ORDER BY month ASC
      `);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Login
  app.post("/api/login", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: "DB not connected" });
      const { username, password } = req.body;
      const [rows]: any = await db.execute("SELECT * FROM users WHERE username = ? OR rfid_uid = ?", [username, username]);
      if (rows.length > 0) {
        const user = rows[0];
        const dbPassword = user.password || user.password_hash;
        let isMatch = false;
        
        if (dbPassword && password) {
          try {
            isMatch = await bcrypt.compare(password, dbPassword);
          } catch(e) {}
          if (!isMatch && dbPassword === password) isMatch = true;
        } else if ((username === user.rfid_uid || username === user.username) && (!password || password === '')) {
          isMatch = true;
        }

        if (isMatch) {
          const tokenUser = { id: user.id, username: user.username || user.rfid_uid, role: user.role || 'SISWA', name: user.name };
          const token = jwt.sign(tokenUser, JWT_SECRET, { expiresIn: '12h' });
          return res.json({ success: true, user: tokenUser, token, remoteUrl: process.env.APP_URL || "http://localhost:3000" });
        }
      }
      res.status(401).json({ error: "Username/RFID atau Password salah" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/users/:id/history", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: "DB not connected" });
      const [rows] = await db.execute(`
        SELECT t.*, b.title as book_title, b.qr_code
        FROM transactions t
        JOIN books b ON t.book_id = b.id
        WHERE t.member_id = ?
        ORDER BY t.transaction_date DESC
      `, [req.params.id]);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/rfid/consume", (req, res) => {
    const uid = lastRFIDScan.uid;
    lastRFIDScan = { uid: null, timestamp: 0 };
    res.json({ uid });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PustakaKiosk Server running on http://localhost:${PORT}`);
  });
}
startServer();
