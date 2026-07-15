-- ==========================================================================
-- POLÍTICAS DE SEGURANÇA (RLS - Row Level Security) - Bolos da Palloma
-- ==========================================================================
-- Instruções:
-- 1. Acesse o dashboard do Supabase (https://app.supabase.com)
-- 2. Selecione o seu projeto ("Bolos da Palloma")
-- 3. Vá no menu lateral em "SQL Editor"
-- 4. Cole e execute este script completo
-- ==========================================================================

-- Habilita RLS nas tabelas, caso não esteja habilitado
ALTER TABLE "vendas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Custos & Preços" ENABLE ROW LEVEL SECURITY;

-- Limpa as políticas existentes (opcional, para evitar duplicatas ao reexecutar)
DROP POLICY IF EXISTS "Owner can delete own sales" ON "vendas";
DROP POLICY IF EXISTS "Public can insert limited data" ON "vendas";
DROP POLICY IF EXISTS "Authenticated users can update" ON "Custos & Preços";
DROP POLICY IF EXISTS "Service role can insert sales" ON "vendas";
DROP POLICY IF EXISTS "Authenticated users can view sales" ON "vendas";
DROP POLICY IF EXISTS "Authenticated users can view prices" ON "Custos & Preços";
DROP POLICY IF EXISTS "Public can view prices" ON "Custos & Preços";
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON "vendas";
DROP POLICY IF EXISTS "Authenticated users can update sales" ON "vendas";

-- ==========================================================================
-- TABELA: vendas
-- ==========================================================================

-- 1. Qualquer pessoa (public) NÃO PODE mais inserir diretamente, pois
--    migramos o insert público para o Vercel Serverless Function (service_role).
--    Portanto, NÃO CRIAMOS política de INSERT para 'anon'.

-- 2. A Service Role (nossa API backend) sempre contorna RLS por padrão,
--    mas garantimos que ela não precisa de regras adicionais.

-- 3. Apenas usuários logados no painel (authenticated) podem ver as vendas.
CREATE POLICY "Authenticated users can view sales" ON "vendas"
  FOR SELECT USING (auth.role() = 'authenticated');

-- 4. O Admin logado pode INSERIR uma venda manualmente pelo Painel
CREATE POLICY "Authenticated users can insert sales" ON "vendas"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. O Admin logado pode ATUALIZAR as vendas (se tivermos essa função)
CREATE POLICY "Authenticated users can update sales" ON "vendas"
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 6. Somente o dono do registro pode deletar vendas. 
-- NOTA: Como a tabela não parece ter 'user_id' por padrão na versão antiga,
-- se houver apenas um usuário admin global, limitamos a 'authenticated'.
CREATE POLICY "Owner can delete own sales" ON "vendas"
  FOR DELETE USING (auth.role() = 'authenticated');

-- ==========================================================================
-- TABELA: Custos & Preços
-- ==========================================================================

-- 1. Qualquer um (anon e authenticated) pode LER os preços para o cardápio funcionar
CREATE POLICY "Public can view prices" ON "Custos & Preços"
  FOR SELECT USING (true);

-- 2. Somente usuários autenticados (donos do painel) podem fazer UPSERT/UPDATE/DELETE
CREATE POLICY "Authenticated users can update" ON "Custos & Preços"
  FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================================================
-- TABELA: insumos (VULN-05 — CRÍTICO)
-- ==========================================================================
-- NOTA: Esta tabela foi adicionada na v3.5 sem políticas de RLS.
-- Sem estas políticas, a chave anon pública permite acesso total à tabela.
-- ==========================================================================

ALTER TABLE "insumos" ENABLE ROW LEVEL SECURITY;

-- Limpar políticas existentes
DROP POLICY IF EXISTS "Authenticated users can view insumos" ON "insumos";
DROP POLICY IF EXISTS "Authenticated users can insert insumos" ON "insumos";
DROP POLICY IF EXISTS "Authenticated users can update insumos" ON "insumos";
DROP POLICY IF EXISTS "Authenticated users can delete insumos" ON "insumos";

-- 1. Apenas usuários autenticados (admin do painel) podem LER insumos
CREATE POLICY "Authenticated users can view insumos" ON "insumos"
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Apenas autenticados podem INSERIR novos insumos
CREATE POLICY "Authenticated users can insert insumos" ON "insumos"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Apenas autenticados podem ATUALIZAR insumos
CREATE POLICY "Authenticated users can update insumos" ON "insumos"
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. Apenas autenticados podem DELETAR insumos
CREATE POLICY "Authenticated users can delete insumos" ON "insumos"
  FOR DELETE USING (auth.role() = 'authenticated');

-- ==========================================================================
-- CONSTRAINT: Quantidade não-negativa (VULN-08 — defesa em profundidade)
-- ==========================================================================
-- Impede que qualquer operação (via RLS ou service_role) grave estoque negativo.
-- Use DO $$ para ignorar erro se a constraint já existir.
-- ==========================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'quantidade_nao_negativa'
    ) THEN
        ALTER TABLE "insumos" ADD CONSTRAINT quantidade_nao_negativa CHECK (quantidade >= 0);
    END IF;
END $$;

-- ==========================================================================
-- TABELA DE AUDITORIA: estoque_log (VULN-12)
-- ==========================================================================

