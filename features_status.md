# Status de Implementação das Funcionalidades - Bolos da Palloma

Este documento consolida as funcionalidades do projeto **Bolos da Palloma** e o status visual de cada uma delas, servindo como guia estratégico para os planos de desenvolvimento e novos pedidos.

A regra de classificação é:
- **[Adicionado]**: O design, página ou função está visualmente adicionado, mesmo que ainda não seja funcional.
- **[Não Adicionado]**: Nem o design, nem a página ou a função foram criados ou adicionados.

---

## 1. Frente de Loja (Vendas e Aquisição)

| Funcionalidade | Status | Detalhes e Observações |
| :--- | :---: | :--- |
| **Cardápio Digital Transacional** | **[Adicionado]** | Interface mobile-first (`index.html` / `app.js`) com listagem de produtos, filtro por categorias, carrinho e checkout. *Nota: A dedução automática e em tempo real dos insumos e cruzamento de custos dinâmicos no fluxo do cliente final ainda não estão implementados.* |
| **Checkout Híbrido (Integração Local)** | **[Adicionado]** | Formulário de fechamento de pedido com métodos de entrega/retirada, escolha de pagamento e botão que monta a mensagem estruturada e redireciona para o WhatsApp da confeiteira. |
| **Motor de Escoamento ("Flash Sales")** | **[Adicionado]** *(Parcial)* | Existe apenas o botão de trigger visual *"Ativar Oferta Relâmpago"* na tela de receitas (Guardião de Margem). A interface de criação, gestão de ofertas temporárias e envio de disparos aos clientes ainda **não foi adicionada**. |

---

## 2. Retaguarda Operacional (Back-Office "Zero-Touch")

| Funcionalidade | Status | Detalhes e Observações |
| :--- | :---: | :--- |
| **Biblioteca Mestra de Insumos** | **[Adicionado]** | Tabela visualmente presente em `estoque.html` ("Lista Mestra de Insumos") contendo a listagem dos insumos cadastrados, categorias, estoque atual, níveis mínimos e preços. |
| **Conversor Automático de Medidas** | **[Não Adicionado]** | Embora a visualização de ingredientes em `receitas.html` liste a conversão lado a lado (ex: *250g / 2 xícaras*), não existe uma ferramenta ou painel que converta unidades (xícaras, colheres) para massa (gramas) durante o input de receitas pelo usuário. |
| **Entrada por OCR e XML (Câmera Inteligente)**| **[Adicionado] (Local Test)** | Botão flutuante (FAB) *"Escanear Nota Fiscal (OCR)"* no canto inferior de `estoque.html`. Integrado localmente via `estoque-ia.js` para simular escaneamento injetando texto mockado e acionando automaticamente a IA. |
| **Inventário por Comandos de Voz (VUI)** | **[Adicionado] (Local Test)** | Botão flutuante ciclável. O gatilho de 'Enviar' agora dispara evento global interceptado pela lógica de IA (`estoque-ia.js`), auto-preenchendo input de teste e submetendo o formulário do Estoque. |

---

## 3. Inteligência Preditiva ("Oceano Azul")

| Funcionalidade | Status | Detalhes e Observações |
| :--- | :---: | :--- |
| **Guardião de Margem Preditivo** | **[Adicionado]** | Card dedicado em `receitas.html` que mostra o status da receita (ex: *"Status: Crítico"*, *"Margem 12%"*) e fornece sugestões diretas de ação rápida para recuperação de margem (aumento de preço ou redução de porção). |
| **Gestão de Validade PEPS Proativa** | **[Adicionado]** | Seção *"Próximos do Vencimento"* em `estoque.html` alertando sobre ingredientes perto do vencimento com botão de *"Sugerir Receita"*. |
| **Simulador Preditivo de Catering** | **[Adicionado]** | Módulo de simulação em `pedidos.html` que desdobra quantidades e calcula o resumo de compras no atacado arredondado de acordo com a seleção de produtos. |
| **Análise de Capacidade Laboral** | **[Adicionado]** | Painel de *"Risco de Burnout"* integrado ao Simulador de Catering em `pedidos.html` que calcula o tempo de mão de obra necessário, indicando o percentual de capacidade alocada e alertando quando atinge o limite crítico (>90%). |

---

## 4. Experiência do Usuário (UX/UI B2B Simplificada)

| Funcionalidade | Status | Detalhes e Observações |
| :--- | :---: | :--- |
| **Painel Semafórico de Rentabilidade** | **[Não Adicionado]** | O dashboard não possui visualização de rentabilidade na tela inicial (`tab-inicio`) codificada nas três faixas de cores. Os badges de lucro da grid de receitas no painel usam estilo binário padrão (verde para positivo / vermelho para prejuízo) em vez da regra de 3 faixas (>40% verde, 20-39% amarelo, <20% vermelho). |
| **Narrativas Acionáveis em vez de Tabelas** | **[Adicionado]** | Implementado no painel inicial sob a forma de cards de *Alertas e Insights Operacionais* informando em texto direto o que deve ser feito (ex: *"Estoque crítico. Clique aqui para atualizar..."*). |
| **Arquitetura de Divulgação Progressiva** | **[Adicionado]** | A navegação no painel (`painel.html`) oculta o detalhamento de custos e cálculos avançados de precificação por trás de cliques em cards da home e seleções na listagem de bolos. |
