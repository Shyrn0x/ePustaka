const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `    app.get("/api/members", async (req, res) => {
      try {
        if (db) {`;

const replaceStr = `    app.get("/api/members", async (req, res) => {
      try {
        if (db) {
          await db.execute(\`
            UPDATE transactions 
            SET status = 'TERLAMBAT', 
                fine_amount = GREATEST(1, DATEDIFF(NOW(), due_date)) * 1000 
            WHERE status IN ('BERJALAN', 'TERLAMBAT') 
              AND due_date < NOW()
              AND (fine_status IS NULL OR fine_status != 'LUNAS') AND fine_modified = FALSE
          \`);`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('server.ts', code);
  console.log("Replaced db members successfully!");
} else {
  console.log("Target db members string not found!");
}

const targetMockStr = `      const list = mockMembers.filter(m => m.role === 'SISWA' || m.role === 'GURU').map(m => ({
        ...m,
        active_borrows: mockTransactions.filter(t => (t.member_id === m.id || t.rfid_uid === m.rfid_uid) && (t.status === 'BERJALAN' || t.status === 'TERLAMBAT')).length,
        has_unpaid_fine: mockTransactions.some(t => (t.member_id === m.id || t.rfid_uid === m.rfid_uid) && (t.fine_amount || 0) > 0 && t.fine_status !== 'LUNAS')
      }));`;

const replaceMockStr = `      mockTransactions.forEach(t => {
        if ((t.status === 'BERJALAN' || t.status === 'TERLAMBAT') && new Date(t.due_date) < new Date() && t.fine_status !== 'LUNAS') {
          t.status = 'TERLAMBAT';
          t.fine_amount = Math.max(1, Math.ceil((Date.now() - new Date(t.due_date).getTime()) / (1000 * 60 * 60 * 24))) * 1000;
        }
      });
      const list = mockMembers.filter(m => m.role === 'SISWA' || m.role === 'GURU').map(m => ({
        ...m,
        active_borrows: mockTransactions.filter(t => (t.member_id === m.id || t.rfid_uid === m.rfid_uid) && (t.status === 'BERJALAN' || t.status === 'TERLAMBAT')).length,
        has_unpaid_fine: mockTransactions.some(t => (t.member_id === m.id || t.rfid_uid === m.rfid_uid) && (t.fine_amount || 0) > 0 && t.fine_status !== 'LUNAS')
      }));`;

if (code.includes(targetMockStr)) {
  code = code.replace(targetMockStr, replaceMockStr);
  fs.writeFileSync('server.ts', code);
  console.log("Replaced mock members successfully!");
} else {
  console.log("Target mock members string not found!");
}
