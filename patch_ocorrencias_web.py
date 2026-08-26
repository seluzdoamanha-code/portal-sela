import re

with open('familias.js', 'r') as f:
    js_content = f.read()

# 1. Update abrirModalNovaOcorrencia to populate with window._familiasPerfilWeb
modal_regex = r'window\.abrirModalNovaOcorrencia = async function\(\) \{.*?document\.getElementById\(\'assOcorFamilia\'\)\.innerHTML = htmlFam;\s*\}\s*catch.*?\}'
new_modal = """
window.abrirModalNovaOcorrencia = async function() {
    if(!document.getElementById('modalNovaOcorrenciaAss')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal-overlay" id="modalNovaOcorrenciaAss" style="display: none; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999;">
                <div class="modal-content" style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 24px; width: 100%; max-width: 500px;">
                    <h3 style="margin-top: 0; color: var(--text-main);">Registrar Nova Ocorrência (Perfil Global)</h3>

                    <form id="formNovaOcorrenciaAss" onsubmit="salvarNovaOcorrenciaAss(event)">
                        <div style="margin-bottom: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Data</label>
                                <input type="date" id="assOcorData" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                            </div>
                            <div>
                                <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Código (Ex: RO001)</label>
                                <input type="text" id="assOcorCodigo" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 12px;">
                            <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Família Envolvida</label>
                            <select id="assOcorFamilia" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                                <option value="">Carregando famílias...</option>
                            </select>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Tipo de Ocorrência</label>
                            <select id="assOcorTipo" class="form-control" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px;">
                                <option value="Normal">Normal (Visita/Acompanhamento)</option>
                                <option value="Grave">Grave (Problema/Alerta)</option>
                                <option value="Entrega">Problema na Entrega</option>
                                <option value="Familiar">Conflito/Questão Familiar</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>

                        <div style="margin-bottom: 24px;">
                            <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 4px;">Observação / Relato</label>
                            <textarea id="assOcorObs" class="form-control" rows="4" required style="width: 100%; background: var(--bg-body); border: 1px solid var(--border); color: var(--text-main); padding: 8px; border-radius: 6px; resize: vertical;"></textarea>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 12px;">
                            <button type="button" class="btn btn-secondary" onclick="document.getElementById('modalNovaOcorrenciaAss').style.display='none'">Cancelar</button>
                            <button type="submit" class="btn btn-primary" id="btnSalvarOcoAss">Salvar Ocorrência</button>
                        </div>
                    </form>
                </div>
            </div>
        `);
    }

    document.getElementById('formNovaOcorrenciaAss').reset();
    document.getElementById('assOcorData').value = new Date().toISOString().split('T')[0];
    
    // Suggest code
    const timestamp = new Date().getTime().toString().slice(-4);
    document.getElementById('assOcorCodigo').value = 'RO' + timestamp;

    document.getElementById('modalNovaOcorrenciaAss').style.display = 'flex';

    try {
        const perfis = window._familiasPerfilWeb || [];
        let htmlFam = '<option value="">Selecione a Família (Global)...</option>';
        perfis.forEach(f => {
            htmlFam += `<option value="${f.id}">${f.codigo} - ${f.nome_familia}</option>`;
        });
        
        if (perfis.length === 0) {
            htmlFam = '<option value="">Nenhuma família global encontrada.</option>';
        }

        document.getElementById('assOcorFamilia').innerHTML = htmlFam;
    } catch(err) {
        console.error(err);
        document.getElementById('assOcorFamilia').innerHTML = '<option value="">Erro ao carregar</option>';
    }
}
"""
js_content = re.sub(modal_regex, new_modal.strip(), js_content, flags=re.DOTALL)

# 2. Update salvarNovaOcorrenciaAss to use pessoa_id
salvar_regex = r'window\.salvarNovaOcorrenciaAss = async function\(e\) \{.*?const payload = \{.*?familia_id: familiaId,.*?\}\;.*?\}\;'
new_salvar = """
window.salvarNovaOcorrenciaAss = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSalvarOcoAss');
    const oldText = btn.innerText;
    btn.innerText = 'Salvando...';
    btn.disabled = true;

    try {
        const dataOco = document.getElementById('assOcorData').value;
        const codigo = document.getElementById('assOcorCodigo').value;
        const pessoaId = document.getElementById('assOcorFamilia').value;
        const tipo = document.getElementById('assOcorTipo').value;
        const obs = document.getElementById('assOcorObs').value;

        const payload = {
            pessoa_id: pessoaId,
            data_ocorrencia: dataOco,
            codigo: codigo,
            tipo: tipo,
            observacao: obs
        };

        const { error } = await db.from('ass_ocorrencias').insert([payload]);
        if (error) {
            if (error.code === '23505') throw new Error('Já existe uma ocorrência com este Código (RO).');
            throw error;
        }

        document.getElementById('modalNovaOcorrenciaAss').style.display = 'none';
        carregarListaOcorrencias();
    } catch(err) {
        console.error(err);
        alert('Erro ao salvar ocorrência: ' + (err.message || err.toString()));
    } finally {
        btn.innerText = oldText;
        btn.disabled = false;
    }
};
"""
js_content = re.sub(salvar_regex, new_salvar.strip(), js_content, flags=re.DOTALL)

