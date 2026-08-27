(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let familiaMap = {};

    document.addEventListener('DOMContentLoaded', async () => {
        setupMesAtual();
        await loadFamilias();
        await loadMetrics();
        
        document.getElementById('btnNovaOcorrencia').addEventListener('click', () => {
            const sel = document.getElementById('selFamilia');
            if (sel.value) {
                const nomeFam = encodeURIComponent(familiaMap[sel.value] || '');
                window.location.href = 'm_ass_ocorrencias.html?f_id=' + sel.value + '&f_nome=' + nomeFam + '&from=dash&is_global=1';
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
            const nomeLindo = cod + ' - ' + (f.nome_curto || f.nome_completo);
            familiaMap[f.id] = nomeLindo;
            html += `<option value="${f.id}">${nomeLindo}</option>`;
        });
        document.getElementById('selFamilia').innerHTML = html;
    }

    async function loadMetrics() {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        
        const { data: ocos, error } = await db.from('ass_ocorrencias')
            .select('id, familia_id, codigo, tipo, observacao, data_ocorrencia, ass_familias(codigo, nome_familia)')
            .gte('data_ocorrencia', firstDay)
            .order('data_ocorrencia', {ascending: false});
            
        if (error) {
            console.error(error);
            return;
        }
        
        let total = ocos.length;
        let graves = 0;
        let cats = {};
        
        ocos.forEach(o => {
            const t = o.tipo || 'Outros';
            if (t === 'Grave') graves++;
            cats[t] = (cats[t] || 0) + 1;
        });
        
        document.getElementById('valTotal').innerText = total;
        document.getElementById('valGraves').innerText = graves;
        
        let catsHtml = '';
        Object.keys(cats).sort().forEach(k => {
            catsHtml += `<div>• ${k}: <strong style="color:var(--text-main);">${cats[k]}</strong></div>`;
        });
        if (Object.keys(cats).length === 0) catsHtml = 'Nenhuma ocorrência registrada.';
        document.getElementById('valCategorias').innerHTML = catsHtml;
        
        const recentes = ocos.slice(0, 10);
        const lstEl = document.getElementById('lstRecentes');
        
        if (recentes.length === 0) {
            lstEl.innerHTML = 'Nenhuma ocorrência este mês.';
        } else {
            lstEl.innerHTML = recentes.map(o => {
                const dateStr = o.data_ocorrencia.split('-').reverse().join('/');
                let famNome = o.ass_familias ? o.ass_familias.codigo + ' - ' + o.ass_familias.nome_familia.split(' ')[0] : '???';
                if (o.pessoa_id && o.pessoas) {
                    const meta = Array.isArray(o.pessoas.ass_familias_meta) ? (o.pessoas.ass_familias_meta[0] || {}) : (o.pessoas.ass_familias_meta || {});
                    famNome = (meta.codigo || 'S/C') + ' - ' + (o.pessoas.nome_curto || o.pessoas.nome_completo).split(' ')[0];
                }
                const corTipo = o.tipo === 'Grave' ? 'color: var(--primary); font-weight:600;' : 'color: var(--text-main); font-weight:500;';
                
                return `
                    <div class="m-list-item">
                        <div style="display:flex; justify-content:space-between; width:100%; margin-bottom:4px;">
                            <div style="font-size:12px; color:var(--text-muted);">${famNome}</div>
                            <div style="font-size:12px; color:var(--text-muted);">${dateStr}</div>
                        </div>
                        <div style="font-size:13px; ${corTipo}">${o.codigo} - ${o.tipo}</div>
                        <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${o.observacao}</div>
                    </div>
                `;
            }).join('');
        }
    }
})();
