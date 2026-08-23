import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.js'
with open(filepath, 'r') as f:
    content = f.read()

dashboard_funcs = """

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
            "Evangelizador + Evangelizadora", "Evangelizanda + Evangelizando", "Ex-Associado + Fornecedor", 
            "Gestante", "Leitor", "Líder", "Membro da Família", "Paciente", "Paciente Externo", 
            "Palestrante", "Parceiro", "Passista", "Presidente + Presidenta", "Secretário + Secretária", 
            "Tarefeira + Tarefeiro", "Tesoureira + Tesoureiro", "Vice-Diretor + Vice-Diretora", 
            "Vice-Presidenta + Vice-Presidente", "Voluntária + Voluntário", "Outros"
        ];
        
        let counts = { Total: lista.length, Fisica: 0, Juridica: 0 };
        perfisTarget.forEach(p => counts[p] = 0);

        // DADOS
        let dadosCounts = {
            'Com CPF real': 0, 'Com CPF provisório': 0, 'Sem CPF': 0,
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
            const hasCpf = p.cpf_cnpj && p.cpf_cnpj.trim() !== '';
            if (!hasCpf) dadosCounts['Sem CPF']++;
            else if (p.cpf_cnpj.includes('TEMP') || p.cpf_cnpj.includes('PROV')) dadosCounts['Com CPF provisório']++;
            else dadosCounts['Com CPF real']++;

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
        let htmlDados = '';
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

"""

content += dashboard_funcs

# Add call to carregarDashboardsPessoas inside verificarAcessoAdmin
old_admin = "carregarHistoricoCelular();"
new_admin = """carregarHistoricoCelular();
        carregarDashboardsPessoas();"""
content = content.replace(old_admin, new_admin)

with open(filepath, 'w') as f:
    f.write(content)
print("admin.js updated with dashboards")
