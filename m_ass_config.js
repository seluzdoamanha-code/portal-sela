const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    loadMetas();
    loadCestas();
    loadItens();
});

// UI TABS
function switchTab(tabId) {
    document.querySelectorAll('.m-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.m-config-section').forEach(s => s.classList.remove('active'));
    
    // Hide all FABs first
    const fabMetas = document.getElementById('fab-metas');
    const fabItens = document.getElementById('fab-itens');
    const fabCestas = document.getElementById('fab-cestas');
    if (fabMetas) fabMetas.style.display = 'none';
    if (fabItens) fabItens.style.display = 'none';
    if (fabCestas) fabCestas.style.display = 'none';
    
    if (tabId === 'metas') {
        document.querySelectorAll('.m-tab-btn')[0].classList.add('active');
        document.getElementById('sec-metas').classList.add('active');
        if (fabMetas) fabMetas.style.display = 'flex';
    } else if (tabId === 'itens') {
        document.querySelectorAll('.m-tab-btn')[1].classList.add('active');
        document.getElementById('sec-itens').classList.add('active');
        if (fabItens) fabItens.style.display = 'flex';
        loadItens();
    } else if (tabId === 'cestas') {
        document.querySelectorAll('.m-tab-btn')[2].classList.add('active');
        document.getElementById('sec-cestas').classList.add('active');
        if (fabCestas) fabCestas.style.display = 'flex';
        loadCestas();
    }
}

// ==============================
// METAS
// ==============================
async function loadMetas() {
    const { data, error } = await db.from('ass_metas').select('*').order('ano', { ascending: false }).order('titulo');
    const container = document.getElementById('metasList');
    
    if (error) {
        console.error(error);
        container.innerHTML = `<p style="color:red; text-align:center;">Erro ao carregar metas.</p>`;
        return;
    }
    
    if (data.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted); text-align:center; margin-top: 40px;">Nenhuma meta cadastrada.</p>`;
        return;
    }
    
    container.innerHTML = `
        <div style="overflow-x: auto; background: var(--surface); border-radius: 8px; padding: 12px; border: 1px solid var(--border);">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                <thead>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); font-size: 11px;">
                        <th style="padding: 8px 4px;">Chave</th>
                        <th style="padding: 8px 4px;">Título</th>
                        <th style="padding: 8px 4px;">Meta</th>
                        <th style="padding: 8px 4px;">Ano</th>
                        <th style="padding: 8px 4px;">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(m => `
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px 4px; color: #60a5fa;">${m.chave}</td>
                            <td style="padding: 10px 4px; color: var(--text-main); font-weight: 500;">${m.titulo}</td>
                            <td style="padding: 10px 4px; color: #3b82f6; font-weight: bold;">${m.valor}</td>
                            <td style="padding: 10px 4px; color: var(--text-muted);">${m.ano}</td>
                            <td style="padding: 10px 4px; white-space: nowrap;">
                                <button onclick="editarMeta('${m.id}')" style="background:none; border:none; color: #60a5fa; padding:4px;">✏️</button>
                                <button onclick="excluirMeta('${m.id}')" style="background:none; border:none; color: #ef4444; padding:4px;">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function abrirModalMeta() {
    document.getElementById('inpMetaId').value = '';
    document.getElementById('inpMetaTitulo').value = '';
    document.getElementById('inpMetaChave').value = '';
    document.getElementById('inpMetaValor').value = '';
    document.getElementById('inpMetaAno').value = new Date().getFullYear();
    document.getElementById('modalMetaTitle').innerText = 'Nova Meta';
    document.getElementById('modalMetaOverlay').classList.add('active');
}

async function editarMeta(id) {
    const { data, error } = await db.from('ass_metas').select('*').eq('id', id).single();
    if (!error && data) {
        document.getElementById('inpMetaId').value = data.id;
        document.getElementById('inpMetaTitulo').value = data.titulo;
        document.getElementById('inpMetaChave').value = data.chave;
        document.getElementById('inpMetaValor').value = data.valor;
        document.getElementById('inpMetaAno').value = data.ano;
        document.getElementById('modalMetaTitle').innerText = 'Editar Meta';
        document.getElementById('modalMetaOverlay').classList.add('active');
    }
}

