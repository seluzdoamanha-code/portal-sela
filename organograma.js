const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const urlParams = new URLSearchParams(window.location.search);
const estruturaId = urlParams.get('id');

let chart = null;
let vinculosGlobais = [];
let pessoasParaSelect = [];

function formatarDocumento(v) {
    if (!v) return '';
    v = String(v).replace(/\D/g, '');
    if (v.length === 11) {
        return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (v.length === 14) {
        return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return v;
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!estruturaId) {
        alert("Nenhuma estrutura selecionada!");
        window.location.href = 'entidade.html';
        return;
    }

    // Atualiza o link do botão voltar para o Hub da Estrutura
    const btnVoltar = document.getElementById('btnVoltar');
    if (btnVoltar) {
        btnVoltar.href = `hub.html?id=${estruturaId}`;
    }

    setupModal();
    await carregarEstrutura();
    await carregarPessoasParaSelect();
    await carregarArvore();
});

async function carregarEstrutura() {
    const { data, error } = await db.from('estruturas').select('*').eq('id', estruturaId).single();
    if (data) {
        document.getElementById('nomeEstrutura').textContent = data.nome;
        document.getElementById('tipoEstrutura').textContent = "Visualizando: " + data.tipo;
    }
}

async function carregarPessoasParaSelect() {
    const { data, error } = await db.from('pessoas').select('id, nome_curto, nome_completo, cpf_cnpj, tipo_pessoa, papeis').order('nome_completo');
    if (data) {
        // Filtrar apenas associados efetivos
        const efetivos = data.filter(p => p.papeis && p.papeis.includes('Associado Efetivo'));
        pessoasParaSelect = efetivos;
        const selPessoa = document.getElementById('inPessoa');
        
        let fisicas = [];
        let juridicas = [];
        
        efetivos.forEach(p => {
            p.displayName = p.nome_curto ? p.nome_curto.trim() : (p.nome_completo ? p.nome_completo.trim() : "Sem Nome");
            
            if (p.tipo_pessoa === 'Jurídica') {
                juridicas.push(p);
            } else {
                fisicas.push(p);
            }
        });
        
        const sortByNome = (a, b) => a.displayName.localeCompare(b.displayName);
        fisicas.sort(sortByNome);
        juridicas.sort(sortByNome);
        
        let htmlFinal = '<option value="">-- Escolha uma pessoa --</option>';
        
        const grupoFisicas = document.createElement('optgroup');
        grupoFisicas.label = "Pessoas Físicas (CPF)";
        fisicas.forEach(p => {
            let docFormatado = formatarDocumento(p.cpf_cnpj);
            let docStr = docFormatado ? ` - ${docFormatado}` : '';
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.displayName}${docStr}`;
            grupoFisicas.appendChild(opt);
        });

        const grupoJuridicas = document.createElement('optgroup');
        grupoJuridicas.label = "Pessoas Jurídicas (CNPJ)";
        juridicas.forEach(p => {
            let docFormatado = formatarDocumento(p.cpf_cnpj);
            let docStr = docFormatado ? ` - ${docFormatado}` : '';
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.displayName}${docStr}`;
            grupoJuridicas.appendChild(opt);
        });
        
        selPessoa.innerHTML = htmlFinal;
        selPessoa.appendChild(grupoFisicas);
        selPessoa.appendChild(grupoJuridicas);
        
        // Listener para popular os papeis
        selPessoa.addEventListener('change', (e) => {
            const pessoaId = e.target.value;
            const selectPapel = document.getElementById('inPapel');
            const groupPapel = document.getElementById('groupPapel');
            selectPapel.innerHTML = '';
            
            if (!pessoaId) {
                groupPapel.style.display = 'none';
                return;
            }
            
            const p = pessoasParaSelect.find(x => x.id == pessoaId);
            const tags = p.papeis || [];
            
            if (tags.length === 0) {
                selectPapel.innerHTML = '<option value="">(Pessoa não possui Tags no cadastro)</option>';
                selectPapel.disabled = true;
                document.getElementById('btnSaveModal').disabled = true;
            } else {
                selectPapel.disabled = false;
                document.getElementById('btnSaveModal').disabled = false;
                tags.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t;
                    opt.textContent = t;
                    selectPapel.appendChild(opt);
                });
            }
            groupPapel.style.display = 'block';
        });
    }
}

