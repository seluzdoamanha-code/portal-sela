
function formatCpf(cpf) {
    if (!cpf) return '-';
    let val = cpf.replace(/\D/g, '');
    if (val.length === 11) return val.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    if (val.length === 14) return val.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    return cpf;
}
function formatCel(cel) {
    if (!cel) return '-';
    let val = cel.replace(/\D/g, '');
    if (val.length === 11) return val.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (val.length === 10) return val.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return cel;
}
const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificação de Acesso Global
    await verificarAcessoAdmin();
});

async function verificarAcessoAdmin() {
    try {
        const { data: { session } } = await db.auth.getSession();
        if (!session) {
            window.location.href = 'login.html';
            return;
        }

        const userEmail = session.user.email;
        const { data: userProfile, error } = await db
            .from('usuarios_autorizados')
            .select('nivel_acesso')
            .eq('email', userEmail)
            .single();

        if (error || !userProfile || userProfile.nivel_acesso !== 'admin_global') {
            alert('Acesso negado: Esta área é restrita para administradores globais.');
            window.location.href = 'index.html'; // Redireciona para um local seguro
            return;
        }

        // Tudo certo! É admin. Mostra o conteúdo.
        document.getElementById('adminContent').style.display = 'block';
        carregarHistoricoCelular();
        carregarDashboardsPessoas();
        carregarDashboardsHome();
        carregarAssociadosMensalidades();
        carregarDashboardsDepartamentosEAtividades();

    } catch (e) {
        console.error('Erro ao verificar acesso admin:', e);
        window.location.href = 'index.html';
    }
}

// Controle de Abas
window.switchTab = function(tabId) {
    // Remove active de todas as abas (botões)
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(t => t.classList.remove('active'));

    // Remove active de todos os conteúdos
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(c => c.classList.remove('active'));

    // Adiciona active no botão clicado
    // Como os botões chamam switchTab('id'), e têm onclick correspondente,
    // vamos pegar o target baseado num map ou pelo event, 
    // mas de forma mais fácil: procurar o botão que tem onclick="switchTab('id')"
    const btn = document.querySelector(`.admin-tab[onclick="switchTab('${tabId}')"]`);
    if (btn) btn.classList.add('active');

    // Adiciona active no conteúdo alvo
    const targetContent = document.getElementById(`tab-${tabId}`);
    if (targetContent) targetContent.classList.add('active');
};


// ==========================================
// MÓDULO: CELULAR
// ==========================================

