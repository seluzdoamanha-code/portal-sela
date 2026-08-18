const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const urlParams = new URLSearchParams(window.location.search);
const pessoaId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    if (!pessoaId) {
        alert("ID de pessoa não fornecido!");
        window.location.href = 'pessoas.html';
        return;
    }

    // Configura o link de edição
    const btnEditar = document.getElementById('btnEditarCadastro');
    if (btnEditar) {
        if (typeof window.podeEditarPessoas === 'function' && !window.podeEditarPessoas()) {
            btnEditar.style.display = 'none';
        } else {
            btnEditar.onclick = () => {
                window.location.href = `pessoas.html?edit=${pessoaId}`;
            };
        }
    }

    await carregarPerfil();
});

function formatarDocumento(v) {
    if (!v) return '-';
    v = v.replace(/\D/g, '');
    if (v.length > 0 && v.length <= 11) {
        v = v.padStart(11, '0');
        return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (v.length > 11 && v.length <= 14) {
        v = v.padStart(14, '0');
        return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return v;
}

function formatarCelular(v) {
    if (!v) return '-';
    v = v.replace(/\D/g, '');
    if (v.length <= 10) {
        return v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

async function carregarPerfil() {
    try {
        const { data: pessoa, error } = await db
            .from('pessoas')
            .select('*')
            .eq('id', pessoaId)
            .single();

        if (error) throw error;
        
        if (!pessoa) {
            document.getElementById('nomePessoa').textContent = "Pessoa não encontrada";
            return;
        }

        // Injeta dados no topo
        document.getElementById('nomePessoa').textContent = pessoa.nome_curto || pessoa.nome_completo;
        
        // Exibição da Foto ou Iniciais
        const containerFoto = document.getElementById('fotoPerfilContainer');
        if (pessoa.foto_url) {
            containerFoto.innerHTML = `<img src="${pessoa.foto_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 60px;">`;
            containerFoto.style.border = 'none';
        } else {
            // Pega as iniciais do nome completo
            const partes = pessoa.nome_completo.trim().split(' ');
            let iniciais = partes[0].charAt(0);
            if (partes.length > 1) {
                iniciais += partes[partes.length - 1].charAt(0);
            }
            
            // Gera uma cor baseada no nome
            const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];
            const colorIndex = pessoa.nome_completo.length % colors.length;
            
            containerFoto.innerHTML = `<span style="font-size: 40px; font-weight: 600; color: white;">${iniciais.toUpperCase()}</span>`;
            containerFoto.style.background = colors[colorIndex];
            containerFoto.style.border = 'none';
        }
        
        // Injeta dados na coluna da esquerda
        document.getElementById('infoNome').textContent = pessoa.nome_completo;
        document.getElementById('infoNomeCurto').textContent = pessoa.nome_curto || '-';
        document.getElementById('infoCpf').textContent = formatarDocumento(pessoa.cpf_cnpj);
        
        if (pessoa.celular) {
            const numero = pessoa.celular.replace(/\D/g, '');
            document.getElementById('infoCelular').innerHTML = `
                <a href="https://wa.me/55${numero}" target="_blank" style="color: #25D366; text-decoration: none; display: flex; align-items: center; gap: 6px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                    </svg>
                    ${formatarCelular(pessoa.celular)}
                </a>
            `;
        } else {
            document.getElementById('infoCelular').textContent = '-';
        }

        if (pessoa.email) {
            document.getElementById('infoEmail').innerHTML = `<a href="mailto:${pessoa.email}" style="color: var(--primary); text-decoration: none; display: flex; align-items: center; gap: 6px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                ${pessoa.email}
            </a>`;
        } else {
            document.getElementById('infoEmail').textContent = '-';
        }
        
        // Novos campos
        const isAtivo = pessoa.status !== 'Inativo' && pessoa.status !== 'Inativa' && pessoa.status !== false;
        document.getElementById('infoStatus').innerHTML = isAtivo 
            ? `<span style="display: inline-block; width: 10px; height: 10px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);"></span> Ativo` 
            : `<span style="display: inline-block; width: 10px; height: 10px; background: #9ca3af; border-radius: 50%;"></span> Inativo`;
        
        if (pessoa.data_nascimento) {
            const date = new Date(pessoa.data_nascimento + 'T12:00:00'); // Evitar problema de timezone
            document.getElementById('infoNascimento').textContent = date.toLocaleDateString('pt-BR');
        } else {
            document.getElementById('infoNascimento').textContent = '-';
        }

        document.getElementById('infoSexo').textContent = pessoa.sexo || '-';
        document.getElementById('infoNaturalidade').textContent = pessoa.naturalidade || '-';
        document.getElementById('infoNacionalidade').textContent = pessoa.nacionalidade || '-';
        document.getElementById('infoNomeMae').textContent = pessoa.nome_mae || '-';
        document.getElementById('infoNomePai').textContent = pessoa.nome_pai || '-';
        document.getElementById('infoEstadoCivil').textContent = pessoa.estado_civil || '-';
        document.getElementById('infoProfissao').textContent = pessoa.profissao || '-';

        // Endereço
        let cepFormatado = pessoa.cep ? pessoa.cep.replace(/\D/g, '') : '';
        if (cepFormatado.length >= 5) cepFormatado = cepFormatado.replace(/(\d{5})(\d{1,3})/, "$1-$2");
        
        document.getElementById('infoCep').textContent = cepFormatado || '-';
        document.getElementById('infoEndereco').textContent = pessoa.endereco || '-';
        document.getElementById('infoBairro').textContent = pessoa.bairro || '-';
        
        let cidadeEstado = [];
        if (pessoa.cidade) cidadeEstado.push(pessoa.cidade);
        if (pessoa.estado) cidadeEstado.push(pessoa.estado.toUpperCase());
        document.getElementById('infoCidadeEstado').textContent = cidadeEstado.length > 0 ? cidadeEstado.join(' / ') : '-';

        // Renderizar Perfis
        const containerPerfis = document.getElementById('infoPerfis');
        let perfisArray = [];
        if (Array.isArray(pessoa.perfis)) {
            perfisArray = pessoa.perfis;
        } else if (typeof pessoa.perfis === 'string') {
            try { perfisArray = JSON.parse(pessoa.perfis); } catch(e) { perfisArray = [pessoa.perfis]; }
        }

        if (perfisArray.length > 0) {
            containerPerfis.innerHTML = perfisArray.map(tag => 
                `<span style="display: inline-block; background: rgba(99, 102, 241, 0.1); color: var(--primary); padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; margin-right: 8px; margin-bottom: 8px;">${tag}</span>`
            ).join('');
        } else {
            containerPerfis.textContent = 'Nenhum perfil atribuído';
        }

        // --- HOOK FINANCEIRO ---
        if (typeof window.initFinanceiro === 'function') {
            window.initFinanceiro(pessoa);
        }

        // --- HOOK BIBLIOTECA ---
        carregarEmprestimos();

    } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        document.getElementById('nomePessoa').textContent = "Erro ao carregar perfil";
    }
}

async function carregarEmprestimos() {
    if (!pessoaId) return;
    try {
        const { data: emprestimos, error } = await db.from('emprestimos_portal')
            .select('*')
            .eq('pessoa_id', pessoaId)
            .order('data_emprestimo', { ascending: false });
            
        if (error) throw error;
        
        if (!emprestimos || emprestimos.length === 0) return;
        
        document.getElementById('bibliotecaContainer').style.display = 'block';
        
        // Fetch covers
        const codigos = [...new Set(emprestimos.map(e => e.codigo_livro))];
        let capasMap = {};
        if (codigos.length > 0) {
            const { data: livros, error: errLivros } = await db.from('livros_catalogo')
                .select('codigo, capa_url')
                .in('codigo', codigos);
            if (!errLivros && livros) {
                livros.forEach(l => {
                    capasMap[l.codigo] = l.capa_url;
                });
            }
        }
        
        const ativos = emprestimos.filter(e => e.status.toLowerCase() !== 'devolvido' && !e.data_devolucao);
        const inativos = emprestimos.filter(e => e.status.toLowerCase() === 'devolvido' || e.data_devolucao);
        
        const renderCard = (e, isActive) => {
            const capa = capasMap[e.codigo_livro] || 'https://via.placeholder.com/60x90/2a2a2a/cccccc?text=Sem+Capa';
            const dataEmp = new Date(e.data_emprestimo);
            
            let avisoHtml = '';
            if (isActive) {
                const diffDays = Math.ceil(Math.abs(new Date() - dataEmp) / (1000 * 60 * 60 * 24));
                let color = '#10b981';
                let txt = 'No prazo';
                if (diffDays > 30) { color = '#ef4444'; txt = 'Atrasado'; }
                else if (diffDays > 25) { color = '#f59e0b'; txt = 'Vencendo'; }
                avisoHtml = `<div style="margin-top: 8px; font-size: 12px; font-weight: 600; color: ${color};">${txt} (${diffDays} dias)</div>`;
            }
            
            return `
                <div style="display: flex; gap: 16px; padding: 12px; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 12px; background: var(--bg-panel);">
                    <img src="${capa}" style="width: 60px; height: 90px; object-fit: cover; border-radius: 4px;" onerror="this.src='https://via.placeholder.com/60x90/2a2a2a/cccccc?text=Sem+Capa'">
                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-weight: 600; font-size: 14px; color: var(--text-main); margin-bottom: 4px;">${e.titulo_livro}</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Cód: ${e.codigo_livro}</div>
                        <div style="font-size: 12px; color: var(--text-muted);">Emp: ${dataEmp.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</div>
                        ${avisoHtml}
                    </div>
                </div>
            `;
        };

        const ativosContainer = document.getElementById('emprestimosAtivosContainer');
        if (ativos.length > 0) ativosContainer.innerHTML = ativos.map(e => renderCard(e, true)).join('');
        
        const inativosContainer = document.getElementById('emprestimosInativosContainer');
        if (inativos.length > 0) inativosContainer.innerHTML = inativos.map(e => renderCard(e, false)).join('');
        
    } catch (e) {
        console.error('Erro ao carregar empréstimos:', e);
    }
}
