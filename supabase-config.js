// ==========================================================================
// CONFIGURAÇÃO CENTRALIZADA DO SUPABASE
// ==========================================================================
// Este arquivo é o ÚNICO PONTO de configuração das credenciais do Supabase.
// Ambos os scripts (app.js e painel.js) consomem o client global criado aqui.
//
// SEGURANÇA: A anon key abaixo é uma chave PÚBLICA do Supabase, projetada
// para uso no frontend. A proteção real dos dados é feita pelas
// Row-Level Security (RLS) policies configuradas no dashboard.
//
// ROTAÇÃO: Para trocar a chave, edite SOMENTE este arquivo.
//
// IMPORTANTE: Usamos window.supabaseClient (e não "let") para que a variável
// fique disponível globalmente no browser. Variáveis com "let" no topo de um
// script NÃO se tornam propriedades de window, o que quebraria o painel.js.
// ==========================================================================

const SUPABASE_URL = 'https://iqakaoawviocutlcqnho.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ivuPftbhmRcAoYDfe_OxRA_onNUdeiK';

window.supabaseClient = null;

if (typeof supabase !== 'undefined') {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
    console.error('[Supabase] SDK não carregado. Verifique o script CDN no HTML.');
}
