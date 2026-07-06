# Auditoria de Segurança — versão_3.0_seguranca_revisada

**Data da Auditoria:** 05/07/2026  
**Status Geral:** ✅ APROVADO (Todas as correções críticas aplicadas com sucesso)  
**Versão:** `versão_3.0_seguranca_revisada`

---

## 1. Histórico e Checklist de Correções

Abaixo está o status detalhado de cada item de segurança revisado e corrigido localmente para esta versão:

### Item 1: Políticas de RLS (Row Level Security) no Supabase
*   **Problema Anterior:** Existência de políticas redundantes que utilizavam `USING (true)` e `WITH CHECK (true)` sem validação de papel, o que permitia acesso irrestrito de leitura/escrita pública a usuários anônimos na tabela `vendas` e `Custos & Preços`.
*   **Solução Aplicada:** Habilitado RLS estrito nas tabelas. Criado o script `supabase_rls_policies.sql` para remover todas as políticas antigas vulneráveis e aplicar novas regras:
    *   **Tabela `Custos & Preços`:** Leitura pública permitida (`Public can view prices` via `USING (true)`) e gerenciamento restrito apenas a usuários autenticados (`TO authenticated`).
    *   **Tabela `vendas`:** Todas as operações (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) bloqueadas para usuários anônimos (`anon`) e restritas a administradores autenticados (`TO authenticated`). O cadastro de vendas via cardápio agora é feito pelo backend.
*   **Status:** ✅ **Corrigido e Auditado**

### Item 2: Prevenção contra XSS (Cross-Site Scripting)
*   **Problema Anterior:** Variáveis obtidas do banco de dados (ex: nome do produto, canal de venda, forma de pagamento, nome do cliente, etc.) eram inseridas diretamente no DOM por meio de `innerHTML` sem higienização, abrindo espaço para injeção de scripts maliciosos.
*   **Solução Aplicada:** Criação e aplicação sistemática de uma função de higienização de strings (`escapeHTML`) nos arquivos `painel.js` e `app.js` em todas as concatenações e renderizações de elementos HTML dinâmicos.
*   **Status:** ✅ **Corrigido**

### Item 3: Headers de Segurança no `vercel.json`
*   **Problema Anterior:** Falta de cabeçalhos de segurança HTTP na infraestrutura de hospedagem da Vercel.
*   **Solução Aplicada:** Configurado o arquivo `vercel.json` com políticas de segurança estritas:
    *   `Content-Security-Policy`: Restringe conexões e origens de scripts/estilos/fontes apenas para locais confiáveis (Supabase, Google Fonts, CDN da biblioteca jsDelivr para Supabase).
    *   `X-Frame-Options: DENY`: Previne ataques de Clickjacking.
    *   `Strict-Transport-Security` (HSTS): Força uso exclusivo de HTTPS.
    *   `X-Content-Type-Options: nosniff`: Protege contra injeção de tipos MIME.
    *   `Referrer-Policy`: Definido como `strict-origin-when-cross-origin`.
*   **Status:** ✅ **Corrigido**

### Item 4: Mecanismo de Rate Limiting
*   **Problema Anterior:** Ausência de limitação contra ataques de força bruta no formulário de login do painel e injeção em massa de vendas no endpoint de pedidos.
*   **Solução Aplicada:**
    *   **Autenticação (`painel.js`):** O formulário de login agora possui rate limiting que bloqueia o envio por 60 segundos após 5 tentativas incorretas.
    *   **Pedidos (`api/register-sale.js`):** A serverless function implementa limitação em memória por IP (máximo 5 pedidos por minuto por endereço de IP).
*   **Status:** ✅ **Corrigido**

