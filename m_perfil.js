(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let pessoaAtual = null;
    let todasAsTags = [];
    let flagRemoverFoto = false;
    let currentId = new URLSearchParams(window.location.search).get('id');

    document.addEventListener('DOMContentLoaded', async () => {
        if (!currentId) {
            const action = new URLSearchParams(window.location.search).get('action');
            if (action === 'new') {
                pessoaAtual = { tipo_pessoa: 'Física', papeis: [] };
                await carregarTags();
                document.getElementById('mLoadingState').style.display = 'none';
                
                const modal = document.getElementById('mEditModal');
                document.querySelector('#mEditModal .m-header-title').innerText = 'Nova Pessoa';
                
                // Sobrescreve o comportamento de fechar para voltar à lista
                const btnCloseEdit = document.getElementById('btnCloseEdit');
                btnCloseEdit.addEventListener('click', (e) => {
                    e.stopImmediatePropagation();
                    window.location.href = 'm_pessoas.html';
                }, { once: true });
                
                document.getElementById('btnSaveEdit').addEventListener('click', salvarEdicao);
                
                // Esconde exclusao em modo "Novo"
                const btnExcluir = document.getElementById('btnExcluir');
                if (btnExcluir) btnExcluir.style.display = 'none';
                
                preencherFormulario();
                modal.classList.add('open');
                return;
            } else {
                alert('Pessoa não encontrada.');
                window.location.href = 'm_pessoas.html';
                return;
            }
        }

        await carregarTags();
        await carregarPerfil();

        // Modal de Edição
        const modal = document.getElementById('mEditModal');
        const btnOpenEdit = document.getElementById('btnOpenEdit');
        const btnCloseEdit = document.getElementById('btnCloseEdit');
        const btnSaveEdit = document.getElementById('btnSaveEdit');

        btnOpenEdit.addEventListener('click', () => {
            preencherFormulario();
            modal.classList.add('open');
        });

        btnCloseEdit.addEventListener('click', () => {
            modal.classList.remove('open');
        });

        btnSaveEdit.addEventListener('click', salvarEdicao);

        // Ação de Sair do Sistema
        const btnSairApp = document.getElementById('btnSairApp');
        if (btnSairApp) {
            btnSairApp.addEventListener('click', async () => {
                const conf = confirm('Deseja realmente sair do sistema?');
                if (conf) {
                    await db.auth.signOut();
                    window.location.href = 'login.html';
                }
            });
        }

        // Máscaras de Input
        const inpCep = document.getElementById('inpCep');
        if (inpCep) {
            inpCep.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\D/g, '');
                if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, '$1-$2');
                e.target.value = v;
            });
        }

        const inpCelular = document.getElementById('inpCelular');
        if (inpCelular) {
            inpCelular.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\D/g, '');
                if (v.length <= 10) {
                    v = v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
                } else {
                    v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                }
                e.target.value = v;
            });
        }

        const btnExcluir = document.getElementById('btnExcluir');
        if (btnExcluir) {
            btnExcluir.addEventListener('click', async () => {
                if (!currentId) return;
                const conf = confirm('Tem certeza que deseja excluir esta pessoa permanentemente? Esta ação não pode ser desfeita.');
                if (conf) {
                    try {
                        btnExcluir.innerText = 'Excluindo...';
                        try {
                            await db.from('pessoas').delete().eq('id', currentId);
                            alert('Pessoa excluída com sucesso.');
                            window.location.href = 'm_pessoas.html';
                        } catch (e) {
                            console.error(e);
                            alert('Erro ao excluir pessoa.');
                        }
                    } catch (e) {
                        console.error(e);
                        alert('Erro ao excluir. Verifique se a pessoa possui vínculos.');
                        btnExcluir.innerText = '🗑️ Excluir Pessoa';
                    }
                }
            });
        }

        // Preview de Foto ao Selecionar Arquivo
        const inpFoto = document.getElementById('inpFoto');
        const btnRemoverFoto = document.getElementById('btnRemoverFoto');
        
        if (inpFoto) {
            inpFoto.addEventListener('change', (e) => {
                const previewFoto = document.getElementById('previewFoto');
                if (e.target.files && e.target.files[0]) {
                    flagRemoverFoto = false;
                    previewFoto.src = URL.createObjectURL(e.target.files[0]);
                    previewFoto.style.display = 'block';
                    if (btnRemoverFoto) btnRemoverFoto.style.display = 'block';
                }
            });
        }

        if (btnRemoverFoto) {
            btnRemoverFoto.addEventListener('click', () => {
                flagRemoverFoto = true;
                const previewFoto = document.getElementById('previewFoto');
                previewFoto.style.display = 'none';
                previewFoto.src = '';
                if (inpFoto) inpFoto.value = '';
                btnRemoverFoto.style.display = 'none';
            });
        }
    });

    // ACL substituida por auth_guard.js: window.podeEditarPessoas()

    async function carregarTags() {
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
        } catch(err) {
            // Usa tags padrao
        }
        // Sort logic: 1. Associado Efetivo, 2. Outros, 3. Resto alfabeticamente
        let specialTags = [];
        if (TAGS.includes('Associado Efetivo')) { specialTags.push('Associado Efetivo'); }
        if (TAGS.includes('Outros')) { specialTags.push('Outros'); }
        
        let otherTags = TAGS.filter(t => t !== 'Associado Efetivo' && t !== 'Outros').sort((a, b) => a.localeCompare(b));
        todasAsTags = [...specialTags, ...otherTags];
        const container = document.getElementById('mTagsContainer');
        if (container) {
            container.innerHTML = todasAsTags.map(tag => `
                <label style="display: flex; align-items: center; gap: 6px; background: var(--bg-card); border: 1px solid var(--border); padding: 8px 12px; border-radius: 8px; font-size: 13px; color: var(--text-main);">
                    <input type="checkbox" name="mPapeis" value="${tag}" style="width: 16px; height: 16px; accent-color: var(--primary);">
                    ${tag}
                </label>
            `).join('');
        }
    }

    function obterIniciais(nome) {
        if (!nome) return '?';
        const partes = nome.trim().split(' ');
        if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }

    function formatarCpfCnpj(v) {
        if (!v) return '';
        v = v.replace(/\D/g,"");
        if (v.length <= 11) {
            return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g,"\$1.\$2.\$3-\$4");
        } else {
            return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g,"\$1.\$2.\$3/\$4-\$5");
        }
    }

    function formatarCEP(v) {
        if (!v) return '';
        v = v.replace(/\D/g, '');
        if (v.length > 8) v = v.slice(0, 8);
        if (v.length >= 5) {
            return v.replace(/(\d{5})(\d{1,3})/, "$1-$2");
        }
        return v;
    }
    async function carregarPerfil() {
        try {
            const { data, error } = await db.from('pessoas').select('*').eq('id', currentId).single();
            if (error) throw error;
            pessoaAtual = data;
            renderizarVisualizacao();

            const podeEditar = window.podeEditarPessoas();
            if (podeEditar) {
                document.getElementById('btnOpenEdit').style.display = 'block';
            }

        } catch (e) {
            console.error(e);
            alert('Erro ao carregar dados da pessoa.');
        } finally {
            document.getElementById('mLoadingState').style.display = 'none';
            document.getElementById('mProfileContent').style.display = 'block';
        }
    }

    function renderizarVisualizacao() {
        const p = pessoaAtual;
        
        // Header
        const avatar = document.getElementById('lblAvatar');
        if (p.foto_url) {
            avatar.style.background = 'transparent';
            avatar.style.border = 'none';
            avatar.innerHTML = `<img src="${p.foto_url}" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
            avatar.style.background = 'var(--bg-card)';
            avatar.style.border = '2px solid var(--border)';
            avatar.innerHTML = obterIniciais(p.nome_completo);
        }

        document.getElementById('lblNomeCompleto').innerText = p.nome_completo || 'Sem Nome';
        document.getElementById('lblTipoPessoa').innerText = p.tipo_pessoa || 'Pessoa Física';
        
        const papeisContainer = document.getElementById('lblPapeis');
        papeisContainer.innerHTML = '';
        if (p.papeis && p.papeis.length > 0) {
            p.papeis.forEach(papel => {
                const badge = document.createElement('span');
                badge.className = 'badge';
                badge.style.background = 'rgba(99, 102, 241, 0.2)';
                badge.style.color = '#818cf8';
                badge.style.fontSize = '12px';
                badge.style.padding = '4px 10px';
                badge.innerText = papel;
                papeisContainer.appendChild(badge);
            });
        }

        // Info
        const celularLimpo = (p.celular || '').replace(/\D/g, '');
        document.getElementById('lblCelular').innerText = p.celular || '-';
        const btnZap = document.getElementById('btnWhatsapp');
        if (celularLimpo) {
            btnZap.style.display = 'block';
            btnZap.href = `https://wa.me/55${celularLimpo}`;
        } else {
            btnZap.style.display = 'none';
        }

        document.getElementById('lblEmail').innerText = p.email || '-';
        document.getElementById('lblCpfCnpj').innerText = formatarCpfCnpj(p.cpf_cnpj) || '-';

        if (p.tipo_pessoa === 'Jurídica') {
            document.getElementById('rowNascimento').style.display = 'none';
        } else {
            document.getElementById('rowNascimento').style.display = 'flex';
            if (p.data_nascimento) {
                const partes = p.data_nascimento.split('-');
                document.getElementById('lblNascimento').innerText = `${partes[2]}/${partes[1]}/${partes[0]}`;
            } else {
                document.getElementById('lblNascimento').innerText = '-';
            }
        }

        // Novos Campos
        document.getElementById('lblSexo').innerText = p.sexo || '-';
        document.getElementById('lblNaturalidade').innerText = p.naturalidade || '-';
        document.getElementById('lblNacionalidade').innerText = p.nacionalidade || '-';
        document.getElementById('lblNomePai').innerText = p.nome_pai || '-';
        document.getElementById('lblNomeMae').innerText = p.nome_mae || '-';
        document.getElementById('lblEstadoCivil').innerText = p.estado_civil || '-';
        document.getElementById('lblProfissao').innerText = p.profissao || '-';

        const endereco = [];
        if (p.endereco) endereco.push(p.endereco);
        if (p.bairro) endereco.push(p.bairro);
        if (p.cidade) endereco.push(`${p.cidade} - ${p.estado || ''}`);
        
        if (endereco.length > 0) {
            document.getElementById('lblEnderecoCompleto').innerText = endereco.join(', ') + (p.cep ? ` (CEP: ${p.cep})` : '');
        } else {
            document.getElementById('lblEnderecoCompleto').innerText = 'Endereço não cadastrado';
        }
        
        // --- HOOK FINANCEIRO ---
        if (typeof window.initFinanceiro === 'function') {
            window.initFinanceiro(pessoaAtual, true);
        }
    }

    function preencherFormulario() {
        const p = pessoaAtual;
        document.getElementById('inpNome').value = pessoaAtual.nome_completo || '';
        document.getElementById('inpNomeCurto').value = pessoaAtual.nome_curto || '';
        document.getElementById('inpCpfCnpj').value = formatarCpfCnpj(pessoaAtual.cpf_cnpj) || '';
        document.getElementById('inpCelular').value = pessoaAtual.celular || '';
        document.getElementById('inpEmail').value = pessoaAtual.email || '';
        document.getElementById('inpNascimento').value = p.data_nascimento || '';
        
        // Novos Campos
        document.getElementById('inpStatus').value = p.status || 'Ativo';
        document.getElementById('inpSexo').value = p.sexo || '';
        document.getElementById('inpNaturalidade').value = p.naturalidade || '';
        document.getElementById('inpNacionalidade').value = p.nacionalidade || '';
        document.getElementById('inpNomePai').value = p.nome_pai || '';
        document.getElementById('inpNomeMae').value = p.nome_mae || '';
        document.getElementById('inpEstadoCivil').value = p.estado_civil || '';
        document.getElementById('inpProfissao').value = p.profissao || '';
        document.getElementById('inpCep').value = p.cep || '';
        document.getElementById('inpEndereco').value = p.endereco || '';
        document.getElementById('inpBairro').value = p.bairro || '';
        document.getElementById('inpCidade').value = p.cidade || '';
        document.getElementById('inpEstado').value = p.estado || '';

        // Limpar arquivo de foto para nova edicao
        const inpFoto = document.getElementById('inpFoto');
        if (inpFoto) inpFoto.value = '';
        flagRemoverFoto = false;

        const previewFoto = document.getElementById('previewFoto');
        const btnRemoverFoto = document.getElementById('btnRemoverFoto');
        if (p.foto_url) {
            previewFoto.src = p.foto_url;
            previewFoto.style.display = 'block';
            if (btnRemoverFoto) btnRemoverFoto.style.display = 'block';
        } else {
            previewFoto.src = '';
            previewFoto.style.display = 'none';
            if (btnRemoverFoto) btnRemoverFoto.style.display = 'none';
        }

        // Checkboxes de Papeis
        const checkboxes = document.querySelectorAll('input[name="mPapeis"]');
        checkboxes.forEach(cb => {
            cb.checked = (p.papeis && p.papeis.includes(cb.value));
        });
    }

    async function salvarEdicao() {
        const btnSaveEdit = document.getElementById('btnSaveEdit');
        btnSaveEdit.innerText = 'Salvando...';
        btnSaveEdit.disabled = true;

        const papeis = Array.from(document.querySelectorAll('input[name="mPapeis"]:checked')).map(cb => cb.value);

        const dados = {
            cpf_cnpj: document.getElementById('inpCpfCnpj').value.replace(/\D/g, '') || null,
            nome_completo: document.getElementById('inpNome').value.trim() || null,
            nome_curto: document.getElementById('inpNomeCurto').value.trim() || null,
            celular: document.getElementById('inpCelular').value.trim(),
            email: document.getElementById('inpEmail').value.trim(),
            data_nascimento: document.getElementById('inpNascimento').value || null,
            cep: document.getElementById('inpCep').value.trim(),
            endereco: document.getElementById('inpEndereco').value.trim(),
            bairro: document.getElementById('inpBairro').value.trim(),
            cidade: document.getElementById('inpCidade').value.trim(),
            estado: document.getElementById('inpEstado').value.trim().toUpperCase(),
            papeis: papeis,
            status: document.getElementById('inpStatus').value || 'Ativo',
            sexo: document.getElementById('inpSexo').value || null,
            naturalidade: document.getElementById('inpNaturalidade').value || null,
            nacionalidade: document.getElementById('inpNacionalidade').value || null,
            nome_pai: document.getElementById('inpNomePai').value || null,
            nome_mae: document.getElementById('inpNomeMae').value || null,
            estado_civil: document.getElementById('inpEstadoCivil').value || null,
            profissao: document.getElementById('inpProfissao').value || null
        };

        try {
            // Verifica Foto
            const inpFoto = document.getElementById('inpFoto');
            if (inpFoto && inpFoto.files && inpFoto.files.length > 0) {
                btnSaveEdit.innerText = 'Subindo Foto...';
                const file = inpFoto.files[0];
                const ext = file.name.split('.').pop();
                const fileName = `${Math.random()}.${ext}`;
                
                const { error: uploadError } = await db.storage
                    .from('fotos_perfil')
                    .upload(fileName, file);

                if (!uploadError) {
                    const { data: publicUrlData } = db.storage
                        .from('fotos_perfil')
                        .getPublicUrl(fileName);
                    dados.foto_url = publicUrlData.publicUrl;
                }
            } else if (flagRemoverFoto) {
                dados.foto_url = null;
            }

            btnSaveEdit.innerText = 'Salvando Dados...';

            if (currentId) {
                const { error } = await db.from('pessoas').update(dados).eq('id', currentId);
                if (error) throw error;
                
                Object.assign(pessoaAtual, dados);
                renderizarVisualizacao();
                document.getElementById('mEditModal').classList.remove('open');
            } else {
                dados.tipo_pessoa = 'Física';
                const { data, error } = await db.from('pessoas').insert([dados]).select('id').single();
                if (error) throw error;
                
                window.location.replace(`m_perfil.html?id=${data.id}`);
            }
            
        } catch(e) {
            console.error(e);
            alert('Erro ao salvar os dados.');
        } finally {
            btnSaveEdit.innerText = 'Salvar';
            btnSaveEdit.disabled = false;
        }
    }

    // Input formatters
    const inpCpfCnpj = document.getElementById('inpCpfCnpj');
    if (inpCpfCnpj) {
        inpCpfCnpj.addEventListener('input', (e) => {
            e.target.value = formatarCpfCnpj(e.target.value);
        });
    }

    const inpCelular = document.getElementById('inpCelular');
    if (inpCelular) {
        inpCelular.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length > 11) val = val.slice(0, 11);
            if (val.length > 2) val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
            if (val.length > 10) val = `${val.slice(0, 10)}-${val.slice(10)}`;
            e.target.value = val;
        });
    }

    const inpCep = document.getElementById('inpCep');
    if (inpCep) {
        inpCep.addEventListener('input', (e) => {
            e.target.value = formatarCEP(e.target.value);
        });
    }

    const inpEstado = document.getElementById('inpEstado');
    if (inpEstado) {
        inpEstado.addEventListener('input', (e) => {
            let val = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();
            if (val.length > 2) val = val.slice(0, 2);
            e.target.value = val;
        });
    }
})();

// Accordion global toggle
window.toggleAccordion = function(headerElement) {
    const accordion = headerElement.parentElement;
    
    // Toggle active class
    if (accordion.classList.contains('active')) {
        accordion.classList.remove('active');
        accordion.querySelector('.m-accordion-content').style.maxHeight = '0px';
    } else {
        accordion.classList.add('active');
        accordion.querySelector('.m-accordion-content').style.maxHeight = '2000px';
    }
};
