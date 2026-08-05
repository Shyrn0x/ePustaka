const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `            } else {
              await db.execute("INSERT INTO transactions (member_id, book_id, status, due_date) VALUES (?, ?, 'BERJALAN', DATE_ADD(NOW(), INTERVAL 7 DAY))", [member_id, book_id]);`;

const replaceStr = `            } else {
              // Ensure dynamic fines are updated before borrowing
              await db.execute(\`
                UPDATE transactions 
                SET status = 'TERLAMBAT', 
                    fine_amount = GREATEST(1, DATEDIFF(NOW(), due_date)) * 1000 
                WHERE status IN ('BERJALAN', 'TERLAMBAT') 
                  AND due_date < NOW()
                  AND (fine_status IS NULL OR fine_status != 'LUNAS') AND fine_modified = FALSE
              \`);
              // Check for unpaid fines
              const [fineRows]: any = await db.execute("SELECT 1 FROM transactions WHERE member_id = ? AND fine_amount > 0 AND (fine_status IS NULL OR fine_status != 'LUNAS')", [member_id]);
              if (fineRows && fineRows.length > 0) {
                return res.status(400).json({ error: "Anda memiliki denda yang belum dibayar. Harap lunasi terlebih dahulu." });
              }
              await db.execute("INSERT INTO transactions (member_id, book_id, status, due_date) VALUES (?, ?, 'BERJALAN', DATE_ADD(NOW(), INTERVAL 7 DAY))", [member_id, book_id]);`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('server.ts', code);
  console.log("Replaced successfully!");
} else {
  console.log("Target string not found!");
}
