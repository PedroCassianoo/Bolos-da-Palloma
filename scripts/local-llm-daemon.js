const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const dotenv = require('dotenv');
const fs = require('fs');
const os = require('os');

// Carrega variáveis de ambiente do arquivo .env no diretório raiz do projeto
dotenv.config({ path: path.join(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PORT = 11435;
const OLLAMA_URL = 'http://localhost:11434';
const MODEL_NAME = 'processador-estoque';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERRO: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados no seu arquivo .env local.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

let app = express();
app.use(express.json());

// Permite CORS para conexões locais da interface do usuário (ex: file:// ou Live Server)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

let activeTunnel = null;
let keepAliveInterval = null;
let apiKey = null;

// ==========================================================================
// 1. VERIFICAÇÃO E INICIALIZAÇÃO DO OLLAMA
// ==========================================================================

async function checkOllamaRunning() {
    try {
        const res = await fetch(`${OLLAMA_URL}/api/tags`);
        if (res.ok) {
            return true;
        }
    } catch (e) {
        // Falhou ao conectar no Ollama
    }
    return false;
}

function verifyAndBuildModel() {
    return new Promise(async (resolve, reject) => {
        console.log(`🤖 [Ollama] Verificando se o modelo "${MODEL_NAME}" está disponível...`);
        try {
            const res = await fetch(`${OLLAMA_URL}/api/tags`);
            if (!res.ok) {
                return reject(new Error('Servidor Ollama retornou erro ao listar modelos.'));
            }
            const data = await res.json();
            const models = data.models || [];
            
            // Verifica se o modelo existe (pode estar como 'processador-estoque' ou 'processador-estoque:latest')
            const exists = models.some(m => m.name === MODEL_NAME || m.name.startsWith(`${MODEL_NAME}:`));
            
            if (exists) {
                console.log(`✅ [Ollama] Modelo "${MODEL_NAME}" encontrado e pronto.`);
                return resolve();
            }

            console.log(`⚠️ [Ollama] Modelo "${MODEL_NAME}" não encontrado. Iniciando construção a partir do Modelfile...`);
            const modelfilePath = path.join(__dirname, '../Modelfile');
            
            // Executa o comando para construir o modelo
            const buildProcess = exec(`ollama create ${MODEL_NAME} -f "${modelfilePath}"`);
            
            buildProcess.stdout.on('data', (data) => {
                process.stdout.write(`[Ollama Build] ${data}`);
            });

            buildProcess.stderr.on('data', (data) => {
                process.stdout.write(`[Ollama Build Info] ${data}`);
            });

            buildProcess.on('close', (code) => {
                if (code === 0) {
                    console.log(`\n✅ [Ollama] Modelo "${MODEL_NAME}" construído com sucesso!`);
                    resolve();
                } else {
                    reject(new Error(`O comando 'ollama create' falhou com código de saída ${code}.`));
                }
            });

        } catch (err) {
            reject(err);
        }
    });
}

// ==========================================================================
// 2. GESTÃO DE CHAVE DE SEGURANÇA E TÚNEL
// ==========================================================================

async function setupApiKey() {
    console.log('🔑 [Segurança] Verificando chave de API no Supabase...');
    try {
        // Tenta obter a chave existente do banco
        const { data, error } = await supabase
            .from('config_sistema')
            .select('valor')
            .eq('chave', 'ollama_api_key')
            .maybeSingle();

        if (error) throw error;

        if (data && data.valor) {
            apiKey = data.valor;
            console.log('✅ [Segurança] Chave de API existente carregada com sucesso.');
        } else {
            // Gera uma nova chave segura caso não exista
            apiKey = crypto.randomBytes(32).toString('hex');
            const { error: insertError } = await supabase
                .from('config_sistema')
                .upsert({ chave: 'ollama_api_key', valor: apiKey, atualizado_em: new Date() });

            if (insertError) throw insertError;
            console.log('🆕 [Segurança] Nova chave de API gerada e salva no Supabase.');
        }
    } catch (err) {
        console.error('❌ [Segurança] Erro ao configurar chave de API no Supabase:', err.message);
        process.exit(1);
    }
}

async function startTunnel() {
    const ngrokToken = process.env.NGROK_AUTHTOKEN ? process.env.NGROK_AUTHTOKEN.trim() : null;
    const ngrokDomain = process.env.NGROK_DOMAIN ? process.env.NGROK_DOMAIN.trim() : null;
    let tunnelUrl = null;

    if (ngrokToken) {
        console.log('🚀 [Túnel] Iniciando túnel seguro com Ngrok CLI...');
        try {
            const { spawn } = require('child_process');
            
            // Garante que o authtoken está configurado na CLI
            await new Promise((resolve) => {
                const proc = spawn('npx', ['ngrok', 'config', 'add-authtoken', ngrokToken], { shell: true });
                proc.on('close', () => resolve());
            });

            // Prepara os argumentos para rodar o túnel
            const args = ['ngrok', 'http', PORT.toString()];
            if (ngrokDomain) {
                args.push('--url', ngrokDomain);
            }
            
            const ngrokProcess = spawn('npx', args, { shell: true });
            
            // Se fornecemos um domínio estático, a URL pública é conhecida de imediato
            if (ngrokDomain) {
                tunnelUrl = `https://${ngrokDomain}`;
            } else {
                // Aguarda 3 segundos e consulta a API local do Ngrok na porta 4040
                await new Promise(resolve => setTimeout(resolve, 3000));
                try {
                    const apiRes = await fetch('http://127.0.0.1:4040/api/tunnels');
                    if (apiRes.ok) {
                        const apiData = await apiRes.json();
                        if (apiData.tunnels && apiData.tunnels[0]) {
                            tunnelUrl = apiData.tunnels[0].public_url;
                        }
                    }
                } catch (apiErr) {
                    console.warn('⚠️ [Túnel] Não foi possível ler a URL da API local do Ngrok:', apiErr.message);
                }
            }

            if (tunnelUrl) {
                activeTunnel = {
                    type: 'ngrok_cli',
                    close: async () => {
                        try {
                            ngrokProcess.kill();
                            // Força encerramento do binário no Windows para evitar bloqueios de porta
                            const { exec } = require('child_process');
                            exec('taskkill /F /IM ngrok.exe');
                        } catch (killErr) {
                            // Ignora erros ao matar processo
                        }
                    }
                };
                console.log(`🌐 [Túnel] Túnel Ngrok CLI ativo: ${tunnelUrl}`);
            } else {
                throw new Error('Não foi possível determinar a URL pública do Ngrok.');
            }
        } catch (err) {
            console.error('⚠️ [Túnel] Falha ao iniciar Ngrok CLI:', err.message);
        }
    }

    if (!tunnelUrl) {
        console.log('🚀 [Túnel] Iniciando túnel seguro com Localtunnel...');
        try {
            const localtunnel = require('localtunnel');
            const tunnel = await localtunnel({ port: PORT });
            
            tunnelUrl = tunnel.url;
            activeTunnel = {
                type: 'localtunnel',
                close: async () => { tunnel.close(); }
            };

            tunnel.on('close', () => {
                console.log('⚠️ [Túnel] Conexão do Localtunnel fechada pelo servidor remoto.');
            });

            console.log(`🌐 [Túnel] Túnel Localtunnel ativo: ${tunnelUrl}`);
        } catch (err) {
            console.error('❌ [Túnel] Falha crítica ao iniciar túnel Localtunnel:', err.message);
            throw err;
        }
    }

    return tunnelUrl;
}

async function updateSupabaseStatus(url, status) {
    try {
        const updates = [
            { chave: 'ollama_url', valor: url, atualizado_em: new Date() },
            { chave: 'ollama_status', valor: status, atualizado_em: new Date() }
        ];

        for (const update of updates) {
            await supabase.from('config_sistema').upsert(update);
        }
        console.log(`📡 [Supabase] Status atualizado: [${status}] URL=[${url}]`);
    } catch (err) {
        console.error('❌ [Supabase] Erro ao atualizar status no banco de dados:', err.message);
    }
}

// ==========================================================================
// 3. MIDDLEWARES & ROTAS DO SERVIDOR GATEWAY
// ==========================================================================

// Middleware de Autenticação Rígida
function requireApiKey(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn(`🔒 [Acesso Negado] Requisição sem token de autorização de: ${req.ip}`);
        return res.status(401).json({ error: 'Acesso não autorizado. Bearer Token ausente.' });
    }

    const token = authHeader.slice(7);
    if (token !== apiKey) {
        console.warn(`🔒 [Acesso Negado] Token inválido fornecido por: ${req.ip}`);
        return res.status(401).json({ error: 'Acesso não autorizado. Token inválido.' });
    }

    next();
}

// Rota de Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'online', model: MODEL_NAME });
});

