const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix admin DB login
code = code.replace(
  "const tokenUser = { id: user.id, username: user.username || user.rfid_uid || 'admin', role: 'ADMIN', name: user.name || 'Administrator', photo_url: user.photo_url };",
  "const tokenUser = { id: user.id, username: user.username || user.rfid_uid || 'admin', role: 'ADMIN', name: user.name || 'Administrator' };"
);
code = code.replace(
  "return res.json({ success: true, user: tokenUser, token, remoteUrl: process.env.APP_URL || \"http://localhost:3000\" });",
  "return res.json({ success: true, user: { ...tokenUser, photo_url: user.photo_url }, token, remoteUrl: process.env.APP_URL || \"http://localhost:3000\" });"
);

// Fix non-admin DB login
code = code.replace(
  "const tokenUser = { id: user.id, username: user.username || user.rfid_uid, role: user.role || 'SISWA', name: user.name, photo_url: user.photo_url };",
  "const tokenUser = { id: user.id, username: user.username || user.rfid_uid, role: user.role || 'SISWA', name: user.name };"
);

// Fix mock admin login
code = code.replace(
  "const tokenUser = { id: user.id, username: user.username || 'admin', role: 'ADMIN', name: user.name, photo_url: user.photo_url };",
  "const tokenUser = { id: user.id, username: user.username || 'admin', role: 'ADMIN', name: user.name };"
);

// Fix mock fallback admin login
code = code.replace(
  "const tokenUser = { id: 1, username: 'admin', role: 'ADMIN', name: 'Administrator', photo_url: null };",
  "const tokenUser = { id: 1, username: 'admin', role: 'ADMIN', name: 'Administrator' };"
);

fs.writeFileSync('server.ts', code);
console.log("Fixed JWT tokens");
