-- Remover as colunas obsoletas da tabela app_atendimento_fraterno
-- As informações passarão a ser consultadas exclusivamente via paciente_id na tabela pessoas.

ALTER TABLE app_atendimento_fraterno
DROP COLUMN IF EXISTS telefone,
DROP COLUMN IF EXISTS endereco_completo,
DROP COLUMN IF EXISTS data_nascimento;

-- Atualizar o comentário da tabela para refletir a mudança
COMMENT ON TABLE app_atendimento_fraterno IS 'Tabela de Atendimento Fraterno. Dados pessoais são referenciados via paciente_id na tabela pessoas. nome_completo mantido apenas para log/facilidade visual na tabela.';