// ==========================================================================
// 3.5. INTEGRAÇÃO COM WHISPER (SPEECH-TO-TEXT LOCAL)
// ==========================================================================

function transcribeAudio(audioBase64) {
    return new Promise((resolve, reject) => {
        const tempDir = os.tmpdir();
        const fileId = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const inputFilename = path.join(tempDir, `vui_input_${fileId}.wav`);
        
        // Decodifica Base64 e salva arquivo temporário de áudio
        const base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        
        fs.writeFile(inputFilename, buffer, (writeErr) => {
            if (writeErr) {
                console.error('❌ [Whisper] Erro ao salvar arquivo de áudio temporário:', writeErr);
                return reject(new Error('Falha ao gravar arquivo de áudio temporário no daemon.'));
            }
            
            console.log(`🎙️ [Whisper] Áudio gravado temporariamente em: ${inputFilename}`);
            
            // Define o modelo Whisper a partir do ambiente ou usa 'turbo' como padrão
            const whisperModel = process.env.WHISPER_MODEL || 'turbo';
            
            // Executa o comando CLI do Whisper do Python
            const cmd = `whisper "${inputFilename}" --model "${whisperModel}" --language Portuguese --output_format txt --output_dir "${tempDir}"`;
            console.log(`🎙️ [Whisper] Rodando: ${cmd}`);
            
            exec(cmd, (execErr, stdout, stderr) => {
                const outputTxtFile = path.join(tempDir, `vui_input_${fileId}.txt`);
                
                // Limpeza de arquivos temporários auxiliares (.wav, .txt, .srt, .vtt, .json, .tsv)
                const cleanFiles = () => {
                    const extensions = ['.wav', '.txt', '.json', '.srt', '.vtt', '.tsv'];
                    extensions.forEach(ext => {
                        const fileToDelete = path.join(tempDir, `vui_input_${fileId}${ext}`);
                        if (fs.existsSync(fileToDelete)) {
                            try {
                                fs.unlinkSync(fileToDelete);
                            } catch (e) {
                                // Ignora erros de limpeza
                            }
                        }
                    });
                };
                
                if (execErr) {
                    console.error('❌ [Whisper] Erro no comando do Whisper CLI:', execErr.message);
                    console.error('Stderr do Whisper:', stderr);
                    cleanFiles();
                    
                    // Retorna um erro informativo orientando sobre dependências
                    return reject(new Error(
                        'O comando "whisper" falhou. Certifique-se de que:\n' +
                        '1. Python está instalado e no PATH.\n' +
                        '2. FFmpeg está instalado e no PATH.\n' +
                        '3. O pacote openai-whisper foi instalado via pip (`pip install openai-whisper`).\n' +
                        `Erro detalhado: ${execErr.message}`
                    ));
                }
                
                // Lê a transcrição do arquivo gerado
                if (fs.existsSync(outputTxtFile)) {
                    try {
                        const transcription = fs.readFileSync(outputTxtFile, 'utf8').trim();
                        cleanFiles();
                        resolve(transcription);
                    } catch (readErr) {
                        console.error('❌ [Whisper] Erro ao ler resultado da transcrição:', readErr);
                        cleanFiles();
                        reject(new Error('Falha ao ler o arquivo de transcrição gerado pelo Whisper.'));
                    }
                } else {
                    console.warn('⚠️ [Whisper] Arquivo .txt não foi encontrado. Tentando obter transcrição a partir do stdout.');
                    const match = stdout.replace(/\[\d+:\d+\.\d+ --> \d+:\d+\.\d+\]\s*/g, '').trim();
                    cleanFiles();
                    if (match) {
                        resolve(match);
                    } else {
                        reject(new Error('A transcrição retornou um resultado vazio.'));
                    }
                }
            });
        });
    });
}

