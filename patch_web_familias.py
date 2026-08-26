import re

with open('familias.js', 'r') as f:
    js_content = f.read()

# 1. Update HTML structure in carregarAppFamilias
new_html = """
                <!-- Aba Famílias -->
                <div id="famCadastro" class="fam-tab-content" style="display: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <h3 style="color: var(--text-main); margin: 0;">Cadastro de Famílias</h3>
                            <div style="display: flex; background: rgba(0,0,0,0.2); border-radius: 8px; overflow: hidden; border: 1px solid var(--border);">
                                <button onclick="window.mudarSubAbaFamilias('legado')" id="btnFamLegado" style="padding: 6px 12px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; background: var(--primary); color: white;">Legado</button>
                                <button onclick="window.mudarSubAbaFamilias('perfil')" id="btnFamPerfil" style="padding: 6px 12px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; background: transparent; color: var(--text-muted);">Perfil Global</button>
                            </div>
                        </div>
                        <button id="btnWebNovaFamilia" class="btn btn-primary" onclick="abrirModalNovaFamilia()" style="border-radius: 8px; font-weight: 500;">+ Nova Família</button>
                    </div>
                    <div id="famCadastroLista"></div>
                </div>
"""
js_content = re.sub(r'                <!-- Aba Famílias -->.*?</div>\s*</div>\s*<!-- Aba Ocorrências -->', new_html.strip() + '\n\n                <!-- Aba Ocorrências -->', js_content, flags=re.DOTALL)

# 2. Add SubTab switcher function globally
sub_tab_logic = """
window._currentWebTab = 'legado';
window.mudarSubAbaFamilias = function(tab) {
    window._currentWebTab = tab;
    document.getElementById('btnFamLegado').style.background = tab === 'legado' ? 'var(--primary)' : 'transparent';
    document.getElementById('btnFamLegado').style.color = tab === 'legado' ? 'white' : 'var(--text-muted)';
    
    document.getElementById('btnFamPerfil').style.background = tab === 'perfil' ? 'var(--primary)' : 'transparent';
    document.getElementById('btnFamPerfil').style.color = tab === 'perfil' ? 'white' : 'var(--text-muted)';
    
    document.getElementById('btnWebNovaFamilia').onclick = tab === 'legado' 
        ? () => abrirModalNovaFamilia() 
        : () => { if(confirm('As Famílias do perfil global são gerenciadas no módulo de Pessoas. Deseja ir para lá?')) window.location.href = 'index.html?module=pessoas'; };
        
    window.renderListaFamiliasWeb();
};
"""
js_content = js_content.replace('// Controle de abas internas', sub_tab_logic + '\n// Controle de abas internas')

