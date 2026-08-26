import re

with open('familias.js', 'r') as f:
    js_content = f.read()

new_query = """
        // Tentar carregar sem .contains se for dar erro
        let perfilData, err2;
        try {
            const result = await db.from('pessoas')
                .select('*, ass_familias_meta(id, codigo, status, tipo), pessoas_relacionamentos!pessoa_origem_id(tipo_relacao, pessoas!pessoa_destino_id(nome_completo))')
                .contains('perfis', ['Titular da Família']);
            perfilData = result.data;
            err2 = result.error;
        } catch(e) {
            err2 = e;
        }
        
        if (err2) {
            // Fallback: Busca manual se o operador falhar
            const resultAll = await db.from('pessoas')
                .select('*, ass_familias_meta(id, codigo, status, tipo), pessoas_relacionamentos!pessoa_origem_id(tipo_relacao, pessoas!pessoa_destino_id(nome_completo))');
            if (resultAll.error) throw resultAll.error;
            
            perfilData = (resultAll.data || []).filter(p => {
                const arr = Array.isArray(p.perfis) ? p.perfis : (typeof p.perfis === 'string' ? JSON.parse(p.perfis || '[]') : []);
                return arr.includes('Titular da Família');
            });
        }
"""

js_content = re.sub(r'        const \{ data: perfilData, error: err2 \} = await db\.from\(\'pessoas\'\)\s*\.select\(.*?\)\s*\.contains\(.*?\);\s*if \(err2\) throw err2;', new_query.strip(), js_content, flags=re.DOTALL)

with open('familias.js', 'w') as f:
    f.write(js_content)

