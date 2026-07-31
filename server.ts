import bcrypt from "bcryptjs";
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

  } catch (err) {
    console.error("Failed to connect to MySQL database:", err);
    db = null; // Set to null so fallback mode activates
  }

  // --- Mock Data for Demo/Preview Mode ---
  let mockMembers = [
    { id: 1, rfid_uid: "user123", name: "Zaidan Arrifqi", student_id: "3.33.23.1.24", role: "SISWA", max_borrow_limit: 5 }
  ];
  let mockBooks = [
    { id: 1, qr_code: "buku123", title: "Rancang Bangun IOT", author: "Dzaki Syafiq", isbn: "123-456", category: "Teknik", total_copies: 5, available_copies: 5 }
  ];
  let mockTransactions: any[] = [];

  // --- API Routes ---

  // Get all members
  // 📝 KETERANGAN FUNGSI:
  // Endpoint API (GET) ini digunakan untuk mengambil seluruh daftar anggota perpustakaan.
  // Jika database MySQL terhubung, akan mengeksekusi "SELECT * FROM users".
  // Jika database gagal, akan menggunakan data tiruan (mockMembers) agar aplikasi tidak crash.
  app.get("/api/members", async (req, res) => {
    if (!db) return res.json(mockMembers);
    try {
      const [rows] = await db.execute("SELECT * FROM users ORDER BY created_at DESC");
      res.json(rows);
    } catch (err) {
      res.json(mockMembers);
    }
  });

  // Add Member
  app.post("/api/members", async (req, res) => {
    const { rfid_uid, name, student_id, role, max_borrow_limit } = req.body;
    if (!db) {
      if (mockMembers.some(m => m.rfid_uid === rfid_uid || m.student_id === student_id)) {
        return res.status(400).json({ error: "RFID or Student ID already exists" });
      }
      const newMember = { id: mockMembers.length + 1, rfid_uid, name, student_id, role, max_borrow_limit: max_borrow_limit || 5 };
      mockMembers.push(newMember);
      return res.json({ message: "Member added (Demo Mode)" });
    }
    try {
      const [existing]: any = await db.execute("SELECT id FROM users WHERE rfid_uid = ? OR student_id = ?", [rfid_uid, student_id]);
      if (existing.length > 0) {
        return res.status(400).json({ error: "RFID or Student ID sudah terdaftar!" });
      }
      
      await db.execute(
        "INSERT INTO users (rfid_uid, name, student_id, role, max_borrow_limit) VALUES (?, ?, ?, ?, ?)",
        [rfid_uid, name, student_id, role || 'SISWA', parseInt(req.body.max_borrow_limit) || 5]
      );
      res.json({ message: "Member added successfully" });
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "RFID or Student ID already exists" });
      res.status(500).json({ error: "Failed to add member" });
    }
  });

  // Get all books
  app.get("/api/books", async (req, res) => {
    const { search } = req.query;
    if (!db) {
      if (search) {
        const s = String(search).toLowerCase();
        return res.json(mockBooks.filter(b => b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s)));
      }
      return res.json(mockBooks);
    }
    try {
      let query = "SELECT * FROM books";
      let params = [];
      if (search) {
        query += " WHERE title LIKE ? OR author LIKE ? OR category LIKE ?";
        const val = `%${search}%`;
        params = [val, val, val];
      }
      const [rows] = await db.execute(query, params);
      res.json(rows);
    } catch (err) {
      res.json(mockBooks);
    }
  });

  // Add Book
  app.post("/api/books", async (req, res) => {
    const { qr_code, title, author, isbn, category, total_copies, publisher } = req.body;
    if (!db) {
      const newBook = { id: mockBooks.length + 1, qr_code, title, author, isbn, category, total_copies, available_copies: total_copies, publisher };
      mockBooks.push(newBook);
      return res.json({ message: "Book added (Demo Mode)" });
    }
    try {
      await db.execute(
        "INSERT INTO books (qr_code, title, author, isbn, category, total_copies, available_copies, publisher) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [qr_code, title, author, isbn, category, total_copies, total_copies, publisher || '']
      );
      res.json({ message: "Book added successfully" });
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "QR Code already exists" });
      res.status(500).json({ error: "Failed to add book: " + err.message });
    }
  });

  // Delete Book
  app.delete("/api/books/:id", async (req, res) => {
    const id = req.params.id;
    console.log("DELETE /api/books/:id", id);
    if (!db) {
      const initialCount = mockBooks.length;
      mockBooks = mockBooks.filter(b => b.id.toString() !== id);
      console.log(`Mock delete: initial=${initialCount}, final=${mockBooks.length}`);
      return res.json({ message: "Book deleted (Demo Mode)" });
    }
    try {
      const [result]: any = await db.execute("DELETE FROM books WHERE id = ?", [Number(id)]);
      console.log("Database delete result:", result);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Book not found" });
      }
      res.json({ message: "Book deleted" });
    } catch (err: any) {
      console.error("Delete book error:", err);
      res.status(500).json({ error: "Delete failed: " + err.message });
    }
  });

  // Update Book
  app.put("/api/books/:id", async (req, res) => {
    console.log("PUT /api/books/:id", req.params.id, req.body);
    const { qr_code, title, author, isbn, category, total_copies, publisher } = req.body;
    if (!db) {
      const book = mockBooks.find(b => b.id.toString() === req.params.id);
      if (book) Object.assign(book, { qr_code, title, author, isbn, category, total_copies, publisher });
      return res.json({ message: "Book updated" });
    }
    try {
      await db.execute(
        "UPDATE books SET qr_code = ?, title = ?, author = ?, isbn = ?, category = ?, total_copies = ?, publisher = ? WHERE id = ?",
        [qr_code, title, author, isbn, category, total_copies, publisher || '', req.params.id]
      );
      res.json({ message: "Book updated" });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Update failed: " + err.message });
    }
  });

  // Delete Member
  // 📝 KETERANGAN FUNGSI:
  // Endpoint API (DELETE) ini digunakan untuk menghapus seorang anggota.
  // Memiliki fitur "Guard Logic": Akan mengecek tabel transactions (via SELECT COUNT)
  // untuk memastikan member tersebut TIDAK MEMILIKI status 'BERJALAN' (belum mengembalikan buku).
  // Jika memiliki tanggungan, akan menolak hapus dan melempar error 400.
  // Jika bersih, akan menghapus log riwayatnya dulu, baru menghapus membernya. (Foreign Key Constraint handling)
  app.delete("/api/members/:id", async (req, res) => {
    const id = req.params.id;
    console.log("DELETE /api/members/:id", id);
    if (!db) {
      const initialCount = mockMembers.length;
      mockMembers = mockMembers.filter(m => m.id.toString() !== id);
      console.log(`Mock delete member: initial=${initialCount}, final=${mockMembers.length}`);
      return res.json({ message: "Member deleted (Demo Mode)" });
    }
    try {
      const [borrowingCheck]: any = await db.execute(
        "SELECT COUNT(*) as count FROM transactions WHERE member_id = ? AND status IN ('BERJALAN', 'TERLAMBAT')",
        [Number(id)]
      );
      if (borrowingCheck[0].count > 0) {
        return res.status(400).json({ error: "Anggota masih memiliki pinjaman buku yang belum dikembalikan" });
      }

      // Hapus riwayat transaksi agar tidak terjadi error foreign key saat member dihapus
      await db.execute("DELETE FROM transactions WHERE member_id = ?", [Number(id)]);

      const [result]: any = await db.execute("DELETE FROM users WHERE id = ?", [Number(id)]);
      console.log("Database delete member result:", result);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Member not found" });
      }
      res.json({ message: "Member deleted" });
    } catch (err: any) {
      console.error("Delete member error:", err);
      res.status(500).json({ error: "Delete failed: " + err.message });
    }
  });

  // Update Member
  app.put("/api/members/:id", async (req, res) => {
    console.log("PUT /api/members/:id", req.params.id, req.body);
    const { rfid_uid, name, student_id, role, max_borrow_limit } = req.body;
    if (!db) {
      const member = mockMembers.find(m => m.id.toString() === req.params.id);
      if (member) Object.assign(member, { rfid_uid, name, student_id, role, max_borrow_limit: max_borrow_limit || 5 });
      return res.json({ message: "Member updated" });
    }
    try {
      await db.execute(
        "UPDATE users SET rfid_uid = ?, name = ?, student_id = ?, role = ?, max_borrow_limit = ? WHERE id = ?",
        [rfid_uid, name, student_id, role, parseInt(req.body.max_borrow_limit) || 5, req.params.id]
      );
      res.json({ message: "Member updated" });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Update failed: " + err.message });
    }
  });

