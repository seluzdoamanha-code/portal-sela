import re

with open('m_ass_familias.js', 'r') as f:
    js_content = f.read()

new_query = """
            // Tentar carregar sem .contains se for dar erro
            let dataNovas, errorNovas;
            try {
                const result = await db.from('pessoas')
                    .select('*, ass_familias_meta(id, codigo, status, tipo), pessoas_relacionamentos!pessoa_origem_id(id)')
                    .contains('perfis', ['Titular da Família']);
                dataNovas = result.data;
                errorNovas = result.error;
            } catch(e) {
                errorNovas = e;
            }
            
            if (errorNovas) {
                // Fallback
                const resultAll = await db.from('pessoas')
                    .select('*, ass_familias_meta(id, codigo, status, tipo), pessoas_relacionamentos!pessoa_origem_id(id)');
                if (resultAll.error) throw resultAll.error;
                
                dataNovas = (resultAll.data || []).filter(p => {
                    const arr = Array.isArray(p.perfis) ? p.perfis : (typeof p.perfis === 'string' ? JSON.parse(p.perfis || '[]') : []);
                    return arr.includes('Titular da Família');
                });
                errorNovas = null;
            }
"""

js_content = re.sub(r'            const \{ data: dataNovas, error: errorNovas \} = await db\.from\(\'pessoas\'\)\s*\.select\(.*?\)\s*\.contains\(.*?\);', new_query.strip(), js_content, flags=re.DOTALL)

with open('m_ass_familias.js', 'w') as f:
    f.write(js_content)

