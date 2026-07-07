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

    // 6. Click Handler - Cycles State: 2 (Voice) -> 3 (Active) -> 1 (Send) -> 2 (Voice)
    vuiBtn.addEventListener("click", (e) => {
        e.preventDefault();
        
        // Hide tooltip immediately when switching states
        vuiContainer.classList.remove("vui-show-tooltip");
        
        if (currentState === 2) {
            // State 2 (Voice) -> State 3 (Active Recording)
            setVuiState(3);
        } else if (currentState === 3) {
            // State 3 (Active Recording) -> State 1 (Send Arrow)
            setVuiState(1);
        } else if (currentState === 1) {
            // State 1 (Send Arrow) -> State 2 (Voice)
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
