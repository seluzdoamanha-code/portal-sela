import re

with open('m_ass_familias.js', 'r') as f:
    content = f.read()

new_form = """
    // --- FORMULÁRIO CRUD ---
async function abrirFormularioNova() {
    window.location.href = 'pessoas.html';
}

async function abrirFormularioEdicao(f) {
    if (!f) return;
    
    document.getElementById('mFormTitle').innerText = 'Metadados Assistência: ' + f.nome_familia;
    document.getElementById('fId').value = f.id; // pessoa_id
    document.getElementById('fCodigo').value = f.codigo || '';
    document.getElementById('fStatus').value = f.status || 'Ativa';
    document.getElementById('fTipo').value = f.tipo || 'Fixa/Assistida';
    
    document.getElementById('mFormModal').classList.add('active');
}

function fecharFormulario() {
    document.getElementById('mFormModal').classList.remove('active');
}

async function salvarFamilia() {
    const pessoaId = document.getElementById('fId').value;
    const codigo = document.getElementById('fCodigo').value.trim();
    const status = document.getElementById('fStatus').value;
    const tipo = document.getElementById('fTipo').value;

    const btn = document.getElementById('btnSalvarFamilia');
    btn.innerText = 'Salvando...';
    btn.disabled = true;

    try {
        const payload = {
            pessoa_id: pessoaId,
            codigo: codigo,
            status: status,
            tipo: tipo
        };

        // Try to update or insert using upsert
        const { error } = await db.from('ass_familias_meta').upsert(payload, { onConflict: 'pessoa_id' });
        if (error) throw error;
        
        fecharFormulario();
        carregarFamilias();
    } catch(e) {
        console.error(e);
        alert('Erro ao salvar metadados da família.');
    } finally {
        btn.innerText = 'Salvar';
        btn.disabled = false;
    }
}
"""

content = re.sub(r'    // --- FORMULÁRIO CRUD ---.*', new_form.strip(), content, flags=re.DOTALL)

# Also fix the `btnNovaFamilia` to redirect to pessoas.html directly
# And `btnEditFamilia` to open this modal.
# Oh, `content` replace will replace everything to the end of the file. That's fine because CRUD is at the end.
content += "\n})();\n"

with open('m_ass_familias.js', 'w') as f:
    f.write(content)
