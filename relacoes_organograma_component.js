// Componente Reutilizável: Relações & Organograma Institucional (Sankey & Visões)
// Desenvolvido para o Portal SELA

window.RelacoesOrganograma = (function() {
    let rawData = [];
    let deptsAtivos = new Set();
    let termoBusca = '';
    let noTravado = null;
    let containerEl = null;
    let currentMode = 'sankey';

    const deptColors = {
        'Diretoria': '#f59e0b',
        'Comunicação': '#3b82f6',
        'Assistência Social': '#10b981',
        'Espiritual': '#8b5cf6',
        'Infância e Juventude': '#ec4899',
        'Eventos': '#06b6d4',
        'Doutrinário': '#a855f7'
    };

    async function init(targetElementId, supabaseClient) {
        containerEl = document.getElementById(targetElementId);
        if (!containerEl) return;

        containerEl.innerHTML = `
            <div class="rel-organograma-wrapper" style="display: flex; flex-direction: column; gap: 14px; width: 100%;">
                <!-- Barra Superior de Controle e Modos (compacta sem a faixa horizontal) -->
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <h3 style="margin: 0; font-size: 16px; color: var(--text-main); font-weight: 700;">🏛️ Relações & Organograma Institucional</h3>
                            <span id="badgeFiltroRelacoes" style="display: none; font-size: 11px; padding: 2px 8px; border-radius: 6px; background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3);"></span>
                        </div>
                        <p style="margin: 2px 0 0 0; font-size: 12px; color: var(--text-muted);">Mapeamento visual de membros, cargos e conexões entre departamentos da Casa.</p>
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <input type="text" id="buscaRelacoes" placeholder="🔎 Buscar pessoa ou cargo..." 
                            style="background: rgba(0,0,0,0.25); border: 1px solid var(--border); border-radius: 8px; padding: 6px 12px; color: var(--text-main); font-size: 12px; outline: none; width: 180px;">
                        
                        <div style="display: flex; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 8px; padding: 2px; gap: 2px;">
                            <button id="btnModoSankey" class="btn" style="padding: 5px 12px; font-size: 12px; border-radius: 6px; background: var(--primary); color: #fff;">🌊 Fluxo (Sankey)</button>
                            <button id="btnModoCards" class="btn" style="padding: 5px 12px; font-size: 12px; border-radius: 6px; background: transparent; color: var(--text-muted);">📊 Departamentos</button>
                            <button id="btnModoRadial" class="btn" style="padding: 5px 12px; font-size: 12px; border-radius: 6px; background: transparent; color: var(--text-muted);">🕸️ Radial</button>
                        </div>

                        <button id="btnResetRelacoes" class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px; height: auto;">↺ Ver Todos</button>
                    </div>
                </div>

                <!-- Grid Principal: Gráfico com Altura Ampliada + Coluna Lateral Direita com Filtros -->
                <div style="display: grid; grid-template-columns: 1fr 320px; gap: 16px; align-items: start;">
                    <!-- Canvas do Gráfico -->
                    <div id="canvasRelacoesArea" style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; min-height: 800px; height: 800px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                        <div style="color: var(--text-muted); font-size: 13px;">Carregando visualização institucional...</div>
                    </div>

                    <!-- Inspetor e Filtro Lateral Direito -->
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <!-- Bloco de Filtro de Departamentos Lateral -->
                        <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <h4 style="margin: 0; font-size: 12px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; font-weight: 700;">
                                    🏢 Filtrar Departamentos
                                </h4>
                                <span id="filtroCountLabel" style="font-size: 11px; color: var(--primary); font-weight: 600;">Todos</span>
                            </div>

                            <div style="display: flex; gap: 6px; margin-bottom: 10px;">
                                <button id="btnMarcarTodosDepts" style="flex: 1; padding: 4px 6px; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 6px; color: var(--text-muted); font-size: 11px; cursor: pointer;">Todos</button>
                                <button id="btnApenasDiretoriaDepts" style="flex: 1; padding: 4px 6px; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 6px; color: var(--text-muted); font-size: 11px; cursor: pointer;">Diretoria</button>
                            </div>

                            <div id="chipsDepartamentosList" class="custom-scrollbar" style="display: flex; flex-direction: column; gap: 6px; max-height: 310px; overflow-y: auto; padding-right: 2px;"></div>
                        </div>

                        <!-- Bloco de Detalhes da Seleção -->
                        <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px;">
                            <h4 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; font-weight: 700;">🔍 Detalhes da Seleção</h4>
                            <div id="relacoesInspectorBox" style="font-size: 13px; color: var(--text-muted); min-height: 180px;">
                                Passe o cursor ou clique sobre qualquer pessoa, cargo ou departamento para fixar o foco e ver histórico.
                            </div>
                        </div>

                        <!-- Bloco de Dica de Navegação -->
                        <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 12px 16px;">
                            <h4 style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; font-weight: 700;">📌 Dica de Navegação</h4>
                            <div style="font-size: 11.5px; color: var(--text-muted); line-height: 1.5;">
                                • Clique em uma pessoa para <strong>travar o caminho</strong>.<br>
                                • Clique fora para <strong>destravar</strong>.<br>
                                • Clique nos departamentos acima para filtrar a visão.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Carregar dados reais
        await carregarDados(supabaseClient);

        // Bind dos eventos
        document.getElementById('buscaRelacoes').addEventListener('input', (e) => {
            termoBusca = e.target.value.trim().toLowerCase();
            renderAtual();
        });

        document.getElementById('btnResetRelacoes').addEventListener('click', () => {
            deptsAtivos.clear();
            rawData.forEach(v => deptsAtivos.add(v.estruturas?.nome || 'Geral'));
            termoBusca = '';
            noTravado = null;
            document.getElementById('buscaRelacoes').value = '';
            atualizarChipsUI();
            renderAtual();
        });

        const btnMarcarTodos = document.getElementById('btnMarcarTodosDepts');
        if (btnMarcarTodos) {
            btnMarcarTodos.onclick = () => {
                rawData.forEach(v => deptsAtivos.add(v.estruturas?.nome || 'Geral'));
                atualizarChipsUI();
                renderAtual();
            };
        }

        const btnApenasDiretoria = document.getElementById('btnApenasDiretoriaDepts');
        if (btnApenasDiretoria) {
            btnApenasDiretoria.onclick = () => {
                deptsAtivos.clear();
                deptsAtivos.add('Diretoria');
                deptsAtivos.add('Comunicação');
                atualizarChipsUI();
                renderAtual();
            };
        }

        document.getElementById('btnModoSankey').onclick = () => alternarModo('sankey');
        document.getElementById('btnModoCards').onclick = () => alternarModo('cards');
        document.getElementById('btnModoRadial').onclick = () => alternarModo('radial');
    }

    async function carregarDados(supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('vinculos_estrutura')
                .select(`
                    id,
                    perfil,
                    pessoas (
                        id,
                        nome_curto,
                        nome_completo,
                        email,
                        perfis
                    ),
                    estruturas (
                        id,
                        nome,
                        tipo,
                        parent_id
                    )
                `);

            if (error) throw error;
            rawData = data || [];

            // Identifica departamentos
            const todosDepts = new Set();
            rawData.forEach(v => {
                const dNome = v.estruturas?.nome || 'Geral';
                todosDepts.add(dNome);
                deptsAtivos.add(dNome);
            });

            renderizarChips(Array.from(todosDepts));
            renderAtual();
        } catch (e) {
            console.error("Erro ao carregar relações:", e);
            const canvas = document.getElementById('canvasRelacoesArea');
            if (canvas) canvas.innerHTML = '<div style="color: #ef4444; padding: 20px;">Não foi possível carregar as relações institucionais.</div>';
        }
    }

    function renderizarChips(todosDepts) {
        const container = document.getElementById('chipsDepartamentosList');
        if (!container) return;
        container.innerHTML = '';

        // Contar quantos membros por departamento
        const counts = {};
        rawData.forEach(r => {
            const d = r.estruturas?.nome || 'Geral';
            counts[d] = (counts[d] || 0) + 1;
        });

        todosDepts.sort().forEach(d => {
            const cor = deptColors[d] || '#64748b';
            const qtd = counts[d] || 0;
            const chip = document.createElement('div');
            chip.setAttribute('data-dept', d);
            const ativo = deptsAtivos.has(d);
            chip.style.cssText = `
                padding: 6px 10px; font-size: 11px; font-weight: 600; border-radius: 8px;
                border: 1px solid ${ativo ? 'rgba(255,255,255,0.15)' : 'var(--border)'}; 
                background: ${ativo ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.25)'};
                color: ${ativo ? '#fff' : 'var(--text-muted)'}; cursor: pointer; 
                display: flex; align-items: center; justify-content: space-between;
                opacity: ${ativo ? '1' : '0.35'}; user-select: none; transition: all 0.2s;
            `;
            chip.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: ${cor}; flex-shrink: 0;"></span>
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 190px;">${d}</span>
                </div>
                <span style="font-size: 10px; padding: 1px 6px; border-radius: 999px; background: rgba(255,255,255,0.08);">${qtd}</span>
            `;
            chip.onclick = () => {
                if (deptsAtivos.has(d)) {
                    if (deptsAtivos.size === 1) {
                        rawData.forEach(v => deptsAtivos.add(v.estruturas?.nome || 'Geral'));
                    } else {
                        deptsAtivos.delete(d);
                    }
                } else {
                    deptsAtivos.add(d);
                }
                atualizarChipsUI();
                renderAtual();
            };
            container.appendChild(chip);
        });

        atualizarChipsUI();
    }

    function atualizarChipsUI() {
        const container = document.getElementById('chipsDepartamentosList');
        if (!container) return;
        const chips = container.children;
        for (let chip of chips) {
            const nome = chip.getAttribute('data-dept') || chip.textContent.trim();
            const ativo = deptsAtivos.has(nome);
            chip.style.opacity = ativo ? '1' : '0.35';
            chip.style.background = ativo ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.25)';
            chip.style.color = ativo ? '#fff' : 'var(--text-muted)';
            chip.style.borderColor = ativo ? 'rgba(255,255,255,0.15)' : 'var(--border)';
        }

        const countLabel = document.getElementById('filtroCountLabel');
        if (countLabel) {
            countLabel.textContent = `${deptsAtivos.size} de ${chips.length}`;
        }

        const badge = document.getElementById('badgeFiltroRelacoes');
        if (badge) {
            if (deptsAtivos.size < chips.length) {
                badge.style.display = 'inline-block';
                badge.textContent = `Filtro: ${deptsAtivos.size} ativos`;
            } else {
                badge.style.display = 'none';
            }
        }
    }

    function alternarModo(modo) {
        currentMode = modo;
        const btnSankey = document.getElementById('btnModoSankey');
        const btnCards = document.getElementById('btnModoCards');
        const btnRadial = document.getElementById('btnModoRadial');

        if (btnSankey) {
            btnSankey.style.background = modo === 'sankey' ? 'var(--primary)' : 'transparent';
            btnSankey.style.color = modo === 'sankey' ? '#fff' : 'var(--text-muted)';
        }
        if (btnCards) {
            btnCards.style.background = modo === 'cards' ? 'var(--primary)' : 'transparent';
            btnCards.style.color = modo === 'cards' ? '#fff' : 'var(--text-muted)';
        }
        if (btnRadial) {
            btnRadial.style.background = modo === 'radial' ? 'var(--primary)' : 'transparent';
            btnRadial.style.color = modo === 'radial' ? '#fff' : 'var(--text-muted)';
        }

        renderAtual();
    }

    function renderAtual() {
        const canvas = document.getElementById('canvasRelacoesArea');
        if (!canvas) return;

        if (currentMode === 'sankey') {
            renderSankey(canvas);
        } else if (currentMode === 'cards') {
            renderCards(canvas);
        } else if (currentMode === 'radial') {
            renderRadial(canvas);
        }
    }

    // ===============================================
    // RENDERIZADOR 1: SANKEY (Anti-Flicker + Click Lock)
    // ===============================================
    function renderSankey(canvas) {
        canvas.innerHTML = '';
        const width = canvas.clientWidth || 860;
        const height = 800; // Ampliado para 800px aproveitando o espaço do filtro lateral

        const filtrados = rawData.filter(item => {
            const dNome = item.estruturas?.nome || 'Geral';
            if (!deptsAtivos.has(dNome)) return false;

            if (termoBusca) {
                const pNome = (item.pessoas?.nome_curto || item.pessoas?.nome_completo || '').toLowerCase();
                const dNomeLow = dNome.toLowerCase();
                const papelLow = (item.perfil || '').toLowerCase();
                return pNome.includes(termoBusca) || dNomeLow.includes(termoBusca) || papelLow.includes(termoBusca);
            }
            return true;
        });

        if (filtrados.length === 0) {
            canvas.innerHTML = '<div style="color: var(--text-muted); padding: 40px; text-align: center;">Nenhum registro encontrado para este filtro.</div>';
            return;
        }

        const svg = d3.select(canvas).append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height]);

        const nodes = [];
        const links = [];
        const nodeMap = new Map();

        function getNode(name, category, color) {
            const key = `${category}:${name}`;
            if (!nodeMap.has(key)) {
                const idx = nodes.length;
                const obj = { id: key, name, category, color, index: idx };
                nodes.push(obj);
                nodeMap.set(key, obj);
            }
            return nodeMap.get(key);
        }

        filtrados.forEach(item => {
            const dNome = item.estruturas?.nome || 'Outros';
            const papel = item.perfil || 'Membro';
            const pNome = item.pessoas?.nome_curto || item.pessoas?.nome_completo || 'Sem Nome';
            const dColor = deptColors[dNome] || '#64748b';

            const deptNode = getNode(dNome, 'Departamento', dColor);
            const roleNode = getNode(`${dNome} - ${papel}`, 'Papel', dColor);
            const persNode = getNode(pNome, 'Pessoa', '#94a3b8');

            links.push({
                source: deptNode.index,
                target: roleNode.index,
                value: 1,
                color: dColor
            });

            links.push({
                source: roleNode.index,
                target: persNode.index,
                value: 1,
                color: dColor
            });
        });

        const linkAggr = new Map();
        links.forEach(l => {
            const key = `${l.source}->${l.target}`;
            if (!linkAggr.has(key)) linkAggr.set(key, { ...l, value: 0 });
            linkAggr.get(key).value += 1;
        });

        const sankeyData = {
            nodes: nodes.map(d => Object.assign({}, d)),
            links: Array.from(linkAggr.values())
        };

        const sankey = d3.sankey()
            .nodeWidth(16)
            .nodePadding(14)
            .extent([[18, 20], [width - 110, height - 20]]);

        const { nodes: graphNodes, links: graphLinks } = sankey(sankeyData);

        const linkGroup = svg.append("g")
            .attr("fill", "none")
            .selectAll("path")
            .data(graphLinks)
            .join("path")
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke", d => d.color || "var(--primary)")
            .attr("stroke-opacity", 0.3)
            .attr("stroke-width", d => Math.max(2, d.width))
            .style("cursor", "pointer")
            .style("transition", "stroke-opacity 0.15s ease");

        const nodeGroup = svg.append("g")
            .selectAll("g")
            .data(graphNodes)
            .join("g")
            .attr("transform", d => `translate(${d.x0},${d.y0})`)
            .style("cursor", "pointer");

        nodeGroup.append("rect")
            .attr("height", d => Math.max(6, d.y1 - d.y0))
            .attr("width", d => d.x1 - d.x0)
            .attr("fill", d => d.color)
            .attr("fill-opacity", 0.9)
            .attr("rx", 4)
            .attr("stroke", "rgba(255,255,255,0.2)")
            .attr("stroke-width", 1);

        nodeGroup.append("text")
            .attr("x", d => d.x0 < width / 2 ? (d.x1 - d.x0) + 8 : -8)
            .attr("y", d => (d.y1 - d.y0) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
            .text(d => d.name.replace(/^[^-]+ - /, ''))
            .style("fill", "var(--text-main)")
            .style("font-size", "11px")
            .style("font-weight", "600")
            .style("pointer-events", "none") // Impede flicker
            .style("user-select", "none");

        function aplicarDestaque(alvo) {
            if (!alvo) {
                linkGroup.style("stroke-opacity", 0.3);
                nodeGroup.select("rect").style("stroke", "rgba(255,255,255,0.2)").style("stroke-width", 1);
                return;
            }

            const linksConectados = new Set();
            const nosConectados = new Set([alvo]);

            graphLinks.forEach(l => {
                if (l.source === alvo || l.target === alvo) {
                    linksConectados.add(l);
                    nosConectados.add(l.source);
                    nosConectados.add(l.target);
                }
            });

            graphLinks.forEach(l => {
                if (nosConectados.has(l.source) || nosConectados.has(l.target)) {
                    linksConectados.add(l);
                    nosConectados.add(l.source);
                    nosConectados.add(l.target);
                }
            });

            linkGroup.style("stroke-opacity", l => linksConectados.has(l) ? 0.9 : 0.05);
            nodeGroup.select("rect")
                .style("stroke", n => nosConectados.has(n) ? "#60a5fa" : "rgba(255,255,255,0.1)")
                .style("stroke-width", n => nosConectados.has(n) ? 2 : 0.5);
        }

        nodeGroup
            .on("mouseenter", (event, d) => {
                if (!noTravado) {
                    aplicarDestaque(d);
                    atualizarInspector(d.name, d.category);
                }
            })
            .on("mouseleave", () => {
                if (!noTravado) aplicarDestaque(null);
            })
            .on("click", (event, d) => {
                event.stopPropagation();
                if (noTravado === d) {
                    noTravado = null;
                    aplicarDestaque(null);
                    atualizarInspector(d.name, d.category);
                } else {
                    noTravado = d;
                    aplicarDestaque(d);
                    atualizarInspector(d.name, d.category, '🔒 Foco Travado');
                }
            });

        linkGroup
            .on("mouseenter", (event, l) => {
                if (!noTravado) {
                    linkGroup.style("stroke-opacity", path => path === l ? 0.95 : 0.08);
                }
            })
            .on("mouseleave", () => {
                if (!noTravado) aplicarDestaque(null);
            });

        svg.on("click", () => {
            if (noTravado) {
                noTravado = null;
                aplicarDestaque(null);
            }
        });
    }

    // ===============================================
    // RENDERIZADOR 2: CARDS POR DEPARTAMENTO
    // ===============================================
    function renderCards(canvas) {
        canvas.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'padding: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; max-height: 600px; overflow-y: auto; width: 100%; box-sizing: border-box;';

        const depts = {};
        rawData.forEach(v => {
            const dNome = v.estruturas?.nome || 'Geral';
            if (!deptsAtivos.has(dNome)) return;

            if (termoBusca) {
                const pNome = (v.pessoas?.nome_curto || v.pessoas?.nome_completo || '').toLowerCase();
                const papelLow = (v.perfil || '').toLowerCase();
                if (!pNome.includes(termoBusca) && !papelLow.includes(termoBusca)) return;
            }

            if (!depts[dNome]) depts[dNome] = [];
            depts[dNome].push({
                nome: v.pessoas?.nome_curto || v.pessoas?.nome_completo || 'Sem Nome',
                papel: v.perfil || 'Membro'
            });
        });

        Object.keys(depts).forEach(dNome => {
            const card = document.createElement('div');
            card.style.cssText = 'background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px;';

            let membersHtml = depts[dNome].map(m => {
                const isLeader = m.papel.includes('Diretor') || m.papel.includes('Presidente') || m.papel.includes('Coordenador');
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 8px; background: ${isLeader ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)'}; border-radius: 6px; border: 1px solid ${isLeader ? 'rgba(59,130,246,0.3)' : 'var(--border)'};">
                        <span style="font-size: 12px; font-weight: ${isLeader ? '600' : '400'}; color: var(--text-main);">${m.nome}</span>
                        <span style="font-size: 11px; color: ${isLeader ? '#60a5fa' : 'var(--text-muted)'};">${m.papel}</span>
                    </div>
                `;
            }).join('');

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 6px;">
                    <h5 style="margin: 0; font-size: 13px; font-weight: 700; color: #60a5fa;">🏢 ${dNome}</h5>
                    <span style="font-size: 11px; background: rgba(255,255,255,0.05); padding: 1px 6px; border-radius: 999px; color: var(--text-muted);">${depts[dNome].length}</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    ${membersHtml}
                </div>
            `;
            wrapper.appendChild(card);
        });

        if (wrapper.children.length === 0) {
            canvas.innerHTML = '<div style="color: var(--text-muted); padding: 40px; text-align: center;">Nenhum membro encontrado.</div>';
        } else {
            canvas.appendChild(wrapper);
        }
    }

    // ===============================================
    // RENDERIZADOR 3: RADIAL (EDGE BUNDLING)
    // ===============================================
    function renderRadial(canvas) {
        canvas.innerHTML = '';
        const width = canvas.clientWidth || 800;
        const height = 620;
        const radius = Math.min(width, height) / 2 - 110;

        const svg = d3.select(canvas).append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-width / 2, -height / 2, width, height]);

        const rootHierarchy = { name: "SELA", children: [] };
        const deptMap = new Map();

        rawData.forEach(v => {
            const dNome = v.estruturas?.nome || 'Geral';
            if (!deptsAtivos.has(dNome)) return;
            const pNome = v.pessoas?.nome_curto || v.pessoas?.nome_completo || 'Sem Nome';

            if (!deptMap.has(dNome)) {
                const dNode = { name: dNome, children: [] };
                deptMap.set(dNome, dNode);
                rootHierarchy.children.push(dNode);
            }

            const dNode = deptMap.get(dNome);
            if (!dNode.children.find(c => c.name === pNome)) {
                dNode.children.push({ name: pNome, papel: v.perfil });
            }
        });

        if (rootHierarchy.children.length === 0) {
            canvas.innerHTML = '<div style="color: var(--text-muted); padding: 40px; text-align: center;">Nenhum departamento ativo.</div>';
            return;
        }

        const cluster = d3.cluster().size([360, radius]);
        const root = d3.hierarchy(rootHierarchy);
        cluster(root);

        const leaves = root.leaves();
        const map = new Map(leaves.map(d => [d.ancestors().reverse().map(a => a.data.name).join("."), d]));

        const crossLinks = [];
        const personOccurrences = new Map();

        rawData.forEach(v => {
            const pNome = v.pessoas?.nome_curto || v.pessoas?.nome_completo;
            const dNome = v.estruturas?.nome;
            if (!deptsAtivos.has(dNome)) return;
            if (!personOccurrences.has(pNome)) personOccurrences.set(pNome, []);
            personOccurrences.get(pNome).push(`SELA.${dNome}.${pNome}`);
        });

        personOccurrences.forEach((paths) => {
            if (paths.length > 1) {
                for (let i = 0; i < paths.length; i++) {
                    for (let j = i + 1; j < paths.length; j++) {
                        const s = map.get(paths[i]);
                        const t = map.get(paths[j]);
                        if (s && t) crossLinks.push(s.path(t));
                    }
                }
            }
        });

        const line = d3.lineRadial()
            .curve(d3.curveBundle.beta(0.85))
            .radius(d => d.y)
            .angle(d => d.x * Math.PI / 180);

        const link = svg.append("g")
            .selectAll("path")
            .data(crossLinks)
            .join("path")
            .attr("d", d => line(d))
            .attr("fill", "none")
            .attr("stroke", "#475569")
            .attr("stroke-opacity", 0.3)
            .attr("stroke-width", 1.5);

        svg.append("g")
            .selectAll("text")
            .data(leaves)
            .join("text")
            .attr("transform", d => `
                rotate(${d.x - 90})
                translate(${d.y + 10},0)
                ${d.x < 180 ? "" : "rotate(180)"}
            `)
            .attr("text-anchor", d => d.x < 180 ? "start" : "end")
            .text(d => `${d.data.name} (${d.parent.data.name.substring(0, 8)})`)
            .style("font-size", "10px")
            .style("fill", "var(--text-muted)")
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => {
                link.attr("stroke", l => (l[0] === d || l[l.length - 1] === d) ? "#3b82f6" : "#475569")
                    .attr("stroke-opacity", l => (l[0] === d || l[l.length - 1] === d) ? 0.9 : 0.1)
                    .attr("stroke-width", l => (l[0] === d || l[l.length - 1] === d) ? 2.5 : 1);
                atualizarInspector(d.data.name, 'Membro Radial', d.parent.data.name);
            })
            .on("mouseout", () => {
                link.attr("stroke", "#475569").attr("stroke-opacity", 0.3).attr("stroke-width", 1.5);
            });
    }

    function atualizarInspector(nome, category, extra = '') {
        const box = document.getElementById('relacoesInspectorBox');
        if (!box) return;

        const rels = rawData.filter(v => (v.pessoas?.nome_curto === nome || v.pessoas?.nome_completo === nome || v.estruturas?.nome === nome));

        let html = `<div style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">👤 ${nome}</div>`;
        html += `<div style="font-size: 12px; color: var(--primary); margin-bottom: 10px;">${category} ${extra ? `• <strong>${extra}</strong>` : ''}</div>`;

        if (rels.length > 0) {
            html += `<div style="font-size: 11px; color: var(--text-muted); margin-bottom: 6px; font-weight: 600;">ALOCAÇÕES REGISTRADAS:</div>`;
            rels.forEach(r => {
                const dept = r.estruturas?.nome || 'Geral';
                const perfil = r.perfil || 'Membro';
                html += `
                    <div style="margin-bottom: 6px; padding: 6px 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 6px;">
                        <div style="color: var(--text-main); font-size: 12px; font-weight: 600;">🏢 ${dept}</div>
                        <div style="color: #60a5fa; font-size: 11px;">Papel: ${perfil}</div>
                    </div>
                `;
            });
        } else {
            html += `<div style="font-size: 12px; color: var(--text-muted);">Estrutura ou departamento institucional.</div>`;
        }

        box.innerHTML = html;
    }

    return {
        init: init
    };
})();
