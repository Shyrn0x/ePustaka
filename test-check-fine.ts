import fetch from 'node-fetch';
async function test() {
  const res2 = await fetch('http://localhost:3000/api/transactions');
  const txs = await res2.json();
  console.log("Txs with fine:", txs.filter((t: any) => t.fine_amount > 0));
}
test();
