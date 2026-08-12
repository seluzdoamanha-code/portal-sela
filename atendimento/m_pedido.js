(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let estruturaId = null;

    document.addEventListener('DOMContentLoaded', () => {
        const urlParams = new URLSearchParams(window.location.search);
        estruturaId = urlParams.get('id');

        document.getElementById('btnVoltar').addEventListener('click', () => {
            if (estruturaId) {
                window.location.href = `../m_hub.html?id=${estruturaId}&tipo=atendimento`;
            } else {
                window.history.back();
            }
        });

        const form = document.getElementById('formAtendimento');
        form.addEventListener('submit', salvarAtendimento);

        // Setup Autocomplete
        setupAutocomplete();
    });

    async function setupAutocomplete() {
        const inNome = document.getElementById('inNome');
        const listaSugestoes = document.getElementById('listaSugestoes');

        try {
            // Pegar últimos cadastros para base do autocomplete
            let { data } = await db.from('app_atendimento_fraterno').select('nome_completo, endereco_completo, data_nascimento, telefone').order('created_at', { ascending: false }).limit(200);
            
            if (data) {
                window.sugestoes = {};
                data.forEach(item => {
                    if (item.nome_completo) {
                        const n = item.nome_completo.toUpperCase();
                        if (!window.sugestoes[n]) {
                            window.sugestoes[n] = item;
                        }
                    }
                });
            }

            inNome.addEventListener('input', (e) => {
                const val = e.target.value.toUpperCase();
                if (val.length < 3) {
                    listaSugestoes.style.display = 'none';
                    return;
                }

                let matches = Object.keys(window.sugestoes || {}).filter(k => k.includes(val)).slice(0, 5);
                
                if (matches.length > 0) {
                    listaSugestoes.innerHTML = matches.map(m => `<div class="m-autocomplete-item">${m}</div>`).join('');
                    listaSugestoes.style.display = 'block';
                    
                    const items = listaSugestoes.querySelectorAll('.m-autocomplete-item');
                    items.forEach(item => {
                        item.addEventListener('click', () => {
                            const nomeSelecionado = item.innerText;
                            inNome.value = nomeSelecionado;
                            const dados = window.sugestoes[nomeSelecionado];
                            if (dados) {
                                document.getElementById('inEndereco').value = dados.endereco_completo || '';
                                document.getElementById('inNascimento').value = dados.data_nascimento || '';
                                document.getElementById('inTelefone').value = dados.telefone || '';
                            }
                            listaSugestoes.style.display = 'none';
                        });
                    });
                } else {
                    listaSugestoes.style.display = 'none';
                }
            });

            document.addEventListener('click', (e) => {
                if (e.target !== inNome && e.target !== listaSugestoes) {
                    listaSugestoes.style.display = 'none';
                }
            });

        } catch (e) {
            console.error("Erro no autocomplete:", e);
        }
    }

    async function salvarAtendimento(e) {
        e.preventDefault();

        const btnSalvar = document.getElementById('btnSalvar');
        btnSalvar.disabled = true;
        btnSalvar.innerText = 'Salvando...';

        const nome = document.getElementById('inNome').value.trim();
        const endereco = document.getElementById('inEndereco').value.trim();
        const nascimento = document.getElementById('inNascimento').value;
        const telefone = document.getElementById('inTelefone').value.trim();

        try {
            const { error } = await db.from('app_atendimento_fraterno').insert([{
                nome_completo: nome,
                endereco_completo: endereco,
                data_nascimento: nascimento,
                telefone: telefone,
                status: 'Pendente'
            }]);

            if (error) throw error;

            Swal.fire({
                toast: true,
                position: 'top',
                icon: 'success',
                title: 'Pedido registrado!',
                showConfirmButton: false,
                timer: 2000,
                background: 'var(--bg-panel)',
                color: 'var(--text-main)'
            });

            document.getElementById('formAtendimento').reset();
            
        } catch (error) {
            console.error('Erro ao salvar:', error);
            Swal.fire({
                icon: 'error',
                title: 'Ops...',
                text: 'Não foi possível salvar o pedido.',
                background: 'var(--bg-panel)',
                color: 'var(--text-main)'
            });
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.innerText = 'Cadastrar Pedido';
        }
    }

})();
