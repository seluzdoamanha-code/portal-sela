(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let allFamilias = [];
    let familiasLegado = [];
    let familiasPerfil = [];
    let currentTab = "legado";

    let currentFilter = 'Todas';
    let hubId = null;
    let selectedFamilia = null;

    document.addEventListener('DOMContentLoaded', async () => {
        const urlParams = new URLSearchParams(window.location.search);
        hubId = urlParams.get('id');

        document.getElementById('btnVoltarHub').addEventListener('click', () => {
            if (hubId) window.location.href = 'm_hub.html?id=' + hubId;
            else window.location.href = 'm_atividades.html';
        });

        document.getElementById('mSearchInput').addEventListener('input', filtrarLista);
        
        
        // Setup Main Tabs
        document.querySelectorAll('.m-main-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.m-main-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentTab = tab.getAttribute('data-tab');
                
                // Mudar label do botão Nova Familia
                const btnNova = document.getElementById('btnNovaFamilia');
                if (btnNova) {
                    if (currentTab === 'legado') {
                        btnNova.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
                    } else {
                        btnNova.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>';
                    }
                }
                
                filtrarLista();
            });
        });
        
        // Modal de metadados
        const btnSalvarMeta = document.getElementById('btnSalvarMeta');
        if (btnSalvarMeta) btnSalvarMeta.addEventListener('click', salvarMetaFamilia);


        // Setup Pills
        document.querySelectorAll('.m-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.m-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                currentFilter = pill.getAttribute('data-filter');
                filtrarLista();
            });
        });
        
        // Permissões
        if (typeof window.podeEditarPessoas === 'function' && window.podeEditarPessoas()) {
            document.getElementById('btnNovaFamilia').style.display = 'flex';
            document.getElementById('btnEditFamilia').style.display = 'block';
            
            document.getElementById('btnNovaFamilia').addEventListener('click', () => {
                if (currentTab === 'legado') {
                    abrirFormularioNova();
                } else {
                    if (confirm('Famílias Perfil são gerenciadas no módulo global de Pessoas. Deseja ir para lá agora?')) {
                        window.location.href = 'pessoas.html';
                    }
                }
            });
            document.getElementById('btnEditFamilia').addEventListener('click', () => {
                if (selectedFamilia && selectedFamilia.is_nova_plataforma) {
                    abrirFormularioMeta(selectedFamilia);
                } else {
                    abrirFormularioEdicao(selectedFamilia);
                }
            });
            document.getElementById('btnSalvarFamilia').addEventListener('click', salvarFamilia);
        }

        document.getElementById('btnVerHistorico').addEventListener('click', abrirHistorico);
        


        
        document.getElementById('btnIrParaOcorrencia').addEventListener('click', () => {
            if (selectedFamilia && selectedFamilia.id) {
                let url = 'm_ass_ocorrencias.html?f_id=' + selectedFamilia.id + '&f_nome=' + encodeURIComponent(selectedFamilia.codigo + ' - ' + selectedFamilia.nome_familia);
                window.location.href = url;
            }
        });

        await carregarFamilias();
        
        // Auto-open family if requested
        const urlParams2 = new URLSearchParams(window.location.search);
        const openId = urlParams2.get('open_id');
        if (openId) {
            autoOpenFamilia(openId);
        }
    });
    
    async function autoOpenFamilia(id) {
        try {
            const { data, error } = await db.from('ass_familias')
                .select('*, pessoas(*)')
                .eq('id', id)
                .single();
            if (!error && data) {
                abrirDetalhes(data);
            }
        } catch (e) {
            console.error('Erro auto open', e);
        }
    }

