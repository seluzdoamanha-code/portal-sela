(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let listMensagens = [];
    let listPaginas = [];
    let listLivros = [];

    document.addEventListener('DOMContentLoaded', async () => {
        await carregarLivros();
        await carregarMensagens();
        await carregarPaginas();
    });

    window.switchLuzTab = function(tab) {
        document.getElementById('tabMsg').classList.toggle('active', tab === 'mensagem');
        document.getElementById('tabPag').classList.toggle('active', tab === 'pagina');
        
        document.getElementById('sectionMensagem').style.display = tab === 'mensagem' ? 'block' : 'none';
        document.getElementById('sectionPagina').style.display = tab === 'pagina' ? 'block' : 'none';
    };

    // LIVROS (Vínculo livros_catalogo)
    async function carregarLivros() {
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

    function getLivroTitulo(codigo) {
        const l = listLivros.find(x => x.codigo === codigo);
        return l ? l.titulo : codigo;
    }

    // MENSAGEM-LUZ CRUD
    async function carregarMensagens() {
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
                    <button class="btn-action" onclick="abrirModalMsg('${item.id}', \`${item.texto.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`, '${item.autor}')}">✏️</button>
                    <button class="btn-action btn-delete" onclick="excluirMensagem('${item.id}')">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        document.getElementById('tableMsg').style.display = 'table';
    }

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
            carregarMensagens();
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
                    carregarMensagens();
                }
            }
        });
    };

    // PÁGINA-LUZ CRUD
    async function carregarPaginas() {
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
                <td><strong>${getLivroTitulo(item.livro_codigo)}</strong> <br><small style="color:var(--text-muted);">${item.livro_codigo}</small></td>
                <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.trecho}</td>
                <td>pág. ${item.pagina || '-'}</td>
                <td>${item.autor}</td>
                <td class="luz-actions" style="justify-content: center;">
                    <button class="btn-action" onclick="abrirModalPag('${item.id}', '${item.livro_codigo}', \`${item.trecho.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`, '${item.pagina || ''}', '${item.autor}')}">✏️</button>
                    <button class="btn-action btn-delete" onclick="excluirPagina('${item.id}')">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        document.getElementById('tablePag').style.display = 'table';
    }

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
            carregarPaginas();
        } catch (err) {
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
                    carregarPaginas();
                }
            }
        });
    };
})();
