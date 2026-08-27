(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    document.addEventListener('DOMContentLoaded', async () => {
        setupMesAtual();
        await loadFamilias();
        await loadMetrics();
        
        document.getElementById('btnNovaEntrega').addEventListener('click', () => {
            const sel = document.getElementById('selFamilia');
            if (sel.value) {
                const fNome = sel.options[sel.selectedIndex].text;
                window.location.href = 'm_ass_entregas.html?f_id=' + sel.value + '&f_nome=' + encodeURIComponent(fNome) + '&is_global=1&from=dash';
            } else {
                alert('Selecione uma família primeiro!');
            }
        });
    });

    function setupMesAtual() {
        const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const m = new Date().getMonth();
        document.getElementById('txtMesAtual').innerText = meses[m] + ' ' + new Date().getFullYear();
    }

    async function loadFamilias() {
        const { data: familiasRaw, error: famErr } = await db.from('pessoas')
            .select('id, nome_curto, nome_completo, ass_familias_meta(codigo, status, tipo)')
            .contains('perfis', ['Titular da Família']);
            
        let familias = [];
        if (famErr) {
            const { data: allP } = await db.from('pessoas').select('id, nome_curto, nome_completo, perfis, ass_familias_meta(codigo, status, tipo)');
            if (allP) {
                familias = allP.filter(p => {
                    const arr = Array.isArray(p.perfis) ? p.perfis : (typeof p.perfis === 'string' ? JSON.parse(p.perfis || '[]') : []);
                    return arr.includes('Titular da Família');
                });
            }
        } else {
            familias = familiasRaw || [];
        }

        const arrAtivas = familias.filter(f => {
            const meta = Array.isArray(f.ass_familias_meta) ? (f.ass_familias_meta[0] || {}) : (f.ass_familias_meta || {});
            return meta.status === 'Ativa';
        });
        
        arrAtivas.sort((a,b) => {
            const nA = (a.nome_curto || a.nome_completo || '').toLowerCase();
            const nB = (b.nome_curto || b.nome_completo || '').toLowerCase();
            return nA.localeCompare(nB);
        });
        
        let html = '<option value="">-- Selecione uma Família --</option>';
        arrAtivas.forEach(f => {
            const meta = Array.isArray(f.ass_familias_meta) ? (f.ass_familias_meta[0] || {}) : (f.ass_familias_meta || {});
            const cod = meta.codigo || 'S/C';
            const nome = f.nome_curto || f.nome_completo;
            html += `<option value="${f.id}">${cod} - ${nome}</option>`;
        });
        document.getElementById('selFamilia').innerHTML = html;
    }

    async function loadMetrics() {
        // Data limite: 1st of current month
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        
        const { data: entregas, error } = await db.from('ass_entregas')
            .select('id, familia_id, quantidade_entregue, data_entrega, ass_cestas_modelos(codigo, tipo, id), ass_familias(codigo, nome_familia)')
            .gte('data_entrega', firstDay)
            .order('data_entrega', {ascending: false});
            
        if (error) {
            console.error(error);
            return;
        }
        
        // Calcular métricas
        let famSet = new Set();
        let cestasPequenas = 0; // CB01
        let cestasGrandes = 0; // CB02
        let leiteLitros = 0; // CB10 * 12
        let ovosCartelas = 0; // CB11
        let ovosUnid = 0;
        let extras = 0; // qualquer outro
        
        entregas.forEach(e => {
            if (e.pessoa_id) famSet.add(e.pessoa_id);
            else if (e.familia_id) famSet.add(e.familia_id);
            const qtd = e.quantidade_entregue || 1;
            const cod = e.ass_cestas_modelos ? e.ass_cestas_modelos.codigo : '';
            
            if (cod === 'CB01') {
                cestasPequenas += qtd;
            } else if (cod === 'CB02') {
                cestasGrandes += qtd;
            } else if (cod === 'CB10') { // Leite
                leiteLitros += (qtd * 12);
            } else if (cod === 'CB11') { // Ovos
                ovosCartelas += qtd;
                ovosUnid += (qtd * 18); // Baseado em 1 cartela = 18 unidades
            } else {
                extras += qtd;
            }
        });
        
        // Format numbers like 3.240
        const fmt = (num) => num.toLocaleString('pt-BR');
        
        document.getElementById('valFamilias').innerText = famSet.size;
        document.getElementById('valCestasPeq').innerText = fmt(cestasPequenas);
        document.getElementById('valCestasGde').innerText = fmt(cestasGrandes);
        document.getElementById('valLeite').innerText = fmt(leiteLitros) + 'L';
        document.getElementById('valOvosCartelas').innerText = fmt(ovosCartelas);
        document.getElementById('valOvosUnid').innerText = fmt(ovosUnid);
        document.getElementById('valExtras').innerText = fmt(extras);
        
        // Renderizar lista (últimos 10 globais)
        const recentes = entregas.slice(0, 10);
        const lstEl = document.getElementById('lstRecentes');
        
        if (recentes.length === 0) {
            lstEl.innerHTML = 'Nenhuma entrega este mês.';
        } else {
            lstEl.innerHTML = recentes.map(e => {
                const dateStr = e.data_entrega.split('-').reverse().join('/');
                let famNome = e.ass_familias ? e.ass_familias.codigo : '???';
                if (e.pessoa_id && e.pessoas) {
                    const meta = Array.isArray(e.pessoas.ass_familias_meta) ? (e.pessoas.ass_familias_meta[0] || {}) : (e.pessoas.ass_familias_meta || {});
                    famNome = meta.codigo || 'S/C';
                }
                const modelo = e.ass_cestas_modelos ? e.ass_cestas_modelos.tipo : 'Cesta';
                return `
                    <div class="m-list-item">
                        <div>
                            <div style="font-weight:600; color:var(--text-main);">${famNome}</div>
                            <div style="font-size:12px;">${e.quantidade_entregue}x ${modelo}</div>
                        </div>
                        <div style="font-size:12px;">${dateStr}</div>
                    </div>
                `;
            }).join('');
        }
    }
})();