# 3. Modify carregarListaFamilias to fetch both and render
new_carregar = """
async function carregarListaFamilias() {
    const container = document.getElementById('famCadastroLista');
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">Carregando famílias...</div>';

    try {
        // Busca Legado
        const { data: legado, error: err1 } = await db.from('ass_familias').select(`
            *,
            responsavel:pessoas!ass_familias_responsavel_id_fkey(nome_completo),
            ass_membros_familia(id, parentesco, pessoas(nome_completo))
        `).order('nome_familia');
        if (err1) throw err1;
        window._familiasLegadoWeb = legado || [];

        // Busca Perfil Global
        const { data: perfilData, error: err2 } = await db.from('pessoas')
            .select('*, ass_familias_meta(id, codigo, status, tipo), pessoas_relacionamentos!pessoa_origem_id(tipo_relacao, pessoas!pessoa_destino_id(nome_completo))')
            .ilike('perfis', '%Titular da Família%');
        if (err2) throw err2;
        
        window._familiasPerfilWeb = (perfilData || []).map(p => {
            const meta = (p.ass_familias_meta && p.ass_familias_meta.length > 0) ? p.ass_familias_meta[0] : {};
            const rels = p.pessoas_relacionamentos || [];
            const membrosMap = rels.map(r => ({
                parentesco: r.tipo_relacao,
                pessoas: { nome_completo: r.pessoas?.nome_completo }
            }));
            return {
                id: p.id,
                nome_familia: p.nome_curto || p.nome_completo,
                codigo: meta.codigo || 'S/C',
                status: meta.status || 'Ativa',
                tipo: meta.tipo || 'Fixa/Assistida',
                responsavel: { nome_completo: p.nome_completo },
                ass_membros_familia: membrosMap,
                is_nova_plataforma: true
            };
        }).sort((a,b) => (a.nome_familia||'').localeCompare(b.nome_familia||''));

        window.renderListaFamiliasWeb();

    } catch(err) {
        console.error(err);
        container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Erro ao carregar famílias.</div>';
    }
}

window.renderListaFamiliasWeb = function() {
    const container = document.getElementById('famCadastroLista');
    const familias = window._currentWebTab === 'legado' ? window._familiasLegadoWeb : window._familiasPerfilWeb;
    
    if (!familias || familias.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">Nenhuma família cadastrada nesta aba.</div>';
        return;
    }

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
            ${familias.map(f => {
                const isGlobal = f.is_nova_plataforma;
                const editarFn = isGlobal ? `abrirModalMetaWeb('${f.id}', '${f.codigo}', '${f.status}', '${f.tipo}', '${f.nome_familia.replace(/'/g, "\\'")}')` : `editarFamiliaAss('${f.id}')`;
                
                return `
                <div style="background: var(--bg-body); border: 1px solid var(--border); border-radius: 8px; padding: 16px; position: relative;">
                    
                    <div style="position: absolute; top: 16px; right: 16px; display: flex; gap: 8px;">
                        <button onclick="${editarFn}" style="background:none; border:none; color: #60a5fa; cursor:pointer;" title="Editar">✏️</button>
                        ${!isGlobal ? `<button onclick="excluirFamiliaAss('${f.id}')" style="background:none; border:none; color: #ef4444; cursor:pointer;" title="Excluir">🗑️</button>` : ''}
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <h4 style="color: var(--primary); margin: 0; font-size: 16px;">${f.nome_familia} ${isGlobal ? '<span style="font-size:10px; background:#4ade80; color:#14532d; padding:2px 6px; border-radius:8px; margin-left:4px;">Global</span>' : ''}</h4>
                        <span style="background: #334155; color: #cbd5e1; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${f.codigo}</span>
                    </div>
                    
                    <div style="margin-bottom: 12px; font-size: 13px;">
                        <span style="color: var(--text-muted);">Responsável:</span> 
                        <span style="color: var(--text-main); font-weight: 500;">${f.responsavel?.nome_completo || 'Sem cadastro'}</span>
                    </div>
                    
                    <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                        <span style="background: ${f.tipo === 'Extra' ? 'rgba(234,179,8,0.1)' : 'rgba(16,185,129,0.1)'}; color: ${f.tipo === 'Extra' ? '#eab308' : '#10b981'}; padding: 2px 6px; border-radius: 4px; font-size: 11px;">
                            ${f.tipo}
                        </span>
                        <span style="background: ${f.status === 'Ativa' || f.status === 'Ativo' ? 'rgba(16,185,129,0.1)' : f.status === 'Triagem' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${f.status === 'Ativa' || f.status === 'Ativo' ? '#10b981' : f.status === 'Triagem' ? '#f59e0b' : '#ef4444'}; padding: 2px 6px; border-radius: 4px; font-size: 11px;">
                            ${f.status}
                        </span>
                    </div>

                    <div style="background: rgba(0,0,0,0.1); border-radius: 6px; padding: 12px;">
                        <h6 style="color: var(--text-muted); margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase;">Membros da Família (${f.ass_membros_familia?.length || 0}):</h6>
                        ${!f.ass_membros_familia || f.ass_membros_familia.length === 0 ? '<span style="font-size:12px; color:var(--text-muted);">Nenhum membro vinculado</span>' : 
                            f.ass_membros_familia.map(m => `
                                <div style="display: flex; justify-content: space-between; font-size: 12px; border-bottom: 1px dashed rgba(255,255,255,0.05); padding: 4px 0;">
                                    <span style="color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.pessoas?.nome_completo || 'Sem nome'}</span>
                                    <span style="color: var(--text-muted); padding-left: 8px;">${m.parentesco}</span>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            `;}).join('')}
        </div>
    `;
}
"""
js_content = re.sub(r'async function carregarListaFamilias\(\) \{.*?\}\n\nasync function carregarListaOcorrencias', new_carregar.strip() + '\n\nasync function carregarListaOcorrencias', js_content, flags=re.DOTALL)


