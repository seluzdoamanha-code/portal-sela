(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let familiaId = null;

    document.addEventListener('DOMContentLoaded', async () => {
        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('inpData').value = today;
        
        // Auto-generate code
        const timestamp = new Date().getTime().toString().slice(-4);
        document.getElementById('inpCodigo').value = 'RO' + timestamp;
        
        // Parse URL params
        const urlParams = new URLSearchParams(window.location.search);
        familiaId = urlParams.get('f_id');
        const fNome = urlParams.get('f_nome');
        
        if (familiaId && fNome) {
            document.getElementById('inpFamilia').value = fNome;
        } else {
            document.getElementById('inpFamilia').value = "Erro: Família não selecionada";
        }
        
        document.getElementById('btnVoltar').addEventListener('click', () => {
            window.history.back();
        });
        
        document.getElementById('btnSalvar').addEventListener('click', salvarOcorrencia);
    });

    async function salvarOcorrencia() {
        if (!familiaId) {
            mostrarFeed('Erro: Família não identificada', true);
            return;
        }
        
        const dataOco = document.getElementById('inpData').value;
        const codigo = document.getElementById('inpCodigo').value.trim();
        const tipo = document.getElementById('inpTipo').value;
        const obs = document.getElementById('inpObs').value.trim();
        
        if (!dataOco || !codigo || !obs) {
            mostrarFeed('Preencha a data, o código RO e a observação', true);
            return;
        }
        
        const btn = document.getElementById('btnSalvar');
        btn.disabled = true;
        btn.innerText = 'Salvando...';
        
        try {
            const { error } = await db.from('ass_ocorrencias').insert([{
                pessoa_id: familiaId,
                data_ocorrencia: dataOco,
                codigo: codigo,
                tipo: tipo,
                observacao: obs
            }]);
            
            if (error) throw error;
            
            mostrarFeed('Ocorrência registrada com sucesso!');
            
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
            if (e.code === '23505') {
                mostrarFeed('Erro: Já existe uma ocorrência com este Código (RO).', true);
            } else {
                mostrarFeed('Erro ao salvar. Tente novamente.', true);
            }
            btn.disabled = false;
            btn.innerText = 'Salvar Ocorrência';
        }
    }

    function mostrarFeed(msg, isError = false) {
        const d = document.getElementById('divFeedback');
        d.className = 'm-feedback ' + (isError ? 'error' : 'success');
        d.innerText = msg;
    }
})();
