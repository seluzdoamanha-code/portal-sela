import re

with open('admin.js', 'r') as f:
    js = f.read()

# 1. Update switchSubTab to include 'tabelas' and 'usuarios'
old_tabs_array = r"const tabs = \['perfil', 'dados', 'lista', 'cards', 'miniapps', 'irradiacao'\];"
new_tabs_array = "const tabs = ['perfil', 'dados', 'lista', 'cards', 'miniapps', 'irradiacao', 'tabelas', 'usuarios'];"
js = re.sub(old_tabs_array, new_tabs_array, js)


# 2. Add functions for Usuários Autorizados
usuarios_funcs = """
window.carregarUsuariosAutorizados = async function() {
    try {
        const { data, error } = await db.from('usuarios_autorizados').select('*').order('criado_em', {ascending: false});
        if (error) throw error;
        
        const tbody = document.getElementById('tabelaUsuariosAutorizados');
        if (!tbody) return;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="padding: 16px; text-align: center; color: var(--text-muted);">Nenhum usuário cadastrado.</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(u => {
            const dataCriado = new Date(u.criado_em).toLocaleDateString('pt-BR');
            return `
                <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 12px 16px; color: var(--text-main); font-weight: 500;">${u.nome || '-'}</td>
                    <td style="padding: 12px 16px; color: var(--text-muted);">${u.email}</td>
                    <td style="padding: 12px 16px;"><span style="font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 6px; background: ${u.nivel_acesso === 'admin' ? 'rgba(236,72,153,0.1)' : 'rgba(56,189,248,0.1)'}; color: ${u.nivel_acesso === 'admin' ? '#ec4899' : '#38bdf8'}; text-transform: uppercase;">${u.nivel_acesso}</span></td>
                    <td style="padding: 12px 16px; color: var(--text-muted);">${dataCriado}</td>
                    <td style="padding: 12px 16px;">
                        <button onclick="excluirUsuarioAutorizado('${u.email}')" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 4px; border-radius: 4px;" title="Remover acesso">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch(e) {
        console.error(e);
        const tbody = document.getElementById('tabelaUsuariosAutorizados');
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center;">Erro ao carregar usuários.</td></tr>';
    }
};

window.salvarUsuarioAutorizado = async function() {
    const nome = document.getElementById('bdUserNome').value.trim();
    const email = document.getElementById('bdUserEmail').value.trim();
    const nivel = document.getElementById('bdUserNivel').value;
    
    if (!email) {
        alert("O e-mail é obrigatório.");
        return;
    }
    
    try {
        const { error } = await db.from('usuarios_autorizados').insert([{
            nome: nome,
            email: email,
            nivel_acesso: nivel
        }]);
        if (error) {
            if (error.code === '23505') throw new Error("Este e-mail já está autorizado.");
            throw error;
        }
        
        document.getElementById('bdUserNome').value = '';
        document.getElementById('bdUserEmail').value = '';
        carregarUsuariosAutorizados();
        
    } catch(err) {
        console.error(err);
        alert('Erro ao salvar usuário: ' + (err.message || ''));
    }
};

window.excluirUsuarioAutorizado = async function(email) {
    if (!confirm(`Remover autorização para ${email}?`)) return;
    try {
        const { error } = await db.from('usuarios_autorizados').delete().eq('email', email);
        if (error) throw error;
        carregarUsuariosAutorizados();
    } catch(err) {
        console.error(err);
        alert('Erro ao excluir usuário.');
    }
};
"""

js += "\n" + usuarios_funcs

# Hook into initialization or switchTab
old_switchTab_bd = r"if \(tabId === 'bd'\) \{\s*if \(typeof window\.carregarEstatisticasBD === 'function'\) \{\s*window\.carregarEstatisticasBD\(\);\s*\}\s*\}"
new_switchTab_bd = """if (tabId === 'bd') {
        if (typeof window.carregarEstatisticasBD === 'function') {
            window.carregarEstatisticasBD();
        }
        if (typeof window.carregarUsuariosAutorizados === 'function') {
            window.carregarUsuariosAutorizados();
        }
    }"""
js = re.sub(old_switchTab_bd, new_switchTab_bd, js)

with open('admin.js', 'w') as f:
    f.write(js)

