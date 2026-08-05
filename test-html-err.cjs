const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace standard then(res => res.json()) with safe version
code = code.replace(/\.then\(res => res\.json\(\)\)/g, ".then(async res => { const contentType = res.headers.get('content-type'); if (contentType && contentType.includes('application/json')) return res.json(); const text = await res.text(); throw new Error('Not JSON: ' + res.status + ' ' + text.slice(0, 50)); })");

fs.writeFileSync('src/App.tsx', code);
console.log("Replaced res.json() handlers");