async function salvarMeta() {
    const id = document.getElementById('inpMetaId').value;
    const payload = {
        titulo: document.getElementById('inpMetaTitulo').value,
        chave: document.getElementById('inpMetaChave').value,
        valor: document.getElementById('inpMetaValor').value || 0,
        ano: document.getElementById('inpMetaAno').value || new Date().getFullYear()
    };
    
    if (!payload.titulo || !payload.chave) {
        Swal.fire('Atenção', 'Título e chave são obrigatórios.', 'warning');
        return;
    }
    
    let error;
    if (id) {
        const res = await db.from('ass_metas').update(payload).eq('id', id);
        error = res.error;
    } else {
        const res = await db.from('ass_metas').insert([payload]);
        error = res.error;
    }
    
    if (error) {
        Swal.fire('Erro', 'Não foi possível salvar.', 'error');
    } else {
        fecharModal('modalMetaOverlay');
        Swal.fire({title: 'Sucesso', icon: 'success', toast: true, position: 'top', showConfirmButton: false, timer: 2000});
        loadMetas();
    }
}

async function excluirMeta(id) {
    if(confirm('Deseja excluir esta meta?')) {
        await db.from('ass_metas').delete().eq('id', id);
        loadMetas();
    }
}

// ==============================
// ITENS (ESTOQUE)
// ==============================
window.assItensGlobais = [];

async function loadItens() {
    const { data, error } = await db.from('ass_itens_cesta').select('*').order('descricao');
    const container = document.getElementById('itensList');
    
    if (error) {
        console.error(error);
        container.innerHTML = `<p style="color:red; text-align:center;">Erro ao carregar itens.</p>`;
        return;
    }
    
    window.assItensGlobais = data || [];
    
    if (!data || data.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted); text-align:center; margin-top: 40px;">Nenhum item cadastrado.</p>`;
        return;
    }
    
    container.innerHTML = `
        <div style="overflow-x: auto; background: var(--surface); border-radius: 8px; padding: 12px; border: 1px solid var(--border);">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                <thead>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); font-size: 11px;">
                        <th style="padding: 8px 4px;">Cód./Descrição</th>
                        <th style="padding: 8px 4px;">Estoque</th>
                        <th style="padding: 8px 4px;">Und</th>
                        <th style="padding: 8px 4px;">St</th>
                        <th style="padding: 8px 4px;">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(i => {
                        const isAtivo = (i.status === 'Ativo' || i.status === 'Ativa');
                        return `
                        <tr style="border-bottom: none;">
                            <td style="padding: 10px 4px 2px 4px; color: #60a5fa;">${i.codigo}</td>
                            <td style="padding: 10px 4px 2px 4px; color: #10b981; font-weight: bold;">${i.estoque_atual || 0}</td>
                            <td style="padding: 10px 4px 2px 4px; color: var(--text-muted);">${i.unidade || '-'}</td>
                            <td style="padding: 10px 4px 2px 4px;">
                                <span style="background: ${isAtivo ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${isAtivo ? '#10b981' : '#ef4444'}; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${isAtivo ? 'A' : 'I'}</span>
                            </td>
                            <td style="padding: 10px 4px 2px 4px; white-space: nowrap;">
                                <button onclick="editarItem('${i.id}')" style="background:none; border:none; color: #60a5fa; padding:4px;">✏️</button>
                                <button onclick="excluirItem('${i.id}')" style="background:none; border:none; color: #ef4444; padding:4px;">🗑️</button>
                            </td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td colspan="5" style="padding: 2px 4px 10px 4px; color: var(--text-main); font-weight: 500; font-size: 13px; white-space: normal;">
                                ${i.descricao}
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

window.abrirModalItem = function() {
    document.getElementById('inpItemId').value = '';
    document.getElementById('inpItemCodigo').value = '';
    document.getElementById('inpItemDesc').value = '';
    document.getElementById('inpItemEstoque').value = '0';
    document.getElementById('inpItemUnd').value = '';
    document.getElementById('inpItemPeso').value = '0';
    document.getElementById('inpItemStatus').value = 'Ativo';
    document.getElementById('modalItemTitle').innerText = 'Novo Item';
    document.getElementById('modalItemOverlay').classList.add('active');
}

window.editarItem = async function(id) {
    const { data, error } = await db.from('ass_itens_cesta').select('*').eq('id', id).single();
    if (!error && data) {
        document.getElementById('inpItemId').value = data.id;
        document.getElementById('inpItemCodigo').value = data.codigo;
        document.getElementById('inpItemDesc').value = data.descricao;
        document.getElementById('inpItemEstoque').value = data.estoque_atual || 0;
        document.getElementById('inpItemUnd').value = data.unidade || '';
        document.getElementById('inpItemPeso').value = data.peso_kg || 0;
        document.getElementById('inpItemStatus').value = (data.status === 'Ativo' || data.status === 'Ativa') ? 'Ativo' : 'Inativo';
        document.getElementById('modalItemTitle').innerText = 'Editar Item';
        document.getElementById('modalItemOverlay').classList.add('active');
    }
}

