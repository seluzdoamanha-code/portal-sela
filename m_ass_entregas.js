(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let familiaId = null;

    document.addEventListener('DOMContentLoaded', async () => {
        // Set today's date
        const today = new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000).toISOString().split('T')[0];
        document.getElementById('inpData').value = today;
        
        // Parse URL params
        const urlParams = new URLSearchParams(window.location.search);
        familiaId = urlParams.get('f_id');
        const fNome = urlParams.get('f_nome');
        window.isGlobalFam = urlParams.get('is_global') === '1';
        
        if (familiaId && fNome) {
            document.getElementById('inpFamilia').value = fNome;
        } else {
            document.getElementById('inpFamilia').value = "Erro: Família não selecionada";
        }
        
        document.getElementById('btnVoltar').addEventListener('click', () => {
            window.history.back();
        });
        
        document.getElementById('btnSalvar').addEventListener('click', salvarEntrega);
        
        await carregarModelos();
    });

    async function carregarModelos() {
        const sel = document.getElementById('inpModelo');
        try {
            const { data, error } = await db.from('ass_cestas_modelos')
                .select('id, codigo, tipo')
                .eq('status', 'Ativo')
                .order('tipo');
                
            if (error) throw error;
            
            sel.innerHTML = '';
            if (data && data.length > 0) {
                data.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.id;
                    opt.innerText = (m.codigo ? m.codigo + ' - ' : '') + m.tipo;
                    sel.appendChild(opt);
                });
            } else {
                sel.innerHTML = '<option value="">Nenhum modelo cadastrado</option>';
            }
        } catch (e) {
            console.error('Erro modelos', e);
            sel.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }

    async function salvarEntrega() {
        if (!familiaId) {
            mostrarFeed('Erro: Família não identificada', true);
            return;
        }
        
        const dataEnt = document.getElementById('inpData').value;
        const modeloId = document.getElementById('inpModelo').value;
        const qtd = parseInt(document.getElementById('inpQtd').value) || 1;
        const obs = document.getElementById('inpObs').value.trim();
        
        if (!dataEnt || !modeloId) {
            mostrarFeed('Preencha a data e o tipo de cesta', true);
            return;
        }
        
        const btn = document.getElementById('btnSalvar');
        btn.disabled = true;
        btn.innerText = 'Salvando...';
        
        try {
            const [ano, mes] = dataEnt.split('-');
            
            // 1. Inserir a entrega
            
            const payload = {
                cesta_id: modeloId,
                data_entrega: dataEnt,
                ano_ref: parseInt(ano),
                mes_ref: parseInt(mes),
                quantidade_entregue: qtd,
                observacoes: obs
            };
            if (window.isGlobalFam) {
                payload.pessoa_id = familiaId;
            } else {
                payload.familia_id = familiaId;
            }
            const { error } = await db.from('ass_entregas').insert([payload]);

            
            if (error) throw error;
            
            // 2. Dar baixa no estoque
            const { data: composicao } = await db.from('ass_cesta_composicao').select('item_id, quantidade').eq('cesta_id', modeloId);
            if (composicao) {
                for (let c of composicao) {
                    const qtdGasta = c.quantidade * qtd;
                    const { data: item } = await db.from('ass_itens_cesta').select('estoque_atual').eq('id', c.item_id).single();
                    if (item) {
                        await db.from('ass_itens_cesta').update({estoque_atual: item.estoque_atual - qtdGasta}).eq('id', c.item_id);
                    }
                }
            }
            
            mostrarFeed('Entrega registrada com sucesso!');
            
            setTimeout(() => {
                const params = new URLSearchParams(window.location.search);
                if (params.get('from') === 'dash') {
                    window.history.back();
                } else {
                    window.location.href = 'm_ass_familias.html?open_id=' + familiaId;
                }
            }, 1000);
            
        } catch (e) {
            console.error(e);
            mostrarFeed('Erro ao salvar. Tente novamente.', true);
            btn.disabled = false;
            btn.innerText = 'Salvar Entrega';
        }
    }

    function mostrarFeed(msg, isError = false) {
        const d = document.getElementById('mFeedback');
        d.style.color = isError ? '#ef4444' : '#10b981';
        d.innerText = msg;
        setTimeout(() => d.innerText = '', 4000);
    }
})();
