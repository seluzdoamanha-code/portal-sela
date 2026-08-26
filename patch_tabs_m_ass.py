import re

with open('m_ass_familias.html', 'r') as f:
    html_content = f.read()
    
# 1. Add CSS for Tabs
new_css = """
        .m-main-tabs {
            display: flex;
            background: var(--bg-dark);
            border-bottom: 1px solid var(--border);
            position: sticky;
            top: 60px;
            z-index: 11;
        }
        .m-main-tab {
            flex: 1;
            text-align: center;
            padding: 14px 0;
            font-size: 14px;
            font-weight: 600;
            color: var(--text-muted);
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }
        .m-main-tab.active {
            color: var(--primary);
            border-bottom: 2px solid var(--primary);
            background: rgba(99, 102, 241, 0.05);
        }
        
        .m-search-box {
"""
html_content = html_content.replace('.m-search-box {', new_css)

# 2. Add Tabs DOM just above the search box
new_tabs = """
    <div class="m-main-tabs" id="mMainTabs">
        <div class="m-main-tab active" data-tab="legado">Famílias Legado</div>
        <div class="m-main-tab" data-tab="perfil">Famílias Perfil</div>
    </div>
    
    <div class="m-search-box" style="top: 110px;">
"""
html_content = html_content.replace('<div class="m-search-box">', new_tabs)
html_content = html_content.replace('top: 60px;', 'top: 110px;') # Update search box sticky top (for .m-search-box in css)
html_content = html_content.replace('top: 110px;\n            z-index: 10;', 'top: 108px;\n            z-index: 10;')
html_content = html_content.replace('top: 130px; /* Abaixo da search box */', 'top: 180px; /* Abaixo da search box */')


# 3. Add the Meta Modal form to the HTML (before the body ends)
meta_modal = """
    <!-- Modal: Meta Dados Familia (Nova Plataforma) -->
    <div id="mMetaModal" class="m-modal-overlay">
        <header class="m-header-nav">
            <button class="m-back-btn" onclick="document.getElementById('mMetaModal').classList.remove('active');">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div class="m-title" id="mMetaTitle">Metadados da Família</div>
            <button id="btnSalvarMeta" style="background:none; border:none; color:var(--primary); font-size:15px; font-weight:600; padding:8px; cursor:pointer;">Salvar</button>
        </header>
        <div class="m-modal-content">
            <input type="hidden" id="fMetaId">
            <div style="background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 20px;">
                <div style="color: var(--text-muted); font-size: 13px; line-height: 1.4;">
                    Edite aqui apenas os dados da Assistência Social. Para adicionar membros, gerencie os Vínculos na página principal de Pessoas.
                </div>
            </div>

            <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                <div class="m-form-group" style="flex: 1;">
                    <label>Código da Família (Ex: F-045)</label>
                    <input type="text" id="fMetaCodigo" class="m-form-input">
                </div>
                <div class="m-form-group" style="flex: 1;">
                    <label>Status</label>
                    <select id="fMetaStatus" class="m-form-input">
                        <option value="Ativa">Ativa</option>
                        <option value="Inativa">Inativa</option>
                        <option value="Suspensa">Suspensa</option>
                    </select>
                </div>
            </div>
            
            <div class="m-form-group" style="margin-bottom: 12px;">
                <label>Tipo de Assistência</label>
                <select id="fMetaTipo" class="m-form-input">
                    <option value="Fixa/Assistida">Fixa / Assistida (Mensal)</option>
                    <option value="Temporária">Temporária / Emergencial</option>
                    <option value="Triagem">Em Triagem</option>
                </select>
            </div>
        </div>
    </div>
"""
html_content = html_content.replace('</body>', meta_modal + '\n</body>')

with open('m_ass_familias.html', 'w') as f:
    f.write(html_content)

# ----------------- JAVASCRIPT ----------------- #

with open('m_ass_familias.js', 'r') as f:
    js_content = f.read()

# Add global state for tabs
js_content = js_content.replace('let allFamilias = [];', 'let allFamilias = [];\n    let familiasLegado = [];\n    let familiasPerfil = [];\n    let currentTab = "legado";\n')

# Tab listeners
tabs_logic = """
        // Setup Main Tabs
        document.querySelectorAll('.m-main-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.m-main-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentTab = tab.getAttribute('data-tab');
                
                // Mudar label do botão Nova Familia
                const btnNova = document.getElementById('btnNovaFamilia');
                if (btnNova) {
                    if (currentTab === 'legado') {
                        btnNova.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
                    } else {
                        btnNova.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>';
                    }
                }
                
                filtrarLista();
            });
        });
        
        // Modal de metadados
        const btnSalvarMeta = document.getElementById('btnSalvarMeta');
        if (btnSalvarMeta) btnSalvarMeta.addEventListener('click', salvarMetaFamilia);

"""
js_content = js_content.replace('// Setup Pills', tabs_logic + '\n        // Setup Pills')

# Update New Family button logic
js_content = re.sub(r"document\.getElementById\('btnNovaFamilia'\)\.addEventListener\('click', abrirFormularioNova\);",
"""document.getElementById('btnNovaFamilia').addEventListener('click', () => {
                if (currentTab === 'legado') {
                    abrirFormularioNova();
                } else {
                    if (confirm('Famílias Perfil são gerenciadas no módulo global de Pessoas. Deseja ir para lá agora?')) {
                        window.location.href = 'pessoas.html';
                    }
                }
            });""", js_content)

