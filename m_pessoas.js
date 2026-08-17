(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let allPessoas = [];

    document.addEventListener('DOMContentLoaded', async () => {
        await carregarPessoas();

        // Se voltar pela navegação nativa do Safari/Chrome (BFCache), recarrega
        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                carregarPessoas();
            }
        });

        // Hide add button if no permission
        if (typeof window.podeEditarPessoas === 'function' && !window.podeEditarPessoas()) {
            const fab = document.querySelector('.m-fab');
            if (fab) fab.style.display = 'none';
        }

        // Configurar busca e filtros
        const searchInput = document.getElementById('mSearchInput');
        const filterTag = document.getElementById('mFilterTag');
        const sortOrder = document.getElementById('mSortOrder');
        const hideOutros = document.getElementById('mHideOutros');
        const btnToggleFilter = document.getElementById('btnToggleFilter');
        const filterPanel = document.getElementById('mFilterPanel');

        if (btnToggleFilter && filterPanel) {
            btnToggleFilter.addEventListener('click', () => {
                const isHidden = filterPanel.style.display === 'none';
                filterPanel.style.display = isHidden ? 'flex' : 'none';
                btnToggleFilter.style.color = isHidden ? 'var(--primary)' : 'var(--text-muted)';
                btnToggleFilter.style.borderColor = isHidden ? 'var(--primary)' : 'var(--border)';
            });
        }

        if (searchInput) searchInput.addEventListener('input', filtrarLista);
        if (filterTag) filterTag.addEventListener('change', filtrarLista);
        if (sortOrder) sortOrder.addEventListener('change', filtrarLista);
        if (hideOutros) hideOutros.addEventListener('change', filtrarLista);
    });

    function obterIniciais(nome) {
        if (!nome) return '?';
        const partes = nome.trim().split(' ');
        if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }

    async function carregarPessoas() {
        const loading = document.getElementById('mLoadingState');
        if (loading) loading.innerText = 'Buscando do banco...';

        try {
            const { data, error } = await db.from('pessoas').select('id, nome_completo, nome_curto, tipo_pessoa, perfis, celular, email, cpf_cnpj, foto_url, created_at, status').order('nome_completo');
            
            if (loading) loading.style.display = 'none';

            if (error) throw error;

            allPessoas = data || [];
            
            await carregarTagsDisponiveis();
            filtrarLista();
        } catch (e) {
            console.error('Erro geral:', e);
            document.getElementById('mLoadingState').innerText = 'Erro ao carregar dados.';
        }
    }

    async function carregarTagsDisponiveis() {
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
        } catch(err) {}

        const filterTag = document.getElementById('mFilterTag');
        if (filterTag) {
            while (filterTag.options.length > 4) {
                filterTag.remove(4);
            }
            const sortedTags = [...TAGS].sort((a, b) => a.localeCompare(b));
            sortedTags.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag;
                option.text = tag;
                filterTag.appendChild(option);
            });
        }
    }

    function formatarCpfCnpj(v) {
        if (!v) return '';
        v = v.replace(/\D/g,"");
        if (v.length > 0 && v.length <= 11) {
            v = v.padStart(11, '0');
            return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
        } else if (v.length > 11 && v.length <= 14) {
            v = v.padStart(14, '0');
            return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
        }
        return v;
    }

    function renderizarLista(pessoas) {
        const container = document.getElementById('mListPessoas');
        const dash = document.getElementById('mDashboardStats');

        // Atualizar Dashboard
        if (dash) {
            const total = pessoas.length;
            const fisicas = pessoas.filter(p => p.tipo_pessoa === 'Física' || !p.tipo_pessoa).length;
            const juridicas = pessoas.filter(p => p.tipo_pessoa === 'Jurídica').length;

            dash.innerHTML = `
                <div style="flex: 1; min-width: 90px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); padding: 10px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 18px; font-weight: 700; color: var(--primary);">${total}</div>
                    <div style="font-size: 10px; color: var(--text-muted); font-weight: 500; text-transform: uppercase;">Total</div>
                </div>
                <div style="flex: 1; min-width: 90px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 10px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 18px; font-weight: 700; color: #10b981;">${fisicas}</div>
                    <div style="font-size: 10px; color: var(--text-muted); font-weight: 500; text-transform: uppercase;">Físicas</div>
                </div>
                <div style="flex: 1; min-width: 90px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); padding: 10px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 18px; font-weight: 700; color: #f59e0b;">${juridicas}</div>
                    <div style="font-size: 10px; color: var(--text-muted); font-weight: 500; text-transform: uppercase;">Jurídicas</div>
                </div>
            `;
        }
        
        if (pessoas.length === 0) {
            container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding: 20px;">Nenhuma pessoa encontrada.</div>`;
            return;
        }

        let html = '';
        pessoas.forEach(p => {
            const isEmpresa = p.tipo_pessoa === 'Jurídica';
            const nomeExibicao = p.nome_curto || p.nome_completo || 'Sem Nome';
            
            // Foto ou Iniciais
            let visualIcone = '';
            if (p.foto_url) {
                visualIcone = `<img src="${p.foto_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
            } else {
                const iniciais = obterIniciais(p.nome_completo);
                visualIcone = iniciais;
            }

            // Perfis (Até 3 badges)
            let perfisHtml = '';
            if (p.perfis && p.perfis.length > 0) {
                const limit = Math.min(p.perfis.length, 3);
                for(let i=0; i<limit; i++) {
                    perfisHtml += `<span class="badge" style="background: ${isEmpresa ? 'rgba(52, 211, 153, 0.2); color: #34d399' : 'rgba(99, 102, 241, 0.2); color: #818cf8'}; margin-right: 4px;">${p.perfis[i]}</span>`;
                }
                if (p.perfis.length > 3) {
                    perfisHtml += `<span class="badge" style="background: rgba(255,255,255,0.1); color: #ccc;">+${p.perfis.length - 3}</span>`;
                }
            }
            
            // Documento formatado
            const docFormatado = formatarCpfCnpj(p.cpf_cnpj);
            const documento = docFormatado ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${docFormatado}</div>` : '';

            // WhatsApp link
            let whatsAppBtn = '';
            if (p.celular) {
                const numeroLimpo = p.celular.replace(/\D/g, '');
                // Ajustado para não quebrar a altura da linha: sem padding, line-height 1
                whatsAppBtn = `<a href="https://wa.me/55${numeroLimpo}" target="_blank" style="color: #22c55e; font-size: 18px; text-decoration: none; line-height: 1; margin-left: 8px;" onclick="event.stopPropagation();">💬</a>`;
            }

            // Email link
            let emailBtn = '';
            let emailText = '';
            if (p.email) {
                emailBtn = `<a href="mailto:${p.email}" style="color: #6366f1; font-size: 18px; text-decoration: none; line-height: 1; margin-left: 8px;" onclick="event.stopPropagation();">📧</a>`;
                emailText = `<div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">✉️ ${p.email}</div>`;
            }

            // Status Icon
            const isAtivo = p.status !== 'Inativo' && p.status !== 'Inativa' && p.status !== false;
            const statusIcon = isAtivo 
                ? `<span style="display: inline-block; width: 10px; height: 10px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 6px rgba(34, 197, 94, 0.6); margin-right: 6px;" title="Ativo"></span>` 
                : `<span style="display: inline-block; width: 10px; height: 10px; background: #9ca3af; border-radius: 50%; margin-right: 6px;" title="Inativo"></span>`;

            // Card HTML
            html += `
            <div class="m-card" onclick="window.location.href='m_perfil.html?id=${p.id}'" style="cursor: pointer; position: relative;">
                <div class="m-card-icon" style="${p.foto_url ? 'background: transparent; border: none;' : (isEmpresa ? 'background: var(--bg-panel); color: #34d399;' : 'background: var(--bg-panel); color: var(--primary);')} border: ${p.foto_url ? 'none' : '1px solid var(--border)'}; font-size: 16px;">
                    ${visualIcone}
                </div>
                <div class="m-card-content">
                    <div class="m-card-title" style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="display: flex; align-items: center; max-width: 170px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${statusIcon} ${nomeExibicao}
                        </span>
                        <div style="display: flex; align-items: center;">
                            ${emailBtn}
                            ${whatsAppBtn}
                        </div>
                    </div>
                    <div style="margin-top: 8px;">
                        ${perfisHtml}
                    </div>
                    ${documento}
                    ${emailText}
                </div>
            </div>`;
        });

        container.innerHTML = html;
    }

    function filtrarLista() {
        const input = document.getElementById('mSearchInput');
        const filterTag = document.getElementById('mFilterTag');
        const selectSort = document.getElementById('mSortOrder');
        const chkOutros = document.getElementById('mHideOutros');
        
        const termo = (input ? input.value.toLowerCase().trim() : '');
        const tag = filterTag ? filterTag.value : '';
        const sort = selectSort ? selectSort.value : 'nome_az';
        const hideOutrosVal = chkOutros ? chkOutros.checked : false;

        // Filter
        let filtrados = allPessoas.filter(p => {
            const nome = (p.nome_completo || '').toLowerCase();
            const doc = (p.cpf_cnpj || '').toLowerCase();
            const matchTermo = termo === '' || nome.includes(termo) || doc.includes(termo);
            
            let matchTag = true;
            if (tag === 'Física') {
                matchTag = (p.tipo_pessoa === 'Física' || !p.tipo_pessoa);
            } else if (tag === 'Jurídica') {
                matchTag = (p.tipo_pessoa === 'Jurídica');
            } else if (tag !== '') {
                matchTag = p.perfis && p.perfis.includes(tag);
            }

            // Lógica de "Outros"
            let matchOutros = true;
            if (hideOutrosVal) {
                // Se a flag estiver marcada, esconde as pessoas que têm a tag 'Outros'
                const temOutros = p.perfis && p.perfis.some(role => role.toLowerCase().includes('outro'));
                if (temOutros) {
                    matchOutros = false;
                }
            }

            return matchTermo && matchTag && matchOutros;
        });

        // Sort
        filtrados.sort((a, b) => {
            if (sort === 'recentes') {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB - dateA; // Descending
            } else if (sort === 'nome_za') {
                return (b.nome_completo || '').localeCompare(a.nome_completo || '');
            } else {
                return (a.nome_completo || '').localeCompare(b.nome_completo || '');
            }
        });

        renderizarLista(filtrados);
    }
})();
