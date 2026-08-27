
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
    
    if (tabId === 'bd') {
        if (typeof window.carregarEstatisticasBD === 'function') {
            window.carregarEstatisticasBD();
        }
        if (typeof window.carregarUsuariosAutorizados === 'function') {
            window.carregarUsuariosAutorizados();
        }
    } else if (tabId === 'miniapps') {
        if (typeof window.carregarEstatisticasMiniAppIrradiacao === 'function') {
            window.carregarEstatisticasMiniAppIrradiacao();
        }
        if (typeof window.carregarEstatisticasMiniAppAtendimento === 'function') {
            window.carregarEstatisticasMiniAppAtendimento();
        }
    }
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
    const tabs = ['perfil', 'dados', 'lista', 'cards', 'miniapps', 'irradiacao', 'tabelas', 'usuarios', 'atendimento'];
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
    if (targetEl) targetEl.style.display = tabName === 'lista' ? 'flex' : 'block';
    
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
        } else if (target === 'departamentos' && typeof window.carregarTabelaListaDepartamentos === 'function') {
            window.carregarTabelaListaDepartamentos();
        } else if (target === 'atividades' && typeof window.carregarTabelaListaAtividades === 'function') {
            window.carregarTabelaListaAtividades();
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
        
        const { data: estData } = await db.from('estruturas').select('tipo');
        let countDept = 0, countAtiv = 0;
        if (estData) {
            estData.forEach(e => {
                if (e.tipo === 'Departamento' || e.tipo === 'Administrativo') countDept++;
                if (e.tipo === 'Atividade') countAtiv++;
            });
        }
        
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
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="font-size: 20px; background: rgba(255,255,255,0.05); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">📱</div>
                        <div style="font-size: 13px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Celular (Vivo)</div>
                    </div>
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
        
        // Departamentos and Atividades
        html += `
            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); border: 1px solid var(--border); border-radius: 16px; padding: 20px; border-top: 4px solid #3b82f6; display: flex; flex-direction: column; gap: 8px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'" onclick="switchTab('departamentos')">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="font-size: 20px; background: rgba(255,255,255,0.05); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">🏢</div>
                    <div style="font-size: 13px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Departamentos</div>
                </div>
                <div style="font-size: 32px; font-weight: 800; color: var(--text-main); margin-top: 8px; line-height: 1;">
                    ${countDept}
                </div>
            </div>
        `;
        html += `
            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); border: 1px solid var(--border); border-radius: 16px; padding: 20px; border-top: 4px solid #8b5cf6; display: flex; flex-direction: column; gap: 8px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'" onclick="switchTab('atividades')">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="font-size: 20px; background: rgba(255,255,255,0.05); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">📅</div>
                    <div style="font-size: 13px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Atividades Regulares</div>
                </div>
                <div style="font-size: 32px; font-weight: 800; color: var(--text-main); margin-top: 8px; line-height: 1;">
                    ${countAtiv}
                </div>
            </div>
        `;
        
        // Custom card for Banco de Dados
        html += `
            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); border: 1px solid var(--border); border-radius: 16px; padding: 20px; border-top: 4px solid #ec4899; display: flex; flex-direction: column; gap: 8px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'" onclick="switchTab('bd')">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="font-size: 20px; background: rgba(255,255,255,0.05); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">🗄️</div>
                    <div style="font-size: 13px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Tabelas (Supabase)</div>
                </div>
                <div style="font-size: 32px; font-weight: 800; color: var(--text-main); margin-top: 8px; line-height: 1;">
                    34
                </div>
            </div>
        `;
        
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

window.carregarTabelaListaGlobalPessoas = async function() {
    const tbody = document.getElementById('tbodyListaGlobalPessoas');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Carregando...</td></tr>';
    
    const select = document.getElementById('filtroListaGlobalPessoas');
    if (select && select.options.length <= 8) {
        try {
            const { data } = await db.from('configuracoes').select('valor').eq('chave', 'perfis_pessoas').single();
            if (data && data.valor) {
                const perfis = data.valor.split(',').map(s => s.trim()).filter(Boolean);
                const currentVal = select.value;
                select.innerHTML = '<option value="todos">Todos</option>';
                perfis.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p;
                    opt.textContent = p;
                    select.appendChild(opt);
                });
                select.value = currentVal;
            }
        } catch(e) { console.error('Erro ao buscar perfis:', e); }
    }
    
    const filtro = select ? select.value : 'todos';
    let query = db.from('pessoas').select('cpf_cnpj, nome_completo, nome_curto, celular, email, data_nascimento, sexo, perfis').order('nome_completo');
    
    const { data, error } = await query;
    if (error) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#ef4444;">Erro ao carregar lista.</td></tr>';
        return;
    }
    
    let filtrados = data;
    if (filtro !== 'todos') {
        filtrados = data.filter(p => {
            if (!p.perfis) return false;
            const perfStr = Array.isArray(p.perfis) ? p.perfis.join(',') : p.perfis;
            return perfStr.includes(filtro);
        });
    }
    
    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Nenhum registro encontrado.</td></tr>';
        return;
    }
    
    window.pessoasGlobalListaCacheParaImpressao = filtrados;
    window.pessoasGlobalListaFiltroAtual = filtro;
    
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