// Get Transactions / Report
  app.get("/api/transactions", async (req, res) => {
    if (!db) return res.json([...mockTransactions].sort((a: any, b: any) => new Date(b.return_date || b.transaction_date).getTime() - new Date(a.return_date || a.transaction_date).getTime()));
    try {
      // Auto-update status to TERLAMBAT and calculate fines for ongoing transactions
      await db.execute(`
        UPDATE transactions 
        SET 
          status = CASE WHEN NOW() > due_date THEN 'TERLAMBAT' ELSE status END,
          fine_amount = CASE WHEN NOW() > due_date THEN DATEDIFF(NOW(), due_date) * 1000 ELSE fine_amount END
        WHERE status IN ('BERJALAN', 'TERLAMBAT')
      `);

      const [rows] = await db.execute(`
        SELECT t.*, m.name as member_name, b.title as book_title 
        FROM transactions t
        JOIN users m ON t.member_id = m.id
        JOIN books b ON t.book_id = b.id
        ORDER BY IFNULL(t.return_date, t.transaction_date) DESC
      `);
      
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.json([...mockTransactions].sort((a: any, b: any) => new Date(b.return_date || b.transaction_date).getTime() - new Date(a.return_date || a.transaction_date).getTime()));
    }
  });

  // Endpoint to receive RFID scan from Raspberry Pi Python Script
  app.post("/api/rfid/scan", (req, res) => {
    const { uid } = req.body;
    if (uid) {
      console.log("Hardware RFID Scan received:", uid);
      lastRFIDScan = { uid, timestamp: Date.now() };
      res.json({ success: true, message: "Scan broadcasted via HTTP" });
    } else {
      res.status(400).json({ error: "Missing uid" });
    }
  });

  // Get and Consume Latest RFID Scan (Polling endpoint)
  app.post("/api/rfid/consume", (req, res) => {
    if (lastRFIDScan.uid) {
      if (Date.now() - lastRFIDScan.timestamp < 3000) {
        const data = { ...lastRFIDScan };
        lastRFIDScan = { uid: null, timestamp: 0 };
        return res.json(data);
      } else {
        // Expired scan
        lastRFIDScan = { uid: null, timestamp: 0 };
      }
    }
    res.json({ uid: null, timestamp: 0 });
  });

  // Check Member by RFID
  app.get("/api/members/:rfid_uid", async (req, res) => {
    if (!db) {
      const m = mockMembers.find(m => m.rfid_uid === req.params.rfid_uid);
      if (m) {
        const active_borrows = mockTransactions.filter(t => t.member_id === m.id && ['BERJALAN', 'TERLAMBAT'].includes(t.status)).length;
        return res.json({ ...m, active_borrows });
      }
      return res.status(404).json({ error: "Not found" });
    }
    try {
      const [rows]: any = await db.execute(
        "SELECT m.*, (SELECT COUNT(*) FROM transactions t WHERE t.member_id = m.id AND t.status IN ('BERJALAN', 'TERLAMBAT')) as active_borrows FROM users m WHERE m.rfid_uid = ?", 
        [req.params.rfid_uid]
      );
      if (rows.length === 0) return res.status(404).json({ error: "Member not found" });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Check Book by QR Code
  app.get("/api/books/:qr_code", async (req, res) => {
    if (!db) {
      const b = mockBooks.find(b => b.qr_code === req.params.qr_code);
      return b ? res.json(b) : res.status(404).json({ error: "Not found" });
    }
    try {
      const [rows]: any = await db.execute(
        "SELECT * FROM books WHERE qr_code = ?", 
        [req.params.qr_code]
      );
      if (rows.length === 0) return res.status(404).json({ error: "Book not found" });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Update Fine
  app.put("/api/transactions/:id/fine", async (req, res) => {
    if (!db) return res.status(400).json({ error: "Demo mode" });
    const { fine_amount, fine_status } = req.body;
    try {
      await db.execute(
        "UPDATE transactions SET fine_amount = ?, fine_status = ? WHERE id = ?",
        [fine_amount, fine_status, req.params.id]
      );
      transactionVersion++;
      res.json({ message: "Fine updated" });
    } catch(err) {
      res.status(500).json({ error: "Failed to update fine" });
    }
  });

  // Post Transaction (Pinjam/Kembali)
  // 📝 KETERANGAN FUNGSI:
  // Endpoint API (POST) yang sangat krusial. Digunakan untuk Peminjaman (PINJAM) dan Pengembalian (KEMBALI)
  // - Peminjaman: Mengecek stok buku > 0. Jika ada, melakukan INSERT ke transactions & UPDATE books (kurangi stok -1).
  // - Pengembalian: Melakukan UPDATE status transactions menjadi 'SELESAI' & UPDATE books (tambah stok +1).
  app.post("/api/transactions", async (req, res) => {
    const { member_id, book_id, type } = req.body;
    
    if (!db) {
      const mem = mockMembers.find(m => m.id === member_id);
      const bk = mockBooks.find(b => b.id === book_id);
      if (!mem || !bk) return res.status(400).json({ error: "Data invalid" });

      if (type === 'PINJAM') {
        const hasUnpaid = mockTransactions.some(t => t.member_id === member_id && t.fine_amount > 0 && t.fine_status === 'BELUM_LUNAS');
        if (hasUnpaid) return res.status(400).json({ error: "Anda memiliki denda yang belum dilunasi." });

        if (bk.available_copies <= 0) return res.status(400).json({ error: "Stok habis" });
        bk.available_copies--;
        mockTransactions.unshift({
          id: mockTransactions.length + 1,
          member_id,
          book_id,
          member_name: mem.name,
          book_title: bk.title,
          type: 'PINJAM',
          status: 'BERJALAN',
          transaction_date: new Date().toISOString(),
          due_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
          fine_amount: 0,
          fine_status: 'BELUM_LUNAS'
        });
      } else {
        const tx = mockTransactions.find(t => t.member_id === member_id && t.book_id === book_id && ['BERJALAN', 'TERLAMBAT'].includes(t.status));
        if (!tx) return res.status(400).json({ error: "Tidak ada pinjaman aktif" });
        
        let fine = 0;
        if (tx.due_date && new Date().getTime() > new Date(tx.due_date).getTime()) {
          const diffDays = Math.ceil((new Date().getTime() - new Date(tx.due_date).getTime()) / (1000 * 3600 * 24));
          if (diffDays > 0) fine = diffDays * 1000;
        }

        tx.status = 'SELESAI';
        tx.type = 'KEMBALI';
        tx.return_date = new Date().toISOString();
        tx.fine_amount = fine;
        bk.available_copies++;
      }
      transactionVersion++;
      return res.json({ message: "Transaction success (Demo Mode)" });
    }

    try {
      if (type === 'PINJAM') {
        const [unpaidFines]: any = await db.execute("SELECT COUNT(*) as cnt FROM transactions WHERE member_id = ? AND fine_amount > 0 AND fine_status = 'BELUM_LUNAS'", [member_id]);
        if (unpaidFines[0].cnt > 0) {
          return res.status(400).json({ error: "Anda memiliki denda yang belum dilunasi. Harap lunasi denda ke admin terlebih dahulu!" });
        }

        const [memRows]: any = await db.execute("SELECT max_borrow_limit FROM users WHERE id = ?", [member_id]);
        const maxLimit = memRows[0]?.max_borrow_limit ?? 5;

        const [activeTxMem]: any = await db.execute("SELECT COUNT(*) as cnt FROM transactions WHERE member_id = ? AND status IN ('BERJALAN', 'TERLAMBAT')", [member_id]);
        if (activeTxMem[0].cnt >= maxLimit) {
          return res.status(400).json({ error: `Peminjaman maksimal adalah ${maxLimit} buku!` });
        }

        const [book]: any = await db.execute("SELECT available_copies FROM books WHERE id = ?", [book_id]);
        if (book[0].available_copies <= 0) return res.status(400).json({ error: "Book out of stock" });
        
        await db.execute(
          "INSERT INTO transactions (member_id, book_id, type, due_date, fine_amount) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), 0)",
          [member_id, book_id, type]
        );
        await db.execute("UPDATE books SET available_copies = available_copies - 1 WHERE id = ?", [book_id]);
        
        transactionVersion++;
        res.json({ message: "Transaction successful" });
      } else {
        const [activeTx]: any = await db.execute(
          "SELECT id, due_date FROM transactions WHERE member_id = ? AND book_id = ? AND type = 'PINJAM' AND status IN ('BERJALAN', 'TERLAMBAT') LIMIT 1",
          [member_id, book_id]
        );
        
        if (activeTx.length === 0) return res.status(400).json({ error: "Buku ini tidak sedang Anda pinjam." });
        
        let fine = 0;
        if (activeTx[0].due_date && new Date().getTime() > new Date(activeTx[0].due_date).getTime()) {
          const diffDays = Math.ceil((new Date().getTime() - new Date(activeTx[0].due_date).getTime()) / (1000 * 3600 * 24));
          if (diffDays > 0) fine = diffDays * 1000;
        }

        await db.execute(
          "UPDATE transactions SET type = 'KEMBALI', status = 'SELESAI', return_date = NOW(), fine_amount = ? WHERE id = ?",
          [fine, activeTx[0].id]
        );
        await db.execute("UPDATE books SET available_copies = available_copies + 1 WHERE id = ?", [book_id]);
        
        transactionVersion++;
        res.json({ message: "Transaction successful", fine });
      }
    } catch (err) {
      res.status(500).json({ error: "Transaction failed" });
    }
  });

  // Admin Login


  // Login Endpoint (Admin)
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    
    // Demo Fallback Login
    if (!db) {
      if (username === 'admin' && password === 'admin123') {
        return res.json({ 
          success: true, 
          user: { username: 'admin', role: 'ADMIN' },
          remoteUrl: process.env.APP_URL || "http://localhost:3000"
        });
      }
      return res.status(401).json({ error: "Invalid demo credentials" });
    }

    try {
      const [rows]: any = await db.execute("SELECT * FROM users WHERE role = 'ADMIN' AND username = ?", [username]);
      if (rows.length > 0) {
        const user = rows[0];
        const dbPassword = user.password || user.password_hash;
        
        // Use bcrypt to compare password
        const isMatch = await bcrypt.compare(password, dbPassword);
        
        if (isMatch) {
          return res.json({ 
            success: true, 
            user: { username: user.username, role: user.role || 'ADMIN' },
            remoteUrl: process.env.APP_URL || "http://localhost:3000"
          });
        }
      }
      res.status(401).json({ error: "Invalid credentials" });
    } catch (err) {
      console.error("Login Error:", err);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Transactions Version Endpoint for Polling
  app.get("/api/transactions/version", (req, res) => {
    res.json({ version: transactionVersion });
  });


  // Visitor Stats
  app.get("/api/stats/visitors", async (req, res) => {
if (!db) {
      const grouped: Record<string, Set<number>> = {};
      mockTransactions.forEach(t => {
        const d = new Date(t.transaction_date);
        const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
        if (!grouped[m]) grouped[m] = new Set();
        grouped[m].add(t.member_id);
      });
      const resData = Object.keys(grouped).sort().map(k => ({ month: k, visitors: grouped[k].size }));
      return res.json(resData);
    }
    try {
      const [rows]: any = await db.execute(`
        SELECT DATE_FORMAT(transaction_date, '%Y-%m') as month, COUNT(DISTINCT member_id) as visitors
        FROM transactions
        GROUP BY month
        ORDER BY month ASC
      `);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Visitor stats failed" });
    }
  });

  // Analytics
  app.get("/api/stats", async (req, res) => {
    if (!db) {
      return res.json({
        totalBooks: mockBooks.reduce((acc, b) => acc + b.total_copies, 0),
        borrowedBooks: mockTransactions.filter(t => ['BERJALAN', 'TERLAMBAT'].includes(t.status)).length,
        activeMembers: mockMembers.length
      });
    }
    try {
      const [totalBooks]: any = await db.execute("SELECT SUM(total_copies) as count FROM books");
      const [borrowedBooks]: any = await db.execute("SELECT COUNT(*) as count FROM transactions WHERE status IN ('BERJALAN', 'TERLAMBAT')");
      const [activeMembers]: any = await db.execute("SELECT COUNT(*) as count FROM users");
      res.json({
        totalBooks: totalBooks[0].count || 0,
        borrowedBooks: borrowedBooks[0].count || 0,
        activeMembers: activeMembers[0].count || 0,
      });
    } catch (err) {
      res.status(500).json({ error: "Stats failed" });
    }
  });

  // --- Serve Frontend ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PustakaKiosk Server running on http://localhost:${PORT}`);
  });
}

startServer();
