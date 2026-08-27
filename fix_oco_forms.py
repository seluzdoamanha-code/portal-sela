import re

with open('familias.js', 'r') as f:
    js = f.read()

# 1. Fix familias.js
old_modal_oco = r"try \{\s*const \{ data: familias \} = await db\.from\('ass_familias'\)\.select\('id, nome_familia, codigo'\)\.order\('nome_familia'\);\s*document\.getElementById\('assOcorFamilia'\)\.innerHTML = '<option value=\"\">-- Selecione a família --</option>' \+\s*\(familias \|\| \[\]\)\.map\(f => `<option value=\"\$\{f\.id\}\">\$\{f\.codigo\} - \$\{f\.nome_familia\}</option>`\)\.join\(''\);\s*\} catch\(e\) \{"
new_modal_oco = """try {
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
        
        document.getElementById('assOcorFamilia').innerHTML = '<option value="">-- Selecione a família --</option>' + 
            arrAtivas.map(f => {
                const meta = Array.isArray(f.ass_familias_meta) ? (f.ass_familias_meta[0] || {}) : (f.ass_familias_meta || {});
                const nome = f.nome_curto || f.nome_completo;
                const cod = meta.codigo || 'S/C';
                return `<option value="${f.id}">${cod} - ${nome}</option>`;
            }).join('');
    } catch(e) {"""
js = re.sub(old_modal_oco, new_modal_oco, js)

# Fix payload in salvarNovaOcorrenciaAss
js = re.sub(r"familia_id: document\.getElementById\('assOcorFamilia'\)\.value,", "pessoa_id: document.getElementById('assOcorFamilia').value,", js)

with open('familias.js', 'w') as f:
    f.write(js)

print("familias.js updated")

# 2. Fix m_dash_ocorrencias.js
with open('m_dash_ocorrencias.js', 'r') as f:
    js2 = f.read()

old_load_fam = r"async function loadFamilias\(\) \{\s*const \{ data, error \} = await db\.from\('ass_familias'\)\s*\.select\('id, codigo, nome_familia'\)\s*\.eq\('status', 'Ativa'\)\s*\.order\('nome_familia'\);\s*if \(error\) \{\s*console\.error\(error\);\s*return;\s*\}\s*let html = '<option value=\"\">-- Selecione uma Família --</option>';\s*data\.forEach\(f => \{\s*const nomeLindo = f\.codigo \+ ' - ' \+ f\.nome_familia;\s*familiaMap\[f\.id\] = nomeLindo;\s*html \+= `<option value=\"\$\{f\.id\}\">\$\{nomeLindo\}</option>`;\s*\}\);\s*document\.getElementById\('selFamilia'\)\.innerHTML = html;\s*\}"
new_load_fam = """async function loadFamilias() {
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
            const nomeLindo = cod + ' - ' + (f.nome_curto || f.nome_completo);
            familiaMap[f.id] = nomeLindo;
            html += `<option value="${f.id}">${nomeLindo}</option>`;
        });
        document.getElementById('selFamilia').innerHTML = html;
    }"""
js2 = re.sub(old_load_fam, new_load_fam, js2)

old_route = r"window\.location\.href = 'm_ass_ocorrencias\.html\?f_id=' \+ sel\.value \+ '&f_nome=' \+ nomeFam \+ '&from=dash';"
new_route = "window.location.href = 'm_ass_ocorrencias.html?f_id=' + sel.value + '&f_nome=' + nomeFam + '&from=dash&is_global=1';"
js2 = re.sub(old_route, new_route, js2)

old_metrics_query = r"\.select\('id, familia_id, codigo, tipo, observacao, data_ocorrencia, ass_familias\(codigo, nome_familia\)'\)"
new_metrics_query = ".select('id, familia_id, pessoa_id, codigo, tipo, observacao, data_ocorrencia, ass_familias(codigo, nome_familia), pessoas(nome_curto, nome_completo, ass_familias_meta(codigo))')"
js2 = js2.replace(old_metrics_query, new_metrics_query)

old_metrics_list = r"const famNome = o\.ass_familias \? o\.ass_familias\.codigo \+ ' - ' \+ o\.ass_familias\.nome_familia\.split\(' '\)\[0\] : '\?\?\?';"
new_metrics_list = """let famNome = o.ass_familias ? o.ass_familias.codigo + ' - ' + o.ass_familias.nome_familia.split(' ')[0] : '???';
                if (o.pessoa_id && o.pessoas) {
                    const meta = Array.isArray(o.pessoas.ass_familias_meta) ? (o.pessoas.ass_familias_meta[0] || {}) : (o.pessoas.ass_familias_meta || {});
                    famNome = (meta.codigo || 'S/C') + ' - ' + (o.pessoas.nome_curto || o.pessoas.nome_completo).split(' ')[0];
                }"""
js2 = re.sub(old_metrics_list, new_metrics_list, js2)

with open('m_dash_ocorrencias.js', 'w') as f:
    f.write(js2)

print("m_dash_ocorrencias.js updated")

