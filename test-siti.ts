import fetch from 'node-fetch';
async function run() {
  const res = await fetch('http://localhost:3000/api/members/38192011');
  console.log(await res.json());
}
run();
