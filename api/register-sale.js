import { createClient } from '@supabase/supabase-js';

// ==========================================================================
// SERVERLESS FUNCTION: /api/register-sale
// ==========================================================================
// Recebe os itens do pedido do cardápio digital e insere na tabela 'vendas'
// do Supabase usando a service_role_key (server-side only).
//
// Isso elimina o INSERT direto do frontend público, impedindo que qualquer
// visitante injete vendas arbitrárias diretamente pelo console do navegador.
// ==========================================================================

// Inicializa o cliente Supabase com a chave de serviço (nunca exposta ao frontend)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --------------------------------------------------------------------------
// Constantes de validação
// --------------------------------------------------------------------------
const VALID_PRODUCTS = [
    'Bolo de Cenoura com Brigadeiro',
    'Bolo Vulcão de Ninho com Nutella',
    'Bolo de Fubá com Goiabada',
    'Bolo Trufado de Chocolate',
    'Bolo Ninho com Morangos Frescos',
    'Bolo Red Velvet',
    'Copo da Felicidade de Morango',
    'Brownie Supremo'
];

const VALID_PAYMENT_METHODS = ['pix', 'cartao', 'dinheiro'];
const VALID_DELIVERY_METHODS = ['delivery', 'retirada', 'pickup'];
const VALID_CATEGORIES = ['Caseiro', 'Confeitado', 'Doce'];

const MAX_VALOR_POR_ITEM = 1000;   // R$ 1.000 por item (limite razoável)
const MAX_ITEMS_POR_PEDIDO = 20;   // Máximo 20 itens por pedido
const MAX_STRING_LENGTH = 300;     // Limite de comprimento para campos de texto

// --------------------------------------------------------------------------
// Rate limiting simples em memória (por IP, por instância serverless)
// --------------------------------------------------------------------------
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 5;       // 5 pedidos por minuto por IP

function isRateLimited(ip) {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
        // Nova janela de tempo
        rateLimitMap.set(ip, { windowStart: now, count: 1 });
        return false;
    }

    record.count += 1;
    if (record.count > RATE_LIMIT_MAX_REQUESTS) {
        return true;
    }

    return false;
}

// --------------------------------------------------------------------------
// Sanitização de strings (mesma lógica do frontend, reforçada no backend)
// --------------------------------------------------------------------------
function sanitizeString(text) {
    if (!text || typeof text !== 'string') return '';
    return text
        .trim()
        .slice(0, MAX_STRING_LENGTH)
        .replace(/[*_~`]/g, '')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .replace(/\r?\n|\r/g, ' ');
}

// --------------------------------------------------------------------------
// Validação de um item individual de venda
// --------------------------------------------------------------------------
function validateSaleItem(item) {
    const errors = [];

    // Campos obrigatórios
    if (!item.pedido_id || typeof item.pedido_id !== 'string') {
        errors.push('pedido_id inválido');
    }

    if (!item.data || !/^\d{4}-\d{2}-\d{2}$/.test(item.data)) {
        errors.push('data inválida (formato esperado: YYYY-MM-DD)');
    }

    if (!item.produto || !VALID_PRODUCTS.includes(item.produto)) {
        errors.push(`produto inválido: "${item.produto}"`);
    }

    if (!item.categoria || !VALID_CATEGORIES.includes(item.categoria)) {
        errors.push(`categoria inválida: "${item.categoria}"`);
    }

    if (!VALID_PAYMENT_METHODS.includes(item.forma_pagamento)) {
        errors.push(`forma_pagamento inválida: "${item.forma_pagamento}"`);
    }

    if (!VALID_DELIVERY_METHODS.includes(item.metodo_entrega)) {
        errors.push(`metodo_entrega inválido: "${item.metodo_entrega}"`);
    }

    // Valores numéricos
    if (typeof item.valor_venda !== 'number' || item.valor_venda <= 0 || item.valor_venda > MAX_VALOR_POR_ITEM) {
        errors.push(`valor_venda fora do intervalo permitido (0-${MAX_VALOR_POR_ITEM})`);
    }

    // Canal de venda deve ser fixo para o cardápio digital
    if (item.canal_venda !== 'Cardápio Digital') {
        errors.push('canal_venda deve ser "Cardápio Digital"');
    }

    return errors;
}

// --------------------------------------------------------------------------
// Handler principal
// --------------------------------------------------------------------------
export default async function handler(req, res) {
    // Apenas POST é permitido
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Método não permitido. Use POST.' });
    }

    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.');
        return res.status(500).json({ error: 'Erro interno de configuração do servidor.' });
    }

    // Rate limiting por IP
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
                  || req.headers['x-real-ip'] 
                  || req.socket?.remoteAddress 
                  || 'unknown';

    if (isRateLimited(clientIP)) {
        return res.status(429).json({ 
            error: 'Muitas requisições. Aguarde um minuto antes de tentar novamente.' 
        });
    }

    // Validar corpo da requisição
    const { items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'O campo "items" deve ser um array não vazio.' });
    }

    if (items.length > MAX_ITEMS_POR_PEDIDO) {
        return res.status(400).json({ 
            error: `Máximo de ${MAX_ITEMS_POR_PEDIDO} itens por pedido.` 
        });
    }

    // Validar e sanitizar cada item
    const sanitizedItems = [];
    for (const item of items) {
        const validationErrors = validateSaleItem(item);
        if (validationErrors.length > 0) {
            return res.status(400).json({ 
                error: 'Dados inválidos no pedido.', 
                details: validationErrors 
            });
        }

        // Montar o item sanitizado (whitelist de campos — ignora qualquer campo extra)
        sanitizedItems.push({
            pedido_id: sanitizeString(item.pedido_id),
            data: item.data,
            produto: item.produto,
            categoria: item.categoria,
            canal_venda: 'Cardápio Digital',
            forma_pagamento: item.forma_pagamento,
            valor_venda: Math.round(item.valor_venda * 100) / 100,
            custo_estimado: 0,
            lucro_liquido: Math.round(item.valor_venda * 100) / 100,
            cliente_nome: sanitizeString(item.cliente_nome || ''),
            metodo_entrega: item.metodo_entrega,
            endereco_entrega: sanitizeString(item.endereco_entrega || '')
        });
    }

    // Inserir no Supabase com a service_role_key (bypassa RLS)
    try {
        const { error } = await supabase.from('vendas').insert(sanitizedItems);

        if (error) {
            console.error('Erro ao inserir vendas no Supabase:', error);
            return res.status(500).json({ error: 'Erro ao registrar o pedido no banco de dados.' });
        }

        return res.status(201).json({ 
            success: true, 
            message: 'Pedido registrado com sucesso.',
            count: sanitizedItems.length 
        });
    } catch (err) {
        console.error('Erro inesperado na serverless function:', err);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}
