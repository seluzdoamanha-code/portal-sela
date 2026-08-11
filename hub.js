const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const urlParams = new URLSearchParams(window.location.search);
const estruturaId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    if (!estruturaId) {
        alert("ID da estrutura não fornecido!");
        window.location.href = 'entidade.html';
        return;
    }

    await carregarDadosEstrutura();
    configurarAbas();
    
    // Iniciar Aba de Equipe
    await carregarEquipe();
    
    // Iniciar Aba de Documentos & Projetos
    await carregarProjetosProcessos();
    await carregarDocumentos();
    await popularSelectDepartamentos();
    
    // Formulario de Documentos
    document.getElementById('formDoc').addEventListener('submit', salvarDocumento);
    
    // Formulario Tesouraria
    const formTesouraria = document.getElementById('formTesourariaEnvio');
    if (formTesouraria) {
        formTesouraria.addEventListener('submit', salvarEnvioTesouraria);
    }
    
    // Formulario de Projetos
    const formProj = document.getElementById('formProjeto');
    if(formProj) formProj.addEventListener('submit', salvarProjeto);
    
    // Iniciar Aba de Agenda
    await carregarAgenda();
    document.getElementById('formEvento').addEventListener('submit', salvarEvento);
});

async function carregarDadosEstrutura() {
    try {
        const { data, error } = await db.from('estruturas').select('*').eq('id', estruturaId).single();
        if (error) throw error;
        
        if (data) {
            document.getElementById('hubName').textContent = data.nome;
            document.getElementById('hubType').textContent = data.tipo;
            
            const nomeEstrutura = (data.nome || '').toLowerCase();
            const isIrradiacao = nomeEstrutura.includes('irradia') || nomeEstrutura.includes('sela');
            const isAssistencia = nomeEstrutura.includes('assist') && nomeEstrutura.includes('social');
            
            // Lógica de exibir Abas com base na configuração do DB
            let config = data.abas_config || {
                equipe: true, agenda: true, projetos: true, documentos: true,
                tesouraria: false,
                apps: isIrradiacao || isAssistencia
            };
            
            if (isIrradiacao || isAssistencia) {
                // Forçar habilitar apps se for módulo nativo
                config.apps = true;
            }
            
            // Ocultar Abas desativadas
            if (!config.equipe) document.querySelector('[data-target="abaEquipe"]').style.display = 'none';
            if (!config.agenda) document.querySelector('[data-target="abaAgenda"]').style.display = 'none';
            if (!config.projetos) document.querySelector('[data-target="abaProjetosProcessos"]').style.display = 'none';
            if (!config.documentos) document.querySelector('[data-target="abaDocumentos"]').style.display = 'none';
            
            if (config.apps) {
                const btnApps = document.querySelector('[data-target="abaApps"]');
                if(btnApps) btnApps.style.display = 'block';
                if (isIrradiacao || isAssistencia) {
                    carregarAppMiniApps();
                }
            }
        }
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('hubContent').style.display = 'block';
    } catch (err) {
        console.error("Erro ao carregar estrutura:", err);
        document.getElementById('loadingState').textContent = "Erro ao carregar dados. Verifique sua conexão.";
    }
}

// ==========================================
// MÓDULO DE EQUIPE
// ==========================================
async function carregarEquipe() {
    try {
        let tagsLideranca = ['diretor', 'diretora', 'diretoria', 'direção', 'direcao', 'líder', 'lider', 'coordenador', 'coordenadora', 'gerente', 'presidente', 'presidenta'];
        try {
            const { data } = await db.from('configuracoes').select('valor').eq('chave', 'tags_lideranca').single();
            if (data && data.valor) {
                tagsLideranca = data.valor.split(',').map(s => s.trim().toLowerCase()).filter(s => s !== '');
            }
        } catch(e) {}

        const { data, error } = await db
            .from('vinculos_estrutura')
            .select(`
                papel,
                pessoas (nome_completo, papeis, celular, email)
            `)
            .eq('estrutura_id', estruturaId);
            
        if (error) throw error;
        
        const gridLideranca = document.getElementById('gridLideranca');
        const gridMembros = document.getElementById('gridMembros');
        const status = document.getElementById('equipeStatus');
        
        if (!data || data.length === 0) {
            status.textContent = 'Nenhum membro vinculado a este departamento.';
            return;
        }
        
        const tituloGestao = document.getElementById('tituloGestaoPessoas');
        if (tituloGestao) {
            tituloGestao.textContent = `Gestão de Pessoas (${data.length})`;
        }
        
        status.textContent = `${data.length} membro(s) na equipe.`;
        
        let htmlLider = '';
        let htmlMembro = '';
        
        data.forEach(rel => {
            const pessoa = rel.pessoas;
            if (!pessoa) return;
            
            const isLider = rel.papel && tagsLideranca.some(tag => rel.papel.toLowerCase().includes(tag));
            
            // Format phone if it exists
            let telefone = '';
            if (pessoa.celular) {
                const zap = pessoa.celular.replace(/\D/g, '');
                telefone = `<div style="font-size: 11px; margin-top: 4px; color: var(--text-muted);"><a href="https://wa.me/55${zap}" target="_blank" style="color: inherit; text-decoration: none;" title="Abrir WhatsApp">📱 ${pessoa.celular}</a></div>`;
            }
            
            let emailIcon = '';
            if (pessoa.email) {
                emailIcon = `<div style="font-size: 11px; margin-top: 2px; color: var(--text-muted);"><a href="mailto:${pessoa.email}" style="color: inherit; text-decoration: none;" title="Enviar E-mail">✉️ ${pessoa.email}</a></div>`;
            }
            
            const cardHtml = `
            <div style="background: var(--bg-panel); border: 1px solid ${isLider ? 'var(--primary)' : 'var(--border)'}; border-radius: 8px; padding: 16px; display: flex; flex-direction: column;">
                <div style="font-size: 15px; font-weight: 600; color: var(--text-main);">${pessoa.nome_completo}</div>
                <div style="font-size: 13px; color: var(--primary); margin-top: 4px; font-weight: 500;">${rel.papel || 'Membro'}</div>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
                    ${telefone}
                    ${emailIcon}
                </div>
                ${pessoa.papeis && pessoa.papeis.length > 0 ? 
                    `<div style="margin-top: 12px; display: flex; gap: 4px; flex-wrap: wrap;">
                        ${pessoa.papeis.map(t => `<span style="background: rgba(129, 140, 248, 0.1); color: #818cf8; padding: 2px 8px; border-radius: 12px; font-size: 10px;">${t}</span>`).join('')}
                    </div>` 
                : ''}
            </div>
            `;
            
            if (isLider) htmlLider += cardHtml;
            else htmlMembro += cardHtml;
        });
        
        if (htmlLider) {
            document.getElementById('containerLideranca').style.display = 'block';
            gridLideranca.innerHTML = htmlLider;
        }
        
        if (htmlMembro) {
            document.getElementById('containerMembros').style.display = 'block';
            gridMembros.innerHTML = htmlMembro;
        }
        
    } catch (err) {
        console.error("Erro ao carregar equipe:", err);
        document.getElementById('equipeStatus').textContent = "Erro: " + (err.message || "Falha ao buscar membros no banco de dados.");
    }
}

function configurarAbas() {
    const botoes = document.querySelectorAll('.tab-btn');
    const conteudos = document.querySelectorAll('.tab-content');

    botoes.forEach(btn => {
        btn.addEventListener('click', () => {
            botoes.forEach(b => b.classList.remove('active'));
            conteudos.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // No celular, recolhe o menu após clicar em uma aba
            const tabsNav = document.querySelector('.tabs-nav');
            if (tabsNav) {
                tabsNav.classList.remove('show-mobile');
            }
        });
    });

    // Auto-navegar para aba passada na URL (?id=XXX&tab=abaApps)
    const urlTab = urlParams.get('tab');
    if (urlTab) {
        // Usamos um timeout curto para garantir que outras manipulações (como carregarDadosEstrutura) já renderizaram o botão
        setTimeout(() => {
            const btn = document.querySelector(`[data-target="${urlTab}"]`);
            if (btn && btn.style.display !== 'none') {
                btn.click();
            }
        }, 300);
    }
}

// Assumir o controle do Menu Hambúrguer (Mobile)
window.onMobileMenuClick = () => {
    const tabsNav = document.querySelector('.tabs-nav');
    if (tabsNav) {
        tabsNav.classList.toggle('show-mobile');
    }
};

window.abrirOrganograma = function() {
    window.location.href = `organograma.html?id=${estruturaId}`;
};

// ==========================================
// MÓDULO DE DOCUMENTOS
// ==========================================
let documentosGlobais = [];

window.abrirModalDoc = (id = null) => {
    const modal = document.getElementById('modalDoc');
    document.getElementById('formDoc').reset();
    document.getElementById('inDocId').value = '';
    
    // Popular o select de Projetos
    const selectProj = document.getElementById('inDocProjetoId');
    if (selectProj && typeof projetosGlobais !== 'undefined') {
        selectProj.innerHTML = '<option value="">-- Solto (Nenhum Projeto) --</option>';
        projetosGlobais.forEach(p => {
            selectProj.innerHTML += `<option value="${p.id}">${p.tipo}: ${p.titulo}</option>`;
        });
    }

    if (id) {
        const doc = documentosGlobais.find(d => d.id === id);
        if (doc) {
            document.getElementById('modalDocTitle').textContent = 'Editar Documento';
            document.getElementById('inDocId').value = doc.id;
            document.getElementById('inDocTitulo').value = doc.titulo;
            document.getElementById('inDocTipo').value = doc.tipo;
            if (selectProj && doc.projeto_processo_id) {
                selectProj.value = doc.projeto_processo_id;
            }
            if (doc.tipo === 'Link') {
                document.getElementById('inDocLink').value = doc.conteudo;
            } else {
                document.getElementById('inDocMd').value = doc.conteudo;
            }
        }
    } else {
        document.getElementById('modalDocTitle').textContent = 'Adicionar Documento';
    }
    
    window.toggleDocType();
    modal.classList.add('show');
};

window.fecharModalDoc = () => {
    document.getElementById('modalDoc').classList.remove('show');
};

async function carregarDocumentos() {
    const listLocais = document.getElementById('listDocsLocais');
    const listOficiais = document.getElementById('listDocsOficiais');
    
    listLocais.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Carregando...</div>';
    listOficiais.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Carregando...</div>';
    
    try {
        // 1. Buscar Documentos Locais (Dono é a estrutura atual)
        const { data: locais, error: errLocais } = await db
            .from('documentos')
            .select('*')
            .eq('estrutura_id', estruturaId);
            
        // 2. Buscar Documentos Herdados (A estrutura atual está na tabela de visibilidade)
        const { data: visibilidade, error: errVis } = await db
            .from('documentos_visibilidade')
            .select('documento_id')
            .eq('estrutura_id', estruturaId);
            
        let herdados = [];
        if (visibilidade && visibilidade.length > 0) {
            const docIds = visibilidade.map(v => v.documento_id);
            const { data: herdadosData } = await db
                .from('documentos')
                .select('*, estruturas(nome)') // traz o nome de quem criou
                .in('id', docIds);
            herdados = herdadosData || [];
        }

        // Filtra para exibir na aba Documentos Gerais apenas os que não tem projeto
        const locaisSoltos = (locais || []).filter(d => !d.projeto_processo_id);
        const herdadosSoltos = herdados.filter(d => !d.projeto_processo_id);

        documentosGlobais = locais || []; // Mantemos todos globais para os Projetos poderem acessá-los
        renderizarDocumentos(locaisSoltos, listLocais, true);
        renderizarDocumentos(herdadosSoltos, listOficiais, false);
        
    } catch (err) {
        console.warn("Erro ao buscar documentos. Tabelas criadas?", err);
        listLocais.innerHTML = '<div style="color: #ef4444; font-size: 13px;">⚠️ Erro: As tabelas de documentos não foram criadas no Supabase.</div>';
        listOficiais.innerHTML = '';
    }
}

