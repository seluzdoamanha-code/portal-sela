// Módulo Financeiro do Associado (Integrado em perfil.js e m_perfil.js)

const DICIONARIO_PIX = {
    10: "00020101021126640014br.gov.bcb.pix0114070321760001740224mensalidade associado 10520400005303986540510.005802BR5925Sociedade Espirita Luz Do6008BRASILIA62170513mensalidade10630400B4",
    20: "00020101021126640014br.gov.bcb.pix0114070321760001740224mensalidade associado 20520400005303986540520.005802BR5925Sociedade Espirita Luz Do6008BRASILIA62170513mensalidade20630485FD",
    25: "00020101021126640014br.gov.bcb.pix0114070321760001740224mensalidade associado 25520400005303986540525.005802BR5925Sociedade Espirita Luz Do6008BRASILIA62170513mensalidade25630434D5",
    30: "00020101021126640014br.gov.bcb.pix0114070321760001740224mensalidade associado 30520400005303986540530.005802BR5925Sociedade Espirita Luz Do6008BRASILIA62170513mensalidade3063040925",
    50: "00020101021126640014br.gov.bcb.pix0114070321760001740224mensalidade associado 50520400005303986540550.005802BR5925Sociedade Espirita Luz Do6008BRASILIA62170513mensalidade5063041396",
    100: "00020101021126650014br.gov.bcb.pix0114070321760001740225mensalidade associado 1005204000053039865406100.005802BR5925Sociedade Espirita Luz Do6008BRASILIA62180514mensalidade100630450B9",
    250: "00020101021126650014br.gov.bcb.pix0114070321760001740225mensalidade associado 2505204000053039865406250.005802BR5925Sociedade Espirita Luz Do6008BRASILIA62180514mensalidade25063045CA1"
};

const FIN_SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const FIN_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
const finDb = window.supabase.createClient(FIN_SUPABASE_URL, FIN_SUPABASE_KEY);

window.initFinanceiro = async function(pessoa, isMobile = false) {
    const containerId = isMobile ? 'mFinanceiroContainer' : 'financeiroContainer';
    const container = document.getElementById(containerId);
    
    if (!container) return;

    // Verifica se a pessoa sendo visualizada é o próprio usuário logado
    const userProfileStr = localStorage.getItem('sela_user_profile');
    if (!userProfileStr) return;
    
    const loggedInUser = JSON.parse(userProfileStr);
    
    // Se o perfil sendo acessado não tem e-mail ou é diferente do logado, esconde
    if (!pessoa.email || pessoa.email.toLowerCase() !== loggedInUser.email.toLowerCase()) {
        container.style.display = 'none';
        return;
    }

    if (!pessoa.cpf_cnpj) {
        // Logado, mas sem CPF cadastrado no perfil para vincular
        container.style.display = 'block';
        container.innerHTML = `
            <div class="${isMobile ? 'm-info-group' : 'card-perfil'}" style="border-left: 4px solid #3b82f6; padding: 16px;">
                <h3 class="secao-titulo" style="${isMobile ? 'margin: 0 0 12px 0;' : ''}">💰 Minhas Mensalidades</h3>
                <p style="color: var(--text-muted); font-size: 14px;">Você precisa cadastrar seu CPF no perfil para acessar seus boletos e histórico.</p>
            </div>
        `;
        return;
    }

    const cpfLimpo = pessoa.cpf_cnpj.replace(/\D/g, '');

    try {
        // Busca Configuração
        const { data: config, error: configError } = await finDb
            .from('fin_config_mensalidades')
            .select('*')
            .eq('cpf_cnpj', cpfLimpo)
            .single();

        if (configError || !config) {
            container.style.display = 'block';
            container.innerHTML = `
                <div class="${isMobile ? 'm-info-group' : 'card-perfil'}" style="border-left: 4px solid #3b82f6; padding: 16px;">
                    <h3 class="secao-titulo" style="${isMobile ? 'margin: 0 0 12px 0;' : ''}">💰 Minhas Mensalidades</h3>
                    <p style="color: var(--text-muted); font-size: 14px;">Você ainda não possui plano de mensalidade configurado. Procure a tesouraria.</p>
                </div>
            `;
            return;
        }

        // Busca Histórico de Mensalidades (tipo Saída? Entrada? No caso, é pagamento do associado para a casa, entao é receita/mensalidade)
        // O usuário disse: "identificamos que uma transação é especificamente uma MENSALIDADE e não... Usamos a coluna categoria = 'mensalidade'"
        const { data: transacoes, error: transError } = await finDb
            .from('fin_transacoes')
            .select('*')
            .eq('cpf', cpfLimpo)
            .ilike('categoria', 'mensalidade')
            .order('data_registro', { ascending: false });

        renderUI(container, config, transacoes || [], isMobile);

    } catch (err) {
        console.error("Erro no módulo financeiro:", err);
    }
};

function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function gerarMesAtual(diaVencimento) {
    const hoje = new Date();
    let mes = hoje.getMonth() + 1; // 1 a 12
    let ano = hoje.getFullYear();
    // Se hoje for maior que o dia de vencimento, a próxima já é o mês que vem
    if (hoje.getDate() > diaVencimento) {
        mes++;
        if (mes > 12) {
            mes = 1;
            ano++;
        }
    }
    const dataRef = new Date(ano, mes - 1, diaVencimento);
    return dataRef.toLocaleDateString('pt-BR');
}

