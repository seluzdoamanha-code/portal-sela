const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let loggedUserPessoaId = null;
let loggedUserEmail = null;

try {
    const profStr = localStorage.getItem('sela_user_profile');
    if (profStr) {
        const prof = JSON.parse(profStr);
        loggedUserEmail = prof.email;
        loggedUserPessoaId = prof.pessoa_id;
    }
} catch(e) {}

let todosTemplates = [];
let todasPessoas = [];
let todasAssinaturas = [];
let abaAtiva = 'visao_geral';

// Helper para parsear e normalizar status/metadados JSON
function parseMeta(rawStatus) {
    if (!rawStatus) {
        return {
            situacao: 'Pendente',
            assinado_associado: false,
            assinado_luz_amanha: false,
            emissao_doc: false,
            data_emissao: null,
            arquivo_original_url: '',
            observacoes: ''
        };
    }
    if (typeof rawStatus === 'object') return rawStatus;
    if (typeof rawStatus === 'string' && rawStatus.trim().startsWith('{')) {
        try {
            return JSON.parse(rawStatus);
        } catch(e) {
            console.warn("Erro ao fazer parse de status JSON:", e);
        }
    }
    // Fallback legado para status simples ('Pendente', 'Enviado', 'Aprovado')
    return {
        situacao: rawStatus,
        assinado_associado: rawStatus === 'Enviado' || rawStatus === 'Aprovado',
        assinado_luz_amanha: rawStatus === 'Aprovado',
        emissao_doc: true,
        data_emissao: null,
        arquivo_original_url: '',
        observacoes: ''
    };
}

function stringifyMeta(meta) {
    return JSON.stringify(meta);
}

document.addEventListener('DOMContentLoaded', async () => {
    // Buscar o pessoa_id do usuário logado baseado no email caso não tenha vindo do auth_guard
    if (!loggedUserPessoaId && loggedUserEmail) {
        const { data: pData } = await db.from('pessoas').select('id, nome_completo, email, perfis').eq('email', loggedUserEmail).single();
        if (pData) {
            loggedUserPessoaId = pData.id;
        }
    }

    if (!loggedUserPessoaId) {
        console.warn("Usuário logado sem pessoa_id explícito; carregando dados gerais.");
    }

    // Adicionar listener para pesquisa no diretório
    const searchInput = document.getElementById('searchAssociados');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderizarDiretorio(e.target.value);
        });
    }

    // Form envio de assinatura do usuário
    const formAssinatura = document.getElementById('formEnvioAssinatura');
    if (formAssinatura) {
        formAssinatura.addEventListener('submit', salvarAssinatura);
    }

    await carregarDadosAssociados();
});

let relacoesInicializado = false;

window.trocarAbaAssociado = function(aba) {
    abaAtiva = aba;
    document.querySelectorAll('.tab-btn-assoc').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content-assoc').forEach(content => content.classList.remove('active'));

    if (aba === 'inicio') {
        const btn = document.getElementById('tabBtnInicio');
        const content = document.getElementById('tabInicio');
        if (btn) btn.classList.add('active');
        if (content) content.classList.add('active');
    } else if (aba === 'visao_geral') {
        const btn = document.getElementById('tabBtnVisaoGeral');
        const content = document.getElementById('tabVisaoGeral');
        if (btn) btn.classList.add('active');
        if (content) content.classList.add('active');
    } else if (aba === 'relacoes') {
        const btn = document.getElementById('tabBtnRelacoes');
        const content = document.getElementById('tabRelacoes');
        if (btn) btn.classList.add('active');
        if (content) content.classList.add('active');

        if (!relacoesInicializado && window.RelacoesOrganograma) {
            relacoesInicializado = true;
            window.RelacoesOrganograma.init('containerRelacoesAssociados', db);
        }
    } else if (aba === 'gestao_documentos') {
        const btn = document.getElementById('tabBtnGestaoDocs');
        const content = document.getElementById('tabGestaoDocs');
        if (btn) btn.classList.add('active');
        if (content) content.classList.add('active');
        renderizarGestaoDocumentos();
    }
};

