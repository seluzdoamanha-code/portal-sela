(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    Chart.defaults.color = 'rgba(255, 255, 255, 0.6)';
    Chart.defaults.font.family = "'Inter', sans-serif";

    async function init() {
        try {
            // Data atual
            const hoje = new Date();
            const mesAtual = hoje.getMonth() + 1;
            const anoAtual = hoje.getFullYear();

            // 1. Famílias Ativas
            const { count: countFam } = await db.from('ass_familias').select('*', { count: 'exact', head: true }).eq('status', 'Ativa');
            document.getElementById('valFamilias').innerText = countFam || 0;

            // 2. Entregas no Mês
            const { count: countEnt } = await db.from('ass_entregas').select('*', { count: 'exact', head: true })
                .eq('ano_ref', anoAtual)
                .eq('mes_ref', mesAtual);
            document.getElementById('valCestasMes').innerText = countEnt || 0;

            // 3. Novos Cadastros (Criados neste mês) - Assumindo que created_at existe
            const dataInicioMes = new Date(anoAtual, mesAtual - 1, 1).toISOString();
            const { count: countNovos } = await db.from('ass_familias').select('*', { count: 'exact', head: true })
                .gte('created_at', dataInicioMes);
            document.getElementById('valNovos').innerText = countNovos || 0;

            // 4. Ocorrências no Mês
            const { count: countOco } = await db.from('ass_ocorrencias').select('*', { count: 'exact', head: true })
                .gte('data_ocorrencia', dataInicioMes.split('T')[0]);
            document.getElementById('valOcorrencias').innerText = countOco || 0;

            // Gráfico 1: Entregas por Mês (Ano Atual)
            await renderChartEntregas(anoAtual);

            // Gráfico 2: Status das Famílias
            await renderChartDemografia();

        } catch (e) {
            console.error("Erro ao carregar estatísticas:", e);
        }
    }

    async function renderChartEntregas(ano) {
        const { data } = await db.from('ass_entregas').select('mes_ref').eq('ano_ref', ano);
        const contagem = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0, 10:0, 11:0, 12:0};
        
        if (data) {
            data.forEach(d => contagem[d.mes_ref]++);
        }

        const ctx = document.getElementById('chartEntregas').getContext('2d');
        
        // Criar gradiente
        let gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.8)');   
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0.8)');

        if(window.chartEntregasMobileInstance) window.chartEntregasMobileInstance.destroy();
        window.chartEntregasMobileInstance = if(window.chartDemografiaMobileInstance) window.chartDemografiaMobileInstance.destroy();
        window.chartDemografiaMobileInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                datasets: [{
                    label: 'Entregas',
                    data: Object.values(contagem),
                    backgroundColor: gradient,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    async function renderChartDemografia() {
        const { data } = await db.from('ass_familias').select('status');
        let ativa = 0, inativa = 0, triagem = 0;
        
        if (data) {
            data.forEach(f => {
                if(f.status === 'Ativa') ativa++;
                else if(f.status === 'Inativa') inativa++;
                else if(f.status === 'Triagem') triagem++;
            });
        }

        const ctx = document.getElementById('chartDemografia').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Ativa', 'Inativa', 'Triagem'],
                datasets: [{
                    data: [ativa, inativa, triagem],
                    backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.7)', padding: 20 } }
                }
            }
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