# 3. Update carregarListaOcorrencias to use pessoa_id and format HTML correctly
listar_regex = r'async function carregarListaOcorrencias\(\) \{.*?\}\n'
new_listar = """
async function carregarListaOcorrencias() {
    const container = document.getElementById('famOcorrenciasLista');
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">Carregando ocorrências...</div>';

    try {
        const { data, error } = await db.from('ass_ocorrencias')
            .select('*, ass_familias(nome_familia, codigo), pessoas(id, nome_completo, nome_curto, ass_familias_meta(codigo))')
            .order('data_ocorrencia', { ascending: false });
            
        if (error) throw error;

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h3 style="margin: 0; color: var(--text-main);">Livro de Ocorrências e Visitas</h3>
                <button class="btn btn-primary" onclick="abrirModalNovaOcorrencia()">📝 Registrar Ocorrência</button>
            </div>
            
            <div style="background: var(--bg-body); border: 1px solid var(--border); border-radius: 8px; padding: 16px;">
                ${(!data || data.length === 0) ? '<p style="color:var(--text-muted); font-size:13px; text-align: center; padding: 20px;">Nenhuma ocorrência registrada no sistema.</p>' : `
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); font-size: 12px;">
                                    <th style="padding: 8px 4px; width: 100px;">Data</th>
                                    <th style="padding: 8px 4px; width: 100px;">Cód.</th>
                                    <th style="padding: 8px 4px;">Família / Pessoa</th>
                                    <th style="padding: 8px 4px; width: 120px;">Tipo</th>
                                    <th style="padding: 8px 4px;">Observação</th>
                                    <th style="padding: 8px 4px; text-align: right; width: 80px;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map(o => {
                                    let corTipo = '#94a3b8'; // Default Normal
                                    if(o.tipo === 'Grave') corTipo = '#ef4444';
                                    if(o.tipo === 'Familiar') corTipo = '#8b5cf6';
                                    if(o.tipo === 'Entrega') corTipo = '#f59e0b';
                                    
                                    // Resolver nome e código
                                    let nomeExibicao = 'Família Removida';
                                    let isLegado = false;
                                    
                                    if (o.pessoa_id && o.pessoas) {
                                        const p = o.pessoas;
                                        const meta = p.ass_familias_meta ? (Array.isArray(p.ass_familias_meta) ? (p.ass_familias_meta[0] || {}) : p.ass_familias_meta) : {};
                                        const cod = meta.codigo || 'S/C';
                                        const n = p.nome_curto || p.nome_completo;
                                        nomeExibicao = `${cod} - ${n} <span style="font-size:10px; background:#4ade80; color:#14532d; padding:2px 6px; border-radius:8px;">Global</span>`;
                                    } else if (o.familia_id && o.ass_familias) {
                                        nomeExibicao = `${o.ass_familias.codigo} - ${o.ass_familias.nome_familia} <span style="font-size:10px; background:#64748b; color:white; padding:2px 6px; border-radius:8px;">Legado</span>`;
                                        isLegado = true;
                                    }
                                    
                                    return `
                                    <tr style="border-bottom: 1px solid var(--border); font-size: 13px;">
                                        <td style="padding: 12px 4px; color: var(--text-muted);">${o.data_ocorrencia.split('-').reverse().join('/')}</td>
                                        <td style="padding: 12px 4px; color: #60a5fa; font-weight: bold;">${o.codigo}</td>
                                        <td style="padding: 12px 4px; color: var(--text-main); font-weight: 500;">
                                            ${nomeExibicao}
                                        </td>
                                        <td style="padding: 12px 4px;">
                                            <span style="background: ${corTipo}20; color: ${corTipo}; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${o.tipo}</span>
                                        </td>
                                        <td style="padding: 12px 4px; color: var(--text-muted); max-width: 250px;">
                                            <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${o.observacao.replace(/"/g, '&quot;')}">${o.observacao}</div>
                                        </td>
                                        <td style="padding: 12px 4px; text-align: right;">
                                            <button onclick="excluirOcorrenciaAss('${o.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer;" title="Excluir Ocorrência">🗑️</button>
                                        </td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
        
        container.innerHTML = html;
        
    } catch (err) {
        console.error(err);
        container.innerHTML = '<div style="text-align: center; color: #ef4444; padding: 20px;">Erro ao carregar ocorrências.</div>';
    }
}
"""
js_content = re.sub(listar_regex, new_listar.strip() + '\n', js_content, flags=re.DOTALL)

with open('familias.js', 'w') as f:
    f.write(js_content)