# 4. Inject the Web Meta Modal & Functions at the end
web_meta_functions = """
window.abrirModalMetaWeb = function(pessoaId, codigo, status, tipo, nome) {
    let modal = document.getElementById('modalWebMeta');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalWebMeta';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:9999; display:flex; align-items:center; justify-content:center;';
        
        modal.innerHTML = `
            <div style="background:var(--bg-panel); border:1px solid var(--border); border-radius:12px; width:400px; padding:24px; box-shadow:0 10px 25px rgba(0,0,0,0.5);">
                <h3 style="margin:0 0 16px 0; color:var(--text-main);" id="wMetaTitle">Metadados da Família</h3>
                
                <input type="hidden" id="wMetaId">
                <div style="margin-bottom: 12px;">
                    <label style="display:block; font-size:13px; color:var(--text-muted); margin-bottom:4px;">Código</label>
                    <input type="text" id="wMetaCodigo" class="form-control" style="width:100%; padding:8px; border-radius:6px; background:var(--bg-body); color:white; border:1px solid var(--border);">
                </div>
                <div style="margin-bottom: 12px;">
                    <label style="display:block; font-size:13px; color:var(--text-muted); margin-bottom:4px;">Status</label>
                    <select id="wMetaStatus" class="form-control" style="width:100%; padding:8px; border-radius:6px; background:var(--bg-body); color:white; border:1px solid var(--border);">
                        <option value="Ativa">Ativa</option>
                        <option value="Inativa">Inativa</option>
                        <option value="Suspensa">Suspensa</option>
                    </select>
                </div>
                <div style="margin-bottom: 24px;">
                    <label style="display:block; font-size:13px; color:var(--text-muted); margin-bottom:4px;">Tipo</label>
                    <select id="wMetaTipo" class="form-control" style="width:100%; padding:8px; border-radius:6px; background:var(--bg-body); color:white; border:1px solid var(--border);">
                        <option value="Fixa/Assistida">Fixa/Assistida</option>
                        <option value="Temporária">Temporária</option>
                        <option value="Triagem">Triagem</option>
                    </select>
                </div>
                
                <div style="display:flex; justify-content:flex-end; gap:12px;">
                    <button onclick="document.getElementById('modalWebMeta').style.display='none'" class="btn btn-secondary">Cancelar</button>
                    <button onclick="salvarMetaWeb()" class="btn btn-primary" id="btnSalvarWebMeta">Salvar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    document.getElementById('wMetaTitle').innerText = 'Metadados: ' + nome;
    document.getElementById('wMetaId').value = pessoaId;
    document.getElementById('wMetaCodigo').value = codigo === 'S/C' ? '' : codigo;
    document.getElementById('wMetaStatus').value = status;
    document.getElementById('wMetaTipo').value = tipo;
    
    modal.style.display = 'flex';
};

window.salvarMetaWeb = async function() {
    const id = document.getElementById('wMetaId').value;
    const cod = document.getElementById('wMetaCodigo').value.trim();
    const status = document.getElementById('wMetaStatus').value;
    const tipo = document.getElementById('wMetaTipo').value;
    const btn = document.getElementById('btnSalvarWebMeta');
    
    btn.innerText = 'Salvando...';
    btn.disabled = true;
    
    try {
        const payload = { pessoa_id: id, codigo: cod, status: status, tipo: tipo };
        const { error } = await db.from('ass_familias_meta').upsert(payload, { onConflict: 'pessoa_id' });
        if (error) throw error;
        
        document.getElementById('modalWebMeta').style.display = 'none';
        carregarListaFamilias(); // Recarrega do banco
    } catch(e) {
        console.error(e);
        alert('Erro ao salvar metadados.');
    } finally {
        btn.innerText = 'Salvar';
        btn.disabled = false;
    }
};
"""
js_content = js_content + '\n\n' + web_meta_functions

with open('familias.js', 'w') as f:
    f.write(js_content)
