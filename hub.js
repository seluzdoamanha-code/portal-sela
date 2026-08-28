const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function parseDataLocal(val) {
    if (!val) return new Date();
    const str = String(val);
    if (str.length === 10 && str.indexOf('-') === 4) {
        return new Date(str + 'T12:00:00'); // Fuso horário seguro para forçar dia correto local
    }
    return new Date(val);
}

function obterDataPrecisa(dataStr, createdAtStr) {
    if (!dataStr) return new Date(createdAtStr);
    const createdLocal = new Date(createdAtStr);
    const tzOffset = createdLocal.getTimezoneOffset() * 60000;
    const localISO = new Date(createdLocal.getTime() - tzOffset).toISOString().split('T')[0];
    
    if (String(dataStr).startsWith(localISO)) {
        return new Date(createdAtStr); // Mesmo dia, usa precisão de minutos/segundos
    }
    return parseDataLocal(dataStr);
}

function formatarCelular(v) {
    if (!v) return '';
    v = v.replace(/\D/g, '');
    if (v.length <= 10) {
        return v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

function formatarCPF(v) {
    if (!v) return '';
    v = v.replace(/\D/g, '');
    if (v.length === 11) {
        return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return v;
}

function formatarCEP(v) {
    if (!v) return '';
    v = v.replace(/\D/g, '');
    if (v.length === 8) {
        return v.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return v;
}

function calcularIdade(dataStr) {
    if (!dataStr) return '';
    const hoje = new Date();
    const nasc = new Date(dataStr);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
}

const urlParams = new URLSearchParams(window.location.search);
const estruturaId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    if (!estruturaId) {
        alert("ID da estrutura não fornecido!");
        window.location.href = 'entidade.html';
        return;
    }

    await carregarDadosEstrutura();
    configurarAbas();

    // Iniciar Aba de Equipe
    await carregarEquipe();

    // Iniciar Aba de Documentos & Projetos
    await carregarProjetosProcessos();
    await carregarDocumentos();
    await popularSelectDepartamentos();

    // Formulario de Documentos
    document.getElementById('formDoc').addEventListener('submit', salvarDocumento);

    // Formulario Tesouraria
    const formTesouraria = document.getElementById('formTesourariaEnvio');
    if (formTesouraria) {
        formTesouraria.addEventListener('submit', salvarEnvioTesouraria);
    }

    // Formulario de Projetos
    const formProj = document.getElementById('formProjeto');
    if (formProj) formProj.addEventListener('submit', salvarProjeto);

    // Iniciar Aba de Agenda e Atividades Regulares
    await carregarAgenda();
    await carregarAtividadesRegulares();
    document.getElementById('formEvento').addEventListener('submit', salvarEvento);
});

async function carregarDadosEstrutura() {
    try {
        const { data, error } = await db.from('estruturas').select('*').eq('id', estruturaId).single();
        if (error) throw error;

        if (data) {
            document.getElementById('hubName').textContent = data.nome;
            document.getElementById('hubType').textContent = data.tipo;
            await inicializarBotaoFavorito();

            const nomeEstrutura = (data.nome || '').toLowerCase();
            const isIrradiacao = nomeEstrutura.includes('irradia') || nomeEstrutura.includes('sela');
            const isAssistencia = nomeEstrutura.includes('assist') && nomeEstrutura.includes('social');
            const isAtendimento = nomeEstrutura.includes('atendimento');
            const isBiblioteca = nomeEstrutura.includes('biblioteca');

            // Lógica de exibir Abas com base na configuração do DB
            let config = data.abas_config || {
                equipe: true, agenda: true, projetos: true, documentos: true,
                tesouraria: false,
                apps: isIrradiacao || isAssistencia || isAtendimento || isBiblioteca
            };

            if (isIrradiacao || isAssistencia || isAtendimento || isBiblioteca) {
                config.apps = true;
            }

            // Ocultar Abas desativadas
            if (!config.equipe) document.querySelector('[data-target="abaEquipe"]').style.display = 'none';
            if (!config.agenda) document.querySelector('[data-target="abaAgenda"]').style.display = 'none';
            if (!config.projetos) document.querySelector('[data-target="abaProjetosProcessos"]').style.display = 'none';
            if (!config.documentos) document.querySelector('[data-target="abaDocumentos"]').style.display = 'none';
            if (!config.tesouraria) {
                const btnTes = document.querySelector('[data-target="abaTesouraria"]');
                if (btnTes) btnTes.style.display = 'none';
            }

            if (config.apps) {
                const btnApps = document.querySelector('[data-target="abaApps"]');
                if (btnApps) btnApps.style.display = 'block';
                if (isIrradiacao || isAssistencia || isAtendimento || isBiblioteca) {
                    carregarAppMiniApps();
                }
            }

            // Renderizar a Página Inicial (Home)
            await carregarDadosHome(data);
        }
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('hubContent').style.display = 'block';
    } catch (err) {
        console.error("Erro ao carregar estrutura:", err);
        document.getElementById('loadingState').textContent = "Erro ao carregar dados. Verifique sua conexão.";
    }
}

async function carregarDadosHome(estData) {
    // 1. Apresentação / Descrição
    document.getElementById('homeDescricaoText').textContent = estData.descricao || 'Nenhuma descrição cadastrada ainda. Use o botão no topo para apresentar o departamento!';

    // Habilitar botão de edição para Admins
    const isAdmin = (typeof window.isAdmin === 'function' && window.isAdmin());
    const btnEdit = document.getElementById('btnEditarHome');
    if (btnEdit && isAdmin) {
        btnEdit.style.display = 'block';
    }

    // 2. Vínculos (Pai/Filho)
    const vinculosContainer = document.getElementById('homeVinculosContainer');
    if (vinculosContainer) {
        vinculosContainer.style.display = 'none';
        vinculosContainer.innerHTML = '';

        if (estData.tipo === 'Departamento' || estData.tipo === 'Colegiado' || estData.tipo === 'Colegiado Geral') {
            // Buscar setores/atividades filhas
            try {
                const { data: filhas } = await db.from('estruturas').select('id, nome, tipo').eq('parent_id', estData.id).order('nome');
                if (filhas && filhas.length > 0) {
                    vinculosContainer.style.display = 'flex';
                    let html = `<h3 style="margin-top: 0; color: var(--text-main); font-size: 14px; border-bottom: 1px solid var(--border); padding-bottom: 6px; margin-bottom: 12px;">🌱 Atividades e Setores Vinculados</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;">`;
                    filhas.forEach(sub => {
                        const icone = window.obterIconeEstrutura ? window.obterIconeEstrutura(sub.nome, sub.tipo) : '🏛️';
                        html += `
                            <a href="hub.html?id=${sub.id}" style="display: flex; align-items: center; gap: 12px; text-decoration: none; padding: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; color: var(--text-main); transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'; this.style.borderColor='var(--primary)';" onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.borderColor='var(--border)';">
                                <span style="font-size: 20px;">${icone}</span>
                                <div>
                                    <div style="font-weight: 600; font-size: 12px;">${sub.nome.toUpperCase()}</div>
                                    <div style="font-size: 10px; color: var(--text-muted);">${sub.tipo}</div>
                                </div>
                            </a>
                        `;
                    });
                    html += `</div>`;
                    vinculosContainer.innerHTML = html;
                }
            } catch (e) {
                console.error(e);
            }
        } else if (estData.parent_id) {
            // Buscar departamento pai
            try {
                const { data: pai } = await db.from('estruturas').select('id, nome, tipo').eq('id', estData.parent_id).single();
                if (pai) {
                    vinculosContainer.style.display = 'flex';
                    const icone = window.obterIconeEstrutura ? window.obterIconeEstrutura(pai.nome, pai.tipo) : '🏛️';
                    vinculosContainer.innerHTML = `
                        <h3 style="margin-top: 0; color: var(--text-main); font-size: 14px; border-bottom: 1px solid var(--border); padding-bottom: 6px; margin-bottom: 12px;">🏢 Departamento / Colegiado Responsável</h3>
                        <a href="hub.html?id=${pai.id}" style="display: flex; align-items: center; gap: 12px; text-decoration: none; padding: 10px; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; color: var(--text-main); transition: all 0.2s; width: max-content; min-width: 260px;" onmouseover="this.style.background='rgba(59, 130, 246, 0.1)';" onmouseout="this.style.background='rgba(59, 130, 246, 0.05)';">
                            <span style="font-size: 20px;">${icone}</span>
                            <div>
                                <div style="font-weight: 600; font-size: 12px; color: #3b82f6;">${pai.nome.toUpperCase()}</div>
                                <div style="font-size: 10px; color: var(--text-muted);">${pai.tipo}</div>
                            </div>
                        </a>
                    `;
                }
            } catch (e) {
                console.error(e);
            }
        }
    }

    // 3. Atalhos de Mini-Apps
    const appsGrid = document.getElementById('homeAppsGrid');
    if (appsGrid) {
        appsGrid.innerHTML = '';
        const config = estData.abas_config || {};
        const nomeEstrutura = (estData.nome || '').toLowerCase();
        const isIrradiacao = nomeEstrutura.includes('irradia') || nomeEstrutura.includes('sela');
        const isAssistencia = nomeEstrutura.includes('assist') && nomeEstrutura.includes('social');
        const isAtendimento = nomeEstrutura.includes('atendimento');
        const isBiblioteca = nomeEstrutura.includes('biblioteca');

        let hasApps = false;

        if (isAtendimento && config.apps) {
            hasApps = true;
            appsGrid.innerHTML += `
                <div class="card-agenda" style="background: rgba(245, 158, 11, 0.02); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="font-weight: 600; color: #f59e0b; font-size: 14px; margin-bottom: 6px;">🤝 ATENDIMENTOS ESPIRITUAIS</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px; line-height: 1.4;">Gestão de Atendimento Fraterno e Tratamentos Fluídicos e Espiritual.</div>
                    </div>
                    <button class="btn" onclick="mudarAbaAtalho('abaApps')" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 12px; padding: 6px 12px;">Abrir Painel ➔</button>
                </div>
            `;
        }
        if (isIrradiacao && config.apps) {
            hasApps = true;
            appsGrid.innerHTML += `
                <div class="card-agenda" style="background: rgba(16, 185, 129, 0.02); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="font-weight: 600; color: #10b981; font-size: 14px; margin-bottom: 6px;">🌊 IRRADIAÇÃO ESPIRITUAL</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px; line-height: 1.4;">Lançamento de leituras semanais, registro de vibrações à distância e acompanhamento de estatísticas.</div>
                    </div>
                    <button class="btn" onclick="mudarAbaAtalho('abaApps')" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 12px; padding: 6px 12px;">Abrir Painel ➔</button>
                </div>
            `;
        }
        if (isAssistencia && config.apps) {
            hasApps = true;
            appsGrid.innerHTML += `
                <div class="card-agenda" style="background: rgba(96, 165, 250, 0.02); border: 1px solid rgba(96, 165, 250, 0.2); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="font-weight: 600; color: #60a5fa; font-size: 14px; margin-bottom: 6px;">🧺 ASSISTÊNCIA SOCIAL</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px; line-height: 1.4;">Cadastro socioeconômico de famílias assistidas, registros de entregas e mapas de visitas mensais.</div>
                    </div>
                    <button class="btn" onclick="mudarAbaAtalho('abaApps')" style="background: rgba(96, 165, 250, 0.1); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.3); font-size: 12px; padding: 6px 12px;">Abrir Painel ➔</button>
                </div>
            `;
        }
        if (isBiblioteca && config.apps) {
            hasApps = true;
            appsGrid.innerHTML += `
                <div class="card-agenda" style="background: rgba(139, 92, 246, 0.02); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="font-weight: 600; color: #8b5cf6; font-size: 14px; margin-bottom: 6px;">📚 BIBLIOTECA</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px; line-height: 1.4;">Consulta e catalogação de acervo literário, controle de empréstimos ativos e históricos de leituras.</div>
                    </div>
                    <button class="btn" onclick="mudarAbaAtalho('abaApps')" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.3); font-size: 12px; padding: 6px 12px;">Abrir Painel ➔</button>
                </div>
            `;
        }

        if (!hasApps) {
            appsGrid.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; font-style: italic; padding: 12px 0;">Este setor não possui ferramentas ativas no momento.</div>';
        }
    }

    // 4. Links Úteis
    const linksContainer = document.getElementById('homeLinksRapidosList');
    if (linksContainer) {
        linksContainer.innerHTML = '';
        const links = estData.links_rapidos || [];
        if (links.length === 0) {
            linksContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 12px; font-style: italic;">Nenhum recurso cadastrado.</div>';
        } else {
            links.forEach(lnk => {
                linksContainer.innerHTML += `
                    <a href="${lnk.url}" target="_blank" style="display: flex; align-items: center; gap: 8px; color: #3b82f6; text-decoration: none; font-size: 13px; font-weight: 500; padding: 4px 0;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
                        🔗 ${lnk.rotulo}
                    </a>
                `;
            });
        }
    }

    // 5. Atividades Principais (Rotinas)
    const atRegContainer = document.getElementById('homeAtividadesPrincipaisList');
    if (atRegContainer) {
        atRegContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 12px;">Carregando...</div>';
        try {
            const { data } = await db.from('atividades_regulares').select('*').eq('estrutura_id', estruturaId).order('titulo').limit(3);
            if (!data || data.length === 0) {
                atRegContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 12px; font-style: italic;">Nenhuma rotina cadastrada.</div>';
            } else {
                atRegContainer.innerHTML = '';
                data.forEach(at => {
                    let linkTarget = '';
                    if (at.link_estrutura_id) {
                        linkTarget = ` <a href="hub.html?id=${at.link_estrutura_id}" style="color:#10b981; font-size:11px; text-decoration:none; font-weight:bold;">(Hub ➔)</a>`;
                    }
                    atRegContainer.innerHTML += `
                        <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 6px; padding: 10px;">
                            <div style="font-weight: 600; font-size: 12px; color: var(--text-main);">${at.titulo.toUpperCase()}${linkTarget}</div>
                            <div style="font-size: 11px; color: var(--primary); margin-top: 2px;">📅 ${at.dia_semana} às ${at.horario}</div>
                        </div>
                    `;
                });
            }
        } catch (e) {
            console.error("Erro ao carregar rotinas:", e);
            atRegContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 12px;">Erro ao carregar rotinas.</div>';
        }
    }
}

window.mudarAbaAtalho = function (targetId) {
    const btn = document.querySelector(`[data-target="${targetId}"]`);
    if (btn) btn.click();
};

window.abrirModalEditarHome = async function () {
    const select = document.getElementById('editHomeParentId');
    if (select) {
        select.innerHTML = '<option value="">-- Nenhum --</option>';
        try {
            const { data } = await db.from('estruturas').select('id, nome').neq('id', estruturaId).order('nome');
            if (data) {
                data.forEach(e => {
                    select.innerHTML += `<option value="${e.id}">${e.nome}</option>`;
                });
            }
        } catch (e) {
            console.error("Erro ao carregar estruturas pai:", e);
        }
    }

    try {
        const { data } = await db.from('estruturas').select('*').eq('id', estruturaId).single();
        if (data) {
            document.getElementById('editHomeDescricao').value = data.descricao || '';
            if (select) select.value = data.parent_id || '';

            const links = data.links_rapidos || [];
            const textLines = links.map(l => `${l.rotulo} | ${l.url}`);
            document.getElementById('editHomeLinksText').value = textLines.join('\n');
        }
    } catch (e) {
        console.error("Erro ao carregar informacoes da Home para edicao:", e);
    }

    document.getElementById('modalEditarHome').style.display = 'flex';
};

window.fecharModalEditarHome = function () {
    document.getElementById('modalEditarHome').style.display = 'none';
};

window.salvarInformacoesHome = async function (event) {
    event.preventDefault();
    const btn = document.getElementById('btnSaveHomeInfo');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    const descricao = document.getElementById('editHomeDescricao').value;
    const parentId = document.getElementById('editHomeParentId').value || null;
    const textLinks = document.getElementById('editHomeLinksText').value;

    const lines = textLinks.split('\n');
    const links = [];
    lines.forEach(l => {
        const parts = l.split('|');
        if (parts.length >= 2) {
            links.push({ rotulo: parts[0].trim(), url: parts[1].trim() });
        }
    });

    try {
        const { error } = await db.from('estruturas').update({
            descricao: descricao,
            parent_id: parentId,
            links_rapidos: links
        }).eq('id', estruturaId);

        if (error) throw error;

        fecharModalEditarHome();
        await carregarDadosEstrutura();
    } catch (e) {
        console.error("Erro ao salvar informacoes da Home:", e);
        alert("Erro ao salvar informacoes da Home: " + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Informacoes';
    }
};

let isFavoritoHubGlobal = false;

async function inicializarBotaoFavorito() {
    const btn = document.getElementById('btnFavoritarHub');
    if (!btn) return;

    try {
        const { data: { session } } = await db.auth.getSession();
        const userEmail = session?.user?.email;
        if (!userEmail) return;

        const { data, error } = await db
            .from('usuario_atalhos')
            .select('*')
            .eq('email', userEmail)
            .eq('estrutura_id', estruturaId)
            .maybeSingle();

        if (error) throw error;

        isFavoritoHubGlobal = !!data;
        btn.textContent = isFavoritoHubGlobal ? '⭐' : '☆';

        btn.onclick = async () => {
            btn.style.pointerEvents = 'none';
            try {
                if (isFavoritoHubGlobal) {
                    const { error: delErr } = await db
                        .from('usuario_atalhos')
                        .delete()
                        .eq('email', userEmail)
                        .eq('estrutura_id', estruturaId);
                    if (delErr) throw delErr;
                    isFavoritoHubGlobal = false;
                } else {
                    const { error: insErr } = await db
                        .from('usuario_atalhos')
                        .insert([{ email: userEmail, estrutura_id: estruturaId }]);
                    if (insErr) throw insErr;
                    isFavoritoHubGlobal = true;
                }
                btn.textContent = isFavoritoHubGlobal ? '⭐' : '☆';

                if (typeof window.carregarAtalhosDinamicos === 'function') {
                    await window.carregarAtalhosDinamicos();
                }
            } catch (err) {
                console.error("Erro ao alternar favorito no Hub:", err);
            } finally {
                btn.style.pointerEvents = 'auto';
            }
        };
    } catch (err) {
        console.error("Erro ao inicializar favorito no Hub:", err);
    }
}

// ==========================================
// MÓDULO DE EQUIPE
// ==========================================
async function carregarEquipe() {
    try {
        let tagsLideranca = ['diretor', 'diretora', 'diretoria', 'direção', 'direcao', 'líder', 'lider', 'coordenador', 'coordenadora', 'gerente', 'presidente', 'presidenta'];
        try {
            const { data } = await db.from('configuracoes').select('valor').eq('chave', 'tags_lideranca').single();
            if (data && data.valor) {
                tagsLideranca = data.valor.split(',').map(s => s.trim().toLowerCase()).filter(s => s !== '');
            }
        } catch (e) { }

        const { data, error } = await db
            .from('vinculos_estrutura')
            .select(`
                perfil,
                pessoas (nome_completo, perfis, celular, email)
            `)
            .eq('estrutura_id', estruturaId);

        if (error) throw error;

        const gridLideranca = document.getElementById('gridLideranca');
        const gridMembros = document.getElementById('gridMembros');
        const status = document.getElementById('equipeStatus');

        
        let isLider = false;
        if (window.isAdminGlobal && window.isAdminGlobal()) {
            isLider = true;
        } else if (data) {
            
    const selResponde = document.getElementById('hubEqRespondeA');
    if (selResponde) {
        selResponde.innerHTML = '<option value="">Ninguém (Nó Principal)</option>';
        data.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = v.pessoas ? (v.pessoas.nome_curto || v.pessoas.nome_completo) : 'Desconhecido';
            selResponde.appendChild(opt);
        });
    }

    data.forEach(v => {
                if (v.pessoas && v.pessoas.email === userEmail) {
                    const p = (v.perfil || '').toLowerCase();
                    if (tagsLideranca.some(t => p.includes(t))) isLider = true;
                }
            });
        }
        
        const btnGerenciar = document.getElementById('btnHubGerenciarEquipe');
        if (btnGerenciar) {
            btnGerenciar.style.display = isLider ? 'block' : 'none';
        }

        if (!data || data.length === 0) {
            status.textContent = 'Nenhum membro vinculado a este departamento.';
            return;
        }

        const tituloGestao = document.getElementById('tituloGestaoPessoas');
        if (tituloGestao) {
            tituloGestao.textContent = `Gestão de Pessoas (${data.length})`;
        }

        status.textContent = `${data.length} membro(s) na equipe.`;

        let htmlLider = '';
        let htmlMembro = '';

        data.forEach(rel => {
            const pessoa = rel.pessoas;
            if (!pessoa) return;

            const isLider = rel.perfil && tagsLideranca.some(tag => rel.perfil.toLowerCase().includes(tag));

            // Format phone if it exists
            let telefone = '';
            if (pessoa.celular) {
                const zap = pessoa.celular.replace(/\D/g, '');
                telefone = `<div style="font-size: 11px; margin-top: 4px; color: var(--text-muted);"><a href="https://wa.me/55${zap}" target="_blank" style="color: inherit; text-decoration: none;" title="Abrir WhatsApp">📱 ${formatarCelular(pessoa.celular)}</a></div>`;
            }

            let emailIcon = '';
            if (pessoa.email) {
                emailIcon = `<div style="font-size: 11px; margin-top: 2px; color: var(--text-muted);"><a href="mailto:${pessoa.email}" style="color: inherit; text-decoration: none;" title="Enviar E-mail">✉️ ${pessoa.email}</a></div>`;
            }

            const cardHtml = `
            <div style="background: var(--bg-panel); border: 1px solid ${isLider ? 'var(--primary)' : 'var(--border)'}; border-radius: 8px; padding: 16px; display: flex; flex-direction: column;">
                <div style="font-size: 15px; font-weight: 600; color: var(--text-main);">${pessoa.nome_completo}</div>
                <div style="font-size: 13px; color: var(--primary); margin-top: 4px; font-weight: 500;">${rel.perfil || 'Membro'}</div>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
                    ${telefone}
                    ${emailIcon}
                </div>
                ${pessoa.perfis && pessoa.perfis.length > 0 ?
                    `<div style="margin-top: 12px; display: flex; gap: 4px; flex-wrap: wrap;">
                        ${pessoa.perfis.map(t => `<span style="background: rgba(129, 140, 248, 0.1); color: #818cf8; padding: 2px 8px; border-radius: 12px; font-size: 10px; white-space: nowrap;">${t}</span>`).join('')}
                    </div>`
                    : ''}
            </div>
            `;

            if (isLider) htmlLider += cardHtml;
            else htmlMembro += cardHtml;
        });

        if (htmlLider) {
            document.getElementById('containerLideranca').style.display = 'block';
            gridLideranca.innerHTML = htmlLider;
        }

        if (htmlMembro) {
            document.getElementById('containerMembros').style.display = 'block';
            gridMembros.innerHTML = htmlMembro;
        }

    } catch (err) {
        console.error("Erro ao carregar equipe:", err);
        document.getElementById('equipeStatus').textContent = "Erro: " + (err.message || "Falha ao buscar membros no banco de dados.");
    }
}

function configurarAbas() {
    const botoes = document.querySelectorAll('.tab-btn');
    const conteudos = document.querySelectorAll('.tab-content');

    botoes.forEach(btn => {
        btn.addEventListener('click', () => {
            botoes.forEach(b => b.classList.remove('active'));
            conteudos.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // No celular, recolhe o menu após clicar em uma aba
            const tabsNav = document.querySelector('.tabs-nav');
            if (tabsNav) {
                tabsNav.classList.remove('show-mobile');
            }
        });
    });

    // Auto-navegar para aba passada na URL (?id=XXX&tab=abaApps)
    const urlTab = urlParams.get('tab');
    if (urlTab) {
        // Usamos um timeout curto para garantir que outras manipulações (como carregarDadosEstrutura) já renderizaram o botão
        setTimeout(() => {
            const btn = document.querySelector(`[data-target="${urlTab}"]`);
            if (btn && btn.style.display !== 'none') {
                btn.click();
            }
        }, 300);
    }
}

// Assumir o controle do Menu Hambúrguer (Mobile)
window.onMobileMenuClick = () => {
    const tabsNav = document.querySelector('.tabs-nav');
    if (tabsNav) {
        tabsNav.classList.toggle('show-mobile');
    }
};

window.abrirOrganograma = function () {
    window.location.href = `organograma.html?id=${estruturaId}`;
};

// ==========================================
// MÓDULO DE DOCUMENTOS
// ==========================================
let documentosGlobais = [];

window.abrirModalDoc = (id = null) => {
    const modal = document.getElementById('modalDoc');
    document.getElementById('formDoc').reset();
    document.getElementById('inDocId').value = '';

    // Popular o select de Projetos
    const selectProj = document.getElementById('inDocProjetoId');
    if (selectProj && typeof projetosGlobais !== 'undefined') {
        selectProj.innerHTML = '<option value="">-- Solto (Nenhum Projeto) --</option>';
        projetosGlobais.forEach(p => {
            selectProj.innerHTML += `<option value="${p.id}">${p.tipo}: ${p.titulo}</option>`;
        });
    }

    if (id) {
        const doc = documentosGlobais.find(d => d.id === id);
        if (doc) {
            document.getElementById('modalDocTitle').textContent = 'Editar Documento';
            document.getElementById('inDocId').value = doc.id;
            document.getElementById('inDocTitulo').value = doc.titulo;
            document.getElementById('inDocTipo').value = doc.tipo;
            if (selectProj && doc.projeto_processo_id) {
                selectProj.value = doc.projeto_processo_id;
            }
            if (doc.tipo === 'Link') {
                document.getElementById('inDocLink').value = doc.conteudo;
            } else {
                document.getElementById('inDocMd').value = doc.conteudo;
            }
        }
    } else {
        document.getElementById('modalDocTitle').textContent = 'Adicionar Documento';
    }

    window.toggleDocType();
    modal.classList.add('show');
};

window.fecharModalDoc = () => {
    document.getElementById('modalDoc').classList.remove('show');
};

async function carregarDocumentos() {
    const listLocais = document.getElementById('listDocsLocais');
    const listOficiais = document.getElementById('listDocsOficiais');

    listLocais.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Carregando...</div>';
    listOficiais.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Carregando...</div>';

    try {
        // 1. Buscar Documentos Locais (Dono é a estrutura atual)
        const { data: locais, error: errLocais } = await db
            .from('documentos')
            .select('*')
            .eq('estrutura_id', estruturaId);

        // 2. Buscar Documentos Herdados (A estrutura atual está na tabela de visibilidade)
        const { data: visibilidade, error: errVis } = await db
            .from('documentos_visibilidade')
            .select('documento_id')
            .eq('estrutura_id', estruturaId);

        let herdados = [];
        if (visibilidade && visibilidade.length > 0) {
            const docIds = visibilidade.map(v => v.documento_id);
            const { data: herdadosData } = await db
                .from('documentos')
                .select('*, estruturas(nome)') // traz o nome de quem criou
                .in('id', docIds);
            herdados = herdadosData || [];
        }

        // Filtra para exibir na aba Documentos Gerais apenas os que não tem projeto
        const locaisSoltos = (locais || []).filter(d => !d.projeto_processo_id);
        const herdadosSoltos = herdados.filter(d => !d.projeto_processo_id);

        documentosGlobais = locais || []; // Mantemos todos globais para os Projetos poderem acessá-los
        renderizarDocumentos(locaisSoltos, listLocais, true);
        renderizarDocumentos(herdadosSoltos, listOficiais, false);

    } catch (err) {
        console.warn("Erro ao buscar documentos. Tabelas criadas?", err);
        listLocais.innerHTML = '<div style="color: #ef4444; font-size: 13px;">⚠️ Erro: As tabelas de documentos não foram criadas no Supabase.</div>';
        listOficiais.innerHTML = '';
    }
}

function renderizarDocumentos(docs, container, isLocal) {
    if (!docs || docs.length === 0) {
        container.innerHTML = `<div style="color: var(--text-muted); font-size: 13px;">Nenhum documento encontrado.</div>`;
        return;
    }

    let html = '';
    docs.forEach(doc => {
        const icon = doc.tipo === 'Link' ? '🔗' : '📝';
        const dono = isLocal ? 'Criado por nós' : `📌 Oficial de: ${doc.estruturas?.nome || 'Instância Superior'}`;

        let actionBtn = '';
        if (doc.tipo === 'Link') {
            actionBtn = `<a href="${doc.conteudo}" target="_blank" class="btn btn-primary" style="padding: 4px 8px; font-size: 12px; text-decoration: none;">Abrir Link &nearr;</a>`;
        } else {
            // Encode the markdown content to safely pass it in onclick
            const encodedContent = encodeURIComponent(doc.conteudo || '').replace(/'/g, "%27");
            const encodedTitle = encodeURIComponent(doc.titulo || '').replace(/'/g, "%27");
            actionBtn = `<button class="btn btn-primary" style="padding: 4px 8px; font-size: 12px;" onclick="abrirViewerMarkdown('${encodedTitle}', '${encodedContent}')">Ler Conteúdo</button>`;
        }

        let editBtn = '';
        let deleteBtn = '';
        if (isLocal) {
            editBtn = `<button onclick="abrirModalDoc('${doc.id}')" style="background: none; border: none; color: #60a5fa; cursor: pointer; font-size: 16px; padding: 4px;" title="Editar Documento">✏️</button>`;
            deleteBtn = `<button onclick="excluirDocumento('${doc.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 16px; padding: 4px;" title="Excluir Documento">🗑️</button>`;
        }

        html += `
            <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="font-size: 16px; font-weight: 600; color: var(--text-main);">${icon} ${doc.titulo}</div>
                    <div style="display: flex; gap: 8px;">
                        ${editBtn}
                        ${deleteBtn}
                    </div>
                </div>
                <div style="font-size: 12px; color: var(--text-muted);">${dono}</div>
            <div style="margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end;">
                ${actionBtn}
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
}

// Removido declaração duplicada de abrirModalDoc e fecharModalDoc

window.toggleDocType = function () {
    const tipo = document.getElementById('inDocTipo').value;
    if (tipo === 'Link') {
        document.getElementById('groupDocLink').style.display = 'block';
        document.getElementById('inDocLink').required = true;
        document.getElementById('groupDocMd').style.display = 'none';
        document.getElementById('inDocMd').required = false;
    } else {
        document.getElementById('groupDocLink').style.display = 'none';
        document.getElementById('inDocLink').required = false;
        document.getElementById('groupDocMd').style.display = 'block';
        document.getElementById('inDocMd').required = true;
    }
};

async function popularSelectDepartamentos() {
    const container = document.getElementById('checkDepartamentos');
    try {
        const { data, error } = await db.from('estruturas').select('id, nome').neq('id', estruturaId).order('nome');
        if (data) {
            let html = '';
            data.forEach(d => {
                html += `
                <label style="display: flex; align-items: center; gap: 8px; color: var(--text-main); cursor: pointer;">
                    <input type="checkbox" class="chk-dept" value="${d.id}" style="width: auto;"> ${d.nome}
                </label>
                `;
            });
            container.innerHTML = html;
        }
    } catch (e) {
        container.innerHTML = '<span style="color: #ef4444;">Erro ao carregar</span>';
    }
}

async function salvarEnvioTesouraria(e) {
    e.preventDefault();

    const btnSubmit = document.getElementById('btnTesourariaSubmit');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Enviando...';

    try {
        const descricao = document.getElementById('tesourariaDescricao').value;
        const fileInput = document.getElementById('tesourariaArquivo');
        let arquivoUrl = null;

        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `tesouraria/${fileName}`;

            const { error: uploadError } = await db.storage
                .from('documentos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = db.storage.from('documentos').getPublicUrl(filePath);
            arquivoUrl = publicUrlData.publicUrl;
        }

        const { data: sessionData } = await db.auth.getSession();
        let remetenteNome = 'Desconhecido';
        if (sessionData?.session?.user) {
            remetenteNome = sessionData.session.user.user_metadata?.full_name || sessionData.session.user.email || 'Desconhecido';
        }

        const { error: dbError } = await db.from('app_tesouraria_envios').insert([{
            descricao: descricao,
            arquivo_url: arquivoUrl,
            remetente_nome: remetenteNome,
            status: 'pendente',
            estrutura_origem_id: estruturaId
        }]);

        if (dbError) throw dbError;

        alert('Enviado com sucesso para a Tesouraria!');
        document.getElementById('formTesourariaEnvio').reset();
    } catch (error) {
        console.error('Erro ao enviar para tesouraria:', error);
        alert('Erro ao enviar. Verifique o console.');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Enviar para Tesouraria';
    }
}

async function salvarDocumento(e) {
    e.preventDefault();

    const btnSave = document.getElementById('btnSaveDoc');
    btnSave.disabled = true;
    btnSave.textContent = 'Salvando...';

    const docId = document.getElementById('inDocId').value;
    const titulo = document.getElementById('inDocTitulo').value;
    const tipo = document.getElementById('inDocTipo').value;
    const projetoId = document.getElementById('inDocProjetoId').value || null;

    let conteudo = '';
    if (tipo === 'Link') {
        conteudo = document.getElementById('inDocLink').value;
    } else {
        conteudo = document.getElementById('inDocMd').value;
    }

    try {
        let savedDocId = null;

        if (docId) {
            // Atualizar
            const { error } = await db.from('documentos').update({
                titulo: titulo,
                tipo: tipo,
                conteudo: conteudo,
                projeto_processo_id: projetoId
            }).eq('id', docId);
            if (error) throw error;
            savedDocId = docId;
        } else {
            // Inserir
            const { data: newDoc, error } = await db.from('documentos').insert([{
                estrutura_id: estruturaId,
                titulo: titulo,
                tipo: tipo,
                conteudo: conteudo,
                projeto_processo_id: projetoId
            }]).select();

            if (error) throw error;
            if (newDoc && newDoc.length > 0) {
                savedDocId = newDoc[0].id;
            }
        }

        // Tratar Visibilidade (Herança)
        const checkDepartamentos = document.getElementById('checkDepartamentos');
        if (checkDepartamentos) {
            const checks = checkDepartamentos.querySelectorAll('.chk-dept:checked');

            if (docId) {
                // Deletar visibilidade antiga
                await db.from('documentos_visibilidade').delete().eq('documento_id', savedDocId);
            }

            if (checks.length > 0 && savedDocId) {
                const inserts = Array.from(checks).map(chk => ({
                    documento_id: savedDocId,
                    estrutura_id: chk.value
                }));
                const { error: visError } = await db.from('documentos_visibilidade').insert(inserts);
                if (visError) console.warn("Erro ao vincular visibilidade:", visError);
            }
        }

        fecharModalDoc();
        await carregarDocumentos();
        if (typeof carregarProjetosProcessos === 'function') await carregarProjetosProcessos(); // refresh pra mostrar no projeto
    } catch (err) {
        console.error("Erro ao salvar documento:", err);
        alert("Erro ao salvar documento. Detalhes no console.");
    } finally {
        btnSave.disabled = false;
        btnSave.textContent = 'Salvar Documento';
    }
}

window.excluirDocumento = async function (id) {
    const { isConfirmed } = await Swal.fire({
        title: 'Excluir documento?',
        text: 'Os departamentos que o herdaram também perderão o acesso.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Sim, excluir'
    });
    if (!isConfirmed) return;

    try {
        // O Supabase (Cascade Delete) ou a exclusao direta da visibilidade primeiro
        await db.from('documentos_visibilidade').delete().eq('documento_id', id);
        const { error } = await db.from('documentos').delete().eq('id', id);

        if (error) throw error;
        await carregarDocumentos();
    } catch (err) {
        console.error("Erro ao excluir", err);
        alert("Erro ao excluir.");
    }
};

// ==========================================
// RENDERIZADOR MARKDOWN
// ==========================================
window.abrirViewerMarkdown = function (encodedTitle, encodedContent) {
    const titulo = decodeURIComponent(encodedTitle);
    const conteudo = decodeURIComponent(encodedContent);

    document.getElementById('viewerTitle').textContent = titulo;

    // Converte o Markdown cru para HTML usando Marked.js
    const htmlConvertido = marked.parse(conteudo);
    document.getElementById('viewerContent').innerHTML = htmlConvertido;

    document.getElementById('modalViewer').style.display = 'flex';
};

window.fecharViewer = function () {
    document.getElementById('modalViewer').style.display = 'none';
    document.getElementById('viewerContent').innerHTML = '';
};

// ==========================================
// MÓDULO DE AGENDA
// ==========================================

async function carregarAgenda() {
    const listAgenda = document.getElementById('listAgenda');
    listAgenda.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Carregando...</div>';

    try {
        const hojeIso = new Date().toISOString();

        // Buscar eventos locais e globais futuros
        const { data: eventos, error } = await db
            .from('agenda')
            .select('*, estruturas(nome)')
            .or(`estrutura_id.eq.${estruturaId},visibilidade.eq.Global`)
            .gte('data_hora_inicio', hojeIso)
            .order('data_hora_inicio', { ascending: true });

        if (error) throw error;

        if (!eventos || eventos.length === 0) {
            listAgenda.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Nenhum evento agendado.</div>';
            return;
        }

        let html = '';
        eventos.forEach(ev => {
            const dataInicio = new Date(ev.data_hora_inicio);
            const dataFim = ev.data_hora_fim ? new Date(ev.data_hora_fim) : null;

            const dataFormatada = dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
            const horaFormatada = dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            const isGlobal = ev.visibilidade === 'Global';
            const badgeGloblal = isGlobal ? `<span style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-left: 8px; white-space: nowrap;">GLOBAL</span>` : '';
            const organizador = isGlobal && ev.estruturas ? `Organizado por: ${ev.estruturas.nome}` : '';

            // Gerar Link Google Calendar (Formato: YYYYMMDDTHHMMSSZ)
            const gcalInicio = dataInicio.toISOString().split('.')[0].replace(/[-:]/g, "") + "Z";
            let gcalFim = gcalInicio;
            if (dataFim) {
                gcalFim = dataFim.toISOString().split('.')[0].replace(/[-:]/g, "") + "Z";
            } else {
                // +1 hora por padrão
                const tempFim = new Date(dataInicio.getTime() + 60 * 60 * 1000);
                gcalFim = tempFim.toISOString().split('.')[0].replace(/[-:]/g, "") + "Z";
            }
            const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.titulo)}&dates=${gcalInicio}/${gcalFim}&details=${encodeURIComponent(ev.descricao || '')}&location=${encodeURIComponent(ev.local || '')}`;

            // Gerar conteudo ICS
            const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${gcalInicio}
DTEND:${gcalFim}
SUMMARY:${ev.titulo}
DESCRIPTION:${ev.descricao || ''}
LOCATION:${ev.local || ''}
END:VEVENT
END:VCALENDAR`;

            const icsEncoded = encodeURIComponent(icsContent);

            html += `
            <div style="background: var(--bg-panel); border: 1px solid ${isGlobal ? '#ef4444' : 'var(--border)'}; border-radius: 8px; padding: 16px; display: flex; gap: 16px; position: relative;">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 8px; min-width: 60px;">
                    <div style="font-size: 14px; color: var(--primary); font-weight: bold;">${dataFormatada.split(' de ')[0]}</div>
                    <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">${dataFormatada.split(' de ')[1] || ''}</div>
                </div>
                <div style="flex: 1; padding-right: 24px;">
                    <div style="font-size: 16px; font-weight: 600; color: var(--text-main);">${ev.titulo} ${badgeGloblal}</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">⏰ ${horaFormatada} ${ev.local ? `| 📍 ${ev.local}` : ''}</div>
                    ${ev.descricao ? `<div style="font-size: 13px; color: var(--text-muted); margin-top: 8px; line-height: 1.4;">${ev.descricao}</div>` : ''}
                    ${organizador ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 8px;">${organizador}</div>` : ''}
                    
                    <div style="margin-top: 12px; display: flex; gap: 8px;">
                        <a href="${gcalUrl}" target="_blank" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px; text-decoration: none;">+ Google Agenda</a>
                        <a href="data:text/calendar;charset=utf8,${icsEncoded}" download="${ev.titulo.replace(/\s+/g, '_')}.ics" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px; text-decoration: none;">+ Apple/Outlook (.ics)</a>
                    </div>
                </div>
                <button onclick="excluirEventoAgenda('${ev.id}')" style="position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 14px; cursor: pointer; color: var(--text-muted);" title="Excluir Evento">🗑️</button>
            </div>
            `;
        });

        listAgenda.innerHTML = html;
    } catch (err) {
        console.warn("Erro ao carregar agenda", err);
        listAgenda.innerHTML = '<div style="color: #ef4444; font-size: 13px;">⚠️ Erro: Tabela agenda não encontrada.</div>';
    }
}

window.abrirModalEvento = function () {
    document.getElementById('formEvento').reset();
    document.getElementById('modalEvento').style.display = 'flex';
};

window.fecharModalEvento = function () {
    document.getElementById('modalEvento').style.display = 'none';
};

async function salvarEvento(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveEvento');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    const titulo = document.getElementById('inEvTitulo').value;
    const inicio = document.getElementById('inEvInicio').value;
    const fim = document.getElementById('inEvFim').value;
    const local = document.getElementById('inEvLocal').value;
    const visibilidade = document.getElementById('inEvVisibilidade').value;
    const descricao = document.getElementById('inEvDescricao').value;

    try {
        const { error } = await db.from('agenda').insert([{
            estrutura_id: estruturaId,
            titulo: titulo,
            data_hora_inicio: inicio ? new Date(inicio).toISOString() : null,
            data_hora_fim: fim ? new Date(fim).toISOString() : null,
            local: local,
            visibilidade: visibilidade,
            descricao: descricao
        }]);

        if (error) throw error;

        fecharModalEvento();
        await carregarAgenda();
    } catch (err) {
        console.error("Erro ao salvar evento:", err);
        alert("Erro ao salvar o evento.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Evento';
    }
}

window.excluirEventoAgenda = async (id) => {
    const { isConfirmed } = await Swal.fire({
        title: 'Apagar evento?',
        text: 'Tem certeza que deseja apagar este evento da agenda?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Sim, apagar'
    });
    if (!isConfirmed) return;

    try {
        const { error } = await db.from('agenda').delete().eq('id', id);
        if (error) throw error;
        carregarAgenda();
    } catch (err) {
        console.error("Erro ao excluir evento:", err);
        alert("Erro ao excluir evento.");
    }
};

window.abrirModalAtividadeRegular = async function () {
    const select = document.getElementById('inAtRegLinkEstruturaId');
    if (select) {
        select.innerHTML = '<option value="">-- Nenhum --</option>';
        try {
            const { data } = await db.from('estruturas').select('id, nome').order('nome');
            if (data) {
                data.forEach(e => {
                    select.innerHTML += `<option value="${e.id}">${e.nome}</option>`;
                });
            }
        } catch (e) {
            console.error("Erro ao carregar estruturas para vinculo:", e);
        }
    }

    document.getElementById('inAtRegId').value = '';
    document.getElementById('inAtRegTitulo').value = '';
    document.getElementById('inAtRegDiaSemana').value = '';
    document.getElementById('inAtRegHorario').value = '';
    document.getElementById('inAtRegDescricao').value = '';
    if (select) select.value = '';

    document.getElementById('modalAtividadeRegularTitle').textContent = 'Nova Atividade Regular';
    document.getElementById('modalAtividadeRegular').style.display = 'flex';
};

window.fecharModalAtividadeRegular = function () {
    document.getElementById('modalAtividadeRegular').style.display = 'none';
};

window.carregarAtividadesRegulares = async function () {
    const list = document.getElementById('listAtividadesRegulares');
    if (!list) return;
    list.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Carregando...</div>';

    try {
        const { data, error } = await db
            .from('atividades_regulares')
            .select('*')
            .eq('estrutura_id', estruturaId)
            .order('titulo');

        if (error) {
            if (error.code === 'PGRST116' || error.message.includes('relation "atividades_regulares" does not exist')) {
                list.innerHTML = `
                    <div style="padding: 16px; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; color: #f87171; font-size: 13px;">
                        ⚠️ Tabela 'atividades_regulares' não encontrada no banco de dados. 
                        Por favor, execute o script SQL aprovado no console do Supabase para ativar este recurso.
                    </div>`;
                return;
            }
            throw error;
        }

        if (!data || data.length === 0) {
            list.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 24px; border: 1px dashed var(--border); border-radius: 8px;">Nenhuma atividade regular cadastrada.</div>';
            return;
        }

        let html = '';
        data.forEach(at => {
            let linkBtn = '';
            if (at.link_estrutura_id) {
                linkBtn = `<div style="margin-top: 10px;">
                    <a href="hub.html?id=${at.link_estrutura_id}" class="btn" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; font-size: 11px; text-decoration: none; background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3);">Ir para o Hub ➔</a>
                </div>`;
            }

            const linkify = (text) => {
                if (!text) return '';
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                return text.replace(urlRegex, function (url) {
                    return `<a href="${url}" target="_blank" style="color: #3b82f6; text-decoration: underline;">${url}</a>`;
                });
            };

            html += `
                <div class="card-agenda" style="position: relative; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 10px; padding: 16px; transition: all 0.2s;">
                    <div style="font-weight: 600; color: var(--text-main); font-size: 15px; margin-bottom: 6px; padding-right: 32px;">${at.titulo.toUpperCase()}</div>
                    <div style="display: flex; gap: 16px; font-size: 13px; color: var(--primary); font-weight: 500; margin-bottom: 8px;">
                        <span>📅 ${at.dia_semana}</span>
                        <span>⏰ ${at.horario}</span>
                    </div>
                    ${at.descricao ? `<div style="font-size: 13px; color: var(--text-muted); white-space: pre-line;">${linkify(at.descricao)}</div>` : ''}
                    ${linkBtn}
                    
                    <button onclick="excluirAtividadeRegular('${at.id}')" style="position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 14px; cursor: pointer; color: var(--text-muted);" title="Excluir Atividade">🗑️</button>
                </div>
            `;
        });
        list.innerHTML = html;

    } catch (err) {
        console.error("Erro ao carregar atividades regulares:", err);
        list.innerHTML = '<div style="color: #ef4444; font-size: 13px;">Erro ao carregar atividades regulares.</div>';
    }
};

window.salvarAtividadeRegular = async function (event) {
    event.preventDefault();
    const btn = document.getElementById('btnSaveAtReg');
    const form = document.getElementById('formAtividadeRegular');

    // Remover erros antigos
    const oldErr = document.getElementById('errAtReg');
    if (oldErr) oldErr.remove();

    try {
        btn.disabled = true;
        btn.textContent = 'Salvando...';

        const id = document.getElementById('inAtRegId').value;
        const titulo = document.getElementById('inAtRegTitulo').value;
        const diaSemana = document.getElementById('inAtRegDiaSemana').value;
        const horario = document.getElementById('inAtRegHorario').value;
        const linkEstruturaId = document.getElementById('inAtRegLinkEstruturaId').value || null;
        const descricao = document.getElementById('inAtRegDescricao').value;

        if (id) {
            const { error } = await db.from('atividades_regulares').update({
                titulo,
                dia_semana: diaSemana,
                horario,
                link_estrutura_id: linkEstruturaId,
                descricao
            }).eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await db.from('atividades_regulares').insert([{
                estrutura_id: estruturaId,
                titulo,
                dia_semana: diaSemana,
                horario,
                link_estrutura_id: linkEstruturaId,
                descricao
            }]);
            if (error) throw error;
        }

        fecharModalAtividadeRegular();
        await carregarAtividadesRegulares();
    } catch (err) {
        console.error("Erro ao salvar atividade regular:", err);
        const errDiv = document.createElement('div');
        errDiv.id = 'errAtReg';
        errDiv.style.color = '#ef4444';
        errDiv.style.marginTop = '12px';
        errDiv.style.fontSize = '13px';
        errDiv.innerHTML = `Erro do banco: ${err.message || JSON.stringify(err)}`;
        form.appendChild(errDiv);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Salvar Atividade';
        }
    }
};

window.excluirAtividadeRegular = async function (id) {
    const { isConfirmed } = await Swal.fire({
        title: 'Apagar atividade?',
        text: 'Tem certeza que deseja apagar esta atividade regular?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Sim, apagar'
    });
    if (!isConfirmed) return;
    try {
        const { error } = await db.from('atividades_regulares').delete().eq('id', id);
        if (error) throw error;
        await carregarAtividadesRegulares();
    } catch (err) {
        console.error("Erro ao excluir atividade regular:", err);
        alert("Erro ao excluir atividade regular: " + err.message);
    }
};

// ==========================================
// MÓDULO DE PROJETOS & PROCESSOS
// ==========================================
let projetosGlobais = [];

window.abrirModalProjeto = (tipo) => {
    document.getElementById('formProjeto').reset();
    document.getElementById('inProjetoId').value = '';
    document.getElementById('inProjetoTipo').value = tipo;


    document.getElementById('modalProjetoTitle').textContent = `Adicionar ${tipo}`;
    document.getElementById('modalProjeto').style.display = 'flex';
};

window.fecharModalProjeto = () => {
    document.getElementById('modalProjeto').style.display = 'none';
};

window.carregarProjetosProcessos = async () => {
    const container = document.getElementById('listProjetos');
    if (!container) return;

    container.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Carregando...</div>';

    try {
        const { data, error } = await db
            .from('projetos_processos')
            .select('*')
            .eq('estrutura_id', estruturaId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        projetosGlobais = data || [];
        renderizarProjetosProcessos();
    } catch (err) {
        console.warn("Erro ao buscar projetos:", err);
        container.innerHTML = '<div style="color: #ef4444; font-size: 13px;">⚠️ Erro: A tabela de projetos_processos não foi criada no Supabase.</div>';
    }
};

window.renderizarProjetosProcessos = () => {
    const container = document.getElementById('listProjetos');
    if (!projetosGlobais || projetosGlobais.length === 0) {
        container.innerHTML = `<div style="color: var(--text-muted); font-size: 13px;">Nenhum Projeto ou Processo encontrado.</div>`;
        return;
    }

    let html = '';
    projetosGlobais.forEach(proj => {
        const icon = proj.tipo === 'Projeto' ? '🚀' : '🔄';
        let badgeColor = 'var(--text-muted)';
        if (proj.status === 'Ativo') badgeColor = '#10b981';
        if (proj.status === 'Pausado') badgeColor = '#f59e0b';

        // Filtra documentos vinculados a este projeto
        const docsVinculados = typeof documentosGlobais !== 'undefined' ? documentosGlobais.filter(d => d.projeto_processo_id === proj.id) : [];
        let docsHtml = '';
        if (docsVinculados.length > 0) {
            docsHtml = '<div style="margin-top: 16px; border-top: 1px solid var(--border); padding-top: 12px; display: flex; flex-direction: column; gap: 8px;">';
            docsVinculados.forEach(doc => {
                const dIcon = doc.tipo === 'Link' ? '🔗' : '📝';

                let actionBtn = '';
                if (doc.tipo === 'Link') {
                    actionBtn = `onclick="window.open('${doc.conteudo}', '_blank')"`;
                } else {
                    const encodedContent = encodeURIComponent(doc.conteudo || '').replace(/'/g, "%27");
                    const encodedTitle = encodeURIComponent(doc.titulo || '').replace(/'/g, "%27");
                    actionBtn = `onclick="abrirViewerMarkdown('${encodedTitle}', '${encodedContent}')"`;
                }

                docsHtml += `
                <div style="background: rgba(255,255,255,0.03); border-radius: 6px; padding: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border);">
                    <div style="display: flex; align-items: center; gap: 12px; cursor: pointer;" ${actionBtn}>
                        <div style="background: var(--bg-dark); padding: 8px; border-radius: 6px;">${dIcon}</div>
                        <span style="font-size: 14px; font-weight: 500;">${doc.titulo}</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="abrirModalDoc('${doc.id}')" style="background: none; border: none; color: #60a5fa; cursor: pointer; font-size: 14px;" title="Editar Documento">✏️</button>
                        <button onclick="excluirDocumento('${doc.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 14px;" title="Excluir Documento">🗑️</button>
                    </div>
                </div>
                `;
            });
            docsHtml += '</div>';
        } else {
            docsHtml = '<div style="margin-top: 16px; font-size: 12px; color: var(--text-muted); font-style: italic;">Nenhum documento/bloco vinculado.</div>';
        }

        html += `
        <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px;">${icon}</div>
                    <div>
                        <h3 style="margin: 0; font-size: 18px; color: var(--text-main);">${proj.titulo}</h3>
                        <div style="font-size: 13px; color: ${badgeColor}; margin-top: 4px;">● ${proj.status}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="editarProjeto('${proj.id}')" style="background: none; border: none; color: #60a5fa; cursor: pointer; font-size: 16px;" title="Editar">✏️</button>
                    <button onclick="excluirProjeto('${proj.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 16px;" title="Excluir">🗑️</button>
                </div>
            </div>
            <p style="margin-top: 12px; color: var(--text-muted); font-size: 14px; line-height: 1.5;">${proj.descricao || ''}</p>
            ${docsHtml}
        </div>
        `;
    });

    container.innerHTML = html;
};

window.editarProjeto = (id) => {
    const proj = projetosGlobais.find(p => p.id === id);
    if (!proj) return;

    document.getElementById('inProjetoId').value = proj.id;
    document.getElementById('inProjetoTipo').value = proj.tipo;
    document.getElementById('inProjetoTitulo').value = proj.titulo;
    document.getElementById('inProjetoDescricao').value = proj.descricao;
    document.getElementById('inProjetoStatus').value = proj.status;

    document.getElementById('modalProjetoTitle').textContent = `Editar ${proj.tipo}`;
    document.getElementById('modalProjeto').style.display = 'flex';
};

window.excluirProjeto = async (id) => {
    const { isConfirmed } = await Swal.fire({
        title: 'Excluir item?',
        text: 'Os documentos dentro dele não serão apagados, apenas ficarão soltos.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Sim, excluir'
    });
    if (!isConfirmed) return;

    try {
        const { error } = await db.from('projetos_processos').delete().eq('id', id);
        if (error) throw error;
        await carregarProjetosProcessos();
    } catch (err) {
        console.error("Erro ao excluir", err);
        alert("Erro ao excluir.");
    }
};

window.salvarProjeto = async (e) => {
    e.preventDefault();
    const btnSave = document.getElementById('btnSaveProjeto');
    btnSave.disabled = true;

    const id = document.getElementById('inProjetoId').value;
    const tipo = document.getElementById('inProjetoTipo').value;
    const titulo = document.getElementById('inProjetoTitulo').value;
    const descricao = document.getElementById('inProjetoDescricao').value;
    const status = document.getElementById('inProjetoStatus').value;

    const dados = {
        estrutura_id: estruturaId,
        tipo, titulo, descricao, status
    };

    try {
        if (id) {
            const { error } = await db.from('projetos_processos').update(dados).eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await db.from('projetos_processos').insert([dados]);
            if (error) throw error;
        }

        fecharModalProjeto();
        await carregarProjetosProcessos();

        // Atualiza o select de projetos no modal de Documentos
        const selectProj = document.getElementById('inDocProjetoId');
        if (selectProj) {
            selectProj.innerHTML = '<option value="">-- Solto (Nenhum Projeto) --</option>';
            projetosGlobais.forEach(p => {
                selectProj.innerHTML += `<option value="${p.id}">${p.tipo}: ${p.titulo}</option>`;
            });
        }

    } catch (err) {
        console.error("Erro ao salvar projeto:", err);
        alert("Erro ao salvar. Verifique se a tabela projetos_processos existe.");
    } finally {
        btnSave.disabled = false;
    }
};

// ==========================================
// MÓDULO DE APPS & SERVIÇOS (Ex: Irradiação)
// ==========================================
let currentIrradiacaoTab = 'pendentes';
let currentIrradiacaoDia = 'Segunda-feira';

window.carregarAppMiniApps = async function () {
    const container = document.getElementById('containerApps');

    // Obter nomeEstrutura
    const nomeHub = document.getElementById('hubName').textContent || '';
    const nomeEstrutura = nomeHub.toLowerCase();
    const isIrradiacao = nomeEstrutura.includes('irradia') || nomeEstrutura.includes('sela');
    const isAssistencia = nomeEstrutura.includes('assist') && nomeEstrutura.includes('social');
    const isAtendimento = nomeEstrutura.includes('atendimento');
    const isBiblioteca = nomeEstrutura.includes('biblioteca');

    let cards = '';

    if (isIrradiacao) {
        cards += `
            <div onclick="abrirMiniAppIrradiacao()" style="background: rgba(79, 70, 229, 0.05); border: 1px solid #4f46e5; border-radius: 12px; padding: 24px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.05);" onmouseover="this.style.background='rgba(79, 70, 229, 0.1)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(79, 70, 229, 0.05)'; this.style.transform='none'">
                <div style="font-size: 32px; margin-bottom: 12px;">✨</div>
                <h3 style="color: #4f46e5; margin-bottom: 8px;">Irradiação Espiritual</h3>
                <p style="color: var(--text-muted); font-size: 13px; line-height: 1.4;">Solicitação de preces e tratamentos à distância.</p>
            </div>
            
            <div onclick="carregarPainelGestaoIrradiacao()" style="background: rgba(16, 185, 129, 0.05); border: 1px solid #10b981; border-radius: 12px; padding: 24px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.05);" onmouseover="this.style.background='rgba(16, 185, 129, 0.1)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(16, 185, 129, 0.05)'; this.style.transform='none'">
                <div style="font-size: 32px; margin-bottom: 12px;">⚙️</div>
                <h3 style="color: #10b981; margin-bottom: 8px;">Gestão de Irradiações</h3>
                <p style="color: var(--text-muted); font-size: 13px; line-height: 1.4;">Painel da equipe para leitura de nomes, histórico e estatísticas.</p>
            </div>
        `;
    }

    if (isAssistencia) {
        cards += `
            <div onclick="carregarAppFamilias()" style="background: rgba(236, 72, 153, 0.05); border: 1px solid #ec4899; border-radius: 12px; padding: 24px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.05);" onmouseover="this.style.background='rgba(236, 72, 153, 0.1)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(236, 72, 153, 0.05)'; this.style.transform='none'">
                <div style="font-size: 32px; margin-bottom: 12px;">👨‍👩‍👧‍👦</div>
                <h3 style="color: #ec4899; margin-bottom: 8px;">Famílias Assistidas</h3>
                <p style="color: var(--text-muted); font-size: 13px; line-height: 1.4;">Acompanhamento Social, Diário de Ocorrências e Cadastro de Dependentes.</p>
            </div>
            
            <div onclick="carregarAppAssistencia()" style="background: rgba(16, 185, 129, 0.05); border: 1px solid #10b981; border-radius: 12px; padding: 24px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.05);" onmouseover="this.style.background='rgba(16, 185, 129, 0.1)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(16, 185, 129, 0.05)'; this.style.transform='none'">
                <div style="font-size: 32px; margin-bottom: 12px;">📦</div>
                <h3 style="color: #10b981; margin-bottom: 8px;">Logística de Cestas</h3>
                <p style="color: var(--text-muted); font-size: 13px; line-height: 1.4;">Gestão do Almoxarifado, Cestas Básicas, Campanhas e Metas de Entrega.</p>
            </div>
        `;
    }
    if (isAtendimento) {
        cards += `
            <div onclick="abrirFormularioAtendimento()" style="background: rgba(59, 130, 246, 0.05); border: 1px solid #3b82f6; border-radius: 12px; padding: 24px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.05);" onmouseover="this.style.background='rgba(59, 130, 246, 0.1)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(59, 130, 246, 0.05)'; this.style.transform='none'">
                <div style="font-size: 32px; margin-bottom: 12px;">🤝</div>
                <h3 style="color: #3b82f6; margin-bottom: 8px;">Lançar Pedido</h3>
                <p style="color: var(--text-muted); font-size: 13px; line-height: 1.4;">Registrar novo pedido de Atendimento Fraterno.</p>
            </div>
            
            <div onclick="abrirFormularioHistorico()" style="background: rgba(139, 92, 246, 0.05); border: 1px solid #8b5cf6; border-radius: 12px; padding: 24px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.05);" onmouseover="this.style.background='rgba(139, 92, 246, 0.1)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(139, 92, 246, 0.05)'; this.style.transform='none'">
                <div style="font-size: 32px; margin-bottom: 12px;">🗃️</div>
                <h3 style="color: #8b5cf6; margin-bottom: 8px;">Inserir Ficha Antiga</h3>
                <p style="color: var(--text-muted); font-size: 13px; line-height: 1.4;">Migrar prontuários do arquivo morto para o sistema digital.</p>
            </div>
            
            <div onclick="carregarPainelGestaoAtendimento()" style="background: rgba(245, 158, 11, 0.05); border: 1px solid #f59e0b; border-radius: 12px; padding: 24px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.05);" onmouseover="this.style.background='rgba(245, 158, 11, 0.1)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(245, 158, 11, 0.05)'; this.style.transform='none'">
                <div style="font-size: 32px; margin-bottom: 12px;">⚙️</div>
                <h3 style="color: #f59e0b; margin-bottom: 8px;">Gestão de Atendimentos</h3>
                <p style="color: var(--text-muted); font-size: 13px; line-height: 1.4;">Gerenciar fila de atendimentos pendentes e concluídos.</p>
            </div>
        `;
    }
    if (isBiblioteca) {
        cards += `
            <div onclick="window.open('https://luzdoamanha.org.br/biblioteca/', '_blank')" style="background: rgba(79, 70, 229, 0.05); border: 1px solid #4f46e5; border-radius: 12px; padding: 24px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.05);" onmouseover="this.style.background='rgba(79, 70, 229, 0.1)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(79, 70, 229, 0.05)'; this.style.transform='none'">
                <div style="font-size: 32px; margin-bottom: 12px;">📚</div>
                <h3 style="color: #4f46e5; margin-bottom: 8px;">Acessar Biblioteca SELA</h3>
                <p style="color: var(--text-muted); font-size: 13px; line-height: 1.4;">Clique aqui para abrir o acervo de livros e solicitar empréstimos no site oficial.</p>
            </div>
        `;
    }

    container.innerHTML = `
        <div style="margin-bottom: 24px;">
            <h2 style="font-size: 20px; color: var(--text-main); margin-bottom: 8px;">📱 Mini-Apps</h2>
            <p style="color: var(--text-muted); font-size: 14px;">Bem-vindo ao ecossistema de módulos da sua casa espírita.</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
            ${cards}
            
            <!-- Placeholder para futuros apps -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px dashed var(--border); border-radius: 12px; padding: 24px; text-align: center; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0.5;">
                <div style="font-size: 24px; margin-bottom: 8px;">+</div>
                <div style="font-size: 13px;">Novos módulos em breve</div>
            </div>
        </div>
    `;
}

window.abrirMiniAppIrradiacao = async function () {
    const container = document.getElementById('containerApps');

    container.innerHTML = `
        <style>
            #formIrradiacao .input-field {
                border: 2px solid rgba(148, 163, 184, 0.6) !important;
                padding: 12px 16px !important;
                background-color: rgba(0, 0, 0, 0.02) !important;
                border-radius: 8px !important;
                font-size: 15px !important;
            }
            #formIrradiacao .input-field:focus {
                border-color: var(--primary) !important;
                background-color: rgba(255, 255, 255, 0.08) !important;
                outline: none;
            }
            #formIrradiacao .tag-checkbox-ui {
                background: rgba(0, 0, 0, 0.03) !important;
                border: 2px solid rgba(148, 163, 184, 0.4) !important;
                padding: 12px !important;
                border-radius: 12px !important;
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            }
            #formIrradiacao .tag-checkbox-ui:hover {
                border-color: var(--primary) !important;
                background: rgba(79, 70, 229, 0.1) !important;
            }
        </style>
        
        <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
            <div>
                <button onclick="carregarAppMiniApps()" class="btn btn-secondary" style="margin-bottom: 16px; font-size: 13px;">← Voltar aos Mini-Apps</button>
                <h2 style="font-size: 20px; color: var(--text-main); margin-bottom: 8px;">✨ App de Irradiação</h2>
                <p style="color: var(--text-muted); font-size: 14px;">Nova solicitação de tratamento espiritual.</p>
            </div>
        </div>

        <div style="background: rgba(79, 70, 229, 0.05); border: 1px solid var(--border); border-radius: 12px; padding: 24px; max-width: 600px;">
            <h3 style="color: var(--primary); margin-bottom: 16px;">📝 Nova Solicitação - via Portal Luz do Amanhã</h3>
            <form id="formIrradiacao" style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 6px;">Nome(s) Completo(s) do(s) Necessitado(s) *</label>
                    <input type="text" id="inIrrNome" required class="input-field" placeholder="EX: MARIA DA SILVA --- JOSÉ DA SILVA" style="width: 100%; text-transform: uppercase;" list="listaNomesIrr">
                    <datalist id="listaNomesIrr"></datalist>
                    <label style="display: flex; align-items: center; gap: 8px; margin-top: 12px; cursor: pointer;">
                        <input type="checkbox" id="chkIrrDesencarnado" onchange="toggleDesencarnadoIrr(this.checked)" style="width: 18px; height: 18px; accent-color: var(--primary);">
                        <span style="font-size: 14px; font-weight: 500; color: #facc15;">Este nome é de uma pessoa desencarnada (falecida)</span>
                    </label>
                </div>
                <div id="groupIrrEndereco">
                    <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 6px;">Endereço Completo</label>
                    <input type="text" id="inIrrEndereco" class="input-field" placeholder="RUA, NÚMERO, BAIRRO, CIDADE" style="width: 100%; text-transform: uppercase;">
                </div>
                <div>
                    <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 8px;">Dias para Irradiação *</label>
                    <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                        <label class="tag-checkbox-ui" style="text-align: center; line-height: 1.4;"><input type="checkbox" class="chk-dia" value="Segunda-feira"> Segunda-feira<br><small style="font-weight: normal; font-size: 11px; opacity: 0.8;">(Influênciação espiritual)</small></label>
                        <label class="tag-checkbox-ui" style="text-align: center; line-height: 1.4;"><input type="checkbox" class="chk-dia" value="Terça-feira"> Terça-feira<br><small style="font-weight: normal; font-size: 11px; opacity: 0.8;">(Saúde física/espiritual)</small></label>
                        <label class="tag-checkbox-ui" style="text-align: center; line-height: 1.4;"><input type="checkbox" class="chk-dia" value="Quarta-feira (Desobsessão)"> Quarta-feira<br><small style="font-weight: normal; font-size: 11px; opacity: 0.8;">(Desobsessão)</small></label>
                        <label class="tag-checkbox-ui" style="text-align: center; line-height: 1.4;"><input type="checkbox" class="chk-dia" value="Quarta-feira (Desencarnado)"> Quarta-feira<br><small style="font-weight: normal; font-size: 11px; opacity: 0.8;">(Desencarnado)</small></label>
                        <label class="tag-checkbox-ui" style="text-align: center; line-height: 1.4;"><input type="checkbox" class="chk-dia" value="Quinta-feira"> Quinta-feira<br><small style="font-weight: normal; font-size: 11px; opacity: 0.8;">(Saúde física/espiritual)</small></label>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
                    <button type="submit" class="btn btn-primary" id="btnSaveIrr">Enviar Solicitação</button>
                </div>
            </form>

            <!-- Painel de Sucesso -->
            <div id="panelSuccess" style="display: none; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
                <h3 style="color: #10b981; margin-bottom: 12px; font-size: 20px;">Pedido Enviado!</h3>
                <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 24px;">O nome foi incluído na lista para os dias selecionados.</p>
                
                <div id="resumeContent" style="background: rgba(0,0,0,0.2); padding: 16px; border-radius: 8px; font-size: 13px; color: var(--text-main); text-align: left; margin-bottom: 24px; border: 1px solid var(--border);">
                </div>

                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button onclick="novaSolicitacaoIrr()" class="btn btn-primary" style="width: 100%;">Fazer Novo Pedido</button>
                    <button onclick="cancelarSolicitacaoIrr()" id="btnCancelIrr" class="btn" style="width: 100%; border: 1px solid #ef4444; color: #ef4444; background: transparent;">Apagar Solicitação (Cancelar)</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('formIrradiacao').addEventListener('submit', salvarIrradiacao);

    // Auto-complete (Sugestões de Nomes e Endereços)
    setTimeout(async () => {
        try {
            const estruturaId = localStorage.getItem('estrutura_atual');
            let query = db.from('app_irradiacao_solicitacoes').select('nome_solicitado, endereco').order('criado_em', { ascending: false });
            if (estruturaId) {
                query = query.eq('estrutura_id', estruturaId);
            }
            const { data, error } = await query;

            if (!error && data) {
                window.sugestoesIrradiacao = {};
                const datalist = document.getElementById('listaNomesIrr');
                data.forEach(item => {
                    const n = item.nome_solicitado.toUpperCase();
                    if (!window.sugestoesIrradiacao[n]) {
                        window.sugestoesIrradiacao[n] = item.endereco ? item.endereco.toUpperCase() : '';
                        const opt = document.createElement('option');
                        opt.value = n;
                        datalist.appendChild(opt);
                    }
                });
            }
        } catch (e) { console.error('Erro ao carregar sugestões', e); }
    }, 100);

    const inputNome = document.getElementById('inIrrNome');
    inputNome.addEventListener('input', function () {
        const val = this.value.toUpperCase();
        if (window.sugestoesIrradiacao && window.sugestoesIrradiacao[val] !== undefined) {
            const end = document.getElementById('inIrrEndereco');
            // Preenche apenas se estiver vazio para não sobrescrever caso o usuário já tenha digitado algo
            if (!end.value) {
                end.value = window.sugestoesIrradiacao[val];
            }
        }
    });
};

