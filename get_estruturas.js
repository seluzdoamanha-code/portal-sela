const fs = require('fs');
const config = fs.readFileSync('config.js', 'utf8');

const urlMatch = config.match(/SUPABASE_URL\s*=\s*['"](.*?)['"]/);
const keyMatch = config.match(/SUPABASE_KEY\s*=\s*['"](.*?)['"]/);

if (urlMatch && keyMatch) {
    const url = urlMatch[1];
    const key = keyMatch[1];
    
    fetch(`${url}/rest/v1/estruturas?select=id,nome,tipo`, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log("Estruturas no Banco:");
        data.forEach(d => console.log(`- ${d.nome} (${d.tipo})`));
    })
    .catch(console.error);
}
