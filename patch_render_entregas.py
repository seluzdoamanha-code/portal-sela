import re
with open('assistencia.js', 'r') as f:
    js = f.read()

old_render = r"\$\{entregasData\.map\(e => `\s*<tr style=\"border-bottom: 1px solid var\(--border\); font-size: 13px;\">\s*<td style=\"padding: 8px 4px; color: var\(--text-muted\);\">\$\{e\.data_entrega\.split\('-'\)\.reverse\(\)\.join\('/'\)\}<\/td>\s*<td style=\"padding: 8px 4px; color: var\(--text-main\); font-weight: 500;\">\$\{e\.ass_familias\?\.nome_familia \|\| 'Família Deletada'\}<\/td>\s*<td style=\"padding: 8px 4px;\">\s*<span style=\"background: \$\{e\.ass_familias\?\.tipo === 'Extra' \? 'rgba\(234,179,8,0\.1\)' : 'rgba\(16,185,129,0\.1\)'\}; color: \$\{e\.ass_familias\?\.tipo === 'Extra' \? '#eab308' : '#10b981'\}; padding: 2px 6px; border-radius: 4px; font-size: 11px;\">\s*\$\{e\.ass_familias\?\.tipo \|\| '\?'\}\s*<\/span>\s*<\/td>"

new_render = """${entregasData.map(e => {
                                    let nomeFamilia = e.ass_familias?.nome_familia || 'Família Deletada';
                                    let isGlobal = false;
                                    let famTipo = e.ass_familias?.tipo || '?';
                                    
                                    if (e.pessoa_id && e.pessoas) {
                                        nomeFamilia = e.pessoas.nome_curto || e.pessoas.nome_completo;
                                        isGlobal = true;
                                        const meta = Array.isArray(e.pessoas.ass_familias_meta) ? (e.pessoas.ass_familias_meta[0] || {}) : (e.pessoas.ass_familias_meta || {});
                                        famTipo = meta.tipo || 'Fixa/Assistida';
                                        if(meta.codigo) nomeFamilia = meta.codigo + ' - ' + nomeFamilia;
                                    }

                                    return `
                                    <tr style="border-bottom: 1px solid var(--border); font-size: 13px;">
                                        <td style="padding: 8px 4px; color: var(--text-muted);">${e.data_entrega.split('-').reverse().join('/')}</td>
                                        <td style="padding: 8px 4px; color: var(--text-main); font-weight: 500;">
                                            ${nomeFamilia} ${isGlobal ? '<span style="font-size:10px; background:#4ade80; color:#14532d; padding:2px 6px; border-radius:8px; margin-left:4px;">Global</span>' : '<span style="font-size:10px; background:#64748b; color:white; padding:2px 6px; border-radius:8px; margin-left:4px;">Legado</span>'}
                                        </td>
                                        <td style="padding: 8px 4px;">
                                            <span style="background: ${famTipo === 'Extra' ? 'rgba(234,179,8,0.1)' : 'rgba(16,185,129,0.1)'}; color: ${famTipo === 'Extra' ? '#eab308' : '#10b981'}; padding: 2px 6px; border-radius: 4px; font-size: 11px;">
                                                ${famTipo}
                                            </span>
                                        </td>"""

js = re.sub(old_render, new_render, js)

with open('assistencia.js', 'w') as f:
    f.write(js)
