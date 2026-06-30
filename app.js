// Banco de Dados de Produtos
const PRODUCTS = [
    {
        id: 'cenoura-chocolate',
        name: 'Bolo de Cenoura com Brigadeiro',
        description: 'Massa fofinha de cenoura com cobertura generosa de brigadeiro gourmet tradicional.',
        price: 28.00,
        category: 'caseiros',
        image: 'assets/images/bolo_cenoura_brigadeiro.jpg',
        tag: 'Mais vendido'
    },
    {
        id: 'vulcao-ninho-nutella',
        name: 'Bolo Vulcão de Ninho com Nutella',
        description: 'Bolo caseiro com furo central totalmente preenchido por creme de leite Ninho e cobertura espessa de Nutella.',
        price: 38.00,
        category: 'caseiros',
        image: 'assets/images/bolo_vulcao_ninho_nutella.jpg',
        tag: 'Destaque'
    },
    {
        id: 'fuba-goiabada',
        name: 'Bolo de Fubá com Goiabada',
        description: 'O clássico bolo de fubá, super macio, com pedaços derretidos de goiabada cascão na massa.',
        price: 24.00,
        category: 'caseiros',
        image: 'assets/images/bolo_fuba_goiabada.jpg',
        tag: 'Caseirinho'
    },
    {
        id: 'trufado-chocolate',
        name: 'Bolo Trufado de Chocolate',
        description: 'Massa de cacau premium com recheio duplo de trufa de chocolate meio amargo e cobertura de ganache artesanal.',
        price: 75.00,
        category: 'confeitados',
        image: 'assets/images/bolo_trufado_chocolate.jpg',
        tag: 'Festa'
    },
    {
        id: 'ninho-morango',
        name: 'Bolo Ninho com Morangos Frescos',
        description: 'Massa pão de ló super leve, recheio cremoso de leite Ninho e morangos frescos selecionados picados.',
        price: 80.00,
        category: 'confeitados',
        image: 'assets/images/bolo_ninho_morango.jpg',
        tag: 'Campeão de Pedidos'
    },
    {
        id: 'red-velvet-cream',
        name: 'Bolo Red Velvet',
        description: 'Massa aveludada vermelha com recheio e cobertura cremosa de cream cheese e geleia artesanal de frutas vermelhas.',
        price: 85.00,
        category: 'confeitados',
        image: 'assets/images/bolo_red_velvet.jpg',
        tag: 'Premium'
    },
    {
        id: 'copo-felicidade-ninho',
        name: 'Copo da Felicidade de Morango',
        description: 'Deliciosas camadas de creme de Ninho, morangos frescos e ganache trufada de chocolate.',
        price: 18.00,
        category: 'doces',
        image: 'assets/images/copo_felicidade_morango.jpg',
        tag: 'Sobremesa'
    },
    {
        id: 'brownie-supremo',
        name: 'Brownie Supremo',
        description: 'Brownie denso, úmido e chocolatudo com cobertura de doce de leite cremoso e pedaço de morango.',
        price: 12.00,
        category: 'doces',
        image: 'assets/images/brownie_supremo.jpg',
        tag: 'Individual'
    }
];

// Configuração do Supabase
const SUPABASE_URL = 'https://iqakaoawviocutlcqnho.supabase.co';
const SUPABASE_KEY = 'sb_publishable_f9bxbWX2lzgkCNLkFzaYkw_hlubeV3U';
let supabaseClient = null;

if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

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

// WhatsApp oficial da Palloma
const WHATSAPP_NUMBER = '5519982354323';

// Estado do Carrinho (id -> quantidade)
let cart = {};

// Elementos do DOM
const menuItemsContainer = document.getElementById('menu-items-container');
const categoriesTabs = document.getElementById('categories-tabs');
const cartBadgeCount = document.getElementById('cart-badge-count');
const cartOverlay = document.getElementById('cart-overlay');
const cartDrawer = document.getElementById('cart-drawer');
const cartItemsList = document.getElementById('cart-items-list');
const checkoutForm = document.getElementById('checkout-form');
const infoOverlay = document.getElementById('info-overlay');
const infoModal = document.getElementById('info-modal');

