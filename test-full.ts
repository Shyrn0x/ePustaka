import fetch from 'node-fetch';

async function run() {
  const members = await (await fetch('http://localhost:3000/api/members')).json();
  const budi = members.find((m: any) => m.id === 2);
  console.log("Budi:", budi);

  // Set a fine on Budi's transaction manually in mock data if we could...
  // But wait, the app is using the DB or mock?
  // We can't access the real DB. So we can't test it.
}
run();