async function carregarDadosAssociados() {
    try {
        // 1. Carregar Templates de Documentos
        const { data: templates, error: errTpl } = await db.from('app_assoc_documentos_templates').select('*').order('titulo', { ascending: true });
        if (errTpl) throw errTpl;
        todosTemplates = templates || [];

        // 2. Carregar Assinaturas de Todos os Usuários
        const { data: assinaturas, error: errAss } = await db.from('app_assoc_documentos_usuarios').select('*');
        if (errAss) throw errAss;
        todasAssinaturas = assinaturas || [];

        // Assinaturas do usuário logado
        const assinaturasUser = loggedUserPessoaId ? todasAssinaturas.filter(a => a.pessoa_id === loggedUserPessoaId) : [];

        // Renderizar Cards da Aba 1 (Meu Portal)
        renderizarMeusDocumentos(assinaturasUser);
        renderizarBibliotecaOficial();

        // 3. Carregar Diretório (Todos os Associados)
        const { data: pessoas, error: errPes } = await db.from('pessoas').select('*, vinculos_estrutura(estruturas(nome, tipo))').order('nome_completo', { ascending: true });
        if (errPes) throw errPes;

        // Filtra estritamente apenas membros 'Associado Efetivo' e 'Associado Proponente'
        todasPessoas = (pessoas || []).filter(p => {
            if (!p.perfis) return false;
            const perfisArr = Array.isArray(p.perfis) ? p.perfis : (typeof p.perfis === 'string' ? p.perfis.split(',').map(s=>s.trim()) : []);
            return perfisArr.some(pf => {
                const pfClean = pf.trim().toLowerCase();
                return pfClean === 'associado efetivo' || pfClean === 'associado proponente';
            });
        });

        renderizarDiretorio();

        // Renderizar Aba 2 (Gestão Documental)
        renderizarGestaoDocumentos();

    } catch (e) {
        console.error("Erro ao carregar portal do associado:", e);
        if (window.Swal) {
            Swal.fire('Erro', 'Erro ao carregar dados do portal do associado: ' + e.message, 'error');
        } else {
            alert("Erro ao carregar dados: " + e.message);
        }
    }
}

// ==========================================
// ABA 1: MEUS DOCUMENTOS E BIBLIOTECA
// ==========================================

function renderizarMeusDocumentos(assinaturasUser) {
    const lista = document.getElementById('listaMeusDocumentos');
    if (!lista) return;
    lista.innerHTML = '';

    const templatesAssinatura = todosTemplates.filter(t => t.tipo === 'Assinatura');

    if (templatesAssinatura.length === 0) {
        lista.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Nenhum documento requer assinatura no momento.</div>';
        return;
    }

    templatesAssinatura.forEach(tpl => {
        const assinou = assinaturasUser.find(a => a.template_id === tpl.id);
        const meta = assinou ? parseMeta(assinou.status) : parseMeta(null);

        let statusBadge = '<span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">🟡 Pendente</span>';
        let actionBtn = `<button class="btn btn-primary" onclick="abrirModalAssinatura('${tpl.id}', '${tpl.titulo.replace(/'/g, "\\'")}')" style="font-size: 12px; padding: 6px 14px;">Assinar / Enviar</button>`;

        if (meta.situacao === 'Aprovado' || (meta.assinado_associado && meta.assinado_luz_amanha)) {
            statusBadge = '<span style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">🟢 Regularizado & Aprovado</span>';
            const linkArq = assinou.arquivo_url || meta.arquivo_original_url;
            actionBtn = linkArq ? 
                `<a href="${linkArq}" target="_blank" class="btn btn-secondary" style="font-size: 12px; padding: 6px 14px; text-decoration: none;">Ver Original Assinado ↗</a>` : 
                `<span style="font-size: 12px; color: var(--text-muted);">Assinado</span>`;
        } else if (meta.situacao === 'Enviado' || assinou) {
            let descFalta = [];
            if (!meta.assinado_associado) descFalta.push("Sua assinatura");
            if (!meta.assinado_luz_amanha) descFalta.push("Assinatura da Diretoria");
            const faltaTxt = descFalta.length > 0 ? ` (Falta: ${descFalta.join(', ')})` : '';

            statusBadge = `<span style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">🔵 Em Andamento${faltaTxt}</span>`;
            actionBtn = `<button class="btn btn-secondary" onclick="abrirModalAssinatura('${tpl.id}', '${tpl.titulo.replace(/'/g, "\\'")}')" style="font-size: 12px; padding: 6px 14px;">Atualizar Envio</button>`;
        }

        const linkBranco = tpl.link_externo ? 
            `<a href="${tpl.link_externo}" target="_blank" style="font-size: 12px; color: var(--primary); text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">📥 Baixar Modelo em Branco</a>` : 
            `<span style="font-size: 12px; color: var(--text-muted);">Modelo disponível para leitura</span>`;

        const div = document.createElement('div');
        div.style.cssText = 'background: var(--bg-panel); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;';
        div.innerHTML = `
            <div style="flex: 1; min-width: 200px;">
                <div style="font-weight: 600; font-size: 14px; color: var(--text-main); margin-bottom: 6px;">${tpl.titulo}</div>
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    ${statusBadge}
                    ${linkBranco}
                </div>
            </div>
            <div>
                ${actionBtn}
            </div>
        `;
        lista.appendChild(div);
    });
}

