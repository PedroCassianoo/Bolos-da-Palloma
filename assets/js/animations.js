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
