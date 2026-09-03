window.abrirFormularioHistorico = function () {
    const container = document.getElementById('containerApps');

    container.innerHTML = `
        <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
            <div>
                <button onclick="carregarAppMiniApps()" class="btn btn-secondary" style="margin-bottom: 16px; font-size: 13px;">← Voltar aos Mini-Apps</button>
                <h2 style="font-size: 20px; color: #8b5cf6; margin-bottom: 8px;">🗃️ Inserir Ficha Antiga (Arquivo Morto)</h2>
                <p style="color: var(--text-muted); font-size: 14px;">Migração de histórico manual para o sistema.</p>
            </div>
        </div>

        <div style="background: rgba(139, 92, 246, 0.05); border: 1px solid var(--border); border-radius: 12px; padding: 24px; max-width: 800px;">
            <h3 style="color: var(--primary); margin-bottom: 16px;">1. Dados do Paciente</h3>
            <form id="formHistoricoWeb" style="display: flex; flex-direction: column; gap: 16px;" onsubmit="salvarFichaHistorica(event)">
                <div>
                    <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 6px;">Nome Completo *</label>
                    <input type="text" id="inHistNome" required class="input-field" placeholder="DIGITE O NOME COMPLETO" style="width: 100%; text-transform: uppercase;">
                </div>
                <div>
                    <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 6px;">Endereço Completo</label>
                    <input type="text" id="inHistEndereco" class="input-field" style="width: 100%; text-transform: uppercase;">
                </div>
                <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px;">
                        <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 6px;">Data de Nascimento</label>
                        <input type="date" id="inHistNasc" class="input-field" style="width: 100%; color: white;">
                    </div>
                    <div style="flex: 1; min-width: 200px;">
                        <label style="display: block; color: var(--text-muted); font-size: 13px; margin-bottom: 6px;">WhatsApp / Celular</label>
                        <input type="text" id="inHistWhats" class="input-field" style="width: 100%;">
                    </div>
                </div>

                <hr style="border: 0; border-top: 1px solid var(--border); margin: 16px 0;">
                
                <h3 style="color: #10b981; margin-bottom: 8px;">2. Atendimentos Fraternos (Passados)</h3>
                <div id="listaHistAten" style="display:flex; flex-direction:column; gap:8px;"></div>
                <button type="button" class="btn btn-secondary" onclick="addHistAtenRow()" style="width: fit-content; font-size: 12px;">+ Adicionar Sessão de Atendimento</button>

                <hr style="border: 0; border-top: 1px solid var(--border); margin: 16px 0;">

                <h3 style="color: #3b82f6; margin-bottom: 8px;">3. Tratamentos e Presenças (Passados)</h3>
                <div id="listaHistTrat" style="display:flex; flex-direction:column; gap:8px;"></div>
                <button type="button" class="btn btn-secondary" onclick="addHistTratRow()" style="width: fit-content; font-size: 12px;">+ Adicionar Presença em Tratamento</button>

                <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
                    <button type="submit" class="btn btn-primary" id="btnSaveHist" style="background: #8b5cf6;">Salvar Ficha Antiga</button>
                </div>
            </form>

            <div id="panelSuccessHist" style="display: none; text-align: center; padding: 40px 20px;">
                <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
                <h3 style="color: #10b981; margin-bottom: 12px; font-size: 20px;">Histórico Migrado com Sucesso!</h3>
                <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 24px;">O paciente e todos os seus registros antigos foram consolidados.</p>
                <button onclick="abrirFormularioHistorico()" class="btn btn-secondary">Digitar Próxima Ficha</button>
            </div>
        </div>
    `;

    // Add first rows
    addHistAtenRow();
};

window.addHistAtenRow = function() {
    const div = document.createElement('div');
    div.style.cssText = "display:flex; gap:8px; align-items:center; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px;";
    div.innerHTML = `
        <input type="date" class="input-field hist-aten-date" style="width: 150px; color:white;" required>
        <input type="text" class="input-field hist-aten-obs" placeholder="Resumo / Sintomas" style="flex:1;">
        <button type="button" class="btn" style="padding: 8px; background: transparent; color: #ef4444;" onclick="this.parentElement.remove()">X</button>
    `;
    document.getElementById('listaHistAten').appendChild(div);
};