function renderizarBibliotecaOficial() {
    const lista = document.getElementById('listaBibliotecaOficial');
    if (!lista) return;
    lista.innerHTML = '';

    const templatesLeitura = todosTemplates.filter(t => t.tipo === 'Leitura');

    if (templatesLeitura.length === 0) {
        lista.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Estatuto Social e Regimento Interno disponíveis na Secretaria.</div>';
        return;
    }

    templatesLeitura.forEach(tpl => {
        const div = document.createElement('div');
        div.style.cssText = 'background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.2s;';
        div.onmouseover = () => div.style.borderColor = 'var(--primary)';
        div.onmouseout = () => div.style.borderColor = 'var(--border)';
        div.onclick = () => abrirModalDocumento(tpl.id);

        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">📖</span>
                <span style="font-weight: 600; font-size: 14px; color: var(--text-main);">${tpl.titulo}</span>
            </div>
            <div style="color: var(--primary); font-size: 12px; font-weight: 500;">Ler Documento &rarr;</div>
        `;
        lista.appendChild(div);
    });
}

function renderizarDiretorio(filtro = '') {
    const lista = document.getElementById('listaDiretorio');
    if (!lista) return;
    lista.innerHTML = '';
    
    const termo = filtro.toLowerCase();
    const filtrados = todasPessoas.filter(p => p.nome_completo.toLowerCase().includes(termo) || (p.email && p.email.toLowerCase().includes(termo)));

    if (filtrados.length === 0) {
        lista.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Nenhum associado encontrado.</div>';
        return;
    }

    filtrados.forEach(p => {
        let depts = [];
        if (p.vinculos_estrutura && p.vinculos_estrutura.length > 0) {
            depts = p.vinculos_estrutura.map(v => v.estruturas?.nome).filter(Boolean);
            depts = [...new Set(depts)];
        }
        
        let tagsDepts = depts.map(d => `<span style="background: rgba(0,0,0,0.05); padding: 2px 8px; border-radius: 4px; font-size: 11px; color: var(--text-muted); white-space: nowrap;">${d}</span>`).join(' ');

        let btnZap = '';
        if (p.celular) {
            const zap = p.celular.replace(/\D/g, '');
            btnZap = `<a href="https://wa.me/55${zap}" target="_blank" style="color: #22c55e; font-weight: 500; text-decoration: none;" title="WhatsApp">📱 ${formatarCelular(p.celular)}</a>`;
        }

        let emailTxt = p.email ? `<div style="font-size: 12px; color: var(--text-muted);">✉️ ${p.email}</div>` : '';

        const div = document.createElement('div');
        div.style.cssText = 'background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; display: flex; flex-direction: column; gap: 8px;';
        
        let perfisFormatados = '';
        if (p.perfis) {
            const arr = Array.isArray(p.perfis) ? p.perfis : (typeof p.perfis === 'string' ? p.perfis.split(',') : []);
            perfisFormatados = arr.filter(pf => pf.toLowerCase().includes('associado')).join(', ') || 'Associado';
        }

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <div style="font-weight: 600; font-size: 14px; color: var(--text-main);">${p.nome_completo}</div>
                    ${emailTxt}
                </div>
                <div style="font-size: 11px; font-weight: 600; color: var(--primary); background: rgba(6, 52, 111, 0.08); padding: 2px 8px; border-radius: 12px;">${perfisFormatados}</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; flex-wrap: wrap; gap: 8px;">
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                    ${tagsDepts || '<span style="color:var(--text-muted); font-size:11px;">Sem departamento vinculado</span>'}
                </div>
                <div style="font-size: 12px;">
                    ${btnZap}
                </div>
            </div>
        `;
        lista.appendChild(div);
    });
}

function formatarCelular(numero) {
    if (!numero) return '';
    const limpo = numero.replace(/\D/g, '');
    if (limpo.length === 11) {
        return `(${limpo.substring(0, 2)}) ${limpo.substring(2, 7)}-${limpo.substring(7)}`;
    } else if (limpo.length === 10) {
        return `(${limpo.substring(0, 2)}) ${limpo.substring(2, 6)}-${limpo.substring(6)}`;
    }
    return numero;
}

