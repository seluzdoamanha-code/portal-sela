(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let estruturaId = null;

    document.addEventListener('DOMContentLoaded', () => {
        const urlParams = new URLSearchParams(window.location.search);
        estruturaId = urlParams.get('id');

        if (!estruturaId) {
            alert('ID da estrutura não fornecido.');
            window.history.back();
            return;
        }

        document.getElementById('btnBack').addEventListener('click', () => {
            window.location.href = `m_hub.html?id=${estruturaId}`;
        });

        // Eventos do Modal
        const btnNovo = document.getElementById('btnNovoEvento');
        const modal = document.getElementById('modalNovoEvento');
        const btnCancel = document.getElementById('btnCancelarEvento');
        const form = document.getElementById('formNovoEvento');

        btnNovo.addEventListener('click', () => {
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('active');
                document.getElementById('modalNovoEventoContent').classList.add('active');
            }, 10);
        });

        btnCancel.addEventListener('click', () => {
            fecharModal(modal);
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await salvarEvento(modal);
        });

        carregarAgenda();
    });

    function fecharModal(modal) {
        modal.classList.remove('active');
        document.getElementById('modalNovoEventoContent').classList.remove('active');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
        document.getElementById('formNovoEvento').reset();
    }

    async function carregarAgenda() {
        const listEl = document.getElementById('agendaList');
        listEl.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding-top: 40px;">Carregando...</p>';

        try {
            const { data, error } = await db
                .from('agenda')
                .select('*')
                .eq('estrutura_id', estruturaId)
                .gte('data_evento', new Date().toISOString().split('T')[0])
                .order('data_evento', { ascending: true })
                .order('hora_evento', { ascending: true });

            if (error) throw error;

            if (!data || data.length === 0) {
                listEl.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding-top: 40px;">Nenhum evento agendado.</p>';
                return;
            }

            let html = '';
            data.forEach(ev => {
                const [ano, mes, dia] = ev.data_evento.split('-');
                const dataFormatada = `${dia}/${mes}/${ano}`;
                
                const textoGcal = encodeURIComponent(ev.titulo || '');
                const dtGcal = ev.data_evento.replace(/-/g, '');
                let hrIni = '090000';
                let hrFim = '100000';
                if (ev.hora_evento) {
                    const limpo = ev.hora_evento.replace(/:/g, '');
                    hrIni = limpo.substring(0,6).padEnd(6, '0');
                    hrFim = (parseInt(hrIni.substring(0,2)) + 1).toString().padStart(2, '0') + hrIni.substring(2);
                }
                const datesGcal = `${dtGcal}T${hrIni}Z/${dtGcal}T${hrFim}Z`;
                const locGcal = encodeURIComponent(ev.local || '');
                const descGcal = encodeURIComponent(ev.descricao || '');
                const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${textoGcal}&dates=${datesGcal}&details=${descGcal}&location=${locGcal}&sf=true&output=xml`;

                html += `
                    <div class="agenda-card">
                        <button class="btn-delete" onclick="excluirEvento('${ev.id}')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                        <div class="agenda-date-badge">${dataFormatada}</div>
                        <div class="agenda-title">${ev.titulo}</div>
                        
                        ${ev.hora_evento ? `
                        <div class="agenda-detail">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            ${ev.hora_evento.substring(0,5)}
                        </div>` : ''}
                        
                        ${ev.local ? `
                        <div class="agenda-detail">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            ${ev.local}
                        </div>` : ''}
                        
                        ${ev.descricao ? `
                        <div class="agenda-detail" style="align-items: flex-start; margin-top: 8px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-top: 2px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            <span style="flex:1;">${ev.descricao}</span>
                        </div>` : ''}
                        
                        <div class="agenda-actions">
                            <a href="${gcalUrl}" target="_blank" class="btn-google">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                + Google Agenda
                            </a>
                        </div>
                    </div>
                `;
            });
            listEl.innerHTML = html;

        } catch (error) {
            console.error('Erro ao carregar agenda:', error);
            listEl.innerHTML = '<p style="text-align:center; color: #ef4444; padding-top: 40px;">Erro ao carregar a agenda.</p>';
        }
    }

    async function salvarEvento(modal) {
        const titulo = document.getElementById('evTitulo').value;
        const data = document.getElementById('evData').value;
        const hora = document.getElementById('evHora').value;
        const local = document.getElementById('evLocal').value;
        const desc = document.getElementById('evDesc').value;

        const btnSave = document.querySelector('.m-btn-save');
        const textoOriginal = btnSave.innerText;
        btnSave.innerText = 'Salvando...';
        btnSave.disabled = true;

        try {
            const { error } = await db.from('agenda').insert([{
                estrutura_id: estruturaId,
                titulo: titulo,
                data_evento: data,
                hora_evento: hora ? hora + ":00" : null,
                local: local,
                descricao: desc
            }]);

            if (error) throw error;
            
            fecharModal(modal);
            carregarAgenda();

            Swal.fire({
                toast: true,
                position: 'top',
                icon: 'success',
                title: 'Evento agendado!',
                showConfirmButton: false,
                timer: 2000,
                background: 'var(--bg-panel)',
                color: 'var(--text-main)'
            });

        } catch (error) {
            console.error('Erro ao salvar evento:', error);
            Swal.fire('Erro!', 'Não foi possível salvar o evento.', 'error');
        } finally {
            btnSave.innerText = textoOriginal;
            btnSave.disabled = false;
        }
    }

    window.excluirEvento = async function(id) {
        Swal.fire({
            title: 'Excluir Evento?',
            text: "Esta ação não pode ser desfeita.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#3b82f6',
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Cancelar',
            background: 'var(--bg-panel)',
            color: 'var(--text-main)'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const { error } = await db.from('agenda').delete().eq('id', id);
                    if (error) throw error;
                    
                    Swal.fire({
                        toast: true,
                        position: 'top',
                        icon: 'success',
                        title: 'Excluído',
                        showConfirmButton: false,
                        timer: 1500,
                        background: 'var(--bg-panel)',
                        color: 'var(--text-main)'
                    });
                    carregarAgenda();
                } catch (e) {
                    console.error('Erro ao excluir:', e);
                    Swal.fire('Erro!', 'Não foi possível excluir.', 'error');
                }
            }
        });
    }

})();
