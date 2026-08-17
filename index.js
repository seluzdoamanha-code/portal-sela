(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';

    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    document.addEventListener('DOMContentLoaded', async () => {
        
        // Carrega o Mural e as Estatísticas Básicas
        carregarEstatisticas();
        carregarPosts();

        // Botões do Modal
        document.getElementById('btnNovoPost').addEventListener('click', () => {
            document.getElementById('formPost').reset();
            document.getElementById('modalPost').style.display = 'flex';
        });

        document.getElementById('btnClosePost').addEventListener('click', () => {
            document.getElementById('modalPost').style.display = 'none';
        });

        document.getElementById('formPost').addEventListener('submit', salvarPost);
    });

    async function carregarEstatisticas() {
        try {
            // Conta pessoas físicas e jurídicas
            const { data: pessoas, error: errPessoas } = await db.from('pessoas').select('tipo_pessoa, perfis');
            if (!errPessoas && pessoas) {
                const pjs = pessoas.filter(p => p.tipo_pessoa === 'Jurídica').length;
                
                const efetivos = pessoas.filter(p => p.tipo_pessoa === 'Física' && p.perfis && p.perfis.includes('Associado Efetivo')).length;
                const proponentes = pessoas.filter(p => p.tipo_pessoa === 'Física' && p.perfis && p.perfis.includes('Associado Proponente')).length;
                
                const fisicasTotais = pessoas.filter(p => p.tipo_pessoa === 'Física').length;
                const demais = fisicasTotais - (efetivos + proponentes);

                document.getElementById('statEfetivos').textContent = efetivos;
                document.getElementById('statProponentes').textContent = proponentes;
                document.getElementById('statDemaisPessoas').textContent = demais;
                document.getElementById('statEmpresas').textContent = pjs;
            }

            // Conta estruturas
            const { data: estruturas, error: errEstruturas } = await db.from('estruturas').select('tipo');
            if (!errEstruturas && estruturas) {
                const deptos = estruturas.filter(e => e.tipo === 'Departamento').length;
                const ativs = estruturas.filter(e => e.tipo === 'Atividade').length;
                const outros = estruturas.filter(e => e.tipo !== 'Departamento' && e.tipo !== 'Atividade').length;
                
                document.getElementById('statDepartamentos').textContent = deptos;
                document.getElementById('statAtividades').textContent = ativs;
                document.getElementById('statOutros').textContent = outros;
            }
        } catch (e) {
            console.error("Erro ao carregar estatísticas:", e);
        }
    }

    async function carregarPosts() {
        const loading = document.getElementById('loadingFeed');
        const lista = document.getElementById('listaPosts');
        
        try {
            const { data, error } = await db
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false });

            loading.style.display = 'none';

            if (error) {
                // Tabela pode não existir ainda
                lista.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 24px;">Tabela 'posts' ainda não criada no banco de dados.</div>`;
                return;
            }

            if (!data || data.length === 0) {
                lista.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 24px;">O mural está vazio. Seja o primeiro a postar!</div>`;
                return;
            }

            let html = '';
            data.forEach(post => {
                const dataFormatada = new Date(post.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
                const conteudoHtml = marked.parse(post.conteudo);

                let linkCard = '';
                if (post.link_url) {
                    const imgHtml = post.link_image ? `<img src="${post.link_image}" style="width: 100%; height: 160px; object-fit: cover; border-bottom: 1px solid var(--border);">` : '';
                    linkCard = `
                    <a href="${post.link_url}" target="_blank" style="display: block; margin-top: 16px; text-decoration: none; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; background: rgba(255,255,255,0.02); transition: all 0.2s;" class="link-preview-card">
                        ${imgHtml}
                        <div style="padding: 12px;">
                            <div style="font-weight: 600; font-size: 14px; color: var(--primary); margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${post.link_title || post.link_url}</div>
                            <div style="font-size: 12px; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${post.link_description || 'Clique para acessar'}</div>
                        </div>
                    </a>
                    `;
                }

                html += `
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                        <div>
                            <h3 style="font-size: 16px; margin: 0; color: var(--text-main);">${post.titulo}</h3>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Por <strong>${post.autor}</strong> em ${dataFormatada}</div>
                        </div>
                        <button onclick="excluirPost('${post.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px;" title="Excluir Post">🗑️</button>
                    </div>
                    
                    <div style="font-size: 14px; color: #cbd5e1; line-height: 1.5; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;" class="post-content">
                        ${conteudoHtml}
                        ${linkCard}
                    </div>
                </div>
                `;
            });
            lista.innerHTML = html;

        } catch (e) {
            loading.style.display = 'none';
            console.error("Erro ao carregar posts:", e);
            lista.innerHTML = `<div style="text-align: center; color: #ef4444; padding: 24px;">Erro ao carregar mural.</div>`;
        }
    }

    async function salvarPost(e) {
        e.preventDefault();
        
        const btn = document.getElementById('btnSavePost');
        btn.disabled = true;
        btn.textContent = 'Publicando...';

        const titulo = document.getElementById('inPostTitulo').value;
        const conteudo = document.getElementById('inPostConteudo').value;
        const autor = document.getElementById('inPostAutor').value;
        const linkStr = document.getElementById('inPostLink').value.trim();

        let linkUrl = null, linkTitle = null, linkDesc = null, linkImg = null;

        if (linkStr) {
            btn.textContent = 'Buscando imagem...';
            try {
                // Chama a API pública gratuita do Microlink para extrair o "Open Graph" do link
                const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(linkStr)}`);
                const meta = await res.json();
                
                if (meta.status === 'success' && meta.data) {
                    linkUrl = meta.data.url || linkStr;
                    linkTitle = meta.data.title || '';
                    linkDesc = meta.data.description || '';
                    linkImg = meta.data.image ? meta.data.image.url : null;
                } else {
                    linkUrl = linkStr;
                }
            } catch (err) {
                console.warn("Falha ao buscar preview do link", err);
                linkUrl = linkStr;
            }
        }

        try {
            const { error } = await db.from('posts').insert([{
                titulo,
                conteudo,
                autor,
                link_url: linkUrl,
                link_title: linkTitle,
                link_description: linkDesc,
                link_image: linkImg
            }]);

            if (error) throw error;

            document.getElementById('modalPost').style.display = 'none';
            await carregarPosts();
            
        } catch (err) {
            console.error("Erro ao salvar post:", err);
            alert("Erro ao publicar. Verifique se as novas colunas foram criadas no banco.");
        } finally {
            btn.disabled = false;
            btn.textContent = 'Publicar no Mural';
        }
    }

    window.excluirPost = async function(id) {
        if (!confirm("Tem certeza que deseja apagar este post?")) return;
        
        try {
            const { error } = await db.from('posts').delete().eq('id', id);
            if (error) throw error;
            await carregarPosts();
        } catch (err) {
            console.error("Erro ao excluir", err);
            alert("Erro ao excluir post.");
        }
    }

})();
