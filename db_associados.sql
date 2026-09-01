-- =========================================================
-- BANCO DE DADOS: PORTAL DO ASSOCIADO
-- =========================================================

-- Tabela: Documentos Modelos (Templates)
-- Guarda os documentos oficiais (Estatuto) e modelos de termos (Termo de Voluntariado)
CREATE TABLE public.app_assoc_documentos_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'Leitura' (Estatuto) ou 'Assinatura' (Termo de Voluntariado)
    conteudo_markdown TEXT,
    link_externo VARCHAR(500),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: Arquivos / Assinaturas dos Usuários
-- Guarda quando um usuário enviou um documento assinado
CREATE TABLE public.app_assoc_documentos_usuarios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_id UUID REFERENCES public.app_assoc_documentos_templates(id) ON DELETE CASCADE,
    pessoa_id UUID REFERENCES public.pessoas(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Pendente', -- 'Pendente', 'Enviado', 'Aprovado'
    arquivo_url VARCHAR(1000), -- Link ou path do storage onde o PDF assinado está salvo
    data_envio TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, pessoa_id)
);

-- Habilitar RLS
ALTER TABLE public.app_assoc_documentos_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_assoc_documentos_usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Permitir leitura de templates" ON public.app_assoc_documentos_templates FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de templates" ON public.app_assoc_documentos_templates FOR ALL USING (true);

CREATE POLICY "Permitir leitura de docs_usuarios" ON public.app_assoc_documentos_usuarios FOR SELECT USING (true);
CREATE POLICY "Permitir manipulacao de docs_usuarios" ON public.app_assoc_documentos_usuarios FOR ALL USING (true);
