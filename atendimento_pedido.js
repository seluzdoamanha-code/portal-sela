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
            let criadoPor = 'Desconhecido';
            try {
                const profStr = localStorage.getItem('sela_user_profile');
                if (profStr) {
                    const prof = JSON.parse(profStr);
                    criadoPor = prof.nome_curto || (prof.nome || '').trim().split(' ')[0] || 'Desconhecido';
                }
            } catch(e) {}

            let pacienteId = null;
            
            // Tentar match exato por nome e data de nascimento
            if (nascimento) {
                const { data: pes } = await db.from('pessoas')
                    .select('id')
                    .ilike('nome_completo', nome)
                    .eq('data_nascimento', nascimento)
                    .limit(1);
                if (pes && pes.length > 0) pacienteId = pes[0].id;
            }
            
            // Se não achou por data de nascimento, tentar por telefone
            if (!pacienteId && telefone) {
                const { data: pes2 } = await db.from('pessoas')
                    .select('id')
                    .ilike('nome_completo', nome)
                    .eq('celular', telefone)
                    .limit(1);
                if (pes2 && pes2.length > 0) pacienteId = pes2[0].id;
            }

            if (!pacienteId) {
                const { data: usedData } = await db.from('pessoas').select('cpf_cnpj').like('cpf_cnpj', '111111%');
                const usedSet = new Set(usedData ? usedData.map(d => d.cpf_cnpj.replace(/\D/g, '')) : []);
                let fakeCpf = null;
                for (let i = 1; i <= 9999; i++) {
                    const candidate = '111111' + String(i).padStart(5, '0');
                    if (!usedSet.has(candidate)) {
                        fakeCpf = candidate;
                        break;
                    }
                }
                if (!fakeCpf) fakeCpf = '11111199999';

                const { data: novaPessoa, error: errPac } = await db.from('pessoas').insert([{
                    nome_completo: nome,
                    nome_curto: nome.split(' ')[0],
                    celular: telefone,
                    data_nascimento: nascimento || null,
                    endereco: endereco,
                    cpf_cnpj: fakeCpf,
                    cpf_provisorio: true,
                    perfis: ['Paciente'],
                    criado_por: criadoPor
                }]).select('id').single();

                if (errPac) throw errPac;
                pacienteId = novaPessoa.id;
            }

            const { error } = await db.from('app_atendimento_fraterno').insert([{
                paciente_id: pacienteId,
                nome_completo: nome,
                status: 'Pendente',
                criado_por: criadoPor,
                presente: false
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
