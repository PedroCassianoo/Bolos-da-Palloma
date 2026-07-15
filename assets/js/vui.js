/**
 * VUI (Voice User Interface) Floating Button Controller
 * Implements a standalone cyclic 3-state microphone button simulator.
 */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Prevent running in the main parent painel.html frame to avoid duplicate buttons
    const path = window.location.pathname;
    const page = path.split("/").pop().toLowerCase();
    if (page.includes("painel.html")) {
        return; // Exit, VUI button only runs inside sub-app pages (estoque and receitas)
    }

    // 2. Inject VUI HTML structure dynamically
    injectVUIHtml();
    
    // 3. DOM Selectors
    const vuiContainer = document.querySelector(".vui-container");
    const vuiBtn = document.querySelector(".vui-btn");
    
    let currentState = 2; // Starts in State 2 (Voice / Microphone with tooltip)

    // 4. Position shifting logic - detects if OCR button is present on the page (estoque.html)
    // If it is, VUI automatically stacks above it to avoid UX overlaps
    const hasOcr = document.querySelector('[aria-label="Escanear Nota Fiscal (OCR)"]') !== null;
    if (hasOcr) {
        vuiContainer.classList.add("vui-has-ocr");
    }

    // 5. Tooltip hover control (Only works in State 2)
    vuiBtn.addEventListener("mouseenter", () => {
        if (currentState === 2) {
            vuiContainer.classList.add("vui-show-tooltip");
        }
    });

    vuiBtn.addEventListener("mouseleave", () => {
        vuiContainer.classList.remove("vui-show-tooltip");
    });

    // 6. Speech Recognition Logic
    let recognition = null;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'pt-BR'; // Assume português brasileiro

        recognition.onstart = function() {
            setVuiState(3); // Estado de gravação ativa
        };

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            console.log("Reconhecimento de voz:", transcript);
            
            // Define o texto no input e submete (Integração com estoque-ia.js)
            const aiInput = document.getElementById("ai-input");
            const aiSubmitBtn = document.getElementById("ai-submit");
            if (aiInput && aiSubmitBtn) {
                aiInput.value = transcript;
                aiSubmitBtn.click();
            }
        };

        recognition.onerror = function(event) {
            console.error("Erro na gravação de voz:", event.error);
            setVuiState(2);
        };

        recognition.onend = function() {
            setVuiState(2); // Volta ao estado inicial ao finalizar
        };
    } else {
        // Browser does NOT support native Speech Recognition (iOS Safari, Firefox Mobile, etc.)
        console.warn("Navegador não suporta Web Speech API.");
        
        // Inject a visible notification banner near the VUI button
        const noticeEl = document.createElement("div");
        noticeEl.className = "vui-unsupported-notice";
        noticeEl.innerHTML = `
            <span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">mic_off</span>
            Gravação de voz não é suportada neste navegador. Use o <strong>Google Chrome no Android</strong> para usar o comando de voz.
        `;
        noticeEl.style.cssText = "position:fixed;bottom:100px;right:16px;left:16px;z-index:9998;" +
            "background:#2d1b00;color:#ffddb3;padding:12px 16px;border-radius:12px;" +
            "font-size:13px;line-height:1.5;box-shadow:0 4px 12px rgba(0,0,0,.3);" +
            "display:none;max-width:400px;margin-left:auto;";
        document.body.appendChild(noticeEl);

        // Show the notice when user taps the mic button
        vuiBtn.addEventListener("click", (e) => {
            e.preventDefault();
            noticeEl.style.display = "block";
            // Auto-hide after 6 seconds
            clearTimeout(noticeEl._hideTimer);
            noticeEl._hideTimer = setTimeout(() => {
                noticeEl.style.display = "none";
            }, 6000);
        });

        // Skip the rest of the click handler setup below
        return;
    }

    // Click Handler para o Microfone (only reached when Speech API IS available)
    vuiBtn.addEventListener("click", (e) => {
        e.preventDefault();
        
        // Hide tooltip
        vuiContainer.classList.remove("vui-show-tooltip");
        
        if (currentState === 2) {
            // Se estiver inativo, inicia a gravação
            if (recognition) {
                try {
                    recognition.start();
                } catch (e) {
                    console.error("Microfone já está ativo.");
                }
            }
        } else if (currentState === 3) {
            // Se estiver gravando e clicar de novo, para a gravação
            if (recognition) {
                recognition.stop();
            }
            setVuiState(2);
        }
    });

    // Helper to apply state classes and manage styles
    function setVuiState(stateIndex) {
        currentState = stateIndex;
        
        // Reset classes
        vuiBtn.classList.remove("vui-state-1", "vui-state-2", "vui-state-3");
        // Apply target class
        vuiBtn.classList.add(`vui-state-${stateIndex}`);
    }

    function injectVUIHtml() {
        // Build floating container
        const container = document.createElement("div");
        container.className = "vui-container";
        container.innerHTML = `
            <div class="vui-tooltip">Voice message</div>
            <button class="vui-btn vui-state-2" aria-label="Microfone / Enviar">
                <div class="vui-inner-circle">
                    <!-- Black Arrow Icon (State 1) -->
                    <svg class="vui-icon vui-icon-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="12" y1="19" x2="12" y2="5"></line>
                        <polyline points="5 12 12 5 19 12"></polyline>
                    </svg>
                    <!-- Black Mic Icon (State 2) -->
                    <svg class="vui-icon vui-icon-mic-black" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                        <path d="M19 10v1a7 7 0 0 1-14 0v-1"></path>
                        <line x1="12" y1="19" x2="12" y2="22"></line>
                    </svg>
                </div>
                <!-- White Mic Icon (State 3) -->
                <svg class="vui-icon vui-icon-mic-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1"></path>
                    <line x1="12" y1="19" x2="12" y2="22"></line>
                </svg>
            </button>
        `;
        
        document.body.appendChild(container);
    }
});