window.toggleDesencarnadoIrr = function (isDesencarnado) {
    const inputEndereco = document.getElementById('inIrrEndereco');
    const groupEndereco = document.getElementById('groupIrrEndereco');
    const chkQuartaDesencarnado = document.querySelector('#formIrradiacao input[value="Quarta-feira (Desencarnado)"]');

    if (isDesencarnado) {
        inputEndereco.disabled = true;
        inputEndereco.value = '';
        inputEndereco.placeholder = 'NÃO É NECESSÁRIO PARA DESENCARNADOS';
        if (groupEndereco) groupEndereco.style.opacity = '0.5';

        if (chkQuartaDesencarnado && !chkQuartaDesencarnado.checked) {
            chkQuartaDesencarnado.checked = true;
        }
    } else {
        inputEndereco.disabled = false;
        inputEndereco.placeholder = 'RUA, NÚMERO, BAIRRO, CIDADE';
        if (groupEndereco) groupEndereco.style.opacity = '1';

        if (chkQuartaDesencarnado && chkQuartaDesencarnado.checked) {
            chkQuartaDesencarnado.checked = false;
        }
    }
};

window.lastInsertedIrrIds = [];

window.novaSolicitacaoIrr = function () {
    document.getElementById('formIrradiacao').reset();
    document.querySelectorAll('#formIrradiacao .tag-checkbox-ui').forEach(el => el.classList.remove('selected'));
    toggleDesencarnadoIrr(false);
    document.getElementById('formIrradiacao').style.display = 'flex';
    document.getElementById('panelSuccess').style.display = 'none';
    window.lastInsertedIrrIds = [];
};