// ==========================================
// ABA 2: GESTÃO DOCUMENTAL DOS ASSOCIADOS (DIRETORIA)
// ==========================================

function renderizarGestaoDocumentos() {
    renderizarCardsTemplatesEmBranco();
    renderizarTabelaGestaoDocumentos();
}

function renderizarCardsTemplatesEmBranco() {
    const container = document.getElementById('listaTemplatesEmBrancoCards');
    if (!container) return;
    container.innerHTML = '';

    const templatesAssinatura = todosTemplates.filter(t => t.tipo === 'Assinatura');

    templatesAssinatura.forEach(tpl => {
        const div = document.createElement('div');
        div.style.cssText = 'background: rgba(0,0,0,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px;';
        
        const linkHtml = tpl.link_externo ? 
            `<a href="${tpl.link_externo}" target="_blank" class="btn btn-secondary" style="font-size: 12px; padding: 6px 12px; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">📥 Baixar Modelo em Branco</a>` : 
            `<span style="font-size: 12px; color: #ef4444; background: rgba(239, 68, 68, 0.08); padding: 4px 8px; border-radius: 6px; text-align: center;">⚠️ Link ainda não configurado</span>`;

        div.innerHTML = `
            <div>
                <strong style="color: var(--text-main); font-size: 13px; display: block; margin-bottom: 4px;">${tpl.titulo}</strong>
                <span style="font-size: 11px; color: var(--text-muted);">${tpl.conteudo_markdown || 'Documento obrigatório'}</span>
            </div>
            <div>
                ${linkHtml}
            </div>
        `;
        container.appendChild(div);
    });
}

