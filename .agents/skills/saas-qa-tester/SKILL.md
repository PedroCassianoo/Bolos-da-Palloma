---
name: saas-qa-tester
description: Gera e valida testes automatizados (unitários, integração e E2E) para garantir que novas funcionalidades não quebrem o sistema. Use sempre que um PR for aprovado no code-review ou uma nova feature for concluída.
---

# SaaS QA & Test Automation Skill

Sua função é proteger o produto final e a experiência do usuário. Ao receber um novo código ou funcionalidade, avalie o impacto e crie ou execute os testes apropriados, seguindo estas diretrizes:

## Árvore de Decisão (Decision Tree)

Avalie a natureza da mudança no código para escolher a abordagem correta:

- **Se a mudança afeta fluxos críticos (ex: *checkout*, planos de assinatura, autenticação):**
  - Priorize o desenho de testes *End-to-End* (E2E) que simulam a jornada real do usuário.
  - Verifique o payload de APIs externas (ex: Stripe, Sendgrid) para garantir que os contratos não foram quebrados.
- **Se a mudança for uma nova regra de negócio isolada (ex: cálculo de precificação ou limites de *tier*):**
  - Escreva testes unitários rigorosos cobrindo todos os *edge cases* matemáticos e condicionais lógicas.
- **Se a mudança for puramente de interface (UI):**
  - Garanta que os testes de componente verifiquem se os botões principais (*Call to Action*) estão renderizando e clicáveis.
- **Se precisar interagir com os scripts de teste do repositório (ex: Jest, Cypress, Playwright):**
  - Execute as ferramentas locais como caixas-pretas. Rode `npm run test --help` ou similar primeiro para entender a configuração atual antes de tentar rodar a suíte inteira.

## Checklist de Validação Focada no Negócio

1. **Caminho Feliz (Happy Path)**: O fluxo principal que o usuário paga para usar funciona sem atritos?
2. **Segurança de Receita**: Os bloqueios de *paywall*, rotas autenticadas e integrações financeiras continuam intactos após essa atualização?
3. **Tratamento de Exceções**: Se o usuário inserir dados inválidos, a aplicação mostra um erro claro que o orienta, ou a tela fica em branco?
4. **Performance Básica**: Existe algum loop infinito ou consulta pesada que possa encarecer o servidor ou frustrar o usuário?

## Como estruturar o seu feedback

- **Seja direto ao ponto**: Aponte exatamente qual teste falhou ou qual cenário não foi previsto.
- **Entregue a solução**: Não apenas aponte o bug. Gere o *snippet* de código com a correção sugerida ou o script do teste que o desenvolvedor deve adicionar.
- **Categorize o risco**: Destaque falhas com tags de severidade. Se um bug impede um usuário de finalizar uma compra, marque como **[CRÍTICO - BLOQUEIO DE RECEITA]**.