function renderizarDocumentos(docs, container, isLocal) {
    if (!docs || docs.length === 0) {
        container.innerHTML = `<div style="color: var(--text-muted); font-size: 13px;">Nenhum documento encontrado.</div>`;
        return;
    }
    
    let html = '';
    docs.forEach(doc => {
        const icon = doc.tipo === 'Link' ? '🔗' : '📝';
        const dono = isLocal ? 'Criado por nós' : `📌 Oficial de: ${doc.estruturas?.nome || 'Instância Superior'}`;
        
        let actionBtn = '';
        if (doc.tipo === 'Link') {
            actionBtn = `<a href="${doc.conteudo}" target="_blank" class="btn btn-primary" style="padding: 4px 8px; font-size: 12px; text-decoration: none;">Abrir Link &nearr;</a>`;
        } else {
            // Encode the markdown content to safely pass it in onclick
            const encodedContent = encodeURIComponent(doc.conteudo || '').replace(/'/g, "%27");
            const encodedTitle = encodeURIComponent(doc.titulo || '').replace(/'/g, "%27");
            actionBtn = `<button class="btn btn-primary" style="padding: 4px 8px; font-size: 12px;" onclick="abrirViewerMarkdown('${encodedTitle}', '${encodedContent}')">Ler Conteúdo</button>`;
        }
        
            let editBtn = '';
            let deleteBtn = '';
            if (isLocal) {
                editBtn = `<button onclick="abrirModalDoc('${doc.id}')" style="background: none; border: none; color: #60a5fa; cursor: pointer; font-size: 16px; padding: 4px;" title="Editar Documento">✏️</button>`;
                deleteBtn = `<button onclick="excluirDocumento('${doc.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 16px; padding: 4px;" title="Excluir Documento">🗑️</button>`;
            }

            html += `
            <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="font-size: 16px; font-weight: 600; color: var(--text-main);">${icon} ${doc.titulo}</div>
                    <div style="display: flex; gap: 8px;">
                        ${editBtn}
                        ${deleteBtn}
                    </div>
                </div>
                <div style="font-size: 12px; color: var(--text-muted);">${dono}</div>
            <div style="margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end;">
                ${actionBtn}
            </div>
        </div>
        `;
    });
    
    container.innerHTML = html;
}

// Removido declaração duplicada de abrirModalDoc e fecharModalDoc

window.toggleDocType = function() {
    const tipo = document.getElementById('inDocTipo').value;
    if (tipo === 'Link') {
        document.getElementById('groupDocLink').style.display = 'block';
        document.getElementById('inDocLink').required = true;
        document.getElementById('groupDocMd').style.display = 'none';
        document.getElementById('inDocMd').required = false;
    } else {
        document.getElementById('groupDocLink').style.display = 'none';
        document.getElementById('inDocLink').required = false;
        document.getElementById('groupDocMd').style.display = 'block';
        document.getElementById('inDocMd').required = true;
    }
};

async function popularSelectDepartamentos() {
    const container = document.getElementById('checkDepartamentos');
    try {
        const { data, error } = await db.from('estruturas').select('id, nome').neq('id', estruturaId).order('nome');
        if (data) {
            let html = '';
            data.forEach(d => {
                html += `
                <label style="display: flex; align-items: center; gap: 8px; color: var(--text-main); cursor: pointer;">
                    <input type="checkbox" class="chk-dept" value="${d.id}" style="width: auto;"> ${d.nome}
                </label>
                `;
            });
            container.innerHTML = html;
        }
    } catch (e) {
        container.innerHTML = '<span style="color: #ef4444;">Erro ao carregar</span>';
    }
}

async function salvarEnvioTesouraria(e) {
    e.preventDefault();
    
    const btnSubmit = document.getElementById('btnTesourariaSubmit');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Enviando...';
    
    try {
        const descricao = document.getElementById('tesourariaDescricao').value;
        const fileInput = document.getElementById('tesourariaArquivo');
        let arquivoUrl = null;
        
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `tesouraria/${fileName}`;
            
            const { error: uploadError } = await db.storage
                .from('documentos')
                .upload(filePath, file);
                
            if (uploadError) throw uploadError;
            
            const { data: publicUrlData } = db.storage.from('documentos').getPublicUrl(filePath);
            arquivoUrl = publicUrlData.publicUrl;
        }
        
        const { data: sessionData } = await db.auth.getSession();
        let remetenteNome = 'Desconhecido';
        if (sessionData?.session?.user) {
            remetenteNome = sessionData.session.user.user_metadata?.full_name || sessionData.session.user.email || 'Desconhecido';
        }
        
        const { error: dbError } = await db.from('app_tesouraria_envios').insert([{
            descricao: descricao,
            arquivo_url: arquivoUrl,
            remetente_nome: remetenteNome,
            status: 'pendente',
            estrutura_origem_id: estruturaId
        }]);
        
        if (dbError) throw dbError;
        
        alert('Enviado com sucesso para a Tesouraria!');
        document.getElementById('formTesourariaEnvio').reset();
    } catch (error) {
        console.error('Erro ao enviar para tesouraria:', error);
        alert('Erro ao enviar. Verifique o console.');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Enviar para Tesouraria';
    }
}

async function salvarDocumento(e) {
    e.preventDefault();
    
    const btnSave = document.getElementById('btnSaveDoc');
    btnSave.disabled = true;
    btnSave.textContent = 'Salvando...';
    
    const docId = document.getElementById('inDocId').value;
    const titulo = document.getElementById('inDocTitulo').value;
    const tipo = document.getElementById('inDocTipo').value;
    const projetoId = document.getElementById('inDocProjetoId').value || null;
    
    let conteudo = '';
    if (tipo === 'Link') {
        conteudo = document.getElementById('inDocLink').value;
    } else {
        conteudo = document.getElementById('inDocMd').value;
    }
    
    try {
        let savedDocId = null;
        
        if (docId) {
            // Atualizar
            const { error } = await db.from('documentos').update({
                titulo: titulo,
                tipo: tipo,
                conteudo: conteudo,
                projeto_processo_id: projetoId
            }).eq('id', docId);
            if (error) throw error;
            savedDocId = docId;
        } else {
            // Inserir
            const { data: newDoc, error } = await db.from('documentos').insert([{
                estrutura_id: estruturaId,
                titulo: titulo,
                tipo: tipo,
                conteudo: conteudo,
                projeto_processo_id: projetoId
            }]).select();
            
            if (error) throw error;
            if (newDoc && newDoc.length > 0) {
                savedDocId = newDoc[0].id;
            }
        }
        
        // Tratar Visibilidade (Herança)
        const checkDepartamentos = document.getElementById('checkDepartamentos');
        if (checkDepartamentos) {
            const checks = checkDepartamentos.querySelectorAll('.chk-dept:checked');
            
            if (docId) {
                // Deletar visibilidade antiga
                await db.from('documentos_visibilidade').delete().eq('documento_id', savedDocId);
            }
            
            if (checks.length > 0 && savedDocId) {
                const inserts = Array.from(checks).map(chk => ({
                    documento_id: savedDocId,
                    estrutura_id: chk.value
                }));
                const { error: visError } = await db.from('documentos_visibilidade').insert(inserts);
                if (visError) console.warn("Erro ao vincular visibilidade:", visError);
            }
        }
        
        fecharModalDoc();
        await carregarDocumentos();
        if(typeof carregarProjetosProcessos === 'function') await carregarProjetosProcessos(); // refresh pra mostrar no projeto
    } catch (err) {
        console.error("Erro ao salvar documento:", err);
        alert("Erro ao salvar documento. Detalhes no console.");
    } finally {
        btnSave.disabled = false;
        btnSave.textContent = 'Salvar Documento';
    }
}

window.excluirDocumento = async function(id) {
    if (!confirm("Tem certeza que deseja excluir este documento? Os departamentos que o herdaram também perderão o acesso.")) return;
    
    try {
        // O Supabase (Cascade Delete) ou a exclusao direta da visibilidade primeiro
        await db.from('documentos_visibilidade').delete().eq('documento_id', id);
        const { error } = await db.from('documentos').delete().eq('id', id);
        
        if (error) throw error;
        await carregarDocumentos();
    } catch (err) {
        console.error("Erro ao excluir", err);
        alert("Erro ao excluir.");
    }
};

// ==========================================
// RENDERIZADOR MARKDOWN
// ==========================================
window.abrirViewerMarkdown = function(encodedTitle, encodedContent) {
    const titulo = decodeURIComponent(encodedTitle);
    const conteudo = decodeURIComponent(encodedContent);
    
    document.getElementById('viewerTitle').textContent = titulo;
    
    // Converte o Markdown cru para HTML usando Marked.js
    const htmlConvertido = marked.parse(conteudo);
    document.getElementById('viewerContent').innerHTML = htmlConvertido;
    
    document.getElementById('modalViewer').style.display = 'flex';
};

window.fecharViewer = function() {
    document.getElementById('modalViewer').style.display = 'none';
    document.getElementById('viewerContent').innerHTML = '';
};

// ==========================================
// MÓDULO DE AGENDA
// ==========================================

async function carregarAgenda() {
    const listAgenda = document.getElementById('listAgenda');
    listAgenda.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Carregando...</div>';
    
    try {
        const hojeIso = new Date().toISOString();
        
        // Buscar eventos locais e globais futuros
        const { data: eventos, error } = await db
            .from('agenda')
            .select('*, estruturas(nome)')
            .or(`estrutura_id.eq.${estruturaId},visibilidade.eq.Global`)
            .gte('data_hora_inicio', hojeIso)
            .order('data_hora_inicio', { ascending: true });
            
        if (error) throw error;
        
        if (!eventos || eventos.length === 0) {
            listAgenda.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Nenhum evento agendado.</div>';
            return;
        }
        
        let html = '';
        eventos.forEach(ev => {
            const dataInicio = new Date(ev.data_hora_inicio);
            const dataFim = ev.data_hora_fim ? new Date(ev.data_hora_fim) : null;
            
            const dataFormatada = dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
            const horaFormatada = dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            const isGlobal = ev.visibilidade === 'Global';
            const badgeGloblal = isGlobal ? `<span style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-left: 8px;">GLOBAL</span>` : '';
            const organizador = isGlobal && ev.estruturas ? `Organizado por: ${ev.estruturas.nome}` : '';
            
            // Gerar Link Google Calendar (Formato: YYYYMMDDTHHMMSSZ)
            const gcalInicio = dataInicio.toISOString().split('.')[0].replace(/[-:]/g, "") + "Z";
            let gcalFim = gcalInicio;
            if (dataFim) {
                gcalFim = dataFim.toISOString().split('.')[0].replace(/[-:]/g, "") + "Z";
            } else {
                // +1 hora por padrão
                const tempFim = new Date(dataInicio.getTime() + 60 * 60 * 1000);
                gcalFim = tempFim.toISOString().split('.')[0].replace(/[-:]/g, "") + "Z";
            }
            const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.titulo)}&dates=${gcalInicio}/${gcalFim}&details=${encodeURIComponent(ev.descricao || '')}&location=${encodeURIComponent(ev.local || '')}`;

            // Gerar conteudo ICS
            const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${gcalInicio}
DTEND:${gcalFim}
SUMMARY:${ev.titulo}
DESCRIPTION:${ev.descricao || ''}
LOCATION:${ev.local || ''}
END:VEVENT
END:VCALENDAR`;
            
            const icsEncoded = encodeURIComponent(icsContent);

            html += `
            <div style="background: var(--bg-panel); border: 1px solid ${isGlobal ? '#ef4444' : 'var(--border)'}; border-radius: 8px; padding: 16px; display: flex; gap: 16px; position: relative;">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 8px; min-width: 60px;">
                    <div style="font-size: 14px; color: var(--primary); font-weight: bold;">${dataFormatada.split(' de ')[0]}</div>
                    <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">${dataFormatada.split(' de ')[1] || ''}</div>
                </div>
                <div style="flex: 1; padding-right: 24px;">
                    <div style="font-size: 16px; font-weight: 600; color: var(--text-main);">${ev.titulo} ${badgeGloblal}</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">⏰ ${horaFormatada} ${ev.local ? `| 📍 ${ev.local}` : ''}</div>
                    ${ev.descricao ? `<div style="font-size: 13px; color: var(--text-muted); margin-top: 8px; line-height: 1.4;">${ev.descricao}</div>` : ''}
                    ${organizador ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 8px;">${organizador}</div>` : ''}
                    
                    <div style="margin-top: 12px; display: flex; gap: 8px;">
                        <a href="${gcalUrl}" target="_blank" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px; text-decoration: none;">+ Google Agenda</a>
                        <a href="data:text/calendar;charset=utf8,${icsEncoded}" download="${ev.titulo.replace(/\s+/g, '_')}.ics" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px; text-decoration: none;">+ Apple/Outlook (.ics)</a>
                    </div>
                </div>
                <button onclick="excluirEventoAgenda('${ev.id}')" style="position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 14px; cursor: pointer; color: var(--text-muted);" title="Excluir Evento">🗑️</button>
            </div>
            `;
        });
        
        listAgenda.innerHTML = html;
    } catch (err) {
        console.warn("Erro ao carregar agenda", err);
        listAgenda.innerHTML = '<div style="color: #ef4444; font-size: 13px;">⚠️ Erro: Tabela agenda não encontrada.</div>';
    }
}

window.abrirModalEvento = function() {
    document.getElementById('formEvento').reset();
    document.getElementById('modalEvento').style.display = 'flex';
};

window.fecharModalEvento = function() {
    document.getElementById('modalEvento').style.display = 'none';
};

async function salvarEvento(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveEvento');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    const titulo = document.getElementById('inEvTitulo').value;
    const inicio = document.getElementById('inEvInicio').value;
    const fim = document.getElementById('inEvFim').value;
    const local = document.getElementById('inEvLocal').value;
    const visibilidade = document.getElementById('inEvVisibilidade').value;
    const descricao = document.getElementById('inEvDescricao').value;

    try {
        const { error } = await db.from('agenda').insert([{
            estrutura_id: estruturaId,
            titulo: titulo,
            data_hora_inicio: inicio ? new Date(inicio).toISOString() : null,
            data_hora_fim: fim ? new Date(fim).toISOString() : null,
            local: local,
            visibilidade: visibilidade,
            descricao: descricao
        }]);

        if (error) throw error;
        
        fecharModalEvento();
        await carregarAgenda();
    } catch (err) {
        console.error("Erro ao salvar evento:", err);
        alert("Erro ao salvar o evento.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Evento';
    }
}

window.excluirEventoAgenda = async (id) => {
    if (!confirm("Tem certeza que deseja apagar este evento da agenda?")) return;
    
    try {
        const { error } = await db.from('agenda').delete().eq('id', id);
        if (error) throw error;
        carregarAgenda();
    } catch (err) {
        console.error("Erro ao excluir evento:", err);
        alert("Erro ao excluir evento.");
    }
};

// ==========================================
// MÓDULO DE PROJETOS & PROCESSOS
// ==========================================
let projetosGlobais = [];

window.abrirModalProjeto = (tipo) => {
    document.getElementById('formProjeto').reset();
    document.getElementById('inProjetoId').value = '';
    document.getElementById('inProjetoTipo').value = tipo;
    

    document.getElementById('modalProjetoTitle').textContent = `Adicionar ${tipo}`;
    document.getElementById('modalProjeto').style.display = 'flex';
};

window.fecharModalProjeto = () => {
    document.getElementById('modalProjeto').style.display = 'none';
};

window.carregarProjetosProcessos = async () => {
    const container = document.getElementById('listProjetos');
    if(!container) return;
    
    container.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Carregando...</div>';
    
    try {
        const { data, error } = await db
            .from('projetos_processos')
            .select('*')
            .eq('estrutura_id', estruturaId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        projetosGlobais = data || [];
        renderizarProjetosProcessos();
    } catch (err) {
        console.warn("Erro ao buscar projetos:", err);
        container.innerHTML = '<div style="color: #ef4444; font-size: 13px;">⚠️ Erro: A tabela de projetos_processos não foi criada no Supabase.</div>';
    }
};

window.renderizarProjetosProcessos = () => {
    const container = document.getElementById('listProjetos');
    if (!projetosGlobais || projetosGlobais.length === 0) {
        container.innerHTML = `<div style="color: var(--text-muted); font-size: 13px;">Nenhum Projeto ou Processo encontrado.</div>`;
        return;
    }
    
    let html = '';
    projetosGlobais.forEach(proj => {
        const icon = proj.tipo === 'Projeto' ? '🚀' : '🔄';
        let badgeColor = 'var(--text-muted)';
        if(proj.status === 'Ativo') badgeColor = '#10b981';
        if(proj.status === 'Pausado') badgeColor = '#f59e0b';
        
        // Filtra documentos vinculados a este projeto
        const docsVinculados = typeof documentosGlobais !== 'undefined' ? documentosGlobais.filter(d => d.projeto_processo_id === proj.id) : [];
        let docsHtml = '';
        if (docsVinculados.length > 0) {
            docsHtml = '<div style="margin-top: 16px; border-top: 1px solid var(--border); padding-top: 12px; display: flex; flex-direction: column; gap: 8px;">';
            docsVinculados.forEach(doc => {
                const dIcon = doc.tipo === 'Link' ? '🔗' : '📝';
                
                let actionBtn = '';
                if (doc.tipo === 'Link') {
                    actionBtn = `onclick="window.open('${doc.conteudo}', '_blank')"`;
                } else {
                    const encodedContent = encodeURIComponent(doc.conteudo || '').replace(/'/g, "%27");
                    const encodedTitle = encodeURIComponent(doc.titulo || '').replace(/'/g, "%27");
                    actionBtn = `onclick="abrirViewerMarkdown('${encodedTitle}', '${encodedContent}')"`;
                }
                
                docsHtml += `
                <div style="background: rgba(255,255,255,0.03); border-radius: 6px; padding: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border);">
                    <div style="display: flex; align-items: center; gap: 12px; cursor: pointer;" ${actionBtn}>
                        <div style="background: var(--bg-dark); padding: 8px; border-radius: 6px;">${dIcon}</div>
                        <span style="font-size: 14px; font-weight: 500;">${doc.titulo}</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="abrirModalDoc('${doc.id}')" style="background: none; border: none; color: #60a5fa; cursor: pointer; font-size: 14px;" title="Editar Documento">✏️</button>
                        <button onclick="excluirDocumento('${doc.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 14px;" title="Excluir Documento">🗑️</button>
                    </div>
                </div>
                `;
            });
            docsHtml += '</div>';
        } else {
            docsHtml = '<div style="margin-top: 16px; font-size: 12px; color: var(--text-muted); font-style: italic;">Nenhum documento/bloco vinculado.</div>';
        }

        html += `
        <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 24px;">${icon}</div>
                    <div>
                        <h3 style="margin: 0; font-size: 18px; color: var(--text-main);">${proj.titulo}</h3>
                        <div style="font-size: 13px; color: ${badgeColor}; margin-top: 4px;">● ${proj.status}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="editarProjeto('${proj.id}')" style="background: none; border: none; color: #60a5fa; cursor: pointer; font-size: 16px;" title="Editar">✏️</button>
                    <button onclick="excluirProjeto('${proj.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 16px;" title="Excluir">🗑️</button>
                </div>
            </div>
            <p style="margin-top: 12px; color: var(--text-muted); font-size: 14px; line-height: 1.5;">${proj.descricao || ''}</p>
            ${docsHtml}
        </div>
        `;
    });
    
    container.innerHTML = html;
};

window.editarProjeto = (id) => {
    const proj = projetosGlobais.find(p => p.id === id);
    if (!proj) return;
    
    document.getElementById('inProjetoId').value = proj.id;
    document.getElementById('inProjetoTipo').value = proj.tipo;
    document.getElementById('inProjetoTitulo').value = proj.titulo;
    document.getElementById('inProjetoDescricao').value = proj.descricao;
    document.getElementById('inProjetoStatus').value = proj.status;
    
    document.getElementById('modalProjetoTitle').textContent = `Editar ${proj.tipo}`;
    document.getElementById('modalProjeto').style.display = 'flex';
};

window.excluirProjeto = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este item? Os documentos dentro dele não serão apagados, apenas ficarão 'soltos'.")) return;
    
    try {
        const { error } = await db.from('projetos_processos').delete().eq('id', id);
        if (error) throw error;
        await carregarProjetosProcessos();
    } catch (err) {
        console.error("Erro ao excluir", err);
        alert("Erro ao excluir.");
    }
};

window.salvarProjeto = async (e) => {
    e.preventDefault();
    const btnSave = document.getElementById('btnSaveProjeto');
    btnSave.disabled = true;
    
    const id = document.getElementById('inProjetoId').value;
    const tipo = document.getElementById('inProjetoTipo').value;
    const titulo = document.getElementById('inProjetoTitulo').value;
    const descricao = document.getElementById('inProjetoDescricao').value;
    const status = document.getElementById('inProjetoStatus').value;
    
    const dados = {
        estrutura_id: estruturaId,
        tipo, titulo, descricao, status
    };
    
    try {
        if (id) {
            const { error } = await db.from('projetos_processos').update(dados).eq('id', id);
            if(error) throw error;
        } else {
            const { error } = await db.from('projetos_processos').insert([dados]);
            if(error) throw error;
        }
        
        fecharModalProjeto();
        await carregarProjetosProcessos();
        
        // Atualiza o select de projetos no modal de Documentos
        const selectProj = document.getElementById('inDocProjetoId');
        if (selectProj) {
            selectProj.innerHTML = '<option value="">-- Solto (Nenhum Projeto) --</option>';
            projetosGlobais.forEach(p => {
                selectProj.innerHTML += `<option value="${p.id}">${p.tipo}: ${p.titulo}</option>`;
            });
        }
        
    } catch(err) {
        console.error("Erro ao salvar projeto:", err);
        alert("Erro ao salvar. Verifique se a tabela projetos_processos existe.");
    } finally {
        btnSave.disabled = false;
    }
};

// ==========================================
// MÓDULO DE APPS & SERVIÇOS (Ex: Irradiação)
// ==========================================
let currentIrradiacaoTab = 'pendentes';
let currentIrradiacaoDia = 'Segunda-feira';

window.carregarAppMiniApps = async function() {
    const container = document.getElementById('containerApps');
    
    // Obter nomeEstrutura
    const nomeHub = document.getElementById('hubName').textContent || '';
    const nomeEstrutura = nomeHub.toLowerCase();
    const isIrradiacao = nomeEstrutura.includes('irradia') || nomeEstrutura.includes('sela');
    const isAssistencia = nomeEstrutura.includes('assist') && nomeEstrutura.includes('social');
    
    let cards = '';
    
    if (isIrradiacao) {
        cards += `
            <div onclick="abrirMiniAppIrradiacao()" style="background: rgba(79, 70, 229, 0.05); border: 1px solid #4f46e5; border-radius: 12px; padding: 24px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.05);" onmouseover="this.style.background='rgba(79, 70, 229, 0.1)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(79, 70, 229, 0.05)'; this.style.transform='none'">
                <div style="font-size: 32px; margin-bottom: 12px;">✨</div>
                <h3 style="color: #4f46e5; margin-bottom: 8px;">Irradiação Espiritual</h3>
                <p style="color: var(--text-muted); font-size: 13px; line-height: 1.4;">Solicitação de preces e tratamentos à distância.</p>
            </div>
            
            <div onclick="carregarPainelGestaoIrradiacao()" style="background: rgba(16, 185, 129, 0.05); border: 1px solid #10b981; border-radius: 12px; padding: 24px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.05);" onmouseover="this.style.background='rgba(16, 185, 129, 0.1)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(16, 185, 129, 0.05)'; this.style.transform='none'">
                <div style="font-size: 32px; margin-bottom: 12px;">⚙️</div>
                <h3 style="color: #10b981; margin-bottom: 8px;">Gestão de Irradiações</h3>
                <p style="color: var(--text-muted); font-size: 13px; line-height: 1.4;">Painel da equipe para leitura de nomes, histórico e estatísticas.</p>
            </div>
        `;
    }
    
    if (isAssistencia) {
        cards += `
            <div onclick="carregarAppFamilias()" style="background: rgba(236, 72, 153, 0.05); border: 1px solid #ec4899; border-radius: 12px; padding: 24px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.05);" onmouseover="this.style.background='rgba(236, 72, 153, 0.1)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(236, 72, 153, 0.05)'; this.style.transform='none'">
                <div style="font-size: 32px; margin-bottom: 12px;">👨‍👩‍👧‍👦</div>
                <h3 style="color: #ec4899; margin-bottom: 8px;">Famílias Assistidas</h3>
                <p style="color: var(--text-muted); font-size: 13px; line-height: 1.4;">Acompanhamento Social, Diário de Ocorrências e Cadastro de Dependentes.</p>
            </div>
            
            <div onclick="carregarAppAssistencia()" style="background: rgba(16, 185, 129, 0.05); border: 1px solid #10b981; border-radius: 12px; padding: 24px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.05);" onmouseover="this.style.background='rgba(16, 185, 129, 0.1)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(16, 185, 129, 0.05)'; this.style.transform='none'">
                <div style="font-size: 32px; margin-bottom: 12px;">📦</div>
                <h3 style="color: #10b981; margin-bottom: 8px;">Logística de Cestas</h3>
                <p style="color: var(--text-muted); font-size: 13px; line-height: 1.4;">Gestão do Almoxarifado, Cestas Básicas, Campanhas e Metas de Entrega.</p>
            </div>
        `;
    }
    
    container.innerHTML = `
        <div style="margin-bottom: 24px;">
            <h2 style="font-size: 20px; color: var(--text-main); margin-bottom: 8px;">📱 Mini-Apps</h2>
            <p style="color: var(--text-muted); font-size: 14px;">Bem-vindo ao ecossistema de módulos da sua casa espírita.</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
            ${cards}
            
            <!-- Placeholder para futuros apps -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px dashed var(--border); border-radius: 12px; padding: 24px; text-align: center; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0.5;">
                <div style="font-size: 24px; margin-bottom: 8px;">+</div>
                <div style="font-size: 13px;">Novos módulos em breve</div>
            </div>
        </div>
    `;
}

window.abrirMiniAppIrradiacao = async function() {
    const container = document.getElementById('containerApps');
    
    container.innerHTML = `
        <style>
            #formIrradiacao .input-field {
                border: 2px solid rgba(148, 163, 184, 0.6) !important;
                padding: 12px 16px !important;
                background-color: rgba(0, 0, 0, 0.02) !important;
                border-radius: 8px !important;
                font-size: 15px !important;
            }
            #formIrradiacao .input-field:focus {
                border-color: var(--primary) !important;
                background-color: rgba(255, 255, 255, 0.08) !important;
                outline: none;
            }
            #formIrradiacao .tag-checkbox-ui {
                background: rgba(0, 0, 0, 0.03) !important;
                border: 2px solid rgba(148, 163, 184, 0.4) !important;
                padding: 12px !important;
                border-radius: 12px !important;
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            }
            #formIrradiacao .tag-checkbox-ui:hover {
                border-color: var(--primary) !important;
                background: rgba(79, 70, 229, 0.1) !important;
            }
        </style>
        
        <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
            <div>
                <button onclick="carregarAppMiniApps()" class="btn btn-secondary" style="margin-bottom: 16px; font-size: 13px;">← Voltar aos Mini-Apps</button>
                <h2 style="font-size: 20px; color: var(--text-main); margin-bottom: 8px;">✨ App de Irradiação</h2>
                <p style="color: var(--text-muted); font-size: 14px;">Nova solicitação de tratamento espiritual.</p>
            </div>
        </div>

        <div style="background: rgba(79, 70, 229, 0.05); border: 1px solid var(--border); border-radius: 12px; padding: 24px; max-width: 600px;">
            <h3 style="color: var(--primary); margin-bottom: 16px;">📝 Nova Solicitação - via Portal Luz do Amanhã</h3>
            <form id="formIrradiacao" style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 6px;">Nome(s) Completo(s) do(s) Necessitado(s) *</label>
                    <input type="text" id="inIrrNome" required class="input-field" placeholder="EX: MARIA DA SILVA --- JOSÉ DA SILVA" style="width: 100%; text-transform: uppercase;" list="listaNomesIrr">
                    <datalist id="listaNomesIrr"></datalist>
                    <label style="display: flex; align-items: center; gap: 8px; margin-top: 12px; cursor: pointer;">
                        <input type="checkbox" id="chkIrrDesencarnado" onchange="toggleDesencarnadoIrr(this.checked)" style="width: 18px; height: 18px; accent-color: var(--primary);">
                        <span style="font-size: 14px; font-weight: 500; color: #facc15;">Este nome é de uma pessoa desencarnada (falecida)</span>
                    </label>
                </div>
                <div id="groupIrrEndereco">
                    <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 6px;">Endereço Completo</label>
                    <input type="text" id="inIrrEndereco" class="input-field" placeholder="RUA, NÚMERO, BAIRRO, CIDADE" style="width: 100%; text-transform: uppercase;">
                </div>
                <div>
                    <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 8px;">Dias para Irradiação *</label>
                    <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                        <label class="tag-checkbox-ui" style="text-align: center; line-height: 1.4;"><input type="checkbox" class="chk-dia" value="Segunda-feira"> Segunda-feira<br><small style="font-weight: normal; font-size: 11px; opacity: 0.8;">(Influênciação espiritual)</small></label>
                        <label class="tag-checkbox-ui" style="text-align: center; line-height: 1.4;"><input type="checkbox" class="chk-dia" value="Terça-feira"> Terça-feira<br><small style="font-weight: normal; font-size: 11px; opacity: 0.8;">(Saúde física/espiritual)</small></label>
                        <label class="tag-checkbox-ui" style="text-align: center; line-height: 1.4;"><input type="checkbox" class="chk-dia" value="Quarta-feira (Desobsessão)"> Quarta-feira<br><small style="font-weight: normal; font-size: 11px; opacity: 0.8;">(Desobsessão)</small></label>
                        <label class="tag-checkbox-ui" style="text-align: center; line-height: 1.4;"><input type="checkbox" class="chk-dia" value="Quarta-feira (Desencarnado)"> Quarta-feira<br><small style="font-weight: normal; font-size: 11px; opacity: 0.8;">(Desencarnado)</small></label>
                        <label class="tag-checkbox-ui" style="text-align: center; line-height: 1.4;"><input type="checkbox" class="chk-dia" value="Quinta-feira"> Quinta-feira<br><small style="font-weight: normal; font-size: 11px; opacity: 0.8;">(Saúde física/espiritual)</small></label>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
                    <button type="submit" class="btn btn-primary" id="btnSaveIrr">Enviar Solicitação</button>
                </div>
            </form>

            <!-- Painel de Sucesso -->
            <div id="panelSuccess" style="display: none; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
                <h3 style="color: #10b981; margin-bottom: 12px; font-size: 20px;">Pedido Enviado!</h3>
                <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 24px;">O nome foi incluído na lista para os dias selecionados.</p>
                
                <div id="resumeContent" style="background: rgba(0,0,0,0.2); padding: 16px; border-radius: 8px; font-size: 13px; color: var(--text-main); text-align: left; margin-bottom: 24px; border: 1px solid var(--border);">
                </div>

                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button onclick="novaSolicitacaoIrr()" class="btn btn-primary" style="width: 100%;">Fazer Novo Pedido</button>
                    <button onclick="cancelarSolicitacaoIrr()" id="btnCancelIrr" class="btn" style="width: 100%; border: 1px solid #ef4444; color: #ef4444; background: transparent;">Apagar Solicitação (Cancelar)</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('formIrradiacao').addEventListener('submit', salvarIrradiacao);
    
    // Auto-complete (Sugestões de Nomes e Endereços)
    setTimeout(async () => {
        try {
            const estruturaId = localStorage.getItem('estrutura_atual');
            let query = db.from('app_irradiacao_solicitacoes').select('nome_solicitado, endereco').order('criado_em', { ascending: false });
            if (estruturaId) {
                query = query.eq('estrutura_id', estruturaId);
            }
            const { data, error } = await query;
                
            if (!error && data) {
                window.sugestoesIrradiacao = {};
                const datalist = document.getElementById('listaNomesIrr');
                data.forEach(item => {
                    const n = item.nome_solicitado.toUpperCase();
                    if (!window.sugestoesIrradiacao[n]) {
                        window.sugestoesIrradiacao[n] = item.endereco ? item.endereco.toUpperCase() : '';
                        const opt = document.createElement('option');
                        opt.value = n;
                        datalist.appendChild(opt);
                    }
                });
            }
        } catch(e) { console.error('Erro ao carregar sugestões', e); }
    }, 100);

    const inputNome = document.getElementById('inIrrNome');
    inputNome.addEventListener('input', function() {
        const val = this.value.toUpperCase();
        if (window.sugestoesIrradiacao && window.sugestoesIrradiacao[val] !== undefined) {
            const end = document.getElementById('inIrrEndereco');
            // Preenche apenas se estiver vazio para não sobrescrever caso o usuário já tenha digitado algo
            if (!end.value) {
                end.value = window.sugestoesIrradiacao[val];
            }
        }
    });
};