function renderizarTabelaGestaoDocumentos() {
    const tbody = document.getElementById('tbodyGestaoDocumentos');
    if (!tbody) return;

    const templatesAssinatura = todosTemplates.filter(t => t.tipo === 'Assinatura');

    // Mapeamento dos 3 templates principais (Ficha, Proposta, Termo)
    const tplFicha = templatesAssinatura.find(t => t.titulo.toLowerCase().includes('ficha'));
    const tplProposta = templatesAssinatura.find(t => t.titulo.toLowerCase().includes('proposta'));
    const tplTermo = templatesAssinatura.find(t => t.titulo.toLowerCase().includes('termo') || t.titulo.toLowerCase().includes('voluntário'));

    // Calcular KPIs
    let totalAssoc = todasPessoas.length;
    let totalRegulares = 0;
    let totalPendentes = 0;

    const dadosAssociados = todasPessoas.map(p => {
        const assUser = todasAssinaturas.filter(a => a.pessoa_id === p.id);
        
        const getDocInfo = (tpl) => {
            if (!tpl) return { assinou: false, meta: parseMeta(null), record: null };
            const rec = assUser.find(a => a.template_id === tpl.id);
            return {
                template: tpl,
                record: rec,
                meta: rec ? parseMeta(rec.status) : parseMeta(null)
            };
        };

        const docFicha = getDocInfo(tplFicha);
        const docProposta = getDocInfo(tplProposta);
        const docTermo = getDocInfo(tplTermo);

        // Regra de regularidade: Todos os 3 documentos assinados pelo associado e pela diretoria
        const isFichaOk = docFicha.meta.assinado_associado && (docFicha.meta.situacao === 'Aprovado' || docFicha.meta.assinado_luz_amanha);
        const isPropostaOk = docProposta.meta.assinado_associado && (docProposta.meta.situacao === 'Aprovado' || docProposta.meta.assinado_luz_amanha);
        const isTermoOk = docTermo.meta.assinado_associado && (docTermo.meta.situacao === 'Aprovado' || docTermo.meta.assinado_luz_amanha);

        const regular = isFichaOk && isPropostaOk && isTermoOk;
        if (regular) totalRegulares++;
        else totalPendentes++;

        return {
            pessoa: p,
            docFicha,
            docProposta,
            docTermo,
            regular
        };
    });

    // Atualiza KPIs
    const elTotal = document.getElementById('kpiTotalAssociados');
    const elReg = document.getElementById('kpiTotalRegulares');
    const elPend = document.getElementById('kpiTotalPendentes');
    const elTpl = document.getElementById('kpiTotalTemplates');
    if (elTotal) elTotal.textContent = totalAssoc;
    if (elReg) elReg.textContent = totalRegulares;
    if (elPend) elPend.textContent = totalPendentes;
    if (elTpl) elTpl.textContent = templatesAssinatura.length;

    // Filtros
    const filtroStatus = document.getElementById('filtroStatusGestao')?.value || 'todos';
    const filtroBusca = (document.getElementById('filtroBuscaGestao')?.value || '').toLowerCase();

    const filtrados = dadosAssociados.filter(item => {
        if (filtroStatus === 'pendentes' && item.regular) return false;
        if (filtroStatus === 'completos' && !item.regular) return false;
        if (filtroBusca) {
            const nome = item.pessoa.nome_completo.toLowerCase();
            const email = (item.pessoa.email || '').toLowerCase();
            if (!nome.includes(filtroBusca) && !email.includes(filtroBusca)) return false;
        }
        return true;
    });

    tbody.innerHTML = '';

    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="padding: 24px; text-align: center; color: var(--text-muted);">Nenhum associado encontrado com os filtros selecionados.</td></tr>';
        return;
    }

    const renderCellDoc = (docInfo, pessoaId) => {
        if (!docInfo.template) return '<td style="text-align:center; color:var(--text-muted);">-</td>';
        const meta = docInfo.meta;
        const rec = docInfo.record;
        const linkOriginal = rec?.arquivo_url || meta.arquivo_original_url;

        let badge = '';
        let detalhes = [];

        if (!rec && !meta.assinado_associado) {
            badge = `<span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">Não assinou</span>`;
        } else if (meta.situacao === 'Aprovado' || (meta.assinado_associado && meta.assinado_luz_amanha)) {
            badge = `<span style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">🟢 Assinado</span>`;
        } else {
            badge = `<span style="background: rgba(245, 158, 11, 0.1); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.2); padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">Parcial</span>`;
        }

        // Itens que faltam
        let faltaList = [];
        if (!meta.assinado_associado) faltaList.push("Assinatura Associado");
        if (!meta.assinado_luz_amanha) faltaList.push("Assinatura Luz do Amanhã");
        if (!linkOriginal) faltaList.push("Link do Original");

        let faltaHtml = faltaList.length > 0 ? 
            `<div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">Falta: ${faltaList.join(', ')}</div>` : 
            `<div style="font-size: 10px; color: #10b981; margin-top: 4px;">Completo</div>`;

        let btnLink = linkOriginal ? 
            `<a href="${linkOriginal}" target="_blank" style="font-size: 11px; color: var(--primary); text-decoration: none; margin-top: 2px; display: inline-block;">📄 Ver Original ↗</a>` : 
            '';

        return `
            <td style="padding: 10px 12px; text-align: center; vertical-align: middle; border-bottom: 1px solid var(--border);">
                ${badge}
                ${faltaHtml}
                ${btnLink}
            </td>
        `;
    };

    filtrados.forEach(item => {
        const p = item.pessoa;
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--border)';

        const statusGeralBadge = item.regular ? 
            '<span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 4px 10px; border-radius: 12px; font-weight: 600; font-size: 11px;">🟢 100% OK</span>' : 
            '<span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 4px 10px; border-radius: 12px; font-weight: 600; font-size: 11px;">🟡 Pendente</span>';

        tr.innerHTML = `
            <td style="padding: 12px; vertical-align: middle;">
                <div style="font-weight: 600; color: var(--text-main); font-size: 14px;">${p.nome_completo}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${p.email || 'Sem e-mail'} | ${p.celular ? formatarCelular(p.celular) : 'Sem celular'}</div>
            </td>
            ${renderCellDoc(item.docFicha, p.id)}
            ${renderCellDoc(item.docProposta, p.id)}
            ${renderCellDoc(item.docTermo, p.id)}
            <td style="padding: 12px; text-align: center; vertical-align: middle;">
                ${statusGeralBadge}
            </td>
            <td style="padding: 12px; text-align: center; vertical-align: middle;">
                <button class="btn btn-secondary" onclick="abrirModalConferenciaAssociado('${p.id}')" style="font-size: 11px; padding: 6px 12px; display: inline-flex; align-items: center; gap: 4px;">
                    ✏️ Gerenciar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.filtrarTabelaGestaoDocumentos = function() {
    renderizarTabelaGestaoDocumentos();
};

// ==========================================
// MODAL DE GESTÃO INDIVIDUAL DE DOCUMENTOS DO ASSOCIADO
// ==========================================

window.abrirModalConferenciaAssociado = function(pessoaId) {
    const pessoa = todasPessoas.find(p => p.id === pessoaId);
    if (!pessoa) return;

    const templatesAssinatura = todosTemplates.filter(t => t.tipo === 'Assinatura');
    if (templatesAssinatura.length === 0) {
        Swal.fire('Aviso', 'Nenhum modelo de documento cadastrado.', 'info');
        return;
    }

    // Modal interativo com tabs para cada um dos 3 documentos
    let optionsHtml = templatesAssinatura.map((t, idx) => `<option value="${t.id}">${idx+1}) ${t.titulo}</option>`).join('');

    Swal.fire({
        title: `Documentos: ${pessoa.nome_completo}`,
        html: `
            <div style="text-align: left; font-size: 13px;">
                <div class="form-group" style="margin-bottom: 16px;">
                    <label style="font-weight: 600; color: var(--text-main);">Selecione o Documento para Gerenciar:</label>
                    <select id="swalSelectTemplate" class="input-field" style="width: 100%; padding: 10px; margin-top: 4px;">
                        ${optionsHtml}
                    </select>
                </div>
                <div id="swalDocFormContainer"></div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Salvar Alterações',
        cancelButtonText: 'Fechar',
        width: '600px',
        didOpen: () => {
            const select = document.getElementById('swalSelectTemplate');
            const carregarCampos = () => {
                const tplId = select.value;
                const rec = todasAssinaturas.find(a => a.pessoa_id === pessoaId && a.template_id === tplId);
                const meta = rec ? parseMeta(rec.status) : parseMeta(null);
                const tpl = todosTemplates.find(t => t.id === tplId);

                const linkOriginal = rec?.arquivo_url || meta.arquivo_original_url || '';
                const linkBranco = tpl?.link_externo || '';

                document.getElementById('swalDocFormContainer').innerHTML = `
                    <div style="background: rgba(0,0,0,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 14px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: var(--text-muted);">Modelo em Branco:</span>
                            ${linkBranco ? `<a href="${linkBranco}" target="_blank" style="color: var(--primary); font-weight: 600; text-decoration: none;">📥 Baixar Modelo em Branco ↗</a>` : '<span style="color:#ef4444;">Sem link configurado</span>'}
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom: 14px;">
                        <label style="font-weight: 600; color: var(--text-main); display: flex; justify-content: space-between;">
                            <span>Link do Original Assinado (Drive / Nuvem):</span>
                            ${linkOriginal ? `<a href="${linkOriginal}" target="_blank" style="color: var(--primary); text-decoration: none;">Abrir Arquivo ↗</a>` : ''}
                        </label>
                        <input type="url" id="swalArquivoUrl" class="input-field" placeholder="https://drive.google.com/..." value="${linkOriginal}" style="width: 100%; padding: 8px; margin-top: 4px;">
                    </div>

                    <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-bottom: 14px;">
                        <strong style="color: var(--text-main); font-size: 13px; display: block; margin-bottom: 10px;">Checklist de Validação:</strong>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" id="swalEmissao" ${meta.emissao_doc ? 'checked' : ''} style="width: 16px; height: 16px;">
                                <span><strong>Documento Emitido / Disponibilizado</strong></span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" id="swalAssinadoAssociado" ${meta.assinado_associado ? 'checked' : ''} style="width: 16px; height: 16px;">
                                <span><strong>Assinatura do Associado Coletada</strong></span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" id="swalAssinadoLuzAmanha" ${meta.assinado_luz_amanha ? 'checked' : ''} style="width: 16px; height: 16px;">
                                <span><strong>Assinatura da Diretoria Luz do Amanhã</strong></span>
                            </label>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                        <div class="form-group">
                            <label style="font-weight: 600; color: var(--text-main);">Situação do Documento:</label>
                            <select id="swalSituacao" class="input-field" style="width: 100%; padding: 8px; margin-top: 4px;">
                                <option value="Pendente" ${meta.situacao === 'Pendente' ? 'selected' : ''}>🟡 Pendente</option>
                                <option value="Aguardando Associado" ${meta.situacao === 'Aguardando Associado' ? 'selected' : ''}>⏳ Aguardando Associado</option>
                                <option value="Aguardando Diretoria" ${meta.situacao === 'Aguardando Diretoria' ? 'selected' : ''}>⏳ Aguardando Diretoria</option>
                                <option value="Enviado" ${meta.situacao === 'Enviado' ? 'selected' : ''}>🔵 Enviado / Em Conferência</option>
                                <option value="Aprovado" ${meta.situacao === 'Aprovado' ? 'selected' : ''}>🟢 Aprovado & Regular</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label style="font-weight: 600; color: var(--text-main);">Data de Registro:</label>
                            <input type="date" id="swalDataEmissao" class="input-field" value="${meta.data_emissao || ''}" style="width: 100%; padding: 8px; margin-top: 4px;">
                        </div>
                    </div>

                    <div class="form-group">
                        <label style="font-weight: 600; color: var(--text-main);">Observações / O que falta?</label>
                        <textarea id="swalObservacoes" class="input-field" rows="2" style="width: 100%; padding: 8px; margin-top: 4px;" placeholder="Ex: Aguardando assinatura física presencial...">${meta.observacoes || ''}</textarea>
                    </div>
                `;
            };

            select.addEventListener('change', carregarCampos);
            carregarCampos();
        },
        preConfirm: async () => {
            const select = document.getElementById('swalSelectTemplate');
            const templateId = select.value;
            const linkArquivo = document.getElementById('swalArquivoUrl').value.trim();
            const emissao = document.getElementById('swalEmissao').checked;
            const assAssoc = document.getElementById('swalAssinadoAssociado').checked;
            const assLuz = document.getElementById('swalAssinadoLuzAmanha').checked;
            const situacao = document.getElementById('swalSituacao').value;
            const dataEmissao = document.getElementById('swalDataEmissao').value;
            const obs = document.getElementById('swalObservacoes').value.trim();

            const novoMeta = {
                situacao: situacao,
                emissao_doc: emissao,
                assinado_associado: assAssoc,
                assinado_luz_amanha: assLuz,
                data_emissao: dataEmissao || null,
                arquivo_original_url: linkArquivo,
                observacoes: obs
            };

            const statusString = stringifyMeta(novoMeta);

            try {
                const { error } = await db.from('app_assoc_documentos_usuarios').upsert({
                    template_id: templateId,
                    pessoa_id: pessoaId,
                    arquivo_url: linkArquivo,
                    status: statusString,
                    data_envio: new Date().toISOString()
                }, { onConflict: 'template_id, pessoa_id' });

                if (error) throw error;
                return true;
            } catch (err) {
                Swal.showValidationMessage('Erro ao salvar: ' + err.message);
                return false;
            }
        }
    }).then(async (res) => {
        if (res.isConfirmed) {
            Swal.fire('Sucesso!', 'Registro do associado atualizado com sucesso.', 'success');
            await carregarDadosAssociados();
        }
    });
};