async function carregarFamilias() {
        document.getElementById('mLoadingState').style.display = 'block';

        try {
            // 1. Busca Famílias NOVAS
            const { data: dataNovas, error: errorNovas } = await db.from('pessoas')
                .select('*, ass_familias_meta(id, codigo, status, tipo), pessoas_relacionamentos!pessoa_origem_id(id)')
                .ilike('perfis', '%Titular da Família%');
            
            let familiasPerfil = [];
            if (!errorNovas) {
                familiasPerfil = (dataNovas || []).map(p => {
                    const meta = (p.ass_familias_meta && p.ass_familias_meta.length > 0) ? p.ass_familias_meta[0] : {};
                    return {
                        id: p.id,
                        nome_familia: p.nome_curto || p.nome_completo,
                        codigo: meta.codigo || 'S/C',
                        status: meta.status || 'Ativa',
                        tipo: meta.tipo || 'Fixa/Assistida',
                        pessoas: p,
                        ass_membros_familia: p.pessoas_relacionamentos || [],
                        meta_id: meta.id || null,
                        is_nova_plataforma: true
                    };
                });
            }

            // 2. Busca Famílias ANTIGAS
            const { data: dataAntigas, error: errorAntigas } = await db.from('ass_familias')
                .select('*, pessoas(*), ass_membros_familia(id)');
                
            let familiasLegado = [];
            if (!errorAntigas) {
                familiasLegado = (dataAntigas || []).map(f => {
                    f.is_nova_plataforma = false;
                    return f;
                });
            }

            allFamilias = [...familiasPerfil, ...familiasLegado];
            
            allFamilias.sort((a, b) => {
                const nomeA = (a.nome_familia || '').toLowerCase();
                const nomeB = (b.nome_familia || '').toLowerCase();
                if (nomeA < nomeB) return -1;
                if (nomeA > nomeB) return 1;
                return 0;
            });
            
            filtrarLista();

            document.getElementById('mLoadingState').style.display = 'none';
        } catch (e) {
            console.error('Erro:', e);
            document.getElementById('mLoadingState').innerText = 'Erro ao carregar famílias.';
        }
    }

