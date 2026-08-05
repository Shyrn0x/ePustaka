import fetch from 'node-fetch';
async function run() {
  const res = await fetch('http://localhost:3000/api/transactions');
  const data = await res.json();
  console.log(data.filter((t: any) => t.fine_amount > 0));
}
run();
