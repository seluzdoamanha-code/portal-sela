const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let pessoasGlobais = [];
let pessoaEditandoId = null;
let cameFromProfileEdit = false;

document.addEventListener('DOMContentLoaded', async () => {
    // Configura as Tags Dinâmicas primeiro
    await window.renderizarTagsDisponiveis();

    carregarPessoas();
    setupModal();
    
    // Lógica Unificada de Busca, Filtro e Ordenação
    const filterSearch = document.getElementById('searchInput');
    const filterTag = document.getElementById('filterTag');
    const sortOrder = document.getElementById('sortOrder');
    
    // Checkboxes de filtros de papel
    const chkOutros = document.getElementById('showOutros');

    if(filterSearch) filterSearch.addEventListener('input', window.aplicarFiltros);
    if(filterTag) filterTag.addEventListener('change', window.aplicarFiltros);
    if(sortOrder) sortOrder.addEventListener('change', window.aplicarFiltros);
    
    if(chkOutros) chkOutros.addEventListener('change', window.aplicarFiltros);
    
    // ==========================================
    // VITRINE DE EVENTOS GLOBAIS
    // ==========================================
    async function carregarEventosGlobais() {
        const containerVitrine = document.getElementById('vitrineEventos');
        const listaEventos = document.getElementById('listaEventosGlobais');
        
        if (!containerVitrine || !listaEventos) return;
        
        try {
            const hojeIso = new Date().toISOString();
            
            const { data, error } = await db
                .from('agenda')
                .select('*, estruturas(nome)')
                .eq('visibilidade', 'Global')
                .gte('data_hora_inicio', hojeIso)
                .order('data_hora_inicio', { ascending: true })
                .limit(3);
                
            if (error) throw error;
            
            if (data && data.length > 0) {
                containerVitrine.style.display = 'flex';
                
                let html = '';
                data.forEach(ev => {
                    const dataInicio = new Date(ev.data_hora_inicio);
                    const dataFormatada = dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
                    const evDia = dataInicio.toLocaleDateString('pt-BR', { day: '2-digit' });
                    const evMes = dataInicio.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();
                    const horaFormatada = dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const organizador = ev.estruturas ? ev.estruturas.nome : 'Portal SELA';
                    
                    html += `
                    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; padding: 12px; display: flex; gap: 12px; align-items: center;">
                        <div style="background: #ef4444; color: var(--text-main); border-radius: 6px; padding: 6px 10px; text-align: center; min-width: 55px;">
                            <div style="font-weight: bold; font-size: 16px;">${evDia}</div>
                            <div style="font-size: 11px; text-transform: uppercase;">${evMes}</div>
                        </div>
                        <div>
                            <div style="font-weight: 600; color: var(--text-main); font-size: 14px;">${ev.titulo}</div>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${organizador} | ⏰ ${horaFormatada} ${ev.local ? `| 📍 ${ev.local}` : ''}</div>
                        </div>
                    </div>
                    `;
                });
                
                listaEventos.innerHTML = html;
            } else {
                containerVitrine.style.display = 'none';
            }
        } catch (err) {
            console.warn('Tabela agenda ainda não criada ou erro:', err);
        }
    }
    
    // Carrega Vitrine de Eventos Globais
    carregarEventosGlobais();
});

