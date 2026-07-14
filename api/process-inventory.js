import { createClient } from '@supabase/supabase-js';

// ==========================================================================
// SERVERLESS FUNCTION: /api/process-inventory
// ==========================================================================
// VULN-09: Proxy server-side para chamadas ao Ollama.
// O browser NUNCA fala diretamente com o Ollama — todas as chamadas passam
// por esta função, que valida autenticação, sanitiza input, chama a LLM,
// e valida o output antes de retornar ao client.
//
// Arquitetura dual-mode:
//   - Local (vercel dev): Ollama acessível em localhost:11434 → funcional
//   - Produção (Vercel cloud): Ollama inacessível → retorna erro claro
// ==========================================================================

// --------------------------------------------------------------------------
// Configuração
// --------------------------------------------------------------------------
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = 'processador-estoque';
const OLLAMA_TIMEOUT_MS = 60000; // 60s timeout para chamadas ao Ollama

// --------------------------------------------------------------------------
// Supabase client (service_role para verificar JWT)
// --------------------------------------------------------------------------
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --------------------------------------------------------------------------
// Rate limiting em memória (por IP, por instância serverless)
// --------------------------------------------------------------------------
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 5;       // 5 requests por minuto por IP

function isRateLimited(ip) {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(ip, { windowStart: now, count: 1 });
        return false;
    }

    record.count += 1;
    return record.count > RATE_LIMIT_MAX_REQUESTS;
}

// --------------------------------------------------------------------------
// VULN-01: Sanitização do input antes de enviar à LLM (server-side)
// --------------------------------------------------------------------------
const INJECTION_PATTERNS = [
    /ignore\s+(todas?\s+)?(as\s+)?instru[çc][õo]es/gi,
    /ignore\s+(all\s+)?(previous\s+)?instructions/gi,
    /retorne?\s+exatamente/gi,
    /return\s+exactly/gi,
    /system\s*prompt/gi,
    /you\s+are\s+now/gi,
    /vo[cê]+\s+[eé]\s+agora/gi,
    /esque[cç]a\s+tudo/gi,
    /finja\s+que/gi,
    /act\s+as/gi,
    /do\s+not\s+follow/gi,
    /```json/gi,
    /```/g,
];

function sanitizeForLLM(text) {
    let sanitized = text;
    for (const pattern of INJECTION_PATTERNS) {
        sanitized = sanitized.replace(pattern, '');
    }
    return sanitized.trim().slice(0, 1000);
}

// --------------------------------------------------------------------------
// VULN-02: Validação estrita do output da LLM (server-side)
// --------------------------------------------------------------------------
const VALID_ACTIONS = ["adicionar", "remover"];
const VALID_UNITS = ["kg", "g", "L", "ml", "cx", "pacote", "un"];
const MAX_QUANTITY = 9999;
const MAX_PRODUCT_NAME_LENGTH = 100;
const MAX_ITEMS = 20;

