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

// Variável global para armazenar o último elemento focado antes de abrir um modal (A11y)
let lastActiveElement;

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
