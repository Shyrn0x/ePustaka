const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace all instances of returning tokenUser with { ...tokenUser, photo_url: user.photo_url || null }
code = code.replace(/return res\.json\(\{ success: true, user: tokenUser, token, remoteUrl: process\.env\.APP_URL \|\| "http:\/\/localhost:3000" \}\);/g, "return res.json({ success: true, user: { ...tokenUser, photo_url: user.photo_url || null }, token, remoteUrl: process.env.APP_URL || \"http://localhost:3000\" });");

fs.writeFileSync('server.ts', code);
console.log("Fixed JWT responses");
