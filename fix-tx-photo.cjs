const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const t1 = `SELECT t.*, u.name as member_name, b.title as book_title, u.rfid_uid, b.qr_code 
              FROM transactions t`;
const r1 = `SELECT t.*, u.name as member_name, b.title as book_title, u.rfid_uid, b.qr_code, u.photo_url as member_photo_url 
              FROM transactions t`;

const t2 = `SELECT t.*, b.title as book_title, b.qr_code
              FROM transactions t`;
const r2 = `SELECT t.*, b.title as book_title, b.qr_code, u.photo_url as member_photo_url
              FROM transactions t
              JOIN users u ON t.member_id = u.id`;

code = code.replace(t1, r1);
code = code.replace(t2, r2);

fs.writeFileSync('server.ts', code);
console.log("Fixed tx queries");
