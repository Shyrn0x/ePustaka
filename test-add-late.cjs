const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `      let mockTransactions: any[] = [
        {
          id: 101,`;

const replaceStr = `      let mockTransactions: any[] = [
        {
          id: 100,
          member_id: 3,
          book_id: 6,
          member_name: 'Siti Aminah',
          book_title: 'Masjid Kuno di Jawa Tengah',
          rfid_uid: '38192011',
          qr_code: 'BK-952159SO',
          status: 'TERLAMBAT',
          transaction_date: '2026-07-01 09:30:00',
          due_date: '2026-07-08 09:30:00',
          fine_amount: 0,
          fine_status: 'BELUM_LUNAS'
        },
        {
          id: 101,`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('server.ts', code);
  console.log("Replaced mock transactions successfully!");
} else {
  console.log("Target mock transactions string not found!");
}
