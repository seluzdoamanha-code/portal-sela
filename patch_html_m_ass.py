import re

with open('m_ass_familias.html', 'r') as f:
    content = f.read()

# Replace the contents of the mFormModal
new_modal = """
    <!-- Modal: Formulario Familia -->
    <div id="mFormModal" class="m-modal-overlay">
        <header class="m-header-nav">
            <button class="m-back-btn" onclick="fecharFormulario();">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div class="m-title" id="mFormTitle">Metadados da Família</div>
            <button id="btnSalvarFamilia" style="background:none; border:none; color:var(--primary); font-size:15px; font-weight:600; padding:8px; cursor:pointer;">Salvar</button>
        </header>
        <div class="m-modal-content">
            <input type="hidden" id="fId">
            <div style="background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 20px;">
                <div style="color: var(--text-muted); font-size: 13px; line-height: 1.4;">
                    Edite aqui apenas os dados específicos da Assistência Social. Para adicionar membros, gerencie os Vínculos na página principal de Pessoas.
                </div>
            </div>

            <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                <div class="m-form-group" style="flex: 1;">
                    <label>Código da Família (Ex: F-045)</label>
                    <input type="text" id="fCodigo" class="m-form-input">
                </div>
                <div class="m-form-group" style="flex: 1;">
                    <label>Status</label>
                    <select id="fStatus" class="m-form-input">
                        <option value="Ativa">Ativa</option>
                        <option value="Inativa">Inativa</option>
                        <option value="Suspensa">Suspensa</option>
                    </select>
                </div>
            </div>
            
            <div class="m-form-group" style="margin-bottom: 12px;">
                <label>Tipo de Assistência</label>
                <select id="fTipo" class="m-form-input">
                    <option value="Fixa/Assistida">Fixa / Assistida (Mensal)</option>
                    <option value="Temporária">Temporária / Emergencial</option>
                    <option value="Triagem">Em Triagem</option>
                </select>
            </div>
        </div>
    </div>
"""

content = re.sub(r'    <!-- Modal: Formulario Familia -->.*?    </div>\s*</div>\s*<script src="m_ass_familias\.js', new_modal.strip() + '\\n    <script src="m_ass_familias.js', content, flags=re.DOTALL)

with open('m_ass_familias.html', 'w') as f:
    f.write(content)
