import fetch from 'node-fetch';
async function test() {
  const res = await fetch('http://localhost:3000/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_id: 2, book_id: 1, type: 'PINJAM' })
  });
  console.log(res.status, await res.text());
}
test();
