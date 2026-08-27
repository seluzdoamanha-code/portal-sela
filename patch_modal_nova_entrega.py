import re

with open('assistencia.js', 'r') as f:
    js_content = f.read()

# 1. Patch abrirModalNovaEntrega fetch
old_fetch = r"const { data: familias } = await db.from\('ass_familias'\).select\('id, nome_familia, codigo'\).eq\('status', 'Ativa'\).order\('nome_familia'\);\s*document.getElementById\('assEntFamilia'\).innerHTML = '<option value=\"\">-- Selecione a família --</option>' \+ \s*\(familias \|\| \[\]\).map\(f => `<option value=\"\$\{f.id\}\">\$\{f.codigo\} - \$\{f.nome_familia\}</option>`\).join\(''\);"

new_fetch = """
        const { data: familiasRaw, error: famErr } = await db.from('pessoas')
            .select('id, nome_curto, nome_completo, ass_familias_meta(codigo, status, tipo)')
            .contains('perfis', ['Titular da Família']);
            
        let familias = [];
        if (famErr) {
            // Fallback se contains der erro
            const { data: allP } = await db.from('pessoas').select('id, nome_curto, nome_completo, perfis, ass_familias_meta(codigo, status, tipo)');
            if (allP) {
                familias = allP.filter(p => {
                    const arr = Array.isArray(p.perfis) ? p.perfis : (typeof p.perfis === 'string' ? JSON.parse(p.perfis || '[]') : []);
                    return arr.includes('Titular da Família');
                });
            }
        } else {
            familias = familiasRaw || [];
        }

        let familiaOptions = [];
        const arrAtivas = familias.filter(f => {
            const meta = Array.isArray(f.ass_familias_meta) ? (f.ass_familias_meta[0] || {}) : (f.ass_familias_meta || {});
            return meta.status === 'Ativa';
        });
        
        arrAtivas.sort((a,b) => {
            const nA = (a.nome_curto || a.nome_completo || '').toLowerCase();
            const nB = (b.nome_curto || b.nome_completo || '').toLowerCase();
            return nA.localeCompare(nB);
        });
        
        familiaOptions = arrAtivas.map(f => {
            const meta = Array.isArray(f.ass_familias_meta) ? (f.ass_familias_meta[0] || {}) : (f.ass_familias_meta || {});
            const nome = f.nome_curto || f.nome_completo;
            const cod = meta.codigo || 'S/C';
            return `<option value="${f.id}">${cod} - ${nome}</option>`;
        });
        
        document.getElementById('assEntFamilia').innerHTML = '<option value="">-- Selecione a família --</option>' + familiaOptions.join('');
"""

if re.search(old_fetch, js_content):
    js_content = re.sub(old_fetch, new_fetch.strip(), js_content)
    print("Fetch patched")
else:
    print("Fetch NOT patched")

# 2. Patch salvarNovaEntregaAss payload
old_payload = r"familia_id: document.getElementById\('assEntFamilia'\).value,"
new_payload = "pessoa_id: document.getElementById('assEntFamilia').value,"

if old_payload in js_content:
    js_content = js_content.replace(old_payload, new_payload)
    print("Payload patched")
else:
    print("Payload NOT patched")

with open('assistencia.js', 'w') as f:
    f.write(js_content)