window.cancelarSolicitacaoIrr = async function () {
    if (window.lastInsertedIrrIds.length === 0) return;
    const { isConfirmed } = await Swal.fire({
        title: 'Cancelar solicitação?',
        text: 'Tem certeza que deseja cancelar e apagar esta solicitação?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Sim, cancelar'
    });
    if (!isConfirmed) return;

    const btn = document.getElementById('btnCancelIrr');
    btn.disabled = true;
    btn.textContent = 'Apagando...';

    try {
        for (const id of window.lastInsertedIrrIds) {
            await db.from('app_irradiacao_solicitacoes').delete().eq('id', id);
        }
        alert("Solicitação apagada com sucesso.");
        novaSolicitacaoIrr();
    } catch (err) {
        console.error(err);
        alert("Erro ao apagar solicitação.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Apagar Solicitação (Cancelar)';
    }
};

window.carregarPainelGestaoIrradiacao = async function () {
    const container = document.getElementById('containerApps');

    container.innerHTML = `
        <div style="margin-bottom: 24px;">
            <button onclick="carregarAppMiniApps()" class="btn btn-secondary" style="margin-bottom: 16px; font-size: 13px;">← Voltar aos Mini-Apps</button>
            <h2 style="font-size: 20px; color: #10b981; margin-bottom: 8px;">⚙️ Gestão de Irradiações</h2>
            <p style="color: var(--text-muted); font-size: 14px;">Painel exclusivo para a equipe de trabalhadores da Irradiação.</p>
        </div>
        
        <div>
            <div style="display: flex; gap: 16px; margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 16px; overflow-x: auto;">
                <button onclick="mudarAbaIrradiacao('pendentes')" id="btnIrrPendentes" class="btn" style="white-space: nowrap; border-radius: 8px;">📥 Pendentes</button>
                <button onclick="mudarAbaIrradiacao('ativos')" id="btnIrrAtivos" class="btn" style="white-space: nowrap; border-radius: 8px;">📋 Painel de Leitura</button>
                <button onclick="mudarAbaIrradiacao('encerra_semana')" id="btnIrrEncerraSemana" class="btn" style="white-space: nowrap; border-radius: 8px;">⏳ Encerra na Semana</button>
                <button onclick="mudarAbaIrradiacao('historico')" id="btnIrrHistorico" class="btn" style="white-space: nowrap; border-radius: 8px;">🗄️ Histórico</button>
                <button onclick="mudarAbaIrradiacao('arquivamento')" id="btnIrrArquivamento" class="btn" style="white-space: nowrap; border-radius: 8px;">📦 Arquivamento</button>
                <button onclick="mudarAbaIrradiacao('estatisticas')" id="btnIrrEstatisticas" class="btn" style="white-space: nowrap; border-radius: 8px;">📊 Estatísticas</button>
                <button onclick="mudarAbaIrradiacao('limpeza')" id="btnIrrLimpeza" class="btn" style="white-space: nowrap; border-radius: 8px;">🧹 Limpeza</button>
                <button onclick="window.open('irradiacao_imprimir.html', '_blank')" id="btnIrrImprimir" class="btn" style="white-space: nowrap; border-radius: 8px; background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3);">🖨️ Imprimir Lista</button>
            </div>
            
            <div id="filtrosDiasIrr" style="display: none; gap: 12px; margin-bottom: 16px; overflow-x: auto; padding-bottom: 8px;">
                <button class="btn btn-secondary btn-dia" data-dia="Todos" onclick="setDiaIrradiacao('')">Todos os dias</button>
                <button class="btn btn-secondary btn-dia" data-dia="Segunda-feira" onclick="setDiaIrradiacao('Segunda-feira')">Segunda-feira</button>
                <button class="btn btn-secondary btn-dia" data-dia="Terça-feira" onclick="setDiaIrradiacao('Terça-feira')">Terça-feira</button>
                <button class="btn btn-secondary btn-dia" data-dia="Quarta-feira (Desobsessão)" onclick="setDiaIrradiacao('Quarta-feira (Desobsessão)')">Quarta-feira (Desob)</button>
                <button class="btn btn-secondary btn-dia" data-dia="Quarta-feira (Desencarnado)" onclick="setDiaIrradiacao('Quarta-feira (Desencarnado)')">Quarta-feira (Desenc)</button>
                <button class="btn btn-secondary btn-dia" data-dia="Quinta-feira" onclick="setDiaIrradiacao('Quinta-feira')">Quinta-feira</button>
            </div>

            <div id="listaIrradiacoes" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
                <div style="color: var(--text-muted); font-size: 13px;">Carregando...</div>
            </div>
            
            <div id="estatisticasContainer" style="display: none; flex-direction: column; gap: 24px;">
                <div style="color: var(--text-muted); font-size: 13px;">Carregando estatísticas...</div>
            </div>

            <div id="limpezaContainer" style="display: none; flex-direction: column; gap: 24px;">
                <div style="color: var(--text-muted); font-size: 13px;">Buscando possíveis duplicatas...</div>
            </div>

            <!-- Modal Fim de Leitura -->
            <div id="modalFimLeitura" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 24px; max-width: 400px; width: 90%;">
                    <h3 style="color: var(--primary); margin-top: 0; font-size: 18px;">✅ Ciclo Concluído!</h3>
                    <p style="color: var(--text-main); font-size: 14px; margin-bottom: 24px; line-height: 1.5;" id="msgFimLeitura"></p>
                    <div style="display: flex; gap: 12px; flex-direction: column;">
                        <button id="btnModalRenovar" class="btn btn-primary" style="padding: 10px;">♻️ Renovar Tratamento (Zerar)</button>
                        <button id="btnModalHistorico" class="btn btn-secondary" style="padding: 10px;">🗄️ Mover para o Histórico</button>
                        <button onclick="document.getElementById('modalFimLeitura').style.display='none'" class="btn" style="padding: 10px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);">Cancelar</button>
                    </div>
                </div>
            </div>

            <!-- Modal de Edição de Irradiação -->
            <div id="modalEdicaoIrradiacao" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 24px; max-width: 400px; width: 90%;">
                    <h3 style="color: var(--primary); margin-top: 0; font-size: 18px;">✏️ Editar Solicitação</h3>
                    
                    <form id="formEdicaoIrradiacao" onsubmit="salvarEdicaoIrradiacao(event)">
                        <input type="hidden" id="editIrrId">
                        
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="color: var(--text-muted); font-size: 13px;">Nome Solicitado (Nomes agrupados)</label>
                            <input type="text" id="editIrrNome" required class="input" style="width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; padding: 8px; border-radius: 4px;">
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="color: var(--text-muted); font-size: 13px;">Endereço</label>
                            <textarea id="editIrrEndereco" class="input" rows="2" style="width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; padding: 8px; border-radius: 4px;"></textarea>
                        </div>

                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="color: var(--text-muted); font-size: 13px;">Dia / Necessidade</label>
                            <select id="editIrrDia" required class="input" style="width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; padding: 8px; border-radius: 4px;">
                                <option value="Segunda-feira">Segunda-feira</option>
                                <option value="Terça-feira">Terça-feira</option>
                                <option value="Quarta-feira (Desobsessão)">Quarta-feira (Desob)</option>
                                <option value="Quarta-feira (Desencarnado)">Quarta-feira (Desenc)</option>
                                <option value="Quinta-feira">Quinta-feira</option>
                            </select>
                        </div>

                        <div class="form-group" style="margin-bottom: 24px;">
                            <label style="color: var(--text-muted); font-size: 13px;">Semanas Alvo (Meta)</label>
                            <input type="number" id="editIrrSemanas" required min="1" max="52" class="input" style="width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; padding: 8px; border-radius: 4px;">
                        </div>

                        <div style="display: flex; gap: 12px;">
                            <button type="submit" class="btn btn-primary" style="flex: 1; padding: 10px;">💾 Salvar</button>
                            <button type="button" onclick="document.getElementById('modalEdicaoIrradiacao').style.display='none'" class="btn" style="flex: 1; padding: 10px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    window.mudarAbaIrradiacao('pendentes');
}

window.mudarAbaIrradiacao = function (aba) {
    currentIrradiacaoTab = aba;

    // Atualiza botões
    const btnPendentes = document.getElementById('btnIrrPendentes');
    const btnAtivos = document.getElementById('btnIrrAtivos');
    const btnEncerraSemana = document.getElementById('btnIrrEncerraSemana');
    const btnHistorico = document.getElementById('btnIrrHistorico');
    const btnArquivamento = document.getElementById('btnIrrArquivamento');
    const btnEstatisticas = document.getElementById('btnIrrEstatisticas');
    const btnLimpeza = document.getElementById('btnIrrLimpeza');

    if(btnPendentes) {
        btnPendentes.style.background = aba === 'pendentes' ? 'rgba(56, 189, 248, 0.2)' : 'transparent';
        btnPendentes.style.color = aba === 'pendentes' ? '#38bdf8' : 'var(--text-muted)';
        btnPendentes.style.border = aba === 'pendentes' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent';
    }

    if(btnAtivos) {
        btnAtivos.style.background = aba === 'ativos' ? 'rgba(16,185,129,0.2)' : 'transparent';
        btnAtivos.style.color = aba === 'ativos' ? '#10b981' : 'var(--text-muted)';
        btnAtivos.style.border = aba === 'ativos' ? '1px solid rgba(16,185,129,0.4)' : '1px solid transparent';
    }

    if(btnEncerraSemana) {
        btnEncerraSemana.style.background = aba === 'encerra_semana' ? 'rgba(245, 158, 11, 0.2)' : 'transparent';
        btnEncerraSemana.style.color = aba === 'encerra_semana' ? '#f59e0b' : 'var(--text-muted)';
        btnEncerraSemana.style.border = aba === 'encerra_semana' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent';
    }

    if(btnHistorico) {
        btnHistorico.style.background = aba === 'historico' ? 'rgba(255, 255, 255, 0.1)' : 'transparent';
        btnHistorico.style.color = aba === 'historico' ? 'white' : 'var(--text-muted)';
        btnHistorico.style.border = aba === 'historico' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent';
    }

    if(btnArquivamento) {
        btnArquivamento.style.background = aba === 'arquivamento' ? 'rgba(168, 85, 247, 0.2)' : 'transparent';
        btnArquivamento.style.color = aba === 'arquivamento' ? '#a855f7' : 'var(--text-muted)';
        btnArquivamento.style.border = aba === 'arquivamento' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid transparent';
    }

    if (btnEstatisticas) {
        btnEstatisticas.style.background = aba === 'estatisticas' ? 'rgba(245, 158, 11, 0.2)' : 'transparent';
        btnEstatisticas.style.color = aba === 'estatisticas' ? '#f59e0b' : 'var(--text-muted)';
        btnEstatisticas.style.border = aba === 'estatisticas' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent';
    }

    if (btnLimpeza) {
        btnLimpeza.style.background = aba === 'limpeza' ? 'rgba(236, 72, 153, 0.2)' : 'transparent';
        btnLimpeza.style.color = aba === 'limpeza' ? '#ec4899' : 'var(--text-muted)';
        btnLimpeza.style.border = aba === 'limpeza' ? '1px solid rgba(236, 72, 153, 0.4)' : '1px solid transparent';
    }

    // Filtros de dia aparecem no "ativos", "historico" e "pendentes"
    const filtrosDias = document.getElementById('filtrosDiasIrr');
    const listaIrradiacoes = document.getElementById('listaIrradiacoes');
    const estatisticasContainer = document.getElementById('estatisticasContainer');
    const limpezaContainer = document.getElementById('limpezaContainer');

    if (aba === 'estatisticas') {
        filtrosDias.style.display = 'none';
        listaIrradiacoes.style.display = 'none';
        if (limpezaContainer) limpezaContainer.style.display = 'none';
        estatisticasContainer.style.display = 'flex';
        carregarEstatisticasIrradiacao();
    } else if (aba === 'limpeza') {
        filtrosDias.style.display = 'none';
        listaIrradiacoes.style.display = 'none';
        estatisticasContainer.style.display = 'none';
        if (limpezaContainer) limpezaContainer.style.display = 'flex';
        carregarLimpezaIrradiacao();
    } else {
        estatisticasContainer.style.display = 'none';
        if (limpezaContainer) limpezaContainer.style.display = 'none';
        
        if (aba === 'ativos' || aba === 'encerra_semana' || aba === 'historico' || aba === 'arquivamento') {
            listaIrradiacoes.style.display = 'flex';
            listaIrradiacoes.style.flexDirection = 'column';
        } else {
            listaIrradiacoes.style.display = 'grid';
            listaIrradiacoes.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
        }

        filtrosDias.style.display = 'flex';
        window.setDiaIrradiacao(currentIrradiacaoDia); // Força render
    }
}

window.setDiaIrradiacao = function (dia) {
    currentIrradiacaoDia = dia;

    document.querySelectorAll('.btn-dia').forEach(b => {
        const btnDia = b.getAttribute('data-dia') || '';
        const isActive = (dia === '' && btnDia === 'Todos') || (dia !== '' && btnDia === dia);
        b.style.background = isActive ? 'var(--primary)' : 'var(--bg-dark)';
        b.style.color = isActive ? '#fff' : 'var(--text-muted)';
    });

    carregarListaIrradiacao();
}

async function carregarListaIrradiacao() {
    const lista = document.getElementById('listaIrradiacoes');
    if (!lista) return;

    try {
        let query = db.from('app_irradiacao_solicitacoes')
            .select('*')
            .eq('estrutura_id', estruturaId);

        let targetStatus = currentIrradiacaoTab;
        if (currentIrradiacaoTab === 'ativos' || currentIrradiacaoTab === 'encerra_semana') targetStatus = 'ativo';
        if (currentIrradiacaoTab === 'pendentes') targetStatus = 'pendente';
        if (currentIrradiacaoTab === 'historico' || currentIrradiacaoTab === 'arquivamento') targetStatus = 'historico';

        query = query.eq('status', targetStatus).order('nome_solicitado', { ascending: true });

        const { data, error } = await query;
        if (error) throw error;

        let filteredBase = data || [];

        if (currentIrradiacaoTab === 'encerra_semana') {
            filteredBase = filteredBase.filter(item => {
                const semanas_alvo = item.semanas_alvo || 4;
                const leituras = item.leituras || 0;
                return (semanas_alvo - leituras) === 1;
            });
        } else if (currentIrradiacaoTab === 'arquivamento') {
            filteredBase = filteredBase.filter(item => {
                let logs = item.log_datas_leituras;
                if (typeof logs === 'string') {
                    try { logs = JSON.parse(logs); } catch (e) { logs = []; }
                }
                if (Array.isArray(logs) && logs.length > 0) {
                    const lastLog = new Date(logs[logs.length - 1]);
                    if (!isNaN(lastLog)) {
                        const diffTime = Math.abs(new Date() - lastLog);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays > 30;
                    }
                }
                return false;
            });
        } else if (currentIrradiacaoTab === 'historico') {
            filteredBase = filteredBase.filter(item => {
                let logs = item.log_datas_leituras;
                if (typeof logs === 'string') {
                    try { logs = JSON.parse(logs); } catch (e) { logs = []; }
                }
                if (Array.isArray(logs) && logs.length > 0) {
                    const lastLog = new Date(logs[logs.length - 1]);
                    if (!isNaN(lastLog)) {
                        const diffTime = Math.abs(new Date() - lastLog);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays <= 30;
                    }
                }
                return true;
            });
        }

        // --- Cálculo e atualização dos botões de filtro ---
        let counts = {
            'Todos os dias': filteredBase.length,
            'Segunda-feira': 0,
            'Terça-feira': 0,
            'Quarta-feira (Desobsessão)': 0,
            'Quarta-feira (Desencarnado)': 0,
            'Quinta-feira': 0
        };

        filteredBase.forEach(item => {
            const d = item.dias_semana || '';
            if (d.includes('Segunda-feira')) counts['Segunda-feira']++;
            if (d.includes('Terça-feira')) counts['Terça-feira']++;
            if (d.includes('Quarta-feira (Desobsessão)')) counts['Quarta-feira (Desobsessão)']++;
            if (d.includes('Quarta-feira (Desencarnado)')) counts['Quarta-feira (Desencarnado)']++;
            if (d.includes('Quinta-feira')) counts['Quinta-feira']++;
        });

        document.querySelectorAll('.btn-dia').forEach(b => {
            const btnDia = b.getAttribute('data-dia') || '';
            if (btnDia === 'Todos') {
                b.innerHTML = `Todos os dias <span style="opacity:0.6; font-size:0.9em; margin-left:4px;">(${counts['Todos os dias']})</span>`;
            } else if (btnDia === 'Segunda-feira') {
                b.innerHTML = `Segunda-feira <span style="opacity:0.6; font-size:0.9em; margin-left:4px;">(${counts['Segunda-feira']})</span>`;
            } else if (btnDia === 'Terça-feira') {
                b.innerHTML = `Terça-feira <span style="opacity:0.6; font-size:0.9em; margin-left:4px;">(${counts['Terça-feira']})</span>`;
            } else if (btnDia === 'Quarta-feira (Desobsessão)') {
                b.innerHTML = `Quarta-feira (Desob) <span style="opacity:0.6; font-size:0.9em; margin-left:4px;">(${counts['Quarta-feira (Desobsessão)']})</span>`;
            } else if (btnDia === 'Quarta-feira (Desencarnado)') {
                b.innerHTML = `Quarta-feira (Desenc) <span style="opacity:0.6; font-size:0.9em; margin-left:4px;">(${counts['Quarta-feira (Desencarnado)']})</span>`;
            } else if (btnDia === 'Quinta-feira') {
                b.innerHTML = `Quinta-feira <span style="opacity:0.6; font-size:0.9em; margin-left:4px;">(${counts['Quinta-feira']})</span>`;
            }
        });

        // Filtra os dados no lado do cliente
        const filteredData = currentIrradiacaoDia === ''
            ? filteredBase
            : (filteredBase || []).filter(item => (item.dias_semana || '').includes(currentIrradiacaoDia));

        if (!filteredData || filteredData.length === 0) {
            lista.innerHTML = '<div style="color: var(--text-muted); font-size: 14px; text-align: center; padding: 24px; background: rgba(255,255,255,0.02); border-radius: 8px;">Nenhum registro encontrado nesta visão.</div>';
            return;
        }

        let html = '';
        filteredData.forEach(item => {
            const dataPed = new Date(item.criado_em).toLocaleDateString('pt-BR');

            // Botões de Ação
            let actionsHtml = '';
            let progressHtml = '';
            const safeNome = item.nome_solicitado.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const safeEndereco = (item.endereco || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const safeDias = (item.dias_semana || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const semanasAlvoStr = item.semanas_alvo || 4;

            let logsGlobal = item.log_datas_leituras;
            if (typeof logsGlobal === 'string') {
                try { logsGlobal = JSON.parse(logsGlobal); } catch (e) { logsGlobal = []; }
            }
            const arrayLogs = Array.isArray(logsGlobal) ? logsGlobal : [];
            const totalLeiturasHtml = arrayLogs.length > 0 ? ` | Irradiações:&nbsp;<strong style="color: #cbd5e1;">${arrayLogs.length}</strong>` : '';

            if (currentIrradiacaoTab === 'pendentes') {
                progressHtml = `<div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Status: <strong style="color: var(--warning);">Pendente</strong>${totalLeiturasHtml}</div>`;
                
                // Encode data for Side-Sheet
                const itemDataStr = encodeURIComponent(JSON.stringify({
                    id: item.id,
                    nome: item.nome_solicitado,
                    endereco: item.endereco,
                    dias: item.dias_semana,
                    semanasAlvo: item.semanas_alvo || 4,
                    criadoPor: item.criado_por,
                    dataPed: dataPed,
                    totalLeiturasHtml: totalLeiturasHtml
                }));

                actionsHtml = `
                    <button onclick="window.abrirSideSheetPendenteHub('${itemDataStr}')" class="btn" style="background: var(--sela-orange); color: #fff; width: 100%; border: none;">Analisar Solicitação 📋</button>
                `;
            } else if (currentIrradiacaoTab === 'ativos' || currentIrradiacaoTab === 'encerra_semana') {
                const leituras = item.leituras || 0;
                const semanas_alvo = item.semanas_alvo || 4; // Fallback se não existir no DB
                let caixinhas = '';
                for (let i = 1; i <= semanas_alvo; i++) {
                    if (i <= leituras) {
                        caixinhas += `<span class="bola-irradiacao preenchida" style="display:inline-block; width:16px; height:16px; background:#10b981; border-radius:50%; margin-right:4px; margin-bottom:4px; transition: all 0.3s ease;"></span>`;
                    } else {
                        caixinhas += `<span class="bola-irradiacao vazia" style="display:inline-block; width:16px; height:16px; border:2px solid #334155; border-radius:50%; margin-right:4px; margin-bottom:4px; transition: all 0.3s ease;"></span>`;
                    }
                }

                let checkboxRepetir = `
                    <label style="font-size: 11px; display: flex; align-items: center; gap: 4px; color: var(--text-muted); cursor: pointer; margin-bottom: 6px;">
                        <input type="checkbox" id="chk_renovar_${item.id}" onchange="toggleRenovacaoAutomatica('${item.id}', this.checked)" ${item.renovacao_automatica ? 'checked' : ''}>
                        Repetir (Reiniciar ciclo automaticamente)
                    </label>
                `;

                let lastDateHtml = '';
                let logs = item.log_datas_leituras;
                if (typeof logs === 'string') {
                    try { logs = JSON.parse(logs); } catch (e) { logs = []; }
                }
                if (Array.isArray(logs) && logs.length > 0) {
                    const lastLog = logs[logs.length - 1];
                    const d = new Date(lastLog);
                    if (!isNaN(d)) {
                        const lastDateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                        const today = new Date();
                        const isToday = (d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear());
                        if (isToday) {
                            lastDateHtml = `<span style="margin-left: 8px; font-size: 11px; font-weight: 600; background: rgba(16,185,129,0.15); color: #10b981; padding: 2px 6px; border-radius: 4px; border: 1px solid #10b981; white-space: nowrap;">(Hoje)</span>`;
                        } else {
                            lastDateHtml = `<span style="margin-left: 8px; font-size: 11px; font-weight: 500; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; white-space: nowrap;">Última: ${lastDateStr}</span>`;
                        }
                    }
                }

                progressHtml = `<div style="margin-top: 8px; font-size: 12px; color: var(--text-muted);">${checkboxRepetir}<div style="display:flex; align-items:center; margin-bottom:4px; flex-wrap:wrap;">Leitura atual: <strong style="margin-left: 4px; margin-right: 2px; color: var(--accent);">${leituras}/${semanas_alvo}</strong>${totalLeiturasHtml} ${lastDateHtml}</div><div style="display:flex; flex-wrap:wrap; max-width: 250px;">${caixinhas}</div></div>`;

                actionsHtml = `
                    <button id="btn_ler_${item.id}" onclick="marcarLeituraIrr(this, '${item.id}', ${leituras}, ${semanas_alvo})" class="btn" style="background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid #10b981; padding: 8px 12px; transition: all 0.3s ease; width: 100%; font-weight: 600;">✅ Registrar Leitura</button>
                    <div style="display: flex; gap: 8px; width: 100%;">
                        <button onclick="abrirModalEdicaoIrradiacao('${item.id}', '${safeNome}', '${safeEndereco}', '${safeDias}', ${semanasAlvoStr})" class="btn btn-secondary" style="padding: 6px 12px; flex: 1;">✏️ Editar</button>
                        <button onclick="arquivarIrradiacao('${item.id}')" class="btn btn-secondary" style="padding: 6px 12px; flex: 1;">Arquivar</button>
                    </div>
                `;
            } else if (currentIrradiacaoTab === 'historico' || currentIrradiacaoTab === 'arquivamento') {
                let lastDateInfo = '';
                let logs = item.log_datas_leituras;
                if (typeof logs === 'string') {
                    try { logs = JSON.parse(logs); } catch (e) { logs = []; }
                }
                if (Array.isArray(logs) && logs.length > 0) {
                    const lastLog = new Date(logs[logs.length - 1]);
                    if (!isNaN(lastLog)) {
                        lastDateInfo = ` | Última: <strong style="color: #cbd5e1;">${lastLog.toLocaleDateString('pt-BR')}</strong>`;
                    }
                }
                progressHtml = `<div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Status: Histórico${totalLeiturasHtml}${lastDateInfo}</div>`;

                actionsHtml = `
                    <button onclick="aprovarIrradiacao('${item.id}', '${safeNome}', '${safeEndereco}', '${safeDias}')" class="btn btn-secondary" style="padding: 8px 12px; width: 100%; font-weight: 600;">♻️ Reativar (Triagem)</button>
                    <div style="display: flex; gap: 8px; width: 100%;">
                        <button onclick="abrirModalEdicaoIrradiacao('${item.id}', '${safeNome}', '${safeEndereco}', '${safeDias}', ${semanasAlvoStr})" class="btn btn-secondary" style="padding: 6px 12px; flex: 1;">✏️ Editar</button>
                        <button onclick="excluirIrradiacaoDefinitivo('${item.id}')" class="btn" style="color: #ef4444; border: 1px solid #ef4444; padding: 6px 12px; background: transparent; flex: 1;">Apagar</button>
                    </div>
                `;
            }

            if (currentIrradiacaoTab === 'ativos' || currentIrradiacaoTab === 'encerra_semana' || currentIrradiacaoTab === 'historico' || currentIrradiacaoTab === 'arquivamento') {
                html += `
                    <div id="card_irr_${item.id}" style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 16px 24px; display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 24px; transition: all 0.3s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <div style="flex: 2; min-width: 250px;">
                            <h4 style="color: var(--primary); margin: 0 0 4px 0; font-size: 16px; font-weight: 700;">${item.nome_solicitado}</h4>
                            <p style="color: var(--text-muted); font-size: 13px; margin: 0;">📍 ${item.endereco || 'Endereço não informado'}</p>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 8px;">Criado em: ${dataPed}${item.criado_por ? ' por ' + item.criado_por : ''} | Alvo: <strong style="color: var(--primary);">${item.dias_semana}</strong></div>
                        </div>
                        <div style="flex: 2; display: flex; flex-direction: column; justify-content: center; border-left: 1px solid var(--border); padding-left: 24px; min-width: 250px;">
                            ${progressHtml}
                        </div>
                        <div style="flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 150px; align-items: stretch;">
                            ${actionsHtml}
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div id="card_irr_${item.id}" style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 12px; transition: all 0.3s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <div style="display: flex; justify-content: space-between;">
                            <div style="flex: 1;">
                                <h4 style="color: var(--primary); margin: 0 0 4px 0; font-size: 16px; font-weight: 700;">${item.nome_solicitado}</h4>
                                <p style="color: var(--text-muted); font-size: 13px; margin: 0;">📍 ${item.endereco || 'Endereço não informado'}</p>
                                <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Criado em: ${dataPed}${item.criado_por ? ' por ' + item.criado_por : ''} | Alvo: <strong style="color: var(--primary);">${item.dias_semana}</strong></div>
                                ${progressHtml}
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
                            ${actionsHtml}
                        </div>
                    </div>
                `;
            }
        });
        lista.innerHTML = html;

    } catch (e) {
        console.error(e);
        if (lista) lista.innerHTML = '<div style="color: #ef4444;">Erro ao carregar solicitações.</div>';
    }
}

async function salvarIrradiacao(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveIrr');
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    let nome = document.getElementById('inIrrNome').value.toUpperCase();
    const endereco = document.getElementById('inIrrEndereco').value.toUpperCase();
    const isDesencarnado = document.getElementById('chkIrrDesencarnado') && document.getElementById('chkIrrDesencarnado').checked;

    if (isDesencarnado) {
        nome = "[DESENCARNADO] " + nome;
    }

    const checkboxes = document.querySelectorAll('.chk-dia:checked');
    const dias = Array.from(checkboxes).map(c => c.value);

    if (dias.length === 0) {
        alert("Selecione pelo menos um dia para a Irradiação.");
        btn.disabled = false;
        btn.textContent = 'Enviar Solicitação';
        return;
    }

    try {
        let criadoPor = 'Desconhecido';
        try {
            const profStr = localStorage.getItem('sela_user_profile');
            if (profStr) {
                const prof = JSON.parse(profStr);
                criadoPor = prof.nome_curto || (prof.nome || '').trim().split(' ')[0] || 'Desconhecido';
            }
        } catch (e) { }

        // Criar N registros independentes, um para cada dia selecionado
        const recordsToInsert = dias.map(dia => ({
            estrutura_id: estruturaId,
            nome_solicitado: nome,
            endereco: endereco,
            dias_semana: dia,
            status: 'pendente',
            leituras: 0,
            criado_por: criadoPor
        }));

        const { data, error } = await db.from('app_irradiacao_solicitacoes').insert(recordsToInsert).select('id');
        if (error) throw error;

        window.lastInsertedIrrIds = data.map(r => r.id);

        document.getElementById('formIrradiacao').style.display = 'none';
        document.getElementById('panelSuccess').style.display = 'block';
        document.getElementById('resumeContent').innerHTML = `
            <strong>Nome:</strong> ${nome}<br>
            <strong>Endereço:</strong> ${endereco || 'Não informado'}<br>
            <strong style="display:block; margin-top:8px;">Dias:</strong> 
            ${dias.join('<br>')}
        `;

        await carregarListaIrradiacao();
    } catch (err) {
        console.error(err);
        alert("Erro ao enviar solicitação.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Enviar Solicitação';
    }
}

window.toggleRenovacaoAutomatica = async function (id, isChecked) {
    try {
        const { error } = await db.from('app_irradiacao_solicitacoes').update({ renovacao_automatica: isChecked }).eq('id', id);
        if (error) throw error;
        // Não recarregamos a lista para evitar piscar a tela, a alteração no banco já está feita.
    } catch (e) {
        console.error(e);
        alert('Erro ao atualizar opção de repetir ciclo: ' + e.message);
    }
}

window.levenshteinIrr = function (a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
};

window.similaridadeIrr = function (a, b) {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1.0;
    const dist = window.levenshteinIrr(a, b);
    return (maxLen - dist) / maxLen;
};

window.carregarLimpezaIrradiacao = async function () {
    const container = document.getElementById('limpezaContainer');
    container.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Baixando e analisando registros... isso pode levar alguns segundos.</div>';

    try {
        const estruturaId = localStorage.getItem('estrutura_atual');
        let query = db.from('app_irradiacao_solicitacoes').select('id, nome_solicitado');
        if (estruturaId) query = query.eq('estrutura_id', estruturaId);
        const { data, error } = await query;
        if (error) throw error;

        // Count frequencies of each exact name
        const nomeCounts = {};
        data.forEach(r => {
            const n = (r.nome_solicitado || '').toUpperCase().trim();
            if (n) {
                nomeCounts[n] = (nomeCounts[n] || 0) + 1;
            }
        });

        const nomesUnicos = Object.keys(nomeCounts);
        const grupos = [];
        const processados = new Set();

        // Compara todos com todos
        for (let i = 0; i < nomesUnicos.length; i++) {
            const nomeA = nomesUnicos[i];
            if (processados.has(nomeA)) continue;

            let grupoAtual = [nomeA];
            for (let j = i + 1; j < nomesUnicos.length; j++) {
                const nomeB = nomesUnicos[j];
                if (processados.has(nomeB)) continue;

                // Ignorar nomes muito curtos para não dar falso positivo
                if (nomeA.length < 5 || nomeB.length < 5) continue;

                const sim = window.similaridadeIrr(nomeA, nomeB);
                if (sim >= 0.82) { // 82% de similaridade
                    grupoAtual.push(nomeB);
                }
            }

            if (grupoAtual.length > 1) {
                grupoAtual.forEach(n => processados.add(n));
                grupos.push(grupoAtual);
            }
        }

        if (grupos.length === 0) {
            container.innerHTML = `
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 24px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 40px; margin-bottom: 16px;">✨</div>
                    <h3 style="color: #10b981; margin-bottom: 8px;">Banco de Dados Limpo!</h3>
                    <p style="color: var(--text-muted); font-size: 14px;">Não encontramos nenhum nome com suspeita de duplicidade ou erro de digitação.</p>
                </div>
            `;
            return;
        }

        let html = `
            <div style="background: rgba(236, 72, 153, 0.1); border: 1px solid rgba(236, 72, 153, 0.2); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                <h3 style="color: #ec4899; margin-bottom: 8px; font-size: 16px;">⚠️ Possíveis Duplicatas Encontradas (${grupos.length})</h3>
                <p style="color: var(--text-muted); font-size: 13px; line-height: 1.5;">O algoritmo identificou nomes muito parecidos. Escolha a grafia correta em cada grupo para unificá-los. Os registros antigos serão atualizados para o nome oficial escolhido (endereços e históricos serão preservados).</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 16px;">
        `;

        grupos.forEach((grupo, idx) => {
            html += `<div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 16px;">
                <h4 style="color: var(--text-main); font-size: 14px; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">Grupo ${idx + 1}</h4>
                <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
            `;

            grupo.forEach(nome => {
                html += `
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px solid transparent;" onmouseover="this.style.border='1px solid var(--border)'" onmouseout="this.style.border='1px solid transparent'">
                        <input type="radio" name="grupo_${idx}" value="${nome}" style="accent-color: #ec4899;">
                        <span style="color: var(--text-main); font-size: 14px;">${nome}</span>
                        <span style="background: rgba(255,255,255,0.1); color: var(--text-muted); padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: auto; white-space: nowrap;">${nomeCounts[nome]} registro(s)</span>
                    </label>
                `;
            });

            const arrayNomesEncoded = encodeURIComponent(JSON.stringify(grupo));
            html += `</div>
                <button onclick="unificarNomesIrr(${idx}, '${arrayNomesEncoded}')" class="btn" style="background: rgba(236, 72, 153, 0.15); color: #ec4899; border: 1px solid rgba(236, 72, 153, 0.3); width: 100%;">🔗 Unificar selecionado</button>
            </div>`;
        });

        html += '</div>';
        container.innerHTML = html;

    } catch (e) {
        console.error(e);
        container.innerHTML = '<div style="color: #ef4444; font-size: 13px;">Erro ao analisar duplicatas.</div>';
    }
};

window.unificarNomesIrr = async function (idx, arrayEncoded) {
    const radios = document.getElementsByName(`grupo_${idx}`);
    let selecionado = null;
    for (let r of radios) {
        if (r.checked) { selecionado = r.value; break; }
    }

    if (!selecionado) {
        alert('Por favor, selecione qual é a grafia correta (oficial) antes de unificar.');
        return;
    }

    const { isConfirmed } = await Swal.fire({
        title: 'Unificar Nomes?',
        html: `Tem certeza que deseja atualizar todos os registros deste grupo para o nome:<br><br><strong>"${selecionado}"</strong><br><br>Essa ação não afeta os endereços ou o andamento das leituras.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ec4899',
        confirmButtonText: 'Sim, unificar'
    });
    if (!isConfirmed) {
        return;
    }

    const nomesDoGrupo = JSON.parse(decodeURIComponent(arrayEncoded));
    const nomesErrados = nomesDoGrupo.filter(n => n !== selecionado);

    try {
        for (let nomeErrado of nomesErrados) {
            // Supabase ilike fetch to get the ids
            const { data: recordsToUpdate } = await db.from('app_irradiacao_solicitacoes').select('id').ilike('nome_solicitado', nomeErrado);
            if (recordsToUpdate && recordsToUpdate.length > 0) {
                const ids = recordsToUpdate.map(r => r.id);
                const { error } = await db.from('app_irradiacao_solicitacoes').update({ nome_solicitado: selecionado }).in('id', ids);
                if (error) throw error;
            }
        }

        alert('Nomes unificados com sucesso!');
        carregarLimpezaIrradiacao(); // recarrega a tela
    } catch (e) {
        console.error(e);
        alert('Erro ao unificar nomes: ' + e.message);
    }
};

