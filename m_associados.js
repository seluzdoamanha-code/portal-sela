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
        const { data: pData } = await db.from('pessoas').select('id, nome_completo, email, perfil').eq('email', loggedUserEmail).single();
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

        const { data: pessoas, error: errPes } = await db.from('pessoas').select('*, vinculacoes(estruturas(nome, tipo))').order('nome_completo', { ascending: true });
        if (errPes) throw errPes;
        
        todasPessoas = (pessoas || []).filter(p => p.perfil && p.perfil.toLowerCase().includes('associado'));
        
        renderizarDiretorio();
    } catch (e) {
        console.error("Erro ao carregar portal:", e);
        alert("Erro ao carregar dados: " + e.message);
    }
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
        
        let statusBadge = '<span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">Pendente</span>';
        let actionBtn = `<button class="btn btn-primary" onclick="abrirModalAssinatura('${tpl.id}', '${tpl.titulo.replace(/'/g, "\\'")}')" style="font-size: 12px; padding: 4px 12px; width: 100%;">Assinar / Enviar</button>`;

        if (assinou && assinou.status === 'Enviado') {
            statusBadge = '<span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">Enviado</span>';
            actionBtn = `<button class="btn btn-secondary" onclick="window.open('${assinou.arquivo_url}', '_blank')" style="font-size: 12px; padding: 4px 12px; width: 100%;">Ver Meu Arquivo</button>`;
        } else if (assinou && assinou.status === 'Aprovado') {
            statusBadge = '<span style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">Arquivado</span>';
            actionBtn = `<button class="btn btn-secondary" onclick="window.open('${assinou.arquivo_url}', '_blank')" style="font-size: 12px; padding: 4px 12px; width: 100%;">Ver Meu Arquivo</button>`;
        }

        const div = document.createElement('div');
        div.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;';
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="font-weight: 600; font-size: 13px; color: var(--text-main); line-height: 1.4;">${tpl.titulo}</div>
            </div>
            <div>${statusBadge}</div>
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
        if (p.vinculacoes && p.vinculacoes.length > 0) {
            depts = p.vinculacoes.map(v => v.estruturas?.nome).filter(Boolean);
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
        
        div.innerHTML = `
            <div style="font-weight: 600; font-size: 13px; color: var(--text-main);">${p.nome_completo}</div>
            ${p.email ? `<div style="font-size: 11px; color: var(--text-muted);">${p.email}</div>` : ''}
            <div style="font-size: 11px; font-weight: 600; color: var(--primary); margin-top: 4px;">${p.perfil || 'Associado'}</div>
            
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
    
    const btnVerTemplate = document.getElementById('btnVerTemplateBase');
    btnVerTemplate.onclick = () => {
        document.getElementById('modalEnvioAssinatura').style.display = 'none';
        abrirModalDocumento(templateId);
    };

    document.getElementById('modalEnvioAssinatura').style.display = 'flex';
};

window.salvarAssinatura = async function(event) {
    event.preventDefault();
    
    const btnSalvar = document.getElementById('btnSalvarAssinatura');
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Enviando...';

    const templateId = document.getElementById('assinaturaTemplateId').value;
    const urlArquivo = document.getElementById('assinaturaArquivoUrl').value;

    try {
        const { error } = await db.from('app_assoc_documentos_usuarios').upsert({
            template_id: templateId,
            pessoa_id: loggedUserPessoaId,
            arquivo_url: urlArquivo,
            status: 'Enviado',
            data_envio: new Date().toISOString()
        }, { onConflict: 'template_id, pessoa_id' });

        if (error) throw error;

        document.getElementById('modalEnvioAssinatura').style.display = 'none';
        await carregarDadosAssociados();
        
        alert("Enviado com sucesso!");

    } catch (e) {
        console.error("Erro ao enviar:", e);
        alert("Erro: " + e.message);
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Enviar';
    }
};