window.toggleDesencarnadoIrr = function(isDesencarnado) {
    const inputEndereco = document.getElementById('inIrrEndereco');
    const groupEndereco = document.getElementById('groupIrrEndereco');
    const chkQuartaDesencarnado = document.querySelector('#formIrradiacao input[value="Quarta-feira (Desencarnado)"]');
    
    if (isDesencarnado) {
        inputEndereco.disabled = true;
        inputEndereco.value = '';
        inputEndereco.placeholder = 'NÃO É NECESSÁRIO PARA DESENCARNADOS';
        if(groupEndereco) groupEndereco.style.opacity = '0.5';
        
        if (chkQuartaDesencarnado && !chkQuartaDesencarnado.checked) {
            chkQuartaDesencarnado.checked = true;
        }
    } else {
        inputEndereco.disabled = false;
        inputEndereco.placeholder = 'RUA, NÚMERO, BAIRRO, CIDADE';
        if(groupEndereco) groupEndereco.style.opacity = '1';
        
        if (chkQuartaDesencarnado && chkQuartaDesencarnado.checked) {
            chkQuartaDesencarnado.checked = false;
        }
    }
};

window.lastInsertedIrrIds = [];

window.novaSolicitacaoIrr = function() {
    document.getElementById('formIrradiacao').reset();
    document.querySelectorAll('#formIrradiacao .tag-checkbox-ui').forEach(el => el.classList.remove('selected'));
    toggleDesencarnadoIrr(false);
    document.getElementById('formIrradiacao').style.display = 'flex';
    document.getElementById('panelSuccess').style.display = 'none';
    window.lastInsertedIrrIds = [];
};