window.aplicarFiltros = () => {
    try {
        const inputSearch = document.getElementById('searchInput');
        const filterTag = document.getElementById('filterTag');
        const sortOrder = document.getElementById('sortOrder');
        
        const termoOriginal = (inputSearch ? inputSearch.value : '').toLowerCase();
        const termoNumeros = termoOriginal.replace(/\D/g, '');
        const tagSelecionada = filterTag ? filterTag.value : '';
        const ordem = sortOrder ? sortOrder.value : 'nome_az';
        
        // 1. Filtrar
        let filtrados = pessoasGlobais.filter(p => {
            const docLimpo = p.cpf_cnpj ? p.cpf_cnpj.replace(/\D/g, '') : '';
            
            const nomeStr = (p.nome_completo || '').toLowerCase();
            const nomeCurtoStr = (p.nome_curto || '').toLowerCase();
            
            const achouPorNome = nomeStr.includes(termoOriginal) || nomeCurtoStr.includes(termoOriginal);
                                 
            const achouPorCpf = termoNumeros.length > 0 && docLimpo && docLimpo.includes(termoNumeros);
            
            const matchBusca = achouPorNome || achouPorCpf;
            
            let matchTag = true;
            if (tagSelecionada) {
                if (tagSelecionada === 'Física' || tagSelecionada === 'Jurídica') {
                    matchTag = p.tipo_pessoa === tagSelecionada;
                } else {
                    matchTag = p.papeis && p.papeis.includes(tagSelecionada);
                }
            }
            
            return matchBusca && matchTag;
        });
        
        // Filtra papéis que estão desmarcados nas caixas de seleção
        const showOutros = document.getElementById('showOutros');

        filtrados = filtrados.filter(p => {
            if (!p.papeis) return true;
            
            // Se a tag selecionada no Dropdown for EXATAMENTE uma dessas, nós ignoramos a checkbox
            // para não dar conflito (ex: o usuário escolhe "Estudante" no dropdown, ele quer ver os estudantes)
            if (tagSelecionada === 'Estudante' || tagSelecionada === 'Membro da Família' || tagSelecionada === 'Palestrante') {
                return true;
            }

            const papeisUpper = String(p.papeis).toUpperCase();
            
            if (showOutros && showOutros.checked === false && papeisUpper.includes('OUTRO')) return false;
            
            return true;
        });

        // 2. Ordenar
        if (ordem === 'nome_az') {
            filtrados.sort((a, b) => (a.nome_completo || '').localeCompare(b.nome_completo || ''));
        } else if (ordem === 'nome_za') {
            filtrados.sort((a, b) => (b.nome_completo || '').localeCompare(a.nome_completo || ''));
        } else if (ordem === 'recentes') {
            filtrados.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        }

        // 3. Atualizar Resumo Quantitativo (Stats Ribbon)
        const countFisica = filtrados.filter(p => p.tipo_pessoa === 'Física').length;
        const countJuridica = filtrados.filter(p => p.tipo_pessoa === 'Jurídica').length;
        
        document.getElementById('statTotal').textContent = filtrados.length;
        document.getElementById('statFisica').textContent = countFisica;
        document.getElementById('statJuridica').textContent = countJuridica;
        document.getElementById('statsRibbon').style.display = 'flex';

        renderizarTabela(filtrados);
    } catch (err) {
        console.error("Erro no aplicarFiltros:", err);
    }
};

