-- phpMyAdmin SQL Dump
-- Database: `pustaka_kiosk`

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255),
    rfid_uid VARCHAR(100) UNIQUE,
    name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) UNIQUE,
    role VARCHAR(20) DEFAULT 'SISWA',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    max_borrow_limit INT DEFAULT 5
);

CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    qr_code VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100) NOT NULL,
    isbn VARCHAR(50),
    category VARCHAR(50),
    publisher VARCHAR(100),
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    book_id INT NOT NULL,
    type ENUM('PINJAM', 'KEMBALI') NOT NULL,
    status ENUM('BERJALAN', 'SELESAI', 'TERLAMBAT') DEFAULT 'BERJALAN',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    return_date TIMESTAMP NULL,
    fine_amount INT DEFAULT 0,
    fine_status VARCHAR(20) DEFAULT 'BELUM_LUNAS',
    FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);



--
-- Data untuk tabel-tabel
--

INSERT IGNORE INTO `users` (`id`, `username`, `password`, `name`, `role`, `created_at`, `max_borrow_limit`) VALUES
(1000, 'admin', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Administrator', 'ADMIN', '2026-05-14 10:35:50', 999);

INSERT IGNORE INTO `users` (`id`, `rfid_uid`, `name`, `student_id`, `role`, `created_at`, `max_borrow_limit`) VALUES
(1, 'user123', 'Zaidan Arrifqi', '3.33.23.1.24', 'SISWA', '2026-07-31 10:00:00', 5);

INSERT IGNORE INTO `books` (`id`, `qr_code`, `title`, `author`, `isbn`, `category`, `publisher`, `total_copies`, `available_copies`, `created_at`) VALUES
(3, 'BK-749965NP', 'Membuat Kacang Lebih Enak', 'Karmila', 'ISBN 978-602-8266-83-3', 'Teknologi & Ilmu Terapan', 'Permata Equator Media', 1, 1, '2026-06-05 14:27:07'),
(5, 'BK-8213028K', 'Gaya Bahasa dan Peribahasa dalam Bahasa Indonesia', 'Diah Erna Triningsih', 'ISBN 979-28-0599-4', 'Bahasa', 'PT Intan Pariwara', 1, 2, '2026-06-05 14:31:42'),
(6, 'BK-952159SO', 'Masjid Kuno di Jawa Tengah', 'Santoso, Budi, Sudaryanto, dan Djoko Dwi Nugroho.', 'ISBN 978-979-704-683-5', 'Agama', 'Dinas Kebudayaan dan Pariwisata, Museum Jawa Tengah Ranggawarsita, Semarang', 2, 2, '2026-06-05 14:37:19'),
(7, 'BK-248149AB', 'Pohon-Pohon Raksasa di Rimba Nusantara', 'Korrie Layun Rampan', 'ISBN 979-407-760-7', 'Sastra', 'PT Balai Pustaka (Persero)', 1, 1, '2026-06-05 14:39:45'),
(8, 'BK-4024218I', 'Manifes Partai Komunis', 'Karl Marx dan Friedrich Engels', ' ', 'Sejarah & Geografi', 'Jajasan Pembaruan', 1, 1, '2026-06-05 14:41:44'),
(10, 'BK-617099XD', 'Pedoman Umum Ejaan Bahasa Indonesia yang Disempurnakan', 'Lukman Ali', '-', 'Bahasa', 'Departemen Pendidikan dan Kebudayaan', 1, 1, '2026-06-05 14:45:21'),
(12, 'BK-877168OV', 'Ayo Meresensi Buku', 'Sudaryanto', 'ISBN 978-979-026-184-6', 'Sastra', 'PT Pustaka Insan Madani', 1, 1, '2026-06-05 14:50:10'),
(14, 'BK-1979734B', 'Pakinangan Masyarakat Jawa Tengah', 'Suhartati, Rina Prayekti, & Laela Nurhayati Dewi.', 'ISBN 978-979-704-684-2', 'Kesenian & Rekreasi', 'Dinas Kebudayaan dan Pariwisata Provinsi Jawa Tengah', 1, 1, '2026-06-05 14:56:08'),
(16, 'BK-188196AP', 'Segalanya untuk Rakyat', 'Sardan Marbun', '-', 'Ilmu Sosial', 'Sambung Hati 9949', 1, 1, '2026-06-06 02:38:08'),
(20, 'BK-01556034', 'Pedoman Umum Ejaan Bahasa Indonesia & Pedoman Umum Pembentukan Istilah', 'Badan Pengembangan dan Pembinaan Bahasa, Kementerian Pendidikan dan Kebudayaan Republik Indonesia', '-', 'Bahasa', ' Badan Pengembangan dan Pembinaan Bahasa (Kementerian Pendidikan dan Kebudayaan RI)', 1, 1, '2026-06-06 02:50:39'),
(21, 'BK-251396ER', 'Jurus Bisnis Rakyat: 12 Jawara Usaha Kecil', 'Ari Gunawan & Sulistiyono', 'ISBN 978-602-736-500-1', 'Ilmu Sosial', 'PT Imaji Kali Aksi', 1, 1, '2026-06-06 02:53:42'),
(23, 'BK-992272EJ', 'Puisi Dunia I (Gema Jiwa Slavia dan Latin)', 'M. Taslim Ali', 'ISBN 979-407-567-1', 'Sastra', 'PT Balai Pustaka (Persero)', 1, 1, '2026-06-06 03:07:28'),
(24, 'BK-261377A3', 'Belajar Menulis', 'Monica Abigail W.', 'ISBN 978-602-8567-08-4', 'Buku Pendidikan', 'PT Temprina Media Grafika', 1, 1, '2026-06-06 03:10:54'),
(25, 'BK-478012MB', 'Tas Plastik', 'Nyoman Sri Utami', '-', 'Buku Fiksi Anak', 'PT Pelangi Indonesia', 3, 3, '2026-06-06 03:13:46'),
(26, 'BK-633060ML', 'Anak Kecil dengan Biolanya ', 'Pavel Vezhinov ', 'ISBN 979-666-606-5', 'Sastra', 'PT Balai Pustaka (Persero)', 1, 1, '2026-06-06 03:16:53'),
(27, 'BK-857620VN', 'Sejarah Indonesia Jilid 7: Zaman Kemerdekaan dan Diplomasi Mempertahankan Kemerdekaan', 'Eko Praptanto', 'ISBN 978-979-050-021-1', 'Sejarah & Geografi', 'PT Bina Sumber Daya MIPA', 1, 1, '2026-06-06 03:24:46'),
(28, 'BK-301734ZL', 'Serendipity: Penemuan-Penemuan di Bidang Sains yang Tidak Disengaja', 'Royston M. Roberts', 'ISBN 0-471-50658-3', 'Sejarah & Geografi', 'PT Pakar Raya Pustaka', 1, 1, '2026-06-06 03:31:25'),
(29, 'BK-742363UE', 'Jangir Bali', 'Nur Sutan Iskandar', 'ISBN 979-666-225-6', 'Sastra', 'PT Balai Pustaka', 1, 1, '2026-06-06 03:35:36'),
(30, 'BK-9428142K', 'RPUL & RIPAL', ' Drs. Satyo Adi', 'ISBN 602-864-411-0 ', 'Sejarah & Geografi', 'Bintang Timur / CV Bringin 55', 1, 1, '2026-06-06 03:36:58'),
(31, 'BK-027545YO', 'Tanaman Kelapa yang Berdaya Guna', 'Westriningsih', ' ISBN 978-602-8266-91-8', 'Sains & Matematika', 'PT Permata Equator Media', 1, 1, '2026-06-06 03:39:00'),
(32, 'BK-161301OU', '30 Menit Beres Ulangan Harian & Dapat Nilai 100 SD/MI Kelas 5', 'Asosiasi Guru Bangsa', 'ISBN 978-602-7732-28-5', 'Buku Pendidikan', 'Laskar Aksara / Laskar Askara', 1, 1, '2026-06-06 03:41:00'),
(33, 'BK-276135QG', 'Ke Rumah Kakek', 'Nyoman Sri Utami', ' ISBN 978-602-0832-30-2', 'Karya Fiksi Anak', 'Yayasan Literasi Anak Indonesia (YLAI)', 1, 1, '2026-06-06 03:41:59'),
(34, 'BK-324959D2', 'Bagian Seri: Bagaimana Kita Mengukur Luas', 'Chris Woodford', 'ISBN 979-534-536-7', 'Sains & Matematika', 'PT Pakar Raya Pustaka', 1, 1, '2026-06-06 03:43:07'),
(35, 'BK-3961310W', 'Lima Masalah Terbesar Sains yang Belum Terpecahkan', 'Arthur W. Wiggins & Charles M. Wynn', 'ISBN 978-979-534-709-5', 'Sains & Matematika', 'PT Pakar Raya Pustaka Bandung', 1, 1, '2026-06-06 03:44:37'),
(38, 'BK-709927CW', 'Mempelajari Banguan Ruang Limas ', 'Evi Rine Hartuti', '-', 'Sains & Matematika', ' PT Intan Pariwara', 1, 1, '2026-06-06 03:50:06'),
(39, 'BK-811387C1', 'Kerajinan Tangan dan Kesenian 5', 'Dra. Yati Priyati Sofyan dan Drs. Djamhur', 'ISBN 979-571-044-3', 'Kesenian & Rekreasi', 'PT Ganeca Exact Bandung', 1, 1, '2026-06-06 03:51:37'),
(40, 'BK-9110119H', 'Kesebangunan', 'Dewi Marsiyah', 'ISBN 978-979-28-0636-6', 'Sains & Matematika', 'PT Intan Pariwara', 1, 1, '2026-06-06 03:53:14'),
(41, 'BK-0116827F', 'Himpunan Lengkap', ' ', ' ', 'Pendidikan', ' ', 1, 1, '2026-06-06 03:54:07'),
(42, 'BK-940439IN', 'Kisah Raden Patah Adipati Unus & Sultan Trenggono', 'Ahmad Shodikin', '-', 'Sejarah & Geografi', 'Putra Bintoro', 1, 1, '2026-06-07 13:58:45'),
(43, 'BK-352066Y3', 'Terapi Jus untuk Kesehatan', 'Rianti Amanda', 'ISBN 978-602-99898-2-6', 'Teknologi & Ilmu Terapan', 'CV Sanggabuana', 1, 1, '2026-06-07 14:43:53'),
(44, 'BK-438051R0', 'Lelagon Dolanan: Seneng Nembang', 'Ign. Supardjo (Ignatius Supardjo)', '-', 'Bahasa', 'CV Cendrawasih', 1, 1, '2026-06-07 14:46:00'),
(45, 'BK-562982XS', 'Akhir Sebuah Gerhana', 'Deriawan D.', 'ISBN 979-9117-02-X', 'Karya Fiksi', 'CV Griya Wiyata', 1, 1, '2026-06-07 14:47:59'),
(46, 'BK-6991780H', 'Rumah Mati di Siberia', 'F.M. Destojewski (Fyodor Dostoevsky)', 'ISBN 979-666-658-8', 'Sastra', 'PT Balai Pustaka (Persero)', 1, 1, '2026-06-07 14:50:22'),
(47, 'BK-82455651', 'Mengapa Disebut Bentuk Baku dan Tidak Baku?', 'Dirgo Sabariyanto', 'ISBN 979-507-090-8; ISBN 979-507-091-6', 'Bahasa', 'Mitra Gama Widya', 1, 1, '2026-06-07 14:52:28'),
(48, 'BK-952927V5', 'Lari, Gung! Lari!', 'Mahfud Ikhwan', 'ISBN 979-3632-88-9', 'Karya Fiksi', 'PT Sunda Kelapa Pustaka', 1, 1, '2026-06-07 14:53:35'),
(49, 'BK-0176495X', 'Evaluasi Hasil Belajar Bahasa Indonesia: Jilid 5', 'Tim Bakti Guru', '-', 'Buku Pendidikan', 'PT Remaja Rosdakarya', 2, 2, '2026-06-07 14:56:24'),
(50, 'BK-222363ZJ', 'Tuntunan Sekar Macapat', 'Ki Tentrem Warsena, L.C.', '-', 'Sastra', 'CV Cendrawasih', 1, 1, '2026-06-07 15:00:06'),
(51, 'BK-408571SD', 'Mengenal Alat Ukur', 'Alnurrizk Muthfisari', 'ISBN 979-28-0173-6', 'Sains & Matematika', 'PT Intan Pariwara', 1, 1, '2026-06-07 15:01:12'),
(52, 'BK-523441YB', 'Bagaimana Hewan dan Tumbuhan Mempertahankan Diri', 'Wigati Hadi Omegawati', 'ISBN 979-28-0540-6', 'Sains & Matematika', 'PT Intan Pariwara', 1, 1, '2026-06-07 15:02:38'),
(53, 'BK-560588XM', 'Menentukan Debit', 'Muklis', 'ISBN 979-28-0203-0', 'Sains & Matematika', 'PT Intan Pariwara', 1, 1, '2026-06-07 15:04:26'),
(54, 'BK-667756SG', 'Sejarah Indonesia Jilid 2: Zaman Sejarah Kuna', 'Eko Praptanto', 'ISBN 978-979-050-016-7', 'Sejarah & Geografi', 'PT Bina Sumber Daya MIPA', 1, 1, '2026-06-07 15:05:40'),
(55, 'BK-741840FM', 'Kerajinan Tangan dan Kesenian 1: Untuk Sekolah Dasar Kelas 1', 'Tim Bina Karya Guru', 'ISBN 979-741-201-6', 'Pendidikan Dasar', 'Erlangga', 1, 1, '2026-06-07 15:06:57'),
(56, 'BK-818356BE', 'Bunga Rampai Peribahasa & Pantun untuk SD, SMP, SMA, dan Umum', 'M. Syamsul Hidayat, S.Pd.', '-', 'Sastra', 'Apollo / Apollo Lestari', 1, 1, '2026-06-07 15:08:43'),
(57, 'BK-924727H8', 'Museum Ranggawarsita sebagai Media dan Sumber Belajar Berbasis Kompetensi di SD/MI, SMP/MTs, SMA/MA', 'Dra. Hermawati, M.T., Drs. Sunarto, & Rohayati, B.B.A.', '-', 'Pendidikan', 'Dinas Kebudayaan dan Pariwisata Provinsi Jawa Tengah', 1, 1, '2026-06-07 15:12:01'),
(58, 'BK-1759553G', 'Habis Gelap Terbitlah Terang', 'Raden Adjeng (R.A.) Kartini', 'ISBN 978-979-407-063-5', 'Sejarah & Geografi', 'PT Balai Pustaka (Persero)', 1, 1, '2026-06-07 15:13:34'),
(59, 'BK-219372F8', 'Budidaya dan Manfaat Mengkudu, Blustru, Ciplukan, & Mahkota Dewa', 'Kardono', 'ISBN 978-979-050-077-8', 'Teknologi & Ilmu Terapan', 'PT Armandelta Selaras', 1, 1, '2026-06-07 15:14:55'),
(60, 'BK-297454MY', 'Pertanian Organik', 'Nashshar F.M.', 'ISBN 978-602-8701-06-8', 'Sains & Matematika', 'Walatra', 1, 1, '2026-06-07 15:16:35'),
(61, 'BK-406348BY', 'Kawruh Pepak Basa Jawa', 'Sunarto Wiguno / Sutopo', 'ISBN 978-602-9792-64-5', 'Bahasa', 'Palito Media / Brian Publisher', 1, 1, '2026-06-07 15:18:24'),
(62, 'BK-520676IB', 'Menuju Ginjal Sehat', 'Prof. Dr. dr. Djoko Santoso, Sp.PD-KGH, FINASIM', 'ISBN 979-1490-47-4', 'Teknologi & Ilmu Terapan', 'JP Books (PT. JePe Press Media Utama)', 1, 1, '2026-06-07 15:20:34'),
(63, 'BK-768794Y1', 'Dongeng Basa Jawi', 'Drs. Slamet Raharjo', '-', 'Sastra', 'Media Wiyata', 1, 1, '2026-06-07 15:23:07'),
(64, 'BK-829727QE', '30 Tahun Indonesia Merdeka 1974-1975', 'Sudharmono, S.H.,', '-', 'Sejarah & Geografis', 'Sekretariat Negara Republik Indonesia', 2, 2, '2026-06-08 01:26:08'),
(65, 'BK-9879410T', 'Detik-Detik USBN SD/MI (untuk Tahun Pelajaran 2018/2019)', 'Muklis, Anton Suparyanta, dan Suparyanta', 'ISBN 978-979-28-2377-6', 'Buku Sekolah', 'PT Intan Pariwara', 1, 1, '2026-06-08 01:29:27'),
(66, 'BK-227367C8', 'Ayo Kita Belajar Bertanam Palawija (Buku Pertama)', 'Tatang M.H.', 'ISBN 978-602-8063-01-2', 'Sains & Matematika', 'PT Adfale Prima Cipta', 1, 1, '2026-06-08 01:32:08'),
(67, 'BK-3444742A', 'Piknik', 'Nyoman Sri Utami', '-', 'Sastra', 'Yayasan Literasi Anak Indonesia', 1, 1, '2026-06-08 01:33:01'),
(68, 'BK-435865BV', 'Memahami Ilmu Pengetahuan Sosial Kelas 4, 5, 6 SD', 'Redaksi Kawan Pustaka', 'ISBN 979-757-042-8', 'Pendidikan', 'Kawan Pustaka', 1, 1, '2026-06-08 01:34:58'),
(69, 'BK-549756S8', 'Detik-Detik Ujian Sekolah/Madrasah Tahun Pelajaran 2016/2017 untuk SD/MI', 'Maya Gustina Sucipto', 'ISBN 979-28-1624-2', 'Pendidikan', 'PT Intan Pariwara', 1, 1, '2026-06-08 01:37:00'),
(70, 'BK-705898BK', '50 Tahun Indonesia Merdeka (1945-1965)', 'Nami Mulyani, Didik Djumadiono, Budi Salan', 'ISBN 979-8796-02-0', 'Sejarah', 'Citra Media Persada', 2, 2, '2026-06-08 01:39:59'),
(71, 'BK-838413UF', 'Kehidupan di Kolam', 'Nyoman Sri Utami', '-', 'Sastra', 'Yayasan Literasi Anak Indonesia', 1, 1, '2026-06-08 01:41:11'),
(72, 'BK-900582K3', 'Sudut dan Besaaarannya', 'Dewi Utama', 'ISBN 979-28-0369-3', 'Sains & Matematika', 'PT Intan Pariwara', 1, 1, '2026-06-08 01:42:44'),
(73, 'BK-285449MS', 'Panggilan Tanah Kelahiran', 'Dt. B. Nurdin Jacub', 'ISBN 979-407-869-7', 'Buku Fiksi', 'PT Balai Pustaka', 1, 1, '2026-06-08 02:05:38'),
(74, 'BK-398667MJ', 'Pakan Udang: Nutrisi, Formulasi, Pembuatan, Pemberian', 'M. Ghufran H. Kordi K.', 'ISBN 978-602-838-120-8', 'Ilmu dan Teknologi', 'Akademia', 1, 1, '2026-06-08 02:07:42'),
(75, 'BK-489318PI', 'Kawruh Buku Pinter Basa Jawa Pepak', 'Angger Maulana F. dan M. Abi Totani', '-', 'Sastra', 'Nidya Pustaka', 1, 1, '2026-06-08 02:08:52'),
(76, 'BK-557464XP', 'Cerita Tematik: Aku Cinta Kebersihan', 'Rian F. Rahman', '-', 'Buku Fiksi', 'Lingkar Media', 1, 1, '2026-06-08 02:09:43'),
(77, 'BK-617647CX', 'Pertanian Organik', 'Nashshar', 'ISBN 978-602-8701-06-8', 'Ilmu dan Teknologi', 'Walatra', 1, 1, '2026-06-08 02:10:49'),
(78, 'BK-673564WK', 'Pak Haji yang Sok Tahu', 'Achmad Sunarto', '-', 'Sastra', 'Aulia', 1, 1, '2026-06-08 02:11:51'),
(79, 'BK-7371840H', 'Eti Si Anak Teladan', 'Hudoyo M.Z.', '-', 'Buku Fiksi', 'CV Widya Duta', 1, 1, '2026-06-08 02:12:55'),
(80, 'BK-801319V9', 'Kayu Jati: Si Bangsawan Dari Tanah Tandus', 'Dandang A. Dahlan', 'ISBN 978-602-8024-55-6', 'Ilmu & Teknologi', 'Era Pustaka Utama', 1, 1, '2026-06-08 02:14:40'),
(81, 'BK-961551EI', 'Ajang Apresiasi Ekspresi & Kreasi Siswa', 'Pelangi Pendidikan', '-', 'Majalah', 'Direktorat Pembinaan Sekolah Menengah Pertama', 1, 1, '2026-06-08 02:16:54'),
(82, 'BK-042521YF', 'Hikayat Kalilah dan Dimnah', 'Baidaba', 'ISBN 979-407-132-3', 'Sastra', 'PT Balai Pustaka', 1, 1, '2026-06-08 02:18:04'),
(83, 'BK-105524Y5', 'Garis dan Kedudukannya', 'Dewi Marsiyah', 'ISBN 979-28-0368-6', 'Sains & Matematika', 'PT Intan Pariwara', 1, 1, '2026-06-08 02:19:08'),
(84, 'BK-214218IJ', 'Yuk... Membuat Pupuk Kompos', 'Ibnu Ahmad Ismail', 'ISBN 978-602-8266-70-3', 'Ilmu & Teknologi', 'Permata Equator Media', 1, 1, '2026-06-08 02:20:54'),
(85, 'BK-271263DE', 'Terjemah Juz`Amma', 'Ust. Chairul', '-', 'Agama', 'Sahabat', 1, 1, '2026-06-08 02:21:36'),
(86, 'BK-329918KP', 'Blencong 45', 'Drs. H. Sutadi dan Dr. RMA. Sudi Yatmana', 'ISBN 979-736-460-7', 'Sastra', 'Aneka Ilmu', 1, 1, '2026-06-08 02:22:54'),
(87, 'BK-402934SF', 'Asyiknya Matematika', 'Illah, S.T.', 'ISBN 978-602-96239-4-9', 'Sains & Matematika', 'CV Cipta Dea', 1, 1, '2026-06-08 02:24:12'),
(88, 'BK-478883QC', 'Pelajaran Baca Tulis Huruf Al-Quran dan Hafalan Surat Pendek Sekolah Dasar', 'H. Musafak, S.Ag, Suramin, S.Pd.I, dan Hudarrohman, S.Pd.I', '-', 'Agama', 'CV Timbul Soraya Pratama', 2, 2, '2026-06-08 02:25:44'),
(89, 'BK-638743R0', 'Hikmah Abadi: Nilai-Nilai Tradisional dalam Wayang', 'Barnas Sumantri dan Kanti Walujo', 'ISBN 979-9289-05-X', 'Sastra', 'Pustaka Pelajar', 1, 1, '2026-06-08 02:28:01'),
(90, 'BK-69871520', 'Sari Kata Bahasa Indonesia Lengkap Untuk: Sekolah Dasar Kelas 3, 4, 5, 6', 'M. Abi Tofani & G.S. Nugroho', '-', 'Sastra', 'Kartika', 1, 1, '2026-06-08 02:29:01'),
(91, 'BK-769954E8', 'Kisah Nabi Luth', 'MB. Rahimsyah. AR', '-', 'Sejarah', 'Serba Jaya', 1, 1, '2026-06-08 02:30:12'),
(92, 'BK-830641M7', 'Manggis Buah Eksotik dari Tropis', 'Edi Warsidi', 'ISBN 978-602-99898-3-3', 'Ilmu & Teknologi', 'CV Sanggabuana', 1, 1, '2026-06-08 02:31:34'),
(93, 'BK-686429PS', 'Naruto Vol. 63 (Dream World / Dunia Impian)', 'Masashi Kishimoto', 'ISBN 978-602-02-3174-7', 'Komik', 'PT Elex Media Computindo', 1, 1, '2026-06-11 01:22:09'),
(94, 'BK-939041E9', 'Sister Red - Dua Saudari Bertudung Merah', 'Jackson Pearce', 'ISBN 978-979-024-464-1', 'Fiksi', 'Atria', 1, 1, '2026-06-11 01:25:09'),
(95, 'BK-119894RB', 'Pengorbanan', 'Rani Akyun, dkk', 'ISBN 978-602-5455-64-3', 'Motivasi', 'Jejak Publisher', 1, 1, '2026-06-11 01:28:00'),
(96, 'BK-28659939', 'Diary si Bocah Tengil: Usaha Terakhir', 'Jeff Kinney', 'ISBN 978-979-1411-24-0', 'Sastra', 'Atria', 1, 1, '2026-06-11 01:31:29'),
(97, 'BK-545837AL', 'Warped: Sang Penenun Kehidupan', 'Maurissa Guibord', 'ISBN 978-979-024-497-9', 'Sastra', 'Atria', 1, 1, '2026-06-11 01:34:57'),
(98, 'BK-71213909', 'Rooftoppers: Para Penghuni Atap', 'Katherine Rundell', 'ISBN 978-602-9251-31-9', 'Sastra', 'Metamind', 1, 1, '2026-06-11 01:37:54'),
(99, 'BK-928329P3', 'Little Stories: Lotus Creative Project', 'Adeste Adipriyanti, dkk', 'ISBN 978-602-03-0190-7', 'Fiksi', 'PT Gramedia Pustaka Utama', 1, 1, '2026-06-11 01:40:55'),
(100, 'BK-0742614A', 'Seribu Warna Turkiye: Potret Lain Beasiswa, Pendidikan, Sastra, dan Kesenian', 'Turkish Spirits', 'ISBN 978-602-7696-46-4', 'Sastra', 'IRCiSoD', 1, 1, '2026-06-11 01:44:36'),
(101, 'BK-333584EF', 'Cinta Paling Rumit', 'Boy Candra', 'ISBN 978-602-6475-96-1', 'Sastra', 'KataDepan', 1, 1, '2026-06-11 01:46:56'),
(102, 'BK-488515QT', 'Sherlock, Lupin & Aku 2: Babak Terakhir Drama Opera', 'Irene Adler', 'ISBN 978-602-4553-36-4', 'Fiksi', 'Bhuana Ilmu Populer', 1, 1, '2026-06-11 01:49:36'),
(103, 'BK-6272301N', 'Cahaya Cinta Pesantren', 'Ira Madan', 'ISBN 978-602-257-928-1', 'Fiksi', 'Tinta Medina', 1, 1, '2026-06-11 01:51:20'),
(104, 'BK-721095PQ', 'Crenshaw: Sahabat Beda Dunia', 'Katherine Applegate', 'ISBN 978-602-61099-2-7', 'Fiksi', 'Mizan Fantasi', 1, 1, '2026-06-11 01:53:03'),
(105, 'BK-931321A3', 'Buku Pintar dan ATLAS Indonesia Dunia', ' ', ' ', 'pengetahuan umum', 'Duamedia', 1, 1, '2026-06-12 01:52:58');

INSERT IGNORE INTO `transactions` (`id`, `member_id`, `book_id`, `type`, `status`, `transaction_date`, `due_date`, `return_date`, `fine_amount`, `fine_status`) VALUES
(1, 1, 3, 'PINJAM', 'SELESAI', '2026-07-20 08:00:00', '2026-07-27 08:00:00', '2026-07-25 08:00:00', 0, 'LUNAS');

