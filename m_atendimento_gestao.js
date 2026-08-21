(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    
    // Configura o client seguro caso o Supabase não esteja carregado
    if (!window.supabase) {
        console.error("Supabase library not loaded!");
        document.addEventListener('DOMContentLoaded', () => {
            const container = document.getElementById('listaAtendimento');
            if (container) container.innerHTML = '<div class="empty-state" style="color:var(--danger);">Erro ao carregar o Supabase.</div>';
        });
    }
    const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

    let estruturaId = null;
    let abaPrincipal = 'triagem';
    let subAba = 'fila';
    let pacienteAtualFichaId = null;

    document.addEventListener('DOMContentLoaded', () => {
        // Inject Side-Sheet if not present
        if (!document.getElementById('globalSideSheet')) {
            const styleSheet = `
                <style>
                    .side-sheet-overlay {
                        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                        background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px);
                        z-index: 1050; opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
                    }
                    .side-sheet-overlay.show { opacity: 1; pointer-events: auto; }
                    .side-sheet {
                        position: fixed; top: 0; right: 0; width: 400px; max-width: 90vw; height: 100vh;
                        background: var(--bg-card, #1e293b); box-shadow: -4px 0 15px rgba(0,0,0,0.1);
                        z-index: 1100; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        display: flex; flex-direction: column;
                    }
                    .side-sheet.show { transform: translateX(0); }
                    .side-sheet-header {
                        padding: 20px 24px; border-bottom: 1px solid var(--border);
                        display: flex; align-items: center; justify-content: space-between;
                    }
                    .side-sheet-header h3 { margin: 0; font-size: 18px; color: var(--accent); }
                    .side-sheet-content { padding: 24px; flex: 1; overflow-y: auto; }
                </style>
            `;
            const sideSheetHTML = `
                <div id="globalSideSheetOverlay" class="side-sheet-overlay" onclick="fecharSideSheet()"></div>
                <div id="globalSideSheet" class="side-sheet">
                    <div class="side-sheet-header">
                        <h3 id="globalSideSheetTitle">Atendimento</h3>
                        <button class="btn-close" onclick="fecharSideSheet()" style="background:transparent; border:none; color:var(--text-muted); font-size:24px; cursor:pointer;">&times;</button>
                    </div>
                    <div id="globalSideSheetContent" class="side-sheet-content">
                    </div>
                </div>
            `;
            document.head.insertAdjacentHTML('beforeend', styleSheet);
            document.body.insertAdjacentHTML('beforeend', sideSheetHTML);
        }

        window.abrirSideSheet = function(titulo, htmlConteudo) {
            const titleEl = document.getElementById('globalSideSheetTitle');
            const contentEl = document.getElementById('globalSideSheetContent');
            const overlay = document.getElementById('globalSideSheetOverlay');
            const sheet = document.getElementById('globalSideSheet');
            if(titleEl) titleEl.textContent = titulo;
            if(contentEl) contentEl.innerHTML = htmlConteudo;
            if(overlay) overlay.classList.add('show');
            if(sheet) sheet.classList.add('show');
        };

        window.fecharSideSheet = function() {
            const overlay = document.getElementById('globalSideSheetOverlay');
            const sheet = document.getElementById('globalSideSheet');
            if(overlay) overlay.classList.remove('show');
            if(sheet) sheet.classList.remove('show');
            const contentEl = document.getElementById('globalSideSheetContent');
            if(contentEl) setTimeout(() => contentEl.innerHTML = '', 300);
        };

        const urlParams = new URLSearchParams(window.location.search);
        estruturaId = urlParams.get('id');

        document.getElementById('btnVoltar').addEventListener('click', () => {
            if (estruturaId) {
                window.location.href = `m_hub.html?id=${estruturaId}&tipo=atendimento`;
            } else {
                window.history.back();
            }
        });

        // Tabs switcher
        const tabs = document.querySelectorAll('.m-tab');
        tabs.forEach(t => {
            t.addEventListener('click', () => {
                tabs.forEach(x => x.classList.remove('active'));
                t.classList.add('active');
                abaPrincipal = t.dataset.main;
                
                // Definir subAba padrão baseada na Aba Principal
                if (abaPrincipal === 'triagem') subAba = 'fila';
                else if (abaPrincipal === 'atendimento') subAba = 'andamento';
                else if (abaPrincipal === 'acompanhamento') subAba = 'tratamentos';
                else if (abaPrincipal === 'historico') subAba = 'mes';
                
                renderSubTabs();
                carregarLista();
            });
        });

        window.switchSubTab = function(novaSubAba) {
            subAba = novaSubAba;
            renderSubTabs();
            carregarLista();
        };

        renderSubTabs();
        carregarLista();
    });

    function renderSubTabs() {
        const container = document.getElementById('subTabsContainer');
        if (abaPrincipal === 'triagem') {
            container.style.display = 'flex';
            container.innerHTML = `
                <div class="sub-tab-pill ${subAba === 'fila' ? 'active' : ''}" onclick="switchSubTab('fila')">📂 Fila Geral</div>
                <div class="sub-tab-pill ${subAba === 'espera' ? 'active' : ''}" onclick="switchSubTab('espera')">🛋️ Sala de Espera</div>
            `;
        } else if (abaPrincipal === 'atendimento') {
            container.style.display = 'none';
        } else if (abaPrincipal === 'acompanhamento') {
            container.style.display = 'flex';
            container.innerHTML = `
                <div class="sub-tab-pill ${subAba === 'tratamentos' ? 'active' : ''}" onclick="switchSubTab('tratamentos')">🩹 Tratamentos Ativos</div>
                <div class="sub-tab-pill ${subAba === 'painel_semanal' ? 'active' : ''}" onclick="switchSubTab('painel_semanal')">📊 Painel Semanal</div>
            `;
        } else if (abaPrincipal === 'historico') {
            container.style.display = 'flex';
            container.innerHTML = `
                <div class="sub-tab-pill ${subAba === 'historico_geral' ? 'active' : ''}" onclick="switchSubTab('historico_geral')" style="width: 100%;">📜 Histórico Geral</div>
            `;
        }
    }

    async function carregarLista() {
        const container = document.getElementById('listaAtendimento');
        container.innerHTML = '<div class="empty-state">Carregando...</div>';

        if (!db) return;

        try {
            const [fraternoReq, tratamentosReq] = await Promise.all([
                db.from('app_atendimento_fraterno').select('*, pessoas!atendente_id(id, nome_completo), app_pacientes(*)'),
                db.from('app_atendimento_tratamentos').select('*, app_atendimento_fraterno(id, nome_completo, endereco_completo, data_nascimento, telefone, created_at, app_pacientes(*))').eq('status', 'Ativo')
            ]);
            if (fraternoReq.error) throw fraternoReq.error;
            if (tratamentosReq.error) throw tratamentosReq.error;

            let allData = fraternoReq.data;
            const allTratamentos = tratamentosReq.data;

            const now = new Date();
            const curYear = now.getFullYear();
            const curMonth = now.getMonth();

            // Estatísticas
            if (allData) {
                allData = allData.map(f => {
                    if (f.app_pacientes) {
                        f.nome_completo = f.app_pacientes.nome_completo || f.nome_completo;
                        f.telefone = f.app_pacientes.telefone || f.telefone;
                        f.endereco_completo = f.app_pacientes.endereco_completo || f.endereco_completo;
                        f.data_nascimento = f.app_pacientes.data_nascimento || f.data_nascimento;
                    }
                    return f;
                });
            }

            const totalFila = allData.filter(d => d.status !== 'Atendido' && d.status !== 'Em Tratamento').length;
            const espera = allData.filter(d => d.presente && !d.atendente_id && d.status !== 'Atendido' && d.status !== 'Em Tratamento').length + allTratamentos.filter(t => t.presente).length;
            const andamento = allData.filter(d => d.presente && d.atendente_id && d.status !== 'Atendido' && d.status !== 'Em Tratamento').length;
            
            const totalTratamentos = allTratamentos ? allTratamentos.length : 0;

            const statsContainer = document.getElementById('statsDashboardMobile');
            if (statsContainer) {
                statsContainer.innerHTML = `
                    <div style="flex: 0 0 auto; min-width: 80px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; text-align: center;">
                        <div style="font-size: 10px; color: var(--text-muted); margin-bottom: 2px;">📂 Fila</div>
                        <div style="font-size: 13px; font-weight: bold; color: var(--primary);">${totalFila}</div>
                    </div>
                    <div style="flex: 0 0 auto; min-width: 80px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; text-align: center;">
                        <div style="font-size: 10px; color: var(--text-muted); margin-bottom: 2px;">🛋️ Espera</div>
                        <div style="font-size: 13px; font-weight: bold; color: #f59e0b;">${espera}</div>
                    </div>
                    <div style="flex: 0 0 auto; min-width: 80px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; text-align: center;">
                        <div style="font-size: 10px; color: var(--text-muted); margin-bottom: 2px;">🩹 Tratando</div>
                        <div style="font-size: 13px; font-weight: bold; color: #10b981;">${totalTratamentos}</div>
                    </div>
                `;
            }

            let filteredData = [];

            if (subAba === 'fila' || subAba === 'espera') {
                const isFila = subAba === 'fila';

                const frats = allData.filter(d => isFila ? (!d.presente && !d.atendente_id && d.status !== 'Atendido' && d.status !== 'Em Tratamento') : (d.presente && !d.atendente_id && d.status !== 'Atendido' && d.status !== 'Em Tratamento'))
                    .map(d => ({ ...d, unified_type: 'Fraterno' }));

                const trats = allTratamentos.filter(d => isFila ? !d.presente : d.presente)
                    .map(d => ({
                        id: d.id,
                        fraterno_id: d.fraterno_id,
                        unified_type: d.tipo,
                        nome_completo: d.app_atendimento_fraterno?.app_pacientes?.nome_completo || d.app_atendimento_fraterno?.nome_completo || '',
                        endereco_completo: d.app_atendimento_fraterno?.app_pacientes?.endereco_completo || d.app_atendimento_fraterno?.endereco_completo || '',
                        telefone: d.app_atendimento_fraterno?.app_pacientes?.telefone || d.app_atendimento_fraterno?.telefone || '',
                        data_nascimento: d.app_atendimento_fraterno?.app_pacientes?.data_nascimento || d.app_atendimento_fraterno?.data_nascimento || '',
                        created_at: d.app_atendimento_fraterno?.created_at || d.created_at,
                        presente: d.presente,
                        status: d.status,
                        is_tratamento: true
                    }));

                filteredData = [...frats, ...trats];

                const orderType = { 'Fraterno': 1, 'Fluídico': 2, 'Espiritual': 3 };
                filteredData.sort((a, b) => {
                    const oa = orderType[a.unified_type] || 99;
                    const ob = orderType[b.unified_type] || 99;
                    if (oa !== ob) return oa - ob;
                    return (a.nome_completo || '').localeCompare(b.nome_completo || '');
                });

                renderNormalList(filteredData);
            } 
            else if (subAba === 'andamento') {
                filteredData = allData.filter(d => d.atendente_id && d.status !== 'Atendido' && d.status !== 'Em Tratamento');
                renderAndamentoList(filteredData);
            } 
            else if (subAba === 'historico_geral') {
                carregarHistoricoGeralMobile();
            } 
            else if (subAba === 'tratamentos') {
                carregarTratamentosAtivos();
            } 
            else if (subAba === 'presencas') {
                carregarFilaPresencas();
            } 
            else if (subAba === 'espera_tratamento') {
                carregarEsperaTratamento();
            }
            else if (subAba === 'painel_semanal') {
                carregarPainelSemanal();
            }


        } catch (e) {
            console.error("Erro ao carregar dados:", e);
            container.innerHTML = `<div class="empty-state" style="color:var(--danger);">Erro ao carregar dados do Supabase:<br><small style="color:#ef4444; margin-top:8px; display:block;">${e.message || JSON.stringify(e)}</small></div>`;
        }
    }

    function renderNormalList(data) {
        const container = document.getElementById('listaAtendimento');
        container.innerHTML = '';
        if (data.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum necessitado nesta fila.</div>';
            return;
        }

        let currentType = null;
        data.forEach(item => {
            if (item.unified_type && item.unified_type !== currentType) {
                currentType = item.unified_type;
                const typeColor = currentType === 'Fraterno' ? '#f59e0b' : (currentType === 'Fluídico' ? '#3b82f6' : '#8b5cf6');
                const header = document.createElement('div');
                header.style.cssText = `margin-top: 16px; margin-bottom: 8px; font-weight: bold; color: ${typeColor}; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px; display: flex; align-items: center; gap: 8px;`;
                header.innerHTML = `<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${typeColor};"></span> ${currentType.toUpperCase()}`;
                container.appendChild(header);
            }
            container.appendChild(criarCardElement(item));
        });
    }

    function renderAndamentoList(data) {
        const container = document.getElementById('listaAtendimento');
        container.innerHTML = '';
        if (data.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum atendimento em andamento.</div>';
            return;
        }
        data.sort((a, b) => {
            const attA = (a.pessoas?.nome_completo || 'Sem Atendente').toLowerCase();
            const attB = (b.pessoas?.nome_completo || 'Sem Atendente').toLowerCase();
            if (attA !== attB) return attA.localeCompare(attB);
            return (a.nome_completo || '').toLowerCase().localeCompare((b.nome_completo || '').toLowerCase());
        });

        let currentAtt = null;
        data.forEach(item => {
            const attName = item.pessoas?.nome_completo || 'Sem Atendente';
            if (attName !== currentAtt) {
                currentAtt = attName;
                const header = document.createElement('div');
                header.style.cssText = 'font-weight: bold; color: var(--primary); font-size: 14px; margin-top: 16px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;';
                header.innerHTML = `👨‍💼 Atendente: ${currentAtt.toUpperCase()}`;
                container.appendChild(header);
            }
            container.appendChild(criarCardElement(item));
        });
    }

    function renderHistoricoList(data) {
        const container = document.getElementById('listaAtendimento');
        container.innerHTML = '';
        if (data.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum atendimento concluído este mês.</div>';
            return;
        }
        data.sort((a, b) => new Date(b.data_hora_atendimento || b.created_at) - new Date(a.data_hora_atendimento || a.created_at));

        let currentMonthYear = null;
        data.forEach(item => {
            const dVal = new Date(item.data_hora_atendimento || item.created_at);
            const monthYear = dVal.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
            if (monthYear !== currentMonthYear) {
                currentMonthYear = monthYear;
                const header = document.createElement('div');
                header.style.cssText = 'font-weight: bold; color: #10b981; font-size: 14px; margin-top: 16px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;';
                header.innerHTML = `📅 ${currentMonthYear}`;
                container.appendChild(header);
            }
            container.appendChild(criarCardElement(item));
        });
    }

    function criarCardElement(item) {
        const dataCriacao = new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
        
        let nascimentoInfo = 'Não informada';
        if (item.data_nascimento) {
            const nascAno = item.data_nascimento.split('-')[0];
            const age = new Date().getFullYear() - parseInt(nascAno);
            nascimentoInfo = `${item.data_nascimento.split('-').reverse().join('/')} (${age} anos)`;
        }

        let infoExtra = '';
        if (item.status === 'Atendido' && item.data_hora_atendimento) {
            const dtAten = new Date(item.data_hora_atendimento).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            infoExtra = `<div style="font-size: 13px; color: #10b981; margin-top: 6px;">✓ Atendido em: ${dtAten} por ${item.pessoas?.nome_completo || 'Atendente'}</div>`;
        } else if (item.status === 'Planejado' && item.pessoas?.nome_completo) {
            infoExtra = `<div style="font-size: 13px; color: var(--primary); margin-top: 6px;">📅 Atribuído a: ${item.pessoas.nome_completo}</div>`;
        }

        const btnPresenca = item.presente ? 
            `<button class="btn-action" onclick="alternarPresenca('${item.id}', false)" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); transition: all 0.2s;" onmouseover="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.color='#ef4444'; this.style.borderColor='rgba(239, 68, 68, 0.3)'; this.textContent='🔴 Não Presente';" onmouseout="this.style.background='rgba(16, 185, 129, 0.1)'; this.style.color='#10b981'; this.style.borderColor='rgba(16, 185, 129, 0.2)'; this.textContent='🟢 Presente';">🟢 Presente</button>` :
            `<button class="btn-action" onclick="alternarPresenca('${item.id}', true)" style="background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border); transition: all 0.2s;">Confirmar Presença</button>`;

        const div = document.createElement('div');
        div.className = 'card-atendimento';
        div.style.marginBottom = '12px';
        div.innerHTML = `
            <div class="card-header">
                <div>
                    <div class="card-title">${item.nome_completo ? item.nome_completo.toUpperCase() : 'Sem Nome'}</div>
                    <div class="card-date">Criado em: ${dataCriacao}${item.criado_por ? ' por ' + item.criado_por : ''}</div>
                </div>
            </div>
            
            <div class="card-info"><strong>Endereço:</strong> ${item.endereco_completo || '-'}</div>
            <div class="card-info"><strong>Nascimento:</strong> ${nascimentoInfo}</div>
            <div class="card-info"><strong>WhatsApp:</strong> 
                ${item.telefone ? `<a href="https://wa.me/55${item.telefone.replace(/\D/g, '')}" target="_blank" style="color:var(--primary); text-decoration:none;">${item.telefone}</a>` : '-'}
            </div>
            ${infoExtra}

            <div class="card-actions" style="flex-wrap: wrap; margin-top: 12px; gap: 8px;">
                ${item.is_tratamento ? `
                    ${item.presente ? 
                        `<button class="btn-action" onclick="marcarTratamentoPresenteMobile('${item.id}', false)" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); width: 100%;">🔴 Remover Presença</button>` :
                        `<button class="btn-action" onclick="marcarTratamentoPresenteMobile('${item.id}', true)" style="background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border); width: 100%;">⚪ Confirmar Presença</button>`
                    }
                ` : `
                    ${item.status !== 'Atendido' ? btnPresenca : ''}
                    
                    ${item.status === 'Pendente' || (item.status === 'Planejado' && subAba !== 'andamento') ? `
                        <button class="btn-action" onclick="abrirTriagem('${item.id}')" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2);">🤝 Triagem</button>
                    ` : ''}

                    ${item.status === 'Planejado' && item.presente ? `
                        <button class="btn-action" onclick="abrirFichaAtendimento('${item.id}')" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">📝 Ficha</button>
                    ` : ''}

                    ${item.status === 'Atendido' ? `
                        <button class="btn-action" onclick="abrirFichaAtendimento('${item.id}')" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">📝 Ficha</button>
                    ` : ''}

                    ${item.status === 'Planejado' ? `
                        <button class="btn-action" onclick="desatribuirAtendente('${item.id}')" style="background: rgba(239, 68, 68, 0.05); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);">👤✕ Desatribuir</button>
                    ` : ''}

                    <div style="display: flex; gap: 8px; flex: none; width: auto; min-width: 44px; margin-left: auto;">
                        ${item.status === 'Atendido' ? `
                        <button class="btn-action" onclick="encaminharParaNovaTriagemMobile('${item.id}')" style="flex: none; width: auto; padding: 10px; background: rgba(139, 92, 246, 0.1); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.3);">📋 Novo Atendimento</button>
                        ` : ''}
                        <button class="btn-action" onclick="abrirEdicaoAtendimento('${item.id}', '${(item.nome_completo || '').replace(/'/g, "\\'").replace(/[\r\n]+/g, ' ')}', '${(item.endereco_completo || '').replace(/'/g, "\\'").replace(/[\r\n]+/g, ' ')}', '${(item.telefone || '').replace(/'/g, "\\'")}')" style="flex: none; width: auto; min-width: 44px; padding: 10px; background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2);">✏️</button>
                        <button class="btn-action btn-delete" onclick="excluirPedido('${item.id}')" style="flex: none; width: auto; min-width: 44px; padding: 10px;">🗑️</button>
                    </div>
                `}
            </div>
        `;
        return div;
    }

    // --- SESSOES DE FICHA DE ATENDIMENTO ---

    window.abrirFichaAtendimento = async function(id) {
        pacienteAtualFichaId = id;
        window.abrirSideSheet('Ficha de Atendimento', '<div style="padding: 24px;">Carregando dados...</div>');

        try {
            // Detalhes do necessitado
            const { data: paciente, error } = await db.from('app_atendimento_fraterno').select('*, app_pacientes(*)').eq('id', id).single();
            if (error) throw error;

            let infoHtml = `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <h4 style="margin-top:0; color:var(--primary); margin-bottom:12px;">Dados do Necessitado</h4>
                    <strong>Nome:</strong> ${(paciente.app_pacientes?.nome_completo || paciente.nome_completo || '').toUpperCase()}<br>
                    <strong>Nascimento:</strong> ${paciente.app_pacientes?.data_nascimento || paciente.data_nascimento ? (paciente.app_pacientes?.data_nascimento || paciente.data_nascimento).split('-').reverse().join('/') : '-'}<br>
                    <strong>Telefone:</strong> ${paciente.app_pacientes?.telefone || paciente.telefone || '-'}
                </div>
            `;

            // Histórico de sessões anteriores
            const { data: sessoes, error: errSess } = await db.from('app_atendimento_sessoes')
                .select('*, pessoas!atendente_id(nome_completo)')
                .eq('atendimento_id', id)
                .order('data', { ascending: false })
                .limit(4);

            if (errSess) throw errSess;

            let sessoesHtml = '<div style="margin-bottom: 24px;"><h4 style="margin-top:0; color:var(--primary); margin-bottom:12px;">Histórico de Atendimentos Fraternos</h4>';
            if (sessoes && sessoes.length > 0) {
                sessoes.forEach((s, idx) => {
                    const dt = s.data ? s.data.split('T')[0].split('-').reverse().join('/') : '';
                    sessoesHtml += `
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 10px; font-size: 13px; margin-bottom: 8px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; font-weight:bold; color:var(--text-main);">
                                <div>
                                    <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: #f59e0b; color: white; text-transform: uppercase;">FRATERNO</span>
                                    <span style="margin-left: 4px;">Sessão de ${dt}</span>
                                </div>
                                <span style="color:var(--primary); font-size:11px;">Atendente: ${s.pessoas?.nome_completo || 'N/A'}</span>
                            </div>
                            <div style="color:var(--text-muted); line-height:1.4; white-space:pre-wrap;">${s.sintomas_orientacoes}</div>
                        </div>
                    `;
                });
            } else {
                sessoesHtml += '<div style="font-size:12px; color:var(--text-muted); font-style:italic;">Nenhuma sessão anterior gravada.</div>';
            }
            sessoesHtml += '</div>';

            let chkF = false;
            let chkE = false;
            // Verificar se já possui tratamentos ativos prescritos
            const { data: trats } = await db.from('app_atendimento_tratamentos').select('tipo').eq('atendimento_id', id).eq('status', 'Ativo');
            if (trats) {
                trats.forEach(t => {
                    if (t.tipo === 'Fluídico') chkF = true;
                    if (t.tipo === 'Espiritual') chkE = true;
                });
            }

            let formHtml = '';
            if (paciente.status !== 'Atendido') {
                formHtml = `
                    <div style="margin-bottom: 24px;">
                        <h4 style="margin-top:0; color:var(--primary); margin-bottom:12px;">Registro de Atendimento</h4>
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label style="color: var(--text-muted); font-size: 13px;">Sintomas e Orientações</label>
                            <textarea id="sideTxtSintomasOrientacoes" class="input" rows="4" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: white; padding: 12px; border-radius: 8px;" placeholder="Descreva os sintomas apresentados..."></textarea>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" id="sideChkTratFluidico" ${chkF ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary);" onchange="if(this.checked) document.getElementById('sideChkApenasConversa').checked = false;">
                                <span>Prescrever Tratamento Fluídico</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" id="sideChkTratEspiritual" ${chkE ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary);" onchange="if(this.checked) document.getElementById('sideChkApenasConversa').checked = false;">
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
                        <button type="button" onclick="salvarFichaAtendimentoSideSheet(this)" class="btn" style="flex:1; padding: 12px; border-radius: 8px; background: var(--primary); color: white; border: none; font-weight: 600;">Gravar</button>
                    </div>
                `;
            } else {
                formHtml = `
                    <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 12px; align-items: center;">
                        <p style="color: var(--text-muted); font-size: 13px; text-align: center;">Este atendimento já foi concluído.</p>
                        <button type="button" onclick="window.fecharSideSheet(); encaminharParaNovaTriagemMobile('${id}');" class="btn-action" style="padding: 12px 24px; background: rgba(139, 92, 246, 0.1); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.3); width: 100%;">📋 Iniciar Novo Atendimento</button>
                    </div>
                `;
            }

            const finalHtml = `
                <div style="display: flex; flex-direction: column; gap: 8px; padding-bottom: 32px;">
                    ${infoHtml}
                    ${sessoesHtml}
                    ${formHtml}
                </div>
            `;
            document.getElementById('globalSideSheetContent').innerHTML = finalHtml;

        } catch(e) {
            Swal.fire('Erro', 'Erro ao abrir a ficha: ' + e.message, 'error');
            window.fecharSideSheet();
        }
    };

    window.salvarFichaAtendimentoSideSheet = async function(btn) {
        if (!pacienteAtualFichaId) return;

        const anotacoes = document.getElementById('sideTxtSintomasOrientacoes').value.trim();
        const querFluidico = document.getElementById('sideChkTratFluidico').checked;
        const querEspiritual = document.getElementById('sideChkTratEspiritual').checked;
        const apenasConversa = document.getElementById('sideChkApenasConversa').checked;
        const evangelhoLar = document.getElementById('sideChkEvangelhoLar').checked;

        if (!anotacoes) {
            Swal.fire('Aviso', 'Por favor, preencha os sintomas/orientações da sessão.', 'warning');
            return;
        }

        if (!querFluidico && !querEspiritual && !apenasConversa) {
            Swal.fire('Aviso', 'Por favor, selecione ao menos um Tratamento ou marque Apenas Conversa Fraterna.', 'warning');
            return;
        }

        const btnOriginalText = btn ? btn.innerHTML : 'Gravar';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '⏳ Gravando...';
            btn.style.opacity = '0.7';
        }

        try {
            const profStr = localStorage.getItem('sela_user_profile');
            let atendenteId = null;
            if (profStr) {
                const prof = JSON.parse(profStr);
                atendenteId = prof.id;
            }

            const { error: errSess } = await db.from('app_atendimento_sessoes').insert([{
                atendimento_id: pacienteAtualFichaId,
                data: new Date().toISOString().split('T')[0],
                atendente_id: atendenteId,
                sintomas_orientacoes: anotacoes,
                apenas_conversa: apenasConversa,
                evangelho_lar: evangelhoLar
            }]);
            if (errSess) throw errSess;

            if (querFluidico) {
                const { data: existFluid } = await db.from('app_atendimento_tratamentos').select('id').eq('atendimento_id', pacienteAtualFichaId).eq('tipo', 'Fluídico').eq('status', 'Ativo');
                if (!existFluid || existFluid.length === 0) {
                    await db.from('app_atendimento_tratamentos').insert([{
                        atendimento_id: pacienteAtualFichaId,
                        tipo: 'Fluídico',
                        status: 'Ativo',
                        data_inicio: new Date().toISOString().split('T')[0]
                    }]);
                }
            }

            // 3. Tratar a prescrição dos tratamentos (Espiritual)
            if (querEspiritual) {
                const { data: existEsp } = await db.from('app_atendimento_tratamentos').select('id').eq('atendimento_id', pacienteAtualFichaId).eq('tipo', 'Espiritual').eq('status', 'Ativo');
                if (!existEsp || existEsp.length === 0) {
                    await db.from('app_atendimento_tratamentos').insert([{
                        atendimento_id: pacienteAtualFichaId,
                        tipo: 'Espiritual',
                        status: 'Ativo',
                        data_inicio: new Date().toISOString().split('T')[0]
                    }]);
                }
            }

            // 4. Mudar status do paciente para 'Em Tratamento' ou 'Atendido' e registrar a data do último atendimento
            const novoStatus = (querFluidico || querEspiritual) ? 'Em Tratamento' : 'Atendido';
            await db.from('app_atendimento_fraterno').update({
                status: novoStatus,
                data_hora_atendimento: new Date().toISOString()
            }).eq('id', pacienteAtualFichaId);

            Swal.fire('Sucesso', 'Sessão gravada e tratamentos prescritos!', 'success');
            window.fecharSideSheet();
            carregarLista();

        } catch(e) {
            Swal.fire('Erro', 'Erro ao gravar: ' + e.message, 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = btnOriginalText;
                btn.style.opacity = '1';
            }
        }
    };

    // --- GESTÃO DE TRATAMENTOS ATIVOS ---

    async function carregarTratamentosAtivos() {
        const container = document.getElementById('listaAtendimento');
        container.innerHTML = '';

        try {
            const { data: trats, error } = await db.from('app_atendimento_tratamentos')
                .select('*, app_atendimento_fraterno(app_pacientes(*), nome_completo, telefone), app_atendimento_presencas(data)')
                .eq('status', 'Ativo');

            if (error) throw error;

            if (!trats || trats.length === 0) {
                container.innerHTML = '<div class="empty-state">Nenhum tratamento ativo no momento.</div>';
                return;
            }

            trats.sort((a, b) => {
                const nameA = a.app_atendimento_fraterno?.app_pacientes?.nome_completo || a.app_atendimento_fraterno?.nome_completo || '';
                const nameB = b.app_atendimento_fraterno?.app_pacientes?.nome_completo || b.app_atendimento_fraterno?.nome_completo || '';
                return nameA.localeCompare(nameB);
            });

            trats.forEach(t => {
                const card = document.createElement('div');
                card.className = 'card-atendimento';
                card.style.marginBottom = '12px';
                
                const dtInicio = t.data_inicio ? t.data_inicio.split('T')[0].split('-').reverse().join('/') : '';
                const tipoCor = t.tipo === 'Espiritual' ? '#8b5cf6' : '#3b82f6';
                
                let attendedToday = false;
                if (t.app_atendimento_presencas) {
                    const now = new Date();
                    const tzOffset = now.getTimezoneOffset() * 60000;
                    const todayLocal = new Date(now.getTime() - tzOffset).toISOString().split('T')[0];
                    
                    attendedToday = t.app_atendimento_presencas.some(p => {
                        if (!p.data) return false;
                        return p.data.split('T')[0] === todayLocal;
                    });
                }

                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-size:15px; font-weight:600; color:white;">${(t.app_atendimento_fraterno?.app_pacientes?.nome_completo || t.app_atendimento_fraterno?.nome_completo || '').toUpperCase()}</span>
                        <span style="font-size:11px; font-weight:600; padding:2px 8px; border-radius:12px; background:${tipoCor}22; color:${tipoCor}; border:1px solid ${tipoCor}44;">${t.tipo}</span>
                    </div>
                    <div class="card-info"><strong>Início em:</strong> ${dtInicio}</div>
                    <div class="card-info"><strong>WhatsApp:</strong> ${t.app_atendimento_fraterno?.app_pacientes?.telefone || t.app_atendimento_fraterno?.telefone || '-'}</div>

                    <div style="margin-top:12px; display:flex; gap:8px;">
                        ${attendedToday
                            ? `<button disabled class="btn-action" style="background:rgba(255,255,255,0.05); color:var(--text-muted); border:1px dashed var(--border); width:100%; font-size: 11px;">Atendimento já foi realizado HOJE!</button>`
                            : `<button onclick="confirmarSessaoTratamento('${t.id}', '${t.tipo}')" class="btn-action" style="background:${tipoCor}; color:white; border:none; width:100%;">Confirmar Atendimento</button>`
                        }
                    </div>
                    <div style="margin-top:8px; display:flex; gap:8px;">
                        <button onclick="mudarStatusTratamento('${t.id}', 'Concluído')" class="btn-action" style="background:rgba(16,185,129,0.1); color:#10b981; border:1px solid rgba(16,185,129,0.2);">Concluir</button>
                        <button onclick="mudarStatusTratamento('${t.id}', 'Suspenso')" class="btn-action" style="background:rgba(239,68,68,0.1); color:#ef4444; border:1px solid rgba(239,68,68,0.2);">Suspender</button>
                    </div>
                    <div style="margin-top:8px;">
                        <button onclick="encaminharParaNovaTriagemMobile('${t.app_atendimento_fraterno?.id}')" class="btn-action" style="width:100%; background:rgba(139, 92, 246, 0.1); color:#8b5cf6; border:1px solid rgba(139, 92, 246, 0.3);">📋 Novo Atendimento</button>
                    </div>
                    <div style="margin-top:8px;">
                        <button onclick="toggleEvolucaoInlineMobile('${t.app_atendimento_fraterno ? t.app_atendimento_fraterno.id : ''}')" class="btn-action" style="width:100%; background:rgba(255,255,255,0.05); color:white; border:1px solid var(--border);">📝 Evolução & Prontuário</button>
                    </div>
                    
                    <div id="panel_evolucao_m_${t.app_atendimento_fraterno ? t.app_atendimento_fraterno.id : 'none'}" style="display: none; margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px;"></div>
                `;
                container.appendChild(card);
            });
        } catch (e) {
            container.innerHTML = `<div class="empty-state">Erro: ${e.message}</div>`;
        }
    }

    window.toggleEvolucaoInlineMobile = async function (id) {
        if (!id || id === 'undefined' || id === 'none') {
            Swal.fire('Aviso', 'Ficha original de triagem não encontrada ou desvinculada. Não é possível carregar a evolução.', 'info');
            return;
        }
        const panel = document.getElementById('panel_evolucao_m_' + id);
        if (!panel) return;

        if (panel.style.display === 'block') {
            panel.style.display = 'none';
            return;
        }

        panel.style.display = 'block';
        panel.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; padding: 8px;">Carregando histórico e prontuário de evolução...</div>';

        try {
            const { data: sessoes, error: errSess } = await db
                .from('app_atendimento_sessoes')
                .select('*, pessoas!atendente_id(nome_completo)')
                .eq('atendimento_id', id)
                .order('data', { ascending: false })
                .limit(4);

            if (errSess) throw errSess;

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
                    presencasHTML = '<div style="color: var(--text-muted); font-style: italic; font-size: 12px; padding: 4px;">Nenhuma presença registrada ainda.</div>';
                } else {
                    presencasHTML = pres.map(p => {
                        const trat = trats.find(t => t.id === p.treatment_id || t.id === p.tratamento_id);
                        const dt = p.data ? p.data.split('T')[0].split('-').reverse().join('/') : '';
                        const obs = p.observacoes ? `<div style="margin-top: 2px; color: var(--text-muted); font-size: 11px;">Obs: ${p.observacoes}</div>` : '';
                        const badgeColor = trat?.tipo === 'Espiritual' ? '#818cf8' : '#10b981';
                        return `
                            <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px; font-size: 12px; line-height: 1.4; margin-bottom: 6px;">
                                <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: ${badgeColor}; color: white; text-transform: uppercase;">${trat?.tipo || 'TRAT.'}</span>
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
                    return `
                        <div style="background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 8px; font-size: 12px; margin-bottom: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <div>
                                    <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: #f59e0b; color: white; text-transform: uppercase;">FRATERNO</span>
                                    <strong style="color: var(--primary); margin-left: 4px;">${dt}</strong>
                                </div>
                                <span style="color: var(--text-muted); font-size: 11px;">Atendente: ${s.pessoas?.nome_completo || 'Desconhecido'}</span>
                            </div>
                            <div style="color: var(--text-main); white-space: pre-wrap;">${s.sintomas_orientacoes}</div>
                        </div>
                    `;
                }).join('');
            }

            panel.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 16px; background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: 6px;">
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

    window.mudarStatusTratamento = async function(id, status) {
        Swal.fire({
            title: `${status} Tratamento?`,
            text: `Confirmar alteração de status para ${status}.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonText: 'Cancelar',
            background: 'var(--bg-panel)',
            color: 'white'
        }).then(async (res) => {
            if (res.isConfirmed) {
                try {
                    const { error } = await db.from('app_atendimento_tratamentos').update({
                        status: status,
                        data_fim: new Date().toISOString().split('T')[0]
                    }).eq('id', id);

                    if (error) throw error;
                    Swal.fire('Sucesso!', 'Tratamento atualizado.', 'success');
                    carregarLista();
                } catch(e) {
                    Swal.fire('Erro', 'Erro ao atualizar tratamento.', 'error');
                }
            }
        });
    };

    window.encaminharParaNovaTriagemMobile = async function(fraterno_id) {
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
            color: 'white'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Obter dados pessoais da ficha antiga
                    const { data: oldData, error: errF } = await db.from('app_atendimento_fraterno').select('*').eq('id', fraterno_id).single();
                    if (errF) throw errF;

                    // Inserir nova ficha
                    const { error: errI } = await db.from('app_atendimento_fraterno').insert([{
                        paciente_id: oldData.paciente_id,
                        status: 'Pendente' // Vai para a Triagem
                    }]);

                    if (errI) throw errI;

                    Swal.fire({
                        title: 'Ficha Criada!',
                        text: 'Paciente encaminhado para a fila de Triagem.',
                        icon: 'success',
                        background: 'var(--bg-panel)',
                        color: 'white'
                    });
                } catch(e) {
                    Swal.fire('Erro', 'Falha ao criar nova ficha: ' + e.message, 'error');
                }
            }
        });
    };

    // --- FILA DE PRESENÇAS (TERÇAS E QUINTAS) ---

    async function carregarFilaPresencas() {
        const container = document.getElementById('listaAtendimento');
        container.innerHTML = '';

        try {
            const { data: trats, error } = await db.from('app_atendimento_tratamentos')
                .select('*, app_atendimento_fraterno(id, nome_completo, endereco_completo, data_nascimento, telefone, created_at, app_pacientes(*))')
                .eq('status', 'Ativo')
                .eq('presente', false);

            if (error) throw error;

            if (!trats || trats.length === 0) {
                container.innerHTML = '<div class="empty-state">Nenhum necessitado em tratamento ativo na Fila Geral.</div>';
                return;
            }

            trats.sort((a,b) => (a.app_atendimento_fraterno?.app_pacientes?.nome_completo || a.app_atendimento_fraterno?.nome_completo || '').localeCompare(b.app_atendimento_fraterno?.app_pacientes?.nome_completo || b.app_atendimento_fraterno?.nome_completo || ''));

            trats.forEach(t => {
                const f = t.app_atendimento_fraterno;
                const card = document.createElement('div');
                card.className = 'card-atendimento';
                card.style.marginBottom = '12px';
                
                const badgeColor = t.tipo === 'Espiritual' ? '#818cf8' : '#10b981';

                const d = new Date(f.created_at);
                const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

                let ageInfo = '';
                const nasc = f.app_pacientes?.data_nascimento || f.data_nascimento;
                if (nasc) {
                    const anoNasc = nasc.split('-')[0];
                    const age = new Date().getFullYear() - parseInt(anoNasc);
                    ageInfo = ` (${age} anos)`;
                }

                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                        <div>
                            <span style="font-size:15px; font-weight:600; color:white; display:block; margin-bottom: 4px;">${(f.app_pacientes?.nome_completo || f.nome_completo || '').toUpperCase()}</span>
                            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 2px;">📍 ${f.app_pacientes?.endereco_completo || f.endereco_completo || 'Sem endereço'}</div>
                            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 2px;">🎂 Nascimento: ${nasc ? nasc.split('-').reverse().join('/') : 'Não informada'}${ageInfo}</div>
                            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">📱 Celular: ${f.app_pacientes?.telefone || f.telefone || 'Não informado'}</div>
                            <div style="font-size: 11px; color: var(--text-muted);">Em ${dateStr}</div>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                            <span style="font-size:11px; font-weight:600; padding:2px 8px; border-radius:12px; background:${badgeColor}22; color:${badgeColor}; border:1px solid ${badgeColor}44;">${t.tipo}</span>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn-action" onclick="window.editarPacienteMobile('${f.id}')" style="padding: 8px; background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--border); border-radius: 8px; font-size: 14px;">✏️</button>
                                <button class="btn-action" onclick="excluirSolicitacao('${f.id}')" style="padding: 8px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; font-size: 14px;">🗑️</button>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top:12px;">
                        <button onclick="marcarTratamentoPresenteMobile('${t.id}', true)" class="btn-action" style="background:rgba(255,255,255,0.05); color:var(--text-muted); border:1px solid var(--border); width:100%; padding:10px; border-radius: 8px;">⚪ Confirmar Presença</button>
                    </div>
                `;
                container.appendChild(card);
            });

        } catch(e) {
            container.innerHTML = `<div class="empty-state">Erro: ${e.message}</div>`;
        }
    }

    window.carregarHistoricoGeralMobile = async function() {
        const lista = document.getElementById('listaAtendimento');
        if (!lista) return;
        lista.innerHTML = '<div class="empty-state">Carregando histórico unificado...</div>';

        try {
            // 1. Buscar todas as triagens atendidas
            const pFraterno = db.from('app_atendimento_fraterno')
                .select('*, atendente:pessoas!atendente_id(nome_completo), app_pacientes(*)')
                .eq('status', 'Atendido');
            
            // 2. Buscar todos os tratamentos concluídos ou suspensos
            const pTratamentos = db.from('app_atendimento_tratamentos')
                .select('*, app_atendimento_fraterno(nome_completo, app_pacientes(*))')
                .in('status', ['Concluído', 'Suspenso']);

            const [reqFraterno, reqTratamentos] = await Promise.all([pFraterno, pTratamentos]);
            
            if (reqFraterno.error) throw reqFraterno.error;
            if (reqTratamentos.error) throw reqTratamentos.error;

            // 3. Unificar dados
            let historico = [];
            
            reqFraterno.data.forEach(f => {
                const dataFechamento = f.data_hora_atendimento || f.created_at;
                historico.push({
                    tipoDado: 'Fraterno',
                    dataOrdenacao: new Date(dataFechamento),
                    id: f.id,
                    nome_paciente: f.app_pacientes?.nome_completo || f.nome_completo,
                    infoAdicional: f.atendente ? `Atendente: ${f.atendente.nome_completo}` : '',
                    status: f.status,
                    paciente_id: f.id 
                });
            });

            reqTratamentos.data.forEach(t => {
                const dataFechamento = t.data_fim || t.created_at;
                historico.push({
                    tipoDado: t.tipo, 
                    dataOrdenacao: new Date(dataFechamento),
                    id: t.id,
                    nome_paciente: t.app_atendimento_fraterno?.app_pacientes?.nome_completo || t.app_atendimento_fraterno?.nome_completo,
                    infoAdicional: t.data_inicio ? `Início: ${t.data_inicio.split('T')[0].split('-').reverse().join('/')}` : '',
                    status: t.status,
                    paciente_id: t.fraterno_id 
                });
            });

            // 4. Agrupar por Ano e Mês
            const agrupado = {};
            historico.forEach(item => {
                const y = item.dataOrdenacao.getFullYear();
                const m = item.dataOrdenacao.getMonth();
                if (!agrupado[y]) agrupado[y] = {};
                if (!agrupado[y][m]) agrupado[y][m] = [];
                agrupado[y][m].push(item);
            });

            lista.innerHTML = '';
            
            if (Object.keys(agrupado).length === 0) {
                lista.innerHTML = '<div class="empty-state">Nenhum histórico encontrado.</div>';
                return;
            }

            const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
            const anosOrdenados = Object.keys(agrupado).sort((a,b) => b - a);

            anosOrdenados.forEach((ano, indexAno) => {
                const wrapperAno = document.createElement('div');
                wrapperAno.style.marginBottom = '8px';

                const headerAno = document.createElement('div');
                headerAno.style.cssText = 'background: rgba(255,255,255,0.05); padding: 12px 16px; border-radius: 8px; font-weight: bold; font-size: 16px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; color: white; border: 1px solid var(--border);';
                headerAno.innerHTML = `<span>📂 Ano ${ano}</span><span style="font-size: 12px; opacity: 0.5;">▼</span>`;
                
                const contentAno = document.createElement('div');
                contentAno.style.cssText = 'padding: 8px 0 8px 12px; display: none;';
                if (indexAno === 0) contentAno.style.display = 'block';

                headerAno.onclick = () => {
                    contentAno.style.display = contentAno.style.display === 'none' ? 'block' : 'none';
                    headerAno.querySelector('span:last-child').textContent = contentAno.style.display === 'none' ? '▼' : '▲';
                };

                const mesesOrdem = Object.keys(agrupado[ano]).sort((a,b) => b - a);
                mesesOrdem.forEach(mesIdx => {
                    const listaMes = agrupado[ano][mesIdx];
                    listaMes.sort((a,b) => b.dataOrdenacao - a.dataOrdenacao);

                    const wrapperMes = document.createElement('div');
                    wrapperMes.style.marginBottom = '8px';
                    
                    const headerMes = document.createElement('div');
                    headerMes.style.cssText = 'background: rgba(255,255,255,0.02); padding: 10px 14px; border-radius: 6px; font-weight: 600; font-size: 14px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; color: var(--text-main); border: 1px solid rgba(255,255,255,0.05);';
                    headerMes.innerHTML = `<span>📂 ${mesesNomes[mesIdx]} <span style="font-size: 11px; opacity: 0.5;">(${listaMes.length})</span></span><span style="font-size: 10px; opacity: 0.5;">▼</span>`;

                    const contentMes = document.createElement('div');
                    contentMes.style.cssText = 'padding: 8px 0; display: none;';

                    headerMes.onclick = () => {
                        contentMes.style.display = contentMes.style.display === 'none' ? 'block' : 'none';
                        headerMes.querySelector('span:last-child').textContent = contentMes.style.display === 'none' ? '▼' : '▲';
                    };

                    listaMes.forEach(item => {
                        const div = document.createElement('div');
                        div.className = 'card-atendimento';
                        div.style.marginBottom = '8px';
                        
                        let badgeBg = '#f59e0b';
                        let badgeText = '🤝 TRIAGEM';
                        if (item.tipoDado === 'Fluídico') { badgeBg = '#3b82f6'; badgeText = '💧 TRAT. FLUÍDICO'; }
                        if (item.tipoDado === 'Espiritual') { badgeBg = '#8b5cf6'; badgeText = '✨ TRAT. ESPIRITUAL'; }

                        const statusCor = item.status === 'Suspenso' ? '#ef4444' : (item.status === 'Concluído' ? '#10b981' : 'var(--text-muted)');

                        div.innerHTML = `
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <span style="font-size:14px; font-weight:600; color:white;">${(item.nome_paciente || 'Desconhecido').toUpperCase()}</span>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px;">
                                <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: ${badgeBg}; color: white; display: inline-block; align-self: flex-start;">${badgeText}</span>
                                <span style="font-size: 12px; color: var(--text-muted);">${item.infoAdicional}</span>
                                <span style="font-size: 12px; color: ${statusCor}; font-weight: 500;">Status: ${item.status}</span>
                            </div>
                            <div style="border-top: 1px solid rgba(255,255,255,0.05); margin-top: 8px; padding-top: 8px; display: flex; justify-content: flex-end;">
                                <button onclick="abrirFichaAtendimento('${item.paciente_id}')" class="btn-action" style="background:rgba(255,255,255,0.05); color:white; border:1px solid var(--border); width: 100%;">📝 Ficha Completa</button>
                            </div>
                        `;
                        contentMes.appendChild(div);
                    });

                    wrapperMes.appendChild(headerMes);
                    wrapperMes.appendChild(contentMes);
                    contentAno.appendChild(wrapperMes);
                });

                wrapperAno.appendChild(headerAno);
                wrapperAno.appendChild(contentAno);
                lista.appendChild(wrapperAno);
            });
        } catch (e) {
            console.error(e);
            lista.innerHTML = '<div class="empty-state">Erro ao carregar histórico unificado.</div>';
        }
    };

    async function carregarEsperaTratamento() {
        const container = document.getElementById('listaAtendimento');
        container.innerHTML = '';

        try {
            const { data: trats, error } = await db.from('app_atendimento_tratamentos')
                .select('*, app_atendimento_fraterno(id, nome_completo, endereco_completo, data_nascimento, telefone, app_pacientes(*))')
                .eq('status', 'Ativo')
                .eq('presente', true);

            if (error) throw error;

            if (!trats || trats.length === 0) {
                container.innerHTML = '<div class="empty-state">Sala de Espera de Tratamentos vazia.</div>';
                return;
            }

            trats.sort((a,b) => (a.app_atendimento_fraterno?.app_pacientes?.nome_completo || a.app_atendimento_fraterno?.nome_completo || '').localeCompare(b.app_atendimento_fraterno?.app_pacientes?.nome_completo || b.app_atendimento_fraterno?.nome_completo || ''));

            trats.forEach(t => {
                const f = t.app_atendimento_fraterno;
                const card = document.createElement('div');
                card.className = 'card-atendimento';
                card.style.marginBottom = '12px';
                
                const badgeColor = t.tipo === 'Espiritual' ? '#818cf8' : '#10b981';

                let ageInfo = '';
                const nasc = f.app_pacientes?.data_nascimento || f.data_nascimento;
                if (nasc) {
                    const anoNasc = nasc.split('-')[0];
                    const age = new Date().getFullYear() - parseInt(anoNasc);
                    ageInfo = ` (${age} anos)`;
                }

                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                        <div>
                            <span style="font-size:15px; font-weight:600; color:white; display:block; margin-bottom: 4px;">${(f.app_pacientes?.nome_completo || f.nome_completo || '').toUpperCase()}</span>
                            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 2px;">📍 ${f.app_pacientes?.endereco_completo || f.endereco_completo || 'Sem endereço'}</div>
                            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 2px;">🎂 Nascimento: ${nasc ? nasc.split('-').reverse().join('/') : 'Não informada'}${ageInfo}</div>
                            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">📱 Celular: ${f.app_pacientes?.telefone || f.telefone || 'Não informado'}</div>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                            <span style="font-size:11px; font-weight:600; padding:2px 8px; border-radius:12px; background:${badgeColor}22; color:${badgeColor}; border:1px solid ${badgeColor}44;">${t.tipo}</span>
                            <button onclick="marcarTratamentoPresenteMobile('${t.id}', false)" class="btn-action" style="padding: 4px 8px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; font-size: 11px;">Desfazer Presente</button>
                        </div>
                    </div>
                    
                    <div style="margin-top:12px;">
                        <button onclick="confirmarSessaoTratamentoMobile('${t.id}', '${t.tipo}')" class="btn-action" style="background:${badgeColor}; color:white; border:none; width:100%; padding:10px; border-radius: 8px; font-weight: 600;">Confirmar Atendimento</button>
                    </div>
                `;
                container.appendChild(card);
            });

        } catch(e) {
            container.innerHTML = `<div class="empty-state">Erro: ${e.message}</div>`;
        }
    }

    window.marcarTratamentoPresenteMobile = async function(id, statusPresente) {
        try {
            const { error } = await db.from('app_atendimento_tratamentos').update({ presente: statusPresente }).eq('id', id);
            if (error) throw error;
            
            if (subAba === 'presencas') carregarFilaPresencas();
            else if (subAba === 'espera_tratamento') carregarEsperaTratamento();
            else if (subAba === 'fila') carregarLista();
        } catch (err) {
            Swal.fire('Erro', 'Não foi possível alterar a presença', 'error');
        }
    };

    window.confirmarSessaoTratamentoMobile = async function(tratamentoId, tipo) {
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
                    processarSessaoTratamentoMobile(tratamentoId, result.value || '');
                }
            });
        } else {
            processarSessaoTratamentoMobile(tratamentoId, '');
        }
    };

    async function processarSessaoTratamentoMobile(tratamentoId, observacoes) {
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

            carregarTratamentosAtivos();
        } catch (err) {
            Swal.fire('Erro', 'Erro ao confirmar atendimento: ' + err.message, 'error');
        }
    }


    // --- PAINEL SEMANAL DE ACOMPANHAMENTO ---

    async function carregarPainelSemanal() {
        const lista = document.getElementById('listaAtendimento');
        if (!lista) return;
        lista.innerHTML = '<div class="empty-state">Gerando painel semanal...</div>';

        try {
            const { data: tratamentos, error } = await db.from('app_atendimento_tratamentos')
                .select('*, app_atendimento_fraterno(nome_completo, telefone, id, app_pacientes(*)), app_atendimento_presencas(data)')
                .eq('status', 'Ativo');

            if (error) throw error;

            lista.innerHTML = '';

            const totalAtivos = tratamentos.length;
            const evangelhoCount = parseInt(localStorage.getItem('evangelhoCount') || '0', 10);
            
            let pacientesNaSemana = 0;
            let abandonos = [];
            
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

                if (t.status === 'Ativo' && (!lastDateObj || lastDateObj < twoWeeksAgo)) {
                    abandonos.push({
                        id: t.id,
                        nome: t.app_atendimento_fraterno?.app_pacientes?.nome_completo || t.app_atendimento_fraterno?.nome_completo || 'Desconhecido',
                        telefone: t.app_atendimento_fraterno?.app_pacientes?.telefone || t.app_atendimento_fraterno?.telefone,
                        tipo: t.tipo,
                        lastDate: lastDateObj ? lastDateObj.toLocaleDateString('pt-BR') : 'Nunca compareceu',
                        faltasConsecutivas: lastDateObj ? Math.floor((now - lastDateObj) / (7 * 24 * 60 * 60 * 1000)) : 'Várias'
                    });
                }
            });

            const taxaFrequencia = totalAtivos > 0 ? Math.round((pacientesNaSemana / totalAtivos) * 100) : 0;

            const painelHtml = document.createElement('div');
            painelHtml.style.display = 'flex';
            painelHtml.style.flexDirection = 'column';
            painelHtml.style.gap = '20px';

            let resumoHtml = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 12px; text-align: center;">
                        <div style="font-size: 9px; color: var(--text-muted); text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Ativos</div>
                        <div style="font-size: 20px; font-weight: bold; color: var(--primary);">${totalAtivos}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 12px; text-align: center;">
                        <div style="font-size: 9px; color: var(--text-muted); text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Na Semana</div>
                        <div style="font-size: 20px; font-weight: bold; color: #10b981;">${pacientesNaSemana}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 12px; text-align: center;">
                        <div style="font-size: 9px; color: var(--text-muted); text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Evangelho Lar</div>
                        <div style="font-size: 20px; font-weight: bold; color: #f59e0b;">${evangelhoCount}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 12px; text-align: center;">
                        <div style="font-size: 9px; color: var(--text-muted); text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Frequência</div>
                        <div style="font-size: 20px; font-weight: bold; color: #8b5cf6;">${taxaFrequencia}%</div>
                    </div>
                </div>
            `;

            let abandonosHtml = '';
            if (abandonos.length > 0) {
                abandonosHtml = `
                    <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 12px;">
                        <h4 style="margin-top: 0; color: #ef4444; margin-bottom: 8px; font-size: 13px;">⚠️ Risco de Abandono (${abandonos.length})</h4>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${abandonos.map(a => `
                                <div style="background: rgba(0,0,0,0.2); border: 1px solid rgba(239,68,68,0.1); border-radius: 6px; padding: 10px;">
                                    <div style="font-size: 13px; font-weight: bold; color: white;">${a.nome.toUpperCase()} <span style="font-size: 9px; padding: 2px 4px; border-radius: 8px; background: rgba(255,255,255,0.1); color: var(--text-muted);">${a.tipo}</span></div>
                                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px; margin-bottom: 8px;">Faltas: ${a.faltasConsecutivas} sem. | Última: ${a.lastDate}</div>
                                    ${a.telefone ? `<a href="https://wa.me/55${a.telefone.replace(/\D/g, '')}" target="_blank" class="btn" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); text-decoration: none; padding: 6px; font-size: 11px; border-radius: 6px; display: block; text-align: center;">Chamar no WhatsApp</a>` : '<span style="font-size: 11px; color: var(--text-muted);">Sem Telefone</span>'}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            let listaHtml = `<div><h4 style="margin-top: 0; color: var(--primary); margin-bottom: 12px; font-size: 14px;">Progresso dos Tratamentos</h4>`;
            
            if (tratamentos.length === 0) {
                listaHtml += '<div style="color: var(--text-muted); font-size: 12px;">Nenhum tratamento ativo.</div>';
            } else {
                const sortedTrats = tratamentos.sort((a, b) => {
                    const nameA = a.app_atendimento_fraterno?.app_pacientes?.nome_completo || a.app_atendimento_fraterno?.nome_completo || '';
                    const nameB = b.app_atendimento_fraterno?.app_pacientes?.nome_completo || b.app_atendimento_fraterno?.nome_completo || '';
                    return nameA.localeCompare(nameB);
                });

                listaHtml += `<div style="display: flex; flex-direction: column; gap: 8px;">`;
                
                sortedTrats.forEach(t => {
                    const presencas = t.app_atendimento_presencas || [];
                    const presCount = presencas.length;
                    const limit = 4;
                    
                    let boxesHtml = '';
                    for(let i = 0; i < limit; i++) {
                        if (i < presCount) {
                            boxesHtml += `<div style="width: 22px; height: 22px; border-radius: 4px; background: #10b981; border: 1px solid #059669; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px;">✓</div>`;
                        } else {
                            boxesHtml += `<div style="width: 22px; height: 22px; border-radius: 4px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 9px;">${i+1}</div>`;
                        }
                    }
                    
                    if (presCount > limit) {
                        boxesHtml += `<div style="width: 22px; height: 22px; border-radius: 4px; background: rgba(16, 185, 129, 0.2); border: 1px dashed #10b981; display: flex; align-items: center; justify-content: center; color: #10b981; font-size: 9px; font-weight: bold;">+${presCount - limit}</div>`;
                    }

                    const badgeColor = t.tipo === 'Fluídico' ? '#3b82f6' : '#8b5cf6';
                    
                    listaHtml += `
                        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 10px; display: flex; flex-direction: column;">
                            <div style="font-size: 12px; font-weight: bold; color: var(--text-main); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${t.app_atendimento_fraterno?.app_pacientes?.nome_completo?.toUpperCase() || t.app_atendimento_fraterno?.nome_completo?.toUpperCase() || 'DESCONHECIDO'}
                            </div>
                            <div style="font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: ${badgeColor}; color: white; display: inline-block; margin-bottom: 8px; align-self: flex-start;">${t.tipo.toUpperCase()}</div>
                            <div style="display: flex; gap: 6px; align-items: center; justify-content: space-between;">
                                <div style="display: flex; gap: 4px;">
                                    ${boxesHtml}
                                </div>
                                <div style="display: flex; gap: 4px;">
                                    <button onclick="mudarStatusTratamento('${t.id}', 'Concluído')" title="Concluir" style="padding: 4px; background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.3); border-radius: 4px; display: flex; align-items: center; justify-content: center; min-width: 28px;">✔️</button>
                                    <button onclick="mudarStatusTratamento('${t.id}', 'Suspenso')" title="Suspender" style="padding: 4px; background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); border-radius: 4px; display: flex; align-items: center; justify-content: center; min-width: 28px;">❌</button>
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

        } catch(e) {
            container.innerHTML = `<div class="empty-state">Erro: ${e.message}</div>`;
        }
    }

    // --- PRESENÇAS E TRIAGEM ---

    window.alternarPresenca = async function(id, estado) {
        try {
            const { error } = await db.from('app_atendimento_fraterno').update({ presente: estado }).eq('id', id);
            if (error) throw error;
            carregarLista();
        } catch(e) {
            Swal.fire('Erro!', 'Falha ao atualizar presença.', 'error');
        }
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
            carregarLista();
        } catch (err) {
            Swal.fire('Erro', 'Erro ao salvar edição: ' + err.message, 'error');
        }
    };

    window.abrirTriagem = async function(id) {
        const html = `
            <form onsubmit="salvarTriagemSideSheet(event, '${id}')" style="display: flex; flex-direction: column; gap: 16px; height: 100%;">
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
                .select('id, nome_completo')
                .contains('perfis', ['Atendente Fraterno']);

            if (error) throw error;

            const select = document.getElementById('sideSelectAtendenteAtendimento');
            if (!select) return;

            if (!data || data.length === 0) {
                select.innerHTML = '<option value="">Nenhum Atendente Fraterno cadastrado</option>';
                return;
            }

            data.sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));

            select.innerHTML = '<option value="">Selecione um atendente...</option>' +
                data.map(p => `<option value="${p.id}">${p.nome_completo}</option>`).join('');
        } catch(e) {
            Swal.fire('Erro!', 'Falha ao carregar atendentes: ' + e.message, 'error');
            const select = document.getElementById('sideSelectAtendenteAtendimento');
            if (select) select.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    };

    window.salvarTriagemSideSheet = async function (e, id) {
        e.preventDefault();
        const atendenteId = document.getElementById('sideSelectAtendenteAtendimento').value;

        if (!atendenteId) {
            Swal.fire('Aviso', 'Selecione um atendente.', 'warning');
            return;
        }

        try {
            const { error: updErr } = await db
                .from('app_atendimento_fraterno')
                .update({ atendente_id: atendenteId, status: 'Planejado' })
                .eq('id', id);

            if (updErr) throw updErr;
            window.fecharSideSheet();
            carregarLista();
        } catch (err) {
            Swal.fire('Erro!', 'Falha ao salvar triagem: ' + err.message, 'error');
        }
    };

    window.desatribuirAtendente = async function(id) {
        Swal.fire({
            title: 'Desatribuir Atendente?',
            text: 'O paciente voltará para a fila de espera.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Confirmar',
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
                    carregarLista();
                } catch(e) {
                    Swal.fire('Erro!', 'Falha ao desatribuir.', 'error');
                }
            }
        });
    };

    window.excluirPedido = async function(id) {
        Swal.fire({
            title: 'Excluir Pedido?',
            text: "Não será possível reverter.",
            icon: 'warning',
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
                    carregarLista();
                } catch(e) {
                    Swal.fire('Erro!', 'Falha ao excluir.', 'error');
                }
            }
        });
    };
})();