async function carregarPessoas() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('tableContainer').style.display = 'none';
    
    const { data, error } = await db.from('pessoas').select('*').order('nome_completo');
    
    if (error) {
        document.getElementById('loadingState').textContent = 'Erro ao carregar: ' + error.message;
        return;
    }
    
    pessoasGlobais = data || [];
    
    if (pessoasGlobais.length === 0) {
        document.getElementById('loadingState').textContent = 'Nenhuma pessoa/entidade cadastrada ainda.';
    } else {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('tableContainer').style.display = 'block';
        pessoasGlobais = data;
        window.aplicarFiltros(); // Usa a lógica unificada em vez de renderizar direto
        
        // Verifica se há pedido de edição via URL
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');
        if (editId) {
            cameFromProfileEdit = true;
            window.editarPessoa(editId);
            // Limpa a URL silenciosamente para não reabrir se ele der F5
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

function formatarDocumento(v) {
    if (!v) return '';
    v = v.replace(/\D/g, '');
    if (v.length > 0 && v.length <= 11) {
        v = v.padStart(11, '0');
        return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (v.length > 11 && v.length <= 14) {
        v = v.padStart(14, '0');
        return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return v;
}

function formatarCelular(v) {
    if (!v) return '';
    v = v.replace(/\D/g, '');
    if (v.length <= 10) {
        return v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

function formatarCEP(v) {
    if (!v) return '';
    v = v.replace(/\D/g, '');
    if (v.length > 8) v = v.slice(0, 8);
    if (v.length >= 5) {
        return v.replace(/(\d{5})(\d{1,3})/, "$1-$2");
    }
    return v;
}

function renderizarTabela(dados) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    dados.forEach(pessoa => {
        // Criar uma cópia e remover duplicatas para evitar mutação do estado original
        let tags = Array.from(new Set(pessoa.papeis || []));
        
        // Remove 'Empresa' solto se existir, para não duplicar com a tag formatada
        tags = tags.filter(t => t !== 'Empresa' && t !== '🏢 Empresa');
        
        // Se for PJ, adiciona tag automática visual
        if (pessoa.tipo_pessoa === 'Jurídica') tags.unshift('🏢 Empresa');
        
        const tagsHtml = tags.map(tag => `<span style="background: rgba(79,70,229,0.2); color: #818cf8; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 4px; white-space: nowrap; display: inline-block; margin-bottom: 4px;">${tag}</span>`).join('');
        
        // Gerar Avatar em miniatura
        let avatarHtml = '';
        if (pessoa.foto_url) {
            avatarHtml = `<img src="${pessoa.foto_url}" style="width: 32px; height: 32px; border-radius: 16px; object-fit: cover; flex-shrink: 0;">`;
        } else {
            const partes = pessoa.nome_completo.trim().split(' ');
            let iniciais = partes[0].charAt(0);
            if (partes.length > 1) iniciais += partes[partes.length - 1].charAt(0);
            
            const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];
            const colorIndex = pessoa.nome_completo.length % colors.length;
            avatarHtml = `<div style="width: 32px; height: 32px; border-radius: 16px; background: ${colors[colorIndex]}; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0;">${iniciais.toUpperCase()}</div>`;
        }
        
        // Status Icon
        const isAtivo = pessoa.status !== 'Inativo' && pessoa.status !== 'Inativa' && pessoa.status !== false;
        const statusIcon = isAtivo 
            ? `<span style="display: inline-block; width: 10px; height: 10px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 6px rgba(34, 197, 94, 0.6); margin-right: 6px;" title="Ativo"></span>` 
            : `<span style="display: inline-block; width: 10px; height: 10px; background: #9ca3af; border-radius: 50%; margin-right: 6px;" title="Inativo"></span>`;

        tbody.innerHTML += `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        ${avatarHtml}
                        <div>
                            <div style="font-weight: 500; display: flex; align-items: center;">${statusIcon} ${pessoa.nome_curto || pessoa.nome_completo}</div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                                <span style="opacity: 0.7;">${pessoa.nome_completo !== pessoa.nome_curto ? pessoa.nome_completo : ''}</span> 
                                ${pessoa.cpf_cnpj ? `• ${formatarDocumento(pessoa.cpf_cnpj)}` : ''}
                            </div>
                        </div>
                    </div>
                </td>
                <td>${tagsHtml}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px; white-space: nowrap;">
                        ${pessoa.celular ? `
                            <a href="https://wa.me/55${pessoa.celular.replace(/\D/g,'')}" target="_blank" style="color: #25D366; text-decoration: none; display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                                </svg>
                                ${formatarCelular(pessoa.celular)}
                            </a>
                        ` : '<span style="color:#94a3b8;">-</span>'}
                    </div>
                </td>
                <td style="text-align: right;">
                    <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center;">
                        ${(typeof window.podeEditarPessoas === 'function' && window.podeEditarPessoas()) ? `
                        <button onclick="editarPessoa('${pessoa.id}')" style="background: rgba(255,255,255,0.05); color: var(--text-main); border: 1px solid var(--border); border-radius: 6px; padding: 6px 12px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                            Editar
                        </button>
                        <button onclick="excluirPessoa('${pessoa.id}')" style="background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); border-radius: 6px; padding: 6px 12px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap;" onmouseover="this.style.background='rgba(239,68,68,0.2)'" onmouseout="this.style.background='rgba(239,68,68,0.1)'">
                            Excluir
                        </button>
                        ` : ''}
                        <a href="perfil.html?id=${pessoa.id}" style="background: var(--primary); color: #fff; border: 1px solid var(--primary); border-radius: 6px; padding: 6px 16px; font-size: 13px; font-weight: 500; cursor: pointer; text-decoration: none; transition: all 0.2s; white-space: nowrap; box-shadow: 0 2px 4px rgba(79,70,229,0.3);" onmouseover="this.style.filter='brightness(1.1)'" onmouseout="this.style.filter='none'">
                            Perfil
                        </a>
                    </div>
                </td>
            </tr>
        `;
    });
}

function setupModal() {
    const modal = document.getElementById('modalPessoa');
    const btnNovo = document.getElementById('btnNovaPessoa');
    if (typeof window.podeEditarPessoas === 'function' && !window.podeEditarPessoas()) {
        if (btnNovo) btnNovo.style.display = 'none';
    }
    const btnClose = document.getElementById('btnCloseModal');
    const btnCancel = document.getElementById('btnCancelModal');
    const form = document.getElementById('formPessoa');
    const inTipo = document.getElementById('inTipo');
    const lblCpfCnpj = document.getElementById('lblCpfCnpj');
    const lblNome = document.getElementById('lblNome');
    const lblNomeCurto = document.getElementById('lblNomeCurto');
    const inputCpfCnpj = document.getElementById('inCpfCnpj');
    
    // Elemento para mostrar o erro
    const erroCpf = document.createElement('div');
    erroCpf.style.color = '#ef4444';
    erroCpf.style.fontSize = '12px';
    erroCpf.style.marginTop = '4px';
    erroCpf.style.display = 'none';
    inputCpfCnpj.parentNode.appendChild(erroCpf);
    
    let isCpfValido = true;
    
    const fecharModal = () => { 
        modal.classList.remove('show'); 
        form.reset(); 
        erroCpf.style.display = 'none';
        isCpfValido = true;
        pessoaEditandoId = null;
    };
    
    btnNovo.addEventListener('click', () => {
        if(window.switchTab) window.switchTab('basico');
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.textContent = 'Nova Pessoa/Entidade';
        modal.classList.add('show');
    });
    btnClose.addEventListener('click', fecharModal);
    btnCancel.addEventListener('click', fecharModal);
    
    inTipo.addEventListener('change', (e) => {
        inputCpfCnpj.value = ''; // Limpa ao trocar
        erroCpf.style.display = 'none';
        isCpfValido = true;
        
        if (e.target.value === 'Jurídica') {
            lblCpfCnpj.textContent = 'CNPJ';
            lblNome.textContent = 'Razão Social';
            lblNomeCurto.textContent = 'Nome Fantasia';
            document.getElementById('inCpfCnpj').maxLength = 18;
        } else {
            lblCpfCnpj.textContent = 'CPF';
            lblNome.textContent = 'Nome Completo';
            lblNomeCurto.textContent = 'Nome de Tratamento (Nome Curto)';
            document.getElementById('inCpfCnpj').maxLength = 14;
        }
    });
    
    // Máscara e Verificação de Duplicidade dinâmica
    let timeoutBusca;
    inputCpfCnpj.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        
        if (inTipo.value === 'Jurídica') {
            if (v.length > 14) v = v.slice(0, 14);
            v = v.replace(/^(\d{2})(\d)/, "$1.$2");
            v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
            v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
            v = v.replace(/(\d{4})(\d)/, "$1-$2");
        } else {
            if (v.length > 11) v = v.slice(0, 11);
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
            v = v.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/, "$1.$2.$3-$4");
        }
        e.target.value = v;
        
        // Timer para buscar no banco após o usuário parar de digitar por 500ms
        clearTimeout(timeoutBusca);
        const docLimpo = e.target.value.replace(/\D/g, '');
        
        if (docLimpo.length >= 11) {
            timeoutBusca = setTimeout(async () => {
                const { data } = await db.from('pessoas').select('id, nome_completo').eq('cpf_cnpj', docLimpo).neq('id', pessoaEditandoId || '').single();
                if (data) {
                    erroCpf.textContent = `⚠️ Este ${inTipo.value === 'Jurídica' ? 'CNPJ' : 'CPF'} já está cadastrado para: ${data.nome_completo}`;
                    erroCpf.style.display = 'block';
                    isCpfValido = false;
                    document.getElementById('btnSaveModal').disabled = true;
                } else {
                    erroCpf.style.display = 'none';
                    isCpfValido = true;
                    document.getElementById('btnSaveModal').disabled = false;
                }
            }, 500);
        } else {
            erroCpf.style.display = 'none';
            isCpfValido = true;
            document.getElementById('btnSaveModal').disabled = false;
        }
    });
    
    // Máscara de Celular
    document.getElementById('inCelular').addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 11) val = val.slice(0, 11);
        if (val.length > 2) val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
        if (val.length > 10) val = `${val.slice(0, 10)}-${val.slice(10)}`;
        e.target.value = val;
    });

    document.getElementById('inCep').addEventListener('input', (e) => {
        e.target.value = formatarCEP(e.target.value);
    });

    document.getElementById('inEstado').addEventListener('input', (e) => {
        let val = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();
        if (val.length > 2) val = val.slice(0, 2);
        e.target.value = val;
    });
    
    // --- FUNCOES UTILITARIAS ---

    // O listener continua sem a funcao utilitaria local
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!isCpfValido) return; 
        
        const btnSave = document.getElementById('btnSaveModal');
        btnSave.disabled = true;
        btnSave.textContent = 'Salvando...';
        
        const cpf_cnpj = inputCpfCnpj.value ? inputCpfCnpj.value.replace(/\D/g, '') : null;
        const nome_completo = document.getElementById('inNome').value.trim();
        const nome_curto = document.getElementById('inNomeCurto').value.trim();
        const tipo_pessoa = document.getElementById('inTipo').value;
        const celular = document.getElementById('inCelular').value.replace(/\D/g, '') || null;
        const email = document.getElementById('inEmail').value.trim();
        
        const status = document.getElementById('inStatus').value || 'Ativo';
        const data_nascimento = document.getElementById('inNascimento').value || null;
        const sexo = document.getElementById('inSexo').value || null;
        const naturalidade = document.getElementById('inNaturalidade').value || null;
        const nacionalidade = document.getElementById('inNacionalidade').value || null;
        const nome_mae = document.getElementById('inNomeMae').value || null;
        const nome_pai = document.getElementById('inNomePai').value || null;
        const estado_civil = document.getElementById('inEstadoCivil').value || null;
        const profissao = document.getElementById('inProfissao').value || null;
        
        const cep = document.getElementById('inCep').value.replace(/\D/g, '') || null;
        const endereco = document.getElementById('inEndereco').value || null;
        const bairro = document.getElementById('inBairro').value || null;
        const cidade = document.getElementById('inCidade').value || null;
        const estado = document.getElementById('inEstado').value || null;
        
        // Coleta tags selecionadas
        const papeis = Array.from(document.querySelectorAll('input[name="papeis"]:checked')).map(cb => cb.value);

        const dados = {
            cpf_cnpj, nome_completo, nome_curto, tipo_pessoa, celular, email, papeis,
            status, data_nascimento, sexo, naturalidade, nacionalidade, nome_mae, nome_pai, estado_civil, profissao,
            cep, endereco, bairro, cidade, estado
        };
        
        try {
            // Verifica se tem foto para upload
            const inputFoto = document.getElementById('inFoto');
            if (inputFoto.files && inputFoto.files.length > 0) {
                const file = inputFoto.files[0];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await db.storage
                    .from('fotos_perfil')
                    .upload(filePath, file);

                if (uploadError) {
                    throw uploadError;
                }

                // Pega a URL publica
                const { data: publicUrlData } = db.storage
                    .from('fotos_perfil')
                    .getPublicUrl(filePath);

                dados.foto_url = publicUrlData.publicUrl;
            }
            if (pessoaEditandoId) {
                const { error } = await db.from('pessoas').update(dados).eq('id', pessoaEditandoId);
                if (error) throw error;
            } else {
                const { error } = await db.from('pessoas').insert([dados]);
                if (error) throw error;
            }
            
            fecharModal();
            
            if (cameFromProfileEdit && pessoaEditandoId) {
                window.location.href = `perfil.html?id=${pessoaEditandoId}`;
            } else {
                carregarPessoas();
            }
        } catch (error) {
            console.error('Erro ao salvar pessoa:', error);
            alert('Erro ao salvar os dados: ' + JSON.stringify(error));
        } finally {
            btnSave.disabled = false;
            btnSave.textContent = 'Salvar Cadastro';
        }
    });
}

