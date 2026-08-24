const fs = require('fs');
const content = fs.readFileSync('/Users/wagnercosta/Documents/antigravity/portal-sela/admin.js', 'utf8');

// Find the function and print it to double check for syntax errors
const regex = /async function carregarDashboardsDepartamentosEAtividades\(\) \{[\s\S]*?\n\}/;
const match = content.match(regex);
console.log(match ? "Found function" : "Function not found");
