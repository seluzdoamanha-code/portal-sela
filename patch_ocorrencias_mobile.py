import re

with open('m_ass_ocorrencias.js', 'r') as f:
    js_content = f.read()

# Modify m_ass_ocorrencias.js to save to pessoa_id instead of familia_id
# And change URL params to expect p_id and p_nome instead of f_id and f_nome
salvar_regex = r'const \{ error \} = await db\.from\(\'ass_ocorrencias\'\)\.insert\(\[\{\n                familia_id: familiaId,'
new_salvar = "const { error } = await db.from('ass_ocorrencias').insert([{\n                pessoa_id: familiaId,"

js_content = re.sub(salvar_regex, new_salvar, js_content, flags=re.DOTALL)

with open('m_ass_ocorrencias.js', 'w') as f:
    f.write(js_content)
