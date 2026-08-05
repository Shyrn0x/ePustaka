const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  try {
    const db = await mysql.createPool(process.env.DATABASE_URL);
    const [rows] = await db.query("SELECT id, LENGTH(photo_url) as p_len FROM users WHERE photo_url IS NOT NULL");
    console.log("Users with photos:", rows);
    
    // Clear any photo larger than 1MB
    await db.query("UPDATE users SET photo_url = NULL WHERE LENGTH(photo_url) > 1000000");
    console.log("Cleared huge photos");
    db.end();
  } catch(e) {
    console.error(e);
  }
}
run();
