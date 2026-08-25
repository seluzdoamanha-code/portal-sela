import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/m_atendimento_pedido.js'
with open(filepath, 'r') as f:
    js = f.read()

old_query = """            // Pegar últimos cadastros para base do autocomplete
            let { data } = await db.from('app_atendimento_fraterno').select('nome_completo, endereco_completo, data_nascimento, telefone').order('created_at', { ascending: false }).limit(200);
            
            if (data) {
                window.sugestoes = {};
                data.forEach(item => {
                    if (item.nome_completo) {
                        const n = item.nome_completo.toUpperCase();
                        if (!window.sugestoes[n]) {
                            window.sugestoes[n] = item;
                        }
                    }
                });
            }"""

new_query = """            // Pegar pessoas físicas para base do autocomplete
            let { data } = await db.from('pessoas')
                .select('nome_completo, data_nascimento, celular, endereco, bairro')
                .eq('tipo_pessoa', 'Física');
            
            if (data) {
                window.sugestoes = {};
                data.forEach(p => {
                    if (p.nome_completo) {
                        const n = p.nome_completo.toUpperCase();
                        
                        let endCompleto = p.endereco || '';
                        if (p.bairro) endCompleto += (endCompleto ? ' - ' : '') + p.bairro;
                        
                        if (!window.sugestoes[n]) {
                            window.sugestoes[n] = {
                                endereco_completo: endCompleto,
                                data_nascimento: p.data_nascimento,
                                telefone: p.celular
                            };
                        }
                    }
                });
            }"""

if old_query in js:
    js = js.replace(old_query, new_query)
    with open(filepath, 'w') as f:
        f.write(js)
    print("m_atendimento_pedido.js patched for autocomplete!")
else:
    print("Could not find old_query in m_atendimento_pedido.js")

