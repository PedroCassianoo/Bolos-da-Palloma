# Relatório de Funcionalidades e Auditoria — versão_3.5_novas_funcionalidades

**Data:** 07/07/2026  
**Status Geral:** ✅ ATUALIZADO & IMPLANTADO  
**Versão:** `versão_3.5_novas_funcionalidades`

---

## 1. Escopo das Novas Funcionalidades (Versão 3.5)

Esta versão estende o sistema **Bolos da Palloma** adicionando capacidades avançadas de retaguarda operacional, inteligência preditiva e aprimoramento da interface B2B.

### 📋 Módulos Adicionados e Atualizados:

1. **Gestão de Estoque Inteligente (`estoque.html`):**
   * **Lista Mestra de Insumos:** Tabela com categorias, estoque atual, níveis mínimos de segurança e custo unitário.
   * **Entrada por OCR (FAB):** Botão flutuante para digitalização simulada de notas fiscais.
   * **Gestão PEPS Proativa:** Alertas dinâmicos de proximidade de validade dos insumos.
2. **Previsão e Margens (`receitas.html`):**
   * **Guardião de Margem Preditivo:** Indicador visual de margem crítica e sugestão direta de ações de precificação.
   * **Ofertas Relâmpago (Flash Sales):** Painel para criação de ofertas rápidas com base em insumos excedentes.
3. **Simulação e Planejamento (`pedidos.html`):**
   * **Simulador de Catering:** Desdobramento de insumos com arredondamento inteligente para compras no atacado.
   * **Análise de Capacidade Laboral:** Calculadora de tempo de trabalho necessário e alertas de sobrecarga crítica (risco de Burnout acima de 90%).
4. **Interface de Voz (VUI - `assets/js/vui.js`):**
   * Controle cíclico do microfone (Voz -> Ativo -> Enviar) com design escuro premium.
5. **Navegação Centralizada:**
   * Bottom bar responsiva em todas as páginas do back-office (`painel.html`, `estoque.html`, `receitas.html`, `pedidos.html`).

---

## 2. Status do Checklist de Segurança (Blindagem de Produção)

*   **Políticas de RLS no Supabase:** ✅ **Aprovado.** Todas as políticas ativas foram revisadas. O acesso público foi restrito e somente usuários autenticados (`authenticated`) possuem permissão de inserção, alteração ou leitura de dados sensíveis. O cliente anônimo está bloqueado para inserts diretos na tabela `vendas`.
*   **Vercel Serverless Function (`/api/register-sale.js`):** ✅ **Aprovado.** É a única rota pública permitida para inserção de pedidos de clientes do cardápio digital. O backend valida dados via whitelist, higieniza inputs e insere de forma segura utilizando a chave de serviço (`SUPABASE_SERVICE_ROLE_KEY`) guardada no ambiente da Vercel.
*   **Prevenção de XSS:** ✅ **Aprovado.** Todas as concatenações e exibições dinâmicas de texto no DOM utilizam o helper `escapeHTML`.
*   **Rate Limiting:** ✅ **Aprovado.** Login com bloqueio de 60 segundos após 5 erros e requisições da Serverless API limitadas a 5 requisições/minuto por IP.
*   **Headers de Resposta no `vercel.json`:** ✅ **Aprovado.** Proteção ativada contra Frame Injection (Clickjacking), XSS, MIME sniffing e HTTPS forçado via CSP/HSTS.
