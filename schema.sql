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

-- Note: In production, use properly hashed passwords (e.g. bcrypt) and verify them using a library.
INSERT INTO users (username, password, name, role) 
VALUES ('admin', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Administrator', 'ADMIN')
ON DUPLICATE KEY UPDATE username=username;
