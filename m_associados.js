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

document.addEventListener('DOMContentLoaded', async () => {
    if (!loggedUserPessoaId && loggedUserEmail) {
        const { data: pData } = await db.from('pessoas').select('id, nome_completo, email, perfis').eq('email', loggedUserEmail).single();
        if (pData) {
            loggedUserPessoaId = pData.id;
        }
    }

    if (!loggedUserPessoaId) {
        alert("Erro: Não foi possível identificar o seu usuário.");
        return;
    }

    document.getElementById('mSearchAssociados').addEventListener('input', (e) => {
        renderizarDiretorio(e.target.value);
    });

    document.getElementById('formEnvioAssinatura').addEventListener('submit', salvarAssinatura);

    await carregarDadosAssociados();
});

async function carregarDadosAssociados() {
    try {
        const { data: templates, error: errTpl } = await db.from('app_assoc_documentos_templates').select('*').order('titulo', { ascending: true });
        if (errTpl) throw errTpl;
        todosTemplates = templates || [];

        const { data: assinaturasUser, error: errAss } = await db.from('app_assoc_documentos_usuarios').select('*').eq('pessoa_id', loggedUserPessoaId);
        if (errAss) throw errAss;
        
        renderizarMeusDocumentos(assinaturasUser || []);
        renderizarBibliotecaOficial();

        const { data: pessoas, error: errPes } = await db.from('pessoas').select('*, vinculos_estrutura(estruturas(nome, tipo))').order('nome_completo', { ascending: true });
        if (errPes) throw errPes;
        
        todasPessoas = (pessoas || []).filter(p => {
            if (!p.perfis) return false;
            const perfisArr = Array.isArray(p.perfis) ? p.perfis : (typeof p.perfis === 'string' ? p.perfis.split(',').map(s=>s.trim()) : []);
            return perfisArr.some(pf => pf.toLowerCase().includes('associado'));
        });
        
        renderizarDiretorio();
    } catch (e) {
        console.error("Erro ao carregar portal:", e);
        alert("Erro ao carregar dados: " + e.message);
    }
}

