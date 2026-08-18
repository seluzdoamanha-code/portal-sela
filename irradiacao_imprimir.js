const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const selDia = document.getElementById('selDia');
    selDia.addEventListener('change', carregarLeituras);

    carregarLeituras();
});

async function carregarLeituras() {
    const listaEl = document.getElementById('listaImpressao');
    listaEl.innerHTML = '<div class="empty-state">Carregando leituras...</div>';
    
    const estruturaId = localStorage.getItem('estrutura_atual');
    const diaSelecionado = document.getElementById('selDia').value;
    
    const lblData = document.getElementById('lblData');
    const nomeDia = diaSelecionado ? diaSelecionado : 'Todos os dias';
    
    const hoje = new Date();
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const diaImpressao = diasSemana[hoje.getDay()];
    
    const d = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const semanaNum = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);

    const dataFormatada = hoje.toLocaleDateString('pt-BR');

    lblData.innerText = `Atividade de Irradiação - Leituras para o dia ${nomeDia}/${diaImpressao} (impresso em ${dataFormatada} - semana ${semanaNum})`;

    try {
        let query = db.from('app_irradiacao_solicitacoes')
            .select('*')
            .eq('status', 'ativo')
            .order('nome_solicitado', { ascending: true });

        if (estruturaId) {
            query = query.eq('estrutura_id', estruturaId);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Filtragem manual por dia se selecionado
        let dadosFiltrados = data || [];
        if (diaSelecionado !== '') {
            dadosFiltrados = dadosFiltrados.filter(item => {
                const dias = item.dias_semana || [];
                return dias.includes(diaSelecionado);
            });
        }

        renderLista(dadosFiltrados);

    } catch (error) {
        console.error("Erro ao carregar leituras:", error);
        listaEl.innerHTML = '<div class="empty-state" style="color: red;">Erro ao carregar os dados. Verifique sua conexão.</div>';
    }
}

function renderLista(dados) {
    const listaEl = document.getElementById('listaImpressao');
    
    if (dados.length === 0) {
        listaEl.innerHTML = '<div class="empty-state">Nenhuma leitura encontrada para os filtros selecionados.</div>';
        return;
    }

    let html = '';
    
    dados.forEach(item => {
        const enderecoFull = [item.endereco, item.bairro, item.cidade].filter(Boolean).join(', ');
        
        html += `
            <div class="list-item">
                <div class="checkbox">[&nbsp;&nbsp;]</div>
                <div class="content">
                    <span class="nome">${item.nome_solicitado}</span>
                    ${enderecoFull ? `<span class="endereco">- ${enderecoFull}</span>` : ''}
                </div>
            </div>
        `;
    });

    listaEl.innerHTML = html;
}
