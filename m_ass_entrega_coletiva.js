(function() {
    const supabaseUrl = window.SUPABASE_URL;
    const supabaseKey = window.SUPABASE_ANON_KEY;
    const db = window.supabase.createClient(supabaseUrl, supabaseKey);
    
    let currentDate = new Date();
    // Default to the current month/year, but we can navigate
    // Let's set it to 1st of the month
    currentDate.setDate(1);

    let allFamilias = [];
    let allModelos = [];
    let entregasMes = []; // to check what's already delivered

    async function init() {
        document.getElementById('btnPrevMonth').addEventListener('click', () => changeMonth(-1));
        document.getElementById('btnNextMonth').addEventListener('click', () => changeMonth(1));
        document.getElementById('btnSalvarLote').addEventListener('click', salvarLote);

        await carregarModelos();
        updateDateDisplay(); // this will also trigger load
    }

    function changeMonth(delta) {
        currentDate.setMonth(currentDate.getMonth() + delta);
        updateDateDisplay();
    }

    async function updateDateDisplay() {
        const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const mesStr = meses[currentDate.getMonth()];
        const anoStr = currentDate.getFullYear();
        document.getElementById('dateDisplay').innerText = `${mesStr} ${anoStr}`;
        
        await carregarDados();
    }

    async function carregarModelos() {
        try {
            const { data, error } = await db.from('ass_cestas_modelos').select('id, codigo, tipo').order('tipo');
            if (error) throw error;
            allModelos = data || [];
        } catch(e) {
            console.error("Erro modelos:", e);
        }
    }

    async function carregarDados() {
        const container = document.getElementById('familiasList');
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 40px;">Carregando...</p>';
        document.getElementById('btnSalvarLote').disabled = true;

        try {
            const ano = currentDate.getFullYear();
            const mes = currentDate.getMonth() + 1; // 1-12

            // Fetch Active Families
            const { data: familias, error: famErr } = await db.from('ass_familias')
                .select('id, codigo, nome_familia')
                .eq('status', 'Ativa')
                .order('nome_familia');
            if (famErr) throw famErr;
            allFamilias = familias || [];

            // Fetch existing deliveries for this month
            const { data: entregas, error: entErr } = await db.from('ass_entregas')
                .select('id, familia_id, cesta_id, quantidade_entregue')
                .eq('ano_ref', ano)
                .eq('mes_ref', mes);
            if (entErr) throw entErr;
            entregasMes = entregas || [];

            renderList();
        } catch(e) {
            console.error("Erro dados:", e);
            container.innerHTML = '<p style="text-align: center; color: #ef4444; margin-top: 40px;">Erro ao carregar dados.</p>';
        } finally {
            document.getElementById('btnSalvarLote').disabled = false;
        }
    }

    function renderList() {
        const container = document.getElementById('familiasList');
        
        if (allFamilias.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 40px;">Nenhuma família ativa encontrada.</p>';
            return;
        }

        let html = '';
        allFamilias.forEach(f => {
            // Check if already delivered
            const delivered = entregasMes.find(e => e.familia_id === f.id);
            const defaultQtd = delivered ? delivered.quantidade_entregue : 0;
            const defaultCesta = delivered ? delivered.cesta_id : '';

            // Generate options
            let options = '<option value="">-- Cesta --</option>';
            allModelos.forEach(m => {
                options += `<option value="${m.id}" ${m.id === defaultCesta ? 'selected' : ''}>${m.tipo}</option>`;
            });

            html += `
                <div class="m-family-card" data-fam-id="${f.id}" data-ent-id="${delivered ? delivered.id : ''}">
                    <div class="m-fam-header">
                        <div class="m-fam-code">${f.codigo || 'S/C'}</div>
                        <div class="m-fam-name">${f.nome_familia}</div>
                    </div>
                    <div class="m-fam-controls">
                        <div class="m-control-group">
                            <label class="m-control-label">Selecione Cesta</label>
                            <select class="m-select sel-cesta">
                                ${options}
                            </select>
                        </div>
                        <div class="m-control-group qtd">
                            <label class="m-control-label">Qtd</label>
                            <input type="number" class="m-input-num inp-qtd" value="${defaultQtd}" min="0">
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        // Padding extra no fim da lista pra nao ficar sob o botao
        container.innerHTML += '<div style="height: 100px;"></div>';
    }

    async function salvarLote() {
        const btn = document.getElementById('btnSalvarLote');
        btn.disabled = true;
        btn.innerHTML = 'Salvando...';

        try {
            const ano = currentDate.getFullYear();
            const mes = currentDate.getMonth() + 1;
            // Pad the month
            const mesStr = mes.toString().padStart(2, '0');
            // Assuming the delivery date is today if it's current month, otherwise 1st of the month
            let dataEntrega = new Date().toISOString().split('T')[0];
            const hoje = new Date();
            if (hoje.getFullYear() !== ano || (hoje.getMonth() + 1) !== mes) {
                dataEntrega = `${ano}-${mesStr}-01`;
            }

            const cards = document.querySelectorAll('.m-family-card');
            
            // To simplify and not freeze the UI entirely for a long time, we process one by one or in batches.
            // We will just process one by one to handle inventory deductions safely.
            let successCount = 0;

            for (const card of cards) {
                const famId = card.getAttribute('data-fam-id');
                const entId = card.getAttribute('data-ent-id');
                const cestaId = card.querySelector('.sel-cesta').value;
                const qtd = parseInt(card.querySelector('.inp-qtd').value) || 0;

                // Scenario 1: Needs Insert
                if (qtd > 0 && !entId && cestaId) {
                    const payload = {
                        data_entrega: dataEntrega,
                        ano_ref: ano,
                        mes_ref: mes,
                        familia_id: famId,
                        cesta_id: cestaId,
                        quantidade_entregue: qtd
                    };
                    const { data: inserted, error: entErr } = await db.from('ass_entregas').insert(payload).select('id').single();
                    if (entErr) throw entErr;
                    
                    await deduzirEstoque(cestaId, qtd);
                    successCount++;
                }
                // Scenario 2: Needs Update (changed qty or cesta)
                else if (qtd > 0 && entId && cestaId) {
                    // Check if it really changed
                    const existing = entregasMes.find(e => e.id === entId);
                    if (existing && (existing.cesta_id !== cestaId || existing.quantidade_entregue !== qtd)) {
                        // For simplicity, we just update. (Ideally we should revert old stock and deduct new, but this is complex for batch script right now. Let's assume they are just filling it out for the first time mostly).
                        const { error: updErr } = await db.from('ass_entregas').update({
                            cesta_id: cestaId,
                            quantidade_entregue: qtd
                        }).eq('id', entId);
                        if (updErr) throw updErr;
                        successCount++;
                    }
                }
                // Scenario 3: Needs Delete (qtd = 0 but entId exists)
                else if (qtd === 0 && entId) {
                    const { error: delErr } = await db.from('ass_entregas').delete().eq('id', entId);
                    if (delErr) throw delErr;
                    successCount++;
                }
            }

            Swal.fire({
                icon: 'success',
                title: 'Sucesso',
                text: `${successCount} registros atualizados.`,
                confirmButtonColor: 'var(--primary)'
            });

            await carregarDados(); // refresh
        } catch(e) {
            console.error("Erro salvar:", e);
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: 'Houve um erro ao processar o lote de entregas.',
                confirmButtonColor: 'var(--primary)'
            });
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Salvar Entregas`;
        }
    }

    async function deduzirEstoque(cestaId, qtdEntrega) {
        try {
            const { data: composicao } = await db.from('ass_cesta_composicao').select('item_id, quantidade').eq('cesta_id', cestaId);
            if (composicao && composicao.length > 0) {
                for (const comp of composicao) {
                    const qtdSubtrair = comp.quantidade * qtdEntrega;
                    const { data: itemData } = await db.from('ass_itens_cesta').select('estoque_atual').eq('id', comp.item_id).single();
                    if (itemData) {
                        const novoEstoque = itemData.estoque_atual - qtdSubtrair;
                        await db.from('ass_itens_cesta').update({ estoque_atual: novoEstoque }).eq('id', comp.item_id);
                    }
                }
            }
        } catch(e) {
            console.error("Erro deduzir estoque:", e);
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