// ==========================================
// MODAL DE CONFIGURAÇÃO DOS LINKS DOS TEMPLATES (MODELOS EM BRANCO)
// ==========================================

window.abrirModalGerenciarTemplates = function() {
    const container = document.getElementById('formTemplatesContainer');
    if (!container) return;
    container.innerHTML = '';

    const templatesAssinatura = todosTemplates.filter(t => t.tipo === 'Assinatura');

    templatesAssinatura.forEach(tpl => {
        const div = document.createElement('div');
        div.style.cssText = 'background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 14px;';
        div.innerHTML = `
            <div style="font-weight: 600; color: var(--text-main); font-size: 14px; margin-bottom: 6px;">
                📄 ${tpl.titulo}
            </div>
            <div class="form-group" style="margin-bottom: 8px;">
                <label style="font-size: 12px; color: var(--text-muted);">Link do Documento / Modelo em Branco (Google Drive, PDF, etc):</label>
                <input type="url" class="input-field tpl-link-input" data-id="${tpl.id}" value="${tpl.link_externo || ''}" placeholder="https://drive.google.com/..." style="width: 100%; padding: 8px; margin-top: 4px;">
            </div>
            <div class="form-group">
                <label style="font-size: 12px; color: var(--text-muted);">Descrição ou Orientações de Preenchimento:</label>
                <input type="text" class="input-field tpl-desc-input" data-id="${tpl.id}" value="${tpl.conteudo_markdown || ''}" placeholder="Orientações breves..." style="width: 100%; padding: 8px; margin-top: 4px;">
            </div>
        `;
        container.appendChild(div);
    });

    document.getElementById('modalConfigTemplates').style.display = 'flex';
};