window.editarPessoa = async (id) => {
    // Reset tabs
    if(window.switchTab) window.switchTab('basico');

    const pessoa = pessoasGlobais.find(p => p.id === id);
    if (!pessoa) return;
    
    pessoaEditandoId = id;
    
    const modal = document.getElementById('modalPessoa');
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Editar Pessoa/Entidade';
    
    document.getElementById('inTipo').value = pessoa.tipo_pessoa || 'Física';
    document.getElementById('inTipo').dispatchEvent(new Event('change'));
    
    document.getElementById('inCpfCnpj').value = formatarDocumento(pessoa.cpf_cnpj) || '';
    document.getElementById('inNome').value = pessoa.nome_completo || '';
    document.getElementById('inNomeCurto').value = pessoa.nome_curto || '';
    document.getElementById('inCelular').value = pessoa.celular || '';
    document.getElementById('inEmail').value = pessoa.email || '';
    document.getElementById('inEmail').value = pessoa.email || '';
    
    document.getElementById('inStatus').value = pessoa.status || 'Ativo';
    document.getElementById('inNascimento').value = pessoa.data_nascimento || '';
    document.getElementById('inSexo').value = pessoa.sexo || '';
    document.getElementById('inNaturalidade').value = pessoa.naturalidade || '';
    document.getElementById('inNacionalidade').value = pessoa.nacionalidade || '';
    document.getElementById('inNomeMae').value = pessoa.nome_mae || '';
    document.getElementById('inNomePai').value = pessoa.nome_pai || '';
    document.getElementById('inEstadoCivil').value = pessoa.estado_civil || '';
    document.getElementById('inProfissao').value = pessoa.profissao || '';
    
    document.getElementById('inCep').value = formatarCEP(pessoa.cep) || '';
    document.getElementById('inEndereco').value = pessoa.endereco || '';
    document.getElementById('inBairro').value = pessoa.bairro || '';
    document.getElementById('inCidade').value = pessoa.cidade || '';
    document.getElementById('inEstado').value = (pessoa.estado || '').toUpperCase();

    document.getElementById('inFoto').value = ''; // Limpa o input de arquivo
    
    // Marcar as tags corretas
    const papeis = pessoa.papeis || [];
    document.querySelectorAll('input[name="papeis"]').forEach(cb => {
        cb.checked = papeis.includes(cb.value);
    });
    
    // Forçar a máscara logo após preencher (caso venha do banco sem formatação)
    const event = new Event('input');
    document.getElementById('inCelular').dispatchEvent(event);
    
    modal.classList.add('show');
};

