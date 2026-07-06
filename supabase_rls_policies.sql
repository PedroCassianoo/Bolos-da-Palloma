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
-- FIM DO SCRIPT
-- ==========================================================================