function validateLLMOutput(items) {
    const errors = [];
    const validated = [];

    const itemsToProcess = items.slice(0, MAX_ITEMS);

    for (let i = 0; i < itemsToProcess.length; i++) {
        const item = itemsToProcess[i];

        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
            errors.push(`Item ${i + 1}: não é um objeto válido.`);
            continue;
        }

        if (typeof item.produto !== 'string' || item.produto.trim().length === 0) {
            errors.push(`Item ${i + 1}: campo 'produto' ausente ou vazio.`);
            continue;
        }

        if (typeof item.quantidade !== 'number' || !Number.isFinite(item.quantidade)) {
            errors.push(`Item ${i + 1}: campo 'quantidade' deve ser um número.`);
            continue;
        }

        if (!VALID_ACTIONS.includes(item.acao)) {
            errors.push(`Item ${i + 1}: campo 'acao' inválido: "${String(item.acao)}".`);
            continue;
        }

        if (!VALID_UNITS.includes(item.unidade)) {
            errors.push(`Item ${i + 1}: campo 'unidade' inválido: "${String(item.unidade)}".`);
            continue;
        }

        if (item.quantidade <= 0 || item.quantidade > MAX_QUANTITY) {
            errors.push(`Item ${i + 1}: quantidade fora do intervalo (0, ${MAX_QUANTITY}].`);
            continue;
        }

        if (item.produto.length > MAX_PRODUCT_NAME_LENGTH) {
            errors.push(`Item ${i + 1}: nome do produto excede ${MAX_PRODUCT_NAME_LENGTH} caracteres.`);
            continue;
        }

        // Strip HTML/script chars from product name
        const cleanProduto = item.produto.replace(/[<>"'&]/g, '').trim();

        if (cleanProduto.length === 0) {
            errors.push(`Item ${i + 1}: nome do produto ficou vazio após sanitização.`);
            continue;
        }

        validated.push({
            produto: cleanProduto,
            quantidade: Math.round(item.quantidade * 100) / 100,
            unidade: item.unidade,
            acao: item.acao
        });
    }

    return { validated, errors };
}

// --------------------------------------------------------------------------
// Handler principal
// --------------------------------------------------------------------------
export default async function handler(req, res) {
    // --- Método ---
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Método não permitido. Use POST.' });
    }

    // --- Variáveis de ambiente ---
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('[process-inventory] Variáveis de ambiente não configuradas.');
        return res.status(500).json({ error: 'Erro interno de configuração do servidor.' });
    }

    // --- Rate limiting por IP ---
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                  || req.headers['x-real-ip']
                  || req.socket?.remoteAddress
                  || 'unknown';

    if (isRateLimited(clientIP)) {
        return res.status(429).json({
            error: 'Muitas requisições. Aguarde um minuto antes de tentar novamente.'
        });
    }

    // --- VULN-06/09: Autenticação — verificar JWT do Supabase ---
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Autenticação necessária.' });
    }

    const token = authHeader.slice(7);
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return res.status(401).json({ error: 'Token de autenticação inválido ou expirado.' });
        }
        console.log(`[process-inventory] Requisição autenticada: user=${user.id}, ip=${clientIP}`);
    } catch (authErr) {
        console.error('[process-inventory] Erro ao verificar autenticação:', authErr);
        return res.status(401).json({ error: 'Falha na verificação de autenticação.' });
    }

    // --- Validação do input ---
    const { text } = req.body || {};

    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Campo "text" é obrigatório e deve ser uma string.' });
    }

    if (text.trim().length === 0) {
        return res.status(400).json({ error: 'O texto não pode estar vazio.' });
    }

    if (text.length > 1000) {
        return res.status(400).json({
            error: `Texto muito longo (${text.length} caracteres). Máximo: 1000.`
        });
    }

    // --- VULN-01: Sanitizar input no server ---
    const sanitizedText = sanitizeForLLM(text);

    if (sanitizedText.length === 0) {
        return res.status(400).json({ error: 'Texto ficou vazio após sanitização.' });
    }

    // --- Chamar o Ollama (server-side) ---
    console.log(`[process-inventory] Enviando para Ollama: model=${OLLAMA_MODEL}, chars=${sanitizedText.length}`);

    let ollamaResponse;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

        ollamaResponse = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: `<INPUT_USUARIO>${sanitizedText}</INPUT_USUARIO>`,
                stream: false
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
    } catch (fetchError) {
        // Ollama não acessível (esperado em produção na Vercel)
        console.warn('[process-inventory] Ollama inacessível:', fetchError.message);
        return res.status(503).json({
            error: 'Processamento por IA indisponível. O servidor Ollama não está acessível neste ambiente.',
            hint: 'Esta funcionalidade requer que o Ollama esteja rodando localmente. Use "vercel dev" no mesmo PC.'
        });
    }

    if (!ollamaResponse.ok) {
        console.error(`[process-inventory] Ollama retornou status ${ollamaResponse.status}`);
        return res.status(502).json({
            error: 'Erro na comunicação com o Ollama. Verifique se o serviço está rodando e se o modelo "processador-estoque" foi criado.'
        });
    }

    // --- Parsear resposta do Ollama ---
    let data;
    try {
        data = await ollamaResponse.json();
    } catch (jsonErr) {
        console.error('[process-inventory] Resposta do Ollama não é JSON válido.');
        return res.status(502).json({ error: 'Resposta inválida do Ollama.' });
    }

    const responseText = (data.response || '').trim();
    console.log(`[process-inventory] Resposta bruta da LLM (${responseText.length} chars):`, responseText.slice(0, 200));

    // --- Parsear JSON da LLM ---
    let rawParsed;
    try {
        rawParsed = JSON.parse(responseText);
    } catch (parseErr) {
        console.error('[process-inventory] LLM não retornou JSON válido:', responseText.slice(0, 500));
        return res.status(422).json({
            error: 'A IA não retornou um formato reconhecido. Tente reformular a frase.'
        });
    }

    if (!Array.isArray(rawParsed)) {
        return res.status(422).json({
            error: 'A IA retornou um formato inesperado (esperado: array JSON).'
        });
    }

    // --- VULN-02: Validação estrita do output da LLM no server ---
    const { validated, errors: validationErrors } = validateLLMOutput(rawParsed);

    if (validationErrors.length > 0) {
        console.warn('[process-inventory] Erros de validação:', validationErrors);
    }

    if (validated.length === 0) {
        return res.status(422).json({
            error: 'Nenhum item válido identificado pela IA.',
            warnings: validationErrors.length > 0
                ? validationErrors
                : ['Tente reformular a frase com nomes de ingredientes, quantidades e ações claras.']
        });
    }

    // --- Sucesso: retornar itens validados ---
    console.log(`[process-inventory] Sucesso: ${validated.length} itens validados, ${validationErrors.length} warnings`);

    return res.status(200).json({
        items: validated,
        warnings: validationErrors
    });
}