function filtrarLista() {
        const query = (document.getElementById('mSearchInput').value || '').toLowerCase();
        
        let sourceList = currentTab === 'legado' ? familiasLegado : familiasPerfil;
        
        const filtrados = sourceList.filter(f => {
            const nomeStr = (f.nome_familia || '').toLowerCase();
            const codStr = (f.codigo || '').toLowerCase();
            const matchTexto = nomeStr.includes(query) || codStr.includes(query);
            
            let matchPill = true;
            if (currentFilter !== 'Todas') {
                matchPill = (f.status === currentFilter);
            }
            
            return matchTexto && matchPill;
        });
        
        // Reordena
        filtrados.sort((a, b) => {
            const nomeA = (a.nome_familia || '').toLowerCase();
            const nomeB = (b.nome_familia || '').toLowerCase();
            if (nomeA < nomeB) return -1;
            if (nomeA > nomeB) return 1;
            return 0;
        });

        renderizar(filtrados);
        const headerTitle = document.getElementById('mMainTitle');
        if (headerTitle) {
            headerTitle.innerText = currentTab === 'legado' ? `Famílias Legado (${filtrados.length})` : `Famílias Perfil (${filtrados.length})`;
        }
    }

    function renderizar(dados) {
        const container = document.getElementById('mFamList');
        container.innerHTML = '';
        
        if (dados.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhuma família encontrada.</div>';
            return;
        }

        dados.forEach(f => {
            const card = document.createElement('div');
            card.className = 'm-fam-card';
            
            const membersCount = f.ass_membros_familia ? f.ass_membros_familia.length + 1 : 1;
            const tipoStr = f.tipo || 'Fixa/Assistida';

const isNova = f.is_nova_plataforma ? '<span style="font-size:10px; background:#4ade80; color:#14532d; padding:2px 6px; border-radius:8px; margin-left:8px;">Global</span>' : '';
            card.innerHTML = `
                <div class="m-fam-header">
                    <div class="m-fam-name">${f.nome_familia || 'Sem Nome'} ${isNova}</div>
                    <div class="m-fam-status status-${f.status || 'Ativa'}">${f.status || 'Ativa'}</div>
                </div>
                <div class="m-fam-info" style="margin-top:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <span class="m-fam-code" style="margin-right:6px; font-weight:600; color:var(--text-main);">${f.codigo || 'S/C'}</span>
                        <span style="font-size:13px;">Membros (${membersCount})</span>
                    </div>
                    <div style="font-size:11px; color:var(--text-muted); background:rgba(255,255,255,0.05); padding:3px 8px; border-radius:12px;">
                        ${tipoStr}
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => abrirDetalhes(f));
            container.appendChild(card);
        });
    }

    function formatarWhatsApp(numero) {
        if (!numero) return '';
        let n = numero.replace(/\D/g, '');
        if (n.length === 10 || n.length === 11) {
            return '55' + n;
        }
        return n;
    }

    function formatarCelular(numero) {
        if (!numero) return '-';
        let n = numero.replace(/\D/g, '');
        if (n.length === 11) {
            return `(${n.substring(0,2)}) ${n.substring(2,7)}-${n.substring(7,11)}`;
        } else if (n.length === 10) {
            return `(${n.substring(0,2)}) ${n.substring(2,6)}-${n.substring(6,10)}`;
        }
        return numero;
    }

    function formatarCEP(cep) {
        if (!cep) return '';
        let c = cep.replace(/\D/g, '');
        if (c.length === 8) {
            return `${c.substring(0,5)}-${c.substring(5,8)}`;
        }
        return cep;
    }

    async function abrirDetalhes(f) {
        selectedFamilia = f;
        const cod = f.codigo || 'S/C';
        const nomeFam = f.nome_familia || 'Sem Nome';
        document.getElementById('mdNome').innerText = `${cod} - ${nomeFam}`;
        document.getElementById('mdResp').innerText = (f.pessoas && f.pessoas.nome_completo) ? f.pessoas.nome_completo : (f.nome_familia || '-');
        document.getElementById('mdCodigo').innerText = f.codigo || '-';
        document.getElementById('mdStatus').innerText = f.status || 'Ativa';
        
        const resp = f.pessoas || {};
        const elCelular = document.getElementById('mdCelular');
        if(elCelular) elCelular.innerText = formatarCelular(resp.celular) || '-';
        
        const elEmail = document.getElementById('mdEmail');
        if(elEmail) elEmail.innerText = resp.email || '-';
        
        const elQtd = document.getElementById('mdQtdPessoas');
        if(elQtd) elQtd.innerText = f.ass_membros_familia ? (f.ass_membros_familia.length + 1) : 1;
        
        // Contato
        const btnZap = document.getElementById('btnWhatsApp');
        if (resp.celular || f.telefone) {
            btnZap.style.display = 'flex';
            btnZap.href = 'https://wa.me/' + formatarWhatsApp(resp.celular || f.telefone);
        } else {
            btnZap.style.display = 'none';
        }

        // Endereço Formatado: endereco - bairro. cep. cidade-estado
        let r = resp;
        let endCompleto = r.endereco || '';
        if (r.bairro) endCompleto += (endCompleto ? ' - ' : '') + r.bairro;
        if (r.cep) endCompleto += (endCompleto ? '. ' : '') + formatarCEP(r.cep);
        
        let cidEst = '';
        if (r.cidade && r.estado) cidEst = r.cidade + '-' + r.estado;
        else if (r.cidade) cidEst = r.cidade;
        else if (r.estado) cidEst = r.estado;
        
        if (cidEst) endCompleto += (endCompleto ? '. ' : '') + cidEst;
        
        document.getElementById('mdEndereco').innerText = endCompleto || 'Não informado';
        
        const btnMaps = document.getElementById('btnGoogleMaps');
        if (endCompleto) {
            btnMaps.style.display = 'flex';
            const endBusca = encodeURIComponent(endCompleto);
            btnMaps.href = 'https://www.google.com/maps/search/?api=1&query=' + endBusca;
        } else {
            btnMaps.style.display = 'none';
        }
        
        // Link Registrar Entrega
        const btnIrEntrega = document.getElementById('btnIrParaEntrega');
        if (btnIrEntrega) {
            btnIrEntrega.onclick = () => {
                window.location.href = `m_ass_entregas.html?f_id=${f.id}&f_nome=${encodeURIComponent(f.codigo + ' - ' + (f.nome_familia || ''))}`;
            };
        }

        document.getElementById('mDetModal').classList.add('active');
        
        // Buscar Historico
        

        // Buscar Ocorrencias
        const ocoEl = document.getElementById('mdOcorrenciasList');
        if (ocoEl) {
            ocoEl.innerHTML = 'Buscando ocorrências...';
            db.from('ass_ocorrencias')
              .select('*')
              .eq('familia_id', f.id)
              .order('data_ocorrencia', {ascending: false})
              .then(({data: ocos, error}) => {
                  if(error) {
                      ocoEl.innerHTML = 'Erro ao buscar ocorrências';
                      console.error(error);
                      return;
                  }
                  if(!ocos || ocos.length === 0) {
                      ocoEl.innerHTML = '<span style="font-size:13px; color:var(--text-muted);">Nenhuma ocorrência registrada.</span>';
                  } else {
                      ocoEl.innerHTML = ocos.map(o => {
                          const dateStr = o.data_ocorrencia ? o.data_ocorrencia.split('-').reverse().join('/') : '';
                          const corTipo = o.tipo === 'Grave' ? '#ef4444' : 'var(--text-main)';
                          return `
                            <div class="m-member-row" style="display: flex; flex-direction: column; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                    <div style="color:${corTipo}; font-weight:600; font-size:13px;">${o.codigo} - ${o.tipo}</div>
                                    <div style="font-size:12px; color:var(--text-muted);">${dateStr}</div>
                                </div>
                                <div style="font-size:13px; color:var(--text-muted); line-height: 1.4;">
                                    ${o.observacao}
                                </div>
                            </div>
                          `;
                      }).join('');
                  }
              });
        }

        const histEl = document.getElementById('mdHistoricoList');
        if(histEl) {
            histEl.innerHTML = 'Buscando histórico...';
            db.from('ass_entregas')
              .select('id, data_entrega, quantidade_entregue, observacoes, ass_cestas_modelos(tipo)')
              .eq('familia_id', f.id)
              .order('data_entrega', {ascending: false})
              .then(({data: hist, error}) => {
                  if(error) {
                      histEl.innerHTML = 'Erro ao buscar histórico';
                      console.error(error);
                      return;
                  }
                  if(!hist || hist.length === 0) {
                      histEl.innerHTML = '<span style="font-size:13px; color:var(--text-muted);">Nenhuma entrega registrada.</span>';
                  } else {
                      window._currentFamilyEntregas = hist; // store globally for expand


                      renderEntregasList(3);
                  }
              });
        }


        
// Buscar Membros (Assíncrono)
        const ml = document.getElementById('mdMembrosList');
        const cjBlock = document.getElementById('mdConjugeBlock');
        const cjVal = document.getElementById('mdConjuge');
        cjBlock.style.display = 'none'; // Reset conjuge
        
        ml.innerHTML = 'Buscando membros...';
        try {
            let allMembers = [];
            
            if (f.is_nova_plataforma) {
                // Lógica NOVA
                const { data: membrosOrig, error } = await db.from('pessoas_relacionamentos')
                    .select('tipo_relacao, pessoas!pessoa_destino_id(nome_completo, data_nascimento)')
                    .eq('pessoa_origem_id', f.id);
                if (error) throw error;
                
                const resp = f.pessoas || {};
                if (resp.nome_completo) {
                    allMembers.push({
                        nome: resp.nome_completo,
                        parentesco: 'Titular',
                        nascimento: resp.data_nascimento,
                        is_resp: true
                    });
                }
                if (membrosOrig) {
                    membrosOrig.forEach(m => {
                        const p = m.pessoas || {};
                        allMembers.push({
                            nome: p.nome_completo || 'Sem Nome',
                            parentesco: m.tipo_relacao || '',
                            nascimento: p.data_nascimento,
                            is_conjuge: (m.tipo_relacao && m.tipo_relacao.toLowerCase().includes('cônjuge'))
                        });
                    });
                }
            } else {
                // Lógica ANTIGA
                const { data: membrosOrig, error } = await db.from('ass_membros_familia')
                    .select('parentesco, pessoas(nome_completo, data_nascimento)')
                    .eq('familia_id', f.id);
                if (error) throw error;
                
                const resp = f.pessoas || {};
                if (resp.nome_completo) {
                    allMembers.push({
                        nome: resp.nome_completo,
                        parentesco: 'Responsável',
                        nascimento: resp.data_nascimento,
                        is_resp: true
                    });
                } else {
                    allMembers.push({
                        nome: f.nome_familia || 'Responsável',
                        parentesco: 'Responsável',
                        nascimento: null,
                        is_resp: true
                    });
                }
                
                if (membrosOrig) {
                    membrosOrig.forEach(m => {
                        const p = m.pessoas || {};
                        allMembers.push({
                            nome: p.nome_completo || 'Sem Nome',
                            parentesco: m.parentesco || '',
                            nascimento: p.data_nascimento,
                            is_conjuge: (m.parentesco && m.parentesco.toLowerCase().includes('cônjuge'))
                        });
                    });
                }
            }
            
            // Cônjuge logic
            const conjuge = allMembers.find(m => m.is_conjuge);
            if (conjuge) {
                cjBlock.style.display = 'block';
                cjVal.innerText = conjuge.nome;
            }
            
            // Sort
            allMembers.sort((a, b) => {
                if (a.is_conjuge && !b.is_conjuge) return -1;
                if (!a.is_conjuge && b.is_conjuge) return 1;
                
                if (a.nascimento && b.nascimento) return new Date(a.nascimento) - new Date(b.nascimento);
                if (a.nascimento && !b.nascimento) return -1;
                if (!a.nascimento && b.nascimento) return 1;
                return 0;
            });

            ml.innerHTML = allMembers.map(m => {
                let idadeStr = '';
                if (m.nascimento) {
                    const age = new Date().getFullYear() - new Date(m.nascimento).getFullYear();
                    idadeStr = ` - ${age} a.`;
                }
                return `
                    <div class="m-member-row" style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
                        <span style="color:var(--text-main); font-weight:500;">${m.nome}</span>
                        <span style="font-size: 13px;">${m.parentesco}${idadeStr}</span>
                    </div>
                `;
            }).join('');
            
        } catch (e) {
            console.error('Erro buscar membros', e);
            ml.innerHTML = 'Erro ao buscar membros.';
        }
    }
    
    async function abrirHistorico() {
        if (!selectedFamilia) return;
        document.getElementById('mHistoryModal').classList.add('active');
        const hc = document.getElementById('mHistoryContent');
        hc.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">Buscando histórico...</div>';
        
        try {
            const { data, error } = await db.from('ass_ocorrencias')
                .select('*')
                .eq('familia_id', selectedFamilia.id)
                .order('data_ocorrencia', { ascending: false });
                
            if (error) throw error;
            
            if (!data || data.length === 0) {
                hc.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">Nenhuma ocorrência registrada.</div>';
                return;
            }
            
            hc.innerHTML = data.map(o => {
                const dateParts = o.data_ocorrencia.split('-');
                const brDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : o.data_ocorrencia;
                const obs = o.observacoes ? `<div class="m-history-obs">"${o.observacoes}"</div>` : '';
                return `
                    <div class="m-history-row">
                        <div class="m-history-date">${brDate}</div>
                        <div class="m-history-type">${o.tipo_ocorrencia}</div>
                        ${obs}
                    </div>
                `;
            }).join('');
        } catch(e) {
            hc.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">Erro ao carregar.</div>';
        }
    }

    // --- FORMULÁRIO CRUD ---
window.assPessoasGlobais = [];

window.gerarOpcoesPessoasAss = function(selecionadoId = '') {
    const pessoas = window.assPessoasGlobais || [];
    const comPerfil = pessoas.filter(p => p.perfis && p.perfis.includes('Membro da Família'));
    const semPerfil = pessoas.filter(p => !p.perfis || !p.perfis.includes('Membro da Família'));
    
    let html = '<option value="">-- Selecione --</option>';
    
    if (comPerfil.length > 0) {
        html += '<optgroup label="Com perfil: Membro da Família">';
        html += comPerfil.map(p => `<option value="${p.id}" ${p.id === selecionadoId ? 'selected' : ''}>${p.nome_completo}</option>`).join('');
        html += '</optgroup>';
    }
    
    if (semPerfil.length > 0) {
        html += '<optgroup label="Demais Cadastros (Sem perfil)">';
        html += semPerfil.map(p => `<option value="${p.id}" ${p.id === selecionadoId ? 'selected' : ''}>${p.nome_completo}</option>`).join('');
        html += '</optgroup>';
    }
    
    return html;
};

window.adicionarLinhaMembroAss = function(pessoaId = '', parentesco = '') {
    const container = document.getElementById('mMembrosContainer');
    
    const div = document.createElement('div');
    div.className = 'ass-membro-linha';
    div.style = 'display: flex; gap: 8px; margin-bottom: 8px; align-items: center;';
    
    const pessoasOptions = window.gerarOpcoesPessoasAss(pessoaId);

    div.innerHTML = `
        <select class="m-form-input mem-pessoa" required style="flex: 2;">
            ${pessoasOptions}
        </select>
        <input type="text" class="m-form-input mem-parentesco" required placeholder="Parentesco (Ex: Filho)" value="${parentesco}" style="flex: 1;">
        <button type="button" onclick="this.parentElement.remove()" style="background:none; border:none; color: #ef4444; padding:8px; cursor:pointer;" title="Remover">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
    `;
    container.appendChild(div);
};

async function carregarPessoasParaForm() {
    if (window.assPessoasGlobais && window.assPessoasGlobais.length > 0) return; // Already loaded
    try {
        const { data: pessoas, error } = await db.from('pessoas').select('id, nome_completo, perfis').order('nome_completo');
        if (error) throw error;
        window.assPessoasGlobais = pessoas || [];
    } catch(err) {
        console.error("Erro ao carregar pessoas:", err);
    }
}

async function abrirFormularioNova() {
    document.getElementById('mFormTitle').innerText = 'Nova Família';
    document.getElementById('fId').value = '';
    document.getElementById('fCodigo').value = '';
    document.getElementById('fNome').value = '';
    document.getElementById('fTipo').value = 'Fixa/Assistida';
    document.getElementById('fStatus').value = 'Ativa';
    document.getElementById('mMembrosContainer').innerHTML = '';
    
    const btnSalvar = document.getElementById('btnSalvarFamilia');
    btnSalvar.disabled = true;
    btnSalvar.innerText = 'Carregando...';
    
    document.getElementById('mFormModal').classList.add('active');
    
    await carregarPessoasParaForm();
    document.getElementById('fResponsavel').innerHTML = window.gerarOpcoesPessoasAss('');
    
    btnSalvar.disabled = false;
    btnSalvar.innerText = 'Salvar';
}
    
async function abrirFormularioEdicao(f) {
    if (!f) return;
    document.getElementById('mFormTitle').innerText = 'Editar Família';
    document.getElementById('fId').value = f.id;
    document.getElementById('fCodigo').value = f.codigo || '';
    document.getElementById('fNome').value = f.nome_familia || '';
    document.getElementById('fTipo').value = f.tipo || 'Fixa/Assistida';
    document.getElementById('fStatus').value = f.status || 'Ativa';
    document.getElementById('mMembrosContainer').innerHTML = '';
    
    const btnSalvar = document.getElementById('btnSalvarFamilia');
    btnSalvar.disabled = true;
    btnSalvar.innerText = 'Carregando...';
    
    document.getElementById('mFormModal').classList.add('active');
    
    await carregarPessoasParaForm();
    document.getElementById('fResponsavel').innerHTML = window.gerarOpcoesPessoasAss(f.responsavel_id);
    
    // Fetch members for this family
    try {
        const { data: familiaDetalhe, error } = await db.from('ass_familias').select('*, ass_membros_familia(*)').eq('id', f.id).single();
        if (error) throw error;
        
        if (familiaDetalhe && familiaDetalhe.ass_membros_familia) {
            familiaDetalhe.ass_membros_familia.forEach(m => {
                window.adicionarLinhaMembroAss(m.pessoa_id, m.parentesco);
            });
        }
    } catch (e) {
        console.error("Erro ao carregar membros:", e);
    }
    
    btnSalvar.disabled = false;
    btnSalvar.innerText = 'Salvar';
}

window.fecharFormulario = function() {
    document.getElementById('mFormModal').classList.remove('active');
};

async function salvarFamilia() {
    const id = document.getElementById('fId').value;
    const payload = {
        codigo: document.getElementById('fCodigo').value.trim() || null,
        nome_familia: document.getElementById('fNome').value.trim(),
        tipo: document.getElementById('fTipo').value,
        status: document.getElementById('fStatus').value,
        responsavel_id: document.getElementById('fResponsavel').value || null
    };
    
    if (!payload.nome_familia) {
        alert('O Nome de Identificação é obrigatório.');
        return;
    }
    if (!payload.responsavel_id) {
        alert('Selecione um Responsável Legal.');
        return;
    }
    
    const btn = document.getElementById('btnSalvarFamilia');
    btn.innerText = 'Salvando...';
    btn.disabled = true;
    
    try {
        let famId = id;
        
        if (id) {
            // Update
            const { error } = await db.from('ass_familias').update(payload).eq('id', id);
            if (error) throw error;
            
            // Delete old members
            await db.from('ass_membros_familia').delete().eq('familia_id', id);
        } else {
            // Insert
            const { data, error } = await db.from('ass_familias').insert([payload]).select('id').single();
            if (error) throw error;
            famId = data.id;
        }
        
        // Insert new members
        const linhas = document.querySelectorAll('.ass-membro-linha');
        const membros = [];
        linhas.forEach(l => {
            const pid = l.querySelector('.mem-pessoa').value;
            const par = l.querySelector('.mem-parentesco').value.trim();
            if (pid && par) {
                membros.push({
                    familia_id: famId,
                    pessoa_id: pid,
                    parentesco: par
                });
            }
        });

        if (membros.length > 0) {
            const { error: memError } = await db.from('ass_membros_familia').insert(membros);
            if (memError) throw memError;
        }
        
        window.fecharFormulario();
        // Se estava editando, fecha o painel de detalhes tbm pra forçar refresh
        if (id) document.getElementById('mDetModal').classList.remove('active');
        
        await carregarFamilias();
    } catch(e) {
        console.error(e);
        alert('Erro ao salvar família. Verifique se o código não está duplicado.');
    } finally {
        btn.innerText = 'Salvar';
        btn.disabled = false;
    }
}



window.renderEntregasList = function(limit) {
    const hist = window._currentFamilyEntregas || [];
    const histEl = document.getElementById('mdHistoricoList');
    if (!histEl) return;
    
    let html = '';
    const toShow = hist.slice(0, limit);
    
    html += toShow.map(h => {
        const dateStr = h.data_entrega ? h.data_entrega.split('-').reverse().join('/') : '';
        const modeloNome = h.ass_cestas_modelos ? h.ass_cestas_modelos.tipo : 'Cesta Desconhecida';
        const qtdStr = h.quantidade_entregue ? h.quantidade_entregue + 'x ' : '';
        const obsHtml = h.observacoes ? `<div style="font-size:12px; color:var(--text-muted); margin-top:2px; font-style:italic;">Obs: ${h.observacoes}</div>` : '';
        return `
            <div class="m-member-row" style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <div>
                    <div style="color:var(--text-main); font-weight:500;">${qtdStr}${modeloNome}</div>
                    <div style="font-size:12px; color:var(--text-muted);">${dateStr}</div>
                    ${obsHtml}
                </div>
            </div>
        `;
    }).join('');
    
    if (hist.length > limit) {
        const remaining = hist.length - limit;
        html += `
            <div style="text-align: center; margin-top: 8px;">
                <button onclick="renderEntregasList(999)" style="background: none; border: none; color: var(--primary); font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                    Ver mais ${remaining} entregas
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
                </button>
            </div>
        `;
    } else if (limit > 3 && hist.length > 3) {
         html += `
            <div style="text-align: center; margin-top: 8px;">
                <button onclick="renderEntregasList(3)" style="background: none; border: none; color: var(--text-muted); font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                    Mostrar menos
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg>
                </button>
            </div>
        `;
    }
    
    histEl.innerHTML = html;
};

async function abrirFormularioMeta(f) {
    document.getElementById('mMetaTitle').innerText = 'Metadados Assistência: ' + (f.nome_familia || '');
    document.getElementById('fMetaId').value = f.id; // pessoa_id
    document.getElementById('fMetaCodigo').value = f.codigo || '';
    document.getElementById('fMetaStatus').value = f.status || 'Ativa';
    document.getElementById('fMetaTipo').value = f.tipo || 'Fixa/Assistida';
    
    document.getElementById('mMetaModal').classList.add('active');
}

async function salvarMetaFamilia() {
    const pessoaId = document.getElementById('fMetaId').value;
    const codigo = document.getElementById('fMetaCodigo').value.trim();
    const status = document.getElementById('fMetaStatus').value;
    const tipo = document.getElementById('fMetaTipo').value;

    const btn = document.getElementById('btnSalvarMeta');
    btn.innerText = 'Salvando...';
    btn.disabled = true;

    try {
        const payload = {
            pessoa_id: pessoaId,
            codigo: codigo,
            status: status,
            tipo: tipo
        };

        const { error } = await db.from('ass_familias_meta').upsert(payload, { onConflict: 'pessoa_id' });
        if (error) throw error;
        
        document.getElementById('mMetaModal').classList.remove('active');
        carregarFamilias();
    } catch(e) {
        console.error(e);
        alert('Erro ao salvar metadados da família.');
    } finally {
        btn.innerText = 'Salvar';
        btn.disabled = false;
    }
}

})();
