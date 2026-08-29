try {
  const fs = require('fs');
  const code = fs.readFileSync('sidebar.js', 'utf8');
  // quick rudimentary check
  if (code.includes("'atividades.html'")) {
    console.log('Looks good');
  }
} catch (e) { console.log(e); }
