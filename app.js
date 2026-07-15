// Configuração do Supabase (centralizada em supabase-config.js)
// As variáveis globais SUPABASE_URL, SUPABASE_KEY e supabaseClient
// são definidas no script carregado antes deste no HTML.

// 1. Carrega do localStorage imediatamente (síncrono) para evitar flashes de preços antigos
function loadLocalPrices() {
    try {
        const customCakes = localStorage.getItem('bolos_da_palloma_cakes');
        if (customCakes) {
            const customCakesData = JSON.parse(customCakes);
            PRODUCTS.forEach(product => {
                if (customCakesData[product.id] && typeof customCakesData[product.id].price === 'number') {
                    product.price = customCakesData[product.id].price;
                }
            });
        }
    } catch (e) {
        console.error('Erro ao carregar preços locais no cardápio:', e);
    }
}
loadLocalPrices();

// 2. Carrega do Supabase para atualizar com a versão mais recente da nuvem
async function loadRemotePrices() {
    if (!supabaseClient) return false;
    try {
        const { data, error } = await supabaseClient
            .from('Custos & Preços')
            .select('value')
            .eq('key', 'bolos_da_palloma_cakes')
            .maybeSingle();

        if (error) throw error;

        if (data && data.value) {
            const customCakesData = data.value;
            let pricesChanged = false;
            PRODUCTS.forEach(product => {
                if (customCakesData[product.id] && typeof customCakesData[product.id].price === 'number') {
                    if (product.price !== customCakesData[product.id].price) {
                        product.price = customCakesData[product.id].price;
                        pricesChanged = true;
                    }
                }
            });
            if (pricesChanged) {
                // Atualiza o cache local
                localStorage.setItem('bolos_da_palloma_cakes', JSON.stringify(customCakesData));
                return true;
            }
        }
    } catch (e) {
        console.error('Erro ao carregar preços remotos do Supabase:', e);
    }
    return false;
}

// Inicialização da Página
document.addEventListener('DOMContentLoaded', () => {
    // 1. Renderiza o menu imediatamente com os preços locais (TTI instantâneo e 0 CLS)
    renderMenu('all');
    setupEventListeners();
    updateCartUI();
    setupMinDateConstraint();

    // 2. Carrega e sincroniza dados em segundo plano (background thread simulation)
    loadRemotePrices().then(changed => {
        if (changed) {
            // Se houve mudança real, atualiza os preços no DOM pontualmente e a UI do carrinho
            updateDOMPrices();
            updateCartUI();
        }
    });
});

// Event Listeners
function setupEventListeners() {
    // Filtro de categorias
    categoriesTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            const category = e.target.getAttribute('data-category');
            renderMenu(category);
        }
    });

    // Botões do Bottom Nav
    navBtnMenu.addEventListener('click', () => {
        setActiveNav(navBtnMenu);
        closeCart();
        closeInfo();
    });

    navBtnCart.addEventListener('click', () => {
        setActiveNav(navBtnCart);
        openCart();
    });

    navBtnInfo.addEventListener('click', () => {
        setActiveNav(navBtnInfo);
        openInfo();
    });

    // Fechar gaveta e modais
    closeCartBtn.addEventListener('click', () => {
        closeCart();
        setActiveNav(navBtnMenu);
    });

    cartOverlay.addEventListener('click', () => {
        closeCart();
        setActiveNav(navBtnMenu);
    });

    closeInfoBtn.addEventListener('click', () => {
        closeInfo();
        setActiveNav(navBtnMenu);
    });

    infoOverlay.addEventListener('click', () => {
        closeInfo();
        setActiveNav(navBtnMenu);
    });

    // Toggle de Métodos de Entrega
    deliveryMethodRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const method = e.target.value;
            if (method === 'delivery') {
                deliveryFields.classList.remove('hidden');
                pickupFields.classList.add('hidden');
                deliveryAddress.required = true;
                deliveryTimeInput.required = true;
                pickupTime.required = false;
                document.querySelector('.delivery-summary-line').classList.remove('hidden');
            } else {
                deliveryFields.classList.add('hidden');
                pickupFields.classList.remove('hidden');
                deliveryAddress.required = false;
                deliveryTimeInput.required = false;
                pickupTime.required = true;
                document.querySelector('.delivery-summary-line').classList.add('hidden');
            }
            updateCartUI();
        });
    });

    // Toggle do campo de troco
    paymentMethod.addEventListener('change', (e) => {
        if (e.target.value === 'dinheiro') {
            changeField.classList.remove('hidden');
        } else {
            changeField.classList.add('hidden');
            changeAmount.value = '';
        }
    });

    // Envio do Formulário de Pedido
    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendOrderToWhatsApp();
    });

    // Evitar colisões do teclado virtual escondendo o bottom-nav usando a VisualViewport API
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            const nav = document.querySelector('.bottom-nav');
            if (!nav) return;
            // Se a altura do viewport visual diminuir abaixo de 80% da altura da janela,
            // é muito provável que o teclado virtual do celular tenha sido aberto
            if (window.visualViewport.height < window.innerHeight * 0.8) {
                nav.classList.add('hidden-keyboard');
            } else {
                nav.classList.remove('hidden-keyboard');
            }
        });
    }
}