// Botões de navegação e fechar
const navBtnMenu = document.getElementById('nav-btn-menu');
const navBtnCart = document.getElementById('nav-btn-cart');
const navBtnInfo = document.getElementById('nav-btn-info');
const closeCartBtn = document.getElementById('close-cart-btn');
const closeInfoBtn = document.getElementById('close-info-btn');

// Campos de checkout
const clientNameInput = document.getElementById('client-name');
const deliveryMethodRadios = document.getElementsByName('delivery-method');
const deliveryFields = document.getElementById('delivery-fields');
const pickupFields = document.getElementById('pickup-fields');
const deliveryAddress = document.getElementById('delivery-address');
const deliveryReference = document.getElementById('delivery-reference');
const deliveryTimeInput = document.getElementById('delivery-time');
const pickupTime = document.getElementById('pickup-time');
const paymentMethod = document.getElementById('payment-method');
const changeField = document.getElementById('change-field');
const changeAmount = document.getElementById('change-amount');

// Resumo financeiro
const summarySubtotal = document.getElementById('summary-subtotal');
const summaryDelivery = document.getElementById('summary-delivery');
const summaryTotal = document.getElementById('summary-total');
const btnSubmitOrder = document.getElementById('btn-submit-order');

// Atualização pontual de preços no DOM para evitar re-renderização completa e perda de estado (A11y/CLS)
function updateDOMPrices() {
    PRODUCTS.forEach(product => {
        const cards = document.querySelectorAll(`.product-card[data-id="${product.id}"]`);
        cards.forEach(card => {
            const priceEl = card.querySelector('.product-price');
            if (priceEl) {
                priceEl.textContent = product.price.toFixed(2).replace('.', ',');
            }
        });
    });
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

// Define a restrição de data mínima para amanhã (antecedência mínima de 24h)
function setupMinDateConstraint() {
    const dateInput = document.getElementById('order-date');
    if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        dateInput.min = `${yyyy}-${mm}-${dd}`;
    }
}

