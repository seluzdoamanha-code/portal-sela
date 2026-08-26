import re

with open('m_ass_familias.js', 'r') as f:
    content = f.read()

# Remove the meta functions from the end
meta_regex = r'    async function abrirFormularioMeta\(f\).*?}\n\n'
content = re.sub(r'    async function abrirFormularioMeta\(f\).*', '', content, flags=re.DOTALL)

# And remove the empty lines and '})();' at the end of the previous content
# We will just find where renderEntregasList ends.
content = re.sub(r'\}\)\(\);\s*window\.renderEntregasList = function\(limit\) \{.*?\};\s*', '', content, flags=re.DOTALL)

# Add them back properly before })();
proper_end = """
window.renderEntregasList = function(limit) {
    const hist = window._currentFamilyEntregas || [];
    const histEl = document.getElementById('mdHistoricoList');
    if (!histEl) return;
    
    let html = '';
    const toShow = hist.slice(0, limit);
    
    html += toShow.map(h => {
        const dateStr = h.data_entrega ? h.data_entrega.split('-').reverse().join('/') : '';
        const modeloNome = h.ass_cestas_modelos ? h.ass_cestas_modelos.tipo : 'Cesta Desconhecida';
        const qtdStr = h.quantidade_entregue ? h.quantidade_entregue + 'x ' : '';
        const obsHtml = h.observacoes ? `<div style="font-size:12px; color:var(--text-muted); margin-top:2px; font-style:italic;">Obs: ${h.observacoes}</div>` : '';
        return `
            <div class="m-member-row" style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <div>
                    <div style="color:var(--text-main); font-weight:500;">${qtdStr}${modeloNome}</div>
                    <div style="font-size:12px; color:var(--text-muted);">${dateStr}</div>
                    ${obsHtml}
                </div>
            </div>
        `;
    }).join('');
    
    if (hist.length > limit) {
        const remaining = hist.length - limit;
        html += `
            <div style="text-align: center; margin-top: 8px;">
                <button onclick="renderEntregasList(999)" style="background: none; border: none; color: var(--primary); font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                    Ver mais ${remaining} entregas
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
                </button>
            </div>
        `;
    } else if (limit > 3 && hist.length > 3) {
         html += `
            <div style="text-align: center; margin-top: 8px;">
                <button onclick="renderEntregasList(3)" style="background: none; border: none; color: var(--text-muted); font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                    Mostrar menos
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg>
                </button>
            </div>
        `;
    }
    
    histEl.innerHTML = html;
};

async function abrirFormularioMeta(f) {
    document.getElementById('mMetaTitle').innerText = 'Metadados Assistência: ' + (f.nome_familia || '');
    document.getElementById('fMetaId').value = f.id; // pessoa_id
    document.getElementById('fMetaCodigo').value = f.codigo || '';
    document.getElementById('fMetaStatus').value = f.status || 'Ativa';
    document.getElementById('fMetaTipo').value = f.tipo || 'Fixa/Assistida';
    
    document.getElementById('mMetaModal').classList.add('active');
}

async function salvarMetaFamilia() {
    const pessoaId = document.getElementById('fMetaId').value;
    const codigo = document.getElementById('fMetaCodigo').value.trim();
    const status = document.getElementById('fMetaStatus').value;
    const tipo = document.getElementById('fMetaTipo').value;

    const btn = document.getElementById('btnSalvarMeta');
    btn.innerText = 'Salvando...';
    btn.disabled = true;

    try {
        const payload = {
            pessoa_id: pessoaId,
            codigo: codigo,
            status: status,
            tipo: tipo
        };

        const { error } = await db.from('ass_familias_meta').upsert(payload, { onConflict: 'pessoa_id' });
        if (error) throw error;
        
        document.getElementById('mMetaModal').classList.remove('active');
        carregarFamilias();
    } catch(e) {
        console.error(e);
        alert('Erro ao salvar metadados da família.');
    } finally {
        btn.innerText = 'Salvar';
        btn.disabled = false;
    }
}

})();
"""
content = content + proper_end

with open('m_ass_familias.js', 'w') as f:
    f.write(content)
