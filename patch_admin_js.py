import re

filepath = '/Users/wagnercosta/Documents/antigravity/portal-sela/admin.js'
with open(filepath, 'r') as f:
    content = f.read()

# I will add the functions for Celular inside a script section
celular_funcs = """

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
    }
};

window.excluirRecargaCelular = async function(id) {
    if(!confirm("Tem certeza que deseja excluir este registro?")) return;
    
    const { error } = await db.from('app_admin_celular_creditos').delete().eq('id', id);
    if(error) {
        alert("Erro ao excluir: " + error.message);
    } else {
        carregarHistoricoCelular();
    }
};

"""

content += celular_funcs

# Add carregarHistoricoCelular to verificarAcessoAdmin
old_admin = "document.getElementById('adminContent').style.display = 'block';"
new_admin = """document.getElementById('adminContent').style.display = 'block';
        carregarHistoricoCelular();"""
content = content.replace(old_admin, new_admin)

with open(filepath, 'w') as f:
    f.write(content)
print("admin.js updated with Celular module")
