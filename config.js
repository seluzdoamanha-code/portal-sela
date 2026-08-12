const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    await carregarDepartamentos();
    await carregarPerfis();
    await carregarSociais();
    await inicializarLuzGestao();
    await carregarMatrizAbas();
    
    document.getElementById('btnSalvarSociais').addEventListener('click', salvarSociais);
    
    // Configurar Temas
    configurarTemas();
});

// ----------------------------------------------------
// LÓGICA DOS TEMAS
// ----------------------------------------------------
function configurarTemas() {
    const botoesTema = document.querySelectorAll('.theme-selector-btn');
    const temaSalvo = localStorage.getItem('central_sela_theme') || 'theme-dark';

    // Marca o ativo no carregamento
    botoesTema.forEach(btn => {
        if (btn.dataset.theme === temaSalvo) {
            btn.classList.add('active');
        }
        
        btn.addEventListener('click', (e) => {
            const novoTema = e.currentTarget.dataset.theme;
            
            // Remove active de todos
            botoesTema.forEach(b => b.classList.remove('active'));
            
            // Adiciona active no clicado
            e.currentTarget.classList.add('active');
            
            // Salva e aplica
            localStorage.setItem('central_sela_theme', novoTema);
            document.body.className = novoTema === 'theme-dark' ? '' : novoTema;
            
            showAviso('Tema visual alterado com sucesso! ✅');
        });
    });
}


function showAviso(msg) {
    const alertBox = document.getElementById('alertMessage');
    alertBox.textContent = msg;
    alertBox.style.display = 'block';
    setTimeout(() => { alertBox.style.display = 'none'; }, 5000);
}