window.salvarItem = async function() {
    const id = document.getElementById('inpItemId').value;
    const payload = {
        codigo: document.getElementById('inpItemCodigo').value,
        descricao: document.getElementById('inpItemDesc').value,
        estoque_atual: parseInt(document.getElementById('inpItemEstoque').value) || 0,
        unidade: document.getElementById('inpItemUnd').value,
        peso_kg: parseFloat(document.getElementById('inpItemPeso').value) || 0,
        status: document.getElementById('inpItemStatus').value
    };
    
    if (!payload.codigo || !payload.descricao) {
        Swal.fire('Atenção', 'Código e descrição são obrigatórios.', 'warning');
        return;
    }
    
    let error;
    if (id) {
        const res = await db.from('ass_itens_cesta').update(payload).eq('id', id);
        error = res.error;
    } else {
        const res = await db.from('ass_itens_cesta').insert([payload]);
        error = res.error;
    }
    
    if (error) {
        console.error(error);
        Swal.fire('Erro', error.message || 'Não foi possível salvar.', 'error');
    } else {
        fecharModal('modalItemOverlay');
        Swal.fire({title: 'Sucesso', icon: 'success', toast: true, position: 'top', showConfirmButton: false, timer: 2000});
        loadItens();
    }
}

window.excluirItem = async function(id) {
    if(confirm('Deseja excluir este item? (Não exclua se ele já fizer parte de uma cesta)')) {
        await db.from('ass_itens_cesta').delete().eq('id', id);
        loadItens();
    }
}

// ==============================
// CESTAS
// ==============================
async function loadCestas() {
    // Busca cestas com composição
    const { data, error } = await db.from('ass_cestas_modelos').select(`
        *,
        ass_cesta_composicao (
            quantidade,
            ass_itens_cesta ( id, codigo, descricao, unidade )
        )
    `).order('codigo');
    const container = document.getElementById('cestasList');
    
    if (error) {
        container.innerHTML = `<p style="color:red; text-align:center;">Erro ao carregar cestas.</p>`;
        return;
    }
    
    if (data.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted); text-align:center; margin-top: 40px;">Nenhum modelo cadastrado.</p>`;
        return;
    }
    
    container.innerHTML = data.map(c => {
        const isAtiva = c.status === 'Ativa' || c.status === 'Ativo';
        const badgeCls = isAtiva ? 'badge-ativa' : 'badge-inativa';
        const badgeTxt = isAtiva ? 'Ativa' : 'Inativa';
        
        let composicaoHtml = '';
        if (c.ass_cesta_composicao && c.ass_cesta_composicao.length > 0) {
            composicaoHtml = `
                <div style="background: rgba(0,0,0,0.1); border-radius: 6px; padding: 12px; margin-top: 12px;">
                    <h6 style="color: var(--text-muted); margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase;">Composição:</h6>
                    ${c.ass_cesta_composicao.map(comp => `
                        <div style="display: flex; justify-content: space-between; font-size: 13px; border-bottom: 1px dashed rgba(255,255,255,0.05); padding: 4px 0;">
                            <span style="color: var(--text-main);">(${comp.ass_itens_cesta?.codigo || '-'}) ${comp.ass_itens_cesta?.descricao || 'Deletado'}</span>
                            <span style="color: var(--text-muted);">${comp.quantidade} ${comp.ass_itens_cesta?.unidade || ''}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            composicaoHtml = `<p style="color:var(--text-muted); font-size: 12px; margin-top: 12px;">Sem itens na composição.</p>`;
        }
        
        return `
        <div class="m-list-item" style="flex-direction: column; align-items: stretch;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="m-list-content">
                    <h4 class="m-list-title">${c.codigo} - ${c.tipo}</h4>
                    <p class="m-list-desc">${c.descricao || 'Sem descrição'}</p>
                    <span class="m-list-badge ${badgeCls}">${badgeTxt}</span>
                </div>
                <div class="m-list-actions">
                    <button class="m-action-btn" onclick="editarCesta('${c.id}')" style="color: #60a5fa;">✏️</button>
                </div>
            </div>
            ${composicaoHtml}
        </div>
        `;
    }).join('');
}

function renderOptionsItens() {
    if(!window.assItensGlobais || window.assItensGlobais.length === 0) {
        return `<option value="">Nenhum item carregado</option>`;
    }
    return window.assItensGlobais.map(i => `<option value="${i.id}">(${i.codigo}) ${i.descricao} [${i.unidade}]</option>`).join('');
}