window.excluirPessoa = async (id) => {
    const pessoa = pessoasGlobais.find(p => p.id === id);
    if (confirm(`Tem certeza que deseja excluir ${pessoa.nome_curto || pessoa.nome_completo}?`)) {
        try {
            const { error } = await db.from('pessoas').delete().eq('id', id);
            if (error) throw error;
            carregarPessoas();
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert('Não foi possível excluir. Verifique se a pessoa já possui vínculos no sistema.');
        }
    }
};

window.renderizarTagsDisponiveis = async () => {
    let TAGS = [
        "Presidente", "Vice-Presidente", "Secretário", "Tesoureiro", 
        "Conselheiro", "Diretor", "Coordenador", "Associado Efetivo", 
        "Associado Proponente", "Ex-Associado", "Voluntário", "Colaborador(a)", 
        "Palestrante", "Evangelizando", "Estudante", "Assistido(a)", "Paciente", 
        "Membro da Família", "Empresa Parceira", "Parceiro", "Fornecedor", 
        "Passista", "Líder", "Outros"
    ];

    try {
        const { data, error } = await db.from('configuracoes').select('valor').eq('chave', 'perfis_pessoas').single();
        if (data && data.valor) {
        TAGS = data.valor.split(',').map(s => s.trim()).filter(s => s !== '');
        }
    } catch(err) {
        console.log("Usando tags default");
    }
    
    // Sort logic as requested: 1. Associado Efetivo, 2. Outros, 3. Resto alfabeticamente
    let specialTags = [];
    if (TAGS.includes('Associado Efetivo')) { specialTags.push('Associado Efetivo'); }
    if (TAGS.includes('Outros')) { specialTags.push('Outros'); }
    
    let otherTags = TAGS.filter(t => t !== 'Associado Efetivo' && t !== 'Outros').sort((a, b) => a.localeCompare(b));
    TAGS = [...specialTags, ...otherTags];

    const container = document.getElementById('tagsCheckboxContainer');
    if (container) {
        container.innerHTML = TAGS.map(tag => `
            <label class="tag-checkbox tag-checkbox-ui">
                <input type="checkbox" name="papeis" value="${tag}">
                <span>${tag}</span>
            </label>
        `).join('');
    }
    
    // Atualiza o select de filtro (pessoas.html)
    const filterTag = document.getElementById('filterTag');
    if (filterTag) {
        // Mantém as opções fixas iniciais e limpa o resto
        while (filterTag.options.length > 4) {
            filterTag.remove(4);
        }
        // Adiciona as tags organizadas em ordem alfabética
        const sortedTags = [...TAGS].sort((a, b) => a.localeCompare(b));
        sortedTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            filterTag.appendChild(option);
        });
    }

    // Logica de Busca das Tags
    const searchInput = document.getElementById('tagSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase();
            const labels = container.querySelectorAll('.tag-checkbox');
            labels.forEach(lbl => {
                const texto = lbl.textContent.toLowerCase();
                lbl.style.display = texto.includes(termo) ? 'flex' : 'none';
            });
        });
    }
};

// Global switchTab function
window.switchTab = function(tabId, event) {
    if (event) event.preventDefault();
    
    // Deactivate all contents
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    // Deactivate all buttons
    document.querySelectorAll('.modal-tab-btn').forEach(el => el.classList.remove('active'));
    
    // Activate requested tab
    const content = document.getElementById('tab-' + tabId);
    if (content) content.classList.add('active');
    
    // Activate button
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    } else {
        const btn = document.querySelector(`.modal-tab-btn[onclick*="${tabId}"]`);
        if (btn) btn.classList.add('active');
    }
};

window.renderizarTagsDisponiveis();
