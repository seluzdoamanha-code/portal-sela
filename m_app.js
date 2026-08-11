(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    document.addEventListener('DOMContentLoaded', async () => {
        
        await carregarMural();
        
        // Acessar Meu Perfil
        document.getElementById('btnPerfil').addEventListener('click', async () => {
            const { data: { session } } = await db.auth.getSession();
            if (session && session.user && session.user.email) {
                const { data } = await db.from('pessoas').select('id').eq('email', session.user.email).single();
                if (data) {
                    window.location.href = 'm_perfil.html?id=' + data.id;
                } else {
                    alert("O seu e-mail não está associado a nenhum perfil na lista de Pessoas.");
                }
            }
        });
    });

    async function carregarMural() {
        const loading = document.getElementById('mLoadingState');
        const content = document.getElementById('mContentArea');
        const container = document.getElementById('muralContainer');

        try {
            const { data, error } = await db.from('posts').select('*').order('created_at', { ascending: false }).limit(10);
            
            loading.style.display = 'none';
            content.style.display = 'block';

            if (error || !data || data.length === 0) {
                container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding: 20px;">Nenhuma novidade no momento.</div>`;
                return;
            }

            let html = '';
            data.forEach(post => {
                const dataFormatada = new Date(post.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
                const conteudoHtml = marked.parse(post.conteudo);

                let linkCard = '';
                if (post.link_url) {
                    const imgHtml = post.link_image ? `<img src="${post.link_image}" style="width: 100%; height: 140px; object-fit: cover; border-bottom: 1px solid var(--border);">` : '';
                    linkCard = `
                    <a href="${post.link_url}" target="_blank" style="display: block; margin-top: 12px; text-decoration: none; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background: rgba(255,255,255,0.03);">
                        ${imgHtml}
                        <div style="padding: 12px;">
                            <div style="font-weight: 600; font-size: 14px; color: var(--primary); margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${post.link_title || post.link_url}</div>
                            <div style="font-size: 12px; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${post.link_description || 'Clique para acessar'}</div>
                        </div>
                    </a>`;
                }

                html += `
                <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 16px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 32px; height: 32px; border-radius: 16px; background: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">SE</div>
                            <div style="font-weight: 600; font-size: 14px;">${post.autor_nome || 'Diretoria'}</div>
                        </div>
                        <div style="font-size: 11px; color: var(--text-muted);">${dataFormatada}</div>
                    </div>
                    <div style="font-size: 14px; line-height: 1.5; color: var(--text-main);">
                        ${conteudoHtml}
                    </div>
                    ${linkCard}
                </div>`;
            });

            container.innerHTML = html;

        } catch (e) {
            console.error(e);
            loading.innerText = 'Erro ao carregar o mural.';
        }
    }
})();
