import re

with open('m_ass_familias.js', 'r') as f:
    js_content = f.read()

# Replace occurrences fetching in details view
old_oco_fetch = r"""            db\.from\('ass_ocorrencias'\)\s*\.select\('\*'\)\s*\.eq\('familia_id', f\.id\)"""
new_oco_fetch = """            const colOco = f.is_nova_plataforma ? 'pessoa_id' : 'familia_id';
            db.from('ass_ocorrencias')
              .select('*')
              .eq(colOco, f.id)"""

js_content = re.sub(old_oco_fetch, new_oco_fetch, js_content, flags=re.DOTALL)

# Replace occurrences fetching in carregarHistoricoOcorrencias
old_hist = r"""            const \{ data, error \} = await db\.from\('ass_ocorrencias'\)\s*\.select\('\*'\)\s*\.eq\('familia_id', selectedFamilia\.id\)"""
new_hist = """            const colHist = selectedFamilia.is_nova_plataforma ? 'pessoa_id' : 'familia_id';
            const { data, error } = await db.from('ass_ocorrencias')
                .select('*')
                .eq(colHist, selectedFamilia.id)"""

js_content = re.sub(old_hist, new_hist, js_content, flags=re.DOTALL)


# Also autoOpenFamilia needs to fetch from the correct place based on if it's Global or Legado. But actually `autoOpenFamilia` is currently only looking at `ass_familias`. Wait, if they click from `m_ass_ocorrencias.html`, it will use `open_id`. If it's a global family, `ass_familias` won't find it. 
# We'll patch autoOpenFamilia to just reload the whole list and open the correct card!
old_auto_open = r"""    async function autoOpenFamilia\(id\) \{.*?console\.error\('Erro auto open', e\);\s*\}\s*\}"""
new_auto_open = """    async function autoOpenFamilia(id) {
        // Wait a bit to ensure carregarFamilias finishes loading allFamilias
        setTimeout(() => {
            if (typeof allFamilias !== 'undefined') {
                const fam = allFamilias.find(f => f.id === id);
                if (fam) abrirDetalhes(fam);
            }
        }, 1500);
    }"""
js_content = re.sub(old_auto_open, new_auto_open, js_content, flags=re.DOTALL)


with open('m_ass_familias.js', 'w') as f:
    f.write(js_content)