window.aprovarIrradiacao = function (id, nome, endereco, dias_semana) {
    const oldModal = document.getElementById('modalTriagemIrr');
    if (oldModal) oldModal.remove();

    const diasOpcoes = ['Segunda-feira', 'Terça-feira', 'Quarta-feira (Desobsessão)', 'Quarta-feira (Desencarnado)', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

    let opcoesDiaHtml = diasOpcoes.map(dia => `<option value="${dia}" ${dia === dias_semana ? 'selected' : ''}>${dia}</option>`).join('');

    const modalHtml = `
        <div id="modalTriagemIrr" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
            <div style="background: var(--bg-dark); border: 1px solid var(--border); border-radius: 12px; padding: 24px; width: 90%; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                <h3 style="color: var(--text-main); font-size: 18px; margin-bottom: 16px;">Triagem de Irradiação</h3>
                
                <div style="margin-bottom: 16px;">
                    <p style="margin:0; font-size: 14px; color: var(--text-muted);">Nome Solicitado:</p>
                    <p style="margin:0; font-weight: bold; color: white;">${nome}</p>
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="display:block; font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">Dia da Semana:</label>
                    <select id="triagemDia" style="width: 100%; padding: 8px 12px; border-radius: 8px; background: var(--bg-panel); border: 1px solid var(--border); color: white;">
                        ${opcoesDiaHtml}
                    </select>
                </div>

                <div style="margin-bottom: 24px;">
                    <label style="display:block; font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">Duração do Tratamento:</label>
                    <select id="triagemSemanas" style="width: 100%; padding: 8px 12px; border-radius: 8px; background: var(--bg-panel); border: 1px solid var(--border); color: white;">
                        <option value="4">4 Semanas (Padrão)</option>
                        <option value="16">16 Semanas (Longo)</option>
                    </select>
                </div>

                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button onclick="document.getElementById('modalTriagemIrr').remove()" class="btn btn-secondary">Cancelar</button>
                    <button onclick="confirmarTriagem('${id}')" class="btn btn-primary" style="background: #10b981; color: white; border: none;">Aprovar Pedido</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.confirmarTriagem = async function (id) {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    const diaSelecionado = document.getElementById('triagemDia').value;
    const semanasAlvo = parseInt(document.getElementById('triagemSemanas').value);

    try {
        const { error } = await db.from('app_irradiacao_solicitacoes').update({
            status: 'ativo',
            leituras: 0,
            dias_semana: diaSelecionado,
            semanas_alvo: semanasAlvo
        }).eq('id', id);

        if (error) throw error;

        document.getElementById('modalTriagemIrr').remove();
        await carregarListaIrradiacao();

    } catch (err) {
        console.error(err);
        Swal.fire('Aviso', 'Erro ao confirmar triagem. Verifique se a coluna semanas_alvo já foi criada no banco de dados. ' + (err.message || ''), 'error');
        btn.disabled = false;
        btn.textContent = 'Aprovar Pedido';
    }
}

window.marcarLeituraIrr = async function (btnElement, id, leituras_atuais, semanas_alvo) {
    try {
        const novaLeitura = leituras_atuais + 1;
        const card = document.getElementById(`card_irr_${id}`);

        // --- EFEITO VISUAL IMEDIATO (Optimistic UI) ---
        if (btnElement && btnElement.nodeType) {
            btnElement.disabled = true;
            btnElement.innerHTML = '✔️ Lido';
            btnElement.style.background = '#059669';
            btnElement.style.color = '#ffffff';
        }

        if (card) {
            // 1. Esmaece o card
            card.style.opacity = '0.5';
            card.style.borderColor = '#10b981';

            // 2. Anima a próxima bolinha vazia
            const proxBola = card.querySelector('.bola-irradiacao.vazia');
            if (proxBola) {
                proxBola.classList.remove('vazia');
                proxBola.classList.add('preenchida');
                proxBola.style.border = 'none';
                proxBola.style.background = '#10b981';
                proxBola.style.transform = 'scale(1.3)';
                setTimeout(() => {
                    proxBola.style.transform = 'scale(1)';
                }, 300);
            }
        }
        // ----------------------------------------------

        // Buscar log_datas_leituras atual
        const { data: rowData, error: fetchErr } = await db.from('app_irradiacao_solicitacoes').select('log_datas_leituras, renovacao_automatica').eq('id', id).single();
        if (fetchErr) throw fetchErr;

        let logs = rowData.log_datas_leituras || [];
        if (!Array.isArray(logs)) logs = [];
        logs.push(new Date().toISOString());

        const autoRenovarDB = rowData.renovacao_automatica === true;
        const chkElement = document.getElementById(`chk_renovar_${id}`);
        const autoRenovar = chkElement ? chkElement.checked : autoRenovarDB;

        if (novaLeitura >= semanas_alvo) {
            if (autoRenovar) {
                // Reinicia ciclo automaticamente
                const { error } = await db.from('app_irradiacao_solicitacoes').update({
                    leituras: 0,
                    status: 'ativo',
                    log_datas_leituras: logs
                }).eq('id', id);
                if (error) throw error;
                // Não chamamos carregarListaIrradiacao(); aqui para não perder o efeito visual
            } else {
                // Arquivar imediatamente
                try {
                    const { error } = await db.from('app_irradiacao_solicitacoes').update({
                        leituras: novaLeitura,
                        status: 'historico',
                        log_datas_leituras: logs
                    }).eq('id', id);
                    if (error) throw error;
                    if (card) card.style.display = 'none'; // Esconde o card pois foi pro histórico
                } catch (e) { 
                    console.error(e); 
                    alert('Erro ao arquivar'); 
                }
            }
        } else {
            // Apenas adiciona a leitura
            const { error } = await db.from('app_irradiacao_solicitacoes').update({
                leituras: novaLeitura,
                log_datas_leituras: logs
            }).eq('id', id);
            if (error) throw error;
            // Não chamamos carregarListaIrradiacao(); aqui para não perder o efeito visual
        }

    } catch (err) {
        console.error(err);
        alert('Erro ao marcar leitura');
        // Reverte o visual em caso de erro
        if (btnElement && btnElement.nodeType) {
            btnElement.disabled = false;
            btnElement.innerHTML = '✅ Registrar Leitura';
            btnElement.style.background = 'rgba(16,185,129,0.1)';
            btnElement.style.color = '#10b981';
        }
        const card = document.getElementById(`card_irr_${id}`);
        if (card) {
            card.style.opacity = '1';
            card.style.borderColor = 'var(--border)';
        }
    }
}

window.arquivarIrradiacao = async function (id) {
    Swal.fire({
        title: 'Forçar Arquivamento?',
        text: 'Deseja forçar o arquivamento deste nome mesmo antes do fim do ciclo?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f59e0b',
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Arquivar',
        background: 'var(--bg-panel)',
        color: 'var(--text-main)'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const { error } = await db.from('app_irradiacao_solicitacoes').update({ status: 'historico' }).eq('id', id);
                if (error) throw error;
                await carregarListaIrradiacao();
            } catch (err) { console.error(err); Swal.fire('Erro', 'Erro ao arquivar', 'error'); }
        }
    });
}

window.reativarIrradiacao = async function (id) {
    try {
        const { error } = await db.from('app_irradiacao_solicitacoes').update({ status: 'ativo', leituras: 0 }).eq('id', id);
        if (error) throw error;
        await carregarListaIrradiacao();
    } catch (err) { console.error(err); alert('Erro ao reativar'); }
}

window.excluirIrradiacaoDefinitivo = async function (id) {
    Swal.fire({
        title: 'Excluir Solicitação?',
        text: 'Atenção! Confirma exclusão DEFINITIVA do sistema?',
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Excluir',
        background: 'var(--bg-panel)',
        color: 'var(--text-main)'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const { error } = await db.from('app_irradiacao_solicitacoes').delete().eq('id', id);
                if (error) throw error;
                await carregarListaIrradiacao();
            } catch (err) { console.error(err); Swal.fire('Erro', 'Erro ao excluir.', 'error'); }
        }
    });
};

window.irradiacaoChartInstance = null;

window.imprimirEstatisticasIrr = function () {
    const style = document.createElement('style');
    style.id = 'printEstatisticasStyle';
    style.innerHTML = `
        @media print {
            body * { visibility: hidden !important; }
            #estatisticasContainer, #estatisticasContainer * { visibility: visible !important; }
            #estatisticasContainer { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
            #btnImprimirEstat { display: none !important; }
            
            /* Ajustes para forçar cores de fundo na impressão caso o navegador permita, e evitar quebra de cards */
            div { page-break-inside: avoid; }
            
            /* Garante que o canvas caiba na folha */
            #chartLeiturasMensais { max-width: 100% !important; height: auto !important; max-height: 400px !important; }
        }
    `;
    document.head.appendChild(style);

    // Pequeno delay para o navegador renderizar a tag <style>
    setTimeout(() => {
        window.print();
        // Remove a tag depois que a janela de impressão fecha
        setTimeout(() => {
            const s = document.getElementById('printEstatisticasStyle');
            if (s) s.remove();
        }, 1000);
    }, 200);
};

window.carregarEstatisticasIrradiacao = async function () {
    const container = document.getElementById('estatisticasContainer');
    container.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Processando dados, aguarde...</div>';

    try {
        const { data, error } = await db.from('app_irradiacao_solicitacoes').select('*');
        if (error) throw error;

        let totalAtivos = 0;
        let totalHistorico = 0;
        let totalPendentes = 0;
        const ativosPorDia = {};
        const historicoPorDia = {};
        const leiturasPorMes = {};
        const leiturasPorMesPorDia = {};
        const leiturasPorSemana = {};
        const leiturasPorSemanaPorDia = {};

        const pessoasUnicasAtivas = new Set();
        const pessoasUnicasHistorico = new Set();

        data.forEach(item => {
            const nomeStr = (item.nome_solicitado || '').trim().toUpperCase();

            if (item.status === 'ativo') {
                totalAtivos++;
                if (nomeStr) pessoasUnicasAtivas.add(nomeStr);
                ativosPorDia[item.dias_semana] = (ativosPorDia[item.dias_semana] || 0) + 1;
            } else if (item.status === 'historico') {
                totalHistorico++;
                if (nomeStr) pessoasUnicasHistorico.add(nomeStr);
                historicoPorDia[item.dias_semana] = (historicoPorDia[item.dias_semana] || 0) + 1;
            } else if (item.status === 'pendente') {
                totalPendentes++;
            }

            // Processar as leituras reais
            let logs = item.log_datas_leituras;
            if (typeof logs === 'string') {
                try { logs = JSON.parse(logs); } catch (e) { logs = []; }
            }
            if (Array.isArray(logs) && logs.length > 0) {
                const diaDaIrradiacao = item.dias_semana || 'Outros';
                logs.forEach(dateStr => {
                    const date = new Date(dateStr);
                    if (!isNaN(date)) {
                        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        leiturasPorMes[monthKey] = (leiturasPorMes[monthKey] || 0) + 1;
                        if (!leiturasPorMesPorDia[monthKey]) leiturasPorMesPorDia[monthKey] = {};
                        leiturasPorMesPorDia[monthKey][diaDaIrradiacao] = (leiturasPorMesPorDia[monthKey][diaDaIrradiacao] || 0) + 1;

                        const dCopy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                        const dayNum = dCopy.getUTCDay() || 7;
                        dCopy.setUTCDate(dCopy.getUTCDate() + 4 - dayNum);
                        const yearStart = new Date(Date.UTC(dCopy.getUTCFullYear(), 0, 1));
                        const weekNo = Math.ceil((((dCopy - yearStart) / 86400000) + 1) / 7);
                        const weekKey = `Semana ${weekNo} (${dCopy.getUTCFullYear()})`;

                        leiturasPorSemana[weekKey] = (leiturasPorSemana[weekKey] || 0) + 1;
                        if (!leiturasPorSemanaPorDia[weekKey]) leiturasPorSemanaPorDia[weekKey] = {};
                        leiturasPorSemanaPorDia[weekKey][diaDaIrradiacao] = (leiturasPorSemanaPorDia[weekKey][diaDaIrradiacao] || 0) + 1;
                    }
                });
            }
        });

        // Pessoas que concluíram mas continuam ativas em outro dia não devem ser contadas como totalmente concluídas
        pessoasUnicasAtivas.forEach(nome => {
            if (pessoasUnicasHistorico.has(nome)) {
                pessoasUnicasHistorico.delete(nome);
            }
        });

        // Sorting months
        const sortedMonths = Object.keys(leiturasPorMes).sort();
        const chartLabels = sortedMonths.map(m => {
            const [year, month] = m.split('-');
            const date = new Date(year, month - 1);
            return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        });
        const chartData = sortedMonths.map(m => leiturasPorMes[m]);

        // Render HTML
        const formatTable = (dict) => {
            if (Object.keys(dict).length === 0) return '<div style="color:var(--text-muted); font-size:13px;">Sem dados</div>';
            return Object.entries(dict).sort((a, b) => b[1] - a[1]).map(([dia, count]) => `
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding: 8px 0;">
                    <span style="color: var(--text-muted); font-size: 13px;">${dia}</span>
                    <strong style="color: var(--text-main); font-size: 14px;">${count}</strong>
                </div>
            `).join('');
        };

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="color: var(--primary); font-size: 18px; margin: 0;">Relatório de Estatísticas</h3>
                <button onclick="imprimirEstatisticasIrr()" id="btnImprimirEstat" class="btn btn-primary" style="padding: 8px 16px; border-radius: 8px; font-weight: 500;">🖨️ Imprimir / Salvar PDF</button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 20px; text-align: center;">
                    <h4 style="color: var(--text-muted); font-size: 13px; text-transform: uppercase; margin: 0 0 8px 0;">Pedidos Pendentes</h4>
                    <div style="font-size: 32px; font-weight: bold; color: #38bdf8;">${totalPendentes}</div>
                </div>
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 20px; text-align: center;">
                    <h4 style="color: var(--text-muted); font-size: 13px; text-transform: uppercase; margin: 0 0 8px 0;">Pessoas Ativas (Lendo)</h4>
                    <div style="font-size: 32px; font-weight: bold; color: #10b981;">${totalAtivos}</div>
                </div>
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 20px; text-align: center;">
                    <h4 style="color: var(--text-muted); font-size: 13px; text-transform: uppercase; margin: 0 0 8px 0;">Pessoas Concluídas (Histórico)</h4>
                    <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${totalHistorico}</div>
                </div>
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 20px; text-align: center;">
                    <h4 style="color: var(--text-muted); font-size: 13px; text-transform: uppercase; margin: 0 0 8px 0;">Total de Leituras Realizadas</h4>
                    <div style="font-size: 32px; font-weight: bold; color: #3b82f6;">${Object.values(leiturasPorMes).reduce((a, b) => a + b, 0)}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 16px;">
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 20px; text-align: center;">
                    <h4 style="color: var(--text-muted); font-size: 13px; text-transform: uppercase; margin: 0 0 8px 0;">Pessoas Únicas Ativas (Lendo)</h4>
                    <div style="font-size: 32px; font-weight: bold; color: #10b981;">${pessoasUnicasAtivas.size}</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Indivíduos sendo tratados independentemente do dia</div>
                </div>
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 20px; text-align: center;">
                    <h4 style="color: var(--text-muted); font-size: 13px; text-transform: uppercase; margin: 0 0 8px 0;">Pessoas Únicas Concluídas (Histórico)</h4>
                    <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${pessoasUnicasHistorico.size}</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Indivíduos que já concluíram ciclo independentemente do dia</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; margin-top: 16px;">
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 20px;">
                    <h4 style="color: #10b981; font-size: 14px; margin: 0 0 16px 0;">Ativos por Dia / Necessidade</h4>
                    ${formatTable(ativosPorDia)}
                </div>
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 20px;">
                    <h4 style="color: #f59e0b; font-size: 14px; margin: 0 0 16px 0;">Histórico por Dia / Necessidade</h4>
                    ${formatTable(historicoPorDia)}
                </div>
            </div>

            <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 20px; margin-top: 16px;">
                <h4 style="color: var(--text-main); font-size: 14px; margin: 0 0 16px 0;">Evolução de Leituras por Semana (Eixo do Tempo)</h4>
                <div style="position: relative; height: 350px; width: 100%;">
                    <canvas id="chartLeiturasSemanais"></canvas>
                </div>
            </div>

            <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 20px; margin-top: 16px;">
                <h4 style="color: var(--text-main); font-size: 14px; margin: 0 0 16px 0;">Evolução de Leituras por Mês (Esforço da Equipe)</h4>
                <div style="position: relative; height: 300px; width: 100%;">
                    <canvas id="chartLeiturasMensais"></canvas>
                </div>
            </div>
        `;

        if (window.irradiacaoChartInstance) {
            window.irradiacaoChartInstance.destroy();
        }

        const chartContainer = document.getElementById('chartLeiturasMensais');

        if (chartLabels.length === 0) {
            chartContainer.outerHTML = "<p style='color:var(--text-muted); text-align:center; padding: 24px;'>Nenhum dado encontrado para gerar gráfico.</p>";
        } else if (window.Chart) {
            const ctx = chartContainer.getContext('2d');

            const diasDisponiveis = [
                'Segunda-feira',
                'Terça-feira',
                'Quarta-feira (Desobsessão)',
                'Quarta-feira (Desencarnado)',
                'Quinta-feira',
                'Outros'
            ];

            const colors = [
                'rgba(59, 130, 246, 0.7)', // azul
                'rgba(16, 185, 129, 0.7)', // verde
                'rgba(245, 158, 11, 0.7)', // amarelo
                'rgba(236, 72, 153, 0.7)', // rosa
                'rgba(139, 92, 246, 0.7)', // roxo
                'rgba(148, 163, 184, 0.7)' // cinza
            ];

            const datasets = diasDisponiveis.map((dia, index) => {
                return {
                    label: dia,
                    data: sortedMonths.map(m => (leiturasPorMesPorDia[m] && leiturasPorMesPorDia[m][dia]) ? leiturasPorMesPorDia[m][dia] : 0),
                    backgroundColor: colors[index],
                    stack: 'Stack 0',
                    borderWidth: 0,
                    borderRadius: 4
                };
            }).filter(dataset => dataset.data.some(val => val > 0)); // Remove os dias que não tem nenhuma leitura

            // Adiciona a barra de Total do Mês (em uma pilha separada para ficar lado a lado)
            datasets.push({
                label: 'Total do Mês',
                data: sortedMonths.map(m => leiturasPorMes[m] || 0),
                backgroundColor: 'rgba(99, 102, 241, 0.35)', // Indigo
                borderColor: 'rgba(99, 102, 241, 0.8)',
                borderWidth: 1,
                stack: 'Stack 1',
                borderRadius: 4
            });

            window.irradiacaoChartInstance = new window.Chart(ctx, {
                type: 'bar',
                data: {
                    labels: chartLabels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            labels: { color: '#94a3b8', font: { size: 11 } }
                        }
                    },
                    scales: {
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            ticks: { color: '#94a3b8' },
                            grid: { color: 'rgba(255,255,255,0.05)' }
                        },
                        x: {
                            stacked: true,
                            ticks: { color: '#94a3b8' },
                            grid: { display: false }
                        }
                    }
                }
            });

            // --- INÍCIO DO GRÁFICO SEMANAL ---
            if (window.irradiacaoSemanalChartInstance) window.irradiacaoSemanalChartInstance.destroy();
            const canvasSemanal = document.getElementById('chartLeiturasSemanais');

            if (Object.keys(leiturasPorSemana).length === 0) {
                if (canvasSemanal) canvasSemanal.outerHTML = "<p style='color:var(--text-muted); text-align:center; padding: 24px;'>Nenhum dado encontrado para gerar gráfico semanal.</p>";
            } else if (canvasSemanal) {
                const ctxSemanal = canvasSemanal.getContext('2d');

                // Ordenar as semanas
                const sortedWeeks = Object.keys(leiturasPorSemana).sort((a, b) => {
                    const getVal = (s) => {
                        const m = s.match(/Semana (\d+) \((\d+)\)/);
                        if (m) return parseInt(m[2]) * 100 + parseInt(m[1]);
                        return 0;
                    };
                    return getVal(a) - getVal(b);
                });

                const labelsSemanal = sortedWeeks;

                const colorMap = {
                    'Segunda-feira': '#3b82f6',
                    'Terça-feira': '#10b981',
                    'Quarta-feira (Desobsessão)': '#f59e0b',
                    'Quarta-feira (Desencarnado)': '#ec4899',
                    'Quinta-feira': '#8b5cf6',
                    'Outros': '#94a3b8'
                };

                const bgMap = {
                    'Segunda-feira': 'rgba(59, 130, 246, 0.1)',
                    'Terça-feira': 'rgba(16, 185, 129, 0.1)',
                    'Quarta-feira (Desobsessão)': 'rgba(245, 158, 11, 0.1)',
                    'Quarta-feira (Desencarnado)': 'rgba(236, 72, 153, 0.1)',
                    'Quinta-feira': 'rgba(139, 92, 246, 0.1)',
                    'Outros': 'rgba(148, 163, 184, 0.1)'
                };

                const datasetsSemanal = diasDisponiveis.map(dia => {
                    return {
                        label: dia,
                        data: sortedWeeks.map(w => (leiturasPorSemanaPorDia[w] && leiturasPorSemanaPorDia[w][dia]) ? leiturasPorSemanaPorDia[w][dia] : 0),
                        borderColor: colorMap[dia] || '#94a3b8',
                        backgroundColor: bgMap[dia] || 'rgba(148, 163, 184, 0.1)',
                        borderWidth: 2,
                        pointBackgroundColor: colorMap[dia] || '#94a3b8',
                        tension: 0.3,
                        fill: false
                    };
                }).filter(dataset => dataset.data.some(val => val > 0)); // Remove os dias vazios

                window.irradiacaoSemanalChartInstance = new window.Chart(ctxSemanal, {
                    type: 'line',
                    data: {
                        labels: labelsSemanal,
                        datasets: datasetsSemanal
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                labels: { color: '#94a3b8', font: { size: 11 } }
                            },
                            tooltip: { mode: 'index', intersect: false }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { color: '#94a3b8' },
                                grid: { color: 'rgba(255,255,255,0.05)' }
                            },
                            x: {
                                ticks: { color: '#94a3b8' },
                                grid: { color: 'rgba(255,255,255,0.05)' }
                            }
                        }
                    }
                });
            }
            // --- FIM DO GRÁFICO SEMANAL ---

        } else {
            console.error("Chart.js is undefined.");
            chartContainer.outerHTML = "<p style='color:#ef4444; text-align:center; padding: 24px;'>Erro: Biblioteca Chart.js não foi carregada no navegador.</p>";
        }

    } catch (e) {
        console.error(e);
        container.innerHTML = '<div style="color: #ef4444;">Erro ao carregar estatísticas.</div>';
    }
}

window.abrirModalEdicaoIrradiacao = function (id, nome, endereco, dia, semanas) {
    const html = `
        <form onsubmit="window.salvarEdicaoIrradiacaoSideSheet(event, '${id}')" style="display: flex; flex-direction: column; gap: 16px;">
            <div>
                <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">Nome</label>
                <input type="text" id="editIrrNomeSS" value="${nome}" required class="input" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-dark); color: var(--text-main);">
            </div>
            <div>
                <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">Endereço</label>
                <input type="text" id="editIrrEnderecoSS" value="${endereco}" required class="input" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-dark); color: var(--text-main);">
            </div>
            <div>
                <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">Dia da Semana</label>
                <select id="editIrrDiaSS" class="input" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-dark); color: var(--text-main);">
                    <option value="Segunda-feira" ${dia === 'Segunda-feira' ? 'selected' : ''}>Segunda-feira</option>
                    <option value="Terça-feira" ${dia === 'Terça-feira' ? 'selected' : ''}>Terça-feira</option>
                    <option value="Quarta-feira (Desobsessão)" ${dia === 'Quarta-feira (Desobsessão)' ? 'selected' : ''}>Quarta-feira (Desobsessão)</option>
                    <option value="Quarta-feira (Desencarnado)" ${dia === 'Quarta-feira (Desencarnado)' ? 'selected' : ''}>Quarta-feira (Desencarnado)</option>
                    <option value="Quinta-feira" ${dia === 'Quinta-feira' ? 'selected' : ''}>Quinta-feira</option>
                </select>
            </div>
            <div>
                <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">Semanas Alvo</label>
                <input type="number" id="editIrrSemanasSS" value="${semanas}" required min="1" max="52" class="input" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-dark); color: var(--text-main);">
            </div>
            <div style="margin-top: 16px;">
                <button type="submit" class="btn" style="width: 100%; padding: 12px; border-radius: 8px; font-weight: 600; background: var(--sela-orange); border: none; color: white; cursor: pointer;">Salvar Alterações</button>
            </div>
        </form>
    `;
    window.abrirSideSheet('Editar Solicitação', html);
};

window.salvarEdicaoIrradiacaoSideSheet = async function (event, id) {
    event.preventDefault();

    const nome = document.getElementById('editIrrNomeSS').value.toUpperCase();
    const endereco = document.getElementById('editIrrEnderecoSS').value.toUpperCase();
    const dia = document.getElementById('editIrrDiaSS').value;
    const semanas = parseInt(document.getElementById('editIrrSemanasSS').value, 10);

    try {
        const { error } = await db.from('app_irradiacao_solicitacoes').update({
            nome_solicitado: nome,
            endereco: endereco,
            dias_semana: dia,
            semanas_alvo: semanas
        }).eq('id', id);

        if (error) throw error;

        window.fecharSideSheet();
        await carregarListaIrradiacao();

    } catch (err) {
        console.error(err);
        alert('Erro ao salvar as edições. Verifique a conexão.');
    }
};



// ==========================================
// MÓDULO WEB: ATENDIMENTO FRATERNO
// ==========================================
let currentAtendimentoMainTab = 'triagem';
let currentAtendimentoSubTab = 'fila';

window.mudarAbaPrincipalAtendimento = function (mainTab) {
    currentAtendimentoMainTab = mainTab;
    const mains = ['triagem', 'fichario', 'atendimento', 'acompanhamento', 'historico'];
    mains.forEach(m => {
        const btn = document.getElementById('btnMainAten' + m.charAt(0).toUpperCase() + m.slice(1));
        if (btn) {
            btn.style.background = m === mainTab ? 'var(--primary)' : 'transparent';
            btn.style.color = m === mainTab ? 'white' : 'var(--text-main)';
        }
    });

    if (mainTab === 'triagem') currentAtendimentoSubTab = 'fila';
    else if (mainTab === 'fichario') currentAtendimentoSubTab = 'A';
    else if (mainTab === 'atendimento') currentAtendimentoSubTab = 'andamento';
    else if (mainTab === 'acompanhamento') currentAtendimentoSubTab = 'tratamentos';
    else if (mainTab === 'historico') currentAtendimentoSubTab = 'historico_geral';

    renderizarSubAbasAtendimento();
    carregarListaAtendimento();
};

window.mudarSubAbaAtendimento = function (subTab) {
    currentAtendimentoSubTab = subTab;
    renderizarSubAbasAtendimento();
    carregarListaAtendimento();
};

function renderizarSubAbasAtendimento() {
    const container = document.getElementById('subTabsAtenContainer');
    if (!container) return;

    const baseStyle = "white-space: nowrap; border-radius: 20px; font-size: 13px; font-weight: 500; border: 1px solid var(--border); padding: 6px 14px; transition: all 0.2s; cursor: pointer; outline: none; ";
    const activeStyle = baseStyle + "background: rgba(99,102,241,0.15); color: var(--primary); border-color: rgba(99,102,241,0.4);";
    const inactiveStyle = baseStyle + "background: rgba(255,255,255,0.05); color: var(--text-muted);";

    if (currentAtendimentoMainTab === 'triagem') {
        container.style.display = 'flex';
        container.innerHTML = `
            <button onclick="mudarSubAbaAtendimento('fila')" style="${currentAtendimentoSubTab === 'fila' ? activeStyle : inactiveStyle}">📂 Fila Geral</button>
            <button onclick="mudarSubAbaAtendimento('espera')" style="${currentAtendimentoSubTab === 'espera' ? activeStyle : inactiveStyle}">🛋️ Sala de Espera</button>
        `;
    } else if (currentAtendimentoMainTab === 'fichario') {
        container.style.display = 'flex';
        let html = '';
        
        if (window.ficharioAvailableLetters) {
            const letras = Array.from(window.ficharioAvailableLetters).sort();
            if (letras.length === 0) {
                html = `<span style="font-size: 13px; color: var(--text-muted); margin: auto;">Nenhum registro no fichário.</span>`;
            } else {
                letras.forEach(L => {
                    html += `<button onclick="mudarSubAbaAtendimento('${L}')" style="${currentAtendimentoSubTab === L ? activeStyle : inactiveStyle}">${L}</button>`;
                });
            }
        } else {
            // Placeholder while loading
            html = `<span style="font-size: 13px; color: var(--text-muted); margin: auto;">Carregando fichário...</span>`;
        }
        
        container.innerHTML = html;
    } else if (currentAtendimentoMainTab === 'atendimento') {
        container.style.display = 'none';
    } else if (currentAtendimentoMainTab === 'acompanhamento') {
        container.style.display = 'flex';
        container.innerHTML = `
            <button onclick="mudarSubAbaAtendimento('tratamentos')" style="${currentAtendimentoSubTab === 'tratamentos' ? activeStyle : inactiveStyle}">🩹 Tratamentos Ativos</button>
            <button onclick="mudarSubAbaAtendimento('painelsemanal')" style="${currentAtendimentoSubTab === 'painelsemanal' ? activeStyle : inactiveStyle}">📊 Painel Semanal</button>
        `;
    } else if (currentAtendimentoMainTab === 'historico') {
        container.style.display = 'flex';
        container.innerHTML = `
            <button onclick="mudarSubAbaAtendimento('historico_geral')" style="${currentAtendimentoSubTab === 'historico_geral' ? activeStyle : inactiveStyle}">📜 Histórico Geral</button>
            <button onclick="mudarSubAbaAtendimento('estatisticas')" style="${currentAtendimentoSubTab === 'estatisticas' ? activeStyle : inactiveStyle}">📈 Estatísticas</button>
        `;
    }
}

let chartAtenMensalInstance = null;
let chartAtenSemanalInstance = null;
let chartAtenAtendentesInstance = null;

