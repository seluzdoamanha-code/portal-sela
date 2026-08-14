(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let estruturaId = null;
    let abaAtual = 'fila';

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

        try {
            let query = db.from('app_atendimento_fraterno').select('*, pessoas!atendente_id(id, nome_completo)');

            if (abaAtual === 'fila') {
                query = query.neq('status', 'Atendido').order('nome_completo', { ascending: true });
            } else if (abaAtual === 'espera') {
                query = query.eq('presente', true).is('atendente_id', null).neq('status', 'Atendido').order('nome_completo', { ascending: true });
            } else if (abaAtual === 'andamento') {
                query = query.eq('presente', true).not('atendente_id', 'is', null).neq('status', 'Atendido');
            } else {
                query = query.eq('status', 'Atendido');
            }

            let { data, error } = await query;
            if (error) throw error;

            // Month filtering for month/history tabs
            const now = new Date();
            const curYear = now.getFullYear();
            const curMonth = now.getMonth();

            if (abaAtual === 'mes') {
                data = data.filter(item => {
                    if (!item.data_hora_atendimento) return false;
                    const d = new Date(item.data_hora_atendimento);
                    return d.getFullYear() === curYear && d.getMonth() === curMonth;
                });
            } else if (abaAtual === 'historico') {
                data = data.filter(item => {
                    if (!item.data_hora_atendimento) return true;
                    const d = new Date(item.data_hora_atendimento);
                    return !(d.getFullYear() === curYear && d.getMonth() === curMonth);
                });
            }

            if (!data || data.length === 0) {
                container.innerHTML = '<div class="empty-state">Nenhum registro encontrado.</div>';
                return;
            }

            // Render list
            container.innerHTML = '';
            
            if (abaAtual === 'andamento') {
                // Sort by attendant then by name
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
            } else if (abaAtual === 'mes' || abaAtual === 'historico') {
                // Group by month/year
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
            } else {
                data.forEach(item => {
                    container.appendChild(criarCardElement(item));
                });
            }

        } catch (e) {
            console.error("Erro ao carregar dados:", e);
            container.innerHTML = '<div class="empty-state" style="color:var(--danger);">Erro ao carregar dados.</div>';
        }
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
                    <button class="btn-action" onclick="concluirAtendimento('${item.id}')" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">✅ Concluir</button>
                ` : ''}

                ${item.status === 'Planejado' ? `
                    <button class="btn-action" onclick="desatribuirAtendente('${item.id}')" style="background: rgba(239, 68, 68, 0.05); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);">👤✕ Desatribuir</button>
                ` : ''}

                <button class="btn-action btn-delete" onclick="excluirPedido('${item.id}')" style="flex: none; width: auto; min-width: 44px; padding: 10px;">🗑️</button>
            </div>
        `;
        return div;
    }

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
            // Get attendants
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

    window.concluirAtendimento = async function(id) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        const localDateTime = now.toISOString().slice(0, 16);

        const { value: dataHora } = await Swal.fire({
            title: '✅ Confirmar Data/Hora',
            html: `<input type="datetime-local" id="swalDataHora" value="${localDateTime}" class="swal2-input" style="background:var(--bg-panel); color:white; border-color:var(--border);">`,
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Confirmar Atendimento',
            background: 'var(--bg-panel)',
            color: 'var(--text-main)',
            preConfirm: () => {
                const val = document.getElementById('swalDataHora').value;
                if (!val) {
                    Swal.showValidationMessage('Informe a data e hora!');
                }
                return val;
            }
        });

        if (dataHora) {
            try {
                const { error } = await db.from('app_atendimento_fraterno').update({
                    status: 'Atendido',
                    data_hora_atendimento: new Date(dataHora).toISOString()
                }).eq('id', id);

                if (error) throw error;
                Swal.fire('Concluído!', 'Atendimento registrado no histórico.', 'success');
                carregarLista();
            } catch(e) {
                Swal.fire('Erro!', 'Falha ao concluir atendimento.', 'error');
            }
        }
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
