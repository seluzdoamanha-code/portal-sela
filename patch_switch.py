import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.js'
with open(filepath, 'r') as f:
    content = f.read()

old_switch = """window.switchSubTab = function(target, tabName) {
    const tabs = ['perfil', 'dados', 'lista'];
    tabs.forEach(t => {
        const el = document.getElementById(`subtab-${target}-${t}`) || document.getElementById(`${target}-${t}`);
        if (el) el.style.display = 'none';
        
        const btn = document.querySelector(`.btn-${target}-${t}`);
        if (btn) {
            btn.classList.remove('active');
            btn.style.background = 'rgba(255,255,255,0.05)';
            btn.style.color = 'var(--text-muted)';
            btn.style.border = '1px solid var(--border)';
        }
    });
    
    const targetEl = document.getElementById(`subtab-${target}-${tabName}`) || document.getElementById(`${target}-${tabName}`);
    if (targetEl) targetEl.style.display = tabName === 'lista' ? 'flex' : (tabName === 'dados' ? 'grid' : 'block');
    
    const targetBtn = document.querySelector(`.btn-${target}-${tabName}`);
    if (targetBtn) {
        targetBtn.classList.add('active');
        targetBtn.style.background = 'var(--primary)';
        targetBtn.style.color = 'white';
        targetBtn.style.border = 'none';
    }
    
    if (tabName === 'lista') {
        if (target === 'associados' && typeof window.carregarTabelaListaAssociados === 'function') {
            window.carregarTabelaListaAssociados();
        } else if (target === 'pessoas' && typeof window.carregarTabelaListaGlobalPessoas === 'function') {
            window.carregarTabelaListaGlobalPessoas();
        }
    }
};"""

new_switch = """window.switchSubTab = function(target, tabName) {
    const tabs = ['perfil', 'dados', 'lista', 'cards'];
    tabs.forEach(t => {
        const el = document.getElementById(`subtab-${target}-${t}`) || document.getElementById(`${target}-${t}`);
        if (el) el.style.display = 'none';
        
        const btn = document.querySelector(`.btn-${target}-${t}`);
        if (btn) {
            btn.classList.remove('active');
            btn.style.background = 'rgba(255,255,255,0.05)';
            btn.style.color = 'var(--text-muted)';
            btn.style.border = '1px solid var(--border)';
        }
    });
    
    const targetEl = document.getElementById(`subtab-${target}-${tabName}`) || document.getElementById(`${target}-${tabName}`);
    if (targetEl) targetEl.style.display = tabName === 'lista' ? 'flex' : 'block';
    
    const targetBtn = document.querySelector(`.btn-${target}-${tabName}`);
    if (targetBtn) {
        targetBtn.classList.add('active');
        targetBtn.style.background = 'var(--primary)';
        targetBtn.style.color = 'white';
        targetBtn.style.border = 'none';
    }
    
    if (tabName === 'lista') {
        if (target === 'associados' && typeof window.carregarTabelaListaAssociados === 'function') {
            window.carregarTabelaListaAssociados();
        } else if (target === 'pessoas' && typeof window.carregarTabelaListaGlobalPessoas === 'function') {
            window.carregarTabelaListaGlobalPessoas();
        } else if (target === 'departamentos' && typeof window.carregarTabelaListaDepartamentos === 'function') {
            window.carregarTabelaListaDepartamentos();
        } else if (target === 'atividades' && typeof window.carregarTabelaListaAtividades === 'function') {
            window.carregarTabelaListaAtividades();
        }
    }
};"""

if old_switch in content:
    content = content.replace(old_switch, new_switch)
    with open(filepath, 'w') as f:
        f.write(content)
    print("JS patched switchSubTab.")
else:
    print("Failed to find old switchSubTab.")
