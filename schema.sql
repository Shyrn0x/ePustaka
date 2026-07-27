-- SQL Schema for PustakaKiosk
-- Setup database: CREATE DATABASE pustaka_kiosk;

CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rfid_uid VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) UNIQUE NOT NULL, -- NIM/ID Siswa
    role ENUM('SISWA', 'GURU', 'STAF') DEFAULT 'SISWA',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    qr_code VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(100),
    isbn VARCHAR(20),
    category VARCHAR(50),
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    book_id INT NOT NULL,
    type ENUM('PINJAM', 'KEMBALI') NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NULL,
    return_date TIMESTAMP NULL,
    fine DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('BERJALAN', 'SELESAI', 'TERLAMBAT') DEFAULT 'BERJALAN',
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
);

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'STAFF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample admin (password: admin123)
-- Note: In production, use properly hashed passwords.
INSERT INTO admins (username, password_hash, email) 
VALUES ('admin', '$2b$10$YourHashedPasswordHere', 'admin@perpustakaan.sch.id')
ON DUPLICATE KEY UPDATE username=username;