window.salvarLinksTemplates = async function(event) {
    event.preventDefault();
    const linkInputs = document.querySelectorAll('.tpl-link-input');
    const descInputs = document.querySelectorAll('.tpl-desc-input');

    try {
        for (let input of linkInputs) {
            const id = input.dataset.id;
            const link = input.value.trim();
            const descInput = Array.from(descInputs).find(d => d.dataset.id === id);
            const desc = descInput ? descInput.value.trim() : '';

            const { error } = await db.from('app_assoc_documentos_templates').update({
                link_externo: link,
                conteudo_markdown: desc
            }).eq('id', id);

            if (error) throw error;
        }

        document.getElementById('modalConfigTemplates').style.display = 'none';
        Swal.fire('Modelos Atualizados', 'Os links dos documentos em branco foram salvos com sucesso.', 'success');
        await carregarDadosAssociados();

    } catch(err) {
        console.error("Erro ao salvar links de templates:", err);
        Swal.fire('Erro', 'Erro ao salvar: ' + err.message, 'error');
    }
};

// ==========================================
// MODAIS DE LEITURA E ASSINATURA INDIVIDUAL
// ==========================================

window.abrirModalDocumento = function(templateId) {
    const tpl = todosTemplates.find(t => t.id === templateId);
    if (!tpl) return;

    document.getElementById('modalDocTitulo').textContent = tpl.titulo;
    
    if (tpl.conteudo_markdown) {
        document.getElementById('modalDocConteudo').innerHTML = marked.parse(tpl.conteudo_markdown);
    } else {
        document.getElementById('modalDocConteudo').innerHTML = '<p><em>Nenhum conteúdo em texto disponível.</em></p>';
    }

    const btnLink = document.getElementById('modalDocLinkBtn');
    const containerLink = document.getElementById('modalDocLinkContainer');
    
    if (tpl.link_externo) {
        containerLink.style.display = 'block';
        btnLink.href = tpl.link_externo;
    } else {
        containerLink.style.display = 'none';
    }

    document.getElementById('modalDocumentoOficial').style.display = 'flex';
};

