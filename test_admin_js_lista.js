const fs = require('fs');
const content = fs.readFileSync('/Users/wagnercosta/Documents/antigravity/portal-sela/admin.js', 'utf8');

// Find the function and run a syntax check
const acorn = require('acorn');
try {
    acorn.parse(content, {ecmaVersion: 2022});
    console.log("Syntax is OK");
} catch(e) {
    console.log("Syntax error:", e);
}