// Higienização de entrada para evitar injeção de formatação de markdown no WhatsApp e XSS
function sanitizeInput(text) {
    if (!text) return '';
    return text
        .trim()
        .replace(/[*_~`]/g, '')        // Remove formatações nativas do WhatsApp
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove caracteres invisíveis/de controle
        .replace(/\r?\n|\r/g, ' ');    // Transforma quebras de linha em espaços
}

// Proteção XSS básica na renderização dinâmica de strings
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

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

// Variável global para armazenar o último elemento focado antes de abrir um modal (A11y)
let lastActiveElement;

// Alternar navegação ativa
function setActiveNav(activeBtn) {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
}

// Drawer do Carrinho
function openCart() {
    lastActiveElement = document.activeElement;
    cartDrawer.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.classList.add('no-scroll');
    closeInfo();
    // Move o foco para o botão de fechar dentro do drawer para leitores de tela
    setTimeout(() => {
        const closeBtn = document.getElementById('close-cart-btn');
        if (closeBtn) closeBtn.focus();
    }, 100);
}

function closeCart() {
    cartDrawer.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.classList.remove('no-scroll');
    // Devolve o foco ao botão de origem
    if (lastActiveElement) {
        lastActiveElement.focus();
    }
}

// Modal de Info
function openInfo() {
    lastActiveElement = document.activeElement;
    infoModal.classList.add('active');
    infoOverlay.classList.add('active');
    document.body.classList.add('no-scroll');
    closeCart();
    // Move o foco para o botão de fechar dentro do modal
    setTimeout(() => {
        const closeBtn = document.getElementById('close-info-btn');
        if (closeBtn) closeBtn.focus();
    }, 100);
}

function closeInfo() {
    infoModal.classList.remove('active');
    infoOverlay.classList.remove('active');
    document.body.classList.remove('no-scroll');
    // Devolve o foco ao botão de origem
    if (lastActiveElement) {
        lastActiveElement.focus();
    }
}

// Retorno unificado ao menu (conserta bug de estado de clique)
window.backToMenu = function() {
    closeCart();
    setActiveNav(navBtnMenu);
};

// Renderizar Menu
function renderMenu(categoryFilter) {
    menuItemsContainer.innerHTML = '';
    
    const filteredProducts = categoryFilter === 'all' 
        ? PRODUCTS 
        : PRODUCTS.filter(p => p.category === categoryFilter);

    if (filteredProducts.length === 0) {
        menuItemsContainer.innerHTML = '<div class="loading-placeholder">Nenhum bolo encontrado nesta categoria.</div>';
        return;
    }

    filteredProducts.forEach(product => {
        const qtyInCart = cart[product.id] || 0;
        
        const card = document.createElement('article');
        card.className = 'product-card';
        card.setAttribute('data-id', product.id);

        let buttonArea = '';
        if (qtyInCart > 0) {
            buttonArea = `
                <div class="quantity-selector">
                    <button type="button" class="qty-btn dec-btn" onclick="decrementCart('${product.id}')" aria-label="Remover um de ${escapeHTML(product.name)}">
                        <svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
                    </button>
                    <span class="qty-number">${qtyInCart}</span>
                    <button type="button" class="qty-btn inc-btn" onclick="incrementCart('${product.id}')" aria-label="Adicionar mais um de ${escapeHTML(product.name)}">
                        <svg viewBox="0 0 24 24"><path d="M19 13h-6V7h-2v6H5v2h6v6h2v-6h6v-2z"/></svg>
                    </button>
                </div>
            `;
        } else {
            buttonArea = `
                <button type="button" class="btn-primary" onclick="addToCart('${product.id}', event)" id="btn-add-${product.id}">
                    <svg class="nav-icon" style="width:16px; height:16px; fill:currentColor;" viewBox="0 0 24 24"><path d="M19 13h-6V7h-2v6H5v2h6v6h2v-6h6v-2z"/></svg>
                    Adicionar
                </button>
            `;
        }

        card.innerHTML = `
            <div class="product-image-wrapper">
                <img src="${product.image}" alt="${escapeHTML(product.name)}" class="product-image" loading="lazy">
                ${product.tag ? `<span class="product-tag">${escapeHTML(product.tag)}</span>` : ''}
            </div>
            <div class="product-details">
                <h2 class="product-title">${escapeHTML(product.name)}</h2>
                <p class="product-description">${escapeHTML(product.description)}</p>
                <div class="product-footer">
                    <span class="product-price">${product.price.toFixed(2).replace('.', ',')}</span>
                    <div class="product-action-container">
                        ${buttonArea}
                    </div>
                </div>
            </div>
        `;

        menuItemsContainer.appendChild(card);
    });
}

// Otimização de DOM: Atualização pontual do estado do catálogo em vez de re-renderizar tudo
function updateProductActionUI(productId) {
    const card = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (!card) return;
    
    const actionContainer = card.querySelector('.product-action-container');
    const product = PRODUCTS.find(p => p.id === productId);
    const qtyInCart = cart[productId] || 0;
    
    if (qtyInCart > 0) {
        actionContainer.innerHTML = `
            <div class="quantity-selector">
                <button type="button" class="qty-btn dec-btn" onclick="decrementCart('${productId}')" aria-label="Remover um de ${escapeHTML(product.name)}">
                    <svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
                </button>
                <span class="qty-number">${qtyInCart}</span>
                <button type="button" class="qty-btn inc-btn" onclick="incrementCart('${productId}')" aria-label="Adicionar mais um de ${escapeHTML(product.name)}">
                    <svg viewBox="0 0 24 24"><path d="M19 13h-6V7h-2v6H5v2h6v6h2v-6h6v-2z"/></svg>
                </button>
            </div>
        `;
    } else {
        actionContainer.innerHTML = `
            <button type="button" class="btn-primary" onclick="addToCart('${productId}', event)" id="btn-add-${productId}">
                <svg class="nav-icon" style="width:16px; height:16px; fill:currentColor;" viewBox="0 0 24 24"><path d="M19 13h-6V7h-2v6H5v2h6v6h2v-6h6v-2z"/></svg>
                Adicionar
            </button>
        `;
    }
}

// Adicionar no Carrinho
window.addToCart = function(productId, event) {
    cart[productId] = 1;
    updateCartUI();
    updateProductActionUI(productId);
    if (event && event.currentTarget) {
        animateFlyingCake(productId, event.currentTarget);
    } else if (event && event.target) {
        animateFlyingCake(productId, event.target);
    }
};

// Incrementar Quantidade
window.incrementCart = function(productId) {
    cart[productId] = (cart[productId] || 0) + 1;
    updateCartUI();
    updateProductActionUI(productId);
};

// Decrementar Quantidade
window.decrementCart = function(productId) {
    if (cart[productId] > 1) {
        cart[productId] -= 1;
    } else {
        delete cart[productId];
    }
    updateCartUI();
    updateProductActionUI(productId);
};

// Atualizar UI do Carrinho
function updateCartUI() {
    let totalItems = 0;
    let subtotal = 0;
    
    Object.keys(cart).forEach(id => {
        const product = PRODUCTS.find(p => p.id === id);
        if (product) {
            totalItems += cart[id];
            subtotal += product.price * cart[id];
        }
    });

    // Atualizar badge no rodapé
    if (totalItems > 0) {
        cartBadgeCount.innerText = totalItems;
        cartBadgeCount.classList.remove('hidden');
    } else {
        cartBadgeCount.classList.add('hidden');
    }

    // Renderizar itens dentro da Gaveta do Carrinho
    if (totalItems === 0) {
        cartItemsList.innerHTML = `
            <div class="empty-cart-message">
                <svg viewBox="0 0 24 24"><path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm0 10c-2.76 0-5-2.24-5-5h2c0 1.66 1.34 3 3 3s3-1.34 3-3h2c0 2.76-2.24 5-5 5z"/></svg>
                <p>O seu carrinho está vazio</p>
                <button type="button" class="btn-primary" onclick="backToMenu()">Ver Bolos deliciosos</button>
            </div>
        `;
        checkoutForm.classList.add('hidden');
    } else {
        checkoutForm.classList.remove('hidden');
        cartItemsList.innerHTML = '';
        
        Object.keys(cart).forEach(id => {
            const product = PRODUCTS.find(p => p.id === id);
            if (product) {
                const itemRow = document.createElement('div');
                itemRow.className = 'cart-item-row';
                itemRow.innerHTML = `
                    <div class="cart-item-info">
                        <div class="cart-item-name">${escapeHTML(product.name)}</div>
                        <div class="cart-item-price">R$ ${(product.price * cart[id]).toFixed(2).replace('.', ',')}</div>
                    </div>
                    <div class="cart-item-actions">
                        <div class="quantity-selector">
                            <button type="button" class="qty-btn dec-btn" onclick="decrementCart('${product.id}')" aria-label="Remover um de ${escapeHTML(product.name)}">
                                <svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
                            </button>
                            <span class="qty-number">${cart[id]}</span>
                            <button type="button" class="qty-btn inc-btn" onclick="incrementCart('${product.id}')" aria-label="Adicionar mais um de ${escapeHTML(product.name)}">
                                <svg viewBox="0 0 24 24"><path d="M19 13h-6V7h-2v6H5v2h6v6h2v-6h6v-2z"/></svg>
                            </button>
                        </div>
                    </div>
                `;
                cartItemsList.appendChild(itemRow);
            }
        });
    }

    // Atualizar Resumo Financeiro
    summarySubtotal.innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    
    // Método de Entrega
    const activeMethodRadio = document.querySelector('input[name="delivery-method"]:checked');
    const deliveryMethod = activeMethodRadio ? activeMethodRadio.value : 'delivery';
    
    if (deliveryMethod === 'delivery') {
        summaryDelivery.innerText = 'A combinar';
        summaryTotal.innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    } else {
        summaryDelivery.innerText = 'Grátis';
        summaryTotal.innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    }

    // UX: Atualizar o valor final no botão principal de compra
    if (btnSubmitOrder) {
        if (totalItems > 0) {
            btnSubmitOrder.innerText = `Finalizar Pedido no WhatsApp • R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        } else {
            btnSubmitOrder.innerText = 'Finalizar Pedido no WhatsApp';
        }
    }
}