async function carregarArvore() {
    document.getElementById('loadingChart').style.display = 'block';
    
    const { data, error } = await db
        .from('vinculos_estrutura')
        .select(`
            id,
            parent_vinculo_id,
            papel,
            pessoas (
                id,
                nome_completo,
                nome_curto,
                papeis
            )
        `)
        .eq('estrutura_id', estruturaId);

    document.getElementById('loadingChart').style.display = 'none';

    if (error) {
        console.error("Erro ao carregar árvore:", error);
        return;
    }

    vinculosGlobais = data || [];
    atualizarSelectParents(vinculosGlobais);
    renderizarGrafico(vinculosGlobais);
}

function atualizarSelectParents(vinculos) {
    const selParent = document.getElementById('inParent');
    selParent.innerHTML = '<option value="">-- Ninguém (Será o topo da Árvore) --</option>';
    vinculos.forEach(v => {
        const nome = v.pessoas?.nome_curto || v.pessoas?.nome_completo || 'Desconhecido';
        selParent.innerHTML += `<option value="${v.id}">${nome} (${v.papel})</option>`;
    });
}

function renderizarGrafico(vinculos) {
    let chartData = vinculos.map(v => {
        return {
            id: v.id,
            parentId: v.parent_vinculo_id || "",
            nome: v.pessoas?.nome_curto || v.pessoas?.nome_completo || "Sem Nome",
            nome_curto: v.pessoas?.nome_curto || v.pessoas?.nome_completo || "Sem Nome",
            papel: v.papel || "Membro",
            pessoa_id: v.pessoas?.id
        };
    });

    const roots = chartData.filter(v => !v.parentId || v.parentId === "");
    if (roots.length > 1) {
        chartData.push({
            id: "virtual-root",
            parentId: "",
            nome: "⚠️ Múltiplos Topos",
            papel: "(Nó Corretivo)",
            isVirtual: true
        });
        roots.forEach(r => r.parentId = "virtual-root");
    }

    const chartContainer = document.getElementById('chartContainer');
    let emptyState = document.getElementById('emptyState');
    
    if (!emptyState) {
        emptyState = document.createElement('div');
        emptyState.id = 'emptyState';
        emptyState.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:#94a3b8; display:none;';
        emptyState.innerHTML = 'Árvore vazia. Clique em "Adicionar Membro" para começar.';
        chartContainer.parentNode.appendChild(emptyState);
    }
    
    if (chartData.length > 0) {
        emptyState.style.display = 'none';
        chartContainer.style.display = 'block';
        
        try {
            if (!chart) {
                chart = new d3.OrgChart()
                    .container('.svg-chart-container')
                    .nodeWidth(d => 250)
                    .initialZoom(0.7)
                    .nodeHeight(d => 120)
                    .childrenMargin(d => 40)
                    .compactMarginBetween(d => 15)
                    .compactMarginPair(d => 80)
                    .nodeUpdate(function(d, i, arr) {
                        d3.select(this)
                          .select('.node-rect')
                          .attr('stroke', d.data._highlighted || d.data._upToTheRootHighlighted ? '#4f46e5' : '#e2e8f0');
                    })
                    .nodeContent(function(d, i, arr, state) {
                        const pessoaId = d.data.pessoa_id;
                        const p = pessoasParaSelect.find(x => x.id == pessoaId);
                        
                        let aviso = '';
                        let nomeCurto = d.data.nome_curto;
                        
                        if (p) {
                            const tags = p.papeis || [];
                            if (!tags.includes(d.data.papel)) {
                                aviso = `<div style="color: #ef4444; font-size: 10px; font-weight: bold; margin-top: 4px; padding: 2px 4px; background: #fee2e2; border-radius: 4px;">⚠️ Requer Revisão (Tag Removida)</div>`;
                            }
                        }
                        const isRoot = !d.parentId;
                        const corBorda = isRoot ? "#4f46e5" : "#3b82f6";
                        const isVirtual = d.data.isVirtual;
                        
                        let deleteBtn = '';
                        if (!isVirtual) {
                            deleteBtn = `
                            <div style="width: 100%; display: flex; justify-content: flex-end; padding: 8px 8px 0 0; margin-bottom: -24px; position: relative; z-index: 100;">
                                <div onclick="event.stopPropagation(); event.preventDefault(); window.excluirVinculo('${d.data.id}');" 
                                     style="cursor: pointer; background: #ef4444; color: white; width: 24px; height: 24px; 
                                            border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); pointer-events: auto;">
                                    🗑️
                                </div>
                            </div>`;
                        }
                        
                        return `
                        <div style="font-family: 'Inter', sans-serif; background-color: #1e293b; 
                                    border: 2px solid ${corBorda}; border-radius: 8px; width: ${d.width}px; height: ${d.height}px; 
                                    display: flex; flex-direction: column; justify-content: flex-start; align-items: center; 
                                    color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); box-sizing: border-box; overflow: hidden;">
                            
                            ${deleteBtn}
                            
                            <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; padding: 0 12px;">
                                <div style="width: 40px; height: 40px; border-radius: 20px; background-color: #0f172a; 
                                            display: flex; align-items: center; justify-content: center; margin-bottom: 8px; border: 1px solid #334155;">
                                    <span style="font-size: 18px;">👤</span>
                                </div>
                                <div style="font-size: 15px; font-weight: 600; text-align: center; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%;">
                                    ${nomeCurto}
                                </div>
                                <div style="font-size: 12px; color: #94a3b8; text-align: center; background: rgba(0,0,0,0.2); padding: 2px 8px; border-radius: 4px; margin-bottom: 4px;">
                                    ${d.data.papel}
                                </div>
                                ${aviso}
                            </div>
                        </div>
                        `;
                    });
            }
            
            chart.data(chartData).render().fit();
        } catch(err) {
            console.error("Erro interno no D3:", err);
            alert("Erro ao montar organograma: " + err.message);
        }
            
    } else {
        emptyState.style.display = 'block';
        chartContainer.style.display = 'none';
    }
}

