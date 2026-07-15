/**
 * QA Test Suite — VUI Mobile Fix Validation
 * Runs as a standalone Node.js script (no test framework needed).
 * Tests the 4 files modified in the VUI mobile fix.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testName) {
    if (condition) {
        passed++;
        console.log(`  ✅ ${testName}`);
    } else {
        failed++;
        failures.push(testName);
        console.log(`  ❌ FAIL: ${testName}`);
    }
}

function readFile(relPath) {
    return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}

// ======================================================================
// 1. vercel.json — CSP Tests
// ======================================================================
console.log('\n📋 [1/4] vercel.json — CSP Validation');

const vercelJson = readFile('vercel.json');
let vercelParsed;
try {
    vercelParsed = JSON.parse(vercelJson);
    assert(true, 'vercel.json is valid JSON');
} catch (e) {
    assert(false, 'vercel.json is valid JSON — PARSE ERROR: ' + e.message);
}

if (vercelParsed) {
    const cspHeader = vercelParsed.headers?.[0]?.headers?.find(h => h.key === 'Content-Security-Policy');
    assert(!!cspHeader, 'CSP header exists in vercel.json');

    if (cspHeader) {
        const cspValue = cspHeader.value;
        const connectSrcMatch = cspValue.match(/connect-src\s+([^;]+)/);
        assert(!!connectSrcMatch, 'connect-src directive found in CSP');

        if (connectSrcMatch) {
            const connectSrc = connectSrcMatch[1];
            assert(connectSrc.includes("'self'"), 'connect-src includes self');
            assert(connectSrc.includes('https://*.supabase.co'), 'connect-src includes *.supabase.co (pre-existing)');
            assert(connectSrc.includes('https://cdn.jsdelivr.net'), 'connect-src includes cdn.jsdelivr.net (pre-existing)');
            assert(connectSrc.includes('https://www.google.com'), 'connect-src includes https://www.google.com (NEW)');
            assert(connectSrc.includes('wss://www.google.com'), 'connect-src includes wss://www.google.com (NEW)');
        }

        assert(cspValue.includes("default-src 'self'"), 'default-src preserved');
        assert(cspValue.includes('https://cdn.tailwindcss.com'), 'script-src tailwind preserved');
        assert(cspValue.includes('https://fonts.googleapis.com'), 'style-src google fonts preserved');
        assert(cspValue.includes("img-src 'self' data: https:"), 'img-src preserved');
        assert(cspValue.includes("frame-ancestors 'self'"), 'frame-ancestors preserved');
    }

    const headerKeys = vercelParsed.headers?.[0]?.headers?.map(h => h.key) || [];
    assert(headerKeys.includes('X-Frame-Options'), 'X-Frame-Options header preserved');
    assert(headerKeys.includes('Strict-Transport-Security'), 'HSTS header preserved');
    assert(headerKeys.includes('X-Content-Type-Options'), 'X-Content-Type-Options header preserved');
    assert(headerKeys.includes('Referrer-Policy'), 'Referrer-Policy header preserved');
    assert(vercelParsed.rewrites?.[0]?.destination === '/painel.html', 'Rewrite to painel.html preserved');
}

// ======================================================================
// 2. vui.js — Speech API & Mock Removal Tests
// ======================================================================
console.log('\n📋 [2/4] assets/js/vui.js — VUI Logic Validation');

const vuiJs = readFile('assets/js/vui.js');

assert(!vuiJs.includes("new CustomEvent('vui-speech-submit')"), 'No mock CustomEvent dispatch');
assert(!vuiJs.includes("document.dispatchEvent(new CustomEvent"), 'No dispatchEvent for fake speech');
assert(!vuiJs.includes('Usei três quilos'), 'No hardcoded mock text');
assert(vuiJs.includes('vui-unsupported-notice'), 'Unsupported browser notice class present');
assert(vuiJs.includes('mic_off'), 'mic_off icon used for unsupported notice');
assert(vuiJs.includes('Chrome no Android'), 'Suggests Chrome on Android as alternative');
assert(vuiJs.includes('display:none'), 'Notice starts hidden');
assert(vuiJs.includes('webkitSpeechRecognition'), 'webkitSpeechRecognition detection preserved');
assert(vuiJs.includes("recognition.lang = 'pt-BR'"), 'Portuguese language config preserved');
assert(vuiJs.includes('recognition.start()'), 'recognition.start() preserved for supported browsers');
assert(vuiJs.includes('recognition.stop()'), 'recognition.stop() preserved');
assert(vuiJs.includes('setVuiState(3)'), 'State 3 (recording) still triggered on start');
assert(vuiJs.includes('aiSubmitBtn.click()'), 'Submit click trigger preserved');

// ======================================================================
// 3. api/process-inventory.js — Server Fallback Tests
// ======================================================================
console.log('\n📋 [3/4] api/process-inventory.js — Server Logic Validation');

const apiJs = readFile('api/process-inventory.js');

assert(!apiJs.includes("return { url: OLLAMA_URL"), 'No fallback returning OLLAMA_URL constant');
assert(apiJs.includes("url: null"), 'Returns null URL when offline');
assert(apiJs.includes("if (!targetUrl)"), 'Guard for null targetUrl present');
assert(apiJs.includes("'daemon_offline'"), 'daemon_offline error code present');
assert(apiJs.includes('iniciar-servico-local.bat'), 'User-friendly message references startup script');
assert(apiJs.includes('sanitizeForLLM'), 'VULN-01 sanitization preserved');
assert(apiJs.includes('validateLLMOutput'), 'VULN-02 output validation preserved');
assert(apiJs.includes('isRateLimited'), 'Rate limiting preserved');
assert(apiJs.includes('supabase.auth.getUser'), 'JWT verification preserved');
assert(apiJs.includes('INJECTION_PATTERNS'), 'Injection patterns preserved');
assert(apiJs.includes('res.status(503)'), '503 status for daemon offline');
assert(apiJs.includes('res.status(401)'), '401 status for auth failures');
assert(apiJs.includes('res.status(429)'), '429 status for rate limiting');
assert(apiJs.includes('res.status(400)'), '400 status for validation errors');
assert(apiJs.includes('res.status(422)'), '422 status for LLM format errors');
assert(
    apiJs.includes('do NOT fallback to localhost'),
    'Comment explains rationale for removing localhost fallback'
);

// ======================================================================
// 4. assets/js/estoque-ia.js — Client Fallback Tests
// ======================================================================
console.log('\n📋 [4/4] assets/js/estoque-ia.js — Client Logic Validation');

const estoqueJs = readFile('assets/js/estoque-ia.js');

assert(!estoqueJs.includes('localhost:11435'), 'No reference to localhost:11435');
assert(!estoqueJs.includes('localhost:11434'), 'No reference to localhost:11434');
assert(!estoqueJs.includes('http://localhost'), 'No http://localhost at all');
assert(!estoqueJs.includes('vui-speech-submit'), 'No vui-speech-submit event listener');
assert(!estoqueJs.includes('Usei três quilos'), 'No hardcoded mock inventory text');
assert(estoqueJs.includes('function showDaemonOfflineBanner'), 'showDaemonOfflineBanner function defined');
assert(estoqueJs.includes('daemon-offline-banner'), 'Banner has unique DOM id');
assert(estoqueJs.includes('cloud_off'), 'Banner uses cloud_off icon');
assert(estoqueJs.includes('escapeHTML(message)'), 'Banner message is XSS-escaped');
assert(estoqueJs.includes('existing.remove()'), 'Old banner removed before showing new one');

// 503 handling
const idx503 = estoqueJs.indexOf('response.status === 503');
const handler503Section = estoqueJs.slice(idx503, idx503 + 400);
assert(handler503Section.includes('showDaemonOfflineBanner'), '503 handler calls showDaemonOfflineBanner');
assert(handler503Section.includes('result.message'), '503 handler reads message from API response');

// Security features preserved
assert(estoqueJs.includes('function escapeHTML'), 'XSS escapeHTML function preserved');
assert(estoqueJs.includes('VULN-06'), 'Auth gating comment preserved');
assert(estoqueJs.includes('VULN-07'), 'Primary key update comment preserved');
assert(estoqueJs.includes('VULN-08'), 'Negative stock guard comment preserved');
assert(estoqueJs.includes('getAccessToken'), 'getAccessToken function preserved');
assert(estoqueJs.includes('SUBMIT_COOLDOWN_MS'), 'Rate limiting constant preserved');

// ======================================================================
// CROSS-FILE INTEGRATION TESTS
// ======================================================================
console.log('\n📋 [CROSS-FILE] Integration Contract Tests');

assert(
    apiJs.includes("error: 'daemon_offline'") && estoqueJs.includes('result.message'),
    'Server-Client contract: daemon_offline error + message field matched'
);

const cspValue2 = vercelParsed?.headers?.[0]?.headers?.[0]?.value || '';
assert(
    cspValue2.includes('https://www.google.com') && vuiJs.includes('webkitSpeechRecognition'),
    'CSP allows Google Speech for vui.js Speech Recognition'
);

assert(
    !vuiJs.includes('vui-speech-submit') && !estoqueJs.includes('vui-speech-submit'),
    'No orphaned vui-speech-submit event in either file'
);

// ======================================================================
// SUMMARY
// ======================================================================
console.log('\n' + '='.repeat(60));
console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach(f => console.log(`  ❌ ${f}`));
}
console.log('='.repeat(60));

process.exit(failed > 0 ? 1 : 0);
