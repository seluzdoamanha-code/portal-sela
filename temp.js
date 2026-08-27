// ==========================================
// MÓDULO: FAMÍLIAS ASSISTIDAS
// ==========================================

window.carregarAppFamilias = async function() {
    const container = document.getElementById('containerApps');
    
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
            <div>
                <button onclick="carregarAppMiniApps()" class="btn btn-secondary" style="margin-bottom: 16px; font-size: 13px;">← Voltar aos Mini-Apps</button>
                <h2 style="color: var(--text-main); margin: 0; font-size: 24px;">Famílias Assistidas</h2>
                <p style="color: var(--text-muted); margin: 4px 0 0 0; font-size: 14px;">Acompanhamento Social e Diário de Ocorrências</p>
            </div>
        </div>

        <div style="background: var(--bg-panel); border-radius: 12px; border: 1px solid var(--border); overflow: hidden;">
            
            <!-- Menu Interno do App -->
            <div style="display: flex; gap: 8px; padding: 16px; border-bottom: 1px solid var(--border); overflow-x: auto; scrollbar-width: none;">
                <button onclick="mudarAbaFamilias('dashboard')" id="btnFamDashboard" class="btn" style="white-space: nowrap; border-radius: 8px;">📊 Dashboard</button>
                <button onclick="mudarAbaFamilias('cadastro')" id="btnFamCadastro" class="btn" style="white-space: nowrap; border-radius: 8px;">👨‍👩‍👧‍👦 Famílias</button>
                
                
                <button onclick="mudarAbaFamilias('ocorrencias')" id="btnFamOcorrencias" class="btn" style="white-space: nowrap; border-radius: 8px;">📋 Ocorrências</button>
            </div>

            <!-- Conteúdo das Abas -->
            <div style="padding: 24px; min-height: 400px;">
                
                <!-- Aba Dashboard -->
                <div id="famDashboard" class="fam-tab-content" style="display: none;">
                    <div id="famDashboardContainer">
                        <div style="text-align: center; color: var(--text-muted); padding: 40px;">
                            Carregando indicadores...
                        </div>
                    </div>
                </div>

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

                <!-- Aba Ocorrências -->
                <div id="famOcorrencias" class="fam-tab-content" style="display: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="color: var(--text-main); margin: 0;">Ocorrências e Acompanhamento</h3>
                        <button class="btn btn-primary" onclick="abrirModalNovaOcorrencia()" style="border-radius: 8px; font-weight: 500;">+ Registrar Ocorrência</button>
                    </div>
                    <div id="famOcorrenciasLista"></div>
                </div>

            </div>
        </div>
    `;

    // Inicializa na primeira aba
    window.mudarAbaFamilias('dashboard');
};


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

// Controle de abas internas
window.mudarAbaFamilias = function(aba) {
    const abas = ['dashboard', 'cadastro', 'ocorrencias'];
    
    abas.forEach(a => {
        // Esconder conteúdo
        const el = document.getElementById('fam' + a.charAt(0).toUpperCase() + a.slice(1));
        if (el) el.style.display = 'none';
        
        // Resetar botões
        const btn = document.getElementById('btnFam' + a.charAt(0).toUpperCase() + a.slice(1));
        if (btn) {
            btn.classList.remove('btn-primary');
            btn.style.fontWeight = 'normal';
            btn.style.color = 'var(--text-main)';
            btn.style.background = 'transparent';
        }
    });

    // Ativar a selecionada
    const elAtiva = document.getElementById('fam' + aba.charAt(0).toUpperCase() + aba.slice(1));
    if (elAtiva) elAtiva.style.display = 'block';

    const btnAtivo = document.getElementById('btnFam' + aba.charAt(0).toUpperCase() + aba.slice(1));
    if (btnAtivo) {
        btnAtivo.classList.add('btn-primary');
        btnAtivo.style.fontWeight = 'bold';
        btnAtivo.style.color = 'white';
        btnAtivo.style.background = 'var(--primary)';
    }

    // Disparar carregamento de dados conforme a aba
    if (aba === 'dashboard') carregarDashboardFamilias();
    if (aba === 'cadastro') carregarListaFamilias();
    if (aba === 'ocorrencias') carregarListaOcorrencias();
};

// ==========================================
// FUNÇÕES DE CARREGAMENTO (STUBS)
// ==========================================

async function carregarDashboardFamilias() {
    const container = document.getElementById('famDashboardContainer');
    container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">Carregando indicadores...</div>';
    
    try {
        // 1. Radar de Famílias
        const resFam = await db.from('ass_familias').select('id, tipo');
        if (resFam.error) throw resFam.error;
        
        const totalFamilias = resFam.data.length;
        const totalFixas = resFam.data.filter(f => f.tipo === 'Fixa/Assistida').length;
        const totalExtras = totalFamilias - totalFixas;
        
        // 2. Alerta Social (Ocorrências Graves nos últimos 30 dias)
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
        
        const resOco = await db.from('ass_ocorrencias')
            .select('tags')
            .gte('data_ocorrencia', trintaDiasAtras.toISOString().split('T')[0]);
            
        let alertasSociais = 0;
        if (resOco.data) {
            resOco.data.forEach(o => {
                if (o.tags && (o.tags.includes('Grave') || o.tags.includes('Atenção') || o.tags.includes('Alerta'))) {
                    alertasSociais++;
                }
            });
        }
        
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
                <!-- Radar de Famílias -->
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                        <div style="font-size: 32px;">👨‍👩‍👧‍👦</div>
                    </div>
                    <div style="font-size: 14px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 8px;">Famílias Assistidas Ativas</div>
                    <div style="font-size: 42px; font-weight: 700; color: var(--text-main); margin-bottom: 12px; line-height: 1;">${totalFamilias}</div>
                    
                    <div style="display: flex; gap: 16px; font-size: 13px; color: var(--text-muted);">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span style="width: 8px; height: 8px; border-radius: 50%; background: #3b82f6;"></span>
                            ${totalFixas} Fixas
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span style="width: 8px; height: 8px; border-radius: 50%; background: #a855f7;"></span>
                            ${totalExtras} Extras
                        </div>
                    </div>
                </div>

                <!-- Alerta Social -->
                <div style="background: var(--bg-panel); border: 1px solid ${alertasSociais > 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border)'}; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                        <div style="font-size: 32px;">${alertasSociais > 0 ? '🚨' : '✅'}</div>
                    </div>
                    <div style="font-size: 14px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 8px;">Alertas Sociais (30 Dias)</div>
                    <div style="font-size: 42px; font-weight: 700; color: ${alertasSociais > 0 ? '#ef4444' : 'var(--text-main)'}; margin-bottom: 12px; line-height: 1;">${alertasSociais}</div>
                    
                    <div style="font-size: 13px; color: var(--text-muted);">
                        ${alertasSociais > 0 
                            ? 'Ocorrências marcadas como Grave ou Atenção requerem acompanhamento da Diretoria.' 
                            : 'Nenhum alerta crítico registrado recentemente. Tudo sob controle.'}
                    </div>
                </div>
            </div>
        `;
        
    } catch (err) {
        console.error(err);
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: #ef4444;">Erro ao carregar dashboard.</div>';
    }
}

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
// Tentar carregar sem .contains se for dar erro
        let perfilData, err2;
        try {
            const result = await db.from('pessoas')
                .select('*, ass_familias_meta(id, codigo, status, tipo), pessoas_relacionamentos!pessoa_origem_id(tipo_relacao, pessoas!pessoa_destino_id(nome_completo))')
                .contains('perfis', ['Titular da Família']);
            perfilData = result.data;
            err2 = result.error;
        } catch(e) {
            err2 = e;
        }
        
        if (err2) {
            // Fallback: Busca manual se o operador falhar
            const resultAll = await db.from('pessoas')
                .select('*, ass_familias_meta(id, codigo, status, tipo), pessoas_relacionamentos!pessoa_origem_id(tipo_relacao, pessoas!pessoa_destino_id(nome_completo))');
            if (resultAll.error) throw resultAll.error;
            
            perfilData = (resultAll.data || []).filter(p => {
                const arr = Array.isArray(p.perfis) ? p.perfis : (typeof p.perfis === 'string' ? JSON.parse(p.perfis || '[]') : []);
                return arr.includes('Titular da Família');
            });
        }
        
        window._familiasPerfilWeb = (perfilData || []).map(p => {
            const meta = p.ass_familias_meta ? (Array.isArray(p.ass_familias_meta) ? (p.ass_familias_meta[0] || {}) : p.ass_familias_meta) : {};
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
        container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Erro ao carregar famílias: ' + (err.message || err.toString()) + '</div>';
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
                const editarFn = isGlobal ? `abrirModalMetaWeb('${f.id}', '${f.codigo}', '${f.status}', '${f.tipo}', '${f.nome_familia.replace(/'/g, "\'")}')` : `editarFamiliaAss('${f.id}')`;
                
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

async function carregarListaOcorrencias() {
    const container = document.getElementById('famOcorrenciasLista');
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">Carregando ocorrências...</div>';

    try {
        const { data, error } = await db.from('ass_ocorrencias')
            .select('*, ass_familias(nome_familia, codigo), pessoas(id, nome_completo, nome_curto, ass_familias_meta(codigo))')
            .order('data_ocorrencia', { ascending: false });
            
        if (error) throw error;

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h3 style="margin: 0; color: var(--text-main);">Livro de Ocorrências e Visitas</h3>
                <button class="btn btn-primary" onclick="abrirModalNovaOcorrencia()">📝 Registrar Ocorrência</button>
            </div>
            
            <div style="background: var(--bg-body); border: 1px solid var(--border); border-radius: 8px; padding: 16px;">
                ${(!data || data.length === 0) ? '<p style="color:var(--text-muted); font-size:13px; text-align: center; padding: 20px;">Nenhuma ocorrência registrada no sistema.</p>' : `
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); font-size: 12px;">
                                    <th style="padding: 8px 4px; width: 100px;">Data</th>
                                    <th style="padding: 8px 4px; width: 100px;">Cód.</th>
                                    <th style="padding: 8px 4px;">Família / Pessoa</th>
                                    <th style="padding: 8px 4px; width: 120px;">Tipo</th>
                                    <th style="padding: 8px 4px;">Observação</th>
                                    <th style="padding: 8px 4px; text-align: right; width: 80px;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map(o => {
                                    let corTipo = '#94a3b8'; // Default Normal
                                    if(o.tipo === 'Grave') corTipo = '#ef4444';
                                    if(o.tipo === 'Familiar') corTipo = '#8b5cf6';
                                    if(o.tipo === 'Entrega') corTipo = '#f59e0b';
                                    
                                    // Resolver nome e código
                                    let nomeExibicao = 'Família Removida';
                                    let isLegado = false;
                                    
                                    if (o.pessoa_id && o.pessoas) {
                                        const p = o.pessoas;
                                        const meta = p.ass_familias_meta ? (Array.isArray(p.ass_familias_meta) ? (p.ass_familias_meta[0] || {}) : p.ass_familias_meta) : {};
                                        const cod = meta.codigo || 'S/C';
                                        const n = p.nome_curto || p.nome_completo;
                                        nomeExibicao = `${cod} - ${n} <span style="font-size:10px; background:#4ade80; color:#14532d; padding:2px 6px; border-radius:8px;">Global</span>`;
                                    } else if (o.familia_id && o.ass_familias) {
                                        nomeExibicao = `${o.ass_familias.codigo} - ${o.ass_familias.nome_familia} <span style="font-size:10px; background:#64748b; color:white; padding:2px 6px; border-radius:8px;">Legado</span>`;
                                        isLegado = true;
                                    }
                                    
                                    return `
                                    <tr style="border-bottom: 1px solid var(--border); font-size: 13px;">
                                        <td style="padding: 12px 4px; color: var(--text-muted);">${o.data_ocorrencia.split('-').reverse().join('/')}</td>
                                        <td style="padding: 12px 4px; color: #60a5fa; font-weight: bold;">${o.codigo}</td>
                                        <td style="padding: 12px 4px; color: var(--text-main); font-weight: 500;">
                                            ${nomeExibicao}
                                        </td>
                                        <td style="padding: 12px 4px;">
                                            <span style="background: ${corTipo}20; color: ${corTipo}; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${o.tipo}</span>
                                        </td>
                                        <td style="padding: 12px 4px; color: var(--text-muted); max-width: 250px;">
                                            <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${o.observacao.replace(/"/g, '&quot;')}">${o.observacao}</div>
                                        </td>
                                        <td style="padding: 12px 4px; text-align: right;">
                                            <button onclick="excluirOcorrenciaAss('${o.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer;" title="Excluir Ocorrência">🗑️</button>
                                        </td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
        
        container.innerHTML = html;
        
    } catch (err) {
        console.error(err);
        container.innerHTML = '<div style="text-align: center; color: #ef4444; padding: 20px;">Erro ao carregar ocorrências.</div>';
    }
}
                                        </td>
