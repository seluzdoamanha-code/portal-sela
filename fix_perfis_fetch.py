import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.js'
with open(filepath, 'r') as f:
    js = f.read()

old_fetch = """        try {
            const { data } = await db.from('configuracoes').select('valor').eq('chave', 'opcoes_perfis').single();
            if (data && data.valor) {
                const perfis = JSON.parse(data.valor);
                const currentVal = select.value;
                select.innerHTML = '<option value="todos">Todos</option>';
                perfis.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p;
                    opt.textContent = p;
                    select.appendChild(opt);
                });
                select.value = currentVal;
            }
        } catch(e) {}"""

new_fetch = """        try {
            const { data } = await db.from('configuracoes').select('valor').eq('chave', 'perfis_pessoas').single();
            if (data && data.valor) {
                const perfis = data.valor.split(',').map(s => s.trim()).filter(Boolean);
                const currentVal = select.value;
                select.innerHTML = '<option value="todos">Todos</option>';
                perfis.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p;
                    opt.textContent = p;
                    select.appendChild(opt);
                });
                select.value = currentVal;
            }
        } catch(e) { console.error('Erro ao buscar perfis:', e); }"""

js = js.replace(old_fetch, new_fetch)

with open(filepath, 'w') as f:
    f.write(js)
print("Fetch patched.")
