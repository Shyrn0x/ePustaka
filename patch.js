const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  "    setMessage(successMessage);\n  };",
  "    setMessage(successMessage);\n    if (type === 'KEMBALI') {\n      setActiveLoans(prev => prev.filter(t => !successIds.includes(Number(t.book_id))));\n    }\n  };"
);
fs.writeFileSync('src/App.tsx', code);