window.abrirModalAssinatura = function(templateId, titulo) {
    document.getElementById('assinaturaTemplateId').value = templateId;
    document.getElementById('assinaturaArquivoUrl').value = '';
    
    const tpl = todosTemplates.find(t => t.id === templateId);

    const btnVerTemplate = document.getElementById('btnVerTemplateBase');
    btnVerTemplate.onclick = () => {
        document.getElementById('modalEnvioAssinatura').style.display = 'none';
        abrirModalDocumento(templateId);
    };

    const btnDownload = document.getElementById('btnDownloadModeloBranco');
    if (tpl && tpl.link_externo) {
        btnDownload.style.display = 'inline-flex';
        btnDownload.href = tpl.link_externo;
    } else {
        btnDownload.style.display = 'none';
    }

    // Se já havia link salvo pelo associado, preencher
    const ass = todasAssinaturas.find(a => a.template_id === templateId && a.pessoa_id === loggedUserPessoaId);
    if (ass && ass.arquivo_url) {
        document.getElementById('assinaturaArquivoUrl').value = ass.arquivo_url;
    }

    document.getElementById('modalEnvioAssinatura').style.display = 'flex';
};

window.salvarAssinatura = async function(event) {
    event.preventDefault();
    
    const btnSalvar = document.getElementById('btnSalvarAssinatura');
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Enviando...';

    const templateId = document.getElementById('assinaturaTemplateId').value;
    const urlArquivo = document.getElementById('assinaturaArquivoUrl').value.trim();

    try {
        // Preserva metadados anteriores ou inicia um novo
        const recAnterior = todasAssinaturas.find(a => a.template_id === templateId && a.pessoa_id === loggedUserPessoaId);
        const metaAnterior = recAnterior ? parseMeta(recAnterior.status) : parseMeta(null);

        metaAnterior.situacao = 'Enviado';
        metaAnterior.assinado_associado = true; // Enviou o documento assinado
        metaAnterior.arquivo_original_url = urlArquivo;

        const { error } = await db.from('app_assoc_documentos_usuarios').upsert({
            template_id: templateId,
            pessoa_id: loggedUserPessoaId,
            arquivo_url: urlArquivo,
            status: stringifyMeta(metaAnterior),
            data_envio: new Date().toISOString()
        }, { onConflict: 'template_id, pessoa_id' });

        if (error) throw error;

        document.getElementById('modalEnvioAssinatura').style.display = 'none';
        
        await carregarDadosAssociados();
        
        Swal.fire({
            title: 'Documento Enviado!',
            text: 'Seu documento foi enviado com sucesso e está aguardando conferência e assinatura da diretoria.',
            icon: 'success'
        });

    } catch (e) {
        console.error("Erro ao enviar assinatura:", e);
        Swal.fire('Erro', 'Erro ao enviar documento: ' + e.message, 'error');
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Registrar Envio';
    }
};
