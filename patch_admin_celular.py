import re

with open('admin.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

target = r'\$\{p.celular \? `(?:<div[^>]*>).*?<span>\$\{p.celular\}</span></div>` : \'\'\}'

def replacer(match):
    return r"""${p.celular ? `<div style="font-size: 14px; margin-bottom: 4px; display: flex; justify-content: space-between;"><span style="color:var(--text-muted)">Celular:</span> <span>${p.celular.replace(/\D/g, '').replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3')}</span></div>` : ''}"""

js_content = re.sub(target, replacer, js_content, count=1)

with open('admin.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Celular patched")
