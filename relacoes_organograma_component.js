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
        'Diretoria': '#d97706',               // Amber escurecido e vibrante
        'Comunicação': '#2563eb',             // Azul royal
        'Assistência Social': '#059669',       // Esmeralda/Verde
        'Espiritual': '#7c3aed',               // Roxo
        'Infância e Juventude': '#db2777',     // Rosa
        'Eventos': '#0891b2',                  // Ciano escuro
        'Doutrinário': '#9333ea',              // Púrpura
        'Biblioteca': '#4f46e5',               // Índigo
        'Atendimentos Espirituais': '#6d28d9', // Violeta
        'Estudo Joanna de Ângelis': '#0d9488', // Teal
        'Estudo Livro dos Espíritos': '#0284c7',// Sky Blue
        'Estudo Mediúnico': '#475569',         // Ardósia escuro
        'Evangelho no Lar': '#b45309',         // Âmbar escuro
        'Tesouraria': '#15803d',               // Verde Floresta
        'Financeiro': '#047857',               // Esmeralda escuro
        'Secretaria': '#4338ca'                // Índigo escuro
    };

    // Gera cor consistente para qualquer novo departamento não mapeado
    function obterCorDepartamento(nome) {
        if (deptColors[nome]) return deptColors[nome];
        let hash = 0;
        for (let i = 0; i < nome.length; i++) {
            hash = nome.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 65%, 45%)`;
    }

    async function init(targetElementId, supabaseClient) {
        containerEl = document.getElementById(targetElementId);
        if (!containerEl) return;

        containerEl.innerHTML = `
            <div class="rel-organograma-wrapper" style="display: flex; flex-direction: column; gap: 14px; width: 100%;">
                <!-- Barra Superior de Controle e Modos (compacta sem a faixa horizontal) -->
                <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                    <div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <h3 style="margin: 0; font-size: 16px; color: var(--text-main); font-weight: 700;">🏛️ Relações & Organograma Institucional</h3>
                            <span id="badgeFiltroRelacoes" style="display: none; font-size: 11px; padding: 2px 8px; border-radius: 6px; background: rgba(37, 99, 235, 0.1); color: #2563eb; border: 1px solid rgba(37, 99, 235, 0.25); font-weight: 600;"></span>
                        </div>
                        <p style="margin: 2px 0 0 0; font-size: 12px; color: var(--text-muted);">Mapeamento visual de membros, cargos e conexões entre departamentos da Casa.</p>
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <input type="text" id="buscaRelacoes" placeholder="🔎 Buscar pessoa ou cargo..." 
                            style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 6px 12px; color: var(--text-main); font-size: 12px; outline: none; width: 180px;">
                        
                        <div style="display: flex; background: #f1f5f9; border: 1px solid var(--border); border-radius: 8px; padding: 2px; gap: 2px;">
                            <button id="btnModoSankey" class="btn" style="padding: 5px 12px; font-size: 12px; border-radius: 6px; background: var(--primary); color: #fff; border: none;">🌊 Fluxo (Sankey)</button>
                            <button id="btnModoCards" class="btn" style="padding: 5px 12px; font-size: 12px; border-radius: 6px; background: transparent; color: var(--text-muted); border: none;">📊 Departamentos</button>
                            <button id="btnModoHalo" class="btn" style="padding: 5px 12px; font-size: 12px; border-radius: 6px; background: transparent; color: var(--text-muted); border: none;">🎯 Arcos Halo</button>
                            <button id="btnModoChord" class="btn" style="padding: 5px 12px; font-size: 12px; border-radius: 6px; background: transparent; color: var(--text-muted); border: none;">🌈 Chord</button>
                        </div>

                        <button id="btnResetRelacoes" class="btn" style="background: #fff; border: 1px solid var(--border); color: var(--text-main); padding: 6px 12px; font-size: 12px; border-radius: 8px; cursor: pointer;">↺ Ver Todos</button>
                    </div>
                </div>

                <!-- Grid Principal: Gráfico com Altura Ampliada + Coluna Lateral Direita com Filtros -->
                <div style="display: grid; grid-template-columns: 1fr 320px; gap: 16px; align-items: start;">
                    <!-- Canvas do Gráfico -->
                    <div id="canvasRelacoesArea" style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; min-height: 800px; height: 800px; position: relative; overflow: hidden; display: flex; align-items: flex-start; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                        <div style="color: var(--text-muted); font-size: 13px; margin: auto;">Carregando visualização institucional...</div>
                    </div>

                    <!-- Inspetor e Filtro Lateral Direito -->
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <!-- Bloco de Filtro de Departamentos Lateral -->
                        <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <h4 style="margin: 0; font-size: 12px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; font-weight: 700;">
                                    🏢 Filtrar Departamentos
                                </h4>
                                <span id="filtroCountLabel" style="font-size: 11px; color: var(--primary); font-weight: 700;">Todos</span>
                            </div>

                            <div style="display: flex; gap: 6px; margin-bottom: 10px;">
                                <button id="btnMarcarTodosDepts" style="flex: 1; padding: 5px 8px; background: #f8fafc; border: 1px solid var(--border); border-radius: 6px; color: var(--text-main); font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;">Todos</button>
                                <button id="btnApenasDiretoriaDepts" style="flex: 1; padding: 5px 8px; background: #f8fafc; border: 1px solid var(--border); border-radius: 6px; color: var(--text-main); font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;">Diretoria</button>
                            </div>

                            <div id="chipsDepartamentosList" class="custom-scrollbar" style="display: flex; flex-direction: column; gap: 6px; max-height: 330px; overflow-y: auto; padding-right: 2px;"></div>
                        </div>

                        <!-- Bloco de Detalhes da Seleção -->
                        <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                            <h4 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; font-weight: 700;">🔍 Detalhes da Seleção</h4>
                            <div id="relacoesInspectorBox" style="font-size: 13px; color: var(--text-muted); min-height: 180px;">
                                Passe o cursor ou clique sobre qualquer pessoa, cargo ou departamento para fixar o foco e ver histórico.
                            </div>
                        </div>

                        <!-- Bloco de Dica de Navegação -->
                        <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 12px; padding: 12px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
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
        document.getElementById('btnModoHalo').onclick = () => alternarModo('halo');
        document.getElementById('btnModoChord').onclick = () => alternarModo('chord');
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
            const cor = obterCorDepartamento(d);
            const qtd = counts[d] || 0;
            const chip = document.createElement('div');
            chip.setAttribute('data-dept', d);
            const ativo = deptsAtivos.has(d);
            chip.style.cssText = `
                padding: 6px 10px; font-size: 11.5px; font-weight: 600; border-radius: 8px;
                border: 1px solid ${ativo ? 'rgba(6, 52, 111, 0.2)' : 'var(--border)'}; 
                background: ${ativo ? 'rgba(6, 52, 111, 0.05)' : '#ffffff'};
                color: ${ativo ? 'var(--text-main)' : 'var(--text-muted)'}; cursor: pointer; 
                display: flex; align-items: center; justify-content: space-between;
                opacity: ${ativo ? '1' : '0.45'}; user-select: none; transition: all 0.15s ease;
            `;
            chip.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; overflow: hidden;">
                    <span style="width: 10px; height: 10px; border-radius: 50%; background: ${cor}; flex-shrink: 0; box-shadow: 0 0 0 1px rgba(0,0,0,0.06);"></span>
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 185px; color: ${ativo ? 'var(--text-main)' : 'var(--text-muted)'};">${d}</span>
                </div>
                <span style="font-size: 10.5px; font-weight: 700; padding: 1px 7px; border-radius: 999px; background: ${ativo ? 'rgba(6, 52, 111, 0.08)' : '#f1f5f9'}; color: ${ativo ? 'var(--primary)' : 'var(--text-muted)'};">${qtd}</span>
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
            chip.style.opacity = ativo ? '1' : '0.45';
            chip.style.background = ativo ? 'rgba(6, 52, 111, 0.05)' : '#ffffff';
            chip.style.borderColor = ativo ? 'rgba(6, 52, 111, 0.25)' : 'var(--border)';
            
            const labelSpan = chip.querySelector('span:nth-child(2)');
            if (labelSpan) {
                labelSpan.style.color = ativo ? 'var(--text-main)' : 'var(--text-muted)';
            }
            const countBadge = chip.querySelector('span:last-child');
            if (countBadge) {
                countBadge.style.background = ativo ? 'rgba(6, 52, 111, 0.08)' : '#f1f5f9';
                countBadge.style.color = ativo ? 'var(--primary)' : 'var(--text-muted)';
            }
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
        const btnHalo = document.getElementById('btnModoHalo');
        const btnChord = document.getElementById('btnModoChord');

        if (btnSankey) {
            btnSankey.style.background = modo === 'sankey' ? 'var(--primary)' : 'transparent';
            btnSankey.style.color = modo === 'sankey' ? '#fff' : 'var(--text-muted)';
        }
        if (btnCards) {
            btnCards.style.background = modo === 'cards' ? 'var(--primary)' : 'transparent';
            btnCards.style.color = modo === 'cards' ? '#fff' : 'var(--text-muted)';
        }
        if (btnHalo) {
            btnHalo.style.background = modo === 'halo' ? 'var(--primary)' : 'transparent';
            btnHalo.style.color = modo === 'halo' ? '#fff' : 'var(--text-muted)';
        }
        if (btnChord) {
            btnChord.style.background = modo === 'chord' ? 'var(--primary)' : 'transparent';
            btnChord.style.color = modo === 'chord' ? '#fff' : 'var(--text-muted)';
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
        } else if (currentMode === 'halo') {
            renderHalo(canvas);
        } else if (currentMode === 'chord') {
            renderChord(canvas);
        }
    }

    // ===============================================
    // RENDERIZADOR 1: SANKEY (Anti-Flicker + Click Lock)
    // ===============================================
    function renderSankey(canvas) {
        canvas.innerHTML = '';
        canvas.style.alignItems = 'center';
        canvas.style.justifyContent = 'center';
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
            const dColor = obterCorDepartamento(dNome);

            const deptNode = getNode(dNome, 'Departamento', dColor);
            const roleNode = getNode(`${dNome} - ${papel}`, 'Papel', dColor);
            const persNode = getNode(pNome, 'Pessoa', '#475569');

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
            .attr("fill-opacity", 0.95)
            .attr("rx", 4)
            .attr("stroke", "rgba(0, 0, 0, 0.08)")
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
                linkGroup.style("stroke-opacity", 0.35);
                nodeGroup.select("rect").style("stroke", "rgba(0, 0, 0, 0.08)").style("stroke-width", 1);
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
                .style("stroke", n => nosConectados.has(n) ? "#2563eb" : "rgba(0, 0, 0, 0.05)")
                .style("stroke-width", n => nosConectados.has(n) ? 2.5 : 1);
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
        canvas.style.alignItems = 'flex-start';
        canvas.style.justifyContent = 'flex-start';

        const wrapper = document.createElement('div');
        wrapper.className = 'custom-scrollbar';
        wrapper.style.cssText = 'padding: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; max-height: 800px; height: 100%; overflow-y: auto; width: 100%; box-sizing: border-box; align-content: start;';

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

        Object.keys(depts).sort().forEach(dNome => {
            const card = document.createElement('div');
            const cor = obterCorDepartamento(dNome);
            card.style.cssText = 'background: #ffffff; border: 1px solid var(--border); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); height: fit-content;';

            let membersHtml = depts[dNome].map(m => {
                const isLeader = m.papel.includes('Diretor') || m.papel.includes('Presidente') || m.papel.includes('Coordenador');
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: ${isLeader ? 'rgba(37,99,235,0.06)' : '#f8fafc'}; border-radius: 6px; border: 1px solid ${isLeader ? 'rgba(37,99,235,0.2)' : 'var(--border)'};">
                        <span style="font-size: 12px; font-weight: ${isLeader ? '700' : '500'}; color: var(--text-main);">${m.nome}</span>
                        <span style="font-size: 11px; font-weight: 600; color: ${isLeader ? '#2563eb' : 'var(--text-muted)'};">${m.papel}</span>
                    </div>
                `;
            }).join('');

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="width: 10px; height: 10px; border-radius: 50%; background: ${cor}; display: inline-block;"></span>
                        <h5 style="margin: 0; font-size: 13px; font-weight: 700; color: var(--text-main);">${dNome}</h5>
                    </div>
                    <span style="font-size: 11px; font-weight: 700; background: #f1f5f9; padding: 2px 8px; border-radius: 999px; color: var(--primary);">${depts[dNome].length}</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px; max-height: 280px; overflow-y: auto;" class="custom-scrollbar">
                    ${membersHtml}
                </div>
            `;
            wrapper.appendChild(card);
        });

        if (wrapper.children.length === 0) {
            canvas.style.alignItems = 'center';
            canvas.style.justifyContent = 'center';
            canvas.innerHTML = '<div style="color: var(--text-muted); padding: 40px; text-align: center;">Nenhum membro encontrado para o filtro selecionado.</div>';
        } else {
            canvas.appendChild(wrapper);
        }
    }

    // ===============================================
    // RENDERIZADOR 3: ARCOS HALO (EDGE BUNDLING COM SETORES COLORIDOS)
    // ===============================================
    function renderHalo(canvas) {
        canvas.innerHTML = '';
        canvas.style.alignItems = 'center';
        canvas.style.justifyContent = 'center';
        const width = canvas.clientWidth || 860;
        const height = 800;
        const radius = Math.min(width, height) / 2 - 130;

        const svg = d3.select(canvas).append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-width / 2, -height / 2, width, height]);

        const rootHierarchy = { name: "SELA", children: [] };
        const deptMap = new Map();

        rawData.forEach(v => {
            const dNome = v.estruturas?.nome || 'Geral';
            if (!deptsAtivos.has(dNome)) return;

            if (termoBusca) {
                const pNome = (v.pessoas?.nome_curto || v.pessoas?.nome_completo || '').toLowerCase();
                const dNomeLow = dNome.toLowerCase();
                const papelLow = (v.perfil || '').toLowerCase();
                if (!pNome.includes(termoBusca) && !dNomeLow.includes(termoBusca) && !papelLow.includes(termoBusca)) return;
            }

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
            canvas.innerHTML = '<div style="color: var(--text-muted); padding: 40px; text-align: center;">Nenhum departamento ativo para este filtro.</div>';
            return;
        }

        const cluster = d3.cluster().size([360, radius]);
        const root = d3.hierarchy(rootHierarchy);
        cluster(root);

        const leaves = root.leaves();
        const map = new Map(leaves.map(d => [d.ancestors().reverse().map(a => a.data.name).join("."), d]));

        // Grupos de departamentos para os arcos Halo
        const deptsGroups = root.children.map(d => {
            const childLeaves = d.leaves();
            const angles = childLeaves.map(l => l.x);
            const minAngle = Math.min(...angles) - (360 / Math.max(1, leaves.length) / 2);
            const maxAngle = Math.max(...angles) + (360 / Math.max(1, leaves.length) / 2);
            return {
                name: d.data.name,
                minAngle: minAngle * Math.PI / 180,
                maxAngle: maxAngle * Math.PI / 180,
                color: obterCorDepartamento(d.data.name),
                count: childLeaves.length
            };
        });

        // 1. Arcos Halo Envolventes
        const arcGen = d3.arc()
            .innerRadius(radius + 18)
            .outerRadius(radius + 28)
            .cornerRadius(5);

        const haloGroup = svg.append("g");
        haloGroup.selectAll("path")
            .data(deptsGroups)
            .join("path")
            .attr("d", d => arcGen({ startAngle: d.minAngle, endAngle: d.maxAngle }))
            .attr("fill", d => d.color)
            .attr("fill-opacity", 0.85)
            .attr("stroke", d => d.color)
            .attr("stroke-width", 1.5)
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => {
                svg.selectAll(".link-halo").style("stroke-opacity", l => l.dept === d.name ? 0.95 : 0.05);
                atualizarInspector(d.name, 'Departamento (Halo)', `${d.count} membros`);
            })
            .on("mouseout", () => {
                svg.selectAll(".link-halo").style("stroke-opacity", 0.35);
            });

        // Nomes dos departamentos nos arcos Halo
        haloGroup.selectAll("text")
            .data(deptsGroups)
            .join("text")
            .attr("transform", d => {
                const mid = (d.minAngle + d.maxAngle) / 2;
                const r = radius + 46;
                const x = Math.sin(mid) * r;
                const y = -Math.cos(mid) * r;
                return `translate(${x},${y})`;
            })
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .text(d => d.name)
            .style("fill", d => d.color)
            .style("font-size", "11px")
            .style("font-weight", "700");

        // 2. Feixes de conexões cruzadas
        const crossLinks = [];
        const personOccurrences = new Map();

        rawData.forEach(v => {
            const dNome = v.estruturas?.nome;
            if (!deptsAtivos.has(dNome)) return;
            const pNome = v.pessoas?.nome_curto || v.pessoas?.nome_completo;
            if (!personOccurrences.has(pNome)) personOccurrences.set(pNome, []);
            personOccurrences.get(pNome).push({ path: `SELA.${dNome}.${pNome}`, dept: dNome });
        });

        personOccurrences.forEach((entries) => {
            if (entries.length > 1) {
                for (let i = 0; i < entries.length; i++) {
                    for (let j = i + 1; j < entries.length; j++) {
                        const s = map.get(entries[i].path);
                        const t = map.get(entries[j].path);
                        if (s && t) {
                            crossLinks.push({
                                pathData: s.path(t),
                                dept: entries[i].dept,
                                color: obterCorDepartamento(entries[i].dept),
                                sourceNode: s,
                                targetNode: t
                            });
                        }
                    }
                }
            }
        });

        const line = d3.lineRadial()
            .curve(d3.curveBundle.beta(0.85))
            .radius(d => d.y)
            .angle(d => d.x * Math.PI / 180);

        svg.append("g")
            .selectAll("path")
            .data(crossLinks)
            .join("path")
            .attr("class", "link-halo")
            .attr("d", d => line(d.pathData))
            .attr("fill", "none")
            .attr("stroke", d => d.color)
            .attr("stroke-opacity", 0.35)
            .attr("stroke-width", 2);

        // 3. Nós circulares com dot colorido e rótulo
        const nodeGroup = svg.append("g")
            .selectAll("g")
            .data(leaves)
            .join("g")
            .attr("transform", d => `
                rotate(${d.x - 90})
                translate(${d.y},0)
            `)
            .style("cursor", "pointer");

        nodeGroup.append("circle")
            .attr("r", 4.5)
            .attr("fill", d => obterCorDepartamento(d.parent.data.name))
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 1.5);

        nodeGroup.append("text")
            .attr("transform", d => `
                translate(${d.x < 180 ? 9 : -9}, 0)
                ${d.x < 180 ? "" : "rotate(180)"}
            `)
            .attr("text-anchor", d => d.x < 180 ? "start" : "end")
            .attr("dy", "0.35em")
            .text(d => d.data.name)
            .style("font-size", "10.5px")
            .style("font-weight", "600")
            .style("fill", "var(--text-main)")
            .style("user-select", "none");

        nodeGroup
            .on("mouseenter", (event, d) => {
                svg.selectAll(".link-halo").style("stroke-opacity", l => (l.sourceNode === d || l.targetNode === d) ? 0.95 : 0.05);
                atualizarInspector(d.data.name, 'Membro (Halo)', d.parent.data.name);
            })
            .on("mouseleave", () => {
                svg.selectAll(".link-halo").style("stroke-opacity", 0.35);
            });
    }

    // ===============================================
    // RENDERIZADOR 4: CHORD / CIRCOS (FITAS DE FLUXO RADIAL)
    // ===============================================
    function renderChord(canvas) {
        canvas.innerHTML = '';
        canvas.style.alignItems = 'center';
        canvas.style.justifyContent = 'center';
        const width = canvas.clientWidth || 860;
        const height = 800;
        const outerRadius = Math.min(width, height) * 0.5 - 120;
        const innerRadius = outerRadius - 26;

        const deptsList = Array.from(deptsAtivos).sort();
        if (deptsList.length === 0) {
            canvas.innerHTML = '<div style="color: var(--text-muted); padding: 40px; text-align: center;">Selecione ao menos um departamento para o Chord.</div>';
            return;
        }

        const svg = d3.select(canvas).append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-width / 2, -height / 2, width, height]);

        const n = deptsList.length;
        const matrix = Array.from({ length: n }, () => new Array(n).fill(0));

        const pMap = new Map();
        rawData.forEach(v => {
            const dNome = v.estruturas?.nome;
            if (!deptsAtivos.has(dNome)) return;
            const pNome = v.pessoas?.nome_curto || v.pessoas?.nome_completo;
            if (!pMap.has(pNome)) pMap.set(pNome, new Set());
            pMap.get(pNome).add(dNome);
        });

        pMap.forEach(dSet => {
            const arr = Array.from(dSet);
            if (arr.length === 1) {
                const i = deptsList.indexOf(arr[0]);
                if (i >= 0) matrix[i][i] += 1;
            } else {
                for (let a = 0; a < arr.length; a++) {
                    for (let b = a + 1; b < arr.length; b++) {
                        const i = deptsList.indexOf(arr[a]);
                        const j = deptsList.indexOf(arr[b]);
                        if (i >= 0 && j >= 0) {
                            matrix[i][j] += 1;
                            matrix[j][i] += 1;
                        }
                    }
                }
            }
        });

        const chord = d3.chord()
            .padAngle(0.06)
            .sortSubgroups(d3.descending);

        const chords = chord(matrix);

        const arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius)
            .cornerRadius(4);

        const ribbon = d3.ribbon()
            .radius(innerRadius);

        // Anéis dos Departamentos
        const group = svg.append("g")
            .selectAll("g")
            .data(chords.groups)
            .join("g");

        group.append("path")
            .attr("fill", d => obterCorDepartamento(deptsList[d.index]))
            .attr("stroke", "rgba(0,0,0,0.08)")
            .attr("d", arc)
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => {
                ribbonsEl.style("opacity", r => (r.source.index === d.index || r.target.index === d.index) ? 0.9 : 0.05);
                atualizarInspector(deptsList[d.index], 'Departamento (Chord)', `${d.value} conexões`);
            })
            .on("mouseout", () => ribbonsEl.style("opacity", 0.65));

        group.append("text")
            .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
            .attr("dy", "0.35em")
            .attr("transform", d => `
                rotate(${(d.angle * 180 / Math.PI) - 90})
                translate(${outerRadius + 14})
                ${d.angle > Math.PI ? "rotate(180)" : ""}
            `)
            .attr("text-anchor", d => d.angle > Math.PI ? "end" : "start")
            .text(d => deptsList[d.index])
            .style("font-size", "11.5px")
            .style("font-weight", "700")
            .style("fill", d => obterCorDepartamento(deptsList[d.index]));

        // Fitas (Ribbons)
        const ribbonsEl = svg.append("g")
            .attr("fill-opacity", 0.65)
            .selectAll("path")
            .data(chords)
            .join("path")
            .attr("d", ribbon)
            .attr("fill", d => obterCorDepartamento(deptsList[d.source.index]))
            .attr("stroke", "rgba(0,0,0,0.06)")
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => {
                ribbonsEl.style("opacity", r => r === d ? 1 : 0.1);
                const d1 = deptsList[d.source.index];
                const d2 = deptsList[d.target.index];
                atualizarInspector(`${d1} ⇄ ${d2}`, 'Fita Interdepartamental', `${d.source.value} membros em comum`);
            })
            .on("mouseout", () => ribbonsEl.style("opacity", 0.65));
    }

    function atualizarInspector(nome, category, extra = '') {
        const box = document.getElementById('relacoesInspectorBox');
        if (!box) return;

        const rels = rawData.filter(v => (v.pessoas?.nome_curto === nome || v.pessoas?.nome_completo === nome || v.estruturas?.nome === nome));

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div>
                    <span style="font-size: 11px; font-weight: 700; color: var(--primary); text-transform: uppercase;">${category}</span>
                    <div style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-top: 2px;">${nome}</div>
                </div>
                ${extra ? `<span style="font-size: 10.5px; background: rgba(37,99,235,0.1); color: #2563eb; border: 1px solid rgba(37,99,235,0.25); padding: 2px 7px; border-radius: 4px; font-weight: 600;">${extra}</span>` : ''}
            </div>
        `;

        if (rels.length > 0) {
            html += `<div style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${rels.length} Alocação(ões) Registrada(s):</div>`;
            html += `<div style="display: flex; flex-direction: column; gap: 6px; max-height: 220px; overflow-y: auto;" class="custom-scrollbar">`;
            rels.forEach(r => {
                const dept = r.estruturas?.nome || 'Geral';
                const perfil = r.perfil || 'Membro';
                const cor = obterCorDepartamento(dept);
                html += `
                    <div style="padding: 8px 10px; background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; font-size: 12px;">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; color: var(--text-main);">
                                <span style="width: 7px; height: 7px; border-radius: 50%; background: ${cor}; display: inline-block;"></span>
                                <span>${dept}</span>
                            </div>
                            <span style="font-size: 11px; font-weight: 600; color: #2563eb; background: rgba(37,99,235,0.08); padding: 1px 6px; border-radius: 4px;">${perfil}</span>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        } else {
            html += `<div style="font-size: 12px; color: var(--text-muted); line-height: 1.5;">Estrutura ou departamento institucional.</div>`;
        }

        box.innerHTML = html;
    }

    return {
        init: init
    };
})();
