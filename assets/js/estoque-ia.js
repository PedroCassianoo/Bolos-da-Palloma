// ==========================================================================
// ESTOQUE-IA.JS — Integração LLM → Supabase (Security Hardened)
// ==========================================================================
// VULN-01: Input sanitization (now server-side via /api/process-inventory)
// VULN-02: Strict schema validation of LLM output (now server-side)
// VULN-03: Input length enforcement (1000 chars, client + server)
// VULN-04: Client-side rate limiting (5s cooldown)
// VULN-06: Auth gating — requires authenticated Supabase session
// VULN-07: Primary key-based updates instead of fuzzy .ilike()
// VULN-08: Negative stock guard with user confirmation
// VULN-09: ✅ FIXED — All LLM calls go through /api/process-inventory proxy
//          Browser NEVER communicates directly with Ollama
// VULN-10: XSS escaping on all rendered LLM output
// VULN-11: Uses Supabase RPC for atomic batch updates (when available)
// ==========================================================================

// ===== SECURITY UTILITIES =====

/**
 * VULN-10: Escapes HTML entities to prevent XSS via LLM output.
 * Same pattern used in painel.js (v3.0 audit).
 */
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ===== MAIN APPLICATION LOGIC =====

/**
 * Shows a visible banner/toast in the UI when the daemon is offline
 * or a network error prevents processing. Auto-hides after 8 seconds.
 */
function showDaemonOfflineBanner(message) {
    // Remove any existing banner to avoid stacking
    const existing = document.getElementById("daemon-offline-banner");
    if (existing) existing.remove();

    const banner = document.createElement("div");
    banner.id = "daemon-offline-banner";
    banner.innerHTML = `
        <span class="material-symbols-outlined" style="font-size:20px;vertical-align:middle;margin-right:8px;">cloud_off</span>
        <span>${escapeHTML(message)}</span>
        <button onclick="this.parentElement.remove()" style="margin-left:auto;background:none;border:none;color:#ffddb3;font-size:18px;cursor:pointer;padding:4px;">✕</button>
    `;
    banner.style.cssText = "position:fixed;top:16px;left:16px;right:16px;z-index:10000;" +
        "background:#601410;color:#ffdbd0;padding:14px 16px;border-radius:12px;" +
        "font-size:13px;line-height:1.5;box-shadow:0 4px 16px rgba(0,0,0,.4);" +
        "display:flex;align-items:center;max-width:500px;margin:0 auto;";
    document.body.appendChild(banner);

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
        if (banner.parentElement) banner.remove();
    }, 8000);
}

