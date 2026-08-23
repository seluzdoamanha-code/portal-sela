import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.js'
with open(filepath, 'r') as f:
    content = f.read()

mensalidades_funcs = """

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

"""

content += mensalidades_funcs

# Call it on admin access check
old_admin = "carregarDashboardsHome();"
new_admin = """carregarDashboardsHome();
        carregarAssociadosMensalidades();"""
content = content.replace(old_admin, new_admin)

with open(filepath, 'w') as f:
    f.write(content)
print("admin.js patched for Mensalidades")
