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
    }
};



// ==========================================
// MÓDULO: DASHBOARDS PESSOAS E ASSOCIADOS
// ==========================================

window.switchSubTab = function(target, tabName) {
    // target = 'pessoas' ou 'associados'
    // tabName = 'perfil' ou 'dados'
    
    // Atualiza botoes
    document.querySelector(`.btn-${target}-perfil`).style.background = tabName === 'perfil' ? 'var(--primary)' : 'rgba(255,255,255,0.05)';
    document.querySelector(`.btn-${target}-perfil`).style.color = tabName === 'perfil' ? 'white' : 'var(--text-muted)';
    document.querySelector(`.btn-${target}-perfil`).style.border = tabName === 'perfil' ? 'none' : '1px solid var(--border)';
    
    document.querySelector(`.btn-${target}-dados`).style.background = tabName === 'dados' ? 'var(--primary)' : 'rgba(255,255,255,0.05)';
    document.querySelector(`.btn-${target}-dados`).style.color = tabName === 'dados' ? 'white' : 'var(--text-muted)';
    document.querySelector(`.btn-${target}-dados`).style.border = tabName === 'dados' ? 'none' : '1px solid var(--border)';
    
    // Atualiza conteudos
    document.querySelectorAll(`.${target}-subtab`).forEach(el => el.style.display = 'none');
    document.getElementById(`subtab-${target}-${tabName}`).style.display = 'block';
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
