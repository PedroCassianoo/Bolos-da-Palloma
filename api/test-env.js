export default function handler(req, res) {
    const url = process.env.SUPABASE_URL || 'Não configurada';
    // Retorna a URL e apenas as primeiras letras do service role para verificação rápida de integridade
    const keyPrefix = process.env.SUPABASE_SERVICE_ROLE_KEY 
        ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 15) + '...'
        : 'Não configurada';
        
    res.status(200).json({
        supabaseUrl: url,
        serviceRoleKeyPrefix: keyPrefix
    });
}
