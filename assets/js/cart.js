// Estado do Carrinho (id -> quantidade)
let cart = {};

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
