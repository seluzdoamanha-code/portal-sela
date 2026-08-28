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


function formatarCEP(v) {
    if (!v) return '-';
    v = v.replace(/\D/g, '');
    if (v.length === 8) {
        return v.replace(/(\d{5})(\d{3})/, "$1-$2");
    }
    return v;
}

function formatarCPF(v) {
    if (!v) return '-';
    v = v.replace(/\D/g, '');
    if (v.length === 11) {
        return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return v;
}

function formatarCelular(v) {
    if (!v) return '-';
    v = v.replace(/\D/g, '');
    if (v.length === 11) {
        return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (v.length === 10) {
        return v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
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

function parseDataLocal(dataStr) {
    if (!dataStr) return new Date();
    if (dataStr.includes('Z') || dataStr.includes('+') || (dataStr.includes('-') && dataStr.split('-').length > 3)) {
        return new Date(dataStr);
    }
    let iso = dataStr;
    if (iso.includes(' ')) iso = iso.replace(' ', 'T');
    const tzOffset = new Date().getTimezoneOffset();
    const diffHours = tzOffset / 60;
    const d = new Date(iso);
    return new Date(d.getTime() + (diffHours * 60 * 60 * 1000));
}

function obterDataPrecisa(dataStr, createdAtStr) {
    if (!dataStr) return new Date(createdAtStr);
    const createdLocal = new Date(createdAtStr);
    const tzOffset = createdLocal.getTimezoneOffset() * 60000;
    const localISO = new Date(createdLocal.getTime() - tzOffset).toISOString().split('T')[0];
    
    if (String(dataStr).startsWith(localISO)) {
        return new Date(createdAtStr);
    }
    return parseDataLocal(dataStr);
}


    document.addEventListener('DOMContentLoaded', () => {
        // Inject Side-Sheet if not present
        if (!document.getElementById('globalSideSheet')) {
            const styleSheet = `
                <style>
                    .side-sheet-overlay {
                        position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
                        background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px);
                        z-index: 1050; opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
                    }
                    .side-sheet-overlay.show { opacity: 1; pointer-events: auto; }
                    .side-sheet {
                        position: fixed; top: 0; right: 0; width: 400px; max-width: 90vw; height: 100dvh;
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
                    .side-sheet-content { padding: 24px; flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; padding-bottom: 120px; }
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
                else if (abaPrincipal === 'fichario') subAba = 'A';
                else if (abaPrincipal === 'atendimento') subAba = 'andamento';
                else if (abaPrincipal === 'acompanhamento') subAba = 'tratamentos';
                else if (abaPrincipal === 'historico') subAba = 'historico_geral';
                
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
        } else if (abaPrincipal === 'fichario') {
            container.style.display = 'flex';
            let html = '';
            if (window.ficharioLetrasAvailable && window.ficharioLetrasAvailable.size > 0) {
                const letras = Array.from(window.ficharioLetrasAvailable).sort();
                letras.forEach(l => {
                    html += `<div class="sub-tab-pill ${subAba === l ? 'active' : ''}" onclick="switchSubTab('${l}')" style="min-width: 40px; text-align: center;">${l}</div>`;
                });
            } else {
                html = '<div style="color: var(--text-muted); font-size: 12px; padding: 4px;">Calculando letras...</div>';
            }
            container.innerHTML = html;
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
                db.from('app_atendimento_fraterno').select('*, pessoas!atendente_id(id, nome_completo), paciente:pessoas!paciente_id(*)'),
                db.from('app_atendimento_tratamentos').select('*, app_atendimento_fraterno(id, nome_completo, status, created_at, paciente:pessoas!paciente_id(*))').eq('status', 'Ativo')
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

            const totalFila = allData.filter(d => !['Atendido', 'Em Tratamento', 'Concluído'].includes(d.status)).length;
            const espera = allData.filter(d => d.presente && !d.atendente_id && !['Atendido', 'Em Tratamento', 'Concluído'].includes(d.status)).length + allTratamentos.filter(t => t.presente).length;
            const andamento = allData.filter(d => d.presente && d.atendente_id && !['Atendido', 'Em Tratamento', 'Concluído'].includes(d.status)).length;
            
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

                const frats = allData.filter(d => isFila ? (!d.presente && !d.atendente_id && !['Atendido', 'Em Tratamento', 'Concluído'].includes(d.status)) : (d.presente && !d.atendente_id && !['Atendido', 'Em Tratamento', 'Concluído'].includes(d.status)))
                    .map(d => ({ ...d, unified_type: 'Fraterno' }));

                const trats = allTratamentos.filter(d => isFila ? !d.presente : d.presente)
                    .map(d => {
                        const pac = d.app_atendimento_fraterno?.paciente || {};
                        return {
                            id: d.id,
                            fraterno_id: d.fraterno_id,
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
                filteredData = allData.filter(d => d.atendente_id && !['Atendido', 'Em Tratamento', 'Concluído'].includes(d.status));
                renderAndamentoList(filteredData);
            } 
            else if (abaPrincipal === 'fichario') {
                const ficharioSet = new Set();
                allData.forEach(d => {
                    if (d.nome_completo) ficharioSet.add(d.nome_completo.trim().toUpperCase());
                });
                allTratamentos.forEach(t => {
                    const f = t.app_atendimento_fraterno;
                    if (f && (f.paciente?.nome_completo || f.nome_completo)) {
                        ficharioSet.add((f.paciente?.nome_completo || f.nome_completo).trim().toUpperCase());
                    }
                });
                window.ficharioLetrasAvailable = new Set();
                ficharioSet.forEach(nome => {
                    if (nome) window.ficharioLetrasAvailable.add(nome.charAt(0).toUpperCase());
                });

                if (!window.ficharioLetrasAvailable.has(subAba)) {
                    const letters = Array.from(window.ficharioLetrasAvailable).sort();
                    if (letters.length > 0) subAba = letters[0];
                }
                
                renderSubTabs();
                window.carregarFicharioMobile(allData, allTratamentos);
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
            const age = calcularIdade(item.data_nascimento);
            nascimentoInfo = `${item.data_nascimento.split('-').reverse().join('/')} (${age} anos)`;
        }

        let infoExtra = '';
        if (item.status === 'Atendido' && item.data_hora_atendimento) {
            const dtAten = new Date(item.data_hora_atendimento).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            infoExtra = `<div style="font-size: 13px; color: #10b981; margin-top: 6px;">✓ Atendido em: ${dtAten} por ${item.pessoas?.nome_completo || 'Atendente'}</div>`;
        } else if (item.status === 'Planejado' && item.pessoas?.nome_completo) {
            infoExtra = `<div style="font-size: 13px; color: var(--primary); margin-top: 6px;">📅 Atribuído a: ${item.pessoas.nome_completo}</div>`;
        }

        const dVal = new Date(item.created_at);
        const dateStr = `${String(dVal.getDate()).padStart(2, '0')}/${String(dVal.getMonth()+1).padStart(2, '0')}/${dVal.getFullYear()}, ${String(dVal.getHours()).padStart(2, '0')}:${String(dVal.getMinutes()).padStart(2, '0')}`;
        
        let whatsLink = '';
        if (item.telefone) {
            const nums = item.telefone.replace(/\D/g, '');
            whatsLink = `
                <a href="https://wa.me/55${nums}" target="_blank" style="padding: 4px 8px; font-size: 12px; background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); text-decoration: none; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    WhatsApp
                </a>
            `;
        }

        const btnPresenca = item.presente ? 
            `<button class="btn-action" onclick="alternarPresenca('${item.id}', false)" style="width: 100%; font-size: 12px; padding: 10px; background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; transition: all 0.2s; font-weight: 600;" onmouseover="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.color='#ef4444'; this.style.borderColor='rgba(239, 68, 68, 0.3)'; this.textContent='🔴 Remover Presença';" onmouseout="this.style.background='rgba(16, 185, 129, 0.1)'; this.style.color='#10b981'; this.style.borderColor='rgba(16, 185, 129, 0.3)'; this.textContent='🟢 Presente';">🟢 Presente</button>` :
            `<button class="btn-action" onclick="alternarPresenca('${item.id}', true)" style="width: 100%; font-size: 12px; padding: 10px; background: rgba(255,255,255,0.1); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; transition: all 0.2s; font-weight: 500;">⚪ Confirmar Presença</button>`;

        const div = document.createElement('div');
        div.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 16px; display: flex; flex-direction: row; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;';
        
        const shortName = item.nome_curto || (item.nome_completo ? item.nome_completo.split(' ')[0] : 'Sem nome');

        let badgeHtml = '';
        if (item.fraterno_status === 'Em Tratamento' || item.status === 'Em Tratamento') {
            badgeHtml = `<span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); margin-left: 8px; vertical-align: middle; white-space: nowrap;">EM TRATAMENTO</span>`;
        }

        const endPartes = [];
        if (item.endereco) endPartes.push(item.endereco);
        else if (item.endereco_completo) endPartes.push(item.endereco_completo);
        if (item.bairro) endPartes.push(item.bairro);
        let cidEst = [];
        if (item.cidade) cidEst.push(item.cidade);
        if (item.estado) cidEst.push(item.estado);
        if (cidEst.length > 0) endPartes.push(cidEst.join('/'));
        const endFull = endPartes.length > 0 ? endPartes.join(', ') : 'Sem endereço';

        let buttonsHtml = '';
        const buttonsContainerStyle = 'display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; min-width: 140px; flex: 1;';
        
        if (subAba === 'fila' || subAba === 'espera') {
            if (item.is_tratamento) {
                const btnPresencaTrat = item.presente ? 
                    `<button class="btn-action" onclick="marcarTratamentoPresenteMobile('${item.id}', false)" style="width: 100%; font-size: 12px; padding: 10px; background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; font-weight: 600;">🟢 Presente</button>` :
                    `<button class="btn-action" onclick="marcarTratamentoPresenteMobile('${item.id}', true)" style="width: 100%; font-size: 12px; padding: 10px; background: rgba(255,255,255,0.1); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; font-weight: 500;">⚪ Confirmar Presença</button>`;
                buttonsHtml = `<div style="${buttonsContainerStyle}">${btnPresencaTrat}</div>`;
            } else {
                buttonsHtml = `
                    <div style="${buttonsContainerStyle}">
                        ${item.status !== 'Atendido' ? btnPresenca : '<div></div>'}
                        
                        ${(item.status === 'Pendente' || item.status === 'Planejado') ? `
                            <button class="btn-action" onclick="abrirTriagem('${item.id}')" style="font-size: 12px; padding: 8px; background: rgba(146, 96, 52, 0.4); color: #fbbf24; border: 1px solid rgba(146, 96, 52, 0.6); border-radius: 8px; width: 100%; font-weight: 600;">🤝 Triagem</button>
                        ` : ''}

                        <div style="display: flex; gap: 8px; width: 100%; justify-content: center; margin-top: 2px;">
                            ${item.status !== 'Atendido' ? `
                                <button class="btn-action" onclick="abrirEdicaoAtendimento('${item.id}', '${(item.nome_completo || '').replace(/'/g, "\\'").replace(/[\r\n]+/g, ' ')}', '${(item.endereco_completo || '').replace(/'/g, "\\'").replace(/[\r\n]+/g, ' ')}', '${(item.telefone || '').replace(/'/g, "\\'")}')" style="font-size: 14px; padding: 8px; background: transparent; color: #fbbf24; border: 1px solid #fbbf24; border-radius: 8px; flex: 1; display: flex; justify-content: center;">✏️</button>
                            ` : ''}
                            <button class="btn-action" onclick="excluirPedido('${item.id}')" style="font-size: 14px; padding: 8px; background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; flex: 1; display: flex; justify-content: center;">🗑️</button>
                        </div>
                    </div>
                `;
            }
        } else {
            // andamento / historico
            buttonsHtml = `
                <div style="${buttonsContainerStyle}">
                    ${item.status !== 'Atendido' ? btnPresenca : ''}
                    ${item.status === 'Planejado' && item.presente ? `
                        <button class="btn-action" onclick="abrirFichaAtendimento('${item.id}')" style="font-size: 12px; padding: 10px; background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px;">📝 Ficha</button>
                    ` : ''}
                    ${item.status === 'Atendido' ? `
                        <button class="btn-action" onclick="abrirFichaAtendimento('${item.id}')" style="font-size: 12px; padding: 10px; background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px;">📝 Ficha</button>
                    ` : ''}
                    ${item.status === 'Planejado' ? `
                        <button class="btn-action" onclick="desatribuirAtendente('${item.id}')" style="font-size: 12px; padding: 10px; background: rgba(239, 68, 68, 0.05); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px;">👤✕ Desatribuir</button>
                    ` : ''}
                    ${item.status === 'Atendido' ? `
                        <button class="btn-action" onclick="encaminharParaNovaTriagemMobile('${item.id}')" style="font-size: 12px; padding: 10px; background: rgba(139, 92, 246, 0.1); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px;">📋 Novo Atendimento</button>
                    ` : ''}
                </div>
            `;
        }

        div.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 6px; flex: 2; min-width: 200px;">
                <div style="display: flex; flex-direction: column; margin-bottom: 4px;">
                    <div>
                        <strong style="font-size: 15px; color: var(--text-main); line-height: 1.2; vertical-align: middle;">${item.nome_completo ? item.nome_completo.toUpperCase() : 'SEM NOME'}</strong>
                        ${badgeHtml}
                    </div>
                    <span style="font-size: 12px; color: var(--text-muted); font-weight: 500; margin-top: 2px;">${shortName}</span>
                </div>
                
                <div style="font-size: 13px; color: var(--text-muted);">📍 ${endFull}${item.cep ? ' - CEP: ' + formatarCEP(item.cep) : ''}</div>
                <div style="font-size: 13px; color: var(--text-muted);">🎂 Nascimento: ${nascimentoInfo}</div>
                <div style="font-size: 13px; color: var(--text-muted);">📄 CPF: ${item.cpf_cnpj ? formatarCPF(item.cpf_cnpj) : 'Não informado'}</div>
                <div style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-muted); margin-top: 2px;">
                    <span>📱 Celular: ${item.telefone ? formatarCelular(item.telefone) : 'Não informado'}</span>
                    ${whatsLink}
                </div>
                <div style="font-size: 11px; margin-top: 6px; padding: 4px 10px; background: rgba(255,255,255,0.05); border-radius: 12px; color: var(--text-muted); display: inline-block; width: fit-content;">Em ${dateStr}${item.criado_por ? ' por ' + item.criado_por : ''}</div>
                ${infoExtra}
            </div>
            
            ${buttonsHtml}
        `;
        
        return div;
    }

    // --- SESSOES DE FICHA DE ATENDIMENTO ---

    window.abrirFichaAtendimento = async function(id) {
        pacienteAtualFichaId = id;
        window.abrirSideSheet('Ficha de Atendimento', '<div style="padding: 24px;">Carregando dados...</div>');

        try {
            // Detalhes do necessitado
            const { data: paciente, error } = await db.from('app_atendimento_fraterno').select('*, paciente:pessoas!paciente_id(*)').eq('id', id).single();
            if (error) throw error;

            const nomeStr = (paciente.paciente?.nome_completo || paciente.nome_completo || '').toUpperCase();
            const nascStr = paciente.paciente?.data_nascimento || paciente.data_nascimento;
            const nascFormatado = nascStr ? `${nascStr.split('-').reverse().join('/')} (${calcularIdade(nascStr)} anos)` : '-';
            const telStr = paciente.paciente?.celular || paciente.celular || '';
            const telFormatado = telStr ? formatarCelular(telStr) : '-';

            let infoHtml = `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <strong>Nome:</strong> ${nomeStr}<br>
                    <strong>Nascimento:</strong> ${nascFormatado}<br>
                    <strong>Telefone:</strong> ${telFormatado}
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



            let formHtml = '';
            
            if (abaPrincipal === 'historico' || subAba === 'historico_geral') {
                formHtml = '';
            } else if (paciente.status !== 'Atendido' && paciente.status !== 'Concluído' && paciente.status !== 'Cancelado' && paciente.status !== 'Em Tratamento') {
                formHtml = `
                    <div style="margin-bottom: 24px;">
                        <h4 style="margin-top:0; color:var(--primary); margin-bottom:12px;">Registro de Atendimento Atual</h4>
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label style="color: var(--text-muted); font-size: 13px;">Sintomas e Orientações</label>
                            <textarea id="sideTxtSintomasOrientacoes" class="input" rows="4" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: white; padding: 12px; border-radius: 8px;" placeholder="Descreva os sintomas apresentados e as orientações transmitidas..."></textarea>
                        </div>
                        
                        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
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
                    
                    <div style="padding-top: 24px; border-top: 1px solid var(--border); display: flex; gap: 12px; padding-bottom: 24px;">
                        <button type="button" onclick="window.fecharSideSheet()" class="btn" style="flex:1; padding: 12px; border-radius: 8px; background: transparent; color: var(--text-main); border: 1px solid var(--border);">Cancelar</button>
                        <button type="button" onclick="salvarFichaAtendimentoSideSheet(this)" class="btn" style="flex:1; padding: 12px; border-radius: 8px; background: var(--primary); color: white; border: none; font-weight: 600;">Gravar</button>
                    </div>
                `;
            } else {
                formHtml = `
                    <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 12px; align-items: center; padding-bottom: 24px;">
                        <p style="color: var(--text-muted); font-size: 13px; text-align: center; margin-bottom: 0;">✅ Este Ciclo do Fraterno já foi concluído e seu histórico está consolidado.</p>
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
        container.innerHTML = '<div class="empty-state">Carregando tratamentos...</div>';

        try {
            const { data: trats, error } = await db.from('app_atendimento_tratamentos')
                .select('*, app_atendimento_fraterno(id, nome_completo, paciente:pessoas!paciente_id(*)), app_atendimento_presencas(data)')
                .eq('status', 'Ativo');

            if (error) throw error;

            if (!trats || trats.length === 0) {
                container.innerHTML = '<div class="empty-state">Nenhum tratamento ativo encontrado.</div>';
                return;
            }

            container.innerHTML = '';

            // Group by paciente
            const pacienteGrupos = {};
            trats.forEach(t => {
                const f = t.app_atendimento_fraterno;
                if (!f) return;
                if (!pacienteGrupos[f.id]) {
                    pacienteGrupos[f.id] = { info: f, tratamentos: [] };
                }
                pacienteGrupos[f.id].tratamentos.push(t);
            });

            const sortedPacIds = Object.keys(pacienteGrupos).sort((a, b) => {
                const nA = (pacienteGrupos[a].info.paciente?.nome_completo || pacienteGrupos[a].info.nome_completo || '');
                const nB = (pacienteGrupos[b].info.paciente?.nome_completo || pacienteGrupos[b].info.nome_completo || '');
                return nA.localeCompare(nB);
            });

            sortedPacIds.forEach(pacId => {
                const grupo = pacienteGrupos[pacId];
                const card = document.createElement('div');
                card.className = 'card-atendimento';
                card.style.marginBottom = '12px';
                card.style.padding = '16px';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.gap = '12px';

                let tratsHTML = '';
                grupo.tratamentos.forEach(t => {
                    const badgeColor = t.tipo === 'Espiritual' ? '#818cf8' : '#3b82f6';
                    const dtIniStr = t.data_inicio ? t.data_inicio.split('T')[0].split('-').reverse().join('/') : '';
                    
                    let attendedToday = false;
                    if (t.app_atendimento_presencas) {
                        const now = new Date();
                        const tzOffset = now.getTimezoneOffset() * 60000;
                        const todayLocal = new Date(now.getTime() - tzOffset).toISOString().split('T')[0];
                        attendedToday = t.app_atendimento_presencas.some(p => p.data && p.data.split('T')[0] === todayLocal);
                    }

                    const labelHtml = attendedToday 
                        ? '<span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: rgba(59, 130, 246, 0.2); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); white-space: nowrap;">✅ Atendido Hoje</span>' 
                        : (t.presente 
                            ? '<span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); white-space: nowrap;">🟢 Presente na Casa</span>' 
                            : '<span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); white-space: nowrap;">🟡 Aguardando Chegada</span>'
                        );

                    let btnConfirm = '';
                    if (attendedToday) {
                        btnConfirm = `<button disabled style="padding: 6px 10px; font-size: 12px; font-weight: 600; background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px dashed var(--border); border-radius: 4px; flex: 1;">Já Realizado Hoje</button>`;
                    } else if (!t.presente) {
                        btnConfirm = `<button disabled style="padding: 6px 10px; font-size: 12px; font-weight: 600; background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px dashed rgba(245, 158, 11, 0.3); border-radius: 4px; flex: 1;">⏳ Aguarde Presença</button>`;
                    } else {
                        btnConfirm = `<button onclick="confirmarSessaoTratamentoMobile('${t.id}', '${t.tipo}')" style="padding: 6px 10px; font-size: 12px; font-weight: 600; background: ${badgeColor}; color: white; border: none; border-radius: 4px; flex: 1;">Confirmar Atendimento</button>`;
                    }

                    const btnDesfazer = (!attendedToday && t.presente) 
                        ? `<button onclick="marcarTratamentoPresenteMobile('${t.id}', false)" style="padding: 6px 10px; font-size: 11px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 4px;">Desfazer Presente</button>`
                        : ``;

                    const btnConcluir = `<button onclick="mudarStatusTratamentoMobile('${t.id}', 'Concluído')" style="padding: 6px 10px; font-size: 12px; font-weight: 600; background: #10b981; color: white; border: none; border-radius: 4px; flex: 1;">Concluir</button>`;
                    const btnSuspender = `<button onclick="mudarStatusTratamentoMobile('${t.id}', 'Suspenso')" style="padding: 6px 10px; font-size: 12px; font-weight: 600; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 4px; flex: 1;">Suspender</button>`;

                    tratsHTML += `
                        <div style="display: flex; flex-direction: column; gap: 8px; background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px;">
                                <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 12px; background: ${badgeColor}; color: white; text-transform: uppercase; white-space: nowrap;">${t.tipo}</span>
                                ${labelHtml}
                                <span style="font-size: 12px; color: var(--text-muted);">Início: ${dtIniStr}</span>
                            </div>
                            <div style="display: flex; gap: 8px; width: 100%;">
                                ${btnConfirm}
                                ${btnDesfazer}
                            </div>
                            <div style="display: flex; gap: 8px; width: 100%;">
                                ${btnConcluir}
                                ${btnSuspender}
                            </div>
                        </div>
                    `;
                });

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;">
                        <strong style="font-size: 15px; color: white;">${(grupo.info.paciente?.nome_completo || grupo.info.nome_completo || '').toUpperCase()}</strong>
                        <span style="font-size: 12px; color: var(--text-muted); background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 4px;">📱 ${grupo.info.paciente?.celular || grupo.info.telefone || 'Sem telefone'}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 4px;">
                        ${tratsHTML}
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px;">
                        <button onclick="toggleEvolucaoInlineMobile('${grupo.info.id}')" style="padding: 6px 12px; font-size: 12px; font-weight: 600; background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--border); border-radius: 6px; display: flex; align-items: center; gap: 6px;">
                            📝 Evolução & Prontuário
                        </button>
                    </div>
                    <div id="panel_evolucao_mobile_${grupo.info.id}" style="display: none; margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px;"></div>
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
            else if (subAba === 'tratamentos') carregarTratamentosAtivos();
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
                .select('*, app_atendimento_fraterno(nome_completo, id, paciente:pessoas!paciente_id(*)), app_atendimento_presencas(data)')
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
                        nome: t.app_atendimento_fraterno?.paciente?.nome_completo || t.app_atendimento_fraterno?.nome_completo || 'Desconhecido',
                        telefone: t.app_atendimento_fraterno?.paciente?.celular || t.app_atendimento_fraterno?.telefone,
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
                    const nameA = a.app_atendimento_fraterno?.paciente?.nome_completo || a.app_atendimento_fraterno?.nome_completo || '';
                    const nameB = b.app_atendimento_fraterno?.paciente?.nome_completo || b.app_atendimento_fraterno?.nome_completo || '';
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
                                ${t.app_atendimento_fraterno?.paciente?.nome_completo?.toUpperCase() || t.app_atendimento_fraterno?.nome_completo?.toUpperCase() || 'DESCONHECIDO'}
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
                await db.from('pessoas').update({
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
            <form onsubmit="salvarTriagemSideSheet(event, '${id}')" style="display: flex; flex-direction: column; gap: 16px;">
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div class="form-group">
                        <label style="color: var(--text-muted); font-size: 13px;">Atendente Fraterno</label>
                        <select id="sideSelectAtendenteAtendimento" required class="input" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: white; padding: 12px; border-radius: 8px;">
                            <option value="">Carregando atendentes...</option>
                        </select>
                    </div>
                </div>

                <div style="padding-top: 24px; border-top: 1px solid var(--border); display: flex; gap: 12px;">
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

    window.mudarStatusTratamentoMobile = async function(id, novoStatus) {
        const res = await Swal.fire({
            title: novoStatus === 'Concluído' ? 'Concluir Tratamento?' : 'Suspender Tratamento?',
            text: novoStatus === 'Concluído' ? 'Deseja encerrar este tratamento com sucesso?' : 'Deseja suspender temporariamente este tratamento?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: novoStatus === 'Concluído' ? '#10b981' : '#ef4444',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sim',
            background: 'var(--bg-panel)',
            color: 'var(--text-main)'
        });
        if (!res.isConfirmed) return;

        try {
            const { error } = await db.from('app_atendimento_tratamentos').update({ status: novoStatus, presente: false }).eq('id', id);
            if (error) throw error;
            carregarTratamentosAtivos();
        } catch (e) {
            Swal.fire('Erro', e.message, 'error');
        }
    };

    window.toggleEvolucaoInlineMobile = async function(id) {
        const panel = document.getElementById('panel_evolucao_mobile_' + id);
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
                <h5 style="margin: 0 0 8px 0; color: var(--text-main); font-size: 13px; font-weight: 600;">Sessões de Atendimento</h5>
                ${sessoesHTML}
                
                <h5 style="margin: 12px 0 8px 0; color: var(--text-main); font-size: 13px; font-weight: 600;">Histórico de Tratamentos</h5>
                ${presencasHTML}
            `;

        } catch (e) {
            console.error(e);
            panel.innerHTML = `<span style="color: #ef4444; font-size: 12px;">Erro: ${e.message || JSON.stringify(e)}</span>`;
        }
    };
window.carregarHistoricoGeralMobile = async function () {
    const lista = document.getElementById('listaAtendimento');
    if (!lista) return;

    lista.innerHTML = '<div style="color: var(--text-muted); font-size: 14px; padding: 24px; text-align: center;">Carregando histórico geral...</div>';

    try {
        const [fraternoReq, tratamentosReq] = await Promise.all([
            db.from('app_atendimento_fraterno').select('*, pessoas!atendente_id(id, nome_completo), paciente:pessoas!paciente_id(*)').in('status', ['Atendido', 'Concluído']),
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
                atendente: f.pessoas?.nome_completo || 'Sem Atendente',
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
                telefone: t.app_atendimento_fraterno?.paciente?.celular,
                data_inicio: t.data_inicio
            });
        });

        if (itens.length === 0) {
            lista.innerHTML = '<div style="padding: 24px; text-align: center; border: 1px dashed var(--border); border-radius: 8px; color: var(--text-muted);">Nenhum histórico encontrado.</div>';
            return;
        }

        // Ordenar do mais recente para o mais antigo
        itens.sort((a, b) => new Date(b.data) - new Date(a.data));

        // Agrupar por Ano e Mês
        const grupos = {};
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        
        itens.forEach(item => {
            const d = new Date(item.data);
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
                        <strong style="color: var(--text-main); font-size: 16px;">📂 Ano ${ano} <span style="font-size: 12px; opacity: 0.7; font-weight: normal; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 12px;">(${Object.values(grupos[ano]).flat().length} registros)</span></strong>
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
                        <h4 onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'flex' : 'none'" style="color: var(--primary); font-size: 15px; margin-bottom: 12px; margin-top: 0; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                📂 ${mes} <span style="font-size: 11px; color: var(--text-muted); font-weight: normal; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 12px;">${registros.length} registros</span>
                            </div>
                            <span style="color: var(--text-muted); font-size: 12px; font-weight: normal; opacity: 0.5;">▼</span>
                        </h4>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                `;

                registros.forEach(r => {
                    let badgeConfig = { color: '#f59e0b', text: '🤝 TRIAGEM' };
                    let descHtml = `Atendente: ${r.atendente}`;
                    
                    if (r.tipo === 'Fluídico') {
                        badgeConfig = { color: '#3b82f6', text: '💧 TRAT. FLUÍDICO' };
                        const statusColor = r.status === 'Concluído' ? '#10b981' : '#ef4444';
                        const inicioStr = r.data_inicio ? new Date(r.data_inicio).toLocaleDateString('pt-BR') : '?';
                        const fimStr = r.data ? new Date(r.data).toLocaleDateString('pt-BR') : '?';
                        descHtml = `Período: ${inicioStr} até ${fimStr} — <strong style="color: ${statusColor}">${r.status}</strong>`;
                    } else if (r.tipo === 'Espiritual') {
                        badgeConfig = { color: '#8b5cf6', text: '✨ TRAT. ESPIRITUAL' };
                        const statusColor = r.status === 'Concluído' ? '#10b981' : '#ef4444';
                        const inicioStr = r.data_inicio ? new Date(r.data_inicio).toLocaleDateString('pt-BR') : '?';
                        const fimStr = r.data ? new Date(r.data).toLocaleDateString('pt-BR') : '?';
                        descHtml = `Período: ${inicioStr} até ${fimStr} — <strong style="color: ${statusColor}">${r.status}</strong>`;
                    }

                    const dtDisplay = new Date(r.data).toLocaleDateString('pt-BR');

                    anoHtml += `
                        <div style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 2px;">
                                <span style="font-size: 10px; font-weight: bold; background: ${badgeConfig.color}; color: white; padding: 2px 6px; border-radius: 4px; white-space: nowrap;">${badgeConfig.text}</span>
                                <strong style="color: var(--text-main); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${r.nome.toUpperCase()}</strong>
                            </div>
                            <div style="font-size: 12px; color: var(--text-muted); line-height: 1.4;">
                                <span>📅 ${dtDisplay}</span> &mdash; <span>${descHtml}</span>
                            </div>
                            <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px; display: flex; justify-content: flex-end;">
                                <button onclick="abrirFichaAtendimento('${r.fraterno_id}')" class="btn" style="background: rgba(255,255,255,0.05); color: var(--text-main); border: 1px solid var(--border); padding: 6px 12px; font-size: 12px; border-radius: 6px; font-weight: 600;">📝 Ficha</button>
                            </div>
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
        lista.innerHTML = `<span style="color:#ef4444;">Erro: ${err.message || JSON.stringify(err)}</span>`;
    }
};



window.carregarFicharioMobile = function(allData, allTratamentos) {
    const lista = document.getElementById('listaAtendimento');
    lista.innerHTML = '';
    
    const allPatientsSet = new Set();
    allData.forEach(d => {
        const nome = (d.paciente?.nome_completo || d.nome_completo || 'Sem Nome').trim().toUpperCase();
        allPatientsSet.add(nome);
    });
    allTratamentos.forEach(t => {
        const f = t.app_atendimento_fraterno;
        if(f) allPatientsSet.add((f.paciente?.nome_completo || f.nome_completo || 'Sem Nome').trim().toUpperCase());
    });
    const totalGeral = allPatientsSet.size;
    
    const patientsMap = new Map();
    const letter = subAba;

    const buildAddress = (p) => {
        if (!p) return null;
        const endPartes = [];
        if (p.endereco) endPartes.push(p.endereco);
        if (p.bairro) endPartes.push(p.bairro);
        let cidEst = [];
        if (p.cidade) cidEst.push(p.cidade);
        if (p.estado) cidEst.push(p.estado);
        if (cidEst.length > 0) endPartes.push(cidEst.join('/'));
        return endPartes.length > 0 ? endPartes.join(', ') : null;
    };
    
    allData.forEach(d => {
        const nome = (d.paciente?.nome_completo || d.nome_completo || 'Sem Nome').trim().toUpperCase();
        const initial = nome.charAt(0);
        if (initial === letter) {
            if (!patientsMap.has(nome)) {
                patientsMap.set(nome, {
                    nome_completo: (d.paciente?.nome_completo || d.nome_completo || 'Sem Nome').trim(),
                    nome_curto: d.paciente?.nome_curto || d.nome_curto || (d.nome_completo || 'Sem Nome').trim().split(' ')[0],
                    telefone: d.paciente?.celular || d.telefone || '',
                    data_nascimento: d.paciente?.data_nascimento || d.data_nascimento || '',
                    endereco: buildAddress(d.paciente) || d.endereco_completo || '',
                    cpf_cnpj: d.paciente?.cpf_cnpj || d.cpf_cnpj || '',
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
        const nome = (f.paciente?.nome_completo || f.nome_completo || 'Sem Nome').trim().toUpperCase();
        const initial = nome.charAt(0);
        if (initial === letter) {
            if (!patientsMap.has(nome)) {
                patientsMap.set(nome, {
                    nome_completo: (f.paciente?.nome_completo || f.nome_completo || 'Sem Nome').trim(),
                    nome_curto: f.paciente?.nome_curto || f.nome_curto || (f.nome_completo || 'Sem Nome').trim().split(' ')[0],
                    telefone: f.paciente?.celular || f.telefone || '',
                    data_nascimento: f.paciente?.data_nascimento || f.data_nascimento || '',
                    endereco: buildAddress(f.paciente) || f.endereco_completo || '',
                    cpf_cnpj: f.paciente?.cpf_cnpj || f.cpf_cnpj || '',
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

    const summaryHtml = `
        <div style="background: linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%); border: 1px solid rgba(99,102,241,0.2); border-radius: 12px; padding: 16px; margin-bottom: 16px; display: flex; gap: 16px; align-items: center; justify-content: space-between;">
            <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
                <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Total Fichário</div>
                <div style="font-size: 24px; font-weight: 800; background: linear-gradient(to right, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${totalGeral}</div>
            </div>
            <div style="width: 1px; height: 30px; background: rgba(255,255,255,0.1);"></div>
            <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
                <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Letra ${letter}</div>
                <div style="font-size: 24px; font-weight: 800; background: linear-gradient(to right, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${totalLetra}</div>
            </div>
        </div>
    `;
    
    lista.innerHTML = summaryHtml;

    if (patientsArray.length === 0) {
        lista.innerHTML += `<div class="empty-state">Nenhum paciente encontrado com a letra ${letter}</div>`;
        return;
    }

    patientsArray.forEach(p => {
        const safeId = p.nome_completo.replace(/[^a-zA-Z0-9]/g, '_');
        window['fichario_' + safeId] = p;

        let nascimentoInfo = 'Não informado';
        if (p.data_nascimento) {
            const age = typeof calcularIdade === 'function' ? calcularIdade(p.data_nascimento) : '?';
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

        const countA = p.atendimentos.length;
        const countT = p.tratamentos.length;

        const card = document.createElement('div');
        card.className = 'card-atendimento';
        card.style.marginBottom = '12px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '12px';
        card.style.padding = '16px';

        card.innerHTML = `
            <div>
                <div style="display: flex; flex-direction: column; margin-bottom: 8px;">
                    <strong style="color: var(--text-main); font-size: 16px; line-height: 1.3;">${p.nome_completo.toUpperCase()}</strong>
                    <span style="color: var(--text-muted); font-size: 12px; font-weight: 500;">${p.nome_curto || ''}</span>
                </div>
                
                <div style="font-size: 13px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;">
                    <div>📄 CPF: ${p.cpf_cnpj ? formatarCPF(p.cpf_cnpj) : 'Não informado'}</div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-top: 2px;">
                        <span>📱 Cel.: ${p.telefone ? formatarCelular(p.telefone) : 'Não informado'}</span>
                        ${whatsLink}
                    </div>
                </div>
                
                <div style="margin-top: 12px; font-size: 12px; color: var(--text-muted); background: rgba(0,0,0,0.15); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); display: flex; gap: 12px; align-items: center;">
                    <span style="color: var(--primary);">${countA} Atendimentos</span>
                    <span style="opacity: 0.3;">|</span>
                    <span style="color: #10b981;">${countT} Tratamentos</span>
                </div>
            </div>

            <div style="display: flex; gap: 8px; flex-direction: row; margin-top: auto; flex-wrap: wrap;">
                <button onclick="abrirFichaPacienteFichario('${p.paciente_id}')" class="btn" style="flex: 1; min-width: 90px; background: rgba(59,130,246,0.1); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); font-size: 12px; padding: 10px; border-radius: 8px; font-weight: 600;">📝 Ficha</button>
                <button onclick="abrirModalFicharioCompleto('${safeId}')" class="btn" style="flex: 1; min-width: 90px; background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); font-size: 12px; padding: 10px; border-radius: 8px; font-weight: 600;">📜 Histórico</button>
                <button onclick="iniciarNovoAtendimentoFichario('${safeId}')" class="btn" style="flex: 1; min-width: 90px; background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.3); font-size: 12px; padding: 10px; border-radius: 8px; font-weight: 600;">➕ Novo</button>
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
        let query = db.from('app_atendimento_fraterno').select('*, pessoas!atendente_id(nome_completo, nome_curto), paciente:pessoas!paciente_id(nome_completo, nome_curto)');
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
                tipo: 'ATENDIMENTO', 
                data: new Date(a.created_at),
                obj: a
            });
        });
        
        const fraternoIds = allAtendimentos.map(a => a.id);
        
        if (fraternoIds.length > 0) {
            const { data: tratamentos, error: errT } = await db
                .from('app_atendimento_tratamentos')
                .select('*')
                .in('atendimento_id', fraternoIds);
                
            if (errT) throw errT;
            
            const trats = tratamentos || [];
            
            const tratIds = trats.map(t => t.id);
            let sessoesData = [];
            let presencasData = [];
            
            if (tratIds.length > 0) {
                const [sessReq, presReq] = await Promise.all([
                    db.from('app_atendimento_sessoes').select('*, pessoas!atendente_id(nome_curto, nome_completo)').in('atendimento_id', fraternoIds),
                    db.from('app_atendimento_presencas').select('*').in('tratamento_id', tratIds)
                ]);
                
                if (sessReq.error) throw sessReq.error;
                if (presReq.error) throw presReq.error;
                
                sessoesData = sessReq.data || [];
                presencasData = presReq.data || [];
            } else {
                const { data: sessoes, error: errS } = await db
                    .from('app_atendimento_sessoes')
                    .select('*, pessoas!atendente_id(nome_curto, nome_completo)')
                    .in('atendimento_id', fraternoIds);
                if (errS) throw errS;
                sessoesData = sessoes || [];
            }
            
            trats.forEach(t => {
                eventos.push({
                    tipo: 'TRATAMENTO_INICIADO',
                    data: new Date(t.created_at),
                    obj: t
                });
            });
            
            sessoesData.forEach(s => {
                eventos.push({
                    tipo: 'SESSAO_EVOLUCAO',
                    data: new Date(s.created_at),
                    obj: s
                });
            });
            
            presencasData.forEach(pr => {
                eventos.push({
                    tipo: 'PRESENCA_TRATAMENTO',
                    data: new Date(pr.created_at),
                    obj: pr
                });
            });
        }
        
        eventos.sort((a, b) => b.data - a.data);
        
        if (eventos.length === 0) {
            document.getElementById('globalSideSheetContent').innerHTML = `
                <div style="padding: 24px; text-align: center; color: var(--text-muted);">
                    Nenhum registro histórico encontrado.
                </div>
            `;
            return;
        }

        let html = '<div style="padding: 16px;">';
        
        html += `
            <div style="margin-bottom: 24px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 16px; border-radius: 12px;">
                <h3 style="margin: 0 0 8px 0; color: var(--primary); font-size: 18px;">${p.nome_completo.toUpperCase()}</h3>
                <div style="font-size: 13px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;">
                    <span>📞 ${p.telefone || 'Sem telefone'}</span>
                    ${p.endereco ? `<span>📍 ${p.endereco}</span>` : ''}
                    <span>🎂 Nascimento: ${p.data_nascimento ? p.data_nascimento.split('-').reverse().join('/') : 'Não informado'}</span>
                </div>
            </div>
        `;
        
        html += '<div style="position: relative; padding-left: 20px; border-left: 2px solid rgba(255,255,255,0.1);">';
        
        eventos.forEach((ev, index) => {
            let icon = '';
            let color = '';
            let title = '';
            let content = '';
            
            const localDate = ev.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            
            if (ev.tipo === 'ATENDIMENTO') {
                icon = '🤝'; color = '#f59e0b'; title = 'Triagem / Atend. Fraterno';
                content = `
                    <div style="margin-top: 8px;">
                        <strong>Status:</strong> ${ev.obj.status} <br>
                        <strong>Motivo:</strong> ${ev.obj.motivo || '-'} <br>
                        <strong>Atendente:</strong> ${ev.obj.pessoas?.nome_curto || ev.obj.pessoas?.nome_completo || 'Desconhecido'}
                    </div>
                `;
            } 
            else if (ev.tipo === 'TRATAMENTO_INICIADO') {
                icon = ev.obj.tipo === 'Fluídico' ? '💧' : '✨';
                color = ev.obj.tipo === 'Fluídico' ? '#3b82f6' : '#8b5cf6';
                title = `Início de Tratamento ${ev.obj.tipo}`;
                content = `
                    <div style="margin-top: 8px;">
                        <strong>Status Atual:</strong> ${ev.obj.status} <br>
                        <strong>Data Fim:</strong> ${ev.obj.data_fim ? new Date(ev.obj.data_fim).toLocaleDateString('pt-BR') : '-'}
                    </div>
                `;
            }
            else if (ev.tipo === 'SESSAO_EVOLUCAO') {
                icon = '📝'; color = '#10b981'; title = 'Sessão / Evolução';
                content = `
                    <div style="margin-top: 8px;">
                        <strong>Sintomas:</strong> ${ev.obj.sintomas_orientacoes} <br>
                        <strong>Atendente:</strong> ${ev.obj.pessoas?.nome_curto || ev.obj.pessoas?.nome_completo || 'Desconhecido'} <br>
                        ${ev.obj.apenas_conversa ? '<span style="font-size: 11px; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; margin-top: 4px; display: inline-block;">Apenas Conversa</span>' : ''}
                    </div>
                `;
            }
            else if (ev.tipo === 'PRESENCA_TRATAMENTO') {
                icon = '🟢'; color = '#10b981'; title = 'Presença Registrada';
                content = `
                    <div style="margin-top: 8px;">
                        <strong>Data:</strong> ${new Date(ev.obj.data).toLocaleDateString('pt-BR')} <br>
                        <strong>Obs:</strong> ${ev.obj.observacoes || '-'}
                    </div>
                `;
            }

            html += `
                <div style="position: relative; margin-bottom: 24px;">
                    <div style="position: absolute; left: -32px; top: 0; width: 24px; height: 24px; border-radius: 50%; background: ${color}; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid var(--bg-panel);">
                        ${icon}
                    </div>
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                            <strong style="color: ${color}; font-size: 13px;">${title}</strong>
                            <span style="font-size: 11px; color: var(--text-muted);">${localDate}</span>
                        </div>
                        <div style="font-size: 13px; color: var(--text-main); line-height: 1.5;">
                            ${content}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div></div>';
        
        document.getElementById('globalSideSheetContent').innerHTML = html;

    } catch (e) {
        document.getElementById('globalSideSheetContent').innerHTML = `
            <div style="padding: 24px; color: #ef4444; text-align: center;">
                Erro ao carregar histórico: ${e.message}
            </div>
        `;
    }
};

window.iniciarNovoAtendimentoFichario = function(safeId) {
    const p = window['fichario_' + safeId];
    if(!p) return;

    Swal.fire({
        title: 'Nova Triagem',
        html: `Deseja inserir o paciente <strong>${p.nome_completo}</strong> na fila de Triagem (Atendimento Fraterno)?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: 'var(--primary)',
        cancelButtonColor: 'rgba(255,255,255,0.1)',
        confirmButtonText: 'Sim, iniciar nova Triagem',
        cancelButtonText: 'Cancelar',
        background: 'var(--bg-panel)',
        color: 'var(--text-main)'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                let payload = {};
                if (p.paciente_id) {
                    payload = { paciente_id: p.paciente_id, status: 'Planejado' };
                } else {
                    payload = { 
                        nome_completo: p.nome_completo,
                        telefone: p.telefone,
                        data_nascimento: p.data_nascimento,
                        endereco_completo: p.endereco,
                        cpf_cnpj: p.cpf_cnpj,
                        status: 'Planejado'
                    };
                }

                const { error } = await db.from('app_atendimento_fraterno').insert([payload]);
                if (error) throw error;
                
                Swal.fire({
                    title: 'Sucesso',
                    text: 'Paciente inserido na fila de Triagem.',
                    icon: 'success',
                    background: 'var(--bg-panel)',
                    color: 'var(--text-main)'
                }).then(() => {
                    abaPrincipal = 'triagem';
                    subAba = 'fila';
                    document.querySelectorAll('.m-tab').forEach(t => {
                        if (t.dataset.main === 'triagem') t.classList.add('active');
                        else t.classList.remove('active');
                    });
                    if (typeof renderSubTabs === 'function') renderSubTabs();
                    if (typeof carregarLista === 'function') carregarLista();
                });
            } catch (e) {
                Swal.fire('Erro', e.message, 'error');
            }
        }
    });
};

window.abrirFichaPacienteFichario = async function(pacienteId) {
    if (!pacienteId || pacienteId === 'null' || pacienteId === 'undefined') {
        Swal.fire({
            title: 'Erro', 
            text: 'Este paciente não possui um cadastro completo vinculado (ID de Pessoa ausente).', 
            icon: 'error',
            background: 'var(--bg-panel)',
            color: 'var(--text-main)'
        });
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
            const age = typeof calcularIdade === 'function' ? calcularIdade(p.data_nascimento) : '?';
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
            <div style="padding: 16px; color: var(--text-main);">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
                    ${avatarHtml}
                    <div>
                        <h2 style="margin: 0; font-size: 18px;">${p.nome_completo || 'Sem Nome'}</h2>
                        <div style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">${p.nome_curto || ''}</div>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 16px;">
                    <h4 style="margin-top: 0; margin-bottom: 12px; font-size: 13px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">Dados de Contato</h4>
                    
                    <div style="display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <span style="color: var(--text-muted); font-size: 13px;">Celular</span>
                            <strong style="font-size: 13px;">${celularHtml}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <span style="color: var(--text-muted); font-size: 13px;">E-mail</span>
                            <strong style="font-size: 13px;">${p.email || '-'}</strong>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <span style="color: var(--text-muted); font-size: 13px;">Endereço</span>
                            <strong style="font-size: 13px; line-height: 1.4;">${endFull}</strong>
                        </div>
                    </div>

                    <h4 style="margin-top: 0; margin-bottom: 12px; font-size: 13px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">Dados Pessoais</h4>
                    
                    <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
                        <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <span style="color: var(--text-muted); font-size: 13px;">CPF</span>
                            <strong style="font-size: 13px;">${docFormatado}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <span style="color: var(--text-muted); font-size: 13px;">Nascimento</span>
                            <strong style="font-size: 13px;">${nascHtml}</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('globalSideSheetContent').innerHTML = html;
        
    } catch (e) {
        document.getElementById('globalSideSheetContent').innerHTML = `
            <div style="padding: 24px; color: #ef4444; text-align: center;">
                Erro ao carregar dados: ${e.message}
            </div>
        `;
    }
};


})();