CREATE TABLE IF NOT EXISTS estoque_log (
    id BIGSERIAL PRIMARY KEY,
    insumo_id BIGINT REFERENCES insumos(id),
    acao TEXT NOT NULL,
    quantidade_alterada NUMERIC NOT NULL,
    quantidade_anterior NUMERIC NOT NULL,
    quantidade_nova NUMERIC NOT NULL,
    origem TEXT NOT NULL DEFAULT 'ia',
    input_original TEXT,
    usuario_id UUID,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE estoque_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view estoque_log" ON estoque_log;
DROP POLICY IF EXISTS "Authenticated users can insert estoque_log" ON estoque_log;

CREATE POLICY "Authenticated users can view estoque_log" ON estoque_log
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert estoque_log" ON estoque_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ==========================================================================
-- FUNÇÃO RPC: Atualização atômica de estoque (VULN-11)
-- ==========================================================================
-- Processa todas as movimentações em uma única transação.
-- Se qualquer operação falhar, TUDO faz rollback.
-- ==========================================================================

CREATE OR REPLACE FUNCTION atualizar_estoque(movimentacoes JSONB)
RETURNS JSONB AS $$
DECLARE
    item JSONB;
    current_qty NUMERIC;
    new_qty NUMERIC;
    item_id BIGINT;
    item_nome TEXT;
    results JSONB := '[]'::JSONB;
BEGIN
    -- Define a origem como 'ia' para a transação local, evitando log duplicado no trigger
    PERFORM set_config('app.current_origin', 'ia', true);

    FOR item IN SELECT * FROM jsonb_array_elements(movimentacoes)
    LOOP
        -- Busca o insumo por nome (fuzzy match limitado a 1 resultado)
        SELECT id, nome, quantidade INTO item_id, item_nome, current_qty
        FROM insumos
        WHERE nome ILIKE '%' || (item->>'produto') || '%'
        LIMIT 1;

        IF item_id IS NULL THEN
            results := results || jsonb_build_object(
                'produto', item->>'produto',
                'status', 'not_found'
            );
            CONTINUE;
        END IF;

        -- Calcula nova quantidade
        IF (item->>'acao') = 'adicionar' THEN
            new_qty := current_qty + (item->>'quantidade')::NUMERIC;
        ELSIF (item->>'acao') = 'remover' THEN
            new_qty := GREATEST(0, current_qty - (item->>'quantidade')::NUMERIC);
        ELSE
            results := results || jsonb_build_object(
                'produto', item->>'produto',
                'status', 'invalid_action'
            );
            CONTINUE;
        END IF;

        -- Atualiza por ID exato
        UPDATE insumos SET quantidade = new_qty WHERE id = item_id;

        -- Registra no log de auditoria
        INSERT INTO estoque_log (
            insumo_id, acao, quantidade_alterada,
            quantidade_anterior, quantidade_nova, origem, input_original
        ) VALUES (
            item_id, item->>'acao', (item->>'quantidade')::NUMERIC,
            current_qty, new_qty, 'ia', movimentacoes::TEXT
        );

        results := results || jsonb_build_object(
            'produto', item_nome,
            'status', 'updated',
            'old_qty', current_qty,
            'new_qty', new_qty
        );
    END LOOP;

    RETURN results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================================================
-- TRIGGER DE AUDITORIA: Auditoria automática de outras alterações (VULN-12)
-- ==========================================================================

CREATE OR REPLACE FUNCTION audit_insumos_changes()
RETURNS TRIGGER AS $$
DECLARE
    current_origin TEXT;
BEGIN
    -- Verifica se a mudança veio da RPC 'atualizar_estoque' (IA)
    BEGIN
        current_origin := current_setting('app.current_origin', true);
    EXCEPTION WHEN OTHERS THEN
        current_origin := NULL;
    END;

    IF (current_origin = 'ia') THEN
        -- Ignora, pois a RPC já registra o log detalhado
        RETURN NEW;
    END IF;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO estoque_log (insumo_id, acao, quantidade_alterada, quantidade_anterior, quantidade_nova, origem)
        VALUES (NEW.id, 'adicionar', NEW.quantidade, 0, NEW.quantidade, 'manual_insert');
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Só registra se a quantidade mudou
        IF (NEW.quantidade <> OLD.quantidade) THEN
            DECLARE
                diff NUMERIC := NEW.quantidade - OLD.quantidade;
                action_type TEXT := 'update';
            BEGIN
                IF (diff > 0) THEN
                    action_type := 'adicionar';
                ELSE
                    action_type := 'remover';
                    diff := ABS(diff);
                END IF;

                INSERT INTO estoque_log (insumo_id, acao, quantidade_alterada, quantidade_anterior, quantidade_nova, origem)
                VALUES (NEW.id, action_type, diff, OLD.quantidade, NEW.quantidade, 'manual_update');
            END;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO estoque_log (insumo_id, acao, quantidade_alterada, quantidade_anterior, quantidade_nova, origem)
        VALUES (OLD.id, 'remover', OLD.quantidade, OLD.quantidade, 0, 'manual_delete');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_insumos ON insumos;

CREATE TRIGGER trg_audit_insumos
AFTER INSERT OR UPDATE OR DELETE ON insumos
FOR EACH ROW
EXECUTE FUNCTION audit_insumos_changes();

-- ==========================================================================
-- FIM DO SCRIPT
-- ==========================================================================
