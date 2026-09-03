-- ==============================================================================
-- MIGRAÇÃO DEFINITIVA: 'Espiritual' -> 'Energético'
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Remover a restrição antiga que só permitia 'Fluídico' e 'Espiritual'
ALTER TABLE app_atendimento_tratamentos 
DROP CONSTRAINT IF EXISTS app_atendimento_tratamentos_tipo_check;

-- 2. Atualizar todos os registros existentes no banco de dados
UPDATE app_atendimento_tratamentos 
SET tipo = 'Energético' 
WHERE tipo = 'Espiritual';

-- 3. Criar a nova regra definitiva (mantendo 'Espiritual' apenas para compatibilidade retroativa)
ALTER TABLE app_atendimento_tratamentos 
ADD CONSTRAINT app_atendimento_tratamentos_tipo_check 
CHECK (tipo IN ('Fluídico', 'Energético', 'Espiritual'));

-- Confirmação
SELECT id, tipo, status, data_inicio FROM app_atendimento_tratamentos;
