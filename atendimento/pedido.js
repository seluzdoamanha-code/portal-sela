(function() {
    // Inicialização do Supabase usando as chaves locais (formulário aberto)
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('formAtendimento');
        form.addEventListener('submit', salvarPedido);
    });

    async function salvarPedido(e) {
        e.preventDefault();

        const btnSalvar = document.getElementById('btnSalvar');
        btnSalvar.disabled = true;
        btnSalvar.innerText = 'Enviando...';

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

            // Mostrar mensagem de sucesso
            document.getElementById('formAtendimento').style.display = 'none';
            document.getElementById('successBox').style.display = 'block';

        } catch (error) {
            console.error('Erro ao salvar solicitação:', error);
            Swal.fire({
                icon: 'error',
                title: 'Ops...',
                text: 'Não foi possível enviar sua solicitação. Tente novamente mais tarde.',
                background: 'var(--bg-card)',
                color: 'var(--text-main)'
            });
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.innerText = 'Solicitar Atendimento';
        }
    }

    window.novaSolicitacao = function() {
        document.getElementById('formAtendimento').reset();
        document.getElementById('successBox').style.display = 'none';
        document.getElementById('formAtendimento').style.display = 'block';
    }
})();
