-- Tabela de Sessões de Atendimento Fraterno (Múltiplas Fichas)
CREATE TABLE IF NOT EXISTS app_atendimento_sessoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atendimento_id UUID REFERENCES app_atendimento_fraterno(id) ON DELETE CASCADE,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    atendente_id UUID REFERENCES pessoas(id) ON DELETE SET NULL,
    sintomas_orientacoes TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabela de Prescrição de Tratamentos (Fluídico e/ou Energético/Espiritual)
CREATE TABLE IF NOT EXISTS app_atendimento_tratamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atendimento_id UUID REFERENCES app_atendimento_fraterno(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('Fluídico', 'Espiritual')),
    status TEXT NOT NULL CHECK (status IN ('Ativo', 'Concluído', 'Suspenso')) DEFAULT 'Ativo',
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    data_fim DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabela de Registro de Presenças/Sessões de Tratamentos
CREATE TABLE IF NOT EXISTS app_atendimento_presencas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tratamento_id UUID REFERENCES app_atendimento_tratamentos(id) ON DELETE CASCADE,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS para todas as tabelas
ALTER TABLE app_atendimento_sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_atendimento_tratamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_atendimento_presencas ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para testes e uso integrado no Portal SELA
CREATE POLICY "Permitir leitura pública de app_atendimento_sessoes" ON app_atendimento_sessoes FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública de app_atendimento_sessoes" ON app_atendimento_sessoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir update público de app_atendimento_sessoes" ON app_atendimento_sessoes FOR UPDATE USING (true);
CREATE POLICY "Permitir delete público de app_atendimento_sessoes" ON app_atendimento_sessoes FOR DELETE USING (true);

CREATE POLICY "Permitir leitura pública de app_atendimento_tratamentos" ON app_atendimento_tratamentos FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública de app_atendimento_tratamentos" ON app_atendimento_tratamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir update público de app_atendimento_tratamentos" ON app_atendimento_tratamentos FOR UPDATE USING (true);
CREATE POLICY "Permitir delete público de app_atendimento_tratamentos" ON app_atendimento_tratamentos FOR DELETE USING (true);

CREATE POLICY "Permitir leitura pública de app_atendimento_presencas" ON app_atendimento_presencas FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública de app_atendimento_presencas" ON app_atendimento_presencas FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir update público de app_atendimento_presencas" ON app_atendimento_presencas FOR UPDATE USING (true);
CREATE POLICY "Permitir delete público de app_atendimento_presencas" ON app_atendimento_presencas FOR DELETE USING (true);
