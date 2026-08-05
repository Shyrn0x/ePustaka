const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `        } else {
          const newTx = {`;

const replaceStr = `        } else {
          mockTransactions.forEach(t => {
            if ((t.status === 'BERJALAN' || t.status === 'TERLAMBAT') && new Date(t.due_date) < new Date() && t.fine_status !== 'LUNAS') {
              t.status = 'TERLAMBAT';
              t.fine_amount = Math.max(1, Math.ceil((Date.now() - new Date(t.due_date).getTime()) / (1000 * 60 * 60 * 24))) * 1000;
            }
          });
          
          const hasFine = mockTransactions.some(t => (t.member_id === Number(member_id) || t.rfid_uid === String(member_id)) && (t.fine_amount || 0) > 0 && t.fine_status !== 'LUNAS');
          if (hasFine) {
            return res.status(400).json({ error: "Anda memiliki denda yang belum dibayar. Harap lunasi terlebih dahulu." });
          }

          const newTx = {`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('server.ts', code);
  console.log("Replaced successfully!");
} else {
  console.log("Target string not found!");
}
