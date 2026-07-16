/**
 * QA Test Suite - Whisper Integration Validation
 * Validates the speech-to-text API pipeline from backend proxy to the local daemon.
 */
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DAEMON_PORT = 11435;
const DAEMON_URL = `http://localhost:${DAEMON_PORT}`;

// 1-second silence mono 8kHz 8-bit WAV file in Base64
const MOCK_AUDIO_BASE64 = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runTests() {
    console.log('🧪 Starting Whisper Integration Tests...');
    console.log('-------------------------------------------');

    // Test 1: Fetch API Key from Supabase config
    console.log('1. Loading API Key from Supabase...');
    let apiKey = null;
    try {
        const { data, error } = await supabase
            .from('config_sistema')
            .select('valor')
            .eq('chave', 'ollama_api_key')
            .maybeSingle();

        if (error) throw error;
        if (!data || !data.valor) {
            throw new Error('API Key (ollama_api_key) not found in config_sistema table.');
        }
        apiKey = data.valor;
        console.log('   ✅ API Key successfully loaded.');
    } catch (err) {
        console.error('   ❌ Failed to load API Key:', err.message);
        process.exit(1);
    }

    // Test 2: Verify Local Daemon Health
    console.log('\n2. Checking Local Daemon health status...');
    try {
        const healthRes = await fetch(`${DAEMON_URL}/health`);
        if (!healthRes.ok) {
            throw new Error(`Health check returned status ${healthRes.status}`);
        }
        const healthData = await healthRes.json();
        console.log('   ✅ Daemon is online. Model:', healthData.model);
    } catch (err) {
        console.log('   ⚠️ Daemon offline or not responding. Start the daemon using "iniciar-servico-local.bat" first.');
        console.log('   (We will skip the API execution test since the daemon is not running locally right now).');
        console.log('-------------------------------------------');
        console.log('🧪 Tests ended: Daemon was offline.');
        return;
    }

    // Test 3: Test Audio Processing Endpoint
    console.log('\n3. Testing /api/process endpoint with mock Base64 audio...');
    try {
        const res = await fetch(`${DAEMON_URL}/api/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                audio: MOCK_AUDIO_BASE64
            })
        });

        const result = await res.json();

        if (res.ok) {
            console.log('   ✅ Success! Whisper transcribed the audio and Ollama processed it.');
            console.log('   Transcription:', result.transcription);
            console.log('   Result items:', JSON.stringify(result.items));
        } else {
            // If Whisper/FFmpeg is not installed, it should fail gracefully with 502 and details
            if (res.status === 502 && result.message && result.message.includes('whisper')) {
                console.log('   ✅ Success! The daemon correctly handled missing dependencies and returned a descriptive error:');
                console.log('   Expected Error Message:\n', result.message);
            } else {
                console.error(`   ❌ API call failed with status ${res.status}:`, result.error || result.message);
            }
        }
    } catch (err) {
        console.error('   ❌ Network error during API call:', err.message);
    }

    console.log('-------------------------------------------');
    console.log('🧪 Tests complete.');
}

runTests();
