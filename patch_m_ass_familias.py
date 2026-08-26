import re

with open('m_ass_familias.js', 'r') as f:
    content = f.read()

# 1. carregarFamilias
new_carregar = """
    async function carregarFamilias() {
        document.getElementById('mLoadingState').style.display = 'block';

        try {
            const { data, error } = await db.from('pessoas')
                .select('*, ass_familias_meta(id, codigo, status, tipo), pessoas_relacionamentos!pessoa_origem_id(id)')
                .ilike('perfis', '%Titular - Família Assistida%')
                .order('nome_completo');
            if (error) throw error;
            
            allFamilias = (data || []).map(p => {
                const meta = (p.ass_familias_meta && p.ass_familias_meta.length > 0) ? p.ass_familias_meta[0] : {};
                return {
                    id: p.id,
                    nome_familia: p.nome_curto || p.nome_completo,
                    codigo: meta.codigo || 'S/C',
                    status: meta.status || 'Ativa',
                    tipo: meta.tipo || 'Fixa/Assistida',
                    pessoas: p,
                    ass_membros_familia: p.pessoas_relacionamentos || [],
                    meta_id: meta.id || null
                };
            });
            
            filtrarLista();

            document.getElementById('mLoadingState').style.display = 'none';
        } catch (e) {
            console.error('Erro:', e);
            document.getElementById('mLoadingState').innerText = 'Erro ao carregar famílias.';
        }
    }
"""

content = re.sub(r'async function carregarFamilias\(\) \{.*?\n    \}', new_carregar.strip(), content, flags=re.DOTALL)


# 2. abrirDetalhes Membros logic
new_membros = """
        // Buscar Membros (Assíncrono)
        const ml = document.getElementById('mdMembrosList');
        const cjBlock = document.getElementById('mdConjugeBlock');
        const cjVal = document.getElementById('mdConjuge');
        cjBlock.style.display = 'none'; // Reset conjuge
        
        ml.innerHTML = 'Buscando membros...';
        try {
            const { data: membrosOrig, error } = await db.from('pessoas_relacionamentos')
                .select('tipo_relacao, pessoas!pessoa_destino_id(nome_completo, data_nascimento)')
                .eq('pessoa_origem_id', f.id);
                
            if (error) throw error;
            
            let allMembers = [];
            
            // 1. Responsável
            if (resp.nome_completo) {
                allMembers.push({
                    nome: resp.nome_completo,
                    parentesco: 'Titular',
                    nascimento: resp.data_nascimento,
                    is_resp: true
                });
            } else {
                 allMembers.push({
                    nome: f.nome_familia || 'Titular',
                    parentesco: 'Titular',
                    nascimento: null,
                    is_resp: true
                });
            }
            
            let membros = [];
            if (membrosOrig) {
                membros = membrosOrig.map(m => {
                    const p = m.pessoas || {};
                    return {
                        nome: p.nome_completo || 'Sem Nome',
                        parentesco: m.tipo_relacao || '',
                        nascimento: p.data_nascimento,
                        is_conjuge: (m.tipo_relacao && m.tipo_relacao.toLowerCase().includes('cônjuge'))
                    };
                });
            }
"""

content = re.sub(r'        // Buscar Membros \(Assíncrono\).*?if \(membrosOrig\) \{.*?\}\n', new_membros.strip() + '\\n', content, flags=re.DOTALL)

with open('m_ass_familias.js', 'w') as f:
    f.write(content)