window.imprimirListaGlobalPessoas = function() {
    const data = window.pessoasGlobalListaCacheParaImpressao || [];
    if (data.length === 0) {
        alert("Não há dados para imprimir.");
        return;
    }
    const filtroStr = (window.pessoasGlobalListaFiltroAtual === 'todos') ? 'Todas as Pessoas' : window.pessoasGlobalListaFiltroAtual;
    
    let html = `
    <html>
    <head>
        <title>Relatório de Pessoas - SELA</title>
        <style>
            body { font-family: sans-serif; color: #333; margin: 20px; }
            h2 { text-align: center; margin-bottom: 20px; }
            h4 { text-align: center; margin-bottom: 20px; color: #666; font-weight: normal; }
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
        <h2>Lista de Pessoas - SELA</h2>
        <h4>Filtro: ${filtroStr} (${data.length} registros)</h4>
        <table>
            <thead>
                <tr>
                    <th>CPF/CNPJ</th>
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


window.carregarTabelaListaDepartamentos = async function() {
    const tbody = document.getElementById('tbodyListaDepartamentos');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Carregando...</td></tr>';
    
    const select = document.getElementById('filtroListaDepartamentos');
    if (select && select.options.length <= 1) {
        try {
            const { data } = await db.from('estruturas').select('id, nome').in('tipo', ['Departamento', 'Administrativo']).order('nome');
            if (data) {
                const currentVal = select.value;
                select.innerHTML = '<option value="todos">Todos os Departamentos</option>';
                data.forEach(est => {
                    const opt = document.createElement('option');
                    opt.value = est.id;
                    opt.textContent = est.nome;
                    select.appendChild(opt);
                });
                select.value = currentVal;
            }
        } catch(e) {}
    }
    
    const filtroId = select ? select.value : 'todos';
    
    let query = db.from('vinculos_estrutura').select(`
        perfil,
        estrutura_id, 
        estruturas(id, nome, tipo),
        pessoas(cpf_cnpj, nome_completo, nome_curto, celular, email, data_nascimento, sexo)
    `);
    
    const { data, error } = await query;
    if (error) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ef4444;">Erro ao carregar lista.</td></tr>';
        return;
    }
    
    let filtrados = data.filter(v => v.estruturas && (v.estruturas.tipo === 'Departamento' || v.estruturas.tipo === 'Administrativo') && v.pessoas);
    if (filtroId !== 'todos') {
        filtrados = filtrados.filter(v => String(v.estrutura_id) === String(filtroId));
    }
    
    filtrados.sort((a, b) => (a.pessoas.nome_completo || '').localeCompare(b.pessoas.nome_completo || ''));
    
    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">Nenhum registro encontrado.</td></tr>';
        return;
    }
    
    window.deptListaCacheParaImpressao = filtrados;
    window.deptListaFiltroAtual = select && select.options[select.selectedIndex] ? select.options[select.selectedIndex].textContent : 'Todos os Departamentos';
    
    tbody.innerHTML = '';
    filtrados.forEach(v => {
        const p = v.pessoas;
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
            <td style="padding: 10px 8px; color: var(--text-main); font-weight: 600;">${v.perfil || '-'}</td>
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

window.imprimirListaDepartamentos = function() {
    const data = window.deptListaCacheParaImpressao || [];
    if (data.length === 0) {
        alert("Não há dados para imprimir.");
        return;
    }
    const filtroStr = window.deptListaFiltroAtual || 'Todos os Departamentos';
    
    let html = `
    <html>
    <head>
        <title>Relatório de Departamentos - SELA</title>
        <style>
            body { font-family: sans-serif; color: #333; margin: 20px; }
            h2 { text-align: center; margin-bottom: 20px; }
            h4 { text-align: center; margin-bottom: 20px; color: #666; font-weight: normal; }
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
        <h2>Lista de Membros por Departamento - SELA</h2>
        <h4>Filtro: ${filtroStr} (${data.length} registros)</h4>
        <table>
            <thead>
                <tr>
                    <th>CPF/CNPJ</th>
                    <th>Perfil</th>
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
    
    data.forEach(v => {
        const p = v.pessoas;
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
                <td>${v.perfil || ''}</td>
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

window.carregarTabelaListaAtividades = async function() {
    const tbody = document.getElementById('tbodyListaAtividades');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Carregando...</td></tr>';
    
    const select = document.getElementById('filtroListaAtividades');
    if (select && select.options.length <= 1) {
        try {
            const { data } = await db.from('estruturas').select('id, nome').eq('tipo', 'Atividade').order('nome');
            if (data) {
                const currentVal = select.value;
                select.innerHTML = '<option value="todos">Todas as Atividades</option>';
                data.forEach(est => {
                    const opt = document.createElement('option');
                    opt.value = est.id;
                    opt.textContent = est.nome;
                    select.appendChild(opt);
                });
                select.value = currentVal;
            }
        } catch(e) {}
    }
    
    const filtroId = select ? select.value : 'todos';
    
    let query = db.from('vinculos_estrutura').select(`
        perfil,
        estrutura_id, 
        estruturas(id, nome, tipo),
        pessoas(cpf_cnpj, nome_completo, nome_curto, celular, email, data_nascimento, sexo)
    `);
    
    const { data, error } = await query;
    if (error) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ef4444;">Erro ao carregar lista.</td></tr>';
        return;
    }
    
    let filtrados = data.filter(v => v.estruturas && v.estruturas.tipo === 'Atividade' && v.pessoas);
    if (filtroId !== 'todos') {
        filtrados = filtrados.filter(v => String(v.estrutura_id) === String(filtroId));
    }
    
    filtrados.sort((a, b) => (a.pessoas.nome_completo || '').localeCompare(b.pessoas.nome_completo || ''));
    
    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">Nenhum registro encontrado.</td></tr>';
        return;
    }
    
    window.ativListaCacheParaImpressao = filtrados;
    window.ativListaFiltroAtual = select && select.options[select.selectedIndex] ? select.options[select.selectedIndex].textContent : 'Todas as Atividades';
    
    tbody.innerHTML = '';
    filtrados.forEach(v => {
        const p = v.pessoas;
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
            <td style="padding: 10px 8px; color: var(--text-main); font-weight: 600;">${v.perfil || '-'}</td>
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

window.imprimirListaAtividades = function() {
    const data = window.ativListaCacheParaImpressao || [];
    if (data.length === 0) {
        alert("Não há dados para imprimir.");
        return;
    }
    const filtroStr = window.ativListaFiltroAtual || 'Todas as Atividades';
    
    let html = `
    <html>
    <head>
        <title>Relatório de Atividades - SELA</title>
        <style>
            body { font-family: sans-serif; color: #333; margin: 20px; }
            h2 { text-align: center; margin-bottom: 20px; }
            h4 { text-align: center; margin-bottom: 20px; color: #666; font-weight: normal; }
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
        <h2>Lista de Membros por Atividade - SELA</h2>
        <h4>Filtro: ${filtroStr} (${data.length} registros)</h4>
        <table>
            <thead>
                <tr>
                    <th>CPF/CNPJ</th>
                    <th>Perfil</th>
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
    
    data.forEach(v => {
        const p = v.pessoas;
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
                <td>${v.perfil || ''}</td>
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


window.carregarEstatisticasBD = async function() {
    const grid = document.getElementById('gridBancoDados');
    if (!grid) return;
    
    grid.innerHTML = '<div style="color: var(--text-muted); grid-column: 1 / -1; text-align: center; padding: 40px;">Contando registros...</div>';
    
    const tables = [
        "agenda", "app_admin_celular_creditos", "app_atendimento_fraterno", "app_atendimento_presencas",
        "app_atendimento_sessoes", "app_atendimento_tratamentos", "app_irradiacao_solicitacoes", 
        "app_mensagem_luz", "app_pacientes", "app_pagina_luz", "app_tesouraria_envios",
        "ass_cesta_composicao", "ass_cestas_modelos", "ass_entregas", "ass_familias", 
        "ass_itens_cesta", "ass_membros_familia", "ass_metas", "ass_ocorrencias", 
        "ass_planejamento_mes", "atividades_regulares", "configuracoes", "documentos", 
        "documentos_visibilidade", "emprestimos_portal", "estruturas", "fin_config_mensalidades", 
        "livros_catalogo", "pessoas", "posts", "projetos_processos", "reservas_site", 
        "usuario_atalhos", "vinculos_estrutura"
    ];
    
    const promises = tables.map(async (table) => {
        try {
            const { count, error } = await db.from(table).select('*', { count: 'exact', head: true });
            if (error) return { table, count: 'Erro', error };
            return { table, count };
        } catch(e) {
            return { table, count: 'Erro' };
        }
    });
    
    const results = await Promise.all(promises);
    
    results.sort((a, b) => {
        if (typeof a.count === 'number' && typeof b.count === 'number') {
            if (a.count !== b.count) return b.count - a.count;
        }
        return a.table.localeCompare(b.table);
    });
    
    grid.innerHTML = '';
    results.forEach(res => {
        const card = document.createElement('div');
        const color = typeof res.count === 'number' && res.count > 0 ? '#10b981' : '#6b7280';
        card.style.cssText = `background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); border: 1px solid var(--border); border-radius: 12px; padding: 20px; border-left: 4px solid ${color}; display: flex; flex-direction: column; gap: 8px;`;
        
        card.innerHTML = `
            <div style="font-size: 13px; font-weight: 600; color: var(--text-main); word-break: break-all;">${res.table}</div>
            <div style="font-size: 28px; font-weight: 700; color: ${color}; margin-top: auto;">${res.count}</div>
        `;
        grid.appendChild(card);
    });
};

// ==========================================
// MÓDULO: AGENDA GLOBAL
// ==========================================

window.carregarAgendaGlobal = async function() {
    const container = document.getElementById('container-agenda-global');
    if (!container) return;

    container.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 40px;">Carregando eventos...</div>';

    try {
        const { data: eventos, error } = await db
            .from('agenda')
            .select('*, estruturas(nome)')
            .order('data_hora_inicio', { ascending: true });

        if (error) throw error;

        if (!eventos || eventos.length === 0) {
            container.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 40px;">Nenhum evento encontrado na agenda.</div>';
            return;
        }

        // Agrupar eventos por Mês/Ano
        const agrupados = {};

        eventos.forEach(ev => {
            if (!ev.data_hora_inicio) return;
            const dataInicio = new Date(ev.data_hora_inicio);
            if (isNaN(dataInicio)) return;

            // Criar chave do mês/ano (ex: "Agosto 2026")
            const mesNome = dataInicio.toLocaleString('pt-BR', { month: 'long' });
            const ano = dataInicio.getFullYear();
            const chave = `${mesNome.charAt(0).toUpperCase() + mesNome.slice(1)} ${ano}`;

            if (!agrupados[chave]) {
                agrupados[chave] = [];
            }
            agrupados[chave].push(ev);
        });

        let html = '';

        for (const [mesAno, listaEventos] of Object.entries(agrupados)) {
            // Cabeçalho do Mês
            html += `
                <h3 style="color: var(--primary); margin-top: 16px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
                    ${mesAno}
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-bottom: 32px;">
            `;

            // Cards de Eventos
            listaEventos.forEach(ev => {
                const dataInicio = new Date(ev.data_hora_inicio);
                const dataFormatada = dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
                const horaFormatada = dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const organizador = ev.estruturas ? ev.estruturas.nome : 'Global / Sem Departamento';
                const escopoStr = ev.visibilidade === 'Global' 
                    ? '<span style="color: #ef4444; font-weight: bold;">[Global]</span>' 
                    : '<span style="color: #3b82f6; font-weight: bold;">[Restrito]</span>';

                html += `
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; gap: 12px; align-items: center; position: relative; transition: all 0.2s;">
                        <div style="background: rgba(255,255,255,0.1); color: var(--text-main); border-radius: 6px; padding: 6px 10px; text-align: center; min-width: 55px;">
                            <div style="font-size: 14px; font-weight: bold;">${dataFormatada.split(' DE ')[0]}</div>
                            <div style="font-size: 10px; text-transform: uppercase;">${dataFormatada.split(' DE ')[1] || ''}</div>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: var(--text-main); font-size: 14px;">${ev.titulo}</div>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${organizador}</div>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">⏰ ${horaFormatada} ${ev.local ? `| 📍 ${ev.local}` : ''}</div>
                            <div style="font-size: 11px; margin-top: 6px;">${escopoStr}</div>
                        </div>
                    </div>
                `;
            });

            html += `</div>`; // fecha a grid
        }

        container.innerHTML = html;

    } catch (err) {
        console.error("Erro ao carregar agenda global:", err);
        container.innerHTML = '<div style="color: #ef4444; text-align: center; padding: 40px;">⚠️ Erro ao carregar agenda.</div>';
    }
};

// ==========================================
// MÓDULO: MINI-APPS (IRRADIAÇÃO)
// ==========================================

window.carregarEstatisticasMiniAppIrradiacao = async function () {
    const container = document.getElementById('containerEstatMiniAppIrradiacao');
    if (!container) return;

    container.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 40px;">Processando dados da Irradiação, aguarde...</div>';

    try {
        const { data, error } = await db.from('app_irradiacao_solicitacoes').select('*');
        if (error) throw error;

        let totalAtivos = 0;
        let totalHistorico = 0;
        let totalPendentes = 0;
        let encerraNaSemana = 0;
        let arquivamento = 0;
        let leiturasRealizadasTotal = 0;

        const ativosPorDia = {};
        const historicoPorDia = {};
        const leiturasPorMes = {};
        const leiturasPorSemana = {};

        const pessoasUnicasAtivas = new Set();
        const pessoasUnicasHistorico = new Set();
        const pessoasUnicasTotal = new Set();

        const hoje = new Date();

        data.forEach(item => {
            const nomeStr = (item.nome_solicitado || '').trim().toUpperCase();
            if (nomeStr) pessoasUnicasTotal.add(nomeStr);

            if (item.status === 'ativo') {
                totalAtivos++;
                if (nomeStr) pessoasUnicasAtivas.add(nomeStr);
                ativosPorDia[item.dias_semana] = (ativosPorDia[item.dias_semana] || 0) + 1;

                // Encerra na Semana
                const alvo = parseInt(item.semanas_alvo) || 0;
                const leituras = parseInt(item.leituras) || 0;
                if (alvo - leituras === 1) {
                    encerraNaSemana++;
                }

                // Arquivamento para ativos (sem leitura há > 30 dias)
                if (item.ultima_leitura) {
                    const ult = new Date(item.ultima_leitura);
                    const diffDays = Math.ceil((hoje - ult) / (1000 * 60 * 60 * 24));
                    if (diffDays > 30) arquivamento++;
                }

            } else if (item.status === 'historico') {
                totalHistorico++;
                if (nomeStr) pessoasUnicasHistorico.add(nomeStr);
                historicoPorDia[item.dias_semana] = (historicoPorDia[item.dias_semana] || 0) + 1;
            } else if (item.status === 'pendente') {
                totalPendentes++;
            }

            // Processar as leituras reais para Gráficos e Total Geral
            let logs = item.log_datas_leituras;
            if (typeof logs === 'string') {
                try { logs = JSON.parse(logs); } catch (e) { logs = []; }
            }
            if (Array.isArray(logs) && logs.length > 0) {
                leiturasRealizadasTotal += logs.length;

                logs.forEach(dateStr => {
                    const date = new Date(dateStr);
                    if (!isNaN(date)) {
                        // Agrupar por Mês
                        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        leiturasPorMes[monthKey] = (leiturasPorMes[monthKey] || 0) + 1;

                        // Agrupar por Semana ISO
                        const dCopy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                        const dayNum = dCopy.getUTCDay() || 7;
                        dCopy.setUTCDate(dCopy.getUTCDate() + 4 - dayNum);
                        const yearStart = new Date(Date.UTC(dCopy.getUTCFullYear(), 0, 1));
                        const weekNo = Math.ceil((((dCopy - yearStart) / 86400000) + 1) / 7);
                        const weekKey = `Semana ${weekNo} (${dCopy.getUTCFullYear()})`;
                        leiturasPorSemana[weekKey] = (leiturasPorSemana[weekKey] || 0) + 1;
                    }
                });
            }
        });

        // Pessoas que concluíram mas continuam ativas em outro dia
        pessoasUnicasAtivas.forEach(nome => {
            if (pessoasUnicasHistorico.has(nome)) {
                pessoasUnicasHistorico.delete(nome);
            }
        });

        const pessoasConcluidas = pessoasUnicasHistorico.size;

        // Tabelas Formatadas
        const formatTable = (dict) => {
            if (Object.keys(dict).length === 0) return '<div style="color:var(--text-muted); font-size:13px;">Sem dados</div>';
            return Object.entries(dict).sort((a, b) => b[1] - a[1]).map(([dia, count]) => `
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding: 8px 0;">
                    <span style="color: var(--text-muted); font-size: 13px;">${dia}</span>
                    <strong style="color: var(--text-main); font-size: 14px;">${count}</strong>
                </div>
            `).join('');
        };

        // Render HTML
        container.innerHTML = `
            <!-- Cabeçalho / Card Principal e Grid de Métricas -->
            <div style="display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 24px;">
                
                <!-- Card Principal do Mini-App -->
                <div style="flex: 1; min-width: 300px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 24px; display: flex; align-items: center; gap: 24px;">
                    <div style="font-size: 64px; text-shadow: 0 4px 12px rgba(59,130,246,0.3);">✨</div>
                    <div>
                        <h2 style="margin: 0 0 8px 0; color: #3b82f6; font-size: 24px;">Irradiação</h2>
                        <div style="font-size: 14px; color: var(--text-main); margin-bottom: 4px;"><strong>Atividade:</strong> Irradiação à distância</div>
                        <div style="font-size: 14px; color: var(--text-main);"><strong>Departamento:</strong> Espiritual</div>
                    </div>
                </div>

                <!-- Grid de Métricas -->
                <div style="flex: 2; min-width: 400px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
                    <!-- Linha 1 -->
                    <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: center;">
                        <span style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Leituras Realizadas</span>
                        <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${leiturasRealizadasTotal}</div>
                    </div>
                    <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: center;">
                        <span style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Pessoas Únicas</span>
                        <div style="font-size: 24px; font-weight: bold; color: #10b981;">${pessoasUnicasTotal.size} <span style="font-size:12px; font-weight:normal; color:var(--text-muted);">totais</span></div>
                    </div>
                    <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: center;">
                        <span style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Pessoas Únicas</span>
                        <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${pessoasUnicasAtivas.size} <span style="font-size:12px; font-weight:normal; color:var(--text-muted);">ativas</span></div>
                    </div>
                    <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: center;">
                        <span style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Pessoas Concluídas</span>
                        <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${pessoasConcluidas}</div>
                    </div>
                    
                    <!-- Linha 2 -->
                    <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: center;">
                        <span style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Painel de Leitura</span>
                        <div style="font-size: 24px; font-weight: bold; color: #10b981;">${totalAtivos} <span style="font-size:12px; font-weight:normal; color:var(--text-muted);">ativos</span></div>
                    </div>
                    <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: center;">
                        <span style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Encerra na Semana</span>
                        <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;">${encerraNaSemana}</div>
                    </div>
                    <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: center;">
                        <span style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Histórico</span>
                        <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${totalHistorico} <span style="font-size:12px; font-weight:normal; color:var(--text-muted);">concluídos</span></div>
                    </div>
                    <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: center;">
                        <span style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Arquivamento</span>
                        <div style="font-size: 24px; font-weight: bold; color: #64748b;">${arquivamento}</div>
                    </div>
                </div>
            </div>

            <!-- Tabelas de Necessidades e Pendentes no Centro -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 24px;">
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
                    <h4 style="color: #10b981; font-size: 14px; margin: 0 0 16px 0;">Ativos por Dia / Necessidades</h4>
                    ${formatTable(ativosPorDia)}
                </div>
                
                <!-- Card Pendentes em destaque -->
                <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.1) 100%); border: 1px dashed rgba(239, 68, 68, 0.4); border-radius: 12px; padding: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 12px;">⏳</div>
                    <div style="font-size: 12px; color: #ef4444; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px;">Aguardando Triagem</div>
                    <div style="font-size: 56px; font-weight: 800; color: #ef4444; line-height: 1;">${totalPendentes}</div>
                    <div style="font-size: 14px; color: var(--text-muted); margin-top: 12px;">Pacientes Pendentes</div>
                </div>

                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
                    <h4 style="color: #f59e0b; font-size: 14px; margin: 0 0 16px 0;">Histórico por Dia / Necessidade</h4>
                    ${formatTable(historicoPorDia)}
                </div>
            </div>

            <!-- Gráficos -->
            <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h4 style="color: var(--text-main); font-size: 14px; margin: 0 0 16px 0;">Evolução de Leituras por Semana (Eixo do Tempo)</h4>
                <div style="position: relative; height: 350px; width: 100%;">
                    <canvas id="chartMiniAppLeiturasSemanais"></canvas>
                </div>
            </div>

            <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
                <h4 style="color: var(--text-main); font-size: 14px; margin: 0 0 16px 0;">Evolução de Leituras por Mês (Esforço da Equipe)</h4>
                <div style="position: relative; height: 300px; width: 100%;">
                    <canvas id="chartMiniAppLeiturasMensais"></canvas>
                </div>
            </div>
        `;

        // Preparar Dados dos Gráficos
        const sortedMonths = Object.keys(leiturasPorMes).sort();
        const chartLabelsMes = sortedMonths.map(m => {
            const [year, month] = m.split('-');
            const date = new Date(year, month - 1);
            return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        });
        const chartDataMes = sortedMonths.map(m => leiturasPorMes[m]);

        const sortedWeeks = Object.keys(leiturasPorSemana).sort();
        const chartLabelsSemana = sortedWeeks;
        const chartDataSemana = sortedWeeks.map(w => leiturasPorSemana[w]);

        if (window.Chart) {
            // Destruir instâncias antigas se existirem
            if (window.miniAppChartSemanal) window.miniAppChartSemanal.destroy();
            if (window.miniAppChartMensal) window.miniAppChartMensal.destroy();

            // Gráfico Semanal
            const ctxSemanal = document.getElementById('chartMiniAppLeiturasSemanais').getContext('2d');
            window.miniAppChartSemanal = new Chart(ctxSemanal, {
                type: 'line',
                data: {
                    labels: chartLabelsSemana,
                    datasets: [{
                        label: 'Total de Leituras na Semana',
                        data: chartDataSemana,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: '#8b5cf6',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: '#9ca3af' } }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: '#9ca3af', precision: 0 },
                            grid: { color: 'rgba(255,255,255,0.05)' }
                        },
                        x: {
                            ticks: { color: '#9ca3af', maxRotation: 45, minRotation: 45 },
                            grid: { display: false }
                        }
                    }
                }
            });

            // Gráfico Mensal
            const ctxMensal = document.getElementById('chartMiniAppLeiturasMensais').getContext('2d');
            window.miniAppChartMensal = new Chart(ctxMensal, {
                type: 'bar',
                data: {
                    labels: chartLabelsMes,
                    datasets: [{
                        label: 'Total de Leituras no Mês',
                        data: chartDataMes,
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderColor: '#3b82f6',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: '#9ca3af' } }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: '#9ca3af', precision: 0 },
                            grid: { color: 'rgba(255,255,255,0.05)' }
                        },
                        x: {
                            ticks: { color: '#9ca3af' },
                            grid: { display: false }
                        }
                    }
                }
            });
        }

    } catch (err) {
        console.error("Erro ao carregar estatísticas do Mini-App Irradiação:", err);
        container.innerHTML = '<div style="color: #ef4444; text-align: center; padding: 40px;">⚠️ Erro ao carregar estatísticas.</div>';
    }
};


window.carregarUsuariosAutorizados = async function() {
    try {
        const { data, error } = await db.from('usuarios_autorizados').select('*').order('nome', {ascending: true});
        if (error) throw error;
        
        const tbody = document.getElementById('tabelaUsuariosAutorizados');
        if (!tbody) return;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="padding: 16px; text-align: center; color: var(--text-muted);">Nenhum usuário cadastrado.</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(u => {
            const dataCriado = new Date(u.criado_em).toLocaleDateString('pt-BR');
            return `
                <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 12px 16px; color: var(--text-main); font-weight: 500;">${u.nome || '-'}</td>
                    <td style="padding: 12px 16px; color: var(--text-muted);">${u.email}</td>
                    <td style="padding: 12px 16px;"><span style="font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 6px; background: ${u.nivel_acesso === 'admin' ? 'rgba(236,72,153,0.1)' : 'rgba(56,189,248,0.1)'}; color: ${u.nivel_acesso === 'admin' ? '#ec4899' : '#38bdf8'}; text-transform: uppercase;">${u.nivel_acesso}</span></td>
                    <td style="padding: 12px 16px; color: var(--text-muted);">${dataCriado}</td>
                    <td style="padding: 12px 16px;">
                        <button onclick="excluirUsuarioAutorizado('${u.email}')" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 4px; border-radius: 4px;" title="Remover acesso">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch(e) {
        console.error(e);
        const tbody = document.getElementById('tabelaUsuariosAutorizados');
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center;">Erro ao carregar usuários.</td></tr>';
    }
};

window.salvarUsuarioAutorizado = async function() {
    const nome = document.getElementById('bdUserNome').value.trim();
    const email = document.getElementById('bdUserEmail').value.trim();
    const nivel = document.getElementById('bdUserNivel').value;
    
    if (!email) {
        alert("O e-mail é obrigatório.");
        return;
    }
    
    try {
        const { error } = await db.from('usuarios_autorizados').insert([{
            nome: nome,
            email: email,
            nivel_acesso: nivel
        }]);
        if (error) {
            if (error.code === '23505') throw new Error("Este e-mail já está autorizado.");
            throw error;
        }
        
        document.getElementById('bdUserNome').value = '';
        document.getElementById('bdUserEmail').value = '';
        carregarUsuariosAutorizados();
        
    } catch(err) {
        console.error(err);
        alert('Erro ao salvar usuário: ' + (err.message || ''));
    }
};

window.excluirUsuarioAutorizado = async function(email) {
    if (!confirm(`Remover autorização para ${email}?`)) return;
    try {
        const { error } = await db.from('usuarios_autorizados').delete().eq('email', email);
        if (error) throw error;
        carregarUsuariosAutorizados();
    } catch(err) {
        console.error(err);
        alert('Erro ao excluir usuário.');
    }
};


// ==========================================
// ESTATÍSTICAS DO MINI-APP ATENDIMENTO ESPIRITUAL
// ==========================================
window.carregarEstatisticasMiniAppAtendimento = async function () {
    const container = document.getElementById('containerEstatMiniAppAtendimento');
    if (!container) return;

    container.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 40px;">Processando dados do Atendimento Espiritual, aguarde...</div>';

    try {
        // Run queries in parallel
        const [resFraterno, resSessoes, resTratamentos, resPresencas, resPacientes] = await Promise.all([
            db.from('app_atendimento_fraterno').select('*', { count: 'exact' }),
            db.from('app_atendimento_sessoes').select('*', { count: 'exact' }),
            db.from('app_atendimento_tratamentos').select('*', { count: 'exact' }),
            db.from('app_atendimento_presencas').select('*', { count: 'exact' }),
            db.from('app_pacientes').select('id', { count: 'exact' })
        ]);

        if (resFraterno.error) console.error(resFraterno.error);
        if (resSessoes.error) console.error(resSessoes.error);
        if (resTratamentos.error) console.error(resTratamentos.error);
        if (resPresencas.error) console.error(resPresencas.error);

        const totalFraterno = resFraterno.data ? resFraterno.data.length : 0;
        const totalSessoes = resSessoes.data ? resSessoes.data.length : 0;
        const totalTratamentos = resTratamentos.data ? resTratamentos.data.length : 0;
        const totalPresencas = resPresencas.data ? resPresencas.data.length : 0;
        
        // Calculate Total Pacientes (Fichário) from unique names in Fraterno and Tratamentos
        const ficharioSet = new Set();
        (resFraterno.data || []).forEach(f => {
            if (f.nome_completo) ficharioSet.add(f.nome_completo.trim().toUpperCase());
        });
        (resTratamentos.data || []).forEach(t => {
            if (t.paciente?.nome_completo) ficharioSet.add(t.paciente.nome_completo.trim().toUpperCase());
            else if (t.nome_completo) ficharioSet.add(t.nome_completo.trim().toUpperCase());
        });
        const totalPacientes = ficharioSet.size;
        
        let triagemAguardando = 0;
        (resFraterno.data || []).forEach(f => {
            // Planejado ou qualquer status que indique fila
            if (f.status === 'Planejado' || f.status === 'Aguardando' || f.status === 'Fila') {
                triagemAguardando++;
            }
        });

        // Count Atendimentos by type
        let qtdeOrientacao = 0;
        let qtdeTratamento = 0;
        let qtdeOutros = 0;

        (resFraterno.data || []).forEach(f => {
            const t = (f.encaminhamento || '').toLowerCase();
            if (t.includes('orientaç') || t.includes('orientac')) qtdeOrientacao++;
            else if (t.includes('tratamento')) qtdeTratamento++;
            else qtdeOutros++;
        });

        // Current Month
        const now = new Date();
        const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        
        let fraternoMes = 0;
        (resFraterno.data || []).forEach(f => {
            if (f.data_atendimento >= firstDayMonth) fraternoMes++;
        });

        let sessoesMes = 0;
        (resSessoes.data || []).forEach(s => {
            if (s.data_sessao >= firstDayMonth) sessoesMes++;
        });

        // Building HTML UI
        let html = `
            <div style="display: flex; gap: 24px; margin-bottom: 24px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 300px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.1) 100%); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 24px; display: flex; align-items: flex-start; gap: 16px;">
                    <div style="font-size: 40px; background: rgba(16, 185, 129, 0.1); width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; border-radius: 12px;">🕊️</div>
                    <div>
                        <h2 style="margin: 0 0 8px 0; color: #10b981; font-size: 24px;">Atendimentos</h2>
                        <div style="font-size: 14px; color: var(--text-main); margin-bottom: 4px;"><strong>Atividade:</strong> Atendimentos Fraterno e Tratamentos</div>
                        <div style="font-size: 14px; color: var(--text-main);"><strong>Departamento:</strong> Espiritual</div>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                
                <!-- NEW CARD: Triagem -->
                <div style="background: var(--bg-panel); border: 1px dashed #f59e0b; border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">⏳</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Aguardando na Triagem</div>
                    <div style="font-size: 32px; font-weight: 800; color: #f59e0b; margin: 8px 0; line-height: 1;">${triagemAguardando}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Pacientes na fila</div>
                </div>

                <!-- NEW CARD: Fichário -->
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">🗂️</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Pacientes Cadastrados</div>
                    <div style="font-size: 32px; font-weight: 800; color: #64748b; margin: 8px 0; line-height: 1;">${totalPacientes}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Total no Fichário</div>
                </div>

                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">🤝</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Atendimento Fraterno</div>
                    <div style="font-size: 32px; font-weight: 800; color: var(--primary); margin: 8px 0; line-height: 1;">${totalFraterno}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Total histórico registrado</div>
                    <div style="font-size: 12px; color: #10b981; margin-top: 4px; font-weight: 500;">+${fraternoMes} este mês</div>
                </div>

                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">📅</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Sessões Realizadas</div>
                    <div style="font-size: 32px; font-weight: 800; color: #3b82f6; margin: 8px 0; line-height: 1;">${totalSessoes}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Sessões abertas e concluídas</div>
                    <div style="font-size: 12px; color: #10b981; margin-top: 4px; font-weight: 500;">+${sessoesMes} este mês</div>
                </div>

                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">📋</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Pacientes em Tratamento</div>
                    <div style="font-size: 32px; font-weight: 800; color: #8b5cf6; margin: 8px 0; line-height: 1;">${totalTratamentos}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Vínculos criados nas sessões</div>
                </div>

                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: left; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -15px; right: -15px; font-size: 80px; opacity: 0.05;">✔️</div>
                    <div style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-transform: uppercase;">Presenças Confirmadas</div>
                    <div style="font-size: 32px; font-weight: 800; color: #10b981; margin: 8px 0; line-height: 1;">${totalPresencas}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Pacientes presentes no salão</div>
                </div>

            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
                    <h4 style="color: var(--text-main); margin: 0 0 16px 0;">Distribuição dos Encaminhamentos</h4>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                                <span style="color: var(--text-muted);">Apenas Orientação</span>
                                <span style="font-weight: 600; color: var(--text-main);">${qtdeOrientacao}</span>
                            </div>
                            <div style="width: 100%; background: rgba(255,255,255,0.05); height: 8px; border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; background: #3b82f6; width: ${(totalFraterno>0)?(qtdeOrientacao/totalFraterno*100):0}%"></div>
                            </div>
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                                <span style="color: var(--text-muted);">Tratamento Espiritual</span>
                                <span style="font-weight: 600; color: var(--text-main);">${qtdeTratamento}</span>
                            </div>
                            <div style="width: 100%; background: rgba(255,255,255,0.05); height: 8px; border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; background: #8b5cf6; width: ${(totalFraterno>0)?(qtdeTratamento/totalFraterno*100):0}%"></div>
                            </div>
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                                <span style="color: var(--text-muted);">Outros / Não especificado</span>
                                <span style="font-weight: 600; color: var(--text-main);">${qtdeOutros}</span>
                            </div>
                            <div style="width: 100%; background: rgba(255,255,255,0.05); height: 8px; border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; background: #64748b; width: ${(totalFraterno>0)?(qtdeOutros/totalFraterno*100):0}%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
                    <h4 style="color: var(--text-main); margin: 0 0 16px 0;">Sessões Recentes (Este Mês)</h4>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${(resSessoes.data || [])
                            .filter(s => s.data_sessao >= firstDayMonth)
                            .sort((a,b) => new Date(b.data_sessao) - new Date(a.data_sessao))
                            .slice(0, 5)
                            .map(s => {
                                const statusColor = s.status === 'Concluída' ? '#10b981' : '#f59e0b';
                                return `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px;">
                                    <div style="display: flex; flex-direction: column; gap: 2px;">
                                        <div style="color: var(--text-main); font-weight: 500; font-size: 14px;">${s.data_sessao.split('-').reverse().join('/')}</div>
                                    </div>
                                    <span style="font-size: 11px; font-weight: 600; background: ${statusColor}20; color: ${statusColor}; padding: 4px 8px; border-radius: 6px; text-transform: uppercase;">
                                        ${s.status || 'Aberta'}
                                    </span>
                                </div>
                                `;
                            }).join('') || '<div style="color: var(--text-muted); font-size: 13px;">Nenhuma sessão registrada este mês.</div>'
                        }
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        
    } catch (err) {
        console.error("Erro no dashboard do Atendimento", err);
        container.innerHTML = `<div style="color:red; text-align:center; padding: 20px;">Erro ao carregar estatísticas do Atendimento.</div>`;
    }
};
