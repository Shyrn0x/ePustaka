const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const (\w+) = await res\.json\(\);/g;
code = code.replace(regex, `let $1;
      const ct = res.headers.get('content-type');
      if (ct && ct.includes('application/json')) {
        $1 = await res.json();
      } else {
        const text = await res.text();
        throw new Error('Not JSON: ' + res.status + ' ' + text.slice(0, 50));
      }`);

fs.writeFileSync('src/App.tsx', code);
console.log("Replaced await res.json()");