window.adicionarLinhaComposicaoM = function(itemId = '', qtd = 1) {
    const container = document.getElementById('mCestaComposicaoContainer');
    
    const div = document.createElement('div');
    div.className = 'm-cesta-comp-linha';
    div.style.display = 'flex';
    div.style.gap = '8px';
    div.style.marginBottom = '8px';
    
    div.innerHTML = `
        <select class="m-input comp-item-select" style="flex: 1; padding: 8px;">
            ${renderOptionsItens()}
        </select>
        <input type="number" class="m-input comp-item-qtd" value="${qtd}" min="1" step="1" style="width: 70px; padding: 8px;">
        <button type="button" onclick="this.parentElement.remove()" style="background:none; border:none; color:#ef4444; font-size:16px; padding:0 8px;">×</button>
    `;
    
    container.appendChild(div);
    if(itemId) {
        div.querySelector('.comp-item-select').value = itemId;
    }
}

function abrirModalCesta() {
    document.getElementById('inpCestaId').value = '';
    document.getElementById('inpCestaCodigo').value = '';
    document.getElementById('inpCestaTipo').value = '';
    document.getElementById('inpCestaDesc').value = '';
    document.getElementById('inpCestaStatus').value = 'Ativa';
    document.getElementById('mCestaComposicaoContainer').innerHTML = '';
    document.getElementById('modalCestaTitle').innerText = 'Novo Modelo';
    document.getElementById('modalCestaOverlay').classList.add('active');
}

async function editarCesta(id) {
    const { data, error } = await db.from('ass_cestas_modelos').select('*, ass_cesta_composicao(*)').eq('id', id).single();
    if (!error && data) {
        document.getElementById('inpCestaId').value = data.id;
        document.getElementById('inpCestaCodigo').value = data.codigo;
        document.getElementById('inpCestaTipo').value = data.tipo;
        document.getElementById('inpCestaDesc').value = data.descricao;
        
        document.getElementById('inpCestaStatus').value = data.status || 'Ativo';
        
        document.getElementById('mCestaComposicaoContainer').innerHTML = '';
        if(data.ass_cesta_composicao && data.ass_cesta_composicao.length > 0) {
            data.ass_cesta_composicao.forEach(comp => {
                adicionarLinhaComposicaoM(comp.item_id, comp.quantidade);
            });
        }
        
        document.getElementById('modalCestaTitle').innerText = 'Editar Modelo';
        document.getElementById('modalCestaOverlay').classList.add('active');
    }
}

async function salvarCesta() {
    const id = document.getElementById('inpCestaId').value;
    const payload = {
        codigo: document.getElementById('inpCestaCodigo').value,
        tipo: document.getElementById('inpCestaTipo').value,
        descricao: document.getElementById('inpCestaDesc').value,
        status: document.getElementById('inpCestaStatus').value
    };
    
    if (!payload.codigo || !payload.tipo) {
        Swal.fire('Atenção', 'Código e tipo são obrigatórios.', 'warning');
        return;
    }
    
    // Coleta a composição atual
    const linhas = document.querySelectorAll('.m-cesta-comp-linha');
    const composicao = [];
    linhas.forEach(l => {
        const item_id = l.querySelector('.comp-item-select').value;
        const qtd = parseInt(l.querySelector('.comp-item-qtd').value) || 1;
        if(item_id) {
            composicao.push({ item_id, quantidade: qtd });
        }
    });

    let error;
    let cestaId = id;
    if (id) {
        const res = await db.from('ass_cestas_modelos').update(payload).eq('id', id);
        error = res.error;
    } else {
        const res = await db.from('ass_cestas_modelos').insert([payload]).select('id').single();
        error = res.error;
        if(res.data) cestaId = res.data.id;
    }
    
    if (error) {
        console.error(error);
        Swal.fire('Erro', error.message || 'Não foi possível salvar o modelo.', 'error');
        return;
    }
    
    // Processar Composição
    if (cestaId) {
        // Remove antiga
        await db.from('ass_cesta_composicao').delete().eq('cesta_id', cestaId);
        // Insere nova
        if (composicao.length > 0) {
            const compPayload = composicao.map(c => ({
                cesta_id: cestaId,
                item_id: c.item_id,
                quantidade: c.quantidade
            }));
            await db.from('ass_cesta_composicao').insert(compPayload);
        }
    }
    
    fecharModal('modalCestaOverlay');
    Swal.fire({title: 'Sucesso', icon: 'success', toast: true, position: 'top', showConfirmButton: false, timer: 2000});
    loadCestas();
}

// UTILS
function fecharModal(id) {
    document.getElementById(id).classList.remove('active');
}
