import re
with open('m_ass_entregas.js', 'r') as f:
    js = f.read()

# 1. capture url params
old_params = r"const urlParams = new URLSearchParams\(window\.location\.search\);\s*familiaId = urlParams\.get\('f_id'\);\s*const fNome = urlParams\.get\('f_nome'\);"
new_params = """const urlParams = new URLSearchParams(window.location.search);
        familiaId = urlParams.get('f_id');
        const fNome = urlParams.get('f_nome');
        window.isGlobalFam = urlParams.get('is_global') === '1';"""

js = re.sub(old_params, new_params, js)

# 2. adjust payload
old_payload = r"const \{ error \} = await db\.from\('ass_entregas'\)\.insert\(\[\{\s*familia_id: familiaId,\s*cesta_id: modeloId,\s*data_entrega: dataEnt,\s*ano_ref: parseInt\(ano\),\s*mes_ref: parseInt\(mes\),\s*quantidade_entregue: qtd,\s*observacoes: obs\s*\}\]\);"

new_payload = """
            const payload = {
                cesta_id: modeloId,
                data_entrega: dataEnt,
                ano_ref: parseInt(ano),
                mes_ref: parseInt(mes),
                quantidade_entregue: qtd,
                observacoes: obs
            };
            if (window.isGlobalFam) {
                payload.pessoa_id = familiaId;
            } else {
                payload.familia_id = familiaId;
            }
            const { error } = await db.from('ass_entregas').insert([payload]);
"""

js = re.sub(old_payload, new_payload, js)

with open('m_ass_entregas.js', 'w') as f:
    f.write(js)
