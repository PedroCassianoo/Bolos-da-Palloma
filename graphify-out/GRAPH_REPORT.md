# Graph Report - Bolos da Palloma  (2026-07-15)

## Corpus Check
- 34 files · ~189,344 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 302 nodes · 404 edges · 44 communities (38 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aa3766ea`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Client Digital Menu (app.js)
- Back-Office Inventory Management
- Security Audit & Supabase Policies
- AI-Assisted Stock Voice Interface (estoque-ia.js)
- Security & Version Revision (3.0)
- Local LLM Daemon (Ollama Server)
- Project Dependencies & Manifests (package.json)
- Voice Interface Mobile Testing
- Inventory API Endpoint
- Sale Registration API Endpoint
- Deploy Sync Skill & Scripts
- Project Architecture & Structure (README)
- Business & Features Status Report
- SaaS QA & Test Automation System
- Version 3.5 Functional Specifications
- Code Review Guidelines
- Deploy Sync Shell Script
- Vercel Configurations (vercel.json)
- Graphify Rule System
- Graphify Workflow Automation
- Robots.txt Indexing Control
- ui.js
- supabase_rls_policies.sql
- cart.js
- estoque-ia.js
- test-whisper-integration.js

## God Nodes (most connected - your core abstractions)
1. `2. Resumo de Alterações por Arquivo (Diff Resumido)` - 14 edges
2. `2. Resumo de Alterações por Arquivo (Diff Resumido)` - 10 edges
3. `1. Histórico e Checklist de Correções` - 9 edges
4. `1. Histórico e Checklist de Correções` - 9 edges
5. `PRODUCTS` - 8 edges
6. `formatCurrency()` - 7 edges
7. `updateTotalDiaCard()` - 7 edges
8. `renderDailySales()` - 7 edges
9. `validateSaleItem()` - 6 edges
10. `showToast()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `loadLocalPrices()` --references--> `PRODUCTS`  [EXTRACTED]
  app.js → assets/js/products.js
- `loadRemotePrices()` --references--> `PRODUCTS`  [EXTRACTED]
  app.js → assets/js/products.js
- `animateFlyingCake()` --references--> `PRODUCTS`  [EXTRACTED]
  assets/js/animations.js → assets/js/products.js
- `sendOrderToWhatsApp()` --references--> `PRODUCTS`  [EXTRACTED]
  assets/js/checkout.js → assets/js/products.js
- `updateCartUI()` --references--> `PRODUCTS`  [EXTRACTED]
  assets/js/ui.js → assets/js/products.js

## Import Cycles
- None detected.

## Communities (44 total, 6 thin omitted)

### Community 0 - "Client Digital Menu (app.js)"
Cohesion: 0.12
Nodes (8): loadLocalPrices(), loadRemotePrices(), animateFlyingCake(), sendOrderToWhatsApp(), PRODUCTS, updateCartUI(), updateDOMPrices(), updateProductActionUI()

### Community 1 - "Back-Office Inventory Management"
Cohesion: 0.17
Nodes (24): balanceSliders(), calculateCapacity(), calculateCostAndPrice(), closeQuickSaleModal(), deleteSale(), escapeHTML(), formatCurrency(), formatCurrencyWhole() (+16 more)

### Community 2 - "Security Audit & Supabase Policies"
Cohesion: 0.16
Nodes (23): 1. Histórico e Checklist de Correções, 2. Resumo de Alterações por Arquivo (Diff Resumido), 3. Políticas Ativas Pós-Auditoria (pg_policies), api/process-inventory.js [NOVO — VULN-09], api/register-sale.js [NOVO], app.js, assets/js/estoque-ia.js [MODIFICADO — VULN-09], Auditoria de Segurança — versão_3.0_seguranca_revisada (+15 more)

### Community 3 - "AI-Assisted Stock Voice Interface (estoque-ia.js)"
Cohesion: 0.27
Nodes (3): setVuiState(), startRecording(), stopRecording()

### Community 4 - "Security & Version Revision (3.0)"
Cohesion: 0.19
Nodes (19): 1. Histórico e Checklist de Correções, 2. Resumo de Alterações por Arquivo (Diff Resumido), 3. Políticas Ativas Pós-Auditoria (pg_policies), api/register-sale.js [NOVO], app.js, Auditoria de Segurança — versão_3.0_seguranca_revisada, index.html, Item 1: Políticas de RLS (Row Level Security) no Supabase (+11 more)

### Community 5 - "Local LLM Daemon (Ollama Server)"
Cohesion: 0.13
Nodes (16): app, checkOllamaRunning(), { createClient }, crypto, dotenv, { exec }, express, fs (+8 more)

### Community 6 - "Project Dependencies & Manifests (package.json)"
Cohesion: 0.12
Nodes (15): dotenv, express, localtunnel, ngrok, dependencies, dotenv, express, localtunnel (+7 more)

### Community 7 - "Voice Interface Mobile Testing"
Cohesion: 0.15
Nodes (10): apiJs, estoqueJs, failures, fs, handler503Section, idx503, path, ROOT (+2 more)

### Community 8 - "Inventory API Endpoint"
Cohesion: 0.29
Nodes (10): handler(), INJECTION_PATTERNS, isRateLimited(), rateLimitMap, resolveOllamaEndpoint(), sanitizeForLLM(), supabase, VALID_ACTIONS (+2 more)

### Community 9 - "Sale Registration API Endpoint"
Cohesion: 0.31
Nodes (10): handler(), isRateLimited(), rateLimitMap, sanitizeString(), supabase, VALID_CATEGORIES, VALID_DELIVERY_METHODS, VALID_PAYMENT_METHODS (+2 more)

### Community 10 - "Deploy Sync Skill & Scripts"
Cohesion: 0.46
Nodes (7): Automated Scripts, Execution Guidelines for the Agent, Git Bash or Linux, How to Trigger the Automation Scripts, SaaS Automated Commit, Deploy & Docs Sync Skill, System Scopes & Paths, Windows (PowerShell)

### Community 11 - "Project Architecture & Structure (README)"
Cohesion: 0.52
Nodes (6): 🔒 Arquitetura de Segurança & Infraestrutura, 🎂 Bolos da Palloma — Versão 3.5, 🛠️ Deploy & Configuração, 📂 Estrutura de Pastas do Projeto, 📋 Novas Telas & Funcionalidades:, 🚀 Novidades da Versão 3.5

### Community 12 - "Business & Features Status Report"
Cohesion: 0.60
Nodes (5): 1. Frente de Loja (Vendas e Aquisição), 2. Retaguarda Operacional (Back-Office "Zero-Touch"), 3. Inteligência Preditiva ("Oceano Azul"), 4. Experiência do Usuário (UX/UI B2B Simplificada), Status de Implementação das Funcionalidades - Bolos da Palloma

### Community 13 - "SaaS QA & Test Automation System"
Cohesion: 0.70
Nodes (4): Checklist de Validação Focada no Negócio, Como estruturar o seu feedback, SaaS QA & Test Automation Skill, Árvore de Decisão (Decision Tree)

### Community 14 - "Version 3.5 Functional Specifications"
Cohesion: 0.70
Nodes (4): 1. Escopo das Novas Funcionalidades (Versão 3.5), 2. Status do Checklist de Segurança (Blindagem de Produção), 📋 Módulos Adicionados e Atualizados:, Relatório de Funcionalidades e Auditoria — versão_3.5_novas_funcionalidades

### Community 15 - "Code Review Guidelines"
Cohesion: 0.83
Nodes (3): Code Review Skill, How to provide feedback, Review checklist

### Community 38 - "ui.js"
Cohesion: 0.06
Nodes (33): btnSubmitOrder, cartBadgeCount, cartDrawer, cartItemsList, cartOverlay, categoriesTabs, changeAmount, changeField (+25 more)

### Community 39 - "supabase_rls_policies.sql"
Cohesion: 0.32
Nodes (6): audit_insumos_changes(), "Custos & Preços", estoque_log, "insumos", trg_audit_insumos, "vendas"

### Community 42 - "estoque-ia.js"
Cohesion: 0.43
Nodes (5): escapeHTML(), getAccessToken(), getActiveSupabaseClient(), renderPreview(), showDaemonOfflineBanner()

### Community 43 - "test-whisper-integration.js"
Cohesion: 0.33
Nodes (4): { createClient }, dotenv, path, supabase

## Knowledge Gaps
- **76 isolated node(s):** `deploy-sync.sh script`, `supabase`, `rateLimitMap`, `INJECTION_PATTERNS`, `supabase` (+71 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `deploy-sync.sh script`, `supabase`, `rateLimitMap` to the rest of the system?**
  _76 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Client Digital Menu (app.js)` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `Local LLM Daemon (Ollama Server)` be split into smaller, more focused modules?**
  _Cohesion score 0.12631578947368421 - nodes in this community are weakly interconnected._
- **Should `Project Dependencies & Manifests (package.json)` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `ui.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05873015873015873 - nodes in this community are weakly interconnected._