async function carregarHistoricoCelular() {
    const { data, error } = await db
        .from('app_admin_celular_creditos')
        .select('*')
        .order('data_adicionado', { ascending: false });

    if (error) {
        console.error("Erro ao carregar histórico de celular:", error);
        return;
    }

    const tbody = document.getElementById('tabelaCelularHistorico');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding: 16px; text-align: center; color: var(--text-muted);">Nenhuma recarga registrada.</td></tr>`;
        return;
    }

    // Verificar se o mais recente está próximo do vencimento (<= 3 dias)
    const ultimo = data[0];
    const alertDiv = document.getElementById('celularStatusAlert');
    
    const dtAdic = new Date(ultimo.data_adicionado + 'T12:00:00Z');
    const dtVenc = new Date(dtAdic);
    dtVenc.setDate(dtVenc.getDate() + ultimo.prazo_dias);
    
    const hoje = new Date();
    const diffTime = dtVenc - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 3) {
        if(alertDiv) {
            alertDiv.style.display = 'block';
            if (diffDays < 0) {
                alertDiv.innerHTML = `🚨 Vencido há ${Math.abs(diffDays)} dia(s)!`;
            } else {
                alertDiv.innerHTML = `🚨 Vence em ${diffDays} dia(s)!`;
            }
        }
    } else {
        if(alertDiv) alertDiv.style.display = 'none';
    }

    data.forEach(item => {
        const itemAdic = new Date(item.data_adicionado + 'T12:00:00Z');
        const itemVenc = new Date(itemAdic);
        itemVenc.setDate(itemVenc.getDate() + item.prazo_dias);
        
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        tr.innerHTML = `
            <td style="padding: 12px 16px;">${item.data_adicionado.split('-').reverse().join('/')}</td>
            <td style="padding: 12px 16px;">${item.prazo_dias} dias</td>
            <td style="padding: 12px 16px; color: #34d399;">R$ ${Number(item.valor).toFixed(2).replace('.', ',')}</td>
            <td style="padding: 12px 16px;">${itemVenc.toISOString().split('T')[0].split('-').reverse().join('/')}</td>
            <td style="padding: 12px 16px;">
                <button onclick="excluirRecargaCelular('${item.id}')" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 4px; padding: 4px 8px; cursor: pointer;">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.salvarRecargaCelular = async function() {
    const dt = document.getElementById('celularData').value;
    const prazo = document.getElementById('celularPrazo').value;
    const valor = document.getElementById('celularValor').value;

    if (!dt || !prazo || !valor) {
        alert("Preencha todos os campos!");
        return;
    }

    const { error } = await db.from('app_admin_celular_creditos').insert([{
        data_adicionado: dt,
        prazo_dias: parseInt(prazo),
        valor: parseFloat(valor)
    }]);

    if (error) {
        alert("Erro ao salvar: " + error.message);
    } else {
        document.getElementById('celularData').value = '';
        document.getElementById('celularValor').value = '';
        carregarHistoricoCelular();
        carregarDashboardsPessoas();
        carregarDashboardsHome();
        carregarAssociadosMensalidades();
        carregarDashboardsDepartamentosEAtividades();
    }
};

window.excluirRecargaCelular = async function(id) {
    if(!confirm("Tem certeza que deseja excluir este registro?")) return;
    
    const { error } = await db.from('app_admin_celular_creditos').delete().eq('id', id);
    if(error) {
        alert("Erro ao excluir: " + error.message);
    } else {
        carregarHistoricoCelular();
        carregarDashboardsPessoas();
        carregarDashboardsHome();
        carregarAssociadosMensalidades();
        carregarDashboardsDepartamentosEAtividades();
    }
};



// ==========================================
// MÓDULO: DASHBOARDS PESSOAS E ASSOCIADOS
// ==========================================

window.switchSubTab = function(target, tabName) {
    const tabs = ['perfil', 'dados', 'lista'];
    tabs.forEach(t => {
        const el = document.getElementById(`subtab-${target}-${t}`) || document.getElementById(`${target}-${t}`);
        if (el) el.style.display = 'none';
        
        const btn = document.querySelector(`.btn-${target}-${t}`);
        if (btn) {
            btn.classList.remove('active');
            btn.style.background = 'rgba(255,255,255,0.05)';
            btn.style.color = 'var(--text-muted)';
            btn.style.border = '1px solid var(--border)';
        }
    });
    
    const targetEl = document.getElementById(`subtab-${target}-${tabName}`) || document.getElementById(`${target}-${tabName}`);
    if (targetEl) targetEl.style.display = tabName === 'lista' ? 'flex' : (tabName === 'dados' ? 'grid' : 'block');
    
    const targetBtn = document.querySelector(`.btn-${target}-${tabName}`);
    if (targetBtn) {
        targetBtn.classList.add('active');
        targetBtn.style.background = 'var(--primary)';
        targetBtn.style.color = 'white';
        targetBtn.style.border = 'none';
    }
    
    if (tabName === 'lista') {
        if (target === 'associados' && typeof window.carregarTabelaListaAssociados === 'function') {
            window.carregarTabelaListaAssociados();
        } else if (target === 'pessoas' && typeof window.carregarTabelaListaGlobalPessoas === 'function') {
            window.carregarTabelaListaGlobalPessoas();
        }
    }
};

async function carregarDashboardsPessoas() {
    const { data: pessoas, error } = await db.from('pessoas').select('*');
    if (error) {
        console.error("Erro ao carregar pessoas para o dashboard:", error);
        return;
    }

    const processDashboard = (lista, targetIdPrefix) => {
        // PERFIS
        const perfisTarget = [
            "Assistida + Assistido", "Associado Efetivo", "Associado Proponente", 
            "Atendente Fraterno", "Colaborador + Colaboradora", "Conselheira + Conselheiro", 
            "Coordenador + Coordenadora", "Diretor + Diretora", "Empresa Parceira", "Estudante", 
            "Evangelizador + Evangelizadora", "Evangelizanda + Evangelizando", "Ex-Associado", "Fornecedor",
            "Gestante", "Leitor", "Líder", "Membro da Família", "Paciente", "Paciente Externo", 
            "Palestrante", "Parceiro", "Passista", "Presidente + Presidenta", "Secretário + Secretária", 
            "Tarefeira + Tarefeiro", "Tesoureira + Tesoureiro", "Vice-Diretor + Vice-Diretora", 
            "Vice-Presidenta + Vice-Presidente", "Voluntária + Voluntário", "Outros"
        ];
        
        let counts = { Total: lista.length, Fisica: 0, Juridica: 0 };
        perfisTarget.forEach(p => counts[p] = 0);

        // DADOS
        let dadosCounts = {
            'Com CPF': 0, 'Com CPF provisório': 0,
            'Com celular': 0, 'Sem celular': 0,
            'Com data Nascimento': 0, 'Sem data Nascimento': 0,
            'Com E-mail': 0, 'Sem E-mail': 0,
            'Com foto Perfil': 0, 'Sem foto Perfil': 0,
            'Com Sexo': 0, 'Sem Sexo': 0,
            'Com Estado Civil': 0, 'Sem Estado Civil': 0
        };

        lista.forEach(p => {
            // Conta Fisica/Juridica
            if (p.tipo_pessoa === 'Física' || !p.tipo_pessoa) counts.Fisica++;
            if (p.tipo_pessoa === 'Jurídica') counts.Juridica++;

            // Mapeia perfis
            let userPerfis = [];
            if (Array.isArray(p.perfis)) userPerfis = p.perfis;
            else if (typeof p.perfis === 'string') {
                try { userPerfis = JSON.parse(p.perfis); } catch(e) { userPerfis = p.perfis.split(','); }
            }

            userPerfis.forEach(perfilStr => {
                const perf = perfilStr.trim();
                let found = false;
                for (let pt of perfisTarget) {
                    if (pt.includes(perf) || perf.includes(pt)) {
                        counts[pt]++;
                        found = true;
                        break;
                    }
                }
                if (!found && perf !== '') counts['Outros']++;
            });

            // Conta completude de dados
            if (p.cpf_provisorio === true) dadosCounts['Com CPF provisório']++;
            else if (p.cpf_cnpj && p.cpf_cnpj.trim() !== '') dadosCounts['Com CPF']++;

            if (p.celular && p.celular.trim() !== '') dadosCounts['Com celular']++; else dadosCounts['Sem celular']++;
            if (p.data_nascimento && p.data_nascimento.trim() !== '') dadosCounts['Com data Nascimento']++; else dadosCounts['Sem data Nascimento']++;
            if (p.email && p.email.trim() !== '') dadosCounts['Com E-mail']++; else dadosCounts['Sem E-mail']++;
            if (p.foto_url && p.foto_url.trim() !== '') dadosCounts['Com foto Perfil']++; else dadosCounts['Sem foto Perfil']++;
            if (p.sexo && p.sexo.trim() !== '') dadosCounts['Com Sexo']++; else dadosCounts['Sem Sexo']++;
            if (p.estado_civil && p.estado_civil.trim() !== '') dadosCounts['Com Estado Civil']++; else dadosCounts['Sem Estado Civil']++;
        });

        // Renderizar Perfis
        const renderCard = (title, val, color) => `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 16px; border-left: 4px solid ${color};">
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 8px;">${title}</div>
                <div style="font-size: 24px; font-weight: 700; color: var(--text-main);">${val}</div>
            </div>
        `;
        
        let htmlPerfis = renderCard('Total de Pessoas', counts.Total, '#818cf8');
        htmlPerfis += renderCard('Pessoas Físicas', counts.Fisica, '#34d399');
        htmlPerfis += renderCard('Pessoas Jurídicas', counts.Juridica, '#fbbf24');
        
        perfisTarget.forEach(pt => {
            if (counts[pt] > 0 || pt === 'Associado Efetivo') { // Mostra mesmo se for 0 para chaves principais
                htmlPerfis += renderCard(pt, counts[pt], 'var(--border)');
            }
        });
        document.getElementById(`dash-${targetIdPrefix}-perfil-container`).innerHTML = htmlPerfis;

        // Renderizar Dados
        let htmlDados = renderCard('Total de Pessoas', counts.Total, '#818cf8');
        Object.keys(dadosCounts).forEach(k => {
            let color = k.startsWith('Com ') && !k.includes('provisório') ? '#10b981' : (k.startsWith('Sem ') ? '#ef4444' : '#f59e0b');
            htmlDados += renderCard(k, dadosCounts[k], color);
        });
        document.getElementById(`dash-${targetIdPrefix}-dados-container`).innerHTML = htmlDados;
    };

    // Processa Pessoas Globais
    processDashboard(pessoas, 'pessoas');

    // Processa apenas Associados
    const associados = pessoas.filter(p => {
        if (!p.perfis) return false;
        const perfisStr = Array.isArray(p.perfis) ? p.perfis.join(',') : p.perfis;
        return perfisStr.includes('Associado Efetivo') || perfisStr.includes('Associado Proponente');
    });
    processDashboard(associados, 'associados');
}



async function carregarDashboardsHome() {
    const container = document.getElementById('homeDashContainer');
    if (!container) return;
    
    try {
        // Fetch Celular
        const { data: celData } = await db.from('app_admin_celular_creditos').select('*').order('data_adicionado', { ascending: false }).limit(1);
        
        // Fetch Pessoas Counts
        // Em um cenário real, contagens grandes devem ser feitas via RPC. Como temos poucas, podemos baixar ou usar contagem agregada.
        // Vamos baixar os IDs e Perfis para ser rápido e poupar dados
        const { data: pessoasData } = await db.from('pessoas').select('tipo_pessoa, perfis');
        
        let celularHtml = '';
        if (celData && celData.length > 0) {
            const ultimo = celData[0];
            const dtAdic = new Date(ultimo.data_adicionado + 'T12:00:00Z');
            const dtVenc = new Date(dtAdic);
            dtVenc.setDate(dtVenc.getDate() + ultimo.prazo_dias);
            
            const hoje = new Date();
            const diffTime = dtVenc - hoje;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let corStatus = '#10b981'; // verde
            let iconStatus = '🟢';
            if (diffDays <= 15) { corStatus = '#f59e0b'; iconStatus = '🟡'; }
            if (diffDays <= 3) { corStatus = '#ef4444'; iconStatus = '🔴'; }
            if (diffDays < 0) { corStatus = '#991b1b'; iconStatus = '❌'; }
            
            celularHtml = `
            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); border: 1px solid var(--border); border-radius: 16px; padding: 20px; border-top: 4px solid ${corStatus}; display: flex; flex-direction: column; gap: 8px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'" onclick="switchTab('celular')">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 13px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">📱 Celular (Vivo)</div>
                    <div style="font-size: 16px;" title="Status">${iconStatus}</div>
                </div>
                <div style="font-size: 28px; font-weight: 800; color: var(--text-main); line-height: 1.1;">
                    ${diffDays >= 0 ? diffDays : Math.abs(diffDays)} <span style="font-size: 14px; font-weight: 500; color: var(--text-muted);">${diffDays >= 0 ? 'dias restantes' : 'dias vencidos'}</span>
                </div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: auto; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05);">
                    Vence em: <b>${dtVenc.toLocaleDateString('pt-BR')}</b>
                </div>
            </div>
            `;
        } else {
            celularHtml = `
            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); border: 1px solid var(--border); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; justify-content: center; align-items: center; cursor: pointer;" onclick="switchTab('celular')">
                <div style="font-size: 24px; margin-bottom: 8px;">📱</div>
                <div style="font-size: 14px; color: var(--text-muted);">Nenhum crédito registrado</div>
            </div>
            `;
        }
        
        let pf = 0, pj = 0, assoc = 0, total = 0;
        if (pessoasData) {
            total = pessoasData.length;
            pessoasData.forEach(p => {
                if (p.tipo_pessoa === 'Jurídica') pj++;
                else pf++;
                
                let perfis = '';
                if (Array.isArray(p.perfis)) perfis = p.perfis.join(',');
                else if (p.perfis) perfis = String(p.perfis);
                
                if (perfis.includes('Associado Efetivo')) assoc++;
            });
        }
        
        const renderMetricCard = (icon, title, val, color) => `
            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); border: 1px solid var(--border); border-radius: 16px; padding: 20px; border-top: 4px solid ${color}; display: flex; flex-direction: column; gap: 8px; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="font-size: 20px; background: rgba(255,255,255,0.05); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">${icon}</div>
                    <div style="font-size: 13px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">${title}</div>
                </div>
                <div style="font-size: 32px; font-weight: 800; color: var(--text-main); margin-top: 8px; line-height: 1;">
                    ${val}
                </div>
            </div>
        `;
        
        let html = '';
        html += celularHtml;
        html += renderMetricCard('🤝', 'Associados Efetivos', assoc, '#8b5cf6');
        html += renderMetricCard('👤', 'Pessoas Físicas', pf, '#3b82f6');
        html += renderMetricCard('🏢', 'Pessoas Jurídicas', pj, '#f59e0b');
        html += renderMetricCard('👥', 'Total na Base', total, '#10b981');
        
        container.innerHTML = html;
        
    } catch (e) {
        console.error("Erro dashboard home", e);
        container.innerHTML = '<div style="color:red;">Erro ao carregar painel inicial.</div>';
    }
}


// ==========================================
// MÓDULO: MENSALIDADES (Associados Efetivos)
// ==========================================

let associadosCache = [];
let configMensCache = [];

async function carregarAssociadosMensalidades() {
    const { data: pessoas, error } = await db.from('pessoas').select('id, cpf_cnpj, nome_completo, perfis');
    if (error) {
        console.error("Erro ao carregar pessoas para mensalidades:", error);
        return;
    }

    associadosCache = pessoas.filter(p => {
        if (!p.perfis) return false;
        const perfisStr = Array.isArray(p.perfis) ? p.perfis.join(',') : p.perfis;
        return perfisStr.includes('Associado Efetivo');
    });
    
    associadosCache.sort((a, b) => (a.nome_completo || '').localeCompare(b.nome_completo || ''));

    const sel = document.getElementById('mensalidadeAssociado');
    if (sel) {
        sel.innerHTML = '<option value="">Selecione um associado...</option>';
        associadosCache.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.cpf_cnpj;
            opt.textContent = a.nome_completo;
            sel.appendChild(opt);
        });
        
        sel.addEventListener('change', () => {
            const cpf = sel.value;
            const cfg = configMensCache.find(c => c.cpf_cnpj === cpf);
            if (cfg) {
                document.getElementById('mensalidadeValor').value = cfg.valor || '';
                document.getElementById('mensalidadeDia').value = cfg.dia_vencimento || '';
                document.getElementById('mensalidadeInicio').value = cfg.inicio_mm_aaaa || '';
            } else {
                document.getElementById('mensalidadeValor').value = '';
                document.getElementById('mensalidadeDia').value = '';
                document.getElementById('mensalidadeInicio').value = '';
            }
        });
    }

    await carregarTabelaMensalidades();
}

async function carregarTabelaMensalidades() {
    const { data: configs, error } = await db.from('fin_config_mensalidades').select('*');
    if (error) {
        console.error("Erro ao carregar configs de mensalidades:", error);
        return;
    }
    
    configMensCache = configs || [];
    
    const tbody = document.getElementById('tabelaMensalidadesConfig');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (associadosCache.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding: 16px; text-align: center; color: var(--text-muted);">Nenhum associado efetivo encontrado.</td></tr>`;
        return;
    }

    // Apenas renderizamos os associados que têm configuração? O usuário quer "aquelas informações".
    // Vamos listar apenas quem tem config para a tabela não ficar enorme de vazios, ou listar todos.
    // Vamos listar todos os associados efetivos.
    associadosCache.forEach(assoc => {
        const cfg = configMensCache.find(c => c.cpf_cnpj === assoc.cpf_cnpj);
        const hasCfg = !!cfg;
        
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        
        tr.innerHTML = `
            <td style="padding: 12px 16px;">${assoc.nome_completo}</td>
            <td style="padding: 12px 16px; color: ${hasCfg ? '#34d399' : 'var(--text-muted)'};">${hasCfg ? 'R$ ' + Number(cfg.valor).toFixed(2).replace('.',',') : 'Não Configurado'}</td>
            <td style="padding: 12px 16px;">${hasCfg ? cfg.dia_vencimento : '-'}</td>
            <td style="padding: 12px 16px;">${hasCfg ? cfg.inicio_mm_aaaa : '-'}</td>
            <td style="padding: 12px 16px;">
                <button onclick="editarConfigMensalidade('${assoc.cpf_cnpj}')" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 4px; padding: 4px 8px; cursor: pointer;">Editar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.editarConfigMensalidade = function(cpf) {
    const sel = document.getElementById('mensalidadeAssociado');
    if (sel) {
        sel.value = cpf;
        sel.dispatchEvent(new Event('change'));
        sel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
};

window.salvarConfigMensalidade = async function() {
    const cpf = document.getElementById('mensalidadeAssociado').value;
    const valorStr = document.getElementById('mensalidadeValor').value;
    const dia = document.getElementById('mensalidadeDia').value;
    const inicio = document.getElementById('mensalidadeInicio').value;

    if (!cpf) {
        alert("Selecione um associado!");
        return;
    }
    if (!valorStr || !dia || !inicio) {
        alert("Preencha todos os campos da configuração!");
        return;
    }

    const payload = {
        cpf_cnpj: cpf,
        valor: parseFloat(valorStr),
        dia_vencimento: parseInt(dia),
        inicio_mm_aaaa: inicio
    };

    const btn = event.target;
    btn.innerText = 'Salvando...';

    const { error } = await db.from('fin_config_mensalidades').upsert(payload, { onConflict: 'cpf_cnpj' });

    if (error) {
        alert("Erro ao salvar configuração: " + error.message);
        btn.innerText = 'Salvar Configuração';
    } else {
        btn.innerText = 'Salvo!';
        btn.style.background = '#10b981';
        
        setTimeout(() => {
            btn.innerText = 'Salvar Configuração';
            btn.style.background = '';
        }, 2000);
        
        carregarTabelaMensalidades();
    }
};


// ==========================================
// MÓDULO: DEPARTAMENTOS E ATIVIDADES (Equipe Plana)
// ==========================================

let currentEstruturaId = null;
let currentEstruturaNome = "";

async function carregarDashboardsDepartamentosEAtividades() {
    const { data: estruturas, error: errEst } = await db.from('estruturas').select('id, nome, tipo').order('nome');
    const { data: vinculos, error: errVinc } = await db.from('vinculos_estrutura').select('estrutura_id');
    
    if (errEst || errVinc) {
        console.error("Erro ao carregar estruturas/vinculos:", errEst, errVinc);
        return;
    }
    
    // Contagem
    const contagem = {};
    vinculos.forEach(v => {
        contagem[v.estrutura_id] = (contagem[v.estrutura_id] || 0) + 1;
    });
    
    const gridDept = document.getElementById('gridDepartamentos');
    const gridAtiv = document.getElementById('gridAtividades');
    
    if (gridDept) gridDept.innerHTML = '';
    if (gridAtiv) gridAtiv.innerHTML = '';
    
    estruturas.forEach(est => {
        const qtd = contagem[est.id] || 0;
        const icon = est.tipo === 'Departamento' ? '🏢' : '📅';
        const color = est.tipo === 'Departamento' ? '#3b82f6' : '#8b5cf6';
        
        const card = document.createElement('div');
        card.style.cssText = `background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); border: 1px solid var(--border); border-radius: 12px; padding: 20px; border-left: 4px solid ${color}; cursor: pointer; transition: transform 0.2s; display: flex; flex-direction: column; gap: 12px;`;
        card.onmouseover = () => card.style.transform = 'translateY(-2px)';
        card.onmouseout = () => card.style.transform = 'translateY(0)';
        card.onclick = () => abrirModalEquipePlana(est.id, est.nome, est.tipo);
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="font-size: 24px;">${icon}</div>
                <div style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${qtd} membros</div>
            </div>
            <div style="font-size: 16px; font-weight: 600; color: var(--text-main);">${est.nome}</div>
            <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-top: auto;">${est.tipo}</div>
        `;
        
        if (est.tipo === 'Departamento' || est.tipo === 'Administrativo') {
            if (gridDept) gridDept.appendChild(card);
        } else {
            if (gridAtiv) gridAtiv.appendChild(card);
        }
    });
    
    if (gridDept && gridDept.children.length === 0) gridDept.innerHTML = '<div style="color:var(--text-muted);">Nenhum departamento cadastrado.</div>';
    if (gridAtiv && gridAtiv.children.length === 0) gridAtiv.innerHTML = '<div style="color:var(--text-muted);">Nenhuma atividade cadastrada.</div>';
    
    inicializarBuscaPessoasEquipe();
}

