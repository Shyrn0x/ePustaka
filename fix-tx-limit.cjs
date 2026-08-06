const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const insertBlock = `
              // Check for max borrow limit dynamically on backend
              const [userRows] = await db.execute("SELECT max_borrow_limit FROM users WHERE id = ?", [member_id]);
              const max_limit = userRows && userRows.length > 0 ? (userRows[0].max_borrow_limit || 5) : 5;
              const [activeRows] = await db.execute("SELECT COUNT(*) as active FROM transactions WHERE member_id = ? AND status IN ('BERJALAN', 'TERLAMBAT')", [member_id]);
              const activeCount = activeRows && activeRows.length > 0 ? activeRows[0].active : 0;
              
              if (activeCount >= max_limit) {
                return res.status(400).json({ error: \`Maksimal meminjam \${max_limit} buku! (Sedang dipinjam: \${activeCount})\` });
              }

              await db.execute("INSERT INTO transactions (member_id, book_id, status, due_date) VALUES (?, ?, 'BERJALAN', DATE_ADD(NOW(), INTERVAL 7 DAY))", [member_id, book_id]);
`;

code = code.replace(
  'await db.execute("INSERT INTO transactions (member_id, book_id, status, due_date) VALUES (?, ?, \'BERJALAN\', DATE_ADD(NOW(), INTERVAL 7 DAY))", [member_id, book_id]);',
  insertBlock
);

// Fix mock fallback too
const mockInsertBlock = `
          const mockActiveBorrows = mockTransactions.filter(t => t.member_id === member.id && (t.status === 'BERJALAN' || t.status === 'TERLAMBAT')).length;
          const maxMock = Number(member.max_borrow_limit) || 5;
          if (mockActiveBorrows >= maxMock) {
            return res.status(400).json({ error: \`Maksimal meminjam \${maxMock} buku! (Sedang dipinjam: \${mockActiveBorrows})\` });
          }

          const newTx = {
`;

code = code.replace(
  'const newTx = {',
  mockInsertBlock
);

fs.writeFileSync('server.ts', code);
console.log("Fixed TX limit");
