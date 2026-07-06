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
// ==========================================================================

const SUPABASE_URL = 'https://iqakaoawviocutlcqnho.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ivuPftbhmRcAoYDfe_OxRA_onNUdeiK';

let supabaseClient = null;

if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}