// Inicializa a busca de pessoas (Autocompletar)
let pessoasBuscaCache = [];
async function inicializarBuscaPessoasEquipe() {
    const input = document.getElementById('eqBuscaPessoa');
    const sugestoes = document.getElementById('eqSugestoes');
    if (!input) return;
    
    if (pessoasBuscaCache.length === 0) {
        const { data } = await db.from('pessoas').select('id, nome_completo, nome_curto, perfis');
        if (data) pessoasBuscaCache = data;
    }
    
    input.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        if (val.length < 2) {
            sugestoes.style.display = 'none';
            return;
        }
        
        const filter = pessoasBuscaCache.filter(p => {
            if (!p.nome_completo || !p.nome_completo.toLowerCase().includes(val)) return false;
            let arr = [];
            if (Array.isArray(p.perfis)) arr = p.perfis;
            else if (typeof p.perfis === 'string') arr = p.perfis.split(',').map(s=>s.trim());
            if (arr.includes('Outros')) return false;
            return true;
        }).slice(0, 8);
        
        if (filter.length > 0) {
            sugestoes.innerHTML = '';
            filter.forEach(p => {
                const div = document.createElement('div');
                div.style.padding = '8px 12px';
                div.style.cursor = 'pointer';
                div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                div.textContent = p.nome_curto || p.nome_completo;
                div.onmouseover = () => div.style.background = 'rgba(255,255,255,0.1)';
                div.onmouseout = () => div.style.background = 'transparent';
                div.onclick = () => {
                    input.value = p.nome_curto || p.nome_completo;
                    document.getElementById('eqPessoaId').value = p.id;
                    sugestoes.style.display = 'none';
                    
                    // Atualiza o datalist com os perfis da pessoa
                    const list = document.getElementById('listaPapeisComuns');
                    if (list) {
                        list.innerHTML = '';
                        let arr = [];
                        if (Array.isArray(p.perfis)) {
                            arr = p.perfis;
                        } else if (typeof p.perfis === 'string') {
                            arr = p.perfis.split(',').map(s => s.trim());
                        }
                        arr.forEach(perf => {
                            if (perf) {
                                const opt = document.createElement('option');
                                opt.value = perf;
                                list.appendChild(opt);
                            }
                        });
                        
                        // Limpar o input se ele não estiver na nova lista
                        const eqPapel = document.getElementById('eqPapel');
                        if (eqPapel) eqPapel.value = '';
                    }
                };
                sugestoes.appendChild(div);
            });
            sugestoes.style.display = 'block';
        } else {
            sugestoes.style.display = 'none';
        }
    });
    
    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== sugestoes) {
            sugestoes.style.display = 'none';
        }
    });
}



