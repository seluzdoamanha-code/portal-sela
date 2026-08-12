(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let estruturaId = null;
    let abaAtual = 'pendentes';

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

        // Tabs
        const tabs = document.querySelectorAll('.m-tab');
        tabs.forEach(t => {
            t.addEventListener('click', () => {
                tabs.forEach(x => x.classList.remove('active'));
                t.classList.add('active');
                abaAtual = t.dataset.tab;
                
                if (abaAtual === 'pendentes') {
                    document.getElementById('listaPendentes').style.display = 'flex';
                    document.getElementById('listaAtendidos').style.display = 'none';
                } else {
                    document.getElementById('listaPendentes').style.display = 'none';
                    document.getElementById('listaAtendidos').style.display = 'flex';
                }
            });
        });

        carregarLista();
    });

    async function carregarLista() {
        const containerP = document.getElementById('listaPendentes');
        const containerA = document.getElementById('listaAtendidos');
        
        containerP.innerHTML = '<div class="empty-state">Carregando...</div>';
        containerA.innerHTML = '<div class="empty-state">Carregando...</div>';

        try {
            const { data, error } = await db
                .from('app_atendimento_fraterno')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            let htmlPendentes = '';
            let htmlAtendidos = '';
            let qtPendentes = 0;
            let qtAtendidos = 0;

            if (data) {
                data.forEach(item => {
                    const dataCriacao = new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
                    
                    // Formatar data de nascimento para calcular idade
                    let nascimentoInfo = 'Não informada';
                    if (item.data_nascimento) {
                        const nascAno = item.data_nascimento.split('-')[0];
                        const anoAtual = new Date().getFullYear();
                        nascimentoInfo = `${item.data_nascimento.split('-').reverse().join('/')} (${anoAtual - parseInt(nascAno)} anos)`;
                    }

                    const isPendente = item.status !== 'Atendido';

                    const card = `
                        <div class="card-atendimento">
                            <div class="card-header">
                                <div>
                                    <div class="card-title">${item.nome_completo || 'Sem Nome'}</div>
                                    <div class="card-date">Criado em: ${dataCriacao}</div>
                                </div>
                                <div class="status-badge ${isPendente ? 'status-pendente' : 'status-atendido'}">
                                    ${item.status || 'Pendente'}
                                </div>
                            </div>
                            
                            <div class="card-info"><strong>Endereço:</strong> ${item.endereco_completo || '-'}</div>
                            <div class="card-info"><strong>Nascimento:</strong> ${nascimentoInfo}</div>
                            <div class="card-info"><strong>WhatsApp:</strong> 
                                ${item.telefone ? `<a href="https://wa.me/55${item.telefone.replace(/\D/g, '')}" target="_blank" style="color:var(--primary); text-decoration:none;">${item.telefone}</a>` : '-'}
                            </div>

                            <div class="card-actions">
                                ${isPendente ? `
                                    <button class="btn-action btn-mark" onclick="marcarAtendido('${item.id}')">Marcar Atendido</button>
                                ` : ''}
                                <button class="btn-action btn-delete" onclick="excluirPedido('${item.id}')">Excluir</button>
                            </div>
                        </div>
                    `;

                    if (isPendente) {
                        htmlPendentes += card;
                        qtPendentes++;
                    } else {
                        htmlAtendidos += card;
                        qtAtendidos++;
                    }
                });
            }

            containerP.innerHTML = qtPendentes > 0 ? htmlPendentes : '<div class="empty-state">Nenhum pedido pendente.</div>';
            containerA.innerHTML = qtAtendidos > 0 ? htmlAtendidos : '<div class="empty-state">Nenhum pedido atendido ainda.</div>';

        } catch (e) {
            console.error("Erro:", e);
            containerP.innerHTML = '<div class="empty-state" style="color:var(--danger);">Erro ao carregar dados.</div>';
            containerA.innerHTML = '<div class="empty-state" style="color:var(--danger);">Erro ao carregar dados.</div>';
        }
    }

    window.marcarAtendido = async function(id) {
        Swal.fire({
            title: 'Marcar como Atendido?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sim',
            background: 'var(--bg-panel)',
            color: 'var(--text-main)'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const { error } = await db.from('app_atendimento_fraterno').update({ status: 'Atendido' }).eq('id', id);
                    if (error) throw error;
                    carregarLista();
                } catch(e) {
                    Swal.fire('Erro!', 'Falha ao atualizar.', 'error');
                }
            }
        });
    }

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
    }
})();
