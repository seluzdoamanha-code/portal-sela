import re

with open('m_ass_familias.js', 'r') as f:
    content = f.read()

new_carregar = """
    async function carregarFamilias() {
        document.getElementById('mLoadingState').style.display = 'block';

        try {
            // 1. Busca Famílias NOVAS
            const { data: dataNovas, error: errorNovas } = await db.from('pessoas')
                .select('*, ass_familias_meta(id, codigo, status, tipo), pessoas_relacionamentos!pessoa_origem_id(id)')
                .ilike('perfis', '%Titular - Família Assistida%');
            
            let familiasNovas = [];
            if (!errorNovas) {
                familiasNovas = (dataNovas || []).map(p => {
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
                
            let familiasAntigas = [];
            if (!errorAntigas) {
                familiasAntigas = (dataAntigas || []).map(f => {
                    f.is_nova_plataforma = false;
                    return f;
                });
            }

            allFamilias = [...familiasNovas, ...familiasAntigas];
            
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
"""
content = re.sub(r'    async function carregarFamilias\(\) \{.*?\n    \}', new_carregar.strip(), content, flags=re.DOTALL)

# Modify renderizar to add a tag for new platform
new_render = """
            const isNova = f.is_nova_plataforma ? '<span style="font-size:10px; background:#4ade80; color:#14532d; padding:2px 6px; border-radius:8px; margin-left:8px;">Global</span>' : '';
            card.innerHTML = `
                <div class="m-fam-header">
                    <div class="m-fam-name">${f.nome_familia || 'Sem Nome'} ${isNova}</div>
                    <div class="m-fam-status status-${f.status || 'Ativa'}">${f.status || 'Ativa'}</div>
                </div>
"""
content = re.sub(r'            card.innerHTML = `\s*<div class="m-fam-header">\s*<div class="m-fam-name">\$\{f\.nome_familia \|\| \'Sem Nome\'\}</div>\s*<div class="m-fam-status status-\$\{f\.status \|\| \'Ativa\'\}">\$\{f\.status \|\| \'Ativa\'\}</div>\s*</div>', new_render.strip(), content)


new_membros = """
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
"""
content = re.sub(r'        // Buscar Membros \(Assíncrono\).*?// Sort\s*membros\.sort.*?\}\);\s*allMembers = allMembers\.concat\(membros\);', new_membros.strip(), content, flags=re.DOTALL)

with open('m_ass_familias.js', 'w') as f:
    f.write(content)

