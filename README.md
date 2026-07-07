# 🎂 Bolos da Palloma — Versão 3.5

Um sistema inteligente mobile-first e B2B para gestão e vendas de confeitaria artesanal. O projeto integra um **Cardápio Digital Transacional** voltado ao cliente final com um **Painel de Gestão (Back-Office "Zero-Touch")** robusto, alimentado pelo Supabase e hospedado na Vercel.

---

## 🚀 Novidades da Versão 3.5
Esta versão traz uma evolução significativa nas ferramentas operacionais e na inteligência preditiva do negócio, sem comprometer a segurança blindada do sistema.

### 📋 Novas Telas & Funcionalidades:
1. **Gestão de Estoque (`estoque.html`):**
   * **Lista Mestra de Insumos:** Controle de estoque com quantidades, níveis mínimos e custo por ingrediente.
   * **Entrada por OCR (Scanner FAB):** Botão flutuante para simulação de scanner inteligente de Notas Fiscais.
   * **Gestão de Validade PEPS Proativa:** Alertas de ingredientes próximos do vencimento com sugestão de receitas para evitar desperdício.
2. **Receitas & Custos (`receitas.html`):**
   * **Guardião de Margem Preditivo:** Indicação visual de margem crítica com sugestões acionáveis (ajuste de preços ou porções).
   * **Motor de Escoamento ("Flash Sales"):** Trigger visual para ofertas relâmpago de produtos com insumos perto do vencimento.
3. **Pedidos & Simulador de Catering (`pedidos.html`):**
   * **Simulador de Catering:** Cálculo preditivo do volume de compras necessárias no atacado para atender grandes encomendas.
   * **Análise de Capacidade Laboral:** Indicador de sobrecarga de trabalho e estimativa de tempo de produção com alerta de Burnout (>90% da capacidade).
4. **Inventário por Comandos de Voz (VUI - `assets/js/vui.js`):**
   * Interface de voz moderna (Assistente de Voz) em modo escuro com controle cíclico do microfone para comandos rápidos de estoque.
5. **Navegação Unificada:**
   * Bottom bar responsiva em todas as telas para navegação rápida e transição suave.

---

## 🔒 Arquitetura de Segurança & Infraestrutura
O sistema foi auditado de ponta a ponta seguindo as melhores práticas de OWASP e DevOps:

* **Row-Level Security (RLS) no Supabase:** Ativado em todas as tabelas. Usuários anônimos têm acesso de escrita totalmente bloqueado nas tabelas. Leituras públicas são permitidas apenas para listagem de preços.
* **Serverless Functions Seguras:** Os pedidos de clientes finais são registrados via `/api/register-sale.js` no backend (Vercel). A função valida os dados contra whitelists e insere no banco usando a chave privada de serviço (`SUPABASE_SERVICE_ROLE_KEY`), prevenindo injeções.
* **Rate Limiting:**
  * **Login do Painel:** Bloqueio de 60 segundos após 5 tentativas incorretas consecutivas.
  * **Endpoint de Pedidos:** Limitação de requisições por IP (máximo de 5 pedidos por minuto).
* **Prevenção contra XSS:** Higienização de strings dinâmica (`escapeHTML`) aplicada em todas as saídas no DOM.
* **Headers HTTP Rígidos (CSP):** Cabeçalhos do `vercel.json` configurados com `Content-Security-Policy` estrita, `X-Frame-Options: SAMEORIGIN` e `HSTS` habilitado para segurança máxima contra Clickjacking e Session Hijacking.

---

## 📂 Estrutura de Pastas do Projeto
```bash
├── api/                    # Serverless Functions (Backend na Vercel)
│   └── register-sale.js    # Endpoint seguro de registro de pedidos
├── assets/                 # Recursos e Arquivos Estáticos
│   ├── css/                # Folhas de estilo modulares (nav.css, vui.css)
│   ├── icons/              # Ícones SVG do sistema
│   └── js/                 # Helpers e lógicas reutilizáveis (nav-helper.js, vui.js)
├── index.html              # Cardápio Digital (Frente de Loja)
├── app.js                  # Lógica do Cardápio Digital
├── painel.html             # Dashboard de Administração
├── painel.js               # Lógica de Administração e Login
├── estoque.html            # Gestão de Estoque
├── receitas.html           # Gestão de Fórmulas e Guardião de Margem
├── pedidos.html            # Simulador de Catering e Capacidade
├── vercel.json             # Regras de roteamento e Headers de Segurança
├── supabase-config.js      # Inicializador centralizado do Supabase Client
└── supabase_rls_policies.sql # Script SQL das políticas RLS ativas
```

---

## 🛠️ Deploy & Configuração
1. **Instalação:** `npm install`
2. **Variáveis de Ambiente (Vercel / Local):**
   * `SUPABASE_URL`: URL do seu projeto Supabase.
   * `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço secreta (nunca expor no frontend).
3. **Políticas de Banco:** Execute o script `supabase_rls_policies.sql` no SQL Editor do Supabase.