window.addHistTratRow = function() {
    const div = document.createElement('div');
    div.style.cssText = "display:flex; gap:8px; align-items:center; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px;";
    div.innerHTML = `
        <input type="date" class="input-field hist-trat-date" style="width: 150px; color:white;" required>
        <select class="input-field hist-trat-tipo" style="width: 150px;">
            <option value="Fluídico">Fluídico</option>
            <option value="Energético">Energético</option>
        </select>
        <input type="text" class="input-field hist-trat-obs" placeholder="Observações (Opcional)" style="flex:1;">
        <button type="button" class="btn" style="padding: 8px; background: transparent; color: #ef4444;" onclick="this.parentElement.remove()">X</button>
    `;
    document.getElementById('listaHistTrat').appendChild(div);
};

window.salvarFichaHistorica = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveHist');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    const nome = document.getElementById('inHistNome').value;
    const endereco = document.getElementById('inHistEndereco').value;
    const nascimento = document.getElementById('inHistNasc').value || null;
    const whats = document.getElementById('inHistWhats').value;

    try {
        let criadoPor = 'Migração Manual';

        // 1. Criar ou Buscar Paciente
        let pacienteId;
        const { data: extPac } = await db.from('app_pacientes').select('id').ilike('nome_completo', nome).maybeSingle();
        if (extPac && extPac.id) {
            pacienteId = extPac.id;
        } else {
            const { data: novoPac, error: errPac } = await db.from('app_pacientes').insert([{
                nome_completo: nome,
                telefone: whats,
                data_nascimento: nascimento,
                endereco_completo: endereco
            }]).select().single();
            if (errPac) throw errPac;
            pacienteId = novoPac.id;
        }

        // 2. Criar uma Ficha "Âncora" para amarrar os históricos
        const { data: ficha, error: errFicha } = await db.from('app_atendimento_fraterno').insert([{
            paciente_id: pacienteId,
            nome_completo: nome,
            status: 'Concluído', // Ficha de arquivo morto não vai pra fila
            criado_por: criadoPor
        }]).select().single();
        if (errFicha) throw errFicha;

        // 3. Salvar Atendimentos (Sessões)
        const atenDates = document.querySelectorAll('.hist-aten-date');
        const atenObs = document.querySelectorAll('.hist-aten-obs');
        let sessoes = [];
        for (let i = 0; i < atenDates.length; i++) {
            if (atenDates[i].value) {
                sessoes.push({
                    fraterno_id: ficha.id,
                    data: atenDates[i].value,
                    sintomas_orientacoes: atenObs[i].value || 'Registro importado de ficha manual.',
                    // sem atendente_id especifico
                });
            }
        }
        if (sessoes.length > 0) {
            const { error: errS } = await db.from('app_atendimento_sessoes').insert(sessoes);
            if (errS) throw errS;
        }

        // 4. Salvar Tratamentos e Presenças
        // Para simplificar, agrupamos por tipo e criamos 1 tratamento para cada tipo, depois lançamos as presenças nele
        const tratDates = document.querySelectorAll('.hist-trat-date');
        const tratTipos = document.querySelectorAll('.hist-trat-tipo');
        const tratObs = document.querySelectorAll('.hist-trat-obs');
        
        let fluidicos = [];
        let espirituais = [];
        for (let i = 0; i < tratDates.length; i++) {
            if (tratDates[i].value) {
                const rec = { date: tratDates[i].value, obs: tratObs[i].value };
                if (tratTipos[i].value === 'Fluídico') fluidicos.push(rec);
                else espirituais.push(rec);
            }
        }

        async function createTrat(tipo, records) {
            if (records.length === 0) return;
            const { data: t, error: errT } = await db.from('app_atendimento_tratamentos').insert([{
                atendimento_id: ficha.id,
                tipo: tipo,
                status: 'Concluído',
                data_inicio: records[0].date
            }]).select().single();
            if (errT) throw errT;

            const presencas = records.map(r => ({
                tratamento_id: t.id,
                data: r.date,
                observacoes: r.obs || null
            }));
            const { error: errP } = await db.from('app_atendimento_presencas').insert(presencas);
            if (errP) throw errP;
        }

        await createTrat('Fluídico', fluidicos);
        await createTrat('Espiritual', espirituais);

        document.getElementById('formHistoricoWeb').style.display = 'none';
        document.getElementById('panelSuccessHist').style.display = 'block';

    } catch (e) {
        console.error(e);
        Swal.fire('Erro', 'Erro ao importar ficha: ' + e.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Salvar Ficha Antiga';
    }
};
