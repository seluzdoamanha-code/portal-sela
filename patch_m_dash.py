import re
with open('m_dash_entregas.js', 'r') as f:
    js = f.read()

# 1. fix url routing
old_route = r"window\.location\.href = 'm_ass_entregas\.html\?f_id=' \+ sel\.value \+ '&f_nome=' \+ encodeURIComponent\(fNome\) \+ '&from=dash';"
new_route = "window.location.href = 'm_ass_entregas.html?f_id=' + sel.value + '&f_nome=' + encodeURIComponent(fNome) + '&is_global=1&from=dash';"
js = re.sub(old_route, new_route, js)

# 2. fix loadFamilias
old_loadF = r"async function loadFamilias\(\) \{\s*const \{ data, error \} = await db\.from\('ass_familias'\)\s*\.select\('id, codigo, nome_familia'\)\s*\.eq\('status', 'Ativa'\)\s*\.order\('nome_familia'\);\s*if \(error\) \{\s*console\.error\(error\);\s*return;\s*\}\s*let html = '<option value=\"\">-- Selecione uma Família --</option>';\s*data\.forEach\(f => \{\s*html \+= `<option value=\"\$\{f\.id\}\">\$\{f\.codigo\} - \$\{f\.nome_familia\}</option>`;\s*\}\);\s*document\.getElementById\('selFamilia'\)\.innerHTML = html;\s*\}"

new_loadF = """async function loadFamilias() {
        const { data: familiasRaw, error: famErr } = await db.from('pessoas')
            .select('id, nome_curto, nome_completo, ass_familias_meta(codigo, status, tipo)')
            .contains('perfis', ['Titular da Família']);
            
        let familias = [];
        if (famErr) {
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

        const arrAtivas = familias.filter(f => {
            const meta = Array.isArray(f.ass_familias_meta) ? (f.ass_familias_meta[0] || {}) : (f.ass_familias_meta || {});
            return meta.status === 'Ativa';
        });
        
        arrAtivas.sort((a,b) => {
            const nA = (a.nome_curto || a.nome_completo || '').toLowerCase();
            const nB = (b.nome_curto || b.nome_completo || '').toLowerCase();
            return nA.localeCompare(nB);
        });
        
        let html = '<option value="">-- Selecione uma Família --</option>';
        arrAtivas.forEach(f => {
            const meta = Array.isArray(f.ass_familias_meta) ? (f.ass_familias_meta[0] || {}) : (f.ass_familias_meta || {});
            const cod = meta.codigo || 'S/C';
            const nome = f.nome_curto || f.nome_completo;
            html += `<option value="${f.id}">${cod} - ${nome}</option>`;
        });
        document.getElementById('selFamilia').innerHTML = html;
    }"""

js = re.sub(old_loadF, new_loadF, js)

# 3. fix loadMetrics
old_query = r"\.select\('id, familia_id, quantidade_entregue, data_entrega, ass_cestas_modelos\(codigo, tipo, id\), ass_familias\(codigo, nome_familia\)'\)"
new_query = ".select('id, familia_id, pessoa_id, quantidade_entregue, data_entrega, ass_cestas_modelos(codigo, tipo, id), ass_familias(codigo, nome_familia), pessoas(nome_curto, nome_completo, ass_familias_meta(codigo))')"
js = js.replace(old_query, new_query)

old_foreach = r"entregas\.forEach\(e => \{\s*if \(e\.familia_id\) famSet\.add\(e\.familia_id\);"
new_foreach = """entregas.forEach(e => {
            if (e.pessoa_id) famSet.add(e.pessoa_id);
            else if (e.familia_id) famSet.add(e.familia_id);"""
js = re.sub(old_foreach, new_foreach, js)

old_list = r"const famNome = e\.ass_familias \? e\.ass_familias\.codigo : '\?\?\?';"
new_list = """let famNome = e.ass_familias ? e.ass_familias.codigo : '???';
                if (e.pessoa_id && e.pessoas) {
                    const meta = Array.isArray(e.pessoas.ass_familias_meta) ? (e.pessoas.ass_familias_meta[0] || {}) : (e.pessoas.ass_familias_meta || {});
                    famNome = meta.codigo || 'S/C';
                }"""
js = re.sub(old_list, new_list, js)

with open('m_dash_entregas.js', 'w') as f:
    f.write(js)