function setupModal() {
    const modal = document.getElementById('modalVinculo');
    const btnNovo = document.getElementById('btnNovoVinculo');
    const btnClose = document.getElementById('btnCloseModal');
    const btnCancel = document.getElementById('btnCancelModal');
    const form = document.getElementById('formVinculo');
    
    const fecharModal = () => { 
        modal.classList.remove('show'); 
        form.reset(); 
    };
    
    btnNovo.addEventListener('click', () => modal.classList.add('show'));
    btnClose.addEventListener('click', fecharModal);
    btnCancel.addEventListener('click', fecharModal);
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSave = document.getElementById('btnSaveModal');
        btnSave.disabled = true;
        btnSave.textContent = 'Salvando...';
        
        const pessoaId = document.getElementById('inPessoa').value;
        const papel = document.getElementById('inPapel').value;
        const parentId = document.getElementById('inParent').value;
        
        const dados = {
            estrutura_id: estruturaId,
            pessoa_id: pessoaId,
            papel: papel,
            parent_vinculo_id: parentId ? parentId : null
        };
        
        try {
            const { error } = await db.from('vinculos_estrutura').insert([dados]);
            if (error) throw error;
            
            fecharModal();
            carregarArvore(); // Recarrega o D3
        } catch (error) {
            console.error('Erro ao salvar vinculo:', error);
            alert('Erro ao salvar. Verifique se a pessoa já está vinculada neste mesmo nível ou verifique o console.');
        } finally {
            btnSave.disabled = false;
            btnSave.textContent = 'Salvar Vínculo';
        }
    });
}

window.excluirVinculo = async (id) => {
    if (!confirm("Tem certeza que deseja remover esta pessoa da árvore?")) return;
    
    try {
        const { error } = await db.from('vinculos_estrutura').delete().eq('id', id);
        if (error) throw error;
        
        carregarArvore(); // Recarrega o D3
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir. Tente novamente.');
    }
};