function renderizarGraficosAtendimento(allData) {
    const atendidos = allData.filter(d => d.status === 'Atendido' && d.data_hora_atendimento);

    // 1. Mensal
    const countsMensal = {};
    atendidos.forEach(item => {
        const d = new Date(item.data_hora_atendimento);
        const label = d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        const key = d.getFullYear() * 100 + d.getMonth();
        if (!countsMensal[key]) countsMensal[key] = { label: label, count: 0 };
        countsMensal[key].count++;
    });
    const sortedKeys = Object.keys(countsMensal).sort((a, b) => parseInt(a) - parseInt(b));
    const labelsMensal = sortedKeys.map(k => countsMensal[k].label.toUpperCase());
    const dataMensal = sortedKeys.map(k => countsMensal[k].count);

    // 2. Semanal (Dia da Semana)
    const countsSemanal = [0, 0, 0, 0, 0, 0, 0];
    atendidos.forEach(item => {
        const d = new Date(item.data_hora_atendimento);
        countsSemanal[d.getDay()]++;
    });
    const labelsSemanal = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO', 'DOMINGO'];
    const dataSemanal = [countsSemanal[1], countsSemanal[2], countsSemanal[3], countsSemanal[4], countsSemanal[5], countsSemanal[6], countsSemanal[0]];

    // 3. Atendentes
    const countsAtendentes = {};
    atendidos.forEach(item => {
        const name = item.pessoas?.nome_completo || 'Sem Atendente';
        if (!countsAtendentes[name]) countsAtendentes[name] = 0;
        countsAtendentes[name]++;
    });
    const sortedAtendentes = Object.keys(countsAtendentes)
        .map(name => ({ name: name.toUpperCase(), count: countsAtendentes[name] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    const labelsAtendentes = sortedAtendentes.map(x => x.name);
    const dataAtendentes = sortedAtendentes.map(x => x.count);

    // Render 1. Mensal
    const canvasMensal = document.getElementById('chartAtenMensal');
    if (canvasMensal) {
        if (chartAtenMensalInstance) chartAtenMensalInstance.destroy();
        chartAtenMensalInstance = new Chart(canvasMensal.getContext('2d'), {
            type: 'line',
            data: {
                labels: labelsMensal,
                datasets: [{
                    label: 'Atendimentos',
                    data: dataMensal,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: '#10b981',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'var(--text-muted)', font: { size: 10 } } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'var(--text-muted)', precision: 0, font: { size: 10 } }, beginAtZero: true }
                }
            }
        });
    }

    // Render 2. Semanal
    const canvasSemanal = document.getElementById('chartAtenSemanal');
    if (canvasSemanal) {
        if (chartAtenSemanalInstance) chartAtenSemanalInstance.destroy();
        chartAtenSemanalInstance = new Chart(canvasSemanal.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labelsSemanal,
                datasets: [{
                    data: dataSemanal,
                    backgroundColor: labelsSemanal.map(day => (day === 'TERÇA' || day === 'QUINTA') ? '#f59e0b' : '#3b82f6'),
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'var(--text-muted)', font: { size: 10 } } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'var(--text-muted)', precision: 0, font: { size: 10 } }, beginAtZero: true }
                }
            }
        });
    }

    // Render 3. Atendentes
    const canvasAtendentes = document.getElementById('chartAtenAtendentes');
    if (canvasAtendentes) {
        if (chartAtenAtendentesInstance) chartAtenAtendentesInstance.destroy();
        chartAtenAtendentesInstance = new Chart(canvasAtendentes.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labelsAtendentes,
                datasets: [{
                    data: dataAtendentes,
                    backgroundColor: '#8b5cf6',
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'var(--text-muted)', precision: 0, font: { size: 10 } }, beginAtZero: true },
                    y: { grid: { display: false }, ticks: { color: 'var(--text-muted)', font: { size: 10 } } }
                }
            }
        });
    }
}

window.carregarPainelGestaoAtendimento = function () {
    const container = document.getElementById('containerApps');

    container.innerHTML = `
        <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
            <div>
                <button onclick="carregarAppMiniApps()" class="btn btn-secondary" style="margin-bottom: 16px; font-size: 13px;">← Voltar aos Mini-Apps</button>
                <h2 style="font-size: 20px; color: #f59e0b; margin-bottom: 8px;">⚙️ Gestão de Atendimentos</h2>
                <p style="color: var(--text-muted); font-size: 14px;">Gerenciamento completo do Atendimento Fraterno (Presença, Triagem e Histórico).</p>
            </div>
        </div>

        <!-- Dashboard de Contadores Rápidos -->
        <div id="statsDashboard" style="display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;"></div>
        
        <div>
            <!-- Abas Principais -->
            <div class="no-scrollbar" style="display: flex; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 12px; overflow-x: auto;">
                <button onclick="mudarAbaPrincipalAtendimento('triagem')" id="btnMainAtenTriagem" class="btn" style="white-space: nowrap; border-radius: 8px; background: var(--primary); color: white; padding: 10px 20px;">📋 Triagem</button>
                <button onclick="mudarAbaPrincipalAtendimento('fichario')" id="btnMainAtenFichario" class="btn" style="white-space: nowrap; border-radius: 8px; background: transparent; color: var(--text-main); padding: 10px 20px;">🗂️ Fichário</button>
                <button onclick="mudarAbaPrincipalAtendimento('atendimento')" id="btnMainAtenAtendimento" class="btn" style="white-space: nowrap; border-radius: 8px; background: transparent; color: var(--text-main); padding: 10px 20px;">🧑‍🤝‍🧑 Atendimento Fraterno</button>
                <button onclick="mudarAbaPrincipalAtendimento('acompanhamento')" id="btnMainAtenAcompanhamento" class="btn" style="white-space: nowrap; border-radius: 8px; background: transparent; color: var(--text-main); padding: 10px 20px;">🔎 Tratamentos Fluídico e Espiritual</button>
                <button onclick="mudarAbaPrincipalAtendimento('historico')" id="btnMainAtenHistorico" class="btn" style="white-space: nowrap; border-radius: 8px; background: transparent; color: var(--text-main); padding: 10px 20px;">📊 Histórico</button>
            </div>
            
            <!-- Sub-abas -->
            <div id="subTabsAtenContainer" class="no-scrollbar" style="display: flex; gap: 8px; margin-bottom: 24px; padding-bottom: 12px; overflow-x: auto;">
                <!-- Injetado dinamicamente -->
            </div>
            
            <div id="loadingAten" style="color: var(--text-muted); font-size: 14px; margin-bottom: 16px;">Carregando lista...</div>
            
            <div id="listaAten" style="display: flex; flex-direction: column; gap: 12px;">
                <!-- Cards Injetados -->
            </div>
            
            <!-- Modal de Edição de Atendimento -->
            <div id="modalEdicaoAtendimento" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 24px; max-width: 400px; width: 90%;">
                    <h3 style="color: var(--primary); margin-top: 0; font-size: 18px;">✏️ Editar Solicitação</h3>
                    
                    <form id="formEdicaoAtendimento" onsubmit="salvarEdicaoAtendimento(event)">
                        <input type="hidden" id="editAtenId">
                        
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="color: var(--text-muted); font-size: 13px;">Nome Completo</label>
                            <input type="text" id="editAtenNome" required class="input" style="width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; padding: 8px; border-radius: 4px;">
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="color: var(--text-muted); font-size: 13px;">Endereço</label>
                            <textarea id="editAtenEndereco" class="input" rows="2" style="width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; padding: 8px; border-radius: 4px;"></textarea>
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="color: var(--text-muted); font-size: 13px;">WhatsApp</label>
                            <input type="text" id="editAtenWhats" class="input" style="width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; padding: 8px; border-radius: 4px;">
                        </div>

                        <div style="display: flex; gap: 12px; margin-top: 24px;">
                            <button type="submit" class="btn btn-primary" style="flex:1;">Salvar</button>
                            <button type="button" onclick="document.getElementById('modalEdicaoAtendimento').style.display='none'" class="btn btn-secondary" style="flex:1;">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal de Triagem -->
            <div id="modalTriagemAtendimento" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 24px; max-width: 400px; width: 90%;">
                    <h3 style="color: var(--primary); margin-top: 0; font-size: 18px;">🤝 Selecionar Atendente</h3>
                    
                    <form id="formTriagemAtendimento" onsubmit="salvarTriagemAtendimento(event)">
                        <input type="hidden" id="triagemAtenId">
                        
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="color: var(--text-muted); font-size: 13px;">Atendente Fraterno</label>
                            <select id="selectAtendenteAtendimento" required class="input" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.3); border: 1px solid var(--border); color: white; padding: 8px; border-radius: 4px;"></select>
                        </div>

                        <div style="display: flex; gap: 12px; margin-top: 24px;">
                            <button type="submit" class="btn btn-primary" style="flex:1;">Atribuir</button>
                            <button type="button" onclick="document.getElementById('modalTriagemAtendimento').style.display='none'" class="btn btn-secondary" style="flex:1;">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal de Conclusão -->
            <div id="modalConcluirAtendimento" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 24px; max-width: 400px; width: 90%;">
                    <h3 style="color: var(--primary); margin-top: 0; font-size: 18px;">✅ Concluir Atendimento</h3>
                    
                    <form id="formConcluirAtendimento" onsubmit="salvarConcluirAtendimento(event)">
                        <input type="hidden" id="concluirAtenId">
                        
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="color: var(--text-muted); font-size: 13px;">Data e Hora do Atendimento</label>
                            <input type="datetime-local" id="concluirAtenDataHora" required class="input" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.3); border: 1px solid var(--border); color: white; padding: 8px; border-radius: 4px;">
                        </div>

                        <div style="display: flex; gap: 12px; margin-top: 24px;">
                            <button type="submit" class="btn btn-primary" style="flex:1;">Confirmar Conclusão</button>
                            <button type="button" onclick="document.getElementById('modalConcluirAtendimento').style.display='none'" class="btn btn-secondary" style="flex:1;">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal de Ficha de Atendimento Fraterno -->
            <div id="modalFichaAtendimento" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px); overflow-y: auto;">
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 16px; padding: 24px; max-width: 600px; width: 90%; color: var(--text-main); position: relative; max-height: 90vh; overflow-y: auto;">
                    <button onclick="fecharModalFicha()" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.1); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center;">✕</button>
                    <h3 style="color: var(--primary); margin-top: 0; font-size: 18px; display: flex; align-items: center; gap: 8px;">🤝 Ficha de Atendimento</h3>
                    
                    <div id="fichaInfoPaciente" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; color: var(--text-muted);"></div>
                    
                    <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: var(--primary);">📜 Histórico de Atendimentos Fraternos</h4>
                    <div id="fichaHistoricoSessoes" style="margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px;"></div>

                    <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #3b82f6;">🗓️ Histórico de Tratamentos</h4>
                    <div id="fichaHistoricoPresencas" style="margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px; max-height: 140px; overflow-y: auto; background: rgba(0,0,0,0.1); border: 1px solid var(--border); padding: 8px; border-radius: 8px;"></div>
                    
                    <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #f59e0b;">➕ Nova Sessão de Atendimento</h4>
                    <textarea id="txtSintomasOrientacoes" placeholder="Escreva os sintomas identificados e as orientações fornecidas ao necessitado..." style="width: 100%; height: 100px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-dark); color: white; padding: 10px; font-size: 14px; font-family: inherit; resize: none; box-sizing: border-box; margin-bottom: 16px; outline: none;"></textarea>

                    <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #10b981;">🩹 Prescrever Tratamentos</h4>
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px;">
                            <input type="checkbox" id="chkTratFluidico" style="width: 16px; height: 16px; accent-color: var(--primary);"> Indicar <strong>Tratamento Fluídico</strong>
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px;">
                            <input type="checkbox" id="chkTratEspiritual" style="width: 16px; height: 16px; accent-color: var(--primary);"> Indicar <strong>Tratamento Energético/Espiritual</strong>
                        </label>
                    </div>
                    
                    <div style="display: flex; gap: 12px;">
                        <button onclick="salvarFichaAtendimento()" class="btn btn-primary" style="flex:1;">Gravar Sessão e Prescrever</button>
                        <button onclick="fecharModalFicha()" class="btn btn-secondary" style="flex:1;">Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('editAtenWhats').addEventListener('input', function (e) {
        var x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
        e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });

    renderizarSubAbasAtendimento();
    carregarListaAtendimento();
};

window.carregarListaAtendimento = async function () {
    const lista = document.getElementById('listaAten');
    if (!lista) return;

    document.getElementById('loadingAten').style.display = 'block';
    lista.innerHTML = '';

    try {
        const [fraternoReq, tratamentosReq] = await Promise.all([
            db.from('app_atendimento_fraterno').select('*, pessoas!atendente_id(id, nome_completo, nome_curto), paciente:pessoas!paciente_id(nome_completo, nome_curto, celular, endereco, bairro, cidade, estado, cep, cpf_cnpj, data_nascimento)'),
            db.from('app_atendimento_tratamentos').select('*, app_atendimento_fraterno(id, nome_completo, status, created_at, paciente:pessoas!paciente_id(*))').eq('status', 'Ativo')
        ]);
        if (fraternoReq.error) throw fraternoReq.error;
        if (tratamentosReq.error) throw tratamentosReq.error;

        let allData = fraternoReq.data;
        const allTratamentos = tratamentosReq.data;

        if (allData) {
            allData = allData.map(f => {
                if (f.paciente) {
                    f.nome_completo = f.paciente.nome_completo || f.nome_completo;
                    f.nome_curto = f.paciente.nome_curto || f.nome_completo.split(' ')[0];
                    f.telefone = f.paciente.celular || f.telefone;
                    f.endereco_completo = f.paciente.endereco || f.endereco_completo;
                    f.endereco = f.paciente.endereco || f.endereco_completo;
                    f.bairro = f.paciente.bairro || null;
                    f.cidade = f.paciente.cidade || null;
                    f.estado = f.paciente.estado || null;
                    f.data_nascimento = f.paciente.data_nascimento || f.data_nascimento;
                    f.cpf_cnpj = f.paciente.cpf_cnpj || null;
                    f.cep = f.paciente.cep || null;
                } else {
                    f.nome_curto = f.nome_completo ? f.nome_completo.split(' ')[0] : 'Sem nome';
                }
                return f;
            });
        }

        // Calculate available letters for Fichário
        const ficharioSet = new Set();
        (allData || []).forEach(d => {
            if (d.nome_completo) ficharioSet.add(d.nome_completo.trim().toUpperCase());
        });
        (allTratamentos || []).forEach(t => {
            if (t.app_atendimento_fraterno && t.app_atendimento_fraterno.nome_completo) {
                ficharioSet.add(t.app_atendimento_fraterno.nome_completo.trim().toUpperCase());
            }
        });
        
        window.ficharioAvailableLetters = new Set();
        ficharioSet.forEach(nome => {
            if (nome) window.ficharioAvailableLetters.add(nome.charAt(0).toUpperCase());
        });

        // Auto-select valid letter if in Fichário
        if (currentAtendimentoMainTab === 'fichario') {
            if (!window.ficharioAvailableLetters.has(currentAtendimentoSubTab)) {
                const letters = Array.from(window.ficharioAvailableLetters).sort();
                if (letters.length > 0) {
                    currentAtendimentoSubTab = letters[0];
                }
            }
            renderizarSubAbasAtendimento();
        }

        // Month calculations for current/past filter
        const now = new Date();
        const curYear = now.getFullYear();
        const curMonth = now.getMonth();

        // Calculate and render stats dashboard
        const atendidosMesTotal = allData.filter(item => {
            if (item.status !== 'Atendido' || !item.data_hora_atendimento) return false;
            const d = new Date(item.data_hora_atendimento);
            return d.getFullYear() === curYear && d.getMonth() === curMonth;
        });

        const activeTratCount = allTratamentos ? allTratamentos.length : 0;

        const statsContainer = document.getElementById('statsDashboard');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div style="flex: 1; min-width: 120px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 12px; text-align: center;">
                    <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">📂 Fila p/ Atendimento</div>
                    <div style="font-size: 18px; font-weight: bold; color: var(--primary);">${allData.filter(d => d.status !== 'Atendido' && d.status !== 'Em Tratamento' && d.status !== 'Concluído').length}</div>
                </div>
                <div style="flex: 1; min-width: 120px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 12px; text-align: center;">
                    <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">🛋️ Presentes (Espera)</div>
                    <div style="font-size: 18px; font-weight: bold; color: #f59e0b;">${allData.filter(d => d.presente && !d.atendente_id && d.status !== 'Atendido' && d.status !== 'Em Tratamento' && d.status !== 'Concluído').length + allTratamentos.filter(t => t.presente).length}</div>
                </div>
                <div style="flex: 1; min-width: 120px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 12px; text-align: center;">
                    <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">🧑‍🤝‍🧑 Em Atendimento (Sala)</div>
                    <div style="font-size: 18px; font-weight: bold; color: #3b82f6;">${allData.filter(d => d.presente && d.atendente_id && d.status !== 'Atendido' && d.status !== 'Em Tratamento' && d.status !== 'Concluído').length}</div>
                </div>
                <div style="flex: 1; min-width: 120px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 12px; text-align: center;">
                    <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">🩹 Em Tratamento (Ciclo)</div>
                    <div style="font-size: 18px; font-weight: bold; color: #10b981;">${activeTratCount}</div>
                </div>
            `;
        }

        if (currentAtendimentoSubTab === 'estatisticas') {
            lista.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 24px;">
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 12px; padding: 20px; min-height: 280px;">
                        <h4 style="margin-top: 0; color: var(--text-main); font-size: 14px; font-weight: 600; margin-bottom: 16px;">📈 Evolução Mensal</h4>
                        <div style="position: relative; height: 220px; width: 100%;">
                            <canvas id="chartAtenMensal"></canvas>
                        </div>
                    </div>
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 12px; padding: 20px; min-height: 280px;">
                        <h4 style="margin-top: 0; color: var(--text-main); font-size: 14px; font-weight: 600; margin-bottom: 16px;">📊 Atendimentos por Dia da Semana</h4>
                        <div style="position: relative; height: 220px; width: 100%;">
                            <canvas id="chartAtenSemanal"></canvas>
                        </div>
                    </div>
                </div>
                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 12px; padding: 20px; min-height: 320px;">
                    <h4 style="margin-top: 0; color: var(--text-main); font-size: 14px; font-weight: 600; margin-bottom: 16px;">🏆 Ranking de Atendimentos por Atendente (Top 10)</h4>
                    <div style="position: relative; height: 260px; width: 100%;">
                        <canvas id="chartAtenAtendentes"></canvas>
                    </div>
                </div>
            `;
            document.getElementById('loadingAten').style.display = 'none';
            setTimeout(() => renderizarGraficosAtendimento(allData), 50);
            return;
        }

        if (currentAtendimentoSubTab === 'fila' || currentAtendimentoSubTab === 'espera' || currentAtendimentoSubTab === 'andamento') {
            lista.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start;';
        } else {
            lista.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';
        }

        // Filter data for list
        let data = [];
        if (currentAtendimentoSubTab === 'fila' || currentAtendimentoSubTab === 'espera') {
            const isFila = currentAtendimentoSubTab === 'fila';

            const frats = allData.filter(d => isFila ? (!d.presente && !d.atendente_id && !['Atendido', 'Em Tratamento', 'Concluído'].includes(d.status)) : (d.presente && !d.atendente_id && !['Atendido', 'Em Tratamento', 'Concluído'].includes(d.status)))
                .map(d => ({ ...d, unified_type: 'Fraterno' }));
            
            const trats = allTratamentos.filter(d => isFila ? !d.presente : d.presente)
                .map(d => {
                    const pac = d.app_atendimento_fraterno?.paciente || {};
                    return {
                        id: d.id,
                        fraterno_id: d.atendimento_id,
                        unified_type: d.tipo,
                        nome_completo: pac.nome_completo || d.app_atendimento_fraterno?.nome_completo || '',
                        nome_curto: pac.nome_curto || '',
                        endereco_completo: pac.endereco || '',
                        endereco: pac.endereco || '',
                        bairro: pac.bairro || '',
                        cidade: pac.cidade || '',
                        estado: pac.estado || '',
                        telefone: pac.celular || '',
                        data_nascimento: pac.data_nascimento || '',
                        cpf_cnpj: pac.cpf_cnpj || '',
                        cep: pac.cep || '',
                        created_at: d.app_atendimento_fraterno?.created_at || d.created_at,
                        presente: d.presente,
                        status: d.status,
                        fraterno_status: d.app_atendimento_fraterno?.status,
                        is_tratamento: true
                    };
                });

            data = [...frats, ...trats];
            
            const orderType = { 'Fraterno': 1, 'Fluídico': 2, 'Espiritual': 3 };
            data.sort((a, b) => {
                const oa = orderType[a.unified_type] || 99;
                const ob = orderType[b.unified_type] || 99;
                if (oa !== ob) return oa - ob;
                return (a.nome_completo || '').localeCompare(b.nome_completo || '');
            });

        } else if (currentAtendimentoSubTab === 'andamento') {
            data = allData.filter(d => d.atendente_id && !['Atendido', 'Em Tratamento', 'Concluído'].includes(d.status));
        } else if (currentAtendimentoSubTab === 'historico_geral') {
            document.getElementById('loadingAten').style.display = 'none';
            carregarHistoricoGeralDesktop();
            return;
        } else if (currentAtendimentoSubTab === 'tratamentos') {
            document.getElementById('loadingAten').style.display = 'none';
            carregarTratamentosAtivosDesktop();
            return;
        } else if (currentAtendimentoSubTab === 'presencas') {
            document.getElementById('loadingAten').style.display = 'none';
            carregarFilaPresencasDesktop();
            return;
        } else if (currentAtendimentoSubTab === 'espera_tratamento') {
            document.getElementById('loadingAten').style.display = 'none';
            carregarEsperaTratamentoDesktop();
            return;
        } else if (currentAtendimentoSubTab === 'painelsemanal') {
            document.getElementById('loadingAten').style.display = 'none';
            carregarPainelSemanalDesktop();
            return;
        } else if (currentAtendimentoMainTab === 'fichario') {
            document.getElementById('loadingAten').style.display = 'none';
            carregarFicharioDesktop(allData, allTratamentos);
            return;
        }

        document.getElementById('loadingAten').style.display = 'none';

        if (!data || data.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.style.cssText = 'padding: 24px; text-align: center; background: rgba(255,255,255,0.02); border: 1px dashed var(--border); border-radius: 8px; color: var(--text-muted);';
            emptyEl.textContent = 'Nenhum registro encontrado.';
            lista.appendChild(emptyEl);
            return;
        }

        if (currentAtendimentoSubTab === 'fila' || currentAtendimentoSubTab === 'espera') {
            let currentType = null;
            data.forEach(item => {
                if (item.unified_type !== currentType) {
                    currentType = item.unified_type;
                    const typeColor = currentType === 'Fraterno' ? '#f59e0b' : (currentType === 'Fluídico' ? '#3b82f6' : '#8b5cf6');
                    const header = document.createElement('div');
                    header.style.cssText = `grid-column: 1 / -1; margin-top: 16px; margin-bottom: 8px; font-weight: bold; color: ${typeColor}; font-size: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px; display: flex; align-items: center; gap: 8px;`;
                    header.innerHTML = `<span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:${typeColor};"></span> ${currentType.toUpperCase()}`;
                    lista.appendChild(header);
                }
                renderizarCardAtendimentoItem(lista, item);
            });
        } else if (currentAtendimentoSubTab === 'andamento') {
            data.sort((a, b) => {
                const attA = (a.pessoas?.nome_completo || 'Sem Atendente').toLowerCase();
                const attB = (b.pessoas?.nome_completo || 'Sem Atendente').toLowerCase();
                if (attA !== attB) return attA.localeCompare(attB);
                return (a.nome_completo || '').toLowerCase().localeCompare((b.nome_completo || '').toLowerCase());
            });

            let currentAttendant = null;
            data.forEach(item => {
                const attendantName = item.pessoas?.nome_completo || 'Atendente não definido';
                if (attendantName !== currentAttendant) {
                    currentAttendant = attendantName;
                    const header = document.createElement('div');
                    header.style.cssText = 'grid-column: 1 / -1; margin-top: 16px; margin-bottom: 8px; font-weight: bold; color: var(--primary); font-size: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;';
                    header.innerHTML = `👨‍💼 Atendente: ${currentAttendant.toUpperCase()}`;
                    lista.appendChild(header);
                }
                renderizarCardAtendimentoItem(lista, item);
            });
        } else {
            // Completed (Atendidos) Grouped by Year/Month
            data.sort((a, b) => new Date(b.data_hora_atendimento || b.created_at) - new Date(a.data_hora_atendimento || a.created_at));

            let currentMonthYear = null;
            data.forEach(item => {
                const dateVal = new Date(item.data_hora_atendimento || item.created_at);
                const monthYearStr = dateVal.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();

                if (monthYearStr !== currentMonthYear) {
                    currentMonthYear = monthYearStr;
                    const header = document.createElement('div');
                    header.style.cssText = 'margin-top: 16px; margin-bottom: 8px; font-weight: bold; color: #10b981; font-size: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;';
                    header.innerHTML = `📅 ${currentMonthYear}`;
                    lista.appendChild(header);
                }
                renderizarCardAtendimentoItem(lista, item);
            });
        }

    } catch (e) {
        console.error(e);
        document.getElementById('loadingAten').innerHTML = '<span style="color:#ef4444;">Erro ao carregar lista.</span>';
    }
};

window.alternarPresencaAtendimento = async function (id, presente) {
    try {
        const { error } = await db.from('app_atendimento_fraterno').update({ presente: presente }).eq('id', id);
        if (error) throw error;
        carregarListaAtendimento();
    } catch (err) {
        alert('Erro ao atualizar presença: ' + err.message);
    }
};

function renderizarCardAtendimentoItem(container, item) {
    const d = new Date(item.created_at);
    const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    let ageInfo = '';
    if (item.data_nascimento) {
        const age = calcularIdade(item.data_nascimento);
        ageInfo = ` (${age} anos)`;
    }

    let whatsLink = '';
    if (item.telefone) {
        const nums = item.telefone.replace(/\D/g, '');
        whatsLink = `
            <a href="https://web.whatsapp.com/send?phone=55${nums}" target="_blank" class="btn" style="padding: 4px 8px; font-size: 12px; background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); text-decoration: none;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                WhatsApp
            </a>
        `;
    }

    const card = document.createElement('div');
    const isGrid = (currentAtendimentoSubTab === 'fila' || currentAtendimentoSubTab === 'espera');

    card.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 16px; display: flex; flex-direction: row; justify-content: space-between; align-items: flex-start; gap: 16px; transition: all 0.2s;';
    
    card.onmouseover = () => card.style.background = 'rgba(255,255,255,0.05)';
    card.onmouseout = () => card.style.background = 'rgba(255,255,255,0.03)';

    let infoExtra = '';
    if (item.status === 'Atendido' && item.data_hora_atendimento) {
        const dtAtendido = new Date(item.data_hora_atendimento).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        infoExtra = `<div style="margin-top: 8px; color: #10b981; font-weight: 500; font-size: 13px;">✓ Atendido em: ${dtAtendido} por ${item.pessoas?.nome_completo || 'Atendente'}</div>`;
    } else if (item.status === 'Planejado' && item.pessoas?.nome_completo) {
        infoExtra = `<div style="margin-top: 8px; color: var(--primary); font-weight: 500; font-size: 13px;">📅 Atribuído a: ${item.pessoas.nome_completo}</div>`;
    }

    const btnPresenca = item.presente ?
        `<button class="btn" onclick="alternarPresencaAtendimento('${item.id}', false)" style="width: 100%; font-size: 12px; padding: 10px; background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; transition: all 0.2s; font-weight: 600;" onmouseover="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.color='#ef4444'; this.style.borderColor='rgba(239, 68, 68, 0.3)'; this.textContent='🔴 Remover Presença';" onmouseout="this.style.background='rgba(16, 185, 129, 0.1)'; this.style.color='#10b981'; this.style.borderColor='rgba(16, 185, 129, 0.3)'; this.textContent='🟢 Presente';">🟢 Presente</button>` :
        `<button class="btn" onclick="alternarPresencaAtendimento('${item.id}', true)" style="width: 100%; font-size: 12px; padding: 10px; background: rgba(255,255,255,0.1); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; transition: all 0.2s; font-weight: 500;">⚪ Confirmar Presença</button>`;

    // Container for buttons: giving much more space to the left side (data)
    const buttonsContainerStyle = 'display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; min-width: 170px;';

    let badgeHtml = '';
    if (item.fraterno_status === 'Em Tratamento' || item.status === 'Em Tratamento') {
        badgeHtml = `<span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); margin-left: 8px; vertical-align: middle; white-space: nowrap;">EM TRATAMENTO</span>`;
    }

    const shortName = item.nome_curto || (item.nome_completo ? item.nome_completo.split(' ')[0] : 'Sem nome');
    const endPartes = [];
    if (item.endereco) endPartes.push(item.endereco);
    else if (item.endereco_completo) endPartes.push(item.endereco_completo);
    if (item.bairro) endPartes.push(item.bairro);
    let cidEst = [];
    if (item.cidade) cidEst.push(item.cidade);
    if (item.estado) cidEst.push(item.estado);
    if (cidEst.length > 0) endPartes.push(cidEst.join('/'));
    const endFull = endPartes.length > 0 ? endPartes.join(', ') : 'Sem endereço';

    let leftInfo = `
        <div style="display: flex; flex-direction: column; gap: 6px; flex: 1;">
            <div style="display: flex; flex-direction: column; margin-bottom: 4px;">
                <div>
                    <strong style="font-size: 16px; color: var(--text-main); line-height: 1.2; vertical-align: middle;">${item.nome_completo.toUpperCase()}</strong>
                    ${badgeHtml}
                </div>
                <span style="font-size: 12px; color: var(--text-muted); font-weight: 500; margin-top: 2px;">${shortName}</span>
            </div>
            
            <div style="font-size: 13px; color: var(--text-muted);">📍 ${endFull}${item.cep ? ' - CEP: ' + formatarCEP(item.cep) : ''}</div>
            <div style="font-size: 13px; color: var(--text-muted);">🎂 Nascimento: ${item.data_nascimento ? item.data_nascimento.split('-').reverse().join('/') + ` (${calcularIdade(item.data_nascimento)} anos)` : 'Não informada'}</div>
            <div style="font-size: 13px; color: var(--text-muted);">📄 CPF: ${item.cpf_cnpj ? formatarCPF(item.cpf_cnpj) : 'Não informado'}</div>
            <div style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-muted); margin-top: 2px;">
                <span>📱 Celular: ${item.telefone ? formatarCelular(item.telefone) : 'Não informado'}</span>
                ${whatsLink}
            </div>
            <div style="font-size: 11px; margin-top: 10px; padding: 4px 10px; background: rgba(255,255,255,0.05); border-radius: 12px; color: var(--text-muted); display: inline-block; width: fit-content;">Em ${dateStr}${item.criado_por ? ' por ' + item.criado_por : ''}</div>
            ${infoExtra}
        </div>
    `;

    let buttonsHtml = '';
    
    if (currentAtendimentoSubTab === 'fila' || currentAtendimentoSubTab === 'espera') {
        if (item.is_tratamento) {
            const btnPresencaTrat = item.presente ?
                `<button class="btn" onclick="marcarTratamentoPresente('${item.id}', false)" style="width: 100%; font-size: 12px; padding: 10px; background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; transition: all 0.2s; font-weight: 600;" onmouseover="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.color='#ef4444'; this.style.borderColor='rgba(239, 68, 68, 0.3)'; this.textContent='🔴 Remover Presença';" onmouseout="this.style.background='rgba(16, 185, 129, 0.1)'; this.style.color='#10b981'; this.style.borderColor='rgba(16, 185, 129, 0.3)'; this.textContent='🟢 Presente';">🟢 Presente</button>` :
                `<button class="btn" onclick="marcarTratamentoPresente('${item.id}', true)" style="width: 100%; font-size: 12px; padding: 10px; background: rgba(255,255,255,0.1); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; transition: all 0.2s; font-weight: 500;">⚪ Confirmar Presença</button>`;
            
            buttonsHtml = `
                <div style="${buttonsContainerStyle}">
                    ${btnPresencaTrat}
                </div>
            `;
        } else {
            buttonsHtml = `
                <div style="${buttonsContainerStyle}">
                    ${item.status !== 'Atendido' ? btnPresenca : '<div></div>'}
                    
                    ${(item.status === 'Pendente' || item.status === 'Planejado') ? `
                        <button class="btn" onclick="abrirTriagemAtendimento('${item.id}')" style="font-size: 12px; padding: 10px; background: rgba(146, 96, 52, 0.4); color: #fbbf24; border: 1px solid rgba(146, 96, 52, 0.6); border-radius: 8px; width: 100%; font-weight: 600;">🤝 Triagem</button>
                    ` : ''}

                    <div style="display: flex; gap: 8px; width: 100%; justify-content: center; margin-top: 2px;">
                        ${item.status !== 'Atendido' ? `
                            <button class="btn" onclick="abrirEdicaoAtendimento('${item.id}', '${(item.nome_completo || '').replace(/'/g, "\\'").replace(/[\r\n]+/g, ' ')}', '${(item.endereco_completo || '').replace(/'/g, "\\'").replace(/[\r\n]+/g, ' ')}', '${(item.telefone || '').replace(/'/g, "\\'")}')" style="font-size: 14px; padding: 8px; background: transparent; color: #fbbf24; border: 1px solid #fbbf24; border-radius: 8px; flex: 1; display: flex; justify-content: center;">✏️</button>
                        ` : ''}
                        <button class="btn" onclick="excluirAtendimento('${item.id}')" style="font-size: 14px; padding: 8px; background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; flex: 1; display: flex; justify-content: center;">🗑️</button>
                    </div>
                </div>
            `;
        }
    } else if (currentAtendimentoSubTab === 'andamento') {
        buttonsHtml = `
            <div style="grid-column: 1 / -1;">
                ${item.status !== 'Atendido' ? btnPresenca : ''}
            </div>
            
            ${item.status === 'Planejado' && item.presente ? `
                <button class="btn" onclick="abrirFichaAtendimento('${item.id}')" style="font-size: 12px; padding: 10px; background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px;">📝 Ficha</button>
            ` : '<div></div>'}
            
            ${item.status !== 'Atendido' ? `
                <button class="btn" onclick="abrirEdicaoAtendimento('${item.id}', '${(item.nome_completo || '').replace(/'/g, "\\'").replace(/[\r\n]+/g, ' ')}', '${(item.endereco_completo || '').replace(/'/g, "\\'").replace(/[\r\n]+/g, ' ')}', '${(item.telefone || '').replace(/'/g, "\\'")}')" style="font-size: 14px; padding: 10px; background: transparent; color: var(--primary); border: 1px solid var(--primary); border-radius: 8px;">✏️</button>
            ` : '<div></div>'}
            
            ${item.status === 'Planejado' ? `
                <button class="btn" onclick="desatribuirAtendenteAtendimento('${item.id}')" style="font-size: 12px; padding: 10px; background: rgba(239, 68, 68, 0.05); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px;">👤✕ Desatribuir</button>
            ` : '<div></div>'}
            
            <button class="btn" onclick="excluirAtendimento('${item.id}')" style="font-size: 14px; padding: 10px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px;">🗑️</button>
        `;
    } else {
        // Fallback for Historico
        buttonsHtml = `
            ${item.status !== 'Atendido' ? btnPresenca : ''}
            
            <button class="btn" onclick="abrirFichaAtendimento('${item.id}')" style="font-size: 12px; padding: 10px; background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px;">📝 Ficha</button>

            ${item.status !== 'Atendido' ? `
                <button class="btn" onclick="abrirEdicaoAtendimento('${item.id}', '${(item.nome_completo || '').replace(/'/g, "\\'").replace(/[\r\n]+/g, ' ')}', '${(item.endereco_completo || '').replace(/'/g, "\\'").replace(/[\r\n]+/g, ' ')}', '${(item.telefone || '').replace(/'/g, "\\'")}')" style="font-size: 12px; padding: 10px; background: transparent; color: var(--primary); border: 1px solid var(--primary); border-radius: 8px;">✏️ Editar</button>
            ` : ''}
            
            ${(item.status === 'Pendente' || (item.status === 'Planejado' && currentAtendimentoSubTab !== 'andamento')) ? `
                <button class="btn" onclick="abrirTriagemAtendimento('${item.id}')" style="font-size: 12px; padding: 10px; background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px;">🤝 Triagem</button>
            ` : ''}
            
            <button class="btn" onclick="excluirAtendimento('${item.id}')" style="font-size: 12px; padding: 10px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px;">🗑️ Excluir</button>
        `;
    }

    card.innerHTML = `
        <div style="flex: 1;">
            ${leftInfo}
        </div>
        
        <div style="${buttonsContainerStyle}">
            ${buttonsHtml}
        </div>
    `;

    container.appendChild(card);
}