window.abrirModalEquipePlana = async function(id, nome, tipo) {

    currentEstruturaId = id;
    currentEstruturaNome = nome;
    
    document.getElementById('modalEquipePlanaTitle').textContent = `Equipe: ${nome}`;
    document.getElementById('modalEquipePlanaSub').textContent = `Gerenciando estrutura tipo: ${tipo}`;
    
    document.getElementById('modalEquipePlana').style.display = 'flex';
    document.getElementById('eqBuscaPessoa').value = '';
    document.getElementById('eqPessoaId').value = '';
    document.getElementById('eqPapel').value = '';
    const list = document.getElementById('listaPapeisComuns');
    if (list) list.innerHTML = '';
    
    await carregarListaMembrosPlana();
};

window.fecharModalEquipePlana = function() {
    document.getElementById('modalEquipePlana').style.display = 'none';
    carregarDashboardsDepartamentosEAtividades(); // Refresh counters
};

async function carregarListaMembrosPlana() {
    const tbody = document.getElementById('eqListaMembros');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:16px;">Carregando...</td></tr>';
    
    const { data, error } = await db.from('vinculos_estrutura').select('id, perfil, parent_vinculo_id, pessoas(nome_completo, nome_curto)').eq('estrutura_id', currentEstruturaId);
    if (error) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#ef4444;">Erro ao carregar equipe.</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-muted); padding:16px;">Ninguém nesta equipe ainda.</td></tr>';
        return;
    }
    
    // Sort by role then name
    data.sort((a, b) => {
        const pA = (a.perfil || '').toLowerCase();
        const pB = (b.perfil || '').toLowerCase();
        if (pA.includes('diretor') && !pB.includes('diretor')) return -1;
        if (pB.includes('diretor') && !pA.includes('diretor')) return 1;
        const nA = a.pessoas ? a.pessoas.nome_completo : '';
        const nB = b.pessoas ? b.pessoas.nome_completo : '';
        return nA.localeCompare(nB);
    });
    
    
    // Atualizar dropdown "Responde a"
    const selResponde = document.getElementById('eqRespondeA');
    if (selResponde) {
        selResponde.innerHTML = '<option value="">Ninguém (Nó Principal)</option>';
        data.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.id; // o id do vinculo!
            opt.textContent = v.pessoas ? (v.pessoas.nome_curto || v.pessoas.nome_completo) : 'Desconhecido';
            selResponde.appendChild(opt);
        });
    }

    data.forEach(v => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        
        const parent = v.parent_vinculo_id ? data.find(x => x.id === v.parent_vinculo_id) : null;
        const parentName = parent && parent.pessoas ? (parent.pessoas.nome_curto || parent.pessoas.nome_completo) : '-';
        
        tr.innerHTML = `
            <td style="padding: 10px 8px; color: var(--text-main); font-weight: 500;">${v.pessoas ? (v.pessoas.nome_curto || v.pessoas.nome_completo) : 'Desconhecido'}</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">
                <input type="text" value="${v.perfil || ''}" class="form-control" style="background:transparent; border:1px dashed rgba(255,255,255,0.2); height: 28px; width: 140px; font-size: 12px;" onchange="atualizarPapelEquipePlana('${v.id}', this.value)" title="Edite e aperte ENTER">
            </td>
            <td style="padding: 10px 8px; color: var(--text-muted); font-size: 12px;">${parentName}</td>
            <td style="padding: 10px 8px; text-align: right;">
                <button onclick="removerMembroEquipePlana('${v.id}')" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">Remover</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.adicionarMembroEquipePlana = async function() {
    const pessoaId = document.getElementById('eqPessoaId').value;
    const pessoaNome = document.getElementById('eqBuscaPessoa').value;
    const papel = document.getElementById('eqPapel').value;
    
    if (!pessoaId) {
        alert("Por favor, busque e selecione uma pessoa da lista.");
        return;
    }
    
    try {

        const respondeA = document.getElementById('eqRespondeA').value || null;
        const { error } = await db.from('vinculos_estrutura').insert({
            estrutura_id: currentEstruturaId,
            pessoa_id: pessoaId,
            perfil: papel,
            parent_vinculo_id: respondeA
        });
        if (error) throw error;
        
        document.getElementById('eqBuscaPessoa').value = '';
        document.getElementById('eqPessoaId').value = '';
        document.getElementById('eqPapel').value = '';
        
        await carregarListaMembrosPlana();
    } catch(e) {
        console.error(e);
        alert("Erro ao adicionar: " + e.message);
    }
};

window.removerMembroEquipePlana = async function(vinculoId) {
    if (!confirm("Remover este membro da equipe?")) return;
    
    try {
        // Logica segura do organograma aplicada: orfanar filhos para previnir cascade delete failure
        const { data: v } = await db.from('vinculos_estrutura').select('parent_vinculo_id').eq('id', vinculoId).single();
        const pId = v ? v.parent_vinculo_id : null;
        await db.from('vinculos_estrutura').update({ parent_vinculo_id: pId }).eq('parent_vinculo_id', vinculoId);
        
        const { error } = await db.from('vinculos_estrutura').delete().eq('id', vinculoId);
        if (error) throw error;
        
        await carregarListaMembrosPlana();
    } catch(e) {
        console.error(e);
        alert("Erro ao remover: " + e.message);
    }
};

window.atualizarPapelEquipePlana = async function(vinculoId, novoPapel) {
    try {
        const { error } = await db.from('vinculos_estrutura').update({ perfil: novoPapel }).eq('id', vinculoId);
        if (error) throw error;
    } catch(e) {
        console.error(e);
        alert("Erro ao atualizar papel.");
    }
};

window.carregarTabelaListaAssociados = async function() {
    const tbody = document.getElementById('tbodyListaPessoas');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Carregando...</td></tr>';
    
    const filtroEl = document.getElementById('filtroListaPessoas');
    const filtro = filtroEl ? filtroEl.value : 'associados';
    
    let query = db.from('pessoas').select('cpf_cnpj, nome_completo, nome_curto, celular, email, data_nascimento, sexo, perfis').order('nome_completo');
    
    const { data, error } = await query;
    if (error) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#ef4444;">Erro ao carregar lista.</td></tr>';
        return;
    }
    
    let filtrados = data;
    if (filtro === 'associados') {
        filtrados = data.filter(p => {
            if (!p.perfis) return false;
            const perfStr = Array.isArray(p.perfis) ? p.perfis.join(',') : p.perfis;
            return perfStr.includes('Associado Efetivo');
        });
    }
    
    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Nenhum registro encontrado.</td></tr>';
        return;
    }
    
    window.pessoasListaCacheParaImpressao = filtrados;
    
    tbody.innerHTML = '';
    filtrados.forEach(p => {
        let idade = '-';
        if (p.data_nascimento) {
            const birth = new Date(p.data_nascimento);
            const diff = Date.now() - birth.getTime();
            const ageDate = new Date(diff); 
            idade = Math.abs(ageDate.getUTCFullYear() - 1970) + ' anos';
        }
        
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        tr.innerHTML = `
            <td style="padding: 10px 8px; color: var(--text-main); font-family: monospace;">${formatCpf(p.cpf_cnpj)}</td>
            <td style="padding: 10px 8px;">
                <div style="color: var(--text-main); font-weight: 500;">${p.nome_completo || '-'}</div>
                <div style="color: var(--text-muted); font-size: 11px;">${p.nome_curto || '-'}</div>
            </td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${formatCel(p.celular)}</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${p.email || '-'}</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${p.data_nascimento ? new Date(p.data_nascimento).toLocaleDateString('pt-BR') : '-'} (${idade})</td>
            <td style="padding: 10px 8px; color: var(--text-muted);">${p.sexo || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
};

window.imprimirListaPessoas = function() {
    const data = window.pessoasListaCacheParaImpressao || [];
    if (data.length === 0) {
        alert("Não há dados para imprimir.");
        return;
    }
    
    let html = `
    <html>
    <head>
        <title>Relatório de Associados - SELA</title>
        <style>
            body { font-family: sans-serif; color: #333; margin: 20px; }
            h2 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            @media print {
                @page { margin: 1cm; size: landscape; }
                body { margin: 0; }
            }
        </style>
    </head>
    <body>
        <h2>Lista de Associados - SELA (${data.length} registros)</h2>
        <table>
            <thead>
                <tr>
                    <th>CPF</th>
                    <th>Nome Completo</th>
                    <th>Nome Curto</th>
                    <th>Celular</th>
                    <th>E-mail</th>
                    <th>Nascimento</th>
                    <th>Idade</th>
                    <th>Sexo</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    data.forEach(p => {
        let idade = '-';
        let dt = '-';
        if (p.data_nascimento) {
            const birth = new Date(p.data_nascimento);
            const diff = Date.now() - birth.getTime();
            const ageDate = new Date(diff); 
            idade = Math.abs(ageDate.getUTCFullYear() - 1970);
            dt = birth.toLocaleDateString('pt-BR');
        }
        
        html += `
            <tr>
                <td>${formatCpf(p.cpf_cnpj)}</td>
                <td>${p.nome_completo || ''}</td>
                <td>${p.nome_curto || ''}</td>
                <td>${formatCel(p.celular)}</td>
                <td>${p.email || ''}</td>
                <td>${dt}</td>
                <td>${idade}</td>
                <td>${p.sexo || ''}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
        <script>
            window.onload = function() { window.print(); }
        </script>
    </body>
    </html>
    `;
    
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
};
