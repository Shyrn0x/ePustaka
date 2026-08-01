const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function run() {
    const db = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "pustaka_kiosk",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    try {
        console.log("Truncating transactions...");
        await db.query("DELETE FROM transactions");
        console.log("Truncating users...");
        await db.query("DELETE FROM users");
        
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        console.log("Inserting admin...");
        await db.query(`
            INSERT INTO users (username, password, name, role, max_borrow_limit) 
            VALUES (?, ?, ?, ?, ?)
        `, ['admin', hashedPassword, 'Administrator', 'ADMIN', 999]);
        
        console.log("Reset successful!");
    } catch(e) {
        console.error(e);
    } finally {
        await db.end();
    }
}
run();