window.desatribuirAtendenteAtendimento = async function (id) {
    Swal.fire({
        title: 'Desatribuir Atendente?',
        text: "O paciente voltará para a fila de espera.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f59e0b',
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Desatribuir',
        background: 'var(--bg-panel)',
        color: 'var(--text-main)'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const { error } = await db.from('app_atendimento_fraterno').update({
                    atendente_id: null,
                    status: 'Pendente'
                }).eq('id', id);

                if (error) throw error;
                carregarListaAtendimento();
            } catch (err) {
                Swal.fire('Erro', 'Erro ao remover atribuição: ' + err.message, 'error');
            }
        }
    });
};

window.abrirEdicaoAtendimento = function (id, nome, endereco, fone) {
    const html = `
        <form onsubmit="salvarEdicaoAtendimentoSideSheet(event, '${id}')" style="display: flex; flex-direction: column; gap: 16px; height: 100%;">
            <div style="flex: 1; display: flex; flex-direction: column; gap: 16px;">
                <div class="form-group">
                    <label style="color: var(--text-muted); font-size: 13px;">Nome Completo</label>
                    <input type="text" id="sideEditAtenNome" required value="${nome}" class="input" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: white; padding: 12px; border-radius: 8px;">
                </div>
                
                <div class="form-group">
                    <label style="color: var(--text-muted); font-size: 13px;">Endereço</label>
                    <textarea id="sideEditAtenEndereco" class="input" rows="3" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: white; padding: 12px; border-radius: 8px;">${endereco}</textarea>
                </div>
                
                <div class="form-group">
                    <label style="color: var(--text-muted); font-size: 13px;">WhatsApp</label>
                    <input type="text" id="sideEditAtenWhats" value="${fone}" class="input" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: white; padding: 12px; border-radius: 8px;">
                </div>
            </div>

            <div style="margin-top: auto; padding-top: 24px; border-top: 1px solid var(--border); display: flex; gap: 12px;">
                <button type="button" onclick="window.fecharSideSheet()" class="btn" style="flex:1; padding: 12px; border-radius: 8px; background: transparent; color: var(--text-main); border: 1px solid var(--border);">Cancelar</button>
                <button type="submit" class="btn" style="flex:1; padding: 12px; border-radius: 8px; background: var(--primary); color: white; border: none; font-weight: 600;">Salvar Alterações</button>
            </div>
        </form>
    `;
    window.abrirSideSheet('Editar Solicitação', html);

    // Apply mascara de whatsapp
    setTimeout(() => {
        const whatsInput = document.getElementById('sideEditAtenWhats');
        if (whatsInput) {
            whatsInput.addEventListener('input', function (e) {
                var x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
                e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
            });
        }
    }, 100);
};

window.salvarEdicaoAtendimentoSideSheet = async function (e, id) {
    e.preventDefault();
    const nome = document.getElementById('sideEditAtenNome').value;
    const end = document.getElementById('sideEditAtenEndereco').value;
    const fone = document.getElementById('sideEditAtenWhats').value;

    try {
        const { data: oldData } = await db.from('app_atendimento_fraterno').select('paciente_id').eq('id', id).single();
        if (oldData && oldData.paciente_id) {
            await db.from('app_pacientes').update({
                nome_completo: nome,
                endereco_completo: end,
                telefone: fone
            }).eq('id', oldData.paciente_id);
        }

        const { error } = await db.from('app_atendimento_fraterno').update({
            nome_completo: nome,
            endereco_completo: end,
            telefone: fone
        }).eq('id', id);

        if (error) throw error;
        window.fecharSideSheet();
        carregarListaAtendimento();
    } catch (err) {
        Swal.fire('Aviso', 'Erro ao salvar edição: ' + err.message, 'error');
    }
};

window.abrirTriagemAtendimento = async function (id) {
    const html = `
        <form onsubmit="salvarTriagemAtendimentoSideSheet(event, '${id}')" style="display: flex; flex-direction: column; gap: 16px; height: 100%;">
            <div style="flex: 1; display: flex; flex-direction: column; gap: 16px;">
                <div class="form-group">
                    <label style="color: var(--text-muted); font-size: 13px;">Atendente Fraterno</label>
                    <select id="sideSelectAtendenteAtendimento" required class="input" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: white; padding: 12px; border-radius: 8px;">
                        <option value="">Carregando atendentes...</option>
                    </select>
                </div>
            </div>

            <div style="margin-top: auto; padding-top: 24px; border-top: 1px solid var(--border); display: flex; gap: 12px;">
                <button type="button" onclick="window.fecharSideSheet()" class="btn" style="flex:1; padding: 12px; border-radius: 8px; background: transparent; color: var(--text-main); border: 1px solid var(--border);">Cancelar</button>
                <button type="submit" class="btn" style="flex:1; padding: 12px; border-radius: 8px; background: var(--primary); color: white; border: none; font-weight: 600;">Atribuir</button>
            </div>
        </form>
    `;
    window.abrirSideSheet('🤝 Selecionar Atendente', html);

    try {
        const { data, error } = await db
            .from('pessoas')
            .select('id, nome_completo, nome_curto')
            .contains('perfis', ['Atendente Fraterno']);

        if (error) throw error;

        const select = document.getElementById('sideSelectAtendenteAtendimento');
        if (!select) return;

        if (!data || data.length === 0) {
            select.innerHTML = '<option value="">Nenhum Atendente Fraterno cadastrado</option>';
            return;
        }

        data.sort((a, b) => (a.nome_curto || a.nome_completo).localeCompare(b.nome_curto || b.nome_completo));

        select.innerHTML = '<option value="">Selecione um atendente...</option>' +
            data.map(p => `<option value="${p.id}">${p.nome_curto || p.nome_completo}</option>`).join('');
    } catch (err) {
        console.error(err);
        const select = document.getElementById('sideSelectAtendenteAtendimento');
        if (select) select.innerHTML = '<option value="">Erro ao carregar atendentes</option>';
    }
};

window.salvarTriagemAtendimentoSideSheet = async function (e, id) {
    e.preventDefault();
    const atendenteId = document.getElementById('sideSelectAtendenteAtendimento').value;

    if (!atendenteId) {
        Swal.fire('Aviso', 'Por favor, selecione um atendente.', 'warning');
        return;
    }

    try {
        const { error } = await db
            .from('app_atendimento_fraterno')
            .update({
                atendente_id: atendenteId,
                status: 'Planejado'
            })
            .eq('id', id);

        if (error) throw error;

        window.fecharSideSheet();
        carregarListaAtendimento();
    } catch (err) {
        Swal.fire('Erro', 'Erro ao salvar triagem: ' + err.message, 'error');
    }
};

window.abrirConcluirAtendimento = function (id) {
    document.getElementById('concluirAtenId').value = id;

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('concluirAtenDataHora').value = now.toISOString().slice(0, 16);

    document.getElementById('modalConcluirAtendimento').style.display = 'flex';
};

window.salvarConcluirAtendimento = async function (e) {
    e.preventDefault();
    const id = document.getElementById('concluirAtenId').value;
    const dataHora = document.getElementById('concluirAtenDataHora').value;

    if (!dataHora) {
        Swal.fire('Aviso', 'Por favor, informe a data/hora.', 'warning');
        return;
    }

    try {
        const { error } = await db
            .from('app_atendimento_fraterno')
            .update({
                status: 'Atendido',
                data_hora_atendimento: new Date(dataHora).toISOString()
            })
            .eq('id', id);

        if (error) throw error;
        document.getElementById('modalConcluirAtendimento').style.display = 'none';
        carregarListaAtendimento();
    } catch (err) {
        Swal.fire('Erro', 'Erro ao concluir atendimento: ' + err.message, 'error');
    }
};

window.excluirAtendimento = async function (id) {
    Swal.fire({
        title: 'Excluir Solicitação?',
        text: "Tem certeza que deseja apagar este pedido definitivamente?",
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Excluir',
        background: 'var(--bg-panel)',
        color: 'var(--text-main)'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const { error } = await db.from('app_atendimento_fraterno').delete().eq('id', id);
                if (error) throw error;
                carregarListaAtendimento();
            } catch (err) {
                Swal.fire('Erro', 'Erro ao excluir: ' + err.message, 'error');
            }
        }
    });
};


window.abrirFormularioAtendimento = function () {
    const container = document.getElementById('containerApps');

    container.innerHTML = `
        <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
            <div>
                <button onclick="carregarAppMiniApps()" class="btn btn-secondary" style="margin-bottom: 16px; font-size: 13px;">← Voltar aos Mini-Apps</button>
                <h2 style="font-size: 20px; color: #3b82f6; margin-bottom: 8px;">🤝 Atendimento Fraterno</h2>
                <p style="color: var(--text-muted); font-size: 14px;">Novo pedido de Atendimento Fraterno.</p>
            </div>
        </div>

        <div style="background: rgba(59, 130, 246, 0.05); border: 1px solid var(--border); border-radius: 12px; padding: 24px; max-width: 600px;">
            <h3 style="color: var(--primary); margin-bottom: 16px;">📝 Novo Pedido - via Portal</h3>
            <form id="formAtendimentoWeb" style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 6px;">Nome Completo *</label>
                    <input type="text" id="inAtenNome" required class="input-field" placeholder="DIGITE O NOME COMPLETO" style="width: 100%; text-transform: uppercase;" list="listaNomesAten">
                    <datalist id="listaNomesAten"></datalist>
                </div>
                <div>
                    <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 6px;">Endereço Completo</label>
                    <input type="text" id="inAtenEndereco" class="input-field" placeholder="RUA, NÚMERO, BAIRRO, CIDADE" style="width: 100%; text-transform: uppercase;">
                </div>
                <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px;">
                        <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 6px;">Data de Nascimento</label>
                        <input type="date" id="inAtenNasc" class="input-field" style="width: 100%; color: white;">
                    </div>
                    <div style="flex: 1; min-width: 200px;">
                        <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 6px;">WhatsApp / Celular</label>
                        <input type="text" id="inAtenWhats" class="input-field" placeholder="(XX) XXXXX-XXXX" style="width: 100%;">
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
                    <button type="submit" class="btn btn-primary" id="btnSaveAtenWeb">Enviar Solicitação</button>
                </div>
            </form>

            <!-- Painel de Sucesso -->
            <div id="panelSuccessAten" style="display: none; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
                <h3 style="color: #10b981; margin-bottom: 12px; font-size: 20px;">Pedido Registrado!</h3>
                <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 24px;">O pedido de atendimento fraterno foi incluído na fila de gestão com sucesso.</p>
                <button onclick="abrirFormularioAtendimento()" class="btn btn-secondary">Registrar Outro</button>
            </div>
        </div>
    `;

    // Apply color pick styling locally if needed
    const style = document.createElement('style');
    style.innerHTML = `
        #formAtendimentoWeb input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
            opacity: 0.7;
        }
    `;
    document.head.appendChild(style);

    // Mask for Phone
    const whatsInput = document.getElementById('inAtenWhats');
    whatsInput.addEventListener('input', function (e) {
        var x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
        e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });


    // Populate autocomplete
    carregarAutocompleteAtendimento();

    // Autofill listener
    const inputNome = document.getElementById('inAtenNome');
    inputNome.addEventListener('input', function () {
        const val = this.value.toUpperCase();
        if (window.pessoasSugestoesAten && window.pessoasSugestoesAten[val] !== undefined) {
            const dados = window.pessoasSugestoesAten[val];
            const end = document.getElementById('inAtenEndereco');
            const nasc = document.getElementById('inAtenNasc');
            const whats = document.getElementById('inAtenWhats');

            if (!end.value && dados.endereco) {
                end.value = dados.endereco.toUpperCase();
            }
            if (!nasc.value && dados.nascimento) {
                nasc.value = dados.nascimento;
            }
            if (!whats.value && dados.telefone) {
                var phoneVal = dados.telefone.replace(/\D/g, '');
                var x = phoneVal.match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
                whats.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
            }
        }
    });


    // Form Submit Handler
    document.getElementById('formAtendimentoWeb').addEventListener('submit', salvarFormularioAtendimento);
};


window.pessoasSugestoesAten = {};

async function carregarAutocompleteAtendimento() {
    try {
        const { data, error } = await db.from('pessoas')
            .select('id, nome_completo, data_nascimento, celular, endereco, bairro, cidade, estado')
            .eq('tipo_pessoa', 'Física')
            .order('nome_completo');

        if (data) {
            window.pessoasSugestoesAten = {};
            const datalist = document.getElementById('listaNomesAten');
            datalist.innerHTML = '';

            data.forEach(p => {
                if (p.nome_completo) {
                    const n = p.nome_completo.toUpperCase();

                    // Format Address: endereco - bairro - cidade/estado
                    let endCompleto = p.endereco || '';
                    if (p.bairro) endCompleto += (endCompleto ? ' - ' : '') + p.bairro;

                    let cidEst = '';
                    if (p.cidade && p.estado) cidEst = p.cidade + '/' + p.estado;
                    else if (p.cidade) cidEst = p.cidade;
                    else if (p.estado) cidEst = p.estado;

                    if (cidEst) endCompleto += (endCompleto ? ' - ' : '') + cidEst;

                    window.pessoasSugestoesAten[n] = {
                        id: p.id,
                        endereco: endCompleto,
                        nascimento: p.data_nascimento || '',
                        telefone: p.celular || ''
                    };

                    const opt = document.createElement('option');
                    opt.value = n;
                    datalist.appendChild(opt);
                }
            });
        }
    } catch (e) { console.error("Erro no autocomplete:", e); }
}


async function salvarFormularioAtendimento(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveAtenWeb');
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    const nome = document.getElementById('inAtenNome').value.trim();
    const endereco = document.getElementById('inAtenEndereco').value.trim();
    const nascimento = document.getElementById('inAtenNasc').value || null;
    const whats = document.getElementById('inAtenWhats').value.trim();

    try {
        let criadoPor = 'Desconhecido';
        try {
            const profStr = localStorage.getItem('sela_user_profile');
            if (profStr) {
                const prof = JSON.parse(profStr);
                criadoPor = prof.nome_curto || (prof.nome || '').trim().split(' ')[0] || 'Desconhecido';
            }
        } catch (e) { }

        let pacienteId = null;
        const nomeUpper = nome.toUpperCase();

        // 1. Verificar se o nome digitado foi escolhido do Autocomplete
        if (window.pessoasSugestoesAten && window.pessoasSugestoesAten[nomeUpper]) {
            pacienteId = window.pessoasSugestoesAten[nomeUpper].id;
        } else {
            // 2. Se não existir, criar um NOVO paciente na tabela PESSOAS com CPF Provisório
            // Buscar CPFs provisórios já usados (que começam com 111111)
            const { data: usedData } = await db.from('pessoas')
                .select('cpf_cnpj')
                .like('cpf_cnpj', '111111%');
            
            const usedSet = new Set(usedData ? usedData.map(d => d.cpf_cnpj.replace(/\D/g, '')) : []);
            
            let fakeCpf = null;
            for (let i = 1; i <= 999; i++) {
                const base9 = '111111' + i.toString().padStart(3, '0');
                
                // Cálculo do 1º dígito
                let sum1 = 0;
                for(let j=0; j<9; j++) sum1 += parseInt(base9[j]) * (10 - j);
                let d1 = 11 - (sum1 % 11);
                if(d1 >= 10) d1 = 0;
                
                // Cálculo do 2º dígito
                const base10 = base9 + d1.toString();
                let sum2 = 0;
                for(let j=0; j<10; j++) sum2 += parseInt(base10[j]) * (11 - j);
                let d2 = 11 - (sum2 % 11);
                if(d2 >= 10) d2 = 0;
                
                const candidate = base10 + d2.toString();
                if (!usedSet.has(candidate)) {
                    fakeCpf = candidate;
                    break;
                }
            }
            
            if (!fakeCpf) fakeCpf = '11111199999'; // Fallback absurdo se esgotar 999
            
            const { data: novaPessoa, error: errPac } = await db.from('pessoas').insert([{
                nome_completo: nome,
                nome_curto: nome.split(' ')[0],
                celular: whats,
                data_nascimento: nascimento,
                endereco: endereco,
                tipo_pessoa: 'Física',
                perfis: ['Paciente Externo'],
                cpf_cnpj: fakeCpf,
                cpf_provisorio: true,
                status: 'Ativo'
            }]).select().single();
            
            if (errPac) throw errPac;
            pacienteId = novaPessoa.id;
        }

        const { error } = await db.from('app_atendimento_fraterno').insert([{
            paciente_id: pacienteId,
            nome_completo: nome,
            status: 'Pendente',
            criado_por: criadoPor
        }]);

        if (error) throw error;

        document.getElementById('formAtendimentoWeb').style.display = 'none';
        document.getElementById('panelSuccessAten').style.display = 'block';
    } catch (err) {
        alert("Erro ao enviar: " + err.message);
        btn.disabled = false;
        btn.textContent = 'Enviar Solicitação';
    }
}

// ===================================================
// GESTÃO DE ATENDIMENTOS DESKTOP: NOVAS FUNCIONALIDADES
// ===================================================
let activeFichaAtendimentoId = null;

window.abrirFichaAtendimento = async function (id) {
    activeFichaAtendimentoId = id;
    window.abrirSideSheet('Ficha de Atendimento', '<div style="padding: 24px;">Carregando dados...</div>');

    try {
        const { data: paciente, error } = await db.from('app_atendimento_fraterno').select('*').eq('id', id).single();
        if (error) throw error;

        let infoHtml = `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <h4 style="margin-top:0; color:var(--primary); margin-bottom:12px;">${paciente.nome_completo.toUpperCase()}</h4>
                <strong>Endereço:</strong> ${paciente.endereco_completo || 'Não informado'}<br>
                <strong>WhatsApp:</strong> ${paciente.telefone || 'Não informado'}
            </div>
        `;

        let eventos = [];

        // Fetch Sessions
        const { data: sessoes, error: errSess } = await db
            .from('app_atendimento_sessoes')
            .select('*, pessoas!atendente_id(nome_completo, nome_curto), app_atendimento_fraterno!atendimento_id(pessoas!atendente_id(nome_completo, nome_curto))')
            .eq('atendimento_id', id);

        if (errSess) throw errSess;
        if (sessoes) {
            sessoes.forEach(s => {
                eventos.push({
                    tipo: 'SESSAO',
                    data: obterDataPrecisa(s.data, s.created_at),
                    obj: s,
                    atendente_nome: s.pessoas?.nome_curto || s.pessoas?.nome_completo || 'Desconhecido'
                });
            });
        }

        // Fetch Treatments and Presences
        const { data: trats, error: errTrats } = await db.from('app_atendimento_tratamentos').select('id, tipo, status').eq('atendimento_id', id);
        if (errTrats) throw errTrats;

        if (trats && trats.length > 0) {
            const tratIds = trats.map(t => t.id);
            const { data: pres, error: errPres } = await db
                .from('app_atendimento_presencas')
                .select('*')
                .in('tratamento_id', tratIds);

            if (errPres) throw errPres;
            if (pres) {
                pres.forEach(p => {
                    const trat = trats.find(t => t.id === p.treatment_id || t.id === p.tratamento_id);
                    eventos.push({
                        tipo: 'PRESENCA',
                        data: obterDataPrecisa(p.data, p.created_at),
                        obj: p,
                        trat: trat
                    });
                });
            }
        }

        eventos.sort((a, b) => b.data - a.data);

        let sessoesHtml = '<div style="margin-bottom: 24px;"><h4 style="margin-top:0; color:var(--primary); margin-bottom:16px;">Histórico de Atendimento</h4>';
        
        if (eventos.length === 0) {
            sessoesHtml += '<div style="color:var(--text-muted); font-size:13px; font-style: italic;">Nenhum registro encontrado para esta ficha.</div>';
        } else {
            sessoesHtml += '<div style="display:flex; flex-direction:column; gap:12px; position:relative; padding-left:16px; border-left: 2px solid rgba(255,255,255,0.1); padding-bottom: 8px;">';
            eventos.forEach(ev => {
                const dateStr = ev.data.toLocaleDateString('pt-BR');
                if (ev.tipo === 'SESSAO') {
                    sessoesHtml += `
                        <div style="position:relative; background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                            <div style="position:absolute; left:-25px; top:14px; width:10px; height:10px; border-radius:50%; background: #f59e0b; border:2px solid var(--bg-panel);"></div>
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                <div>
                                    <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">${dateStr}</div>
                                    <div style="font-weight:bold; color:var(--primary); font-size:14px;">🤝 Sessão Fraterno</div>
                                </div>
                                <span style="color: var(--text-muted); font-size: 11px; text-align: right;">Atendente:<br>${ev.atendente_nome}</span>
                            </div>
                            <div style="color: var(--text-main); font-size: 13px; white-space: pre-wrap; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">${ev.obj.sintomas_orientacoes || 'Nenhum registro textual preenchido.'}</div>
                        </div>
                    `;
                } else if (ev.tipo === 'PRESENCA') {
                    const isEsp = ev.trat?.tipo === 'Espiritual';
                    const badgeColor = isEsp ? '#818cf8' : '#3b82f6';
                    const badgeText = isEsp ? '✨ ESPIRITUAL' : '💧 FLUÍDICO';
                    sessoesHtml += `
                        <div style="position:relative; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
                            <div style="position:absolute; left:-23px; top:14px; width:10px; height:10px; border-radius:50%; background: ${badgeColor}; border:2px solid var(--bg-panel);"></div>
                            <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">${dateStr}</div>
                            <div style="font-weight:bold; color:white; font-size:13px; margin-bottom:4px;">
                                <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: ${badgeColor}; color: white; margin-right: 6px; white-space: nowrap;">${badgeText}</span>
                                Presença Registrada
                            </div>
                            ${ev.obj.observacoes ? `<div style="font-size:12px; color:var(--text-muted); margin-top: 8px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border-left: 2px solid ${badgeColor};">Obs: ${ev.obj.observacoes}</div>` : ''}
                        </div>
                    `;
                }
            });
            sessoesHtml += '</div>';
        }
        sessoesHtml += '</div>';

        let presHtml = '';

        let formHtml = '';
        
        if (currentAtendimentoMainTab === 'historico' || currentAtendimentoSubTab === 'historico_geral') {
            formHtml = '';
        } else if (paciente.status !== 'Atendido' && paciente.status !== 'Concluído' && paciente.status !== 'Cancelado' && paciente.status !== 'Em Tratamento') {
            formHtml = `
                <div style="margin-bottom: 24px;">
                    <h4 style="margin-top:0; color:var(--primary); margin-bottom:12px;">Registro de Atendimento Atual</h4>
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="color: var(--text-muted); font-size: 13px;">Sintomas e Orientações</label>
                        <textarea id="sideTxtSintomasOrientacoes" class="input" rows="4" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: white; padding: 12px; border-radius: 8px;" placeholder="Descreva os sintomas apresentados e as orientações transmitidas..."></textarea>
                    </div>
                    <div style="display: flex; gap: 24px; margin-bottom: 16px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="sideChkTratFluidico" style="width: 18px; height: 18px; accent-color: var(--primary);" onchange="if(this.checked) document.getElementById('sideChkApenasConversa').checked = false;">
                            <span>Prescrever Tratamento Fluídico</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="sideChkTratEspiritual" style="width: 18px; height: 18px; accent-color: var(--primary);" onchange="if(this.checked) document.getElementById('sideChkApenasConversa').checked = false;">
                            <span>Prescrever Tratamento Espiritual</span>
                        </label>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; padding: 12px; background: rgba(0,0,0,0.1); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="sideChkApenasConversa" style="width: 18px; height: 18px; accent-color: #f59e0b;" onchange="if(this.checked) { document.getElementById('sideChkTratFluidico').checked = false; document.getElementById('sideChkTratEspiritual').checked = false; }">
                            <span style="color: #f59e0b; font-weight: 500;">Apenas Conversa Fraterna</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="sideChkEvangelhoLar" style="width: 18px; height: 18px; accent-color: #10b981;">
                            <span style="color: #10b981; font-weight: 500;">Implantação de Evangelho no Lar</span>
                        </label>
                    </div>
                </div>
                
                <div style="padding-top: 24px; border-top: 1px solid var(--border); display: flex; gap: 12px;">
                    <button type="button" onclick="window.fecharSideSheet()" class="btn" style="flex:1; padding: 12px; border-radius: 8px; background: transparent; color: var(--text-main); border: 1px solid var(--border);">Cancelar</button>
                    <button type="button" onclick="salvarFichaAtendimentoSideSheet(this)" class="btn" style="flex:1; padding: 12px; border-radius: 8px; background: var(--primary); color: white; border: none; font-weight: 600;">Gravar Sessão e Tratamentos</button>
                </div>
            `;
        } else {
            formHtml = `
                <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 12px; align-items: center;">
                    <p style="color: var(--text-muted); font-size: 13px; text-align: center; margin-bottom: 0;">✅ Este Ciclo do Fraterno já foi concluído e seu histórico está consolidado.</p>
                </div>
            `;
        }

        const finalHtml = `
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${infoHtml}
                ${sessoesHtml}
                ${presHtml}
                ${formHtml}
            </div>
        `;
        document.getElementById('globalSideSheetContent').innerHTML = finalHtml;
    } catch (err) {
        console.error(err);
        document.getElementById('globalSideSheetContent').innerHTML = '<div style="padding: 24px; color: #ef4444;">Erro ao carregar dados da ficha.</div>';
    }
};
window.salvarFichaAtendimentoSideSheet = async function (btn) {
    const sintomas = document.getElementById('sideTxtSintomasOrientacoes').value.trim();
    const tratFluidico = document.getElementById('sideChkTratFluidico').checked;
    const tratEspiritual = document.getElementById('sideChkTratEspiritual').checked;

    const apenasConversa = document.getElementById('sideChkApenasConversa').checked;
    const evangelhoLar = document.getElementById('sideChkEvangelhoLar').checked;

    if (!sintomas) {
        Swal.fire('Aviso', 'Por favor, informe os sintomas e orientações desta sessão.', 'warning');
        return;
    }

    if (!tratFluidico && !tratEspiritual && !apenasConversa) {
        Swal.fire('Aviso', 'Por favor, selecione ao menos um Tratamento ou marque Apenas Conversa Fraterna.', 'warning');
        return;
    }

    const btnOriginalText = btn ? btn.innerHTML : 'Gravar Sessão e Tratamentos';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ Gravando...';
        btn.style.opacity = '0.7';
    }

    try {
        // Obter sempre o Atendente designado no Fraterno (pois a secretária pode estar preenchendo a ficha por ele)
        const { data: atenData } = await db.from('app_atendimento_fraterno').select('atendente_id').eq('id', activeFichaAtendimentoId).single();
        const atendenteId = atenData?.atendente_id || null;

        const d = new Date();
        const localDateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

        // Registrar Sessão
        const { error: errSess } = await db.from('app_atendimento_sessoes').insert([{
            atendimento_id: activeFichaAtendimentoId,
            atendente_id: atendenteId,
            data: localDateStr,
            sintomas_orientacoes: sintomas,
            apenas_conversa: apenasConversa,
            evangelho_lar: evangelhoLar
        }]);
        if (errSess) throw errSess;

        // Registrar Tratamento Fluídico se indicado
        if (tratFluidico) {
            const { error: errTratF } = await db.from('app_atendimento_tratamentos').insert([{
                atendimento_id: activeFichaAtendimentoId,
                tipo: 'Fluídico',
                status: 'Ativo',
                data_inicio: localDateStr
            }]);
            if (errTratF) throw errTratF;
        }

        // Registrar Tratamento Espiritual se indicado
        if (tratEspiritual) {
            const { error: errTratE } = await db.from('app_atendimento_tratamentos').insert([{
                atendimento_id: activeFichaAtendimentoId,
                tipo: 'Espiritual',
                status: 'Ativo',
                data_inicio: localDateStr
            }]);
            if (errTratE) throw errTratE;
        }

        // Atualizar status do Atendimento Fraterno para 'Em Tratamento'


        const novoStatus = (tratFluidico || tratEspiritual) ? 'Em Tratamento' : 'Concluído';
        const { error: errAten } = await db.from('app_atendimento_fraterno').update({
            status: novoStatus,
            data_hora_atendimento: new Date().toISOString()
        }).eq('id', activeFichaAtendimentoId);
        if (errAten) throw errAten;

        Swal.fire('Sucesso', 'Sessão gravada e tratamentos prescritos com sucesso!', 'success');
        window.fecharSideSheet();
        carregarListaAtendimento();
    } catch (err) {
        Swal.fire('Erro', 'Erro ao gravar sessão: ' + err.message, 'error');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = btnOriginalText;
            btn.style.opacity = '1';
        }
    }
};

let currentSubAbaTratamentos = 'Ativo';

window.setSubAbaTratamentos = function (sub) {
    currentSubAbaTratamentos = sub;
    carregarTratamentosAtivosDesktop();
};