// Formatação do WhatsApp e Redirecionamento Seguro (Sem Reverse Tabnabbing)
function sendOrderToWhatsApp() {
    const clientName = sanitizeInput(clientNameInput.value);
    const activeMethodRadio = document.querySelector('input[name="delivery-method"]:checked');
    const deliveryMethod = activeMethodRadio ? activeMethodRadio.value : 'delivery';
    const payMethodValue = paymentMethod.value;
    
    const dateInput = document.getElementById('order-date');
    const orderDate = dateInput ? dateInput.value : '';
    
    if (!clientName) {
        alert('Por favor, informe seu nome.');
        return;
    }

    if (!orderDate) {
        alert('Por favor, defina a data de entrega ou retirada.');
        return;
    }

    // Validação de segurança da data programaticamente (antecedência de pelo menos 24h)
    const selectedDate = new Date(orderDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minAllowedDate = new Date(today);
    minAllowedDate.setDate(today.getDate() + 1); // Amanhã

    if (selectedDate < minAllowedDate) {
        alert('A antecedência mínima para encomenda é de 24 horas. Por favor, selecione uma data válida (a partir de amanhã).');
        return;
    }

    if (!payMethodValue) {
        alert('Por favor, selecione uma forma de pagamento.');
        return;
    }

    // Formatar data em PT-BR (dd/mm/aaaa)
    let formattedDate = '';
    if (orderDate) {
        const [year, month, day] = orderDate.split('-');
        formattedDate = `${day}/${month}/${year}`;
    }

    // 1. Construir lista de itens
    let itemsText = '';
    let subtotal = 0;
    
    Object.keys(cart).forEach(id => {
        const product = PRODUCTS.find(p => p.id === id);
        if (product) {
            const qty = cart[id];
            const itemPrice = product.price * qty;
            subtotal += itemPrice;
            itemsText += `• *${qty}x* ${product.name} - _R$ ${itemPrice.toFixed(2).replace('.', ',')}_\n`;
        }
    });

    // 2. Traduzir método de entrega e dados adicionais
    let deliveryText = '';
    if (deliveryMethod === 'delivery') {
        const addr = sanitizeInput(deliveryAddress.value);
        const ref = sanitizeInput(deliveryReference.value);
        const delivTime = deliveryTimeInput.value;
        
        if (!addr) {
            alert('Por favor, insira o endereço de entrega.');
            return;
        }
        if (!delivTime) {
            alert('Por favor, insira o horário desejado para a entrega.');
            return;
        }
        
        deliveryText = `*Modo:* Entrega\n*Data Desejada:* ${formattedDate}\n*Horário Desejado:* ${delivTime}\n*Endereço:* ${addr}`;
        if (ref) {
            deliveryText += `\n*Referência:* ${ref}`;
        }
    } else {
        const time = pickupTime.value;
        if (!time) {
            alert('Por favor, defina o horário de retirada.');
            return;
        }
        deliveryText = `*Modo:* Retirada no Local\n*Data Desejada:* ${formattedDate}\n*Horário Previsto:* ${time}`;
    }

    // 3. Traduzir forma de pagamento
    let paymentText = '';
    if (payMethodValue === 'pix') {
        paymentText = '*Pagamento:* Pix';
    } else if (payMethodValue === 'cartao') {
        paymentText = '*Pagamento:* Cartão de Crédito/Débito';
    } else if (payMethodValue === 'dinheiro') {
        paymentText = '*Pagamento:* Dinheiro';
        const change = sanitizeInput(changeAmount.value);
        if (change) {
            paymentText += ` (Troco para: ${change})`;
        }
    }

    // 4. Montar a mensagem completa do pedido
    const message = 
`*NOVO PEDIDO - BOLOS DA PALLOMA*
---------------------------------------
*Cliente:* ${clientName}
${deliveryText}
---------------------------------------
*Itens do Pedido:*
${itemsText}
---------------------------------------
*Subtotal:* R$ ${subtotal.toFixed(2).replace('.', ',')}
${deliveryMethod === 'delivery' ? '*Taxa de Entrega:* A combinar' : '*Taxa de Entrega:* Grátis (Retirada)'}
*Total Geral:* R$ ${subtotal.toFixed(2).replace('.', ',')}

${paymentText}
---------------------------------------
Enviado através do Cardápio Digital`;

    // 5. Codificar mensagem para URL do WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    // 6. Confirmação do fluxo de envio antes de limpar dados sensíveis
    if (confirm('Seu pedido está pronto! Clique em OK para enviar no WhatsApp.')) {
        // Disparar confetes visuais de comemoração nativos
        triggerConfetti();

        // Redireciona com noopener, noreferrer para proteção contra Reverse Tabnabbing
        const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        if (newWindow) {
            newWindow.opener = null;
        }

        // Limpa carrinho e formulário (segurança LGPD para dispositivos compartilhados)
        setTimeout(() => {
            cart = {};
            checkoutForm.reset();
            
            // Oculta os painéis condicionais do formulário para o estado padrão
            deliveryFields.classList.remove('hidden');
            pickupFields.classList.add('hidden');
            changeField.classList.add('hidden');
            
            updateCartUI();
            renderMenu('all');
            closeCart();
        }, 1000);
    }
}

// Animação física 2D de curva parabólica para o "Bolo Voador"
function animateFlyingCake(productId, startElement) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const cartBtn = document.getElementById('nav-btn-cart');
    if (!cartBtn) return;

    // Criar elemento flyer (contêiner externo)
    const flyer = document.createElement('div');
    flyer.className = 'cake-flyer';

    // Criar a imagem interna
    const flyerImg = document.createElement('img');
    flyerImg.src = product.image;
    flyer.appendChild(flyerImg);
    document.body.appendChild(flyer);

    // Bounding Client Rects
    const startRect = startElement.getBoundingClientRect();
    const endRect = cartBtn.getBoundingClientRect();

    // Posicionar no centro do botão clicado
    const startX = startRect.left + startRect.width / 2 - 22; // 22 é metade da largura (44px)
    const startY = startRect.top + startRect.height / 2 - 22;

    const endX = endRect.left + endRect.width / 2 - 22;
    const endY = endRect.top + endRect.height / 2 - 22;

    flyer.style.left = `${startX}px`;
    flyer.style.top = `${startY}px`;

    // Calcular deslocamentos
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    // Forçar reflow para registrar posição inicial
    void flyer.offsetWidth;

    // Aplicar a animação
    flyer.style.transform = `translate3d(${deltaX}px, 0, 0)`;
    flyerImg.style.transform = `translate3d(0, ${deltaY}px, 0) scale(0.3)`;
    flyerImg.style.opacity = '0.5';

    // Limpar DOM e disparar animação de feedback do carrinho após 800ms
    setTimeout(() => {
        flyer.remove();
        
        const badge = document.getElementById('cart-badge-count');
        if (badge) {
            badge.classList.remove('cart-badge-bounce');
            void badge.offsetWidth; // Force reflow
            badge.classList.add('cart-badge-bounce');
        }
    }, 800);
}

// Animação nativa de Confetes em Canvas HTML5 (Offline & Alta Performance)
function triggerConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const colors = ['#ffeac0', '#a05d25', '#707042', '#8c5020', '#ffb7b2', '#ffffff'];
    const particles = Array.from({ length: 80 }, () => ({
        x: canvas.width / 2, // Lançamento a partir do centro inferior
        y: canvas.height - 50,
        r: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0,
        vy: -(Math.random() * 14 + 10), // Impulso vertical inicial
        vx: Math.random() * 12 - 6 // Dispersão horizontal
    }));
    
    let animationFrameId;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;
        
        particles.forEach(p => {
            p.y += p.vy;
            p.x += p.vx;
            p.vy += 0.45; // Aceleração da gravidade
            p.tiltAngle += p.tiltAngleIncremental;
            p.tilt = Math.sin(p.tiltAngle) * 15;
            
            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
            ctx.stroke();
            
            if (p.y < canvas.height + 20) {
                active = true;
            }
        });
        
        if (active) {
            animationFrameId = requestAnimationFrame(draw);
        } else {
            window.removeEventListener('resize', resizeCanvas);
            canvas.remove();
        }
    }
    draw();
}
