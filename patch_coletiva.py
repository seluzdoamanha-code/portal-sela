import re
with open('assistencia.js', 'r') as f:
    js = f.read()

old_fetch = r"// Fetch Familias\s*const \{ data: fams \} = await db\.from\('ass_familias'\)\.select\('id, codigo, nome_familia'\)\.eq\('status', 'Ativa'\)\.order\('nome_familia'\);\s*window\.assColetivaFamilias = fams \|\| \[\];"
new_fetch = """// Fetch Familias
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
        
        window.assColetivaFamilias = arrAtivas.map(f => {
            const meta = Array.isArray(f.ass_familias_meta) ? (f.ass_familias_meta[0] || {}) : (f.ass_familias_meta || {});
            return {
                id: f.id,
                codigo: meta.codigo || 'S/C',
                nome_familia: f.nome_curto || f.nome_completo
            };
        });"""

js = re.sub(old_fetch, new_fetch.strip(), js)

# Change Entregas do Mes query
js = js.replace(".select('id, familia_id, cesta_id, quantidade_entregue')", ".select('id, pessoa_id, cesta_id, quantidade_entregue')")

with open('assistencia.js', 'w') as f:
    f.write(js)
