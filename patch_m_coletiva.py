import re
with open('m_ass_entrega_coletiva.js', 'r') as f:
    js = f.read()

old_fetch = r"// Fetch Active Families\s*const \{ data: familias, error: famErr \} = await db\.from\('ass_familias'\)\s*\.select\('id, codigo, nome_familia'\)\s*\.eq\('status', 'Ativa'\)\s*\.order\('nome_familia'\);\s*if \(famErr\) throw famErr;\s*allFamilias = familias \|\| \[\];"
new_fetch = """// Fetch Active Families
            const { data: familiasRaw, error: famErr } = await db.from('pessoas')
                .select('id, nome_curto, nome_completo, ass_familias_meta(codigo, status, tipo)')
                .contains('perfis', ['Titular da Família']);
                
            let familiasP = [];
            if (famErr) {
                const { data: allP } = await db.from('pessoas').select('id, nome_curto, nome_completo, perfis, ass_familias_meta(codigo, status, tipo)');
                if (allP) {
                    familiasP = allP.filter(p => {
                        const arr = Array.isArray(p.perfis) ? p.perfis : (typeof p.perfis === 'string' ? JSON.parse(p.perfis || '[]') : []);
                        return arr.includes('Titular da Família');
                    });
                }
            } else {
                familiasP = familiasRaw || [];
            }

            const arrAtivas = familiasP.filter(f => {
                const meta = Array.isArray(f.ass_familias_meta) ? (f.ass_familias_meta[0] || {}) : (f.ass_familias_meta || {});
                return meta.status === 'Ativa';
            });
            
            arrAtivas.sort((a,b) => {
                const nA = (a.nome_curto || a.nome_completo || '').toLowerCase();
                const nB = (b.nome_curto || b.nome_completo || '').toLowerCase();
                return nA.localeCompare(nB);
            });
            
            allFamilias = arrAtivas.map(f => {
                const meta = Array.isArray(f.ass_familias_meta) ? (f.ass_familias_meta[0] || {}) : (f.ass_familias_meta || {});
                return {
                    id: f.id,
                    codigo: meta.codigo || 'S/C',
                    nome_familia: f.nome_curto || f.nome_completo,
                    is_global: true
                };
            });"""

js = re.sub(old_fetch, new_fetch, js)

js = js.replace(".select('id, familia_id, cesta_id, quantidade_entregue')", ".select('id, pessoa_id, cesta_id, quantidade_entregue')")

with open('m_ass_entrega_coletiva.js', 'w') as f:
    f.write(js)