function parseMeta(rawStatus) {
    if (!rawStatus) return { situacao: 'Pendente', assinado_associado: false, assinado_luz_amanha: false, emissao_doc: false, data_emissao: null, arquivo_original_url: '', observacoes: '' };
    if (typeof rawStatus === 'object') return rawStatus;
    if (typeof rawStatus === 'string' && rawStatus.trim().startsWith('{')) {
        try { return JSON.parse(rawStatus); } catch(e) {}
    }
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

function renderizarMeusDocumentos(assinaturasUser) {
    const lista = document.getElementById('mListaMeusDocumentos');
    lista.innerHTML = '';

    const templatesAssinatura = todosTemplates.filter(t => t.tipo === 'Assinatura');

    if (templatesAssinatura.length === 0) {
        lista.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Nenhum documento pendente.</div>';
        return;
    }

    templatesAssinatura.forEach(tpl => {
        const assinou = assinaturasUser.find(a => a.template_id === tpl.id);
        const meta = assinou ? parseMeta(assinou.status) : parseMeta(null);
        
        let statusBadge = '<span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">🟡 Pendente</span>';
        let actionBtn = `<button class="btn btn-primary" onclick="abrirModalAssinatura('${tpl.id}', '${tpl.titulo.replace(/'/g, "\\'")}')" style="font-size: 12px; padding: 6px 12px; width: 100%;">Assinar / Enviar</button>`;

        if (meta.situacao === 'Aprovado' || (meta.assinado_associado && meta.assinado_luz_amanha)) {
            statusBadge = '<span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">🟢 Regularizado</span>';
            const linkArq = assinou.arquivo_url || meta.arquivo_original_url;
            actionBtn = linkArq ? `<button class="btn btn-secondary" onclick="window.open('${linkArq}', '_blank')" style="font-size: 12px; padding: 6px 12px; width: 100%;">Ver Original Assinado ↗</button>` : '';
        } else if (meta.situacao === 'Enviado' || assinou) {
            let descFalta = [];
            if (!meta.assinado_associado) descFalta.push("Sua assinatura");
            if (!meta.assinado_luz_amanha) descFalta.push("Assinatura Diretoria");
            const faltaTxt = descFalta.length > 0 ? ` (Falta: ${descFalta.join(', ')})` : '';

            statusBadge = `<span style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">🔵 Em Andamento${faltaTxt}</span>`;
            actionBtn = `<button class="btn btn-secondary" onclick="abrirModalAssinatura('${tpl.id}', '${tpl.titulo.replace(/'/g, "\\'")}')" style="font-size: 12px; padding: 6px 12px; width: 100%;">Atualizar Envio</button>`;
        }

        const linkBrancoHtml = tpl.link_externo ? 
            `<a href="${tpl.link_externo}" target="_blank" style="font-size: 12px; color: var(--primary); text-decoration: none;">📥 Baixar Modelo em Branco</a>` : '';

        const div = document.createElement('div');
        div.style.cssText = 'background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;';
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="font-weight: 600; font-size: 14px; color: var(--text-main); line-height: 1.4;">${tpl.titulo}</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                ${statusBadge}
                ${linkBrancoHtml}
            </div>
            <div style="margin-top: 4px;">
                ${actionBtn}
            </div>
        `;
        lista.appendChild(div);
    });
}

function renderizarBibliotecaOficial() {
    const lista = document.getElementById('mListaBibliotecaOficial');
    lista.innerHTML = '';

    const templatesLeitura = todosTemplates.filter(t => t.tipo === 'Leitura');

    if (templatesLeitura.length === 0) {
        lista.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Biblioteca vazia.</div>';
        return;
    }

    templatesLeitura.forEach(tpl => {
        const div = document.createElement('div');
        div.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;';
        div.onclick = () => abrirModalDocumento(tpl.id);

        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; overflow: hidden;">
                <span style="font-size: 16px; flex-shrink: 0;">📖</span>
                <span style="font-weight: 600; font-size: 13px; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${tpl.titulo}</span>
            </div>
            <div style="color: var(--text-muted); font-size: 12px; flex-shrink: 0;">Ler &rarr;</div>
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

function renderizarDiretorio(filtro = '') {
    const lista = document.getElementById('mListaDiretorio');
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
        
        let tagsDepts = depts.map(d => `<span style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 10px; color: var(--text-muted); white-space: nowrap;">${d}</span>`).join(' ');

        let btnZap = '';
        if (p.celular) {
            const zap = p.celular.replace(/\D/g, '');
            btnZap = `<a href="https://wa.me/55${zap}" target="_blank" class="btn btn-secondary" style="font-size: 12px; padding: 4px 8px; color: #10b981; border-color: #10b981; text-decoration: none; display: flex; align-items: center; justify-content: center; width: 100%; margin-top: 8px;">WhatsApp: ${formatarCelular(p.celular)}</a>`;
        }

        const div = document.createElement('div');
        div.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 4px;';
        
        let perfisFormatados = '';
        if (p.perfis) {
            const arr = Array.isArray(p.perfis) ? p.perfis : (typeof p.perfis === 'string' ? p.perfis.split(',') : []);
            perfisFormatados = arr.filter(pf => pf.toLowerCase().includes('associado')).join(', ') || 'Associado';
        }

        div.innerHTML = `
            <div style="font-weight: 600; font-size: 13px; color: var(--text-main);">${p.nome_completo}</div>
            ${p.email ? `<div style="font-size: 11px; color: var(--text-muted);">${p.email}</div>` : ''}
            <div style="font-size: 11px; font-weight: 600; color: var(--primary); margin-top: 4px;">${perfisFormatados}</div>
            
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                ${tagsDepts}
            </div>
            ${btnZap}
        `;
        lista.appendChild(div);
    });
}

window.abrirModalDocumento = function(templateId) {
    const tpl = todosTemplates.find(t => t.id === templateId);
    if (!tpl) return;

    document.getElementById('modalDocTitulo').textContent = tpl.titulo;
    
    if (tpl.conteudo_markdown) {
        document.getElementById('modalDocConteudo').innerHTML = marked.parse(tpl.conteudo_markdown);
    } else {
        document.getElementById('modalDocConteudo').innerHTML = '<p><em>Nenhum texto disponível.</em></p>';
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

    const btnDownload = document.getElementById('btnDownloadModeloBrancoMobile');
    if (btnDownload) {
        if (tpl && tpl.link_externo) {
            btnDownload.style.display = 'inline-flex';
            btnDownload.href = tpl.link_externo;
        } else {
            btnDownload.style.display = 'none';
        }
    }

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
        const recAnterior = todasAssinaturas.find(a => a.template_id === templateId && a.pessoa_id === loggedUserPessoaId);
        const metaAnterior = recAnterior ? parseMeta(recAnterior.status) : parseMeta(null);

        metaAnterior.situacao = 'Enviado';
        metaAnterior.assinado_associado = true;
        metaAnterior.arquivo_original_url = urlArquivo;

        const { error } = await db.from('app_assoc_documentos_usuarios').upsert({
            template_id: templateId,
            pessoa_id: loggedUserPessoaId,
            arquivo_url: urlArquivo,
            status: JSON.stringify(metaAnterior),
            data_envio: new Date().toISOString()
        }, { onConflict: 'template_id, pessoa_id' });

        if (error) throw error;

        document.getElementById('modalEnvioAssinatura').style.display = 'none';
        await carregarDadosAssociados();
        
        alert("Documento enviado com sucesso! Aguarde a conferência da diretoria.");

    } catch (e) {
        console.error("Erro ao enviar:", e);
        alert("Erro: " + e.message);
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Registrar Envio';
    }
};