window.cancelarSolicitacaoIrr = async function() {
    if (window.lastInsertedIrrIds.length === 0) return;
    if (!confirm("Tem certeza que deseja cancelar e apagar esta solicitação?")) return;
    
    const btn = document.getElementById('btnCancelIrr');
    btn.disabled = true;
    btn.textContent = 'Apagando...';
    
    try {
        for (const id of window.lastInsertedIrrIds) {
            await db.from('app_irradiacao_solicitacoes').delete().eq('id', id);
        }
        alert("Solicitação apagada com sucesso.");
        novaSolicitacaoIrr();
    } catch (err) {
        console.error(err);
        alert("Erro ao apagar solicitação.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Apagar Solicitação (Cancelar)';
    }
};

window.carregarPainelGestaoIrradiacao = async function() {
    const container = document.getElementById('containerApps');
    
    container.innerHTML = `
        <div style="margin-bottom: 24px;">
            <button onclick="carregarAppMiniApps()" class="btn btn-secondary" style="margin-bottom: 16px; font-size: 13px;">← Voltar aos Mini-Apps</button>
            <h2 style="font-size: 20px; color: #10b981; margin-bottom: 8px;">⚙️ Gestão de Irradiações</h2>
            <p style="color: var(--text-muted); font-size: 14px;">Painel exclusivo para a equipe de trabalhadores da Irradiação.</p>
        </div>
        
        <div>
            <div style="display: flex; gap: 16px; margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 16px; overflow-x: auto;">
                <button onclick="mudarAbaIrradiacao('pendentes')" id="btnIrrPendentes" class="btn" style="white-space: nowrap; border-radius: 8px;">📥 Pendentes</button>
                <button onclick="mudarAbaIrradiacao('ativos')" id="btnIrrAtivos" class="btn" style="white-space: nowrap; border-radius: 8px;">📋 Painel de Leitura</button>
                <button onclick="mudarAbaIrradiacao('historico')" id="btnIrrHistorico" class="btn" style="white-space: nowrap; border-radius: 8px;">🗄️ Histórico</button>
                <button onclick="mudarAbaIrradiacao('estatisticas')" id="btnIrrEstatisticas" class="btn" style="white-space: nowrap; border-radius: 8px;">📊 Estatísticas</button>
                <button onclick="mudarAbaIrradiacao('limpeza')" id="btnIrrLimpeza" class="btn" style="white-space: nowrap; border-radius: 8px;">🧹 Limpeza</button>
            </div>
            
            <div id="filtrosDiasIrr" style="display: none; gap: 12px; margin-bottom: 16px; overflow-x: auto; padding-bottom: 8px;">
                <button class="btn btn-secondary btn-dia" data-dia="Todos" onclick="setDiaIrradiacao('')">Todos os dias</button>
                <button class="btn btn-secondary btn-dia" data-dia="Segunda-feira" onclick="setDiaIrradiacao('Segunda-feira')">Segunda-feira</button>
                <button class="btn btn-secondary btn-dia" data-dia="Terça-feira" onclick="setDiaIrradiacao('Terça-feira')">Terça-feira</button>
                <button class="btn btn-secondary btn-dia" data-dia="Quarta-feira (Desobsessão)" onclick="setDiaIrradiacao('Quarta-feira (Desobsessão)')">Quarta-feira (Desob)</button>
                <button class="btn btn-secondary btn-dia" data-dia="Quarta-feira (Desencarnado)" onclick="setDiaIrradiacao('Quarta-feira (Desencarnado)')">Quarta-feira (Desenc)</button>
                <button class="btn btn-secondary btn-dia" data-dia="Quinta-feira" onclick="setDiaIrradiacao('Quinta-feira')">Quinta-feira</button>
            </div>

            <div id="listaIrradiacoes" style="display: flex; flex-direction: column; gap: 12px;">
                <div style="color: var(--text-muted); font-size: 13px;">Carregando...</div>
            </div>
            
            <div id="estatisticasContainer" style="display: none; flex-direction: column; gap: 24px;">
                <div style="color: var(--text-muted); font-size: 13px;">Carregando estatísticas...</div>
            </div>

            <div id="limpezaContainer" style="display: none; flex-direction: column; gap: 24px;">
                <div style="color: var(--text-muted); font-size: 13px;">Buscando possíveis duplicatas...</div>
            </div>

            <!-- Modal Fim de Leitura -->
            <div id="modalFimLeitura" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 24px; max-width: 400px; width: 90%;">
                    <h3 style="color: var(--primary); margin-top: 0; font-size: 18px;">✅ Ciclo Concluído!</h3>
                    <p style="color: var(--text-main); font-size: 14px; margin-bottom: 24px; line-height: 1.5;" id="msgFimLeitura"></p>
                    <div style="display: flex; gap: 12px; flex-direction: column;">
                        <button id="btnModalRenovar" class="btn btn-primary" style="padding: 10px;">♻️ Renovar Tratamento (Zerar)</button>
                        <button id="btnModalHistorico" class="btn btn-secondary" style="padding: 10px;">🗄️ Mover para o Histórico</button>
                        <button onclick="document.getElementById('modalFimLeitura').style.display='none'" class="btn" style="padding: 10px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);">Cancelar</button>
                    </div>
                </div>
            </div>

            <!-- Modal de Edição de Irradiação -->
            <div id="modalEdicaoIrradiacao" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 24px; max-width: 400px; width: 90%;">
                    <h3 style="color: var(--primary); margin-top: 0; font-size: 18px;">✏️ Editar Solicitação</h3>
                    
                    <form id="formEdicaoIrradiacao" onsubmit="salvarEdicaoIrradiacao(event)">
                        <input type="hidden" id="editIrrId">
                        
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="color: var(--text-muted); font-size: 13px;">Nome Solicitado (Nomes agrupados)</label>
                            <input type="text" id="editIrrNome" required class="input" style="width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; padding: 8px; border-radius: 4px;">
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="color: var(--text-muted); font-size: 13px;">Endereço</label>
                            <textarea id="editIrrEndereco" class="input" rows="2" style="width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; padding: 8px; border-radius: 4px;"></textarea>
                        </div>

                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="color: var(--text-muted); font-size: 13px;">Dia / Necessidade</label>
                            <select id="editIrrDia" required class="input" style="width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; padding: 8px; border-radius: 4px;">
                                <option value="Segunda-feira">Segunda-feira</option>
                                <option value="Terça-feira">Terça-feira</option>
                                <option value="Quarta-feira (Desobsessão)">Quarta-feira (Desob)</option>
                                <option value="Quarta-feira (Desencarnado)">Quarta-feira (Desenc)</option>
                                <option value="Quinta-feira">Quinta-feira</option>
                            </select>
                        </div>

                        <div class="form-group" style="margin-bottom: 24px;">
                            <label style="color: var(--text-muted); font-size: 13px;">Semanas Alvo (Meta)</label>
                            <input type="number" id="editIrrSemanas" required min="1" max="52" class="input" style="width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; padding: 8px; border-radius: 4px;">
                        </div>

                        <div style="display: flex; gap: 12px;">
                            <button type="submit" class="btn btn-primary" style="flex: 1; padding: 10px;">💾 Salvar</button>
                            <button type="button" onclick="document.getElementById('modalEdicaoIrradiacao').style.display='none'" class="btn" style="flex: 1; padding: 10px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    window.mudarAbaIrradiacao('pendentes');
}

window.mudarAbaIrradiacao = function(aba) {
    currentIrradiacaoTab = aba;
    
    // Atualiza botões
    const btnPendentes = document.getElementById('btnIrrPendentes');
    const btnAtivos = document.getElementById('btnIrrAtivos');
    const btnHistorico = document.getElementById('btnIrrHistorico');
    
    const btnEstatisticas = document.getElementById('btnIrrEstatisticas');
    const btnLimpeza = document.getElementById('btnIrrLimpeza');
    
    btnPendentes.style.background = aba === 'pendentes' ? 'rgba(56, 189, 248, 0.2)' : 'transparent';
    btnPendentes.style.color = aba === 'pendentes' ? '#38bdf8' : 'var(--text-muted)';
    btnPendentes.style.border = aba === 'pendentes' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent';
    
    btnAtivos.style.background = aba === 'ativos' ? 'rgba(16,185,129,0.2)' : 'transparent';
    btnAtivos.style.color = aba === 'ativos' ? '#10b981' : 'var(--text-muted)';
    btnAtivos.style.border = aba === 'ativos' ? '1px solid rgba(16,185,129,0.4)' : '1px solid transparent';
    
    btnHistorico.style.background = aba === 'historico' ? 'rgba(255, 255, 255, 0.1)' : 'transparent';
    btnHistorico.style.color = aba === 'historico' ? 'white' : 'var(--text-muted)';
    btnHistorico.style.border = aba === 'historico' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent';
    
    btnEstatisticas.style.background = aba === 'estatisticas' ? 'rgba(245, 158, 11, 0.2)' : 'transparent';
    btnEstatisticas.style.color = aba === 'estatisticas' ? '#f59e0b' : 'var(--text-muted)';
    btnEstatisticas.style.border = aba === 'estatisticas' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent';
    
    if (btnLimpeza) {
        btnLimpeza.style.background = aba === 'limpeza' ? 'rgba(236, 72, 153, 0.2)' : 'transparent';
        btnLimpeza.style.color = aba === 'limpeza' ? '#ec4899' : 'var(--text-muted)';
        btnLimpeza.style.border = aba === 'limpeza' ? '1px solid rgba(236, 72, 153, 0.4)' : '1px solid transparent';
    }
    
    // Filtros de dia aparecem no "ativos", "historico" e "pendentes"
    const filtrosDias = document.getElementById('filtrosDiasIrr');
    const listaIrradiacoes = document.getElementById('listaIrradiacoes');
    const estatisticasContainer = document.getElementById('estatisticasContainer');
    const limpezaContainer = document.getElementById('limpezaContainer');
    
    if (aba === 'estatisticas') {
        filtrosDias.style.display = 'none';
        listaIrradiacoes.style.display = 'none';
        if (limpezaContainer) limpezaContainer.style.display = 'none';
        estatisticasContainer.style.display = 'flex';
        carregarEstatisticasIrradiacao();
    } else if (aba === 'limpeza') {
        filtrosDias.style.display = 'none';
        listaIrradiacoes.style.display = 'none';
        estatisticasContainer.style.display = 'none';
        if (limpezaContainer) limpezaContainer.style.display = 'flex';
        carregarLimpezaIrradiacao();
    } else {
        estatisticasContainer.style.display = 'none';
        if (limpezaContainer) limpezaContainer.style.display = 'none';
        listaIrradiacoes.style.display = 'flex';
        
        filtrosDias.style.display = 'flex';
        window.setDiaIrradiacao(currentIrradiacaoDia); // Força render
    }
}

window.setDiaIrradiacao = function(dia) {
    currentIrradiacaoDia = dia;
    
    document.querySelectorAll('.btn-dia').forEach(b => {
        const btnDia = b.getAttribute('data-dia') || '';
        const isActive = (dia === '' && btnDia === 'Todos') || (dia !== '' && btnDia === dia);
        b.style.background = isActive ? 'var(--primary)' : 'var(--bg-dark)';
        b.style.color = isActive ? '#fff' : 'var(--text-muted)';
    });
    
    carregarListaIrradiacao();
}

async function carregarListaIrradiacao() {
    const lista = document.getElementById('listaIrradiacoes');
    if (!lista) return;
    
    try {
        let query = db.from('app_irradiacao_solicitacoes')
                      .select('*')
                      .eq('estrutura_id', estruturaId);
                      
        if (currentIrradiacaoTab === 'pendentes') {
            query = query.eq('status', 'pendente').order('nome_solicitado', { ascending: true });
        } else if (currentIrradiacaoTab === 'ativos') {
            query = query.eq('status', 'ativo').order('nome_solicitado', { ascending: true });
        } else if (currentIrradiacaoTab === 'historico') {
            query = query.eq('status', 'historico').order('nome_solicitado', { ascending: true });
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        // --- Cálculo e atualização dos botões de filtro ---
        let counts = {
            'Todos os dias': data ? data.length : 0,
            'Segunda-feira': 0,
            'Terça-feira': 0,
            'Quarta-feira (Desobsessão)': 0,
            'Quarta-feira (Desencarnado)': 0,
            'Quinta-feira': 0
        };
        
        if (data) {
            data.forEach(item => {
                const d = item.dias_semana || '';
                if (d.includes('Segunda-feira')) counts['Segunda-feira']++;
                if (d.includes('Terça-feira')) counts['Terça-feira']++;
                if (d.includes('Quarta-feira (Desobsessão)')) counts['Quarta-feira (Desobsessão)']++;
                if (d.includes('Quarta-feira (Desencarnado)')) counts['Quarta-feira (Desencarnado)']++;
                if (d.includes('Quinta-feira')) counts['Quinta-feira']++;
            });
        }
        
        document.querySelectorAll('.btn-dia').forEach(b => {
            const btnDia = b.getAttribute('data-dia') || '';
            if (btnDia === 'Todos') {
                b.innerHTML = `Todos os dias <span style="opacity:0.6; font-size:0.9em; margin-left:4px;">(${counts['Todos os dias']})</span>`;
            } else if (btnDia === 'Segunda-feira') {
                b.innerHTML = `Segunda-feira <span style="opacity:0.6; font-size:0.9em; margin-left:4px;">(${counts['Segunda-feira']})</span>`;
            } else if (btnDia === 'Terça-feira') {
                b.innerHTML = `Terça-feira <span style="opacity:0.6; font-size:0.9em; margin-left:4px;">(${counts['Terça-feira']})</span>`;
            } else if (btnDia === 'Quarta-feira (Desobsessão)') {
                b.innerHTML = `Quarta-feira (Desob) <span style="opacity:0.6; font-size:0.9em; margin-left:4px;">(${counts['Quarta-feira (Desobsessão)']})</span>`;
            } else if (btnDia === 'Quarta-feira (Desencarnado)') {
                b.innerHTML = `Quarta-feira (Desenc) <span style="opacity:0.6; font-size:0.9em; margin-left:4px;">(${counts['Quarta-feira (Desencarnado)']})</span>`;
            } else if (btnDia === 'Quinta-feira') {
                b.innerHTML = `Quinta-feira <span style="opacity:0.6; font-size:0.9em; margin-left:4px;">(${counts['Quinta-feira']})</span>`;
            }
        });
        
        // Filtra os dados no lado do cliente
        const filteredData = currentIrradiacaoDia === '' 
            ? data 
            : (data || []).filter(item => (item.dias_semana || '').includes(currentIrradiacaoDia));
        
        if (!filteredData || filteredData.length === 0) {
            lista.innerHTML = '<div style="color: var(--text-muted); font-size: 14px; text-align: center; padding: 24px; background: rgba(255,255,255,0.02); border-radius: 8px;">Nenhum registro encontrado nesta visão.</div>';
            return;
        }
        
        let html = '';
        filteredData.forEach(item => {
            const dataPed = new Date(item.criado_em).toLocaleDateString('pt-BR');
            
            // Botões de Ação
            let actionsHtml = '';
            let progressHtml = '';
            const safeNome = item.nome_solicitado.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const safeEndereco = (item.endereco||'').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const safeDias = (item.dias_semana||'').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const semanasAlvoStr = item.semanas_alvo || 4;

            if (currentIrradiacaoTab === 'pendentes') {
                actionsHtml = `
                    <button onclick="aprovarIrradiacao('${item.id}', '${safeNome}', '${safeEndereco}', '${safeDias}')" class="btn btn-primary" style="padding: 6px 12px;">✅ Aprovar p/ Leitura</button>
                    <button onclick="abrirModalEdicaoIrradiacao('${item.id}', '${safeNome}', '${safeEndereco}', '${safeDias}', ${semanasAlvoStr})" class="btn btn-secondary" style="padding: 6px 12px;">✏️ Editar</button>
                    <button onclick="excluirIrradiacaoDefinitivo('${item.id}')" class="btn" style="color: #ef4444; border: 1px solid #ef4444; padding: 6px 12px; background: transparent;">Apagar</button>
                `;
            } else if (currentIrradiacaoTab === 'ativos') {
                const leituras = item.leituras || 0;
                const semanas_alvo = item.semanas_alvo || 4; // Fallback se não existir no DB
                let caixinhas = '';
                for(let i=1; i<=semanas_alvo; i++) {
                    if (i <= leituras) {
                        caixinhas += `<span class="bola-irradiacao preenchida" style="display:inline-block; width:16px; height:16px; background:#10b981; border-radius:50%; margin-right:4px; margin-bottom:4px; transition: all 0.3s ease;"></span>`;
                    } else {
                        caixinhas += `<span class="bola-irradiacao vazia" style="display:inline-block; width:16px; height:16px; border:2px solid #334155; border-radius:50%; margin-right:4px; margin-bottom:4px; transition: all 0.3s ease;"></span>`;
                    }
                }
                
                let checkboxRepetir = `
                    <label style="font-size: 11px; display: flex; align-items: center; gap: 4px; color: var(--text-muted); cursor: pointer; margin-bottom: 6px;">
                        <input type="checkbox" onchange="toggleRenovacaoAutomatica('${item.id}', this.checked)" ${item.renovacao_automatica ? 'checked' : ''}>
                        Repetir (Reiniciar ciclo automaticamente)
                    </label>
                `;
                
                progressHtml = `<div style="margin-top: 8px; font-size: 12px; color: var(--text-muted);">${checkboxRepetir}Leituras: ${leituras}/${semanas_alvo}<br><div style="margin-top:4px; display:flex; flex-wrap:wrap; max-width: 250px;">${caixinhas}</div></div>`;
                
                actionsHtml = `
                    <button id="btn_ler_${item.id}" onclick="marcarLeituraIrr(this, '${item.id}', ${leituras}, ${semanas_alvo}, ${item.renovacao_automatica ? 'true' : 'false'})" class="btn" style="background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid #10b981; padding: 6px 12px; transition: all 0.3s ease;">✅ Registrar Leitura</button>
                    <button onclick="abrirModalEdicaoIrradiacao('${item.id}', '${safeNome}', '${safeEndereco}', '${safeDias}', ${semanasAlvoStr})" class="btn btn-secondary" style="padding: 6px 12px;">✏️ Editar</button>
                    <button onclick="arquivarIrradiacao('${item.id}')" class="btn btn-secondary" style="padding: 6px 12px;">Forçar Arquivamento</button>
                `;
            } else if (currentIrradiacaoTab === 'historico') {
                actionsHtml = `
                    <button onclick="aprovarIrradiacao('${item.id}', '${safeNome}', '${safeEndereco}', '${safeDias}')" class="btn btn-secondary" style="padding: 6px 12px;">♻️ Reativar (Triagem)</button>
                    <button onclick="abrirModalEdicaoIrradiacao('${item.id}', '${safeNome}', '${safeEndereco}', '${safeDias}', ${semanasAlvoStr})" class="btn btn-secondary" style="padding: 6px 12px;">✏️ Editar</button>
                    <button onclick="excluirIrradiacaoDefinitivo('${item.id}')" class="btn" style="color: #ef4444; border: 1px solid #ef4444; padding: 6px 12px; background: transparent;">Apagar</button>
                `;
            }
            
            html += `
                <div id="card_irr_${item.id}" style="background: var(--bg-dark); border: 1px solid var(--border); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 12px; transition: all 0.5s ease;">
                    <div style="display: flex; justify-content: space-between;">
                        <div style="flex: 1;">
                            <h4 style="color: var(--text-main); margin: 0 0 4px 0; font-size: 16px;">${item.nome_solicitado}</h4>
                            <p style="color: var(--text-muted); font-size: 13px; margin: 0;">📍 ${item.endereco || 'Endereço não informado'}</p>
                            <span style="font-size: 11px; color: var(--text-muted);">Criado em: ${dataPed} | Dia alvo: <strong style="color: #cbd5e1;">${item.dias_semana}</strong></span>
                            ${progressHtml}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        ${actionsHtml}
                    </div>
                </div>
            `;
        });
        lista.innerHTML = html;
        
    } catch (e) {
        console.error(e);
        if (lista) lista.innerHTML = '<div style="color: #ef4444;">Erro ao carregar solicitações.</div>';
    }
}

async function salvarIrradiacao(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveIrr');
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    
    let nome = document.getElementById('inIrrNome').value.toUpperCase();
    const endereco = document.getElementById('inIrrEndereco').value.toUpperCase();
    const isDesencarnado = document.getElementById('chkIrrDesencarnado') && document.getElementById('chkIrrDesencarnado').checked;
    
    if (isDesencarnado) {
        nome = "[DESENCARNADO] " + nome;
    }
    
    const checkboxes = document.querySelectorAll('.chk-dia:checked');
    const dias = Array.from(checkboxes).map(c => c.value);
    
    if (dias.length === 0) {
        alert("Selecione pelo menos um dia para a Irradiação.");
        btn.disabled = false;
        btn.textContent = 'Enviar Solicitação';
        return;
    }
    
    try {
        // Criar N registros independentes, um para cada dia selecionado
        const recordsToInsert = dias.map(dia => ({
            estrutura_id: estruturaId,
            nome_solicitado: nome,
            endereco: endereco,
            dias_semana: dia,
            status: 'pendente',
            leituras: 0
        }));
        
        const { data, error } = await db.from('app_irradiacao_solicitacoes').insert(recordsToInsert).select('id');
        if (error) throw error;
        
        window.lastInsertedIrrIds = data.map(r => r.id);
        
        document.getElementById('formIrradiacao').style.display = 'none';
        document.getElementById('panelSuccess').style.display = 'block';
        document.getElementById('resumeContent').innerHTML = `
            <strong>Nome:</strong> ${nome}<br>
            <strong>Endereço:</strong> ${endereco || 'Não informado'}<br>
            <strong style="display:block; margin-top:8px;">Dias:</strong> 
            ${dias.join('<br>')}
        `;
        
        await carregarListaIrradiacao();
    } catch (err) {
        console.error(err);
        alert("Erro ao enviar solicitação.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Enviar Solicitação';
    }
}

window.toggleRenovacaoAutomatica = async function(id, isChecked) {
    try {
        const { error } = await db.from('app_irradiacao_solicitacoes').update({ renovacao_automatica: isChecked }).eq('id', id);
        if (error) throw error;
        // Não recarregamos a lista para evitar piscar a tela, a alteração no banco já está feita.
    } catch (e) {
        console.error(e);
        alert('Erro ao atualizar opção de repetir ciclo: ' + e.message);
    }
}

window.levenshteinIrr = function(a, b) {
    if(a.length === 0) return b.length;
    if(b.length === 0) return a.length;
    const matrix = [];
    for(let i=0; i<=b.length; i++) matrix[i] = [i];
    for(let j=0; j<=a.length; j++) matrix[0][j] = j;
    for(let i=1; i<=b.length; i++){
        for(let j=1; j<=a.length; j++){
            if(b.charAt(i-1) === a.charAt(j-1)){
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(matrix[i-1][j-1]+1, Math.min(matrix[i][j-1]+1, matrix[i-1][j]+1));
            }
        }
    }
    return matrix[b.length][a.length];
};

window.similaridadeIrr = function(a, b) {
    const maxLen = Math.max(a.length, b.length);
    if(maxLen === 0) return 1.0;
    const dist = window.levenshteinIrr(a, b);
    return (maxLen - dist) / maxLen;
};

window.carregarLimpezaIrradiacao = async function() {
    const container = document.getElementById('limpezaContainer');
    container.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Baixando e analisando registros... isso pode levar alguns segundos.</div>';
    
    try {
        const estruturaId = localStorage.getItem('estrutura_atual');
        let query = db.from('app_irradiacao_solicitacoes').select('id, nome_solicitado');
        if (estruturaId) query = query.eq('estrutura_id', estruturaId);
        const { data, error } = await query;
        if (error) throw error;
        
        // Count frequencies of each exact name
        const nomeCounts = {};
        data.forEach(r => {
            const n = (r.nome_solicitado || '').toUpperCase().trim();
            if (n) {
                nomeCounts[n] = (nomeCounts[n] || 0) + 1;
            }
        });
        
        const nomesUnicos = Object.keys(nomeCounts);
        const grupos = [];
        const processados = new Set();
        
        // Compara todos com todos
        for (let i = 0; i < nomesUnicos.length; i++) {
            const nomeA = nomesUnicos[i];
            if (processados.has(nomeA)) continue;
            
            let grupoAtual = [nomeA];
            for (let j = i + 1; j < nomesUnicos.length; j++) {
                const nomeB = nomesUnicos[j];
                if (processados.has(nomeB)) continue;
                
                // Ignorar nomes muito curtos para não dar falso positivo
                if (nomeA.length < 5 || nomeB.length < 5) continue;
                
                const sim = window.similaridadeIrr(nomeA, nomeB);
                if (sim >= 0.82) { // 82% de similaridade
                    grupoAtual.push(nomeB);
                }
            }
            
            if (grupoAtual.length > 1) {
                grupoAtual.forEach(n => processados.add(n));
                grupos.push(grupoAtual);
            }
        }
        
        if (grupos.length === 0) {
            container.innerHTML = `
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 24px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 40px; margin-bottom: 16px;">✨</div>
                    <h3 style="color: #10b981; margin-bottom: 8px;">Banco de Dados Limpo!</h3>
                    <p style="color: var(--text-muted); font-size: 14px;">Não encontramos nenhum nome com suspeita de duplicidade ou erro de digitação.</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <div style="background: rgba(236, 72, 153, 0.1); border: 1px solid rgba(236, 72, 153, 0.2); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                <h3 style="color: #ec4899; margin-bottom: 8px; font-size: 16px;">⚠️ Possíveis Duplicatas Encontradas (${grupos.length})</h3>
                <p style="color: var(--text-muted); font-size: 13px; line-height: 1.5;">O algoritmo identificou nomes muito parecidos. Escolha a grafia correta em cada grupo para unificá-los. Os registros antigos serão atualizados para o nome oficial escolhido (endereços e históricos serão preservados).</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 16px;">
        `;
        
        grupos.forEach((grupo, idx) => {
            html += `<div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 16px;">
                <h4 style="color: var(--text-main); font-size: 14px; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">Grupo ${idx + 1}</h4>
                <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
            `;
            
            grupo.forEach(nome => {
                html += `
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px solid transparent;" onmouseover="this.style.border='1px solid var(--border)'" onmouseout="this.style.border='1px solid transparent'">
                        <input type="radio" name="grupo_${idx}" value="${nome}" style="accent-color: #ec4899;">
                        <span style="color: var(--text-main); font-size: 14px;">${nome}</span>
                        <span style="background: rgba(255,255,255,0.1); color: var(--text-muted); padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: auto;">${nomeCounts[nome]} registro(s)</span>
                    </label>
                `;
            });
            
            const arrayNomesEncoded = encodeURIComponent(JSON.stringify(grupo));
            html += `</div>
                <button onclick="unificarNomesIrr(${idx}, '${arrayNomesEncoded}')" class="btn" style="background: rgba(236, 72, 153, 0.15); color: #ec4899; border: 1px solid rgba(236, 72, 153, 0.3); width: 100%;">🔗 Unificar selecionado</button>
            </div>`;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div style="color: #ef4444; font-size: 13px;">Erro ao analisar duplicatas.</div>';
    }
};

window.unificarNomesIrr = async function(idx, arrayEncoded) {
    const radios = document.getElementsByName(`grupo_${idx}`);
    let selecionado = null;
    for (let r of radios) {
        if (r.checked) { selecionado = r.value; break; }
    }
    
    if (!selecionado) {
        alert('Por favor, selecione qual é a grafia correta (oficial) antes de unificar.');
        return;
    }
    
    if (!confirm(`Tem certeza que deseja atualizar todos os registros deste grupo para o nome:\n\n"${selecionado}"\n\nEssa ação não afeta os endereços ou o andamento das leituras.`)) {
        return;
    }
    
    const nomesDoGrupo = JSON.parse(decodeURIComponent(arrayEncoded));
    const nomesErrados = nomesDoGrupo.filter(n => n !== selecionado);
    
    try {
        for (let nomeErrado of nomesErrados) {
            // Supabase ilike fetch to get the ids
            const { data: recordsToUpdate } = await db.from('app_irradiacao_solicitacoes').select('id').ilike('nome_solicitado', nomeErrado);
            if (recordsToUpdate && recordsToUpdate.length > 0) {
                const ids = recordsToUpdate.map(r => r.id);
                const { error } = await db.from('app_irradiacao_solicitacoes').update({ nome_solicitado: selecionado }).in('id', ids);
                if (error) throw error;
            }
        }
        
        alert('Nomes unificados com sucesso!');
        carregarLimpezaIrradiacao(); // recarrega a tela
    } catch (e) {
        console.error(e);
        alert('Erro ao unificar nomes: ' + e.message);
    }
};

window.aprovarIrradiacao = function(id, nome, endereco, dias_semana) {
    const oldModal = document.getElementById('modalTriagemIrr');
    if (oldModal) oldModal.remove();

    const diasOpcoes = ['Segunda-feira', 'Terça-feira', 'Quarta-feira (Desobsessão)', 'Quarta-feira (Desencarnado)', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
    
    let opcoesDiaHtml = diasOpcoes.map(dia => `<option value="${dia}" ${dia === dias_semana ? 'selected' : ''}>${dia}</option>`).join('');

    const modalHtml = `
        <div id="modalTriagemIrr" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
            <div style="background: var(--bg-dark); border: 1px solid var(--border); border-radius: 12px; padding: 24px; width: 90%; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                <h3 style="color: var(--text-main); font-size: 18px; margin-bottom: 16px;">Triagem de Irradiação</h3>
                
                <div style="margin-bottom: 16px;">
                    <p style="margin:0; font-size: 14px; color: var(--text-muted);">Nome Solicitado:</p>
                    <p style="margin:0; font-weight: bold; color: white;">${nome}</p>
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="display:block; font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">Dia da Semana:</label>
                    <select id="triagemDia" style="width: 100%; padding: 8px 12px; border-radius: 8px; background: var(--bg-panel); border: 1px solid var(--border); color: white;">
                        ${opcoesDiaHtml}
                    </select>
                </div>

                <div style="margin-bottom: 24px;">
                    <label style="display:block; font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">Duração do Tratamento:</label>
                    <select id="triagemSemanas" style="width: 100%; padding: 8px 12px; border-radius: 8px; background: var(--bg-panel); border: 1px solid var(--border); color: white;">
                        <option value="4">4 Semanas (Padrão)</option>
                        <option value="16">16 Semanas (Longo)</option>
                    </select>
                </div>

                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button onclick="document.getElementById('modalTriagemIrr').remove()" class="btn btn-secondary">Cancelar</button>
                    <button onclick="confirmarTriagem('${id}')" class="btn btn-primary" style="background: #10b981; color: white; border: none;">Aprovar Pedido</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.confirmarTriagem = async function(id) {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    const diaSelecionado = document.getElementById('triagemDia').value;
    const semanasAlvo = parseInt(document.getElementById('triagemSemanas').value);

    try {
        const { error } = await db.from('app_irradiacao_solicitacoes').update({ 
            status: 'ativo', 
            leituras: 0,
            dias_semana: diaSelecionado,
            semanas_alvo: semanasAlvo
        }).eq('id', id);

        if (error) throw error;

        document.getElementById('modalTriagemIrr').remove();
        await carregarListaIrradiacao();

    } catch (err) {
        console.error(err);
        alert('Erro ao confirmar triagem. Verifique se a coluna semanas_alvo já foi criada no banco de dados. ' + (err.message || ''));
        btn.disabled = false;
        btn.textContent = 'Aprovar Pedido';
    }
}

window.marcarLeituraIrr = async function(btnElement, id, leituras_atuais, semanas_alvo, autoRenovar = false) {
    try {
        const novaLeitura = leituras_atuais + 1;
        const card = document.getElementById(`card_irr_${id}`);
        
        // --- EFEITO VISUAL IMEDIATO (Optimistic UI) ---
        if (btnElement && btnElement.nodeType) { 
            btnElement.disabled = true;
            btnElement.innerHTML = '✔️ Lido';
            btnElement.style.background = '#059669';
            btnElement.style.color = '#ffffff';
        }

        if (card) {
            // 1. Esmaece o card
            card.style.opacity = '0.5';
            card.style.borderColor = '#10b981';

            // 2. Anima a próxima bolinha vazia
            const proxBola = card.querySelector('.bola-irradiacao.vazia');
            if (proxBola) {
                proxBola.classList.remove('vazia');
                proxBola.classList.add('preenchida');
                proxBola.style.border = 'none';
                proxBola.style.background = '#10b981';
                proxBola.style.transform = 'scale(1.3)';
                setTimeout(() => {
                    proxBola.style.transform = 'scale(1)';
                }, 300);
            }
        }
        // ----------------------------------------------
        
        // Buscar log_datas_leituras atual
        const { data: rowData, error: fetchErr } = await db.from('app_irradiacao_solicitacoes').select('log_datas_leituras').eq('id', id).single();
        if (fetchErr) throw fetchErr;
        
        let logs = rowData.log_datas_leituras || [];
        if (!Array.isArray(logs)) logs = [];
        logs.push(new Date().toISOString());
        
        if (novaLeitura >= semanas_alvo) {
            if (autoRenovar) {
                // Reinicia ciclo automaticamente
                const { error } = await db.from('app_irradiacao_solicitacoes').update({ 
                    leituras: 0, 
                    status: 'ativo',
                    log_datas_leituras: logs
                }).eq('id', id);
                if (error) throw error;
                // Não chamamos carregarListaIrradiacao(); aqui para não perder o efeito visual
            } else {
                const modal = document.getElementById('modalFimLeitura');
                const msg = document.getElementById('msgFimLeitura');
                msg.innerHTML = `O ciclo de <strong>${semanas_alvo} semanas</strong> desta irradiação chegou ao fim.<br><br>O que você deseja fazer com este nome agora?`;
                modal.style.display = 'flex';
            
            document.getElementById('btnModalRenovar').onclick = async function() {
                modal.style.display = 'none';
                try {
                    const { error } = await db.from('app_irradiacao_solicitacoes').update({ 
                        leituras: 0, 
                        status: 'ativo',
                        log_datas_leituras: logs
                    }).eq('id', id);
                    if (error) throw error;
                    // Fica esmaecido, não recarrega a lista
                } catch(e) { console.error(e); alert('Erro ao renovar'); }
            };
            
            document.getElementById('btnModalHistorico').onclick = async function() {
                modal.style.display = 'none';
                try {
                    const { error } = await db.from('app_irradiacao_solicitacoes').update({ 
                        leituras: novaLeitura, 
                        status: 'historico',
                        log_datas_leituras: logs
                    }).eq('id', id);
                    if (error) throw error;
                    if (card) card.style.display = 'none'; // Esconde o card pois foi pro histórico
                } catch(e) { console.error(e); alert('Erro ao arquivar'); }
            };
            }
        } else {
            // Apenas adiciona a leitura
            const { error } = await db.from('app_irradiacao_solicitacoes').update({ 
                leituras: novaLeitura,
                log_datas_leituras: logs
            }).eq('id', id);
            if (error) throw error;
            // Não chamamos carregarListaIrradiacao(); aqui para não perder o efeito visual
        }
        
    } catch (err) { 
        console.error(err); 
        alert('Erro ao marcar leitura');
        // Reverte o visual em caso de erro
        if (btnElement && btnElement.nodeType) {
            btnElement.disabled = false;
            btnElement.innerHTML = '✅ Registrar Leitura';
            btnElement.style.background = 'rgba(16,185,129,0.1)';
            btnElement.style.color = '#10b981';
        }
        const card = document.getElementById(`card_irr_${id}`);
        if (card) {
            card.style.opacity = '1';
            card.style.borderColor = 'var(--border)';
        }
    }
}

window.arquivarIrradiacao = async function(id) {
    if(!confirm("Deseja forçar o arquivamento deste nome mesmo antes das 4 semanas?")) return;
    try {
        const { error } = await db.from('app_irradiacao_solicitacoes').update({ status: 'historico' }).eq('id', id);
        if (error) throw error;
        await carregarListaIrradiacao();
    } catch (err) { console.error(err); alert('Erro ao arquivar'); }
}

window.reativarIrradiacao = async function(id) {
    try {
        const { error } = await db.from('app_irradiacao_solicitacoes').update({ status: 'ativo', leituras: 0 }).eq('id', id);
        if (error) throw error;
        await carregarListaIrradiacao();
    } catch (err) { console.error(err); alert('Erro ao reativar'); }
}

window.excluirIrradiacaoDefinitivo = async function(id) {
    if(!confirm("Atenção! Confirma exclusão DEFINITIVA do sistema?")) return;
    try {
        const { error } = await db.from('app_irradiacao_solicitacoes').delete().eq('id', id);
        if (error) throw error;
        await carregarListaIrradiacao();
    } catch (err) { console.error(err); alert("Erro ao excluir."); }
};

window.irradiacaoChartInstance = null;

window.imprimirEstatisticasIrr = function() {
    const style = document.createElement('style');
    style.id = 'printEstatisticasStyle';
    style.innerHTML = `
        @media print {
            body * { visibility: hidden !important; }
            #estatisticasContainer, #estatisticasContainer * { visibility: visible !important; }
            #estatisticasContainer { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
            #btnImprimirEstat { display: none !important; }
            
            /* Ajustes para forçar cores de fundo na impressão caso o navegador permita, e evitar quebra de cards */
            div { page-break-inside: avoid; }
            
            /* Garante que o canvas caiba na folha */
            #chartLeiturasMensais { max-width: 100% !important; height: auto !important; max-height: 400px !important; }
        }
    `;
    document.head.appendChild(style);
    
    // Pequeno delay para o navegador renderizar a tag <style>
    setTimeout(() => {
        window.print();
        // Remove a tag depois que a janela de impressão fecha
        setTimeout(() => {
            const s = document.getElementById('printEstatisticasStyle');
            if (s) s.remove();
        }, 1000);
    }, 200);
};

window.carregarEstatisticasIrradiacao = async function() {
    const container = document.getElementById('estatisticasContainer');
    container.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Processando dados, aguarde...</div>';
    
    try {
        const { data, error } = await db.from('app_irradiacao_solicitacoes').select('*');
        if (error) throw error;
        
        let totalAtivos = 0;
        let totalHistorico = 0;
        let totalPendentes = 0;
        const ativosPorDia = {};
        const historicoPorDia = {};
        const leiturasPorMes = {};
        const leiturasPorMesPorDia = {};
        
        const pessoasUnicasAtivas = new Set();
        const pessoasUnicasHistorico = new Set();
        
        data.forEach(item => {
            const nomeStr = (item.nome_solicitado || '').trim().toUpperCase();
            
            if (item.status === 'ativo') {
                totalAtivos++;
                if (nomeStr) pessoasUnicasAtivas.add(nomeStr);
                ativosPorDia[item.dias_semana] = (ativosPorDia[item.dias_semana] || 0) + 1;
            } else if (item.status === 'historico') {
                totalHistorico++;
                if (nomeStr) pessoasUnicasHistorico.add(nomeStr);
                historicoPorDia[item.dias_semana] = (historicoPorDia[item.dias_semana] || 0) + 1;
            } else if (item.status === 'pendente') {
                totalPendentes++;
            }
            
            // Processar as leituras reais
            let logs = item.log_datas_leituras;
            if (typeof logs === 'string') {
                try { logs = JSON.parse(logs); } catch(e) { logs = []; }
            }
            if (Array.isArray(logs) && logs.length > 0) {
                const diaDaIrradiacao = item.dias_semana || 'Outros';
                logs.forEach(dateStr => {
                    const date = new Date(dateStr);
                    if (!isNaN(date)) {
                        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        leiturasPorMes[monthKey] = (leiturasPorMes[monthKey] || 0) + 1;
                        if (!leiturasPorMesPorDia[monthKey]) leiturasPorMesPorDia[monthKey] = {};
                        leiturasPorMesPorDia[monthKey][diaDaIrradiacao] = (leiturasPorMesPorDia[monthKey][diaDaIrradiacao] || 0) + 1;
                    }
                });
            }
        });
        
        // Pessoas que concluíram mas continuam ativas em outro dia não devem ser contadas como totalmente concluídas
        pessoasUnicasAtivas.forEach(nome => {
            if (pessoasUnicasHistorico.has(nome)) {
                pessoasUnicasHistorico.delete(nome);
            }
        });
        
        // Sorting months
        const sortedMonths = Object.keys(leiturasPorMes).sort();
        const chartLabels = sortedMonths.map(m => {
            const [year, month] = m.split('-');
            const date = new Date(year, month - 1);
            return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        });
        const chartData = sortedMonths.map(m => leiturasPorMes[m]);

        // Render HTML
        const formatTable = (dict) => {
            if (Object.keys(dict).length === 0) return '<div style="color:var(--text-muted); font-size:13px;">Sem dados</div>';
            return Object.entries(dict).sort((a,b)=>b[1]-a[1]).map(([dia, count]) => `
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding: 8px 0;">
                    <span style="color: var(--text-muted); font-size: 13px;">${dia}</span>
                    <strong style="color: var(--text-main); font-size: 14px;">${count}</strong>
                </div>
            `).join('');
        };

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="color: var(--primary); font-size: 18px; margin: 0;">Relatório de Estatísticas</h3>
                <button onclick="imprimirEstatisticasIrr()" id="btnImprimirEstat" class="btn btn-primary" style="padding: 8px 16px; border-radius: 8px; font-weight: 500;">🖨️ Imprimir / Salvar PDF</button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 20px; text-align: center;">
                    <h4 style="color: var(--text-muted); font-size: 13px; text-transform: uppercase; margin: 0 0 8px 0;">Pedidos Pendentes</h4>
                    <div style="font-size: 32px; font-weight: bold; color: #38bdf8;">${totalPendentes}</div>
                </div>
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 20px; text-align: center;">
                    <h4 style="color: var(--text-muted); font-size: 13px; text-transform: uppercase; margin: 0 0 8px 0;">Pessoas Ativas (Lendo)</h4>
                    <div style="font-size: 32px; font-weight: bold; color: #10b981;">${totalAtivos}</div>
                </div>
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 20px; text-align: center;">
                    <h4 style="color: var(--text-muted); font-size: 13px; text-transform: uppercase; margin: 0 0 8px 0;">Pessoas Concluídas (Histórico)</h4>
                    <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${totalHistorico}</div>
                </div>
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 20px; text-align: center;">
                    <h4 style="color: var(--text-muted); font-size: 13px; text-transform: uppercase; margin: 0 0 8px 0;">Total de Leituras Realizadas</h4>
                    <div style="font-size: 32px; font-weight: bold; color: #3b82f6;">${Object.values(leiturasPorMes).reduce((a,b)=>a+b, 0)}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 16px;">
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 20px; text-align: center;">
                    <h4 style="color: var(--text-muted); font-size: 13px; text-transform: uppercase; margin: 0 0 8px 0;">Pessoas Únicas Ativas (Lendo)</h4>
                    <div style="font-size: 32px; font-weight: bold; color: #10b981;">${pessoasUnicasAtivas.size}</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Indivíduos sendo tratados independentemente do dia</div>
                </div>
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 20px; text-align: center;">
                    <h4 style="color: var(--text-muted); font-size: 13px; text-transform: uppercase; margin: 0 0 8px 0;">Pessoas Únicas Concluídas (Histórico)</h4>
                    <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${pessoasUnicasHistorico.size}</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Indivíduos que já concluíram ciclo independentemente do dia</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; margin-top: 16px;">
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 20px;">
                    <h4 style="color: #10b981; font-size: 14px; margin: 0 0 16px 0;">Ativos por Dia / Necessidade</h4>
                    ${formatTable(ativosPorDia)}
                </div>
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 20px;">
                    <h4 style="color: #f59e0b; font-size: 14px; margin: 0 0 16px 0;">Histórico por Dia / Necessidade</h4>
                    ${formatTable(historicoPorDia)}
                </div>
            </div>

            <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 20px; margin-top: 16px;">
                <h4 style="color: var(--text-main); font-size: 14px; margin: 0 0 16px 0;">Evolução de Leituras por Mês (Esforço da Equipe)</h4>
                <div style="position: relative; height: 300px; width: 100%;">
                    <canvas id="chartLeiturasMensais"></canvas>
                </div>
            </div>
        `;

        if (window.irradiacaoChartInstance) {
            window.irradiacaoChartInstance.destroy();
        }

        const chartContainer = document.getElementById('chartLeiturasMensais');
        
        if (chartLabels.length === 0) {
            chartContainer.outerHTML = "<p style='color:var(--text-muted); text-align:center; padding: 24px;'>Nenhum dado encontrado para gerar gráfico.</p>";
        } else if (window.Chart) {
            const ctx = chartContainer.getContext('2d');
            
            const diasDisponiveis = [
                'Segunda-feira', 
                'Terça-feira', 
                'Quarta-feira (Desobsessão)', 
                'Quarta-feira (Desencarnado)', 
                'Quinta-feira', 
                'Outros'
            ];
            
            const colors = [
                'rgba(59, 130, 246, 0.7)', // azul
                'rgba(16, 185, 129, 0.7)', // verde
                'rgba(245, 158, 11, 0.7)', // amarelo
                'rgba(236, 72, 153, 0.7)', // rosa
                'rgba(139, 92, 246, 0.7)', // roxo
                'rgba(148, 163, 184, 0.7)' // cinza
            ];
            
            const datasets = diasDisponiveis.map((dia, index) => {
                return {
                    label: dia,
                    data: sortedMonths.map(m => (leiturasPorMesPorDia[m] && leiturasPorMesPorDia[m][dia]) ? leiturasPorMesPorDia[m][dia] : 0),
                    backgroundColor: colors[index],
                    stack: 'Stack 0',
                    borderWidth: 0,
                    borderRadius: 4
                };
            }).filter(dataset => dataset.data.some(val => val > 0)); // Remove os dias que não tem nenhuma leitura
            
            // Adiciona a barra de Total do Mês (em uma pilha separada para ficar lado a lado)
            datasets.push({
                label: 'Total do Mês',
                data: sortedMonths.map(m => leiturasPorMes[m] || 0),
                backgroundColor: 'rgba(99, 102, 241, 0.35)', // Indigo
                borderColor: 'rgba(99, 102, 241, 0.8)',
                borderWidth: 1,
                stack: 'Stack 1',
                borderRadius: 4
            });
            
            window.irradiacaoChartInstance = new window.Chart(ctx, {
                type: 'bar',
                data: {
                    labels: chartLabels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { 
                            display: true, 
                            labels: { color: '#94a3b8', font: { size: 11 } }
                        }
                    },
                    scales: {
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            ticks: { color: '#94a3b8' },
                            grid: { color: 'rgba(255,255,255,0.05)' }
                        },
                        x: {
                            stacked: true,
                            ticks: { color: '#94a3b8' },
                            grid: { display: false }
                        }
                    }
                }
            });
        } else {
            console.error("Chart.js is undefined.");
            chartContainer.outerHTML = "<p style='color:#ef4444; text-align:center; padding: 24px;'>Erro: Biblioteca Chart.js não foi carregada no navegador.</p>";
        }

    } catch (e) {
        console.error(e);
        container.innerHTML = '<div style="color: #ef4444;">Erro ao carregar estatísticas.</div>';
    }
}

window.abrirModalEdicaoIrradiacao = function(id, nome, endereco, dia, semanas) {
    document.getElementById('editIrrId').value = id;
    document.getElementById('editIrrNome').value = nome;
    document.getElementById('editIrrEndereco').value = endereco;
    document.getElementById('editIrrDia').value = dia;
    document.getElementById('editIrrSemanas').value = semanas;
    
    document.getElementById('modalEdicaoIrradiacao').style.display = 'flex';
};

window.salvarEdicaoIrradiacao = async function(event) {
    event.preventDefault();
    
    const id = document.getElementById('editIrrId').value;
    const nome = document.getElementById('editIrrNome').value.toUpperCase();
    const endereco = document.getElementById('editIrrEndereco').value.toUpperCase();
    const dia = document.getElementById('editIrrDia').value;
    const semanas = parseInt(document.getElementById('editIrrSemanas').value, 10);
    
    try {
        const { error } = await db.from('app_irradiacao_solicitacoes').update({
            nome_solicitado: nome,
            endereco: endereco,
            dias_semana: dia,
            semanas_alvo: semanas
        }).eq('id', id);
        
        if (error) throw error;
        
        document.getElementById('modalEdicaoIrradiacao').style.display = 'none';
        await carregarListaIrradiacao();
        
    } catch (err) {
        console.error(err);
        alert('Erro ao salvar as edições. Verifique a conexão.');
    }
};

