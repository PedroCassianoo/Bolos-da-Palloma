// Formatação do WhatsApp e Redirecionamento Seguro (Sem Reverse Tabnabbing)
async function sendOrderToWhatsApp() {
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
        
        // UX: Feedback visual de Loading
        const submitBtn = checkoutForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.innerText : '';
        
        if (submitBtn) {
            submitBtn.innerText = 'Processando pedido...';
            submitBtn.disabled = true;
        }

        try {
            // Registrar vendas no Painel de Gestão via Serverless Function (server-side)
            // A inserção no banco é feita pelo backend (/api/register-sale.js)
            // que usa a service_role_key do Supabase e valida todos os campos.
            const pedidoId = crypto.randomUUID ? crypto.randomUUID() : 'pd-' + Date.now();
            const vendasParaInserir = [];
            
            const isoDate = formattedDate ? formattedDate.split('/').reverse().join('-') : new Date().toISOString().split('T')[0];
            
            Object.keys(cart).forEach(id => {
                const product = PRODUCTS.find(p => p.id === id);
                if (product) {
                    vendasParaInserir.push({
                        pedido_id: pedidoId,
                        data: isoDate,
                        produto: product.name,
                        categoria: product.category === 'caseiros' ? 'Caseiro' : product.category === 'confeitados' ? 'Confeitado' : 'Doce',
                        canal_venda: 'Cardápio Digital',
                        forma_pagamento: payMethodValue,
                        valor_venda: product.price * cart[id],
                        custo_estimado: 0,
                        lucro_liquido: product.price * cart[id], 
                        cliente_nome: clientName,
                        metodo_entrega: deliveryMethod,
                        endereco_entrega: deliveryMethod === 'delivery' ? sanitizeInput(deliveryAddress.value) : 'Retirada'
                    });
                }
            });
            
            if (vendasParaInserir.length > 0) {
                const response = await fetch('/api/register-sale', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: vendasParaInserir })
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `Erro HTTP ${response.status}`);
                }
            }

            // Sucesso garantido: Só chega aqui se o try não lançar erro
            triggerConfetti();

            // Redireciona com noopener, noreferrer para proteção contra Reverse Tabnabbing
            const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            if (newWindow) {
                newWindow.opener = null;
            }

            // Limpa carrinho e formulário 
            setTimeout(() => {
                cart = {};
                checkoutForm.reset();
                
                deliveryFields.classList.remove('hidden');
                pickupFields.classList.add('hidden');
                changeField.classList.add('hidden');
                
                updateCartUI();
                renderMenu('all');
                closeCart();
            }, 1000);

        } catch (error) {
            // Error Handling: Resiliência em caso de falha de conexão/banco
            console.error('Erro crítico ao salvar no painel:', error);
            alert('Tivemos um problema de conexão ao processar seu pedido. O registro não foi concluído. Por favor, verifique sua internet e tente novamente.');
        } finally {
            // UX: Restaura o botão independente de sucesso ou falha
            if (submitBtn) {
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        }
    }
}