document.addEventListener("DOMContentLoaded", async () => {
    const aiSubmitBtn = document.getElementById("ai-submit");
    const aiInput = document.getElementById("ai-input");
    const aiLoading = document.getElementById("ai-loading");
    const aiPreviewContainer = document.getElementById("ai-preview-container");
    const aiPreviewTbody = document.getElementById("ai-preview-tbody");
    const aiCancelBtn = document.getElementById("ai-cancel-btn");
    const aiConfirmBtn = document.getElementById("ai-confirm-btn");

    // OCR FAB
    const ocrFab = document.getElementById("ocr-fab");

    let currentParsedData = null;

    if (!aiSubmitBtn) return;

    // ===== VULN-06: AUTH GATING =====
    // Require authenticated Supabase session before allowing any operations.
    // We check both the iframe's supabaseClient and the parent window's supabaseClient.
    let currentSession = null;

    function getActiveSupabaseClient() {
        if (window.supabaseClient) {
            return window.supabaseClient;
        }
        if (window.parent && window.parent.supabaseClient) {
            return window.parent.supabaseClient;
        }
        return null;
    }

    function updateAuthUI(session) {
        if (session) {
            aiSubmitBtn.disabled = false;
            aiInput.disabled = false;
            aiInput.placeholder = "Ex: Adicionei 5 kg de morangos...";
            if (ocrFab) ocrFab.style.display = '';
        } else {
            aiSubmitBtn.disabled = true;
            aiInput.disabled = true;
            aiInput.placeholder = "Faça login no painel para usar esta funcionalidade.";
            if (ocrFab) ocrFab.style.display = 'none';
        }
    }

    // Subscribe to auth state changes on both local and parent clients
    if (window.supabaseClient) {
        window.supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log("[Estoque-IA] Mudança no estado de auth local:", event);
            currentSession = session;
            updateAuthUI(session);
            if (session && typeof window.carregarEstoque === 'function') {
                window.carregarEstoque();
            }
        });
    }

    if (window.parent && window.parent.supabaseClient) {
        window.parent.supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log("[Estoque-IA] Mudança no estado de auth do pai:", event);
            currentSession = session;
            updateAuthUI(session);
            if (session && typeof window.carregarEstoque === 'function') {
                window.carregarEstoque();
            }
        });
    }

    // Initial check
    const activeClient = getActiveSupabaseClient();
    if (activeClient) {
        try {
            const { data: { session } } = await activeClient.auth.getSession();
            currentSession = session;
            updateAuthUI(session);
            if (session && typeof window.carregarEstoque === 'function') {
                window.carregarEstoque();
            }
        } catch (err) {
            console.error("[Estoque-IA] Erro ao obter sessão inicial:", err);
            updateAuthUI(null);
        }
    } else {
        updateAuthUI(null);
    }

    /**
     * VULN-09: Helper to get the current access token for API calls.
     * Refreshes the session if needed to avoid expired tokens.
     */
    async function getAccessToken() {
        const client = getActiveSupabaseClient();
        if (!client) return null;
        try {
            const { data: { session } } = await client.auth.getSession();
            if (session) {
                currentSession = session;
                return session.access_token;
            }
        } catch (err) {
            console.error("[Estoque-IA] Erro ao obter token:", err);
        }
        return null;
    }

    // ===== VULN-04: RATE LIMITING =====
    let lastSubmitTime = 0;
    const SUBMIT_COOLDOWN_MS = 5000; // 5 second cooldown between submissions

    // --- Integração OCR Simulada ---
    if (ocrFab) {
        ocrFab.addEventListener("click", () => {
            const simulatedOcrText = "Nota Fiscal N 1234. Produtos: 20 caixas de morangos, 10 kg de farinha de trigo, 5 litros de leite. Uso interno: 2 kg de margarina.";
            aiInput.value = simulatedOcrText;
            alert("📷 [Simulação OCR] Nota fiscal escaneada com sucesso e texto extraído!");
            aiSubmitBtn.click();
        });
    }

    // ===== INTEGRAÇÃO DE ÁUDIO (WHISPER) =====
    document.addEventListener("vui-audio-recorded", async (event) => {
        const base64Audio = event.detail.audio;
        if (!base64Audio) return;

        // Reset UI
        aiPreviewContainer.classList.add("hidden");
        aiLoading.classList.remove("hidden");
        aiLoading.classList.add("flex");
        aiSubmitBtn.disabled = true;

        try {
            const accessToken = await getAccessToken();
            if (!accessToken) {
                throw new Error("Sessão expirada. Faça login novamente.");
            }

            // Envia o áudio Base64 para a API do Vercel
            const response = await fetch("/api/process-inventory", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({ audio: base64Audio })
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 503) {
                    const serverMsg = result.message || "O serviço de transcrição/IA local não está ativo.";
                    window.vuiUseNativeFallback = true;
                    showDaemonOfflineBanner(serverMsg + " (Alternado para comando de voz nativo do navegador)");
                    throw new Error(serverMsg);
                }
                if (response.status === 401) {
                    throw new Error("Sessão expirada. Faça login novamente.");
                }
                if (response.status === 429) {
                    throw new Error("Muitas requisições. Aguarde um minuto.");
                }
                throw new Error(result.error || "Erro ao processar áudio com Whisper/IA.");
            }

            // Exibe a transcrição gerada pelo Whisper no input para que o usuário veja
            if (result.transcription && aiInput) {
                aiInput.value = result.transcription;
            }

            const validated = result.items;
            if (!validated || validated.length === 0) {
                throw new Error("Nenhum item válido identificado no áudio. Tente falar mais claro.");
            }

            currentParsedData = validated;

            // Renderiza o preview dos insumos
            renderPreview(currentParsedData);

            aiLoading.classList.add("hidden");
            aiLoading.classList.remove("flex");
            aiPreviewContainer.classList.remove("hidden");

        } catch (error) {
            console.error(error);
            window.vuiUseNativeFallback = true;
            alert("Falha ao processar comando de voz: " + error.message + "\n\nO microfone foi alternado para usar o reconhecimento nativo do navegador.");
            aiLoading.classList.add("hidden");
            aiLoading.classList.remove("flex");
        } finally {
            aiSubmitBtn.disabled = false;
        }
    });

    aiSubmitBtn.addEventListener("click", async () => {
        const text = aiInput.value.trim();

        // ===== VULN-03: Input length check (defense-in-depth, HTML maxlength is first layer) =====
        if (!text) {
            alert("Por favor, digite as informações do estoque.");
            return;
        }
        if (text.length > 1000) {
            alert(`O texto é muito longo (${text.length} caracteres). Máximo: 1000 caracteres.`);
            return;
        }

        // ===== VULN-04: Rate limiting check =====
        const now = Date.now();
        if (now - lastSubmitTime < SUBMIT_COOLDOWN_MS) {
            alert("Aguarde alguns segundos antes de processar novamente.");
            return;
        }
        lastSubmitTime = now;

        // Reset UI
        aiPreviewContainer.classList.add("hidden");
        aiLoading.classList.remove("hidden");
        aiLoading.classList.add("flex");
        aiSubmitBtn.disabled = true;

        try {
            // ===== VULN-09: Get auth token for server-side proxy =====
            const accessToken = await getAccessToken();
            if (!accessToken) {
                throw new Error("Sessão expirada. Faça login novamente.");
            }

            let response;
            let result;
            let validated;
            let warnings = [];

            try {
                // ===== VULN-09: Call server-side proxy instead of Ollama directly =====
                // The server handles: sanitization (VULN-01), LLM call, output validation (VULN-02)
                response = await fetch("/api/process-inventory", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({ text: text })
                });

                result = await response.json();

                if (!response.ok) {
                    // Handle specific error types from the proxy
                    if (response.status === 503) {
                        // Server returned daemon_offline — show the message from the API
                        const serverMsg = result.message || "O serviço de IA local não está ativo. Inicie o serviço no seu computador.";
                        showDaemonOfflineBanner(serverMsg);
                        throw new Error(serverMsg);
                    }
                    if (response.status === 401) {
                        throw new Error("Sessão expirada. Faça login novamente.");
                    }
                    if (response.status === 429) {
                        throw new Error("Muitas requisições. Aguarde um minuto antes de tentar novamente.");
                    }
                    throw new Error(result.error || "Erro ao processar com a IA.");
                }

                validated = result.items;
                warnings = result.warnings || [];
            } catch (fetchError) {
                // Network errors (e.g., offline, DNS failure) — no fallback, just inform the user
                if (fetchError.name === "TypeError" && fetchError.message.includes("fetch")) {
                    console.error("[Estoque-IA] Erro de rede ao acessar a API:", fetchError.message);
                    showDaemonOfflineBanner("Não foi possível conectar ao servidor. Verifique sua conexão com a internet.");
                    throw new Error("Erro de conexão. Verifique sua internet e tente novamente.");
                }
                // Re-throw logical errors (503 message already shown, 401, 429, etc.)
                throw fetchError;
            }

            if (warnings.length > 0) {
                console.warn("[Estoque-IA] Warnings do servidor:", warnings);
            }

            if (!validated || validated.length === 0) {
                throw new Error("Nenhum item válido identificado pela IA. Tente reformular a frase.");
            }

            currentParsedData = validated;

            // Render the validated preview
            renderPreview(currentParsedData);

            aiLoading.classList.add("hidden");
            aiLoading.classList.remove("flex");
            aiPreviewContainer.classList.remove("hidden");
        } catch (error) {
            console.error(error);
            alert("Falha ao processar com a IA: " + error.message);
            aiLoading.classList.add("hidden");
            aiLoading.classList.remove("flex");
        } finally {
            aiSubmitBtn.disabled = false;
        }
    });

    aiCancelBtn.addEventListener("click", () => {
        aiPreviewContainer.classList.add("hidden");
        aiInput.value = "";
        currentParsedData = null;
    });

    aiConfirmBtn.addEventListener("click", async () => {
        if (!currentParsedData) return;

        aiConfirmBtn.disabled = true;
        aiConfirmBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">autorenew</span> Salvando...';

        try {
            const client = getActiveSupabaseClient();
            if (client) {
                // ===== VULN-11: Try atomic batch update via RPC first =====
                let usedRpc = false;
                try {
                    const { data: rpcResult, error: rpcError } = await client.rpc(
                        'atualizar_estoque',
                        { movimentacoes: currentParsedData }
                    );

                    if (!rpcError && rpcResult) {
                        usedRpc = true;
                        // Check for items not found
                        const notFound = rpcResult.filter(r => r.status === 'not_found');
                        const updated = rpcResult.filter(r => r.status === 'updated');

                        // ===== VULN-08: Check for items that were clamped to zero =====
                        const clamped = rpcResult.filter(r => r.status === 'updated' && r.new_qty === 0 && r.old_qty > 0);

                        let message = `✅ Estoque atualizado com sucesso! ${updated.length} item(ns) processado(s).`;
                        if (notFound.length > 0) {
                            message += `\n\n⚠️ ${notFound.length} item(ns) não encontrado(s): ${notFound.map(r => r.produto).join(', ')}`;
                        }
                        if (clamped.length > 0) {
                            message += `\n\n⚠️ ${clamped.length} item(ns) tiveram estoque zerado (quantidade insuficiente): ${clamped.map(r => r.produto).join(', ')}`;
                        }
                        alert(message);
                    }
                } catch (rpcCallError) {
                    console.warn("[Estoque-IA] RPC não disponível, usando fallback individual:", rpcCallError.message);
                }

                // Fallback: individual updates if RPC is not available
                if (!usedRpc) {
                    const results = { updated: 0, skipped: 0, errors: [] };

                    for (const item of currentParsedData) {
                        // ===== VULN-07: Fetch by fuzzy match but use ID for update =====
                        const { data: fetchItem, error: fetchError } = await client
                            .from('insumos')
                            .select('id, nome, quantidade')
                            .ilike('nome', `%${item.produto}%`)
                            .limit(1)
                            .single();

                        if (fetchError || !fetchItem) {
                            console.warn(`Item "${item.produto}" não encontrado ou erro:`, fetchError);
                            results.skipped++;
                            results.errors.push(`"${item.produto}" não encontrado`);
                            continue;
                        }

                        // ===== VULN-08: Negative stock guard =====
                        let novaQuantidade = fetchItem.quantidade;
                        if (item.acao === "adicionar") {
                            novaQuantidade += item.quantidade;
                        } else if (item.acao === "remover") {
                            novaQuantidade -= item.quantidade;
                            if (novaQuantidade < 0) {
                                const confirmar = confirm(
                                    `⚠️ Atenção: Remover ${item.quantidade} ${item.unidade} de "${fetchItem.nome}" ` +
                                    `resultaria em estoque negativo (${novaQuantidade.toFixed(2)}). ` +
                                    `Estoque atual: ${fetchItem.quantidade} ${item.unidade}.\n\n` +
                                    `Deseja ZERAR o estoque deste item?`
                                );
                                if (confirmar) {
                                    novaQuantidade = 0;
                                } else {
                                    results.skipped++;
                                    continue;
                                }
                            }
                        }

                        // ===== VULN-07: Update by exact primary key =====
                        const { error: updateError } = await client
                            .from('insumos')
                            .update({ quantidade: novaQuantidade })
                            .eq('id', fetchItem.id);

                        if (updateError) {
                            console.error(`Erro ao atualizar ${item.produto}:`, updateError);
                            results.errors.push(`Erro em "${item.produto}": ${updateError.message}`);
                            continue;
                        }
                        results.updated++;
                    }

                    let message = `✅ ${results.updated} item(ns) atualizado(s) com sucesso.`;
                    if (results.skipped > 0) {
                        message += `\n⚠️ ${results.skipped} item(ns) ignorado(s).`;
                    }
                    if (results.errors.length > 0) {
                        message += `\n\nDetalhes: ${results.errors.join('; ')}`;
                    }
                    alert(message);
                }

                // Reload the master table without page refresh
                if (typeof window.carregarEstoque === 'function') {
                    window.carregarEstoque();
                }

            } else {
                console.warn("Supabase não encontrado em window.supabaseClient. Simulando requisição.");
                await new Promise(resolve => setTimeout(resolve, 1000));
                alert("Estoque atualizado com sucesso (Simulado - Banco não conectado)!");
            }

            aiPreviewContainer.classList.add("hidden");
            aiInput.value = "";
            currentParsedData = null;
        } catch (error) {
            alert("Erro ao salvar no banco de dados: " + error.message);
        } finally {
            aiConfirmBtn.disabled = false;
            aiConfirmBtn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span> Confirmar e Salvar';
        }
    });

    /**
     * Renders the LLM-parsed items in the preview table.
     * VULN-10: All dynamic values are escaped via escapeHTML() to prevent XSS.
     */
    function renderPreview(items) {
        aiPreviewTbody.innerHTML = "";

        if (items.length === 0) {
            aiPreviewTbody.innerHTML = '<tr><td colspan="3" class="px-4 py-4 text-center text-on-surface-variant">Nenhum item identificado.</td></tr>';
            return;
        }

        items.forEach(item => {
            const tr = document.createElement("tr");

            // Define a cor e o ícone baseado na ação
            const isAdd = item.acao === "adicionar";
            const actionColor = isAdd ? "text-primary" : "text-tertiary";
            const actionBg = isAdd ? "bg-primary-fixed/20" : "bg-tertiary-fixed/40";
            const actionText = isAdd ? "Entrada" : "Saída";
            const actionIcon = isAdd ? "add_circle" : "remove_circle";

            // VULN-10: All dynamic content is escaped
            tr.innerHTML = `
                <td class="px-4 py-3 font-medium">${escapeHTML(item.produto)}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${actionBg} ${actionColor} flex items-center gap-1 w-fit">
                        <span class="material-symbols-outlined text-[14px]">${actionIcon}</span> ${actionText}
                    </span>
                </td>
                <td class="px-4 py-3 font-bold">${escapeHTML(String(item.quantidade))} <span class="font-normal text-on-surface-variant text-sm">${escapeHTML(item.unidade)}</span></td>
            `;
            aiPreviewTbody.appendChild(tr);
        });
    }
});
