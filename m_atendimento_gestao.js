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
    let abaAtual = 'fila';
    let pacienteAtualFichaId = null;

    document.addEventListener('DOMContentLoaded', () => {
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
                abaAtual = t.dataset.tab;
                carregarLista();
            });
        });

        carregarLista();
    });

    async function carregarLista() {
        const container = document.getElementById('listaAtendimento');
        container.innerHTML = '<div class="empty-state">Carregando...</div>';

        if (!db) return;

        try {
            // Obter todos os atendimentos
            const { data: allData, error } = await db.from('app_atendimento_fraterno').select('*, pessoas!atendente_id(id, nome_completo)');
            if (error) throw error;

            const now = new Date();
            const curYear = now.getFullYear();
            const curMonth = now.getMonth();

            // Estatísticas
            const totalFila = allData.filter(d => d.status !== 'Atendido' && d.status !== 'Em Tratamento').length;
            const espera = allData.filter(d => d.presente && !d.atendente_id && d.status !== 'Atendido' && d.status !== 'Em Tratamento').length;
            const andamento = allData.filter(d => d.presente && d.atendente_id && d.status !== 'Atendido' && d.status !== 'Em Tratamento').length;
            
            // Buscar tratamentos para estatística
            const { data: activeTrats } = await db.from('app_atendimento_tratamentos').select('id').eq('status', 'Ativo');
            const totalTratamentos = activeTrats ? activeTrats.length : 0;

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

            if (abaAtual === 'fila') {
                filteredData = allData.filter(d => d.status !== 'Atendido' && d.status !== 'Em Tratamento');
                filteredData.sort((a, b) => (a.nome_completo || '').localeCompare(b.nome_completo || ''));
                renderNormalList(filteredData);
            } 
            else if (abaAtual === 'espera') {
                filteredData = allData.filter(d => d.presente && !d.atendente_id && d.status !== 'Atendido' && d.status !== 'Em Tratamento');
                filteredData.sort((a, b) => (a.nome_completo || '').localeCompare(b.nome_completo || ''));
                renderNormalList(filteredData);
            } 
            else if (abaAtual === 'andamento') {
                filteredData = allData.filter(d => d.presente && d.atendente_id && d.status !== 'Atendido' && d.status !== 'Em Tratamento');
                renderAndamentoList(filteredData);
            } 
            else if (abaAtual === 'mes') {
                filteredData = allData.filter(item => {
                    if (item.status !== 'Atendido' && item.status !== 'Em Tratamento') return false;
                    const d = new Date(item.data_hora_atendimento || item.created_at);
                    return d.getFullYear() === curYear && d.getMonth() === curMonth;
                });
                renderHistoricoList(filteredData);
            } 
            else if (abaAtual === 'tratamentos') {
                carregarTratamentosAtivos();
            } 
            else if (abaAtual === 'presencas') {
                carregarFilaPresencas();
            } 
            else if (abaAtual === 'painel_semanal') {
                carregarPainelSemanal();
            }

        } catch (e) {
            console.error("Erro ao carregar dados:", e);
            container.innerHTML = '<div class="empty-state" style="color:var(--danger);">Erro ao carregar dados do Supabase.</div>';
        }
    }

    function renderNormalList(data) {
        const container = document.getElementById('listaAtendimento');
        container.innerHTML = '';
        if (data.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum necessitado nesta fila.</div>';
            return;
        }
        data.forEach(item => {
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
                    <div class="card-date">Criado em: ${dataCriacao}</div>
                </div>
            </div>
            
            <div class="card-info"><strong>Endereço:</strong> ${item.endereco_completo || '-'}</div>
            <div class="card-info"><strong>Nascimento:</strong> ${nascimentoInfo}</div>
            <div class="card-info"><strong>WhatsApp:</strong> 
                ${item.telefone ? `<a href="https://wa.me/55${item.telefone.replace(/\D/g, '')}" target="_blank" style="color:var(--primary); text-decoration:none;">${item.telefone}</a>` : '-'}
            </div>
            ${infoExtra}

            <div class="card-actions" style="flex-wrap: wrap; margin-top: 12px; gap: 8px;">
                ${item.status !== 'Atendido' ? btnPresenca : ''}
                
                ${item.status === 'Pendente' || (item.status === 'Planejado' && abaAtual !== 'andamento') ? `
                    <button class="btn-action" onclick="abrirTriagem('${item.id}')" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2);">🤝 Triagem</button>
                ` : ''}

                ${item.status === 'Planejado' && item.presente ? `
                    <button class="btn-action" onclick="abrirFichaAtendimento('${item.id}')" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">📝 Ficha & Fila</button>
                ` : ''}

                ${item.status === 'Planejado' ? `
                    <button class="btn-action" onclick="desatribuirAtendente('${item.id}')" style="background: rgba(239, 68, 68, 0.05); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);">👤✕ Desatribuir</button>
                ` : ''}

                <button class="btn-action btn-delete" onclick="excluirPedido('${item.id}')" style="flex: none; width: auto; min-width: 44px; padding: 10px;">🗑️</button>
            </div>
        `;
        return div;
    }

    // --- SESSOES DE FICHA DE ATENDIMENTO ---

    window.abrirFichaAtendimento = async function(id) {
        pacienteAtualFichaId = id;
        const modal = document.getElementById('modalFicha');
        modal.style.display = 'block';
        
        document.getElementById('fichaInfoPaciente').innerHTML = 'Carregando dados...';
        document.getElementById('fichaHistoricoSessoes').innerHTML = '';
        document.getElementById('txtSintomasOrientacoes').value = '';
        document.getElementById('chkTratFluidico').checked = false;
        document.getElementById('chkTratEspiritual').checked = false;

        try {
            // Detalhes do necessitado
            const { data: paciente, error } = await db.from('app_atendimento_fraterno').select('*').eq('id', id).single();
            if (error) throw error;

            document.getElementById('fichaInfoPaciente').innerHTML = `
                <strong>Nome:</strong> ${paciente.nome_completo.toUpperCase()}<br>
                <strong>Nascimento:</strong> ${paciente.data_nascimento ? paciente.data_nascimento.split('-').reverse().join('/') : '-'}<br>
                <strong>Telefone:</strong> ${paciente.telefone || '-'}
            `;

            // Histórico de sessões anteriores
            const { data: sessoes, error: errSess } = await db.from('app_atendimento_sessoes')
                .select('*, pessoas!atendente_id(nome_completo)')
                .eq('atendimento_id', id)
                .order('data', { ascending: false })
                .limit(4);

            if (errSess) throw errSess;

            const histContainer = document.getElementById('fichaHistoricoSessoes');
            if (sessoes && sessoes.length > 0) {
                sessoes.forEach((s, idx) => {
                    const dt = new Date(s.data).toLocaleDateString('pt-BR');
                    const sessCard = document.createElement('div');
                    sessCard.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 10px; font-size: 13px;';
                    sessCard.innerHTML = `
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-weight:bold; color:var(--text-main);">
                            <span>Sessão de ${dt}</span>
                            <span style="color:var(--primary); font-size:11px;">Atendente: ${s.pessoas?.nome_completo || 'N/A'}</span>
                        </div>
                        <div style="color:var(--text-muted); line-height:1.4; white-space:pre-wrap;">${s.sintomas_orientacoes}</div>
                    `;
                    histContainer.appendChild(sessCard);
                });
            } else {
                histContainer.innerHTML = '<div style="font-size:12px; color:var(--text-muted); font-style:italic;">Nenhuma sessão anterior gravada.</div>';
            }

            // Verificar se já possui tratamentos ativos prescritos
            const { data: trats } = await db.from('app_atendimento_tratamentos').select('tipo').eq('atendimento_id', id).eq('status', 'Ativo');
            if (trats) {
                trats.forEach(t => {
                    if (t.tipo === 'Fluídico') document.getElementById('chkTratFluidico').checked = true;
                    if (t.tipo === 'Espiritual') document.getElementById('chkTratEspiritual').checked = true;
                });
            }

        } catch(e) {
            Swal.fire('Erro', 'Erro ao abrir a ficha: ' + e.message, 'error');
            fecharModalFicha();
        }
    };

    window.fecharModalFicha = function() {
        document.getElementById('modalFicha').style.display = 'none';
        pacienteAtualFichaId = null;
    };

    window.salvarFichaAtendimento = async function() {
        if (!pacienteAtualFichaId) return;

        const anotacoes = document.getElementById('txtSintomasOrientacoes').value.trim();
        const querFluidico = document.getElementById('chkTratFluidico').checked;
        const querEspiritual = document.getElementById('chkTratEspiritual').checked;

        if (!anotacoes) {
            Swal.fire('Aviso', 'Por favor, preencha os sintomas/orientações da sessão.', 'warning');
            return;
        }

        try {
            // Obter o usuário logado para associar como atendente_id
            const { data: { session } } = await db.auth.getSession();
            let atendenteId = null;
            if (session && session.user && session.user.email) {
                const { data: pessoa } = await db.from('pessoas').select('id').eq('email', session.user.email).single();
                if (pessoa) atendenteId = pessoa.id;
            }

            // 1. Gravar na tabela de sessões
            const { error: errSess } = await db.from('app_atendimento_sessoes').insert([{
                atendimento_id: pacienteAtualFichaId,
                data: new Date().toISOString().split('T')[0],
                atendente_id: atendenteId,
                sintomas_orientacoes: anotacoes
            }]);
            if (errSess) throw errSess;

            // 2. Tratar a prescrição dos tratamentos (Fluídico)
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
            } else {
                // Se desmarcou, suspender
                await db.from('app_atendimento_tratamentos').update({ status: 'Suspenso' }).eq('atendimento_id', pacienteAtualFichaId).eq('tipo', 'Fluídico').eq('status', 'Ativo');
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
            } else {
                // Se desmarcou, suspender
                await db.from('app_atendimento_tratamentos').update({ status: 'Suspenso' }).eq('atendimento_id', pacienteAtualFichaId).eq('tipo', 'Espiritual').eq('status', 'Ativo');
            }

            // 4. Atualizar o status geral do atendimento fraterno
            const novoStatus = (querFluidico || querEspiritual) ? 'Em Tratamento' : 'Atendido';
            const { error: errAtend } = await db.from('app_atendimento_fraterno').update({
                status: novoStatus,
                data_hora_atendimento: new Date().toISOString()
            }).eq('id', pacienteAtualFichaId);
            if (errAtend) throw errAtend;

            Swal.fire('Sucesso!', 'Atendimento fraterno registrado com sucesso.', 'success');
            fecharModalFicha();
            carregarLista();

        } catch(e) {
            Swal.fire('Erro!', 'Falha ao salvar atendimento: ' + e.message, 'error');
        }
    };

    // --- GESTÃO DE TRATAMENTOS ATIVOS ---

    async function carregarTratamentosAtivos() {
        const container = document.getElementById('listaAtendimento');
        container.innerHTML = '';

        try {
            const { data: trats, error } = await db.from('app_atendimento_tratamentos')
                .select('*, app_atendimento_fraterno(nome_completo, telefone)')
                .eq('status', 'Ativo')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!trats || trats.length === 0) {
                container.innerHTML = '<div class="empty-state">Nenhum tratamento ativo no momento.</div>';
                return;
            }

            trats.forEach(t => {
                const card = document.createElement('div');
                card.className = 'card-atendimento';
                card.style.marginBottom = '12px';
                
                const dtInicio = new Date(t.data_inicio).toLocaleDateString('pt-BR');
                const tipoCor = t.tipo === 'Espiritual' ? '#818cf8' : '#10b981';

                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-size:15px; font-weight:600; color:white;">${t.app_atendimento_fraterno?.nome_completo.toUpperCase()}</span>
                        <span style="font-size:11px; font-weight:600; padding:2px 8px; border-radius:12px; background:${tipoCor}22; color:${tipoCor}; border:1px solid ${tipoCor}44;">${t.tipo}</span>
                    </div>
                    <div class="card-info"><strong>Início em:</strong> ${dtInicio}</div>
                    <div class="card-info"><strong>WhatsApp:</strong> ${t.app_atendimento_fraterno?.telefone || '-'}</div>

                    <div style="margin-top:12px; display:flex; gap:8px;">
                        <button onclick="mudarStatusTratamento('${t.id}', 'Concluído')" class="btn-action" style="background:rgba(16,185,129,0.1); color:#10b981; border:1px solid rgba(16,185,129,0.2);">Concluir</button>
                        <button onclick="mudarStatusTratamento('${t.id}', 'Suspenso')" class="btn-action" style="background:rgba(239,68,68,0.1); color:#ef4444; border:1px solid rgba(239,68,68,0.2);">Suspender</button>
                    </div>
                `;
                container.appendChild(card);
            });
        } catch (e) {
            container.innerHTML = `<div class="empty-state">Erro: ${e.message}</div>`;
        }
    }

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

    // --- FILA DE PRESENÇAS (TERÇAS E QUINTAS) ---

    async function carregarFilaPresencas() {
        const container = document.getElementById('listaAtendimento');
        container.innerHTML = '';

        try {
            // Obter tratamentos ativos com detalhes do necessitado
            const { data: trats, error } = await db.from('app_atendimento_tratamentos')
                .select('*, app_atendimento_fraterno(nome_completo, status)')
                .eq('status', 'Ativo');

            if (error) throw error;

            if (!trats || trats.length === 0) {
                container.innerHTML = '<div class="empty-state">Nenhum necessitado em tratamento ativo para assinar presença.</div>';
                return;
            }

            // Ordenar por nome
            trats.sort((a,b) => (a.app_atendimento_fraterno?.nome_completo || '').localeCompare(b.app_atendimento_fraterno?.nome_completo || ''));

            trats.forEach(t => {
                const card = document.createElement('div');
                card.className = 'card-atendimento';
                card.style.marginBottom = '12px';
                
                const badgeColor = t.tipo === 'Espiritual' ? '#818cf8' : '#10b981';

                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-size:15px; font-weight:600; color:white;">${t.app_atendimento_fraterno?.nome_completo.toUpperCase()}</span>
                        <span style="font-size:11px; font-weight:600; padding:2px 8px; border-radius:12px; background:${badgeColor}22; color:${badgeColor}; border:1px solid ${badgeColor}44;">${t.tipo}</span>
                    </div>
                    
                    <div style="margin-top:12px;">
                        ${t.tipo === 'Fluídico' ? `
                            <button onclick="registrarPresencaFluidico('${t.id}')" class="btn-action" style="background:#10b981; color:white; border:none; width:100%; padding:10px;">🟢 Confirmar Presença</button>
                        ` : `
                            <button onclick="registrarPresencaEspiritual('${t.id}')" class="btn-action" style="background:#818cf8; color:white; border:none; width:100%; padding:10px;">✨ Registrar Presença + Obs</button>
                        `}
                    </div>
                `;
                container.appendChild(card);
            });

        } catch(e) {
            container.innerHTML = `<div class="empty-state">Erro: ${e.message}</div>`;
        }
    }

    window.registrarPresencaFluidico = async function(tratamentoId) {
        try {
            const dataHoje = new Date().toISOString().split('T')[0];

            // Evitar duplicidade no mesmo dia
            const { data: exist } = await db.from('app_atendimento_presencas')
                .select('id')
                .eq('tratamento_id', tratamentoId)
                .eq('data', dataHoje);

            if (exist && exist.length > 0) {
                Swal.fire('Aviso', 'Presença de hoje para este paciente já foi registrada.', 'info');
                return;
            }

            const { error } = await db.from('app_atendimento_presencas').insert([{
                tratamento_id: tratamentoId,
                data: dataHoje
            }]);

            if (error) throw error;

            Swal.fire({
                icon: 'success',
                title: 'Confirmado!',
                text: 'Presença fluídica registrada.',
                timer: 1500,
                showConfirmButton: false
            });

        } catch(e) {
            Swal.fire('Erro', 'Falha ao registrar presença.', 'error');
        }
    };

    window.registrarPresencaEspiritual = async function(tratamentoId) {
        const dataHoje = new Date().toISOString().split('T')[0];

        const { value: formValues } = await Swal.fire({
            title: '✨ Detalhes da Sessão Espiritual',
            background: 'var(--bg-panel)',
            color: 'white',
            html: `
                <div style="text-align:left; margin-bottom:8px; font-size:13px; color:var(--text-muted);">Data:</div>
                <input type="date" id="presData" class="swal2-input" value="${dataHoje}" style="background:var(--bg-dark); color:white; border-color:var(--border); width:90%; margin-top:0; margin-bottom:12px;">
                <div style="text-align:left; margin-bottom:8px; font-size:13px; color:var(--text-muted);">Observações / Recomendações:</div>
                <textarea id="presObs" class="swal2-textarea" placeholder="Como o paciente se sentiu, recomendações da equipe..." style="background:var(--bg-dark); color:white; border-color:var(--border); width:90%; height:80px; resize:none;"></textarea>
            `,
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#818cf8',
            confirmButtonText: 'Gravar Presença',
            preConfirm: () => {
                return {
                    data: document.getElementById('presData').value,
                    obs: document.getElementById('presObs').value
                };
            }
        });

        if (formValues) {
            try {
                const { error } = await db.from('app_atendimento_presencas').insert([{
                    tratamento_id: tratamentoId,
                    data: formValues.data,
                    observacoes: formValues.obs
                }]);

                if (error) throw error;

                Swal.fire('Sucesso!', 'Presença e observações gravadas.', 'success');
            } catch(e) {
                Swal.fire('Erro', 'Erro ao gravar presença espiritual.', 'error');
            }
        }
    };

    // --- PAINEL SEMANAL DE ACOMPANHAMENTO ---

    async function carregarPainelSemanal() {
        const container = document.getElementById('listaAtendimento');
        container.innerHTML = '<div class="empty-state">Gerando painel semanal...</div>';

        try {
            // Obter tratamentos ativos
            const { data: trats, error } = await db.from('app_atendimento_tratamentos')
                .select('*, app_atendimento_fraterno(nome_completo)')
                .eq('status', 'Ativo');

            if (error) throw error;

            if (!trats || trats.length === 0) {
                container.innerHTML = '<div class="empty-state">Nenhum necessitado em tratamento ativo nesta semana.</div>';
                return;
            }

            // Obter presenças para calcular estatísticas
            const { data: pres, error: errPres } = await db.from('app_atendimento_presencas').select('*');
            if (errPres) throw errPres;

            // Mapear número de presenças por tratamento
            const presCount = {};
            const ultimasPres = {};

            pres.forEach(p => {
                presCount[p.tratamento_id] = (presCount[p.tratamento_id] || 0) + 1;
                
                // Salvar data mais recente
                const dataVal = new Date(p.data);
                if (!ultimasPres[p.tratamento_id] || dataVal > new Date(ultimasPres[p.tratamento_id])) {
                    ultimasPres[p.tratamento_id] = p.data;
                }
            });

            container.innerHTML = `
                <div style="background:rgba(255,255,255,0.01); border:1px solid var(--border); border-radius:12px; padding:12px; margin-bottom:16px;">
                    <h3 style="font-size:14px; font-weight:600; margin-bottom:4px; color:white;">📅 Organização das Sessões</h3>
                    <p style="color:var(--text-muted); font-size:12px; line-height:1.4; margin:0;">
                        Pacientes em tratamento ativo divididos por categoria. O acompanhamento padrão sugerido é de 4 semanas.
                    </p>
                </div>
            `;

            // Separar em Fluídico e Espiritual
            const fluidicos = trats.filter(t => t.tipo === 'Fluídico');
            const espirituais = trats.filter(t => t.tipo === 'Espiritual');

            // Renderizar bloco Fluídico
            if (fluidicos.length > 0) {
                const header = document.createElement('div');
                header.style.cssText = 'font-weight: bold; color: #10b981; font-size: 14px; margin-top: 10px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;';
                header.innerHTML = `💧 Tratamento Fluídico (${fluidicos.length})`;
                container.appendChild(header);

                fluidicos.forEach(f => {
                    const count = presCount[f.id] || 0;
                    const uData = ultimasPres[f.id] ? new Date(ultimasPres[f.id]).toLocaleDateString('pt-BR') : 'Nenhuma';
                    
                    const card = document.createElement('div');
                    card.style.cssText = 'background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:12px; padding:10px; margin-bottom:8px; font-size:13px;';
                    card.innerHTML = `
                        <div style="font-weight:bold; color:white; margin-bottom:4px;">${f.app_atendimento_fraterno?.nome_completo.toUpperCase()}</div>
                        <div style="display:flex; justify-content:space-between; color:var(--text-muted);">
                            <span>Realizados: <strong>${count} de 4</strong></span>
                            <span>Último: <strong>${uData}</strong></span>
                        </div>
                        <div style="width:100%; height:6px; background:rgba(255,255,255,0.05); border-radius:3px; margin-top:8px; overflow:hidden;">
                            <div style="width:${Math.min((count / 4) * 100, 100)}%; height:100%; background:#10b981; border-radius:3px;"></div>
                        </div>
                    `;
                    container.appendChild(card);
                });
            }

            // Renderizar bloco Espiritual
            if (espirituais.length > 0) {
                const header = document.createElement('div');
                header.style.cssText = 'font-weight: bold; color: #818cf8; font-size: 14px; margin-top: 18px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;';
                header.innerHTML = `✨ Tratamento Energético / Espiritual (${espirituais.length})`;
                container.appendChild(header);

                espirituais.forEach(e => {
                    const count = presCount[e.id] || 0;
                    const uData = ultimasPres[e.id] ? new Date(ultimasPres[e.id]).toLocaleDateString('pt-BR') : 'Nenhuma';
                    
                    const card = document.createElement('div');
                    card.style.cssText = 'background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:12px; padding:10px; margin-bottom:8px; font-size:13px;';
                    card.innerHTML = `
                        <div style="font-weight:bold; color:white; margin-bottom:4px;">${e.app_atendimento_fraterno?.nome_completo.toUpperCase()}</div>
                        <div style="display:flex; justify-content:space-between; color:var(--text-muted);">
                            <span>Presenças: <strong>${count}</strong></span>
                            <span>Último: <strong>${uData}</strong></span>
                        </div>
                    `;
                    container.appendChild(card);
                });
            }

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

    window.abrirTriagem = async function(id) {
        try {
            const { data, error } = await db
                .from('pessoas')
                .select('id, nome_completo')
                .contains('papeis', ['Atendente Fraterno']);

            if (error) throw error;

            if (!data || data.length === 0) {
                Swal.fire('Aviso', 'Nenhum voluntário cadastrado como Atendente Fraterno.', 'warning');
                return;
            }

            data.sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));

            const options = {};
            data.forEach(p => {
                options[p.id] = p.nome_completo;
            });

            const { value: atendenteId } = await Swal.fire({
                title: '🤝 Selecione o Atendente',
                input: 'select',
                inputOptions: options,
                inputPlaceholder: 'Escolha um atendente...',
                showCancelButton: true,
                cancelButtonText: 'Cancelar',
                confirmButtonColor: 'var(--primary)',
                background: 'var(--bg-panel)',
                color: 'var(--text-main)',
                inputValidator: (value) => {
                    return new Promise((resolve) => {
                        if (value) {
                            resolve();
                        } else {
                            resolve('Selecione um atendente!');
                        }
                    });
                }
            });

            if (atendenteId) {
                const { error: updErr } = await db
                    .from('app_atendimento_fraterno')
                    .update({ atendente_id: atendenteId, status: 'Planejado' })
                    .eq('id', id);

                if (updErr) throw updErr;
                Swal.fire('Sucesso!', 'Atendente atribuído.', 'success');
                carregarLista();
            }

        } catch(e) {
            Swal.fire('Erro!', 'Falha na triagem: ' + e.message, 'error');
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
