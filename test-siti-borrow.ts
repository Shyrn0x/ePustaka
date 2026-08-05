import fetch from 'node-fetch';
async function run() {
  const res = await fetch('http://localhost:3000/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      member_id: 3,
      book_id: 7,
      type: 'PINJAM'
    })
  });
  console.log(res.status, await res.json());
}
run();
