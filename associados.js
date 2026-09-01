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
    // Buscar o pessoa_id do usuário logado baseado no email caso não tenha vindo do auth_guard
    if (!loggedUserPessoaId && loggedUserEmail) {
        const { data: pData } = await db.from('pessoas').select('id, nome_completo, email, perfil').eq('email', loggedUserEmail).single();
        if (pData) {
            loggedUserPessoaId = pData.id;
        }
    }

    if (!loggedUserPessoaId) {
        alert("Erro: Não foi possível identificar o seu usuário no sistema.");
        return;
    }

    // Adicionar listener para pesquisa no diretório
    document.getElementById('searchAssociados').addEventListener('input', (e) => {
        renderizarDiretorio(e.target.value);
    });

    // Form envio de assinatura
    document.getElementById('formEnvioAssinatura').addEventListener('submit', salvarAssinatura);

    await carregarDadosAssociados();
});

async function carregarDadosAssociados() {
    try {
        // 1. Carregar Templates de Documentos
        const { data: templates, error: errTpl } = await db.from('app_assoc_documentos_templates').select('*').order('titulo', { ascending: true });
        if (errTpl) throw errTpl;
        todosTemplates = templates || [];

        // 2. Carregar Assinaturas/Uploads do usuário logado
        const { data: assinaturasUser, error: errAss } = await db.from('app_assoc_documentos_usuarios').select('*').eq('pessoa_id', loggedUserPessoaId);
        if (errAss) throw errAss;
        
        // Renderizar Cards 1 e 2
        renderizarMeusDocumentos(assinaturasUser || []);
        renderizarBibliotecaOficial();

        // 3. Carregar Diretório (Todos os Associados)
        // Busca pessoas que tenham perfil de associado (Associado Efetivo, Proponente, etc) e seus vínculos para mostrar o departamento
        // No momento, vamos buscar todas as pessoas e filtrar pelo perfil
        const { data: pessoas, error: errPes } = await db.from('pessoas').select('*, vinculos_estrutura(estruturas(nome, tipo))').order('nome_completo', { ascending: true });
        if (errPes) throw errPes;
        
        // Filtra apenas os que são "Associados" (Efetivo, etc)
        // Adjust the filtering logic based on how Associado is defined in the system. Often it's in the 'perfil' column.
        todasPessoas = (pessoas || []).filter(p => p.perfil && p.perfil.toLowerCase().includes('associado'));
        
        renderizarDiretorio();

    } catch (e) {
        console.error("Erro ao carregar portal do associado:", e);
        alert("Erro ao carregar dados: " + e.message);
    }
}

