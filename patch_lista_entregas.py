import re
with open('assistencia.js', 'r') as f:
    js = f.read()

old_select = r"\*\,\s*ass_familias \(nome_familia, tipo\),\s*ass_cestas_modelos \(tipo\)"
new_select = "*, ass_familias (nome_familia, tipo), pessoas (nome_curto, nome_completo, ass_familias_meta (tipo)), ass_cestas_modelos (tipo)"
js = re.sub(old_select, new_select, js)

old_foreach = r"entregasData\.forEach\(e => \{\s*const famTipo = e\.ass_familias\?\.tipo;\s*const qtd = e\.quantidade_entregue \|\| 1;\s*if \(famTipo === 'Fixa' \|\| famTipo === 'Fixa/Assistida'\) realFixa \+= qtd;\s*if \(famTipo === 'Extra'\) realExtra \+= qtd;\s*\}\);"
new_foreach = """entregasData.forEach(e => {
            let famTipo = e.ass_familias?.tipo;
            if (e.pessoa_id && e.pessoas) {
                const meta = Array.isArray(e.pessoas.ass_familias_meta) ? e.pessoas.ass_familias_meta[0] : e.pessoas.ass_familias_meta;
                famTipo = meta ? meta.tipo : 'Fixa/Assistida';
            }
            const qtd = e.quantidade_entregue || 1;
            if (famTipo === 'Fixa' || famTipo === 'Fixa/Assistida') realFixa += qtd;
            if (famTipo === 'Extra') realExtra += qtd;
        });"""

js = re.sub(old_foreach, new_foreach, js)

with open('assistencia.js', 'w') as f:
    f.write(js)