// Proxy de geração da LLM (Suporta texto e áudio via Whisper)
app.post('/api/process', requireApiKey, async (req, res) => {
    console.log(`📥 [Proxy] Recebida requisição de processamento por IA. Tamanho: ${JSON.stringify(req.body).length} bytes`);
    
    const { prompt, model, stream, audio } = req.body || {};

    let promptText = prompt;

    // Se o payload contiver áudio Base64, transcreve com o Whisper primeiro
    if (audio) {
        console.log(`🎙️ [Proxy] Detectado áudio Base64. Iniciando transcrição com Whisper local...`);
        try {
            promptText = await transcribeAudio(audio);
            console.log(`🎙️ [Proxy] Transcrição concluída: "${promptText}"`);
            if (!promptText || promptText.trim().length === 0) {
                return res.status(422).json({ error: 'O Whisper não conseguiu detectar nenhuma fala ou o áudio está em silêncio.' });
            }
        } catch (whisperErr) {
            console.error('❌ [Proxy] Falha na transcrição com o Whisper local:', whisperErr.message);
            return res.status(502).json({ 
                error: 'Falha no serviço de transcrição (Whisper)', 
                message: whisperErr.message 
            });
        }
    }

    if (!promptText) {
        return res.status(400).json({ error: 'Campo "prompt" ou "audio" é obrigatório.' });
    }

    try {
        const ollamaRes = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model || MODEL_NAME,
                prompt: promptText.startsWith('<INPUT_USUARIO>') ? promptText : `<INPUT_USUARIO>${promptText}</INPUT_USUARIO>`,
                stream: stream || false
            })
        });

        if (!ollamaRes.ok) {
            const errText = await ollamaRes.text();
            console.error(`❌ [Proxy] Erro retornado pelo Ollama (${ollamaRes.status}):`, errText);
            return res.status(ollamaRes.status).json({ error: `Erro no Ollama local: ${errText}` });
        }

        const data = await ollamaRes.json();
        console.log(`📤 [Proxy] Resposta do Ollama retornada com sucesso.`);
        
        // Se transcrevemos áudio, inclui a transcrição na resposta
        if (audio) {
            data.transcription = promptText;
        }

        res.status(200).json(data);

    } catch (err) {
        console.error('❌ [Proxy] Erro de rede ou conexão com o Ollama local:', err.message);
        res.status(502).json({ error: 'O daemon local não conseguiu se comunicar com o Ollama. Certifique-se de que o Ollama está em execução.' });
    }
});