# Update Edit Family logic inside Details modal
js_content = re.sub(r"document\.getElementById\('btnEditFamilia'\)\.addEventListener\('click', \(\) => abrirFormularioEdicao\(selectedFamilia\)\);",
"""document.getElementById('btnEditFamilia').addEventListener('click', () => {
                if (selectedFamilia && selectedFamilia.is_nova_plataforma) {
                    abrirFormularioMeta(selectedFamilia);
                } else {
                    abrirFormularioEdicao(selectedFamilia);
                }
            });""", js_content)

# Add Meta Form Logic
meta_form = """
    async function abrirFormularioMeta(f) {
        document.getElementById('mMetaTitle').innerText = 'Metadados Assistência: ' + (f.nome_familia || '');
        document.getElementById('fMetaId').value = f.id; // pessoa_id
        document.getElementById('fMetaCodigo').value = f.codigo || '';
        document.getElementById('fMetaStatus').value = f.status || 'Ativa';
        document.getElementById('fMetaTipo').value = f.tipo || 'Fixa/Assistida';
        
        document.getElementById('mMetaModal').classList.add('active');
    }
    
    async function salvarMetaFamilia() {
        const pessoaId = document.getElementById('fMetaId').value;
        const codigo = document.getElementById('fMetaCodigo').value.trim();
        const status = document.getElementById('fMetaStatus').value;
        const tipo = document.getElementById('fMetaTipo').value;

        const btn = document.getElementById('btnSalvarMeta');
        btn.innerText = 'Salvando...';
        btn.disabled = true;

        try {
            const payload = {
                pessoa_id: pessoaId,
                codigo: codigo,
                status: status,
                tipo: tipo
            };

            const { error } = await db.from('ass_familias_meta').upsert(payload, { onConflict: 'pessoa_id' });
            if (error) throw error;
            
            document.getElementById('mMetaModal').classList.remove('active');
            carregarFamilias();
        } catch(e) {
            console.error(e);
            alert('Erro ao salvar metadados da família.');
        } finally {
            btn.innerText = 'Salvar';
            btn.disabled = false;
        }
    }
"""
js_content = js_content + '\n' + meta_form


# Fix carregarFamilias merging to separate lists
new_carregar = """
    async function carregarFamilias() {
        document.getElementById('mLoadingState').style.display = 'block';

        try {
            // 1. Busca Famílias NOVAS
            const { data: dataNovas, error: errorNovas } = await db.from('pessoas')
                .select('*, ass_familias_meta(id, codigo, status, tipo), pessoas_relacionamentos!pessoa_origem_id(id)')
                .ilike('perfis', '%Titular da Família%');
            
            familiasPerfil = [];
            if (!errorNovas) {
                familiasPerfil = (dataNovas || []).map(p => {
                    const meta = (p.ass_familias_meta && p.ass_familias_meta.length > 0) ? p.ass_familias_meta[0] : {};
                    return {
                        id: p.id,
                        nome_familia: p.nome_curto || p.nome_completo,
                        codigo: meta.codigo || 'S/C',
                        status: meta.status || 'Ativa',
                        tipo: meta.tipo || 'Fixa/Assistida',
                        pessoas: p,
                        ass_membros_familia: p.pessoas_relacionamentos || [],
                        meta_id: meta.id || null,
                        is_nova_plataforma: true
                    };
                });
            }

            // 2. Busca Famílias ANTIGAS
            const { data: dataAntigas, error: errorAntigas } = await db.from('ass_familias')
                .select('*, pessoas(*), ass_membros_familia(id)');
                
            familiasLegado = [];
            if (!errorAntigas) {
                familiasLegado = (dataAntigas || []).map(f => {
                    f.is_nova_plataforma = false;
                    return f;
                });
            }
            
            filtrarLista();

            document.getElementById('mLoadingState').style.display = 'none';
        } catch (e) {
            console.error('Erro:', e);
            document.getElementById('mLoadingState').innerText = 'Erro ao carregar famílias.';
        }
    }
"""
js_content = re.sub(r'    async function carregarFamilias\(\) \{.*?\n    \}', new_carregar.strip(), js_content, flags=re.DOTALL)


# Fix filterList to use active tab list
new_filter = """
    function filtrarLista() {
        const query = (document.getElementById('mSearchInput').value || '').toLowerCase();
        
        let sourceList = currentTab === 'legado' ? familiasLegado : familiasPerfil;
        
        const filtrados = sourceList.filter(f => {
            const nomeStr = (f.nome_familia || '').toLowerCase();
            const codStr = (f.codigo || '').toLowerCase();
            const matchTexto = nomeStr.includes(query) || codStr.includes(query);
            
            let matchPill = true;
            if (currentFilter !== 'Todas') {
                matchPill = (f.status === currentFilter);
            }
            
            return matchTexto && matchPill;
        });
        
        // Reordena
        filtrados.sort((a, b) => {
            const nomeA = (a.nome_familia || '').toLowerCase();
            const nomeB = (b.nome_familia || '').toLowerCase();
            if (nomeA < nomeB) return -1;
            if (nomeA > nomeB) return 1;
            return 0;
        });

        renderizar(filtrados);
        const headerTitle = document.getElementById('mMainTitle');
        if (headerTitle) {
            headerTitle.innerText = currentTab === 'legado' ? `Famílias Legado (${filtrados.length})` : `Famílias Perfil (${filtrados.length})`;
        }
    }
"""
js_content = re.sub(r'    function filtrarLista\(\) \{.*?\}\n', new_filter.strip() + '\n', js_content, flags=re.DOTALL)


# Ensure the "Global" tag rendering logic is NOT mixed in with old files unnecessarily, but it's safe to leave it.
with open('m_ass_familias.js', 'w') as f:
    f.write(js_content)

