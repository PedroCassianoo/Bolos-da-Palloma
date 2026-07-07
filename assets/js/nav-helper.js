document.addEventListener("DOMContentLoaded", () => {
    // 1. Detect if running inside iframe
    const isFrame = window.self !== window.top;
    
    // Get the current page filename
    const path = window.location.pathname;
    const page = path.split("/").pop().toLowerCase();

    if (isFrame) {
        document.body.classList.add("in-iframe");
        return; // Stop execution to let the parent handle navigation
    } else {
        // Direct access redirect (excluding index.html and painel.html)
        if (page && !page.includes("painel.html") && !page.includes("index.html") && 
            (page.includes("estoque") || page.includes("receitas") || page.includes("receita") || page.includes("pedidos") || page.includes("pedido"))) {
            
            let route = "inicio";
            if (page.includes("estoque")) route = "estoque";
            else if (page.includes("receitas") || page.includes("receita")) route = "receitas";
            else if (page.includes("pedidos") || page.includes("pedido")) route = "pedidos";
            
            window.location.href = "painel.html?route=" + route;
            return;
        }
    }

    const mobileDrawer = document.getElementById("mobile-menu-drawer");
    const mobileDrawerOverlay = document.getElementById("mobile-drawer-overlay");

    // Helper to close mobile menu
    function closeMobileDrawer() {
        if (mobileDrawer) mobileDrawer.classList.remove("open");
        if (mobileDrawerOverlay) mobileDrawerOverlay.classList.remove("open");
    }

    // Helper to open mobile menu
    function openMobileDrawer() {
        if (mobileDrawer) mobileDrawer.classList.add("open");
        if (mobileDrawerOverlay) mobileDrawerOverlay.classList.add("open");
    }

    // 2. Delegate click listeners for routing (sidebar, bottom nav, drawer, dashboard cards, shortcuts)
    document.addEventListener("click", (e) => {
        // Nav Item Link
        const navItem = e.target.closest(".bolos-nav-item");
        if (navItem) {
            e.preventDefault();
            const route = navItem.getAttribute("data-target");
            if (route && window.selectRoute) {
                window.selectRoute(route);
            }
            
            // Fechar o drawer se o link clicado estiver dentro dele
            if (mobileDrawer && mobileDrawer.contains(navItem)) {
                closeMobileDrawer();
            }
            return;
        }

        // Interactive Dashboard Card or Alert Card
        const interactiveCard = e.target.closest(".interactive-dashboard-card, .interactive-alert-card");
        if (interactiveCard) {
            e.preventDefault();
            const route = interactiveCard.getAttribute("data-route");
            if (route && window.selectRoute) {
                window.selectRoute(route);
            }
            return;
        }

        // Shortcut Tile Button
        const shortcutBtn = e.target.closest(".shortcut-tile-btn");
        if (shortcutBtn) {
            e.preventDefault();
            const targetRoute = shortcutBtn.getAttribute("data-target");
            if (targetRoute && window.selectRoute) {
                window.selectRoute(targetRoute);
            }
            return;
        }
    });

    // 3. Controle de abertura/fechamento do Drawer Mobile (Slide da Esquerda)
    const mobileMenuTriggerTop = document.getElementById("btn-mobile-menu-trigger-top");
    const closeMobileMenu = document.getElementById("btn-close-mobile-menu");

    if (mobileMenuTriggerTop) {
        mobileMenuTriggerTop.addEventListener("click", (e) => {
            e.preventDefault();
            openMobileDrawer();
        });
    }

    if (closeMobileMenu) {
        closeMobileMenu.addEventListener("click", (e) => {
            e.preventDefault();
            closeMobileDrawer();
        });
    }

    if (mobileDrawerOverlay) {
        mobileDrawerOverlay.addEventListener("click", (e) => {
            e.preventDefault();
            closeMobileDrawer();
        });
    }
});