// ==========================================================================
// 4. FUNÇÃO INICIALIZADORA DO DAEMON
// ==========================================================================

async function main() {
    console.log('===========================================================');
    console.log('🎂 DAEMON DE CONEXÃO DA LLM LOCAL — BOLOS DA PALLOMA');
    console.log('===========================================================');

    // 1. Verifica se o Ollama está ativo
    const isOllamaUp = await checkOllamaRunning();
    if (!isOllamaUp) {
        console.error('❌ ERRO CRÍTICO: O serviço Ollama não está rodando no computador.');
        console.error('👉 Por favor, abra o Ollama (ícone na barra do Windows) e tente novamente.');
        process.exit(1);
    }
    console.log('✅ [Ollama] Serviço detectado em execução na porta 11434.');

    // 2. Verifica e constrói o modelo se necessário
    try {
        await verifyAndBuildModel();
    } catch (e) {
        console.error('❌ Erro crítico ao validar/construir o modelo no Ollama:', e.message);
        process.exit(1);
    }

    // 3. Configura a chave de segurança
    await setupApiKey();

    // 4. Inicializa o servidor Express localmente
    app.listen(PORT, async () => {
        console.log(`🚀 [Gateway] Servidor de segurança rodando em http://localhost:${PORT}`);

        // 5. Inicia o túnel HTTPS
        try {
            const tunnelUrl = await startTunnel();
            
            // 6. Atualiza o banco do Supabase
            await updateSupabaseStatus(tunnelUrl, 'online');

            // 7. Configura Keep-Alive (Heartbeat) de 30 segundos no Supabase
            keepAliveInterval = setInterval(async () => {
                await updateSupabaseStatus(tunnelUrl, 'online');
            }, 30000);

            console.log('🚀 [Pronto] Serviço sempre ativo, conectado e pronto para uso!');
            console.log('👉 Minimize esta janela. Não feche este terminal.');
            console.log('===========================================================');

        } catch (err) {
            console.error('❌ Erro fatal ao estabelecer o túnel:', err.message);
            process.exit(1);
        }
    });
}

// Tratamento de encerramento amigável
async function shutdown() {
    console.log('\n🛑 [Desligamento] Encerrando serviço de forma segura...');
    
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
    }

    // Tenta atualizar status no banco para offline de forma assíncrona
    console.log('📡 [Supabase] Alterando status para offline...');
    try {
        const updates = [
            { chave: 'ollama_url', valor: '', atualizado_em: new Date() },
            { chave: 'ollama_status', valor: 'offline', atualizado_em: new Date() }
        ];

        for (const update of updates) {
            await supabase.from('config_sistema').upsert(update);
        }
        console.log('📡 [Supabase] Status atualizado para offline.');
    } catch (err) {
        console.error('❌ [Supabase] Erro ao atualizar status para offline:', err.message);
    }

    if (activeTunnel) {
        console.log('🌐 [Túnel] Fechando conexões do túnel...');
        try {
            await activeTunnel.close();
        } catch (e) {
            // Ignora erro ao fechar túnel
        }
    }

    console.log('👋 [Desligamento] Daemon finalizado.');
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Executa o daemon
main();