window.carregarTratamentosAtivosDesktop = async function () {
    const lista = document.getElementById('listaAten');
    if (!lista) return;
    lista.innerHTML = '<div style="color: var(--text-muted); font-size: 14px;">Carregando tratamentos...</div>';

    try {
        const queryStatus = currentSubAbaTratamentos === 'Ativo' ? 'Ativo' : ['Concluído', 'Suspenso'];
        const isListActive = currentSubAbaTratamentos === 'Ativo';

        let selectQuery = db
            .from('app_atendimento_tratamentos')
            .select('*, app_atendimento_fraterno(nome_completo, id, paciente:pessoas!paciente_id(celular)), app_atendimento_presencas(data)')
            .order('tipo');

        if (typeof queryStatus === 'string') {
            selectQuery = selectQuery.eq('status', queryStatus);
        } else {
            selectQuery = selectQuery.in('status', queryStatus);
        }

        const { data: tratamentos, error } = await selectQuery;

        if (error) throw error;

        lista.innerHTML = '';

        const containerCards = document.createElement('div');
        containerCards.style.cssText = 'display: flex; flex-direction: column; gap: 16px; margin-top: 8px;';
        lista.appendChild(containerCards);

        if (!tratamentos || tratamentos.length === 0) {
            containerCards.innerHTML = `<div style="padding: 24px; text-align: center; border: 1px dashed var(--border); border-radius: 8px; color: var(--text-muted);">Nenhum tratamento ${currentSubAbaTratamentos === 'Ativo' ? 'ativo atualmente' : 'histórico/inativo encontrado'}.</div>`;
            return;
        }

        // Agrupar tratamentos por Pessoa/Atendimento
        const pacienteGrupos = {};
        tratamentos.forEach(t => {
            const pac = t.app_atendimento_fraterno;
            if (!pac) return;
            if (!pacienteGrupos[pac.id]) {
                pacienteGrupos[pac.id] = {
                    info: pac,
                    tratamentos: []
                };
            }
            pacienteGrupos[pac.id].tratamentos.push(t);
        });

        const sortedPacIds = Object.keys(pacienteGrupos).sort((a, b) => {
            const nameA = pacienteGrupos[a].info?.nome_completo || '';
            const nameB = pacienteGrupos[b].info?.nome_completo || '';
            return nameA.localeCompare(nameB);
        });

        sortedPacIds.forEach(pacId => {
            const grupo = pacienteGrupos[pacId];
            const card = document.createElement('div');
            card.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 12px;';

            // Layout de tratamentos da pessoa
            let tratsHTML = '';
            grupo.tratamentos.forEach(t => {
                const badgeColor = t.tipo === 'Fluídico' ? '#3b82f6' : '#8b5cf6';
                const dtIniStr = t.data_inicio ? t.data_inicio.split('T')[0].split('-').reverse().join('/') : '';
                const dtFimStr = t.data_fim ? t.data_fim.split('T')[0].split('-').reverse().join('/') : 'atual';
                const dtText = isListActive
                    ? `Início: ${dtIniStr}`
                    : `Período: ${dtIniStr} até ${dtFimStr} (${t.status})`;

                let actionsHTML = '';
                let attendedToday = false;
                if (isListActive) {
                    if (t.app_atendimento_presencas) {
                        const now = new Date();
                        const tzOffset = now.getTimezoneOffset() * 60000;
                        const todayLocal = new Date(now.getTime() - tzOffset).toISOString().split('T')[0];
                        
                        attendedToday = t.app_atendimento_presencas.some(p => {
                            if (!p.data) return false;
                            return p.data.split('T')[0] === todayLocal;
                        });
                    }

                    let btnConfirm = '';
                    if (attendedToday) {
                        btnConfirm = `<button disabled class="btn" style="padding: 4px 10px; font-size: 11px; background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px dashed var(--border); border-radius: 4px; cursor: not-allowed;">Atendimento já foi realizado HOJE!</button>`;
                    } else if (!t.presente) {
                        btnConfirm = `<button disabled class="btn" style="padding: 4px 10px; font-size: 11px; background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px dashed rgba(245, 158, 11, 0.3); border-radius: 4px; cursor: not-allowed;">⏳ Aguarde Presença</button>`;
                    } else {
                        btnConfirm = `<button onclick="confirmarSessaoTratamento('${t.id}', '${t.tipo}')" class="btn btn-primary" style="padding: 4px 10px; font-size: 11px; background: ${t.tipo === 'Espiritual' ? '#8b5cf6' : '#3b82f6'}; color: white; border: none; border-radius: 4px; cursor: pointer;">Confirmar Atendimento</button>`;
                    }
                    
                    actionsHTML = `
                        ${btnConfirm}
                        <button onclick="mudarStatusTratamento('${t.id}', 'Concluído')" class="btn btn-primary" style="padding: 4px 10px; font-size: 11px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">Concluir</button>
                        <button onclick="mudarStatusTratamento('${t.id}', 'Suspenso')" class="btn btn-secondary" style="padding: 4px 10px; font-size: 11px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 4px; cursor: pointer;">Suspender</button>
                    `;
                } else {
                    actionsHTML = `
                        <button onclick="reativarTratamento('${t.id}')" class="btn btn-primary" style="padding: 4px 10px; font-size: 11px; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer;">⚡ Reativar</button>
                    `;
                }

                tratsHTML += `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.03);">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: ${badgeColor}; color: white; text-transform: uppercase; white-space: nowrap;">${t.tipo}</span>
                            ${isListActive ? (attendedToday ? '<span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: rgba(59, 130, 246, 0.2); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); white-space: nowrap;">✅ Atendido Hoje</span>' : (t.presente ? '<span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); white-space: nowrap;">🟢 Presente na Casa</span>' : '<span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); white-space: nowrap;">🟡 Aguardando Chegada</span>')) : ''}
                            <span style="font-size: 13px; color: var(--text-muted);">${dtText}</span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            ${actionsHTML}
                        </div>
                    </div>
                `;
            });

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                    <strong style="font-size: 16px; color: var(--text-main);">${grupo.info.nome_completo.toUpperCase()}</strong>
                    <span style="font-size: 13px; color: var(--text-muted);">📱 ${grupo.info.paciente?.celular || 'Sem telefone'}</span>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${tratsHTML}
                </div>
                
                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px;">
                    <!-- Botão Novo Atendimento removido conforme solicitação -->
                    <button onclick="toggleEvolucaoInline('${grupo.info.id}')" class="btn" style="padding: 6px 12px; font-size: 12px; background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                        📝 Evolução & Prontuário
                    </button>
                </div>
                
                <!-- Painel de Evolução Inline (Oculto por padrão) -->
                <div id="panel_evolucao_${grupo.info.id}" style="display: none; margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px;"></div>
            `;
            containerCards.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        lista.innerHTML = '<span style="color:#ef4444;">Erro ao carregar tratamentos.</span>';
    }
};

window.toggleEvolucaoInline = async function (id) {
    const panel = document.getElementById('panel_evolucao_' + id);
    if (!panel) return;

    if (panel.style.display === 'block') {
        panel.style.display = 'none';
        return;
    }

    panel.style.display = 'block';
    panel.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; padding: 8px;">Carregando histórico e prontuário de evolução...</div>';

    try {
        // Obter sessões anteriores
        const { data: sessoes, error: errSess } = await db
            .from('app_atendimento_sessoes')
            .select('*, pessoas!atendente_id(nome_completo, nome_curto), app_atendimento_fraterno!atendimento_id(pessoas!atendente_id(nome_completo, nome_curto))')
            .eq('atendimento_id', id)
            .order('data', { ascending: false })
            .limit(4);

        if (errSess) throw errSess;

        // Obter tratamentos para pegar presenças
        const { data: trats, error: errTrats } = await db.from('app_atendimento_tratamentos').select('id, tipo, status').eq('atendimento_id', id);
        if (errTrats) throw errTrats;

        let presencasHTML = '';
        if (trats && trats.length > 0) {
            const tratIds = trats.map(t => t.id);
            const { data: pres, error: errPres } = await db
                .from('app_atendimento_presencas')
                .select('*')
                .in('tratamento_id', tratIds)
                .order('data', { ascending: false });

            if (errPres) throw errPres;

            if (pres) {
                pres.sort((a, b) => {
                    const tA = trats.find(t => t.id === a.tratamento_id)?.tipo || '';
                    const tB = trats.find(t => t.id === b.tratamento_id)?.tipo || '';
                    if (tA === 'Fluídico' && tB === 'Espiritual') return -1;
                    if (tA === 'Espiritual' && tB === 'Fluídico') return 1;
                    const dA = new Date(a.data || 0);
                    const dB = new Date(b.data || 0);
                    return dB - dA;
                });
            }

            if (!pres || pres.length === 0) {
                presencasHTML = '<div style="color: var(--text-muted); font-style: italic; font-size: 12px; padding: 4px;">Nenhuma presença de tratamento registrada ainda.</div>';
            } else {
                presencasHTML = pres.map(p => {
                    const trat = trats.find(t => t.id === p.treatment_id || t.id === p.tratamento_id);
                    const dt = p.data ? p.data.split('T')[0].split('-').reverse().join('/') : '';
                    const obs = p.observacoes ? `<div style="margin-top: 2px; color: var(--text-muted); font-size: 11px;">Obs: ${p.observacoes}</div>` : '';
                    const badgeColor = trat?.tipo === 'Espiritual' ? '#818cf8' : '#10b981';
                    return `
                        <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px; font-size: 12px; line-height: 1.4; margin-bottom: 6px;">
                            <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: ${badgeColor}; color: white; text-transform: uppercase; white-space: nowrap;">${trat?.tipo || 'TRAT.'}</span>
                            <strong style="color: #3b82f6; margin-left: 4px;">${dt}</strong>
                            ${obs}
                        </div>
                    `;
                }).join('');
            }
        } else {
            presencasHTML = '<div style="color: var(--text-muted); font-style: italic; font-size: 12px; padding: 4px;">Nenhum tratamento registrado para esta ficha.</div>';
        }

        let sessoesHTML = '';
        if (!sessoes || sessoes.length === 0) {
            sessoesHTML = '<div style="color: var(--text-muted); font-style: italic; font-size: 12px; padding: 4px;">Nenhuma sessão de atendimento registrada.</div>';
        } else {
            sessoesHTML = sessoes.map(s => {
                const dt = s.data ? s.data.split('T')[0].split('-').reverse().join('/') : '';
                            const atendenteFallback = s.pessoas || (s.app_atendimento_fraterno && s.app_atendimento_fraterno.pessoas) || {};
                            const nomeAtendente = atendenteFallback.nome_curto || atendenteFallback.nome_completo || 'Desconhecido';
                    return `
                    <div style="background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 8px; font-size: 12px; margin-bottom: 6px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <div>
                                <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: #f59e0b; color: white; text-transform: uppercase; white-space: nowrap;">FRATERNO</span>
                                <strong style="color: var(--primary); margin-left: 4px;">${dt}</strong>
                            </div>
                            <span style="color: var(--text-muted); font-size: 11px;">Atendente: ${nomeAtendente}</span>
                        </div>
                        <div style="color: var(--text-main); white-space: pre-wrap;">${s.sintomas_orientacoes}</div>
                    </div>
                `;
            }).join('');
        }

        panel.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: 6px;">
                <div>
                    <h5 style="margin: 0 0 8px 0; font-size: 13px; color: var(--primary); font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">📜 Histórico de Atendimentos Fraternos</h5>
                    <div style="max-height: 180px; overflow-y: auto; padding-right: 4px;">
                        ${sessoesHTML}
                    </div>
                </div>
                <div>
                    <h5 style="margin: 0 0 8px 0; font-size: 13px; color: #3b82f6; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">🗓️ Histórico de Tratamentos</h5>
                    <div style="max-height: 180px; overflow-y: auto; padding-right: 4px;">
                        ${presencasHTML}
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        console.error(err);
        panel.innerHTML = '<span style="color: #ef4444; font-size: 12px;">Erro ao carregar evolução.</span>';
    }
};

window.reativarTratamento = async function (id) {
    Swal.fire({
        title: 'Reativar Tratamento?',
        text: 'Um novo ciclo de tratamento será iniciado para este paciente.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: 'var(--primary)',
        cancelButtonColor: 'var(--text-muted)',
        confirmButtonText: 'Sim, reativar',
        cancelButtonText: 'Cancelar',
        background: 'var(--bg-panel)',
        color: 'var(--text-main)'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                // Obter dados do tratamento antigo
                const { data: oldTrat, error: errFetch } = await db.from('app_atendimento_tratamentos').select('*').eq('id', id).single();
                if (errFetch) throw errFetch;

                // Criar novo ciclo
                const { error: errInsert } = await db.from('app_atendimento_tratamentos').insert([{
                    atendimento_id: oldTrat.atendimento_id,
                    tipo: oldTrat.tipo,
                    status: 'Ativo',
                    data_inicio: new Date().toISOString().split('T')[0],
                    presente: false
                }]);

                if (errInsert) throw errInsert;

                Swal.fire({
                    title: 'Sucesso!',
                    text: 'Novo ciclo de tratamento iniciado.',
                    icon: 'success',
                    background: 'var(--bg-panel)',
                    color: 'var(--text-main)',
                    timer: 1500,
                    showConfirmButton: false
                });

                carregarTratamentosAtivosDesktop();
            } catch (err) {
                Swal.fire('Erro', 'Erro ao reativar tratamento: ' + err.message, 'error');
            }
        }
    });
};

window.encaminharParaNovaTriagem = async function(fraterno_id) {
    Swal.fire({
        title: 'Novo Atendimento?',
        text: 'Isto criará uma nova ficha para este paciente e o enviará para a Triagem.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#8b5cf6',
        cancelButtonColor: 'var(--text-muted)',
        confirmButtonText: 'Sim, criar',
        cancelButtonText: 'Cancelar',
        background: 'var(--bg-panel)',
        color: 'var(--text-main)'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                // Obter dados pessoais da ficha antiga
                const { data: oldData, error: errF } = await db.from('app_atendimento_fraterno').select('*').eq('id', fraterno_id).single();
                if (errF) throw errF;

                // Inserir nova ficha
                const { error: errI } = await db.from('app_atendimento_fraterno').insert([{
                    paciente_id: oldData.paciente_id,
                    nome_completo: oldData.nome_completo,
                    status: 'Pendente' // Vai para a Triagem
                }]);

                if (errI) throw errI;

                Swal.fire({
                    title: 'Ficha Criada!',
                    text: 'Paciente encaminhado para a fila de Triagem.',
                    icon: 'success',
                    background: 'var(--bg-panel)',
                    color: 'var(--text-main)'
                });
            } catch(e) {
                Swal.fire('Erro', 'Falha ao criar nova ficha: ' + e.message, 'error');
            }
        }
    });
};

window.mudarStatusTratamento = async function (id, status) {
    const motive = status === 'Concluído' ? 'concluir' : 'suspender';
    
    Swal.fire({
        title: `Deseja ${motive} este tratamento?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: status === 'Concluído' ? '#10b981' : '#ef4444',
        cancelButtonColor: 'var(--text-muted)',
        confirmButtonText: `Sim, ${motive}`,
        cancelButtonText: 'Cancelar',
        background: 'var(--bg-panel)',
        color: 'var(--text-main)'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const { data: tData } = await db.from('app_atendimento_tratamentos').select('atendimento_id').eq('id', id).single();

                const { error } = await db.from('app_atendimento_tratamentos').update({
                    status: status,
                    data_fim: new Date().toISOString().split('T')[0]
                }).eq('id', id);

                if (error) throw error;
                
                // Auto-concluir Atendimento Fraterno se todos os tratamentos estiverem encerrados
                if (tData && tData.atendimento_id) {
                    const { data: restantes } = await db.from('app_atendimento_tratamentos').select('id').eq('atendimento_id', tData.atendimento_id).eq('status', 'Ativo');
                    if (!restantes || restantes.length === 0) {
                        await db.from('app_atendimento_fraterno').update({ status: 'Concluído' }).eq('id', tData.atendimento_id);
                    }
                }
                
                Swal.fire({
                    title: 'Atualizado!',
                    text: 'Status do tratamento alterado.',
                    icon: 'success',
                    background: 'var(--bg-panel)',
                    color: 'var(--text-main)',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                carregarTratamentosAtivosDesktop();
            } catch (err) {
                Swal.fire('Erro', 'Erro ao mudar status: ' + err.message, 'error');
            }
        }
    });
};

window.carregarFilaPresencasDesktop = async function () {
    const lista = document.getElementById('listaAten');
    if (!lista) return;
    lista.innerHTML = '<div style="color: var(--text-muted); font-size: 14px;">Carregando Fila Geral...</div>';

    try {
        const { data: tratamentos, error } = await db
            .from('app_atendimento_tratamentos')
            .select('*, app_atendimento_fraterno(id, nome_completo, created_at, paciente:pessoas!paciente_id(*))')
            .eq('status', 'Ativo')
            .eq('presente', false)
            .order('tipo');

        if (error) throw error;

        lista.innerHTML = '';
        if (!tratamentos || tratamentos.length === 0) {
            lista.innerHTML = '<div style="padding: 24px; text-align: center; border: 1px dashed var(--border); border-radius: 8px; color: var(--text-muted);">Nenhum tratamento ativo na fila geral.</div>';
            return;
        }

        // Apply grid layout similar to Triagem
        lista.style.display = 'grid';
        lista.style.gridTemplateColumns = 'repeat(auto-fill, minmax(400px, 1fr))';
        lista.style.gap = '12px';

        tratamentos.forEach(t => {
            const f = t.app_atendimento_fraterno;
            const badgeColor = t.tipo === 'Fluídico' ? '#3b82f6' : '#8b5cf6';
            const badgeText = t.tipo.toUpperCase();

            const d = new Date(f.created_at);
            const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

            let ageInfo = '';
            if (f.data_nascimento) {
                const age = calcularIdade(f.data_nascimento);
                ageInfo = ` (${age} anos)`;
            }

            const card = document.createElement('div');
            card.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 16px; display: flex; flex-direction: row; justify-content: space-between; align-items: flex-start; gap: 16px; transition: all 0.2s;';
            card.onmouseover = () => card.style.background = 'rgba(255,255,255,0.05)';
            card.onmouseout = () => card.style.background = 'rgba(255,255,255,0.03)';

            const buttonsContainerStyle = 'display: grid; grid-template-columns: 1fr 44px; gap: 8px; flex-shrink: 0; min-width: 160px;';

            let leftInfo = `
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <strong style="font-size: 16px; color: var(--text-main); margin-bottom: 2px;">${f.nome_completo.toUpperCase()}</strong>
                        <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: ${badgeColor}; color: white; white-space: nowrap;">${badgeText}</span>
                    </div>
                    <div style="font-size: 13px; color: var(--text-muted);">📍 ${f.endereco_completo || 'Sem endereço'}</div>
                    <div style="font-size: 13px; color: var(--text-muted);">🎂 Nascimento: ${f.data_nascimento ? f.data_nascimento.split('-').reverse().join('/') : 'Não informada'}${ageInfo}</div>
                    <div style="font-size: 13px; color: var(--text-muted);">📱 Celular: ${f.telefone || 'Não informado'}</div>
                    <div style="margin-top: 4px; font-size: 11px; color: var(--text-muted);">Em ${dateStr}</div>
                </div>
            `;

            let btnPresenca = `<button class="btn" onclick="marcarTratamentoPresente('${t.id}', true)" style="width: 100%; font-size: 12px; padding: 10px; background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border); border-radius: 8px; transition: all 0.2s; grid-column: 1 / 3;">⚪ Confirmar Presença</button>`;

            let rightInfo = `
                <div style="${buttonsContainerStyle}">
                    ${btnPresenca}
                    <!-- Edit Button -->
                    <button class="btn" onclick="abrirEdicaoAtendimento('${f.id}', '${f.nome_completo.replace(/'/g, "\\'")}', '${(f.endereco_completo||'').replace(/'/g, "\\'")}', '${f.telefone||''}')" style="background: rgba(255,255,255,0.05); color: var(--text-main); border: 1px solid var(--border); border-radius: 8px; padding: 10px; font-size: 14px; grid-column: 1 / 2;">✏️</button>
                    <!-- Delete Button -->
                    <button class="btn" onclick="excluirSolicitacao('${f.id}')" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 10px; font-size: 14px; grid-column: 2 / 3;">🗑️</button>
                </div>
            `;

            card.innerHTML = `
                <div style="flex: 1; min-width: 0;">${leftInfo}</div>
                ${rightInfo}
            `;
            lista.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        lista.innerHTML = '<span style="color:#ef4444;">Erro ao carregar Fila Geral.</span>';
    }
};

window.carregarEsperaTratamentoDesktop = async function () {
    const lista = document.getElementById('listaAten');
    if (!lista) return;
    lista.innerHTML = '<div style="color: var(--text-muted); font-size: 14px;">Carregando Sala de Espera...</div>';

    try {
        const { data: tratamentos, error } = await db
            .from('app_atendimento_tratamentos')
            .select('*, app_atendimento_fraterno(id, nome_completo, paciente:pessoas!paciente_id(*))')
            .eq('status', 'Ativo')
            .eq('presente', true)
            .order('tipo');

        if (error) throw error;

        lista.innerHTML = '';
        if (!tratamentos || tratamentos.length === 0) {
            lista.innerHTML = '<div style="padding: 24px; text-align: center; border: 1px dashed var(--border); border-radius: 8px; color: var(--text-muted);">Sala de Espera vazia.</div>';
            return;
        }

        lista.style.display = 'grid';
        lista.style.gridTemplateColumns = 'repeat(auto-fill, minmax(400px, 1fr))';
        lista.style.gap = '12px';

        tratamentos.forEach(t => {
            const f = t.app_atendimento_fraterno;
            const badgeColor = t.tipo === 'Fluídico' ? '#3b82f6' : '#8b5cf6';
            const card = document.createElement('div');
            card.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 12px;';

            let acaoHTML = '';
            if (t.tipo === 'Fluídico') {
                acaoHTML = `<button onclick="confirmarSessaoTratamento('${t.id}', 'Fluídico')" class="btn btn-primary" style="padding: 10px 16px; font-size: 14px; font-weight: 600; background: #3b82f6; color: white; border-radius: 8px; width: 100%;">Confirmar Atendimento</button>`;
            } else {
                acaoHTML = `
                    <button onclick="confirmarSessaoTratamento('${t.id}', 'Espiritual')" class="btn btn-primary" style="padding: 10px 16px; font-size: 14px; font-weight: 600; background: #8b5cf6; color: white; border-radius: 8px; width: 100%;">Confirmar Atendimento</button>
                `;
            }

            let ageInfo = '';
            if (f.data_nascimento) {
                const age = calcularIdade(f.data_nascimento);
                ageInfo = ` (${age} anos)`;
            }

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <strong style="font-size: 16px; color: var(--text-main); margin-bottom: 2px;">${f.nome_completo.toUpperCase()}</strong>
                            <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: ${badgeColor}; color: white; white-space: nowrap;">${t.tipo.toUpperCase()}</span>
                        </div>
                        <div style="font-size: 13px; color: var(--text-muted);">📍 ${f.endereco_completo || 'Sem endereço'}</div>
                        <div style="font-size: 13px; color: var(--text-muted);">🎂 Nascimento: ${f.data_nascimento ? f.data_nascimento.split('-').reverse().join('/') : 'Não informada'}${ageInfo}</div>
                        <div style="font-size: 13px; color: var(--text-muted);">📱 Celular: ${f.telefone || 'Não informado'}</div>
                    </div>
                    <button class="btn" onclick="marcarTratamentoPresente('${t.id}', false)" style="padding: 6px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; font-size: 11px;">Desfazer Presente</button>
                </div>
                ${acaoHTML}
            `;
            lista.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        lista.innerHTML = '<span style="color:#ef4444;">Erro ao carregar Sala de Espera.</span>';
    }
};

window.marcarTratamentoPresente = async function(id, statusPresente) {
    try {
        const { error } = await db.from('app_atendimento_tratamentos').update({ presente: statusPresente }).eq('id', id);
        if (error) throw error;
        
        if (currentAtendimentoSubTab === 'presencas') carregarFilaPresencasDesktop();
        else if (currentAtendimentoSubTab === 'espera_tratamento') carregarEsperaTratamentoDesktop();
        else if (currentAtendimentoSubTab === 'fila') carregarListaAtendimento();
    } catch (err) {
        console.error(err);
        Swal.fire('Erro', 'Não foi possível alterar a presença', 'error');
    }
};

window.confirmarSessaoTratamento = async function(tratamentoId, tipo) {
    if (tipo === 'Espiritual') {
        Swal.fire({
            title: 'Confirmar Atendimento Espiritual',
            input: 'textarea',
            inputLabel: 'Observações da Sessão (Opcional)',
            inputPlaceholder: 'Relate informações relevantes do atendimento...',
            showCancelButton: true,
            confirmButtonColor: '#8b5cf6',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Confirmar',
            background: 'var(--bg-panel)',
            color: 'var(--text-main)',
            inputAttributes: {
                style: 'background: rgba(0,0,0,0.2); color: white; border: 1px solid var(--border); border-radius: 8px;'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                processarSessaoTratamento(tratamentoId, result.value || '');
            }
        });
    } else {
        processarSessaoTratamento(tratamentoId, '');
    }
};

async function processarSessaoTratamento(tratamentoId, observacoes) {
    try {
        const d = new Date();
        const localDateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        
        let payload = {
            tratamento_id: tratamentoId,
            data: localDateStr
        };
        if (observacoes) payload.observacoes = observacoes.trim();

        const { error: err1 } = await db.from('app_atendimento_presencas').insert([payload]);
        if (err1) throw err1;

        const { error: err2 } = await db.from('app_atendimento_tratamentos').update({ presente: false }).eq('id', tratamentoId);
        if (err2) throw err2;

        Swal.fire({
            title: 'Sucesso',
            text: 'Atendimento registrado com sucesso!',
            icon: 'success',
            background: 'var(--bg-panel)',
            color: 'var(--text-main)',
            timer: 1500,
            showConfirmButton: false
        });

        carregarTratamentosAtivosDesktop();
    } catch (err) {
        console.error(err);
        Swal.fire('Erro', 'Erro ao confirmar atendimento: ' + err.message, 'error');
    }
}

window.carregarPainelSemanalDesktop = async function () {
    const lista = document.getElementById('listaAten');
    if (!lista) return;
    lista.innerHTML = '<div style="color: var(--text-muted); font-size: 14px;">Carregando painel semanal...</div>';

    try {
        const { data: tratamentos, error: errTrat } = await db
            .from('app_atendimento_tratamentos')
            .select('*, app_atendimento_fraterno(nome_completo, paciente:pessoas!paciente_id(celular)), app_atendimento_presencas(data)')
            .eq('status', 'Ativo');
            
        if (errTrat) throw errTrat;

        // Número de Evangelho no Lar indicados
        const { count: evangelhoCount, error: errEv } = await db
            .from('app_atendimento_sessoes')
            .select('*', { count: 'exact', head: true })
            .eq('evangelho_lar', true);

        if (errEv) throw errEv;

        lista.innerHTML = '';

        // Estatísticas Básicas
        const totalAtivos = tratamentos ? tratamentos.length : 0;
        
        let pacientesNaSemana = 0;
        let abandonos = [];
        
        // Determinar "Esta Semana" (últimos 7 dias)
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        tratamentos.forEach(t => {
            const presencas = t.app_atendimento_presencas || [];
            let presencaRecente = false;
            let lastDateObj = null;

            if (presencas.length > 0) {
                const datesObj = presencas.map(p => new Date(p.data)).sort((a, b) => b - a);
                lastDateObj = datesObj[0];
                if (lastDateObj >= oneWeekAgo) {
                    presencaRecente = true;
                    pacientesNaSemana++;
                }
            }

            // Risco de Abandono (Nenhuma presença nas últimas 2 semanas, mas tem tratamento ativo)
            if (t.status === 'Ativo' && (!lastDateObj || lastDateObj < twoWeeksAgo)) {
                abandonos.push({
                    id: t.id,
                    nome: t.app_atendimento_fraterno?.nome_completo || 'Desconhecido',
                    telefone: t.app_atendimento_fraterno?.paciente?.celular,
                    tipo: t.tipo,
                    lastDate: lastDateObj ? lastDateObj.toLocaleDateString('pt-BR') : 'Nunca compareceu',
                    faltasConsecutivas: lastDateObj ? Math.floor((now - lastDateObj) / (7 * 24 * 60 * 60 * 1000)) : 'Várias'
                });
            }
        });

        const taxaFrequencia = totalAtivos > 0 ? Math.round((pacientesNaSemana / totalAtivos) * 100) : 0;

        // Montar UI Geral
        const painelHtml = document.createElement('div');
        painelHtml.style.display = 'flex';
        painelHtml.style.flexDirection = 'column';
        painelHtml.style.gap = '24px';

        // 1. CARDS DE RESUMO
        let resumoHtml = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 16px; text-align: center;">
                    <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">Tratamentos Ativos</div>
                    <div style="font-size: 24px; font-weight: bold; color: var(--primary);">${totalAtivos}</div>
                </div>
                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 16px; text-align: center;">
                    <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">Presentes na Semana</div>
                    <div style="font-size: 24px; font-weight: bold; color: #10b981;">${pacientesNaSemana}</div>
                </div>
                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 16px; text-align: center;">
                    <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">Evangelho no Lar (Indicados)</div>
                    <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${evangelhoCount}</div>
                </div>
                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 16px; text-align: center;">
                    <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">Taxa de Frequência</div>
                    <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;">${taxaFrequencia}%</div>
                </div>
            </div>
        `;

        // 2. ALERTAS DE ABANDONO
        let abandonosHtml = '';
        if (abandonos.length > 0) {
            abandonosHtml = `
                <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 16px;">
                    <h4 style="margin-top: 0; color: #ef4444; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                        ⚠️ Risco de Abandono (${abandonos.length} pacientes)
                    </h4>
                    <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">Estes pacientes não comparecem há 2 semanas ou mais.</p>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${abandonos.map(a => `
                            <div style="background: rgba(0,0,0,0.2); border: 1px solid rgba(239,68,68,0.1); border-radius: 6px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong style="color: var(--text-main); font-size: 14px;">${a.nome.toUpperCase()}</strong>
                                    <span style="font-size: 10px; margin-left: 8px; padding: 2px 6px; border-radius: 12px; background: rgba(255,255,255,0.1); color: var(--text-muted); white-space: nowrap;">${a.tipo}</span>
                                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Faltas: ${a.faltasConsecutivas} semanas | Última vez: ${a.lastDate}</div>
                                </div>
                                ${a.telefone ? `
                                    <a href="https://wa.me/55${a.telefone.replace(/\D/g, '')}" target="_blank" class="btn" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); text-decoration: none; padding: 8px 12px; font-size: 12px; border-radius: 6px;">
                                        WhatsApp
                                    </a>
                                ` : '<span style="font-size: 11px; color: var(--text-muted);">Sem Telefone</span>'}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // 3. ACOMPANHAMENTO DETALHADO (LISTA COM CAIXINHAS)
        let listaHtml = `<div><h4 style="margin-top: 0; color: var(--primary); margin-bottom: 16px;">Progresso dos Tratamentos</h4>`;
        
        if (tratamentos.length === 0) {
            listaHtml += '<div style="color: var(--text-muted); font-style: italic; font-size: 13px;">Nenhum tratamento ativo no momento.</div>';
        } else {
            const sortedTrats = tratamentos.sort((a, b) => {
                const nameA = a.app_atendimento_fraterno?.nome_completo || '';
                const nameB = b.app_atendimento_fraterno?.nome_completo || '';
                return nameA.localeCompare(nameB);
            });

            listaHtml += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px;">`;
            
            sortedTrats.forEach(t => {
                const presencas = t.app_atendimento_presencas || [];
                const presCount = presencas.length;
                const limit = 4;
                
                let boxesHtml = '';
                for(let i = 0; i < limit; i++) {
                    if (i < presCount) {
                        boxesHtml += `<div style="width: 24px; height: 24px; border-radius: 4px; background: #10b981; border: 1px solid #059669; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">✓</div>`;
                    } else {
                        boxesHtml += `<div style="width: 24px; height: 24px; border-radius: 4px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 10px;">${i+1}</div>`;
                    }
                }
                
                if (presCount > limit) {
                    boxesHtml += `<div style="width: 24px; height: 24px; border-radius: 4px; background: rgba(16, 185, 129, 0.2); border: 1px dashed #10b981; display: flex; align-items: center; justify-content: center; color: #10b981; font-size: 10px; font-weight: bold;">+${presCount - limit}</div>`;
                }

                const badgeColor = t.tipo === 'Fluídico' ? '#3b82f6' : '#8b5cf6';
                
                listaHtml += `
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; flex-direction: column;">
                        <div style="font-size: 13px; font-weight: bold; color: var(--text-main); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${t.app_atendimento_fraterno?.nome_completo.toUpperCase()}
                        </div>
                        <div style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: ${badgeColor}; color: white; display: inline-block; margin-bottom: 12px; align-self: flex-start;">${t.tipo.toUpperCase()}</div>
                        <div style="display: flex; gap: 8px; align-items: center; justify-content: space-between;">
                            <div style="display: flex; gap: 4px;">
                                ${boxesHtml}
                            </div>
                            <div style="display: flex; gap: 4px;">
                                <button onclick="mudarStatusTratamento('${t.id}', 'Concluído')" title="Concluir" class="btn" style="padding: 4px; background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.3); border-radius: 4px; display: flex; align-items: center; justify-content: center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></button>
                                <button onclick="mudarStatusTratamento('${t.id}', 'Suspenso')" title="Suspender" class="btn" style="padding: 4px; background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); border-radius: 4px; display: flex; align-items: center; justify-content: center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                            </div>
                        </div>
                    </div>
                `;
            });
            listaHtml += `</div>`;
        }
        listaHtml += `</div>`;

        painelHtml.innerHTML = resumoHtml + abandonosHtml + listaHtml;
        lista.appendChild(painelHtml);

    } catch (err) {
        console.error(err);
        lista.innerHTML = '<span style="color:#ef4444;">Erro ao carregar painel semanal.</span>';
    }
};

window.abrirSideSheetPendenteHub = function(itemDataStr) {
    try {
        const item = JSON.parse(decodeURIComponent(itemDataStr));
        const html = `
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <div style="background: var(--bg-dark); padding: 16px; border-radius: 8px; border: 1px solid var(--border);">
                    <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Beneficiado</div>
                    <div style="font-size: 18px; font-weight: 700; color: var(--text-main);">${item.nome}</div>
                    <div style="font-size: 14px; color: var(--text-muted); margin-top: 4px;">📍 ${item.endereco}</div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div style="background: var(--bg-dark); padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Dia(s) da Semana</div>
                        <div style="font-size: 14px; font-weight: 600; color: var(--primary); margin-top: 4px;">${item.dias}</div>
                    </div>
                    <div style="background: var(--bg-dark); padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Semanas Alvo</div>
                        <div style="font-size: 14px; font-weight: 600; color: var(--text-main); margin-top: 4px;">${item.semanasAlvo} Semanas</div>
                    </div>
                </div>

                <div style="font-size: 12px; color: var(--text-muted); background: var(--bg-dark); padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
                    <div><strong>Data do Pedido:</strong> ${item.dataPed}</div>
                    ${item.criadoPor ? `<div style="margin-top: 4px;"><strong>Criado por:</strong> ${item.criadoPor}</div>` : ''}
                </div>

                <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 12px;">
                    <button class="btn" style="background: var(--success); color: white; width: 100%; padding: 12px; border-radius: 8px; border: none; font-weight: 600; font-size: 15px;" onclick="window.fecharSideSheet(); aprovarIrradiacao('${item.id}', '${item.nome.replace(/'/g, "\\'")}', '${item.endereco.replace(/'/g, "\\'")}', '${item.dias.replace(/'/g, "\\'")}')">Aprovar p/ Leitura ✔️</button>
                    
                    <button class="btn" style="background: transparent; color: var(--primary); width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--primary); font-weight: 600; font-size: 15px;" onclick="abrirModalEdicaoIrradiacao('${item.id}', '${item.nome.replace(/'/g, "\\'")}', '${item.endereco.replace(/'/g, "\\'")}', '${item.dias.replace(/'/g, "\\'")}', ${item.semanasAlvo})">Editar Solicitação ✏️</button>
                    
                    <button class="btn" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2); font-weight: 600; font-size: 15px;" onclick="window.fecharSideSheet(); excluirIrradiacaoDefinitivo('${item.id}')">Excluir Solicitação 🗑️</button>
                </div>
            </div>
        `;
        window.abrirSideSheet('Analisar Solicitação', html);
    } catch (e) {
        console.error("Erro ao abrir side-sheet", e);
    }
};

window.carregarHistoricoGeralDesktop = async function () {
    const lista = document.getElementById('listaAten');
    if (!lista) return;

    lista.innerHTML = '<div style="color: var(--text-muted); font-size: 14px; padding: 24px; text-align: center;">Carregando histórico geral...</div>';

    try {
        const [fraternoReq, tratamentosReq] = await Promise.all([
            db.from('app_atendimento_fraterno').select('*, pessoas!atendente_id(id, nome_completo, nome_curto), paciente:pessoas!paciente_id(nome_completo, nome_curto, celular, endereco, cep, cpf_cnpj, data_nascimento)').in('status', ['Atendido', 'Concluído']),
            db.from('app_atendimento_tratamentos').select('*, app_atendimento_fraterno(id, nome_completo, created_at, paciente:pessoas!paciente_id(*))').in('status', ['Concluído', 'Suspenso'])
        ]);

        if (fraternoReq.error) throw fraternoReq.error;
        if (tratamentosReq.error) throw tratamentosReq.error;

        const itens = [];

        // Map Fraternos (Triagem/Conversa)
        (fraternoReq.data || []).forEach(f => {
            if (!f.data_hora_atendimento) return;
            const nome = f.paciente?.nome_completo || f.nome_completo;
            itens.push({
                tipo: 'Fraterno',
                data: f.data_hora_atendimento,
                id: f.id,
                nome: nome,
                atendente: f.pessoas?.nome_curto || f.pessoas?.nome_completo || 'Sem Atendente',
                fraterno_id: f.id,
                telefone: f.paciente?.celular || f.telefone
            });
        });


        // Map Tratamentos
        (tratamentosReq.data || []).forEach(t => {
            const dateStr = t.data_fim || t.created_at;
            if (!dateStr) return;
            const nome = t.app_atendimento_fraterno?.nome_completo || 'Desconhecido';
            itens.push({
                tipo: t.tipo,
                data: dateStr,
                id: t.id,
                nome: nome,
                status: t.status, // Concluído | Suspenso
                fraterno_id: t.atendimento_id,
                telefone: t.app_atendimento_fraterno?.telefone,
                data_inicio: t.data_inicio
            });
        });

        if (itens.length === 0) {
            lista.innerHTML = '<div style="padding: 24px; text-align: center; border: 1px dashed var(--border); border-radius: 8px; color: var(--text-muted);">Nenhum histórico encontrado.</div>';
            return;
        }

        // Ordenar do mais recente para o mais antigo
        itens.sort((a, b) => parseDataLocal(b.data) - parseDataLocal(a.data));

        // Agrupar por Ano e Mês
        const grupos = {};
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        
        itens.forEach(item => {
            const d = parseDataLocal(item.data);
            const ano = d.getFullYear();
            const mesIdx = d.getMonth();
            const mesStr = monthNames[mesIdx];

            if (!grupos[ano]) grupos[ano] = {};
            if (!grupos[ano][mesStr]) grupos[ano][mesStr] = [];
            
            grupos[ano][mesStr].push(item);
        });

        lista.innerHTML = '';
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';

        const renderAno = (ano) => {
            let anoHtml = `
                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 8px;">
                    <div onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'" style="padding: 16px; background: rgba(0,0,0,0.2); cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <strong style="color: var(--text-main); font-size: 16px;">📂 Ano ${ano}</strong>
                        <span style="color: var(--text-muted); font-size: 12px;">Expandir/Recolher</span>
                    </div>
                    <div style="display: none; padding: 16px;">
            `;

            // Sort months descending (Dezembro to Janeiro)
            const sortedMonths = Object.keys(grupos[ano]).sort((a, b) => monthNames.indexOf(b) - monthNames.indexOf(a));
            
            sortedMonths.forEach(mes => {
                const registros = grupos[ano][mes];
                anoHtml += `
                    <div style="margin-bottom: 16px; margin-left: 16px; border-left: 2px solid var(--border); padding-left: 16px;">
                        <h4 style="color: var(--primary); font-size: 15px; margin-bottom: 12px; margin-top: 0; display: flex; align-items: center; gap: 8px;">
                            📂 ${mes} <span style="font-size: 11px; color: var(--text-muted); font-weight: normal; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 12px; white-space: nowrap;">${registros.length} registros</span>
                        </h4>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                `;

                registros.forEach(r => {
                    let badgeConfig = { color: '#f59e0b', text: '🤝 FRATERNO' };
                    let descHtml = `Atendente: ${r.atendente}`;
                    
                    if (r.tipo === 'Fluídico') {
                        badgeConfig = { color: '#3b82f6', text: '💧 FLUÍDICO' };
                        const statusColor = r.status === 'Concluído' ? '#10b981' : '#ef4444';
                        const inicioStr = r.data_inicio ? new Date(r.data_inicio).toLocaleDateString('pt-BR') : '?';
                        const fimStr = r.data ? new Date(r.data).toLocaleDateString('pt-BR') : '?';
                        descHtml = `Período: ${inicioStr} até ${fimStr} — <strong style="color: ${statusColor}">${r.status}</strong>`;
                    } else if (r.tipo === 'Espiritual') {
                        badgeConfig = { color: '#8b5cf6', text: '✨ ESPIRITUAL' };
                        const statusColor = r.status === 'Concluído' ? '#10b981' : '#ef4444';
                        const inicioStr = r.data_inicio ? new Date(r.data_inicio).toLocaleDateString('pt-BR') : '?';
                        const fimStr = r.data ? new Date(r.data).toLocaleDateString('pt-BR') : '?';
                        descHtml = `Período: ${inicioStr} até ${fimStr} — <strong style="color: ${statusColor}">${r.status}</strong>`;
                    }

                    const dtDisplay = new Date(r.data).toLocaleDateString('pt-BR');

                    anoHtml += `
                        <div style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                    <span style="font-size: 10px; font-weight: bold; background: ${badgeConfig.color}; color: white; padding: 2px 6px; border-radius: 4px; white-space: nowrap;">${badgeConfig.text}</span>
                                    <strong style="color: var(--text-main); font-size: 14px;">${r.nome.toUpperCase()}</strong>
                                </div>
                                <div style="font-size: 12px; color: var(--text-muted); display: flex; gap: 12px; align-items: center;">
                                    <span>📅 ${dtDisplay}</span>
                                    <span style="opacity: 0.3">|</span>
                                    <span>${descHtml}</span>
                                </div>
                            </div>
                            <button onclick="abrirFichaAtendimento('${r.fraterno_id}')" class="btn" style="background: rgba(255,255,255,0.05); color: var(--text-main); border: 1px solid var(--border); padding: 6px 12px; font-size: 12px; border-radius: 6px;">📝 Ficha</button>
                        </div>
                    `;
                });

                anoHtml += `</div></div>`;
            });

            anoHtml += `</div></div>`;
            return anoHtml;
        };

        const sortedYears = Object.keys(grupos).sort((a, b) => parseInt(b) - parseInt(a));
        sortedYears.forEach((ano, idx) => {
            const tmpDiv = document.createElement('div');
            tmpDiv.innerHTML = renderAno(ano);
            // Mostrar o primeiro ano já expandido
            if (idx === 0) {
                tmpDiv.firstElementChild.children[1].style.display = 'block';
            }
            container.appendChild(tmpDiv.firstElementChild);
        });

        lista.appendChild(container);

    } catch (err) {
        console.error(err);
        lista.innerHTML = '<span style="color:#ef4444;">Erro ao carregar histórico geral.</span>';
    }
};

window.carregarFicharioDesktop = function(allData, allTratamentos) {
    const lista = document.getElementById('listaAten');
    lista.innerHTML = '';
    
    // Calcula o total geral de fichas ÚNICAS
    const allPatientsSet = new Set();
    allData.forEach(d => {
        const nome = (d.nome_completo || 'Sem Nome').trim().toUpperCase();
        allPatientsSet.add(nome);
    });
    allTratamentos.forEach(t => {
        const f = t.app_atendimento_fraterno;
        if(f) allPatientsSet.add((f.nome_completo || 'Sem Nome').trim().toUpperCase());
    });
    const totalGeral = allPatientsSet.size;
    
    const patientsMap = new Map();
    const letter = currentAtendimentoSubTab;
    
    allData.forEach(d => {
        const nome = (d.nome_completo || 'Sem Nome').trim().toUpperCase();
        const initial = nome.charAt(0);
        if (initial === letter) {
            if (!patientsMap.has(nome)) {
                patientsMap.set(nome, {
                    nome_completo: (d.nome_completo || 'Sem Nome').trim(),
                    nome_curto: d.nome_curto || (d.nome_completo || 'Sem Nome').trim().split(' ')[0],
                    telefone: d.telefone || '',
                    data_nascimento: d.data_nascimento || '',
                    endereco: d.endereco_completo || '',
                    cpf_cnpj: d.cpf_cnpj || '',
                    paciente_id: d.paciente_id || null,
                    atendimentos: [],
                    tratamentos: []
                });
            }
            if(d.paciente_id && !patientsMap.get(nome).paciente_id) {
                patientsMap.get(nome).paciente_id = d.paciente_id;
            }
            patientsMap.get(nome).atendimentos.push(d);
        }
    });
    
    allTratamentos.forEach(t => {
        const f = t.app_atendimento_fraterno;
        if (!f) return;
        const nome = (f.nome_completo || 'Sem Nome').trim().toUpperCase();
        const initial = nome.charAt(0);
        if (initial === letter) {
            if (!patientsMap.has(nome)) {
                patientsMap.set(nome, {
                    nome_completo: (f.paciente?.nome_completo || f.nome_completo || 'Sem Nome').trim(),
                    nome_curto: f.paciente?.nome_curto || (f.nome_completo || 'Sem Nome').trim().split(' ')[0],
                    telefone: f.paciente?.celular || '',
                    data_nascimento: f.paciente?.data_nascimento || '',
                    endereco: f.paciente?.endereco || '',
                    cpf_cnpj: f.paciente?.cpf_cnpj || '',
                    paciente_id: f.paciente_id || null,
                    atendimentos: [],
                    tratamentos: []
                });
            }
            if(f.paciente_id && !patientsMap.get(nome).paciente_id) {
                patientsMap.get(nome).paciente_id = f.paciente_id;
            }
            patientsMap.get(nome).tratamentos.push(t);
        }
    });

    const patientsArray = Array.from(patientsMap.values());
    patientsArray.sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));
    const totalLetra = patientsArray.length;

    // Renderiza totalizadores no topo
    const summaryHtml = `
        <div style="background: linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%); border: 1px solid rgba(99,102,241,0.2); border-radius: 16px; padding: 24px; margin-bottom: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); backdrop-filter: blur(8px);">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px solid rgba(255,255,255,0.1);">
                <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; margin-bottom: 8px;">
                    Fichário
                </div>
                <div style="font-size: 36px; font-weight: 800; background: linear-gradient(to right, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1.1;">
                    ${totalGeral} <span style="font-size: 16px; font-weight: 600; opacity: 0.8;">Fichas</span>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; margin-bottom: 8px;">
                    Letra ${letter}
                </div>
                <div style="font-size: 36px; font-weight: 800; background: linear-gradient(to right, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1.1;">
                    ${totalLetra} <span style="font-size: 16px; font-weight: 600; opacity: 0.8;">Fichas</span>
                </div>
            </div>
        </div>
    `;
    
    lista.innerHTML = summaryHtml;

    if (patientsArray.length === 0) {
        const emptyEl = document.createElement('div');
        emptyEl.style.cssText = 'padding: 24px; text-align: center; background: rgba(255,255,255,0.02); border: 1px dashed var(--border); border-radius: 8px; color: var(--text-muted);';
        emptyEl.textContent = 'Nenhum paciente encontrado com a letra ' + letter;
        lista.appendChild(emptyEl);
        return;
    }

    lista.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;';

    patientsArray.forEach(p => {
        const card = document.createElement('div');
        card.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;';
        
        const countA = p.atendimentos.length;
        const countT = p.tratamentos.length;

        const safeId = 'p_' + Math.random().toString(36).substr(2, 9);
        window['fichario_' + safeId] = p;

        const shortName = p.nome_curto || (p.nome_completo ? p.nome_completo.split(' ')[0] : 'Sem nome');
        let nascimentoInfo = 'Não informada';
        if (p.data_nascimento) {
            const age = calcularIdade(p.data_nascimento);
            nascimentoInfo = `${p.data_nascimento.split('-').reverse().join('/')} (${age} anos)`;
        }
        
        let whatsLink = '';
        if (p.telefone) {
            const nums = p.telefone.replace(/\D/g, '');
            whatsLink = `
                <a href="https://wa.me/55${nums}" target="_blank" style="padding: 4px 8px; font-size: 12px; background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); text-decoration: none; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    WhatsApp
                </a>
            `;
        }

        card.innerHTML = `
            <div>
                <div style="display: flex; flex-direction: column; gap: 6px; flex: 1;">
                    <div style="display: flex; flex-direction: column; margin-bottom: 4px;">
                        <strong style="font-size: 16px; color: var(--text-main); line-height: 1.2;">${p.nome_completo ? p.nome_completo.toUpperCase() : 'SEM NOME'}</strong>
                        <span style="font-size: 12px; color: var(--text-muted); font-weight: 500;">${shortName}</span>
                    </div>
                    
                    <div style="font-size: 13px; color: var(--text-muted);">🎂 Nascimento: ${nascimentoInfo}</div>
                    <div style="font-size: 13px; color: var(--text-muted);">📄 CPF: ${p.cpf_cnpj ? formatarCPF(p.cpf_cnpj) : 'Não informado'}</div>
                    <div style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-muted); margin-top: 2px;">
                        <span>📱 Cel.: ${p.telefone ? formatarCelular(p.telefone) : 'Não informado'}</span>
                        ${whatsLink}
                    </div>
                </div>

                <div style="margin-top: 12px; margin-bottom: 16px; font-size: 12px; color: var(--text-muted); background: rgba(0,0,0,0.15); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); display: flex; gap: 12px; align-items: center;">
                    <span style="color: var(--primary);">${countA} Atendimentos</span>
                    <span style="opacity: 0.3;">|</span>
                    <span style="color: #10b981;">${countT} Tratamentos</span>
                </div>
            </div>

            <div style="display: flex; gap: 8px; flex-direction: row; margin-top: auto;">
                <button onclick="abrirFichaPacienteFichario('${p.paciente_id}')" class="btn" style="flex: 1; background: rgba(59,130,246,0.1); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); font-size: 12px; padding: 10px; cursor:pointer; border-radius: 8px; text-align: center;">
                    👤 Ficha
                </button>
                <button onclick="abrirModalFicharioCompleto('${safeId}')" class="btn" style="flex: 1; background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); font-size: 12px; padding: 10px; cursor:pointer; border-radius: 8px; text-align: center;">
                    📜 Histórico
                </button>
                <button onclick="iniciarNovoAtendimentoFichario('${safeId}')" class="btn" style="flex: 1; background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.3); font-size: 12px; padding: 10px; cursor:pointer; border-radius: 8px; text-align: center;">
                    ➕ Novo Atendimento
                </button>
            </div>
        `;
        lista.appendChild(card);
    });
};

window.abrirModalFicharioCompleto = async function(safeId) {
    const p = window['fichario_' + safeId];
    if(!p) return;
    
    window.abrirSideSheet('Histórico Consolidado', '<div style="padding: 24px;">Carregando histórico completo do banco de dados...</div>');
    
    let eventos = [];
    
    try {
        let query = db.from('app_atendimento_fraterno').select('*, pessoas!atendente_id(nome_completo, nome_curto), app_atendimento_fraterno!atendimento_id(pessoas!atendente_id(nome_completo, nome_curto))');
        if (p.paciente_id) {
            query = query.eq('paciente_id', p.paciente_id);
        } else {
            query = query.ilike('nome_completo', p.nome_completo);
        }
        
        const { data: atendimentos, error: errA } = await query;
            
        if (errA) throw errA;
        
        const allAtendimentos = atendimentos || [];
        
        allAtendimentos.forEach(a => {
            eventos.push({
                tipo: 'ATENDIMENTO', // Representa a Solicitação
                data: new Date(a.created_at),
                obj: a
            });
        });
        
        const fraternoIds = allAtendimentos.map(a => a.id);
        
        if (fraternoIds.length > 0) {
            // Fetch all Tratamentos regardless of status
            const { data: tratamentos, error: errT } = await db
                .from('app_atendimento_tratamentos')
                .select('*')
                .in('atendimento_id', fraternoIds);
                
            if (!errT && tratamentos) {
                tratamentos.forEach(t => {
                    eventos.push({
                        tipo: 'TRATAMENTO',
                        data: obterDataPrecisa(t.data_inicio, t.created_at),
                        obj: t
                    });
                });
            }
            
            // Fetch all Presenças
            const tratIds = tratamentos ? tratamentos.map(t => t.id) : [];
            if (tratIds.length > 0) {
                const { data: pres, error: errPres } = await db
                    .from('app_atendimento_presencas')
                    .select('*')
                    .in('tratamento_id', tratIds);
                if (!errPres && pres) {
                    pres.forEach(p => {
                        const trat = tratamentos.find(t => t.id === p.treatment_id || t.id === p.tratamento_id);
                        eventos.push({
                            tipo: 'PRESENCA',
                            data: obterDataPrecisa(p.data, p.created_at),
                            obj: p,
                            trat: trat
                        });
                    });
                }
            }
            
            // Fetch all Sessões
            const { data: sessoes, error: errS } = await db
                .from('app_atendimento_sessoes')
                .select('*, pessoas!atendente_id(nome_completo, nome_curto), app_atendimento_fraterno!atendimento_id(pessoas!atendente_id(nome_completo, nome_curto))')
                .in('atendimento_id', fraternoIds);
                
            if (!errS && sessoes) {
                sessoes.forEach(s => {
                    const parentAten = allAtendimentos.find(a => a.id === s.atendimento_id);
                    const atendenteNomeFallback = parentAten?.pessoas?.nome_curto || parentAten?.pessoas?.nome_completo || 'Desconhecido';
                    
                    eventos.push({
                        tipo: 'SESSAO',
                        data: obterDataPrecisa(s.data, s.created_at),
                        obj: s,
                        atendente_nome: s.pessoas?.nome_curto || s.pessoas?.nome_completo || atendenteNomeFallback
                    });
                });
            }
        }
        
        // Push cycle completion events guaranteed to be at the top of their respective cycles
        allAtendimentos.forEach(a => {
            if (a.status === 'Concluído' || a.status === 'Cancelado') {
                // Find the max date of all events associated with this Fraterno
                let maxDate = new Date(a.created_at);
                eventos.forEach(ev => {
                    if (ev.obj.atendimento_id === a.id || ev.obj.id === a.id || ev.trat?.atendimento_id === a.id) {
                        if (ev.data > maxDate) maxDate = ev.data;
                    }
                });
                eventos.push({
                    tipo: 'ATENDIMENTO_FIM',
                    data: new Date(maxDate.getTime() + 1000), // +1 sec to ensure it stays on top
                    obj: a
                });
            }
        });
        
        eventos.sort((a, b) => b.data - a.data); // newest first
        
        let html = `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <h4 style="margin-top:0; color:var(--primary); margin-bottom:12px;">${p.nome_completo.toUpperCase()}</h4>
                <strong>Telefone:</strong> ${p.telefone ? formatarCelular(p.telefone) : 'Não informado'}<br>
                <strong>Endereço:</strong> ${p.endereco || 'Não informado'}<br>
                <strong>Nascimento:</strong> ${p.data_nascimento ? p.data_nascimento.split('-').reverse().join('/') + ' (' + calcularIdade(p.data_nascimento) + ' anos)' : 'Não informado'}
            </div>
            <h4 style="color: var(--primary); margin-bottom: 16px;">Linha do Tempo</h4>
        `;
        
        if (eventos.length === 0) {
            html += '<div style="color:var(--text-muted); font-size:13px;">Nenhum evento registrado.</div>';
        } else {
            html += '<div style="display:flex; flex-direction:column; gap:12px; position:relative; padding-left:16px; border-left: 2px solid rgba(255,255,255,0.1); padding-bottom: 24px;">';
            eventos.forEach(ev => {
                const dateStr = ev.data.toLocaleDateString('pt-BR');
                if (ev.tipo === 'ATENDIMENTO') {
                    const badgeColor = ev.obj.status === 'Atendido' ? '#10b981' : (ev.obj.status === 'Em Tratamento' ? '#3b82f6' : (ev.obj.status === 'Cancelado' ? '#ef4444' : '#f59e0b'));
                    html += `
                        <div style="position:relative; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
                            <div style="position:absolute; left:-23px; top:14px; width:10px; height:10px; border-radius:50%; background: ${badgeColor}; border:2px solid var(--bg-panel);"></div>
                            <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">${dateStr}</div>
                            <div style="font-weight:bold; color:white; font-size:13px; margin-bottom:4px;">Solicitação de Atendimento Fraterno</div>
                            <div style="font-size:12px; color:var(--text-muted);">Por ${ev.obj.criado_por || 'Sistema'}</div>
                        </div>
                    `;
                } else if (ev.tipo === 'ATENDIMENTO_FIM') {
                    const badgeColor = ev.obj.status === 'Concluído' ? '#10b981' : '#ef4444';
                    const icon = ev.obj.status === 'Concluído' ? '✅' : '❌';
                    html += `
                        <div style="position:relative; background: rgba(255,255,255,0.02); border: 1px dashed ${badgeColor}; padding: 12px; border-radius: 8px; opacity: 0.8;">
                            <div style="position:absolute; left:-23px; top:14px; width:10px; height:10px; border-radius:50%; background: ${badgeColor}; border:2px solid var(--bg-panel);"></div>
                            <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">${dateStr}</div>
                            <div style="font-weight:bold; color:${badgeColor}; font-size:13px;">${icon} Ciclo do Fraterno ${ev.obj.status}</div>
                        </div>
                    `;
                } else if (ev.tipo === 'SESSAO') {
                    html += `
                        <div style="position:relative; background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                            <div style="position:absolute; left:-25px; top:14px; width:10px; height:10px; border-radius:50%; background: #f59e0b; border:2px solid var(--bg-panel);"></div>
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                <div>
                                    <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">${dateStr}</div>
                                    <div style="font-weight:bold; color:var(--primary); font-size:14px;">🤝 Sessão Fraterno</div>
                                </div>
                                <span style="color: var(--text-muted); font-size: 11px; text-align: right;">Atendente:<br>${ev.atendente_nome}</span>
                            </div>
                            <div style="color: var(--text-main); font-size: 13px; white-space: pre-wrap; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">${ev.obj.sintomas_orientacoes || 'Nenhum registro textual preenchido.'}</div>
                        </div>
                    `;
                } else if (ev.tipo === 'TRATAMENTO') {
                    const badgeColor = ev.obj.tipo === 'Espiritual' ? '#818cf8' : '#3b82f6';
                    const statusColor = ev.obj.status === 'Ativo' ? '#10b981' : 'var(--text-muted)';
                    html += `
                        <div style="position:relative; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
                            <div style="position:absolute; left:-23px; top:14px; width:10px; height:10px; border-radius:50%; background: ${badgeColor}; border:2px solid var(--bg-panel);"></div>
                            <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">${dateStr}</div>
                            <div style="font-weight:bold; color:white; font-size:13px; margin-bottom:4px;">Início Tratamento ${ev.obj.tipo}</div>
                            <div style="font-size:12px; color:var(--text-muted);">Status do Ciclo: <span style="color:${statusColor}">${ev.obj.status}</span></div>
                        </div>
                    `;
                } else if (ev.tipo === 'PRESENCA') {
                    const isEsp = ev.trat?.tipo === 'Espiritual';
                    const badgeColor = isEsp ? '#818cf8' : '#3b82f6';
                    const badgeText = isEsp ? '✨ ESPIRITUAL' : '💧 FLUÍDICO';
                    html += `
                        <div style="position:relative; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
                            <div style="position:absolute; left:-23px; top:14px; width:10px; height:10px; border-radius:50%; background: ${badgeColor}; border:2px solid var(--bg-panel);"></div>
                            <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">${dateStr}</div>
                            <div style="font-weight:bold; color:white; font-size:13px; margin-bottom:4px;">
                                <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: ${badgeColor}; color: white; margin-right: 6px; white-space: nowrap;">${badgeText}</span>
                                Presença Registrada
                            </div>
                            ${ev.obj.observacoes ? `<div style="font-size:12px; color:var(--text-muted); margin-top: 8px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border-left: 2px solid ${badgeColor};">Obs: ${ev.obj.observacoes}</div>` : ''}
                        </div>
                    `;
                }
            });
            html += '</div>';
        }
        
        document.getElementById('globalSideSheetContent').innerHTML = html;
        
    } catch(err) {
        console.error(err);
        document.getElementById('globalSideSheetContent').innerHTML = '<div style="padding:24px;color:#ef4444;">Erro ao carregar histórico.</div>';
    }
};

window.iniciarNovoAtendimentoFichario = function(safeId) {
    const p = window['fichario_' + safeId];
    if(!p) return;
    
    // Verifica se já existe atendimento fraterno em aberto ou tratamento ativo
    const hasActiveFraterno = p.atendimentos.some(a => a.status !== 'Concluído' && a.status !== 'Cancelado');
    const hasActiveTratamento = p.tratamentos.some(t => t.status === 'Ativo');

    if (hasActiveFraterno || hasActiveTratamento) {
        Swal.fire({
            title: 'Ação Bloqueada',
            text: 'Este paciente já possui um atendimento fraterno ou tratamento em andamento. Não é permitido iniciar um novo.',
            icon: 'warning',
            confirmButtonText: 'Entendi'
        });
        return;
    }

    Swal.fire({
        title: 'Novo Atendimento',
        text: 'Deseja iniciar um novo Atendimento Fraterno para ' + p.nome_completo + '?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sim, iniciar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                let criadoPor = 'Desconhecido';
                try {
                    const profStr = localStorage.getItem('sela_user_profile');
                    if (profStr) {
                        const prof = JSON.parse(profStr);
                        criadoPor = prof.nome_curto || (prof.nome || '').trim().split(' ')[0] || 'Desconhecido';
                    }
                } catch (e) { }

                const { error } = await db.from('app_atendimento_fraterno').insert([{
                    paciente_id: p.paciente_id || p.id || null, // ensure we fallback to p.id if it's from pessoas
                    nome_completo: p.nome_completo,
                    status: 'Pendente',
                    criado_por: criadoPor,
                    presente: false
                }]);
                
                if (error) throw error;
                
                Swal.fire('Sucesso!', 'Paciente adicionado à fila de Triagem (Pendente).', 'success');
                carregarListaAtendimento();
            } catch (err) {
                console.error(err);
                Swal.fire('Erro', 'Não foi possível iniciar o atendimento.', 'error');
            }
        }
    });
};
window.abrirFichaPacienteFichario = async function(pacienteId) {
    if (!pacienteId) {
        Swal.fire('Erro', 'Este paciente não possui um cadastro completo vinculado.', 'error');
        return;
    }
    
    window.abrirSideSheet('Ficha do Paciente', '<div style="padding: 24px; text-align: center;">Carregando dados cadastrais...</div>');
    
    try {
        const { data: p, error } = await db.from('pessoas').select('*').eq('id', pacienteId).single();
        if (error) throw error;
        
        const docFormatado = p.cpf_cnpj ? formatarCPF(p.cpf_cnpj) : '-';
        let celularHtml = '-';
        if (p.celular) {
            const num = p.celular.replace(/\D/g, '');
            celularHtml = `
                <a href="https://wa.me/55${num}" target="_blank" style="color: #25D366; text-decoration: none; display: flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    ${formatarCelular(p.celular)}
                </a>
            `;
        }
        
        let nascHtml = '-';
        if (p.data_nascimento) {
            const partes = p.data_nascimento.split('-');
            const age = calcularIdade(p.data_nascimento);
            nascHtml = `${partes.reverse().join('/')} (${age} anos)`;
        }

        const endPartes = [];
        if (p.endereco) endPartes.push(p.endereco);
        if (p.bairro) endPartes.push(p.bairro);
        let cidEst = [];
        if (p.cidade) cidEst.push(p.cidade);
        if (p.estado) cidEst.push(p.estado);
        if (cidEst.length > 0) endPartes.push(cidEst.join('/'));
        const endFull = endPartes.length > 0 ? endPartes.join(', ') : '-';

        let avatarHtml = '';
        if (p.foto_url) {
            avatarHtml = `<img src="${p.foto_url}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 30px; display: block;">`;
        } else {
            const partes = (p.nome_completo || ' ').trim().split(' ');
            let iniciais = partes[0].charAt(0);
            if (partes.length > 1) {
                iniciais += partes[partes.length - 1].charAt(0);
            }
            const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];
            const colorIndex = (p.nome_completo || '').length % colors.length;
            avatarHtml = `<div style="width: 60px; height: 60px; border-radius: 30px; background: ${colors[colorIndex]}; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: white;">${iniciais.toUpperCase()}</div>`;
        }

        const html = `
            <div style="padding: 24px; color: var(--text-main);">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
                    ${avatarHtml}
                    <div>
                        <h2 style="margin: 0; font-size: 20px;">${p.nome_completo || 'Sem Nome'}</h2>
                        <div style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">${p.nome_curto || ''}</div>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
                    <h4 style="margin-top: 0; margin-bottom: 16px; font-size: 14px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">Dados de Contato</h4>
                    
                    <div style="display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 24px;">
                        <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <span style="color: var(--text-muted); font-size: 13px;">Celular</span>
                            <strong style="font-size: 14px;">${celularHtml}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <span style="color: var(--text-muted); font-size: 13px;">E-mail</span>
                            <strong style="font-size: 14px;">${p.email || '-'}</strong>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <span style="color: var(--text-muted); font-size: 13px;">Endereço Completo</span>
                            <strong style="font-size: 14px; line-height: 1.4;">${endFull}</strong>
                        </div>
                    </div>

                    <h4 style="margin-top: 0; margin-bottom: 16px; font-size: 14px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">Dados Pessoais</h4>
                    
                    <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
                        <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <span style="color: var(--text-muted); font-size: 13px;">CPF</span>
                            <strong style="font-size: 14px;">${docFormatado}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <span style="color: var(--text-muted); font-size: 13px;">Nascimento</span>
                            <strong style="font-size: 14px;">${nascHtml}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <span style="color: var(--text-muted); font-size: 13px;">Sexo</span>
                            <strong style="font-size: 14px;">${p.sexo || '-'}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <span style="color: var(--text-muted); font-size: 13px;">Estado Civil</span>
                            <strong style="font-size: 14px;">${p.estado_civil || '-'}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <span style="color: var(--text-muted); font-size: 13px;">Profissão</span>
                            <strong style="font-size: 14px;">${p.profissao || '-'}</strong>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 24px;">
                    <a href="perfil.html?id=${pacienteId}" target="_blank" class="btn btn-primary" style="width: 100%; text-align: center; text-decoration: none;">Abrir Cadastro Completo no Portal ↗</a>
                </div>
            </div>
        `;
        window.abrirSideSheet('Ficha do Paciente', html);
    } catch(err) {
        console.error(err);
        window.abrirSideSheet('Erro', '<div style="padding: 24px; color: #ef4444;">Erro ao carregar os dados.</div>');
    }
};


// ==========================================
// MODAL DE GESTÃO DE EQUIPE (MODO LISTA)
// ==========================================



window.abrirHubModalEquipe = async function() {

    document.getElementById('hubModalEquipePlana').style.display = 'flex';
    document.getElementById('hubEqBuscaPessoa').value = '';
    document.getElementById('hubEqPessoaId').value = '';
    document.getElementById('hubEqPapel').value = '';
    const list = document.getElementById('listaPapeisComunsHub');
    if (list) list.innerHTML = '';
    inicializarBuscaPessoasHubEquipe();
    await carregarHubListaMembrosPlana();
};

window.fecharHubModalEquipe = function() {
    document.getElementById('hubModalEquipePlana').style.display = 'none';
    carregarEquipe(); // Recarrega os gridMembros originais do Hub
};

async function carregarHubListaMembrosPlana() {
    const tbody = document.getElementById('hubEqListaMembros');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:16px;">Carregando...</td></tr>';
    
    const { data, error } = await db.from('vinculos_estrutura').select('id, perfil, parent_vinculo_id, pessoas(nome_completo, nome_curto)').eq('estrutura_id', estruturaId);
    if (error) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#ef4444;">Erro ao carregar equipe.</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-muted); padding:16px;">Ninguém nesta equipe ainda.</td></tr>';
        return;
    }
    
    // Sort
    data.sort((a, b) => {
        const pA = (a.perfil || '').toLowerCase();
        const pB = (b.perfil || '').toLowerCase();
        if (pA.includes('diretor') && !pB.includes('diretor')) return -1;
        if (pB.includes('diretor') && !pA.includes('diretor')) return 1;
        const nA = a.pessoas ? a.pessoas.nome_completo : '';
        const nB = b.pessoas ? b.pessoas.nome_completo : '';
        return nA.localeCompare(nB);
    });
    
    
    const selResponde = document.getElementById('hubEqRespondeA');
    if (selResponde) {
        selResponde.innerHTML = '<option value="">Ninguém (Nó Principal)</option>';
        data.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = v.pessoas ? (v.pessoas.nome_curto || v.pessoas.nome_completo) : 'Desconhecido';
            selResponde.appendChild(opt);
        });
    }

    data.forEach(v => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        
        const parent = v.parent_vinculo_id ? data.find(x => x.id === v.parent_vinculo_id) : null;
        const parentName = parent && parent.pessoas ? (parent.pessoas.nome_curto || parent.pessoas.nome_completo) : '-';
        
        tr.innerHTML = `
            <td style="padding: 10px 8px; color: var(--text-main); font-weight: 500;">${v.pessoas ? (v.pessoas.nome_curto || v.pessoas.nome_completo) : 'Desconhecido'}</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">
                <input type="text" value="${v.perfil || ''}" class="form-control" style="background:transparent; border:1px dashed rgba(255,255,255,0.2); height: 28px; width: 140px; font-size: 12px;" onchange="hubAtualizarPapelEquipe('${v.id}', this.value)" title="Edite e aperte ENTER">
            </td>
            <td style="padding: 10px 8px; color: var(--text-muted); font-size: 12px;">${parentName}</td>
            <td style="padding: 10px 8px; text-align: right;">
                <button onclick="hubRemoverMembroEquipe('${v.id}')" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">Remover</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

let hubPessoasBuscaCache = [];
async function inicializarBuscaPessoasHubEquipe() {
    const input = document.getElementById('hubEqBuscaPessoa');
    const sugestoes = document.getElementById('hubEqSugestoes');
    if (!input) return;
    
    if (hubPessoasBuscaCache.length === 0) {
        const { data } = await db.from('pessoas').select('id, nome_completo, nome_curto, perfis');
        if (data) hubPessoasBuscaCache = data;
    }
    
    input.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        if (val.length < 2) {
            sugestoes.style.display = 'none';
            return;
        }
        
        const filter = hubPessoasBuscaCache.filter(p => {
            if (!p.nome_completo || !p.nome_completo.toLowerCase().includes(val)) return false;
            let arr = [];
            if (Array.isArray(p.perfis)) arr = p.perfis;
            else if (typeof p.perfis === 'string') arr = p.perfis.split(',').map(s=>s.trim());
            if (arr.includes('Outros')) return false;
            return true;
        }).slice(0, 8);
        
        if (filter.length > 0) {
            sugestoes.innerHTML = '';
            filter.forEach(p => {
                const div = document.createElement('div');
                div.style.padding = '8px 12px';
                div.style.cursor = 'pointer';
                div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                div.textContent = p.nome_curto || p.nome_completo;
                div.onmouseover = () => div.style.background = 'rgba(255,255,255,0.1)';
                div.onmouseout = () => div.style.background = 'transparent';
                div.onclick = () => {
                    input.value = p.nome_curto || p.nome_completo;
                    document.getElementById('hubEqPessoaId').value = p.id;
                    sugestoes.style.display = 'none';
                    
                    // Atualiza o datalist com os perfis da pessoa
                    const list = document.getElementById('listaPapeisComunsHub');
                    if (list) {
                        list.innerHTML = '';
                        let arr = [];
                        if (Array.isArray(p.perfis)) {
                            arr = p.perfis;
                        } else if (typeof p.perfis === 'string') {
                            arr = p.perfis.split(',').map(s => s.trim());
                        }
                        arr.forEach(perf => {
                            if (perf) {
                                const opt = document.createElement('option');
                                opt.value = perf;
                                list.appendChild(opt);
                            }
                        });
                        
                        const eqPapel = document.getElementById('hubEqPapel');
                        if (eqPapel) eqPapel.value = '';
                    }
                };
                sugestoes.appendChild(div);
            });
            sugestoes.style.display = 'block';
        } else {
            sugestoes.style.display = 'none';
        }
    });
    
    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== sugestoes) {
            sugestoes.style.display = 'none';
        }
    });
}

window.hubAdicionarMembroEquipe = async function() {
    const pessoaId = document.getElementById('hubEqPessoaId').value;
    const papel = document.getElementById('hubEqPapel').value;
    
    if (!pessoaId) {
        alert("Por favor, busque e selecione uma pessoa da lista.");
        return;
    }
    
    try {

        const respondeA = document.getElementById('hubEqRespondeA').value || null;
        const { error } = await db.from('vinculos_estrutura').insert({
            estrutura_id: estruturaId,
            pessoa_id: pessoaId,
            perfil: papel,
            parent_vinculo_id: respondeA
        });
        if (error) throw error;
        
        document.getElementById('hubEqBuscaPessoa').value = '';
        document.getElementById('hubEqPessoaId').value = '';
        document.getElementById('hubEqPapel').value = '';
        
        await carregarHubListaMembrosPlana();
    } catch(e) {
        alert("Erro ao adicionar: " + e.message);
    }
};

window.hubRemoverMembroEquipe = async function(vinculoId) {
    if (!confirm("Remover este membro da equipe?")) return;
    
    try {
        const { data: v } = await db.from('vinculos_estrutura').select('parent_vinculo_id').eq('id', vinculoId).single();
        const pId = v ? v.parent_vinculo_id : null;
        await db.from('vinculos_estrutura').update({ parent_vinculo_id: pId }).eq('parent_vinculo_id', vinculoId);
        
        const { error } = await db.from('vinculos_estrutura').delete().eq('id', vinculoId);
        if (error) throw error;
        
        await carregarHubListaMembrosPlana();
    } catch(e) {
        alert("Erro ao remover: " + e.message);
    }
};

window.hubAtualizarPapelEquipe = async function(vinculoId, novoPapel) {
    try {
        const { error } = await db.from('vinculos_estrutura').update({ perfil: novoPapel }).eq('id', vinculoId);
        if (error) throw error;
    } catch(e) {
        alert("Erro ao atualizar papel.");
    }
};