### Item 5: Migração de Inserção de Vendas para Serverless Function
*   **Problema Anterior:** O frontend do cardápio digital realizava inserts diretamente na tabela `vendas` usando a chave pública anon do Supabase. Isso exigia RLS de inserção aberta e permitia o envio de dados corrompidos ou arbitrários.
*   **Solução Aplicada:** Criada a Serverless Function `/api/register-sale.js` no backend que processa pedidos. Ela valida estritamente os campos (whitelist de produtos cadastrados, teto de valor de venda, quantidade máxima por pedido e sanitização de campos de texto) e usa a chave privada de serviço (`SUPABASE_SERVICE_ROLE_KEY`) para inserir as vendas com segurança. O frontend agora faz `fetch` para este endpoint.
*   **Status:** ✅ **Corrigido**

### Item 6: Adequação à LGPD (Privacidade)
*   **Problema Anterior:** O aviso de privacidade no formulário de fechamento de pedidos em `index.html` informava que as informações não eram salvas, o que se tornou incorreto após a integração com o Supabase.
*   **Solução Aplicada:** Reescrito o aviso para atuar em conformidade com a LGPD, explicitando de forma clara quais dados são coletados (nome, data, método de entrega, endereço e itens), que eles são armazenados com segurança no Supabase com a finalidade exclusiva de processar/entregar encomendas, e informando o direito do usuário de solicitar a exclusão de seus dados via canal de WhatsApp.
*   **Status:** ✅ **Corrigido**

### Item 7: Bloqueio de Criação Pública de Administradores
*   **Problema Anterior:** O formulário de login contava com o botão "Criar Conta" que permitia a qualquer visitante cadastrar um novo administrador no banco.
*   **Solução Aplicada:** O botão de cadastro foi removido do arquivo `painel.html` e a lógica associada foi desativada no script `painel.js`. Novos administradores devem ser criados manualmente pelo painel administrativo do Supabase.
*   **Status:** ✅ **Corrigido**

---

## 2. Resumo de Alterações por Arquivo (Diff Resumido)

### index.html
- Adicionada inclusão do script centralizado de configuração `supabase-config.js`.
- Atualizado o rodapé informativo do formulário de pedidos para adequação explícita com a LGPD.

### app.js
- Removido código duplicado de inicialização direta do Supabase com credenciais expostas.
- Alterada a lógica de envio de pedidos: em vez de fazer insert direto na tabela `vendas`, o cardápio realiza uma chamada POST para `/api/register-sale` tratando erros de API.

### painel.html
- Inserção de `<meta name="robots" content="noindex, nofollow">` no cabeçalho para evitar indexação por mecanismos de buscas.
- Adicionada inclusão de `supabase-config.js` antes de `painel.js`.
- Remoção do botão físico `Criar Conta` (`#btn-signup`).

### painel.js
- Criação da função helper `escapeHTML` para tratamento de injeções maliciosas.
- Aplicação de `escapeHTML` em todas as renderizações dinâmicas da lista de vendas, detalhes de pedidos, e grid de bolos.
- Remoção da configuração em linha das credenciais do Supabase, agora utilizando `window.supabaseClient`.
- Implementação de rate limit local no login (máximo 5 erros geram bloqueio temporário de 60 segundos).
- Desativação do listener de signup.
- Tratamento de falhas de conexão com o Supabase: o painel mantém-se bloqueado em vez de exibir dados falsos locais.

### vercel.json
- Configuração de cabeçalhos de resposta HTTP para segurança (CSP, X-Frame-Options, STS, HSTS, MIME sniffing protection e Referrer Policy).

### api/register-sale.js [NOVO]
- Função serverless em Node.js para validação, higienização e inserção segura de pedidos via `SUPABASE_SERVICE_ROLE_KEY`. Contém rate-limiting integrado por IP (máximo 5 requisições por minuto).

### supabase-config.js [NOVO]
- Arquivo centralizado de inicialização do cliente Supabase para o frontend (`app.js` e `painel.js`).

### supabase_rls_policies.sql [NOVO]
- Script SQL para remoção de políticas vulneráveis antigas e criação de políticas RLS estritas de produção.