function renderUI(container, config, transacoes, isMobile) {
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '24px';
    
    // Procura se tem transacao pendente ou se vamos basear o próximo pagamento no dia_vencimento
    const valorNum = parseInt(config.valor);
    const pixCopiaCola = DICIONARIO_PIX[valorNum];
    
    let htmlPagar = '';
    
    if (pixCopiaCola) {
        htmlPagar = `
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 12px; padding: 16px; margin-top: 16px;">
                <div style="display: flex; flex-direction: ${isMobile ? 'column' : 'row'}; gap: 16px; align-items: ${isMobile ? 'center' : 'flex-start'};">
                    <div id="qrcode" style="padding: 8px; background: white; border-radius: 8px; width: 120px; height: 120px; flex-shrink: 0;"></div>
                    <div style="flex: 1; text-align: ${isMobile ? 'center' : 'left'};">
                        <h4 style="margin: 0 0 8px 0; color: #047857; font-size: 16px;">Pague via PIX</h4>
                        <p style="margin: 0 0 12px 0; font-size: 13px; color: var(--text-main);">Abra o app do seu banco e escaneie o código ao lado, ou copie o código abaixo:</p>
                        
                        <div style="display: flex; gap: 8px; align-items: center; justify-content: ${isMobile ? 'center' : 'flex-start'};">
                            <input type="text" id="inpPixValue" value="${pixCopiaCola}" readonly style="flex: 1; padding: 8px 12px; border: 1px solid #10b981; border-radius: 6px; background: rgba(255,255,255,0.8); color: #047857; font-size: 12px; outline: none; text-overflow: ellipsis; max-width: ${isMobile ? '200px' : '100%'};" />
                            <button onclick="copiarPix()" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; white-space: nowrap;">Copiar</button>
                        </div>
                        <div id="msgPixCopiado" style="color: #10b981; font-size: 12px; margin-top: 8px; font-weight: 600; display: none;">Copiado com sucesso!</div>
                    </div>
                </div>
            </div>
        `;
    } else {
        htmlPagar = `
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 12px; padding: 16px; margin-top: 16px;">
                <p style="margin: 0; color: #b91c1c; font-size: 13px;">O PIX automático ainda não está configurado para o valor de ${formatarMoeda(config.valor)}. Por favor, solicite à tesouraria.</p>
            </div>
        `;
    }

    // Histórico de transações
    let htmlHistorico = '';
    if (transacoes.length === 0) {
        htmlHistorico = '<p style="color: var(--text-muted); font-size: 14px; text-align: center; padding: 24px;">Nenhuma contribuição encontrada no histórico.</p>';
    } else {
        htmlHistorico = '<div style="display: flex; flex-direction: column; gap: 12px;">';
        transacoes.forEach(t => {
            const isPago = t.status.toLowerCase() === 'pago';
            const statusColor = isPago ? '#10b981' : '#f59e0b';
            const statusBg = isPago ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)';
            
            htmlHistorico += `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-card);">
                    <div>
                        <div style="font-weight: 600; color: var(--text-main); font-size: 14px;">${t.competencia || 'Referência Omitida'}</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                            ${isPago ? 'Pago em: ' + (t.data_pagamento ? t.data_pagamento.split('-').reverse().join('/') : '-') : 'Aguardando Pagamento'}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 700; color: var(--text-main); font-size: 14px;">${formatarMoeda(t.valor)}</div>
                        <div style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-top: 6px; background: ${statusBg}; color: ${statusColor};">
                            ${t.status.toUpperCase()}
                        </div>
                    </div>
                </div>
            `;
        });
        htmlHistorico += '</div>';
    }

    container.innerHTML = `
        <div class="${isMobile ? 'm-info-group' : 'card-perfil'}" style="border-left: 4px solid #10b981; padding: ${isMobile ? '16px' : '24px'}; margin: ${isMobile ? '0 16px' : '0'};">
            <h3 class="secao-titulo" style="${isMobile ? 'margin: 0 0 16px 0;' : ''}">💰 Minhas Mensalidades</h3>
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">Valor Mensal</div>
                    <div style="font-size: 24px; font-weight: 700; color: var(--text-main);">${formatarMoeda(config.valor)}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">Próx. Vencimento</div>
                    <div style="font-size: 15px; font-weight: 600; color: var(--text-main);">${gerarMesAtual(config.dia_vencimento || 10)}</div>
                </div>
            </div>

            ${htmlPagar}
        </div>

        <div class="${isMobile ? 'm-info-group' : 'card-perfil'}" style="padding: ${isMobile ? '16px' : '24px'}; margin: ${isMobile ? '0 16px' : '0'};">
            <h3 class="secao-titulo" style="${isMobile ? 'margin: 0 0 16px 0;' : ''}">⏳ Histórico de Contribuições</h3>
            ${htmlHistorico}
        </div>
    `;

    // Renderiza o QRCode se existir o bloco do PIX
    if (pixCopiaCola && typeof QRCode !== 'undefined') {
        const qrContainer = document.getElementById('qrcode');
        if (qrContainer) {
            new QRCode(qrContainer, {
                text: pixCopiaCola,
                width: 104,
                height: 104,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.L
            });
        }
    }
}

window.copiarPix = function() {
    const input = document.getElementById('inpPixValue');
    input.select();
    input.setSelectionRange(0, 99999); // Para mobile
    document.execCommand("copy");
    
    const msg = document.getElementById('msgPixCopiado');
    msg.style.display = 'block';
    setTimeout(() => {
        msg.style.display = 'none';
    }, 2000);
};