// ==========================================
// MÓDULO: DEPARTAMENTOS NO MENU
// ==========================================
async function carregarDepartamentos() {
    const container = document.getElementById('listaDepartamentos');
    const loading = document.getElementById('loadingDepartamentos');
    
    try {
        const { data, error } = await db.from('estruturas').select('id, nome, tipo, exibir_no_menu').order('tipo').order('nome');
        loading.style.display = 'none';
        
        if (error) {
            // Se der erro, provavelmente a coluna 'exibir_no_menu' não existe ainda.
            container.innerHTML = `<div style="color: #ef4444; padding: 16px; background: rgba(239, 68, 68, 0.1); border-radius: 8px;">
                ⚠️ A coluna <b>exibir_no_menu</b> (tipo Boolean) ainda não foi criada na tabela <i>estruturas</i> do Supabase. Crie-a lá pelo painel do Supabase para ativar este recurso.
            </div>`;
            return;
        }
        
        let html = '';
        data.forEach(d => {
            html += `
            <div class="toggle-row">
                <div>
                    <div style="color: var(--text-main); font-weight: 500;">${d.nome}</div>
                    <div style="color: var(--text-muted); font-size: 12px; margin-top: 2px;">Tipo: ${d.tipo}</div>
                </div>
                <label class="switch">
                    <input type="checkbox" onchange="toggleMenu('${d.id}', this.checked)" ${d.exibir_no_menu ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (err) {
        console.error("Erro ao carregar estruturas:", err);
    }
}

window.toggleMenu = async (id, checked) => {
    try {
        const { error } = await db.from('estruturas').update({ exibir_no_menu: checked }).eq('id', id);
        if (error) throw error;
        
        showAviso(checked ? 'Departamento adicionado ao Menu!' : 'Departamento removido do Menu.');
        // Recarrega o menu lateral sem precisar atualizar a pagina inteira!
        if(window.carregarAtalhosDinamicos) {
            window.carregarAtalhosDinamicos();
        }
    } catch (err) {
        console.error("Erro ao atualizar menu:", err);
        alert("Erro ao atualizar. Veja o console.");
    }
};

// ==========================================
// MÓDULO: REDES SOCIAIS
// ==========================================
async function carregarSociais() {
    try {
        const { data, error } = await db.from('configuracoes').select('*');
        
        if (error) {
            document.getElementById('formSociais').innerHTML = `<div style="color: #ef4444; padding: 16px; background: rgba(239, 68, 68, 0.1); border-radius: 8px;">
                ⚠️ A tabela <b>configuracoes</b> ainda não foi criada no Supabase. <br>
                Crie uma tabela chamada <i>configuracoes</i> com duas colunas de texto: <b>chave</b> (Primary Key) e <b>valor</b>.
            </div>`;
            return;
        }
        
        const map = {};
        data.forEach(c => map[c.chave] = c.valor);
        
        document.getElementById('inYoutube').value = map['link_youtube'] || '';
        document.getElementById('chkYoutube').checked = map['social_youtube'] === 'true';
        
        document.getElementById('inInstagram').value = map['link_instagram'] || '';
        document.getElementById('chkInstagram').checked = map['social_instagram'] === 'true';
        
        document.getElementById('inFacebook').value = map['link_facebook'] || '';
        document.getElementById('chkFacebook').checked = map['social_facebook'] === 'true';
        
        document.getElementById('inTiktok').value = map['link_tiktok'] || '';
        document.getElementById('chkTiktok').checked = map['social_tiktok'] === 'true';
        
    } catch (err) {
        console.error("Erro ao carregar configuracoes:", err);
    }
}

async function salvarSociais() {
    const btn = document.getElementById('btnSalvarSociais');
    btn.disabled = true;
    btn.textContent = 'Salvando...';
    
    const configs = [
        { chave: 'link_youtube', valor: document.getElementById('inYoutube').value },
        { chave: 'social_youtube', valor: document.getElementById('chkYoutube').checked ? 'true' : 'false' },
        
        { chave: 'link_instagram', valor: document.getElementById('inInstagram').value },
        { chave: 'social_instagram', valor: document.getElementById('chkInstagram').checked ? 'true' : 'false' },
        
        { chave: 'link_facebook', valor: document.getElementById('inFacebook').value },
        { chave: 'social_facebook', valor: document.getElementById('chkFacebook').checked ? 'true' : 'false' },
        
        { chave: 'link_tiktok', valor: document.getElementById('inTiktok').value },
        { chave: 'social_tiktok', valor: document.getElementById('chkTiktok').checked ? 'true' : 'false' },
    ];
    
    try {
        // Upsert para inserir ou atualizar as configurações baseadas na chave
        const { error } = await db.from('configuracoes').upsert(configs, { onConflict: 'chave' });
        if (error) throw error;
        
        showAviso('Redes Sociais salvas com sucesso!');
        
        // Atualiza a sidebar imediatamente
        if(window.carregarRedesSociais) {
            window.carregarRedesSociais();
        }
        
    } catch (err) {
        console.error("Erro ao salvar sociais:", err);
        alert("Erro ao salvar. A tabela configuracoes existe?");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Redes Sociais';
    }
}

// ----------------------------------------------------
// LÓGICA DE PERFIS/TAGS
// ----------------------------------------------------
async function carregarPerfis() {
    try {
        const { data, error } = await db.from('configuracoes').select('*').in('chave', ['perfis_pessoas', 'tags_lideranca']);
        let map = {};
        if (data) data.forEach(d => map[d.chave] = d.valor);

        if (document.getElementById('inPerfis')) {
            document.getElementById('inPerfis').value = map['perfis_pessoas'] || "Presidente, Vice-Presidente, Secretário, Tesoureiro, Conselheiro, Diretor, Coordenador, Associado Efetivo, Associado Proponente, Ex-Associado, Voluntário, Colaborador(a), Palestrante, Evangelizando, Estudante, Assistido(a), Paciente, Membro da Família, Empresa Parceira, Parceiro, Fornecedor, Passista, Líder, Outros";
        }
        if (document.getElementById('inLideranca')) {
            document.getElementById('inLideranca').value = map['tags_lideranca'] || "diretor, líder, lider, coordenador, gerente, presidente";
        }
    } catch(err) {
        console.log("Erro ao carregar perfis, usando default", err);
    }
}

window.salvarPerfis = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSalvarPerfis');
    btn.disabled = true;
    btn.textContent = 'Salvando...';
    try {
        const valor = document.getElementById('inPerfis').value;
        const { error } = await db.from('configuracoes').upsert({ chave: 'perfis_pessoas', valor: valor }, { onConflict: 'chave' });
        if (error) throw error;
        showAviso('Perfis de pessoas salvos com sucesso!');
    } catch (err) {
        console.error("Erro ao salvar perfis", err);
        alert("Erro ao salvar perfis.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Perfis';
    }
};

window.salvarLideranca = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSalvarLideranca');
    btn.disabled = true;
    btn.textContent = 'Salvando...';
    try {
        const valor = document.getElementById('inLideranca').value;
        const { error } = await db.from('configuracoes').upsert({ chave: 'tags_lideranca', valor: valor }, { onConflict: 'chave' });
        if (error) throw error;
        showAviso('Regras de Liderança salvas com sucesso!');
    } catch (err) {
        console.error("Erro ao salvar liderança", err);
        alert("Erro ao salvar regras.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Regras';
    }
};


// ==========================================
// MÓDULO GESTÃO DE MENSAGEM & PÁGINA LUZ
// ==========================================
let listMensagens = [];
let listPaginas = [];
let listLivros = [];

async function inicializarLuzGestao() {
    await carregarLivrosLuz();
    await carregarMensagensLuz();
    await carregarPaginasLuz();
}

window.switchLuzTab = function(tab) {
    document.getElementById('tabMsg').classList.toggle('active', tab === 'mensagem');
    document.getElementById('tabPag').classList.toggle('active', tab === 'pagina');
    
    document.getElementById('sectionMensagem').style.display = tab === 'mensagem' ? 'block' : 'none';
    document.getElementById('sectionPagina').style.display = tab === 'pagina' ? 'block' : 'none';
};

async function carregarLivrosLuz() {
    const { data, error } = await db.from('livros_catalogo').select('codigo, titulo').order('titulo');
    if (data) {
        listLivros = data;
        const select = document.getElementById('inPagLivro');
        let html = '<option value="">-- Selecione o Livro --</option>';
        data.forEach(livro => {
            html += `<option value="${livro.codigo}">${livro.titulo} (${livro.codigo})</option>`;
        });
        select.innerHTML = html;
    }
}

function getLivroTituloLuz(codigo) {
    const l = listLivros.find(x => x.codigo === codigo);
    return l ? l.titulo : codigo;
}

async function carregarMensagensLuz() {
    document.getElementById('loadingMsg').style.display = 'block';
    document.getElementById('tableMsg').style.display = 'none';
    
    const { data, error } = await db.from('app_mensagem_luz').select('*').order('created_at', { ascending: false });
    document.getElementById('loadingMsg').style.display = 'none';
    
    if (error) {
        Swal.fire('Erro', 'Falha ao carregar mensagens.', 'error');
        return;
    }

    listMensagens = data || [];
    const tbody = document.getElementById('tbodyMsg');
    tbody.innerHTML = '';
    
    listMensagens.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.texto}</td>
            <td>${item.autor}</td>
            <td class="luz-actions" style="justify-content: center;">
                <button type="button" class="btn-action" onclick="abrirEdicaoMsg('${item.id}')">✏️</button>
                <button type="button" class="btn-action btn-delete" onclick="excluirMensagem('${item.id}')">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('tableMsg').style.display = 'table';
}

window.abrirEdicaoMsg = function(id) {
    const item = listMensagens.find(x => x.id == id);
    if (item) {
        abrirModalMsg(item.id, item.texto, item.autor);
    }
};

window.abrirModalMsg = function(id = '', texto = '', autor = '') {
    document.getElementById('inMsgId').value = id;
    document.getElementById('inMsgTexto').value = texto;
    document.getElementById('inMsgAutor').value = autor;
    document.getElementById('modalMsgTitle').textContent = id ? 'Editar Mensagem-Luz' : 'Nova Mensagem-Luz';
    document.getElementById('modalMsg').style.display = 'flex';
};

window.fecharModalMsg = function() {
    document.getElementById('modalMsg').style.display = 'none';
    document.getElementById('formMsg').reset();
};

window.salvarMensagem = async function(e) {
    e.preventDefault();
    const id = document.getElementById('inMsgId').value;
    const texto = document.getElementById('inMsgTexto').value;
    const autor = document.getElementById('inMsgAutor').value;

    const payload = { texto, autor };
    
    try {
        let res;
        if (id) {
            res = await db.from('app_mensagem_luz').update(payload).eq('id', id);
        } else {
            res = await db.from('app_mensagem_luz').insert([payload]);
        }
        
        if (res.error) throw res.error;
        
        fecharModalMsg();
        Swal.fire('Salvo!', 'Mensagem salva com sucesso.', 'success');
        carregarMensagensLuz();
    } catch (err) {
        Swal.fire('Erro', 'Não foi possível salvar: ' + err.message, 'error');
    }
};

window.excluirMensagem = function(id) {
    Swal.fire({
        title: 'Excluir Mensagem?',
        text: "Esta ação não poderá ser desfeita.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Sim, excluir'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { error } = await db.from('app_mensagem_luz').delete().eq('id', id);
            if (error) {
                Swal.fire('Erro', 'Erro ao excluir.', 'error');
            } else {
                Swal.fire('Deletado!', 'A mensagem foi excluída.', 'success');
                carregarMensagensLuz();
            }
        }
    });
};

async function carregarPaginasLuz() {
    document.getElementById('loadingPag').style.display = 'block';
    document.getElementById('tablePag').style.display = 'none';
    
    const { data, error } = await db.from('app_pagina_luz').select('*').order('created_at', { ascending: false });
    document.getElementById('loadingPag').style.display = 'none';
    
    if (error) {
        Swal.fire('Erro', 'Falha ao carregar páginas.', 'error');
        return;
    }

    listPaginas = data || [];
    const tbody = document.getElementById('tbodyPag');
    tbody.innerHTML = '';
    
    listPaginas.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${getLivroTituloLuz(item.livro_codigo)}</strong> <br><small style="color:var(--text-muted);">${item.livro_codigo}</small></td>
            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.trecho}</td>
            <td>pág. ${item.pagina || '-'}</td>
            <td>${item.autor}</td>
            <td class="luz-actions" style="justify-content: center;">
                <button type="button" class="btn-action" onclick="abrirEdicaoPag('${item.id}')">✏️</button>
                <button type="button" class="btn-action btn-delete" onclick="excluirPagina('${item.id}')">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('tablePag').style.display = 'table';
}

window.abrirEdicaoPag = function(id) {
    const item = listPaginas.find(x => x.id == id);
    if (item) {
        abrirModalPag(item.id, item.livro_codigo, item.trecho, item.pagina || '', item.autor);
    }
};

window.abrirModalPag = function(id = '', livro_codigo = '', trecho = '', pagina = '', autor = '') {
    document.getElementById('inPagId').value = id;
    document.getElementById('inPagLivro').value = livro_codigo;
    document.getElementById('inPagTrecho').value = trecho;
    document.getElementById('inPagNumero').value = pagina;
    document.getElementById('inPagAutor').value = autor;
    document.getElementById('modalPagTitle').textContent = id ? 'Editar Página-Luz' : 'Nova Página-Luz';
    document.getElementById('modalPag').style.display = 'flex';
};

window.fecharModalPag = function() {
    document.getElementById('modalPag').style.display = 'none';
    document.getElementById('formPag').reset();
};

window.salvarPagina = async function(e) {
    e.preventDefault();
    const id = document.getElementById('inPagId').value;
    const livro_codigo = document.getElementById('inPagLivro').value;
    const trecho = document.getElementById('inPagTrecho').value;
    const pagina = document.getElementById('inPagNumero').value;
    const autor = document.getElementById('inPagAutor').value;

    const payload = { 
        livro_codigo, 
        trecho, 
        pagina: pagina ? parseInt(pagina) : null, 
        autor 
    };
    
    try {
        let res;
        if (id) {
            res = await db.from('app_pagina_luz').update(payload).eq('id', id);
        } else {
            res = await db.from('app_pagina_luz').insert([payload]);
        }
        
        if (res.error) throw res.error;
        
        fecharModalPag();
        Swal.fire('Salvo!', 'Página salva com sucesso.', 'success');
        carregarPaginasLuz();
    } catch(err) {
        Swal.fire('Erro', 'Não foi possível salvar: ' + err.message, 'error');
    }
};

window.excluirPagina = function(id) {
    Swal.fire({
        title: 'Excluir Página?',
        text: "Esta ação não poderá ser desfeita.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Sim, excluir'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { error } = await db.from('app_pagina_luz').delete().eq('id', id);
            if (error) {
                Swal.fire('Erro', 'Erro ao excluir.', 'error');
            } else {
                Swal.fire('Deletado!', 'A página foi excluída.', 'success');
                carregarPaginasLuz();
            }
        }
    });
};


// ==========================================
// MÓDULO MATRIZ DE ABAS POR ESTRUTURA
// ==========================================
let estruturasMatriz = [];

async function carregarMatrizAbas() {
    const loader = document.getElementById('loadingMatrix');
    const container = document.getElementById('matrixContainer');
    const tbody = document.getElementById('tbodyMatrix');
    
    if (!loader || !container || !tbody) return;
    
    loader.style.display = 'block';
    container.style.display = 'none';
    
    try {
        const { data, error } = await db.from('estruturas').select('*').order('nome');
        if (error) throw error;
        
        estruturasMatriz = data || [];
        tbody.innerHTML = '';
        
        estruturasMatriz.forEach(est => {
            const isIrradiacao = (est.nome || '').toLowerCase().includes('irradia') || (est.nome || '').toLowerCase().includes('sela');
            const isAssistencia = (est.nome || '').toLowerCase().includes('assist') && (est.nome || '').toLowerCase().includes('social');
            const isAtendimento = (est.nome || '').toLowerCase().includes('atendimento');

            const config = est.abas_config || {
                equipe: true, agenda: true, projetos: true, documentos: true,
                tesouraria: false,
                apps: isIrradiacao || isAssistencia || isAtendimento
            };
            
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', est.id);
            tr.innerHTML = `
                <td style="font-weight: 500; padding: 12px;">${est.nome} <br><small style="color:var(--text-muted);">${est.tipo}</small></td>
                <td style="text-align: center;"><input type="checkbox" class="chk-equipe" ${config.equipe ? 'checked' : ''} style="width: 18px; height: 18px;"></td>
                <td style="text-align: center;"><input type="checkbox" class="chk-agenda" ${config.agenda ? 'checked' : ''} style="width: 18px; height: 18px;"></td>
                <td style="text-align: center;"><input type="checkbox" class="chk-projetos" ${config.projetos ? 'checked' : ''} style="width: 18px; height: 18px;"></td>
                <td style="text-align: center;"><input type="checkbox" class="chk-documentos" ${config.documentos ? 'checked' : ''} style="width: 18px; height: 18px;"></td>
                <td style="text-align: center;"><input type="checkbox" class="chk-tesouraria" ${config.tesouraria ? 'checked' : ''} style="width: 18px; height: 18px;"></td>
                <td style="text-align: center;"><input type="checkbox" class="chk-apps" ${config.apps ? 'checked' : ''} style="width: 18px; height: 18px;"></td>
            `;
            tbody.appendChild(tr);
        });
        
        loader.style.display = 'none';
        container.style.display = 'block';
    } catch(err) {
        console.error(err);
        loader.textContent = 'Erro ao carregar matriz: ' + err.message;
    }
}

window.salvarMatrizAbas = async function() {
    const btn = document.getElementById('btnSaveMatrix');
    btn.disabled = true;
    btn.textContent = 'Salvando...';
    
    const rows = document.querySelectorAll('#tbodyMatrix tr');
    let hasError = false;
    
    try {
        for (let row of rows) {
            const id = row.getAttribute('data-id');
            const abas_config = {
                equipe: row.querySelector('.chk-equipe').checked,
                agenda: row.querySelector('.chk-agenda').checked,
                projetos: row.querySelector('.chk-projetos').checked,
                documentos: row.querySelector('.chk-documentos').checked,
                tesouraria: row.querySelector('.chk-tesouraria').checked,
                apps: row.querySelector('.chk-apps').checked
            };
            
            const { error } = await db.from('estruturas').update({ abas_config }).eq('id', id);
            if (error) {
                console.error("Erro ao salvar estrutura " + id, error);
                hasError = true;
            }
        }
        
        if (hasError) {
            Swal.fire('Atenção', 'Algumas configurações de abas não puderam ser salvas. Verifique o console.', 'warning');
        } else {
            Swal.fire('Salvo!', 'Configurações de abas atualizadas com sucesso.', 'success');
        }
    } catch(e) {
        Swal.fire('Erro', 'Erro ao salvar matriz: ' + e.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Configuração de Abas';
        carregarMatrizAbas();
    }
};