function renderizarMeusDocumentos(assinaturasUser) {
    const lista = document.getElementById('listaMeusDocumentos');
    lista.innerHTML = '';

    // Filtra os templates que são do tipo 'Assinatura'
    const templatesAssinatura = todosTemplates.filter(t => t.tipo === 'Assinatura');

    if (templatesAssinatura.length === 0) {
        lista.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Nenhum documento requer assinatura no momento.</div>';
        return;
    }

    templatesAssinatura.forEach(tpl => {
        // Verifica se o usuário já assinou/enviou este documento
        const assinou = assinaturasUser.find(a => a.template_id === tpl.id);
        
        let statusBadge = '<span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">Pendente</span>';
        let actionBtn = `<button class="btn btn-primary" onclick="abrirModalAssinatura('${tpl.id}', '${tpl.titulo.replace(/'/g, "\\'")}')" style="font-size: 12px; padding: 4px 12px;">Assinar / Enviar</button>`;

        if (assinou && assinou.status === 'Enviado') {
            statusBadge = '<span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">Enviado (Aguardando Verificação)</span>';
            actionBtn = `<button class="btn btn-secondary" onclick="window.open('${assinou.arquivo_url}', '_blank')" style="font-size: 12px; padding: 4px 12px;">Ver Meu Arquivo</button>`;
        } else if (assinou && assinou.status === 'Aprovado') {
            statusBadge = '<span style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">Aprovado & Arquivado</span>';
            actionBtn = `<button class="btn btn-secondary" onclick="window.open('${assinou.arquivo_url}', '_blank')" style="font-size: 12px; padding: 4px 12px;">Ver Meu Arquivo</button>`;
        }

        const div = document.createElement('div');
        div.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;';
        div.innerHTML = `
            <div>
                <div style="font-weight: 600; font-size: 14px; color: var(--text-main); margin-bottom: 4px;">${tpl.titulo}</div>
                <div>${statusBadge}</div>
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
    lista.innerHTML = '';

    // Filtra os templates que são do tipo 'Leitura'
    const templatesLeitura = todosTemplates.filter(t => t.tipo === 'Leitura');

    if (templatesLeitura.length === 0) {
        lista.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Nenhum documento oficial publicado.</div>';
        return;
    }

    templatesLeitura.forEach(tpl => {
        const div = document.createElement('div');
        div.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.2s;';
        div.onmouseover = () => div.style.background = 'rgba(255,255,255,0.06)';
        div.onmouseout = () => div.style.background = 'rgba(255,255,255,0.03)';
        div.onclick = () => abrirModalDocumento(tpl.id);

        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">📖</span>
                <span style="font-weight: 600; font-size: 14px; color: var(--text-main);">${tpl.titulo}</span>
            </div>
            <div style="color: var(--text-muted); font-size: 12px;">Ler &rarr;</div>
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
    const lista = document.getElementById('listaDiretorio');
    lista.innerHTML = '';
    
    const termo = filtro.toLowerCase();
    const filtrados = todasPessoas.filter(p => p.nome_completo.toLowerCase().includes(termo) || (p.email && p.email.toLowerCase().includes(termo)));

    if (filtrados.length === 0) {
        lista.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Nenhum associado encontrado.</div>';
        return;
    }

    filtrados.forEach(p => {
        // Extrair departamentos únicos
        let depts = [];
        if (p.vinculos_estrutura && p.vinculos_estrutura.length > 0) {
            depts = p.vinculos_estrutura.map(v => v.estruturas?.nome).filter(Boolean);
            // remover duplicatas
            depts = [...new Set(depts)];
        }
        
        let tagsDepts = depts.map(d => `<span style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 10px; color: var(--text-muted); white-space: nowrap;">${d}</span>`).join(' ');

        // Contatos
        let btnZap = '';
        if (p.celular) {
            const zap = p.celular.replace(/\D/g, '');
            btnZap = `<a href="https://wa.me/55${zap}" target="_blank" style="color: #22c55e; text-decoration: none;" title="WhatsApp">📱 ${formatarCelular(p.celular)}</a>`;
        }

        let emailTxt = p.email ? `<div style="font-size: 11px; color: var(--text-muted);">✉️ ${p.email}</div>` : '';

        const div = document.createElement('div');
        div.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;';
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <div style="font-weight: 600; font-size: 14px; color: var(--text-main);">${p.nome_completo}</div>
                    ${emailTxt}
                </div>
                <div style="font-size: 11px; font-weight: 600; color: var(--primary);">${p.perfil}</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 4px;">
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                    ${tagsDepts}
                </div>
                <div style="font-size: 12px;">
                    ${btnZap}
                </div>
            </div>
        `;
        lista.appendChild(div);
    });
}

// ==========================================
// MODAIS E LÓGICA DE DOCUMENTOS
// ==========================================

window.abrirModalDocumento = function(templateId) {
    const tpl = todosTemplates.find(t => t.id === templateId);
    if (!tpl) return;

    document.getElementById('modalDocTitulo').textContent = tpl.titulo;
    
    // Converte Markdown
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
        // Usar upsert para garantir que se o cara enviar de novo, sobrescreve
        const { error } = await db.from('app_assoc_documentos_usuarios').upsert({
            template_id: templateId,
            pessoa_id: loggedUserPessoaId,
            arquivo_url: urlArquivo,
            status: 'Enviado',
            data_envio: new Date().toISOString()
        }, { onConflict: 'template_id, pessoa_id' });

        if (error) throw error;

        document.getElementById('modalEnvioAssinatura').style.display = 'none';
        
        // Recarrega os dados para atualizar os botões
        await carregarDadosAssociados();
        
        alert("Documento enviado com sucesso! A administração fará a verificação.");

    } catch (e) {
        console.error("Erro ao enviar assinatura:", e);
        alert("Erro ao enviar documento: " + e.message);
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Registrar Envio';
    }
};
