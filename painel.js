document.addEventListener('DOMContentLoaded', function() {
    
    // ==========================================
    // NOTIFICAÇÕES TOAST
    // ==========================================
    function showToast(message) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span>✨</span><span>${message}</span>`;
        container.appendChild(toast);
        
        // Remove após 3 segundos
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // ==========================================
    // DATASET DE BOLOS (PRODUTOS) E CUSTOS REALISTAS
    // ==========================================
    const DEFAULT_CAKES = {
        'cenoura-chocolate': {
            id: 'cenoura-chocolate',
            name: 'Bolo de Cenoura com Brigadeiro',
            category: 'caseiros',
            image: 'assets/images/bolo_cenoura_brigadeiro.jpg',
            tag: 'Mais vendido',
            price: 28.00,
            farinha: 2.00,
            ovos: 1.50,
            acucarManteiga: 2.10,
            outros: 3.00,
            gas: 1.00,
            embalagem: 2.00,
            tempo: 30,
            valorHora: 16.00,
            margin: 30
        },
        'vulcao-ninho-nutella': {
            id: 'vulcao-ninho-nutella',
            name: 'Bolo Vulcão de Ninho com Nutella',
            category: 'caseiros',
            image: 'assets/images/bolo_vulcao_ninho_nutella.jpg',
            tag: 'Destaque',
            price: 38.00,
            farinha: 2.50,
            ovos: 2.00,
            acucarManteiga: 2.60,
            outros: 5.50,
            gas: 1.00,
            embalagem: 3.00,
            tempo: 30,
            valorHora: 20.00,
            margin: 30
        },
        'fuba-goiabada': {
            id: 'fuba-goiabada',
            name: 'Bolo de Fubá com Goiabada',
            category: 'caseiros',
            image: 'assets/images/bolo_fuba_goiabada.jpg',
            tag: 'Caseirinho',
            price: 24.00,
            farinha: 1.50,
            ovos: 1.50,
            acucarManteiga: 1.80,
            outros: 2.00,
            gas: 1.00,
            embalagem: 2.00,
            tempo: 30,
            valorHora: 14.00,
            margin: 30
        },
        'trufado-chocolate': {
            id: 'trufado-chocolate',
            name: 'Bolo Trufado de Chocolate',
            category: 'confeitados',
            image: 'assets/images/bolo_trufado_chocolate.jpg',
            tag: 'Festa',
            price: 75.00,
            farinha: 4.00,
            ovos: 3.00,
            acucarManteiga: 4.50,
            outros: 12.00,
            gas: 1.50,
            embalagem: 4.50,
            tempo: 60,
            valorHora: 23.00,
            margin: 30
        },
        'ninho-morango': {
            id: 'ninho-morango',
            name: 'Bolo Ninho com Morangos Frescos',
            category: 'confeitados',
            image: 'assets/images/bolo_ninho_morango.jpg',
            tag: 'Campeão de Pedidos',
            price: 80.00,
            farinha: 4.00,
            ovos: 3.00,
            acucarManteiga: 4.50,
            outros: 14.00,
            gas: 1.50,
            embalagem: 5.00,
            tempo: 60,
            valorHora: 24.00,
            margin: 30
        },
        'red-velvet-cream': {
            id: 'red-velvet-cream',
            name: 'Bolo Red Velvet',
            category: 'confeitados',
            image: 'assets/images/bolo_red_velvet.jpg',
            tag: 'Premium',
            price: 85.00,
            farinha: 4.50,
            ovos: 3.50,
            acucarManteiga: 5.00,
            outros: 17.50,
            gas: 1.50,
            embalagem: 5.50,
            tempo: 60,
            valorHora: 22.00,
            margin: 30
        },
        'copo-felicidade-ninho': {
            id: 'copo-felicidade-ninho',
            name: 'Copo da Felicidade de Morango',
            category: 'doces',
            image: 'assets/images/copo_felicidade_morango.jpg',
            tag: 'Sobremesa',
            price: 18.00,
            farinha: 1.00,
            ovos: 1.00,
            acucarManteiga: 1.60,
            outros: 3.00,
            gas: 0.50,
            embalagem: 1.50,
            tempo: 15,
            valorHora: 16.00,
            margin: 30
        },
        'brownie-supremo': {
            id: 'brownie-supremo',
            name: 'Brownie Supremo',
            category: 'doces',
            image: 'assets/images/brownie_supremo.jpg',
            tag: 'Individual',
            price: 12.00,
            farinha: 0.80,
            ovos: 0.80,
            acucarManteiga: 1.30,
            outros: 1.50,
            gas: 0.50,
            embalagem: 1.00,
            tempo: 15,
            valorHora: 10.00,
            margin: 30
        }
    };

    // ==========================================
    // CONFIGURAÇÃO DO SUPABASE
    // ==========================================
    const SUPABASE_URL = 'https://iqakaoawviocutlcqnho.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_f9bxbWX2lzgkCNLkFzaYkw_hlubeV3U';
    let supabaseClient = null;

    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }

    let cakesData = {};
    let activeCategoryFilter = 'all';

    function loadLocalCakesData() {
        try {
            const saved = localStorage.getItem('bolos_da_palloma_cakes');
            if (saved) {
                let parsed = JSON.parse(saved);
                if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
                    parsed = {};
                }
                cakesData = parsed;
                // Garantir que todos os bolos padrão existam se algum novo for adicionado
                Object.keys(DEFAULT_CAKES).forEach(key => {
                    if (!cakesData[key]) {
                        cakesData[key] = { ...DEFAULT_CAKES[key] };
                    } else {
                        // Sempre garantir que usamos a imagem correta do DEFAULT_CAKES para evitar dados desatualizados no local storage
                        cakesData[key].image = DEFAULT_CAKES[key].image;
                    }
                });
            } else {
                cakesData = JSON.parse(JSON.stringify(DEFAULT_CAKES));
            }
        } catch (e) {
            console.error("Erro ao ler dados do localStorage:", e);
            cakesData = JSON.parse(JSON.stringify(DEFAULT_CAKES));
        }
    }

    async function loadRemoteCakesData() {
        if (!supabaseClient) return;
        try {
            const { data, error } = await supabaseClient
                .from('Custos & Preços')
                .select('value')
                .eq('key', 'bolos_da_palloma_cakes')
                .maybeSingle();

            if (error) throw error;

            if (data && data.value) {
                let remoteCakes = data.value;
                if (remoteCakes === null || typeof remoteCakes !== 'object' || Array.isArray(remoteCakes)) {
                    remoteCakes = {};
                }
                // Garantir que todos os bolos padrão existam
                Object.keys(DEFAULT_CAKES).forEach(key => {
                    if (!remoteCakes[key]) {
                        remoteCakes[key] = { ...DEFAULT_CAKES[key] };
                    } else {
                        // Sempre garantir que usamos a imagem correta do DEFAULT_CAKES para evitar dados desatualizados da nuvem
                        remoteCakes[key].image = DEFAULT_CAKES[key].image;
                    }
                });

                // Comparação de string JSON para evitar reflows e re-renders se os dados forem idênticos
                const localStr = JSON.stringify(cakesData);
                const remoteStr = JSON.stringify(remoteCakes);

                if (localStr !== remoteStr) {
                    cakesData = remoteCakes;
                    // Salvar no localStorage local
                    localStorage.setItem('bolos_da_palloma_cakes', JSON.stringify(cakesData));
                    
                    // Recalcular faturamento e renderizar com dados atualizados
                    calculateCapacity();
                    renderCakesGrid();
                    showToast("Dados sincronizados com a nuvem!");
                }
            }
        } catch (e) {
            console.error("Erro ao buscar dados do Supabase:", e);
        }
    }

    async function saveRemoteCakesData() {
        if (!supabaseClient) return;
        try {
            const { error } = await supabaseClient
                .from('Custos & Preços')
                .upsert({ key: 'bolos_da_palloma_cakes', value: cakesData });

            if (error) throw error;
        } catch (e) {
            console.error("Erro ao salvar dados no Supabase:", e);
            showToast("Erro ao sincronizar com a nuvem!");
        }
    }

    // (A inicialização dos dados agora é feita após a autenticação do usuário no Supabase)

    let activeCakeId = null;

    // ==========================================
    // 1. GERENCIAMENTO DE ABAS
    // ==========================================
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active de todas as abas e botões
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Adiciona active no botão atual e na aba correspondente
            button.classList.add('active');
            const targetTab = button.getAttribute('data-tab');
            document.getElementById(`tab-${targetTab}`).classList.add('active');

            // Voltar para a lista se alternar para a aba de Custo & Preço
            if (targetTab === 'custo-preco') {
                activeCakeId = null;
                document.getElementById('subview-cake-details').classList.add('hidden');
                document.getElementById('subview-cake-list').classList.remove('hidden');
            }
        });
    });

    // ==========================================
    // HELPERS DE FORMATAÇÃO DE MOEDA (REAL)
    // ==========================================
    function formatCurrency(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function formatCurrencyWhole(value) {
        return value.toLocaleString('pt-BR', { 
            style: 'currency', 
            currency: 'BRL',
            maximumFractionDigits: 0 
        });
    }

    // ==========================================
    // HELPER PARA ATUALIZAR O RASTRO DO SLIDER (PROGRESSO VISUAL)
    // ==========================================
    function updateSliderTrack(slider) {
        const min = parseFloat(slider.min) || 0;
        const max = parseFloat(slider.max) || 100;
        const value = parseFloat(slider.value) || 0;
        const percent = ((value - min) / (max - min)) * 100;
        
        let color = 'var(--primary)'; // Padrão chocolate
        if (slider.id === 'input-pct-colegas') color = 'var(--status-green)';
        else if (slider.id === 'input-pct-eventos') color = 'var(--color-eventos)';
        
        slider.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${percent}%, rgba(77, 43, 15, 0.1) ${percent}%, rgba(77, 43, 15, 0.1) 100%)`;
    }

    // Inicializar rastros para todos os sliders range da página
    const allSliders = document.querySelectorAll('input[type="range"]');
    allSliders.forEach(slider => {
        updateSliderTrack(slider);
        slider.addEventListener('input', () => updateSliderTrack(slider));
    });

    // ==========================================
    // 2. ABA 1: CUSTO & PREÇO (SUBVIEWS E CÁLCULOS)
    // ==========================================
    const inputFarinha = document.getElementById('input-farinha');
    const inputOvos = document.getElementById('input-ovos');
    const inputAcucarManteiga = document.getElementById('input-acucar-manteiga');
    const inputOutros = document.getElementById('input-outros');
    const inputGas = document.getElementById('input-gas');
    const inputEmbalagem = document.getElementById('input-embalagem');
    const inputTempo = document.getElementById('input-tempo');
    const inputValorHora = document.getElementById('input-valor-hora');
    const inputMargin = document.getElementById('input-margin');
    
    // Outputs
    const calcIngredientes = document.getElementById('calc-ingredientes');
    const calcOperacional = document.getElementById('calc-operacional');
    const calcMaoDeObra = document.getElementById('calc-mao-de-obra');
    const calcCustoTotal = document.getElementById('calc-custo-total');
    const marginValueText = document.getElementById('margin-value');
    const priceSugerido = document.getElementById('price-sugerido');
    const priceLucroBolo = document.getElementById('price-lucro-bolo');
    const priceLucroMensal = document.getElementById('price-lucro-mensal');
    const labelLucroMensal = document.getElementById('label-lucro-mensal');

    // Retorna a capacidade mensal em bolos com base na Aba 2
    function getVolumeMes() {
        const diasTrabalho = Math.max(0, parseInt(inputDiasTrabalho.value) || 0);
        const bolosDia = Math.max(0, parseInt(inputBolosDia.value) || 0);
        return diasTrabalho * bolosDia * 4;
    }

    function calculateCostAndPrice() {
        // Obter valores numéricos
        const farinha = Math.max(0, parseFloat(inputFarinha.value) || 0);
        const ovos = Math.max(0, parseFloat(inputOvos.value) || 0);
        const acucarManteiga = Math.max(0, parseFloat(inputAcucarManteiga.value) || 0);
        const outros = Math.max(0, parseFloat(inputOutros.value) || 0);
        const gas = Math.max(0, parseFloat(inputGas.value) || 0);
        const embalagem = Math.max(0, parseFloat(inputEmbalagem.value) || 0);
        const tempo = Math.max(0, parseFloat(inputTempo.value) || 0);
        const valorHora = Math.max(0, parseFloat(inputValorHora.value) || 0);
        const margemPercentual = Math.max(0, parseFloat(inputMargin.value) || 0);

        // Cálculos
        const totalIngredientes = farinha + ovos + acucarManteiga + outros;
        const totalOperacional = gas + embalagem;
        const totalMaoDeObra = (tempo / 60) * valorHora;
        const custoTotal = totalIngredientes + totalOperacional + totalMaoDeObra;

        // Precificação (Fórmula de Margem de Lucro Real)
        const margemDecimal = Math.min(0.99, margemPercentual / 100);
        const precoSugerido = custoTotal / (1 - margemDecimal);
        const lucroBolo = precoSugerido - custoTotal;
        
        // Integrado dinamicamente com a capacidade
        const volumeMes = getVolumeMes();
        const lucroMensal = lucroBolo * volumeMes;

        // Atualizar interface
        calcIngredientes.textContent = formatCurrency(totalIngredientes);
        calcOperacional.textContent = formatCurrency(totalOperacional);
        calcMaoDeObra.textContent = formatCurrency(totalMaoDeObra);
        calcCustoTotal.textContent = formatCurrency(custoTotal);
        
        marginValueText.textContent = `${margemPercentual}%`;
        priceSugerido.textContent = formatCurrency(precoSugerido);
        priceLucroBolo.textContent = formatCurrency(lucroBolo);
        
        labelLucroMensal.textContent = `Lucro em ${volumeMes} bolos/mês`;
        priceLucroMensal.textContent = formatCurrencyWhole(Math.round(lucroMensal));
    }

    // Escuta nos inputs da calculadora
    const costInputs = [
        inputFarinha, inputOvos, inputAcucarManteiga, inputOutros,
        inputGas, inputEmbalagem, inputTempo, inputValorHora, inputMargin
    ];
    costInputs.forEach(input => {
        input.addEventListener('input', calculateCostAndPrice);
    });

    // Renderizar a grade de bolos
    const cakesGrid = document.querySelector('.cakes-grid');
    function renderCakesGrid() {
        if (!cakesGrid) return;
        cakesGrid.innerHTML = '';
        
        Object.keys(cakesData).forEach(key => {
            const cake = cakesData[key];
            
            // Filtro de categoria
            const cakeCategory = cake.category === 'caseiros' ? 'caseiro' : cake.category === 'confeitados' ? 'confeitado' : 'doce';
            if (activeCategoryFilter !== 'all' && cakeCategory !== activeCategoryFilter) {
                return;
            }
            
            // Calcular margem de lucro real atual
            const ingredientsCost = cake.farinha + cake.ovos + cake.acucarManteiga + cake.outros;
            const operationalCost = cake.gas + cake.embalagem;
            const laborCost = (cake.tempo / 60) * cake.valorHora;
            const totalCost = ingredientsCost + operationalCost + laborCost;
            
            const price = cake.price;
            let profitPercent = 0;
            let profitClass = 'profit-none';
            let profitText = 'Sem lucro';
            
            if (price > 0) {
                const profitAmount = price - totalCost;
                profitPercent = Math.round((profitAmount / price) * 100);
                if (profitPercent > 0) {
                    profitClass = 'profit-positive';
                    profitText = `Lucro: ${profitPercent}%`;
                } else if (profitPercent < 0) {
                    profitClass = 'profit-negative';
                    profitText = `Prejuízo: ${Math.abs(profitPercent)}%`;
                }
            }
            
            const card = document.createElement('div');
            card.className = 'cake-card';
            card.dataset.id = cake.id;
            
            const tagText = cake.tag || (cake.category === 'caseiros' ? 'Caseiro' : cake.category === 'confeitados' ? 'Confeitado' : 'Doce');

            card.innerHTML = `
                <div class="cake-card-img-wrapper">
                    <span class="cake-card-tag">${tagText}</span>
                    <img src="${cake.image}" alt="${cake.name}" class="cake-card-img" onerror="this.src='assets/images/logo_icon.png'">
                </div>
                <div class="cake-card-content">
                    <h4 class="cake-card-title">${cake.name}</h4>
                    <div class="cake-card-footer">
                        <span class="cake-card-price">${formatCurrency(cake.price)}</span>
                        <span class="profit-badge ${profitClass}">${profitText}</span>
                    </div>
                    <button class="cake-card-add-sale-btn" title="Registrar +1 Vendido">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16" style="stroke-width: 2.5;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        +1 Vendido
                    </button>
                </div>
            `;
            
            // Configurar botão de venda rápida
            const btnSold = card.querySelector('.cake-card-add-sale-btn');
            if (btnSold) {
                btnSold.addEventListener('click', (e) => {
                    e.stopPropagation(); // Evita abrir os detalhes de precificação do bolo
                    openQuickSaleModal(cake.id);
                });
            }
            
            card.addEventListener('click', () => {
                selectCake(cake.id);
            });
            
            cakesGrid.appendChild(card);
        });
    }

    // Selecionar um bolo e abrir subview de detalhes
    function selectCake(cakeId) {
        const cake = cakesData[cakeId];
        if (!cake) return;
        
        activeCakeId = cakeId;
        
        // Alternar subviews
        document.getElementById('subview-cake-list').classList.add('hidden');
        document.getElementById('subview-cake-details').classList.remove('hidden');
        
        // Preencher informações do cabeçalho
        document.getElementById('active-cake-name').textContent = cake.name;
        document.getElementById('active-cake-image').src = cake.image;
        document.getElementById('active-cake-category').textContent = cake.category === 'caseiros' ? 'Caseiro' : cake.category === 'confeitados' ? 'Confeitado' : 'Doce';
        
        // Preencher inputs do formulário
        inputFarinha.value = cake.farinha.toFixed(2);
        inputOvos.value = cake.ovos.toFixed(2);
        inputAcucarManteiga.value = cake.acucarManteiga.toFixed(2);
        inputOutros.value = cake.outros.toFixed(2);
        inputGas.value = cake.gas.toFixed(2);
        inputEmbalagem.value = cake.embalagem.toFixed(2);
        inputTempo.value = cake.tempo;
        inputValorHora.value = cake.valorHora.toFixed(2);
        inputMargin.value = cake.margin;
        
        // Atualizar rastro do slider da margem
        updateSliderTrack(inputMargin);
        
        // Recalcular custos e precificação sugerida
        calculateCostAndPrice();
    }

    // Botão de Voltar para a lista
    const btnBackToList = document.getElementById('btn-back-to-list');
    if (btnBackToList) {
        btnBackToList.addEventListener('click', () => {
            activeCakeId = null;
            document.getElementById('subview-cake-details').classList.add('hidden');
            document.getElementById('subview-cake-list').classList.remove('hidden');
        });
    }

    // Botão de Salvar Novo Preço
    const btnSavePrice = document.getElementById('btn-save-price');
    if (btnSavePrice) {
        btnSavePrice.addEventListener('click', () => {
            if (!activeCakeId) return;
            
            const farinha = Math.max(0, parseFloat(inputFarinha.value) || 0);
            const ovos = Math.max(0, parseFloat(inputOvos.value) || 0);
            const acucarManteiga = Math.max(0, parseFloat(inputAcucarManteiga.value) || 0);
            const outros = Math.max(0, parseFloat(inputOutros.value) || 0);
            const gas = Math.max(0, parseFloat(inputGas.value) || 0);
            const embalagem = Math.max(0, parseFloat(inputEmbalagem.value) || 0);
            const tempo = Math.max(0, parseFloat(inputTempo.value) || 0);
            const valorHora = Math.max(0, parseFloat(inputValorHora.value) || 0);
            const margemPercentual = Math.max(0, parseFloat(inputMargin.value) || 0);
            
            const totalCost = farinha + ovos + acucarManteiga + outros + gas + embalagem + (tempo / 60) * valorHora;
            const margemDecimal = Math.min(0.99, margemPercentual / 100);
            const suggested = totalCost / (1 - margemDecimal);
            
            // Atualizar base local
            cakesData[activeCakeId].farinha = farinha;
            cakesData[activeCakeId].ovos = ovos;
            cakesData[activeCakeId].acucarManteiga = acucarManteiga;
            cakesData[activeCakeId].outros = outros;
            cakesData[activeCakeId].gas = gas;
            cakesData[activeCakeId].embalagem = embalagem;
            cakesData[activeCakeId].tempo = tempo;
            cakesData[activeCakeId].valorHora = valorHora;
            cakesData[activeCakeId].margin = margemPercentual;
            cakesData[activeCakeId].price = parseFloat(suggested.toFixed(2));
            
            // Persistir no localStorage
            localStorage.setItem('bolos_da_palloma_cakes', JSON.stringify(cakesData));
            
            // Persistir no Supabase
            saveRemoteCakesData();
            
            showToast('Preço atualizado com sucesso!');
            
            // Recalcular e renderizar lista novamente
            renderCakesGrid();
        });
    }

    // ==========================================
    // 2.2. FATURAMENTO E VENDAS (TOTAL DO DIA)
    // ==========================================
    let salesData = [];
    
    // Helper para obter a data local no formato YYYY-MM-DD
    function getLocalDateString(date) {
        const offset = date.getTimezoneOffset();
        return new Date(date.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
    }
    
    let activeSaleDate = getLocalDateString(new Date());
    
    // Carrega dados de vendas do Supabase
    async function loadSalesData() {
        if (!supabaseClient) return;
        try {
            const { data, error } = await supabaseClient
                .from('vendas')
                .select('*')
                .order('data', { ascending: false })
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            if (data) {
                salesData = data;
                updateTotalDiaCard();
                renderDailySales(activeSaleDate);
            }
        } catch (e) {
            console.error("Erro ao buscar vendas do Supabase:", e);
        }
    }
    
    // Atualiza o texto do Card "TOTAL DO DIA" na tela inicial e na sidebar
    function updateTotalDiaCard() {
        const todayStr = getLocalDateString(new Date());
        const todaySales = salesData.filter(s => s.data === todayStr);
        const todayTotalVal = todaySales.reduce((sum, s) => sum + parseFloat(s.valor_venda), 0);
        const todayCount = todaySales.length;

        // Card no grid (se ainda existir)
        const totalCard = document.getElementById('card-total-dia');
        if (totalCard) {
            const valEl = totalCard.querySelector('.total-card-value');
            const subtextEl = totalCard.querySelector('.total-card-subtext');
            if (valEl) valEl.textContent = formatCurrency(todayTotalVal);
            if (subtextEl) subtextEl.textContent = `${todayCount} venda${todayCount === 1 ? '' : 's'} hoje`;
        }

        // Elementos da Sidebar Premium
        const sidebarValEl = document.getElementById('sidebar-revenue-amount');
        const sidebarCountEl = document.getElementById('sidebar-total-count');
        if (sidebarValEl) sidebarValEl.textContent = formatCurrency(todayTotalVal).replace('R$', '').trim();
        if (sidebarCountEl) sidebarCountEl.textContent = `${todayCount} venda${todayCount === 1 ? '' : 's'}`;

        // Renderizar a lista de vendas na sidebar
        renderSidebarSales(todaySales);
    }
    
    // Abre a subview de controle de faturamento
    function openSalesSubview() {
        document.getElementById('subview-cake-list').classList.add('hidden');
        document.getElementById('subview-total-dia').classList.remove('hidden');
        
        // Preencher o select de produtos com os bolos ativos
        const selectProduct = document.getElementById('select-sale-product');
        selectProduct.innerHTML = '<option value="" disabled selected>Selecione o bolo/doce...</option>';
        
        Object.keys(cakesData).forEach(key => {
            const cake = cakesData[key];
            const option = document.createElement('option');
            option.value = key;
            option.textContent = cake.name;
            selectProduct.appendChild(option);
        });
        
        // Inicializar input de data
        const dateInput = document.getElementById('input-sale-date');
        dateInput.value = activeSaleDate;
        
        // Renderizar vendas do dia
        renderDailySales(activeSaleDate);
    }
    
    // Voltar da subview de faturamento para o grid
    const btnBackToListTotal = document.getElementById('btn-back-to-list-total');
    if (btnBackToListTotal) {
        btnBackToListTotal.addEventListener('click', () => {
            document.getElementById('subview-total-dia').classList.add('hidden');
            document.getElementById('subview-cake-list').classList.remove('hidden');
        });
    }
    
    // Escutar mudanças no select de produto para auto-preenchimento
    const selectSaleProduct = document.getElementById('select-sale-product');
    const inputSaleValue = document.getElementById('input-sale-value');
    const inputSaleCost = document.getElementById('input-sale-cost');
    
    if (selectSaleProduct) {
        selectSaleProduct.addEventListener('change', () => {
            const cakeId = selectSaleProduct.value;
            const cake = cakesData[cakeId];
            if (cake) {
                inputSaleValue.value = cake.price.toFixed(2);
                // Calcular custo real atual
                const farinha = cake.farinha || 0;
                const ovos = cake.ovos || 0;
                const acucarManteiga = cake.acucarManteiga || 0;
                const outros = cake.outros || 0;
                const gas = cake.gas || 0;
                const embalagem = cake.embalagem || 0;
                const tempo = cake.tempo || 0;
                const valorHora = cake.valorHora || 0;
                const totalCost = farinha + ovos + acucarManteiga + outros + gas + embalagem + (tempo / 60) * valorHora;
                
                inputSaleCost.value = totalCost.toFixed(2);
            }
        });
    }
    
    // Gerenciador de badges rápidos
    let activeChannel = 'WhatsApp';
    let activePayment = 'PIX';
    
    const channelBadges = document.querySelectorAll('#canal-venda-badges .badge-btn');
    channelBadges.forEach(badge => {
        badge.addEventListener('click', () => {
            channelBadges.forEach(b => b.classList.remove('active'));
            badge.classList.add('active');
            activeChannel = badge.getAttribute('data-value');
        });
    });
    
    const paymentBadges = document.querySelectorAll('#forma-pagamento-badges .badge-btn');
    paymentBadges.forEach(badge => {
        badge.addEventListener('click', () => {
            paymentBadges.forEach(b => b.classList.remove('active'));
            badge.classList.add('active');
            activePayment = badge.getAttribute('data-value');
        });
    });
    
    // Registrar nova venda
    const btnSaveSale = document.getElementById('btn-save-sale');
    if (btnSaveSale) {
        btnSaveSale.addEventListener('click', async () => {
            if (!selectSaleProduct.value) {
                showToast("Selecione o produto vendido!");
                return;
            }
            
            const valorVenda = parseFloat(inputSaleValue.value) || 0;
            const custoEstimado = parseFloat(inputSaleCost.value) || 0;
            
            const cake = cakesData[selectSaleProduct.value];
            const produto = cake.name;
            const categoria = cake.category === 'caseiros' ? 'Caseiro' : cake.category === 'confeitados' ? 'Confeitado' : 'Doce';
            
            const lucroLiquido = valorVenda - custoEstimado;
            const margemLucro = custoEstimado > 0 ? (lucroLiquido / custoEstimado) * 100 : 0;
            
            const newSale = {
                data: activeSaleDate,
                produto,
                categoria,
                canal_venda: activeChannel,
                forma_pagamento: activePayment,
                valor_venda: valorVenda,
                custo_estimado: custoEstimado,
                lucro_liquido: lucroLiquido,
                margem_lucro: margemLucro
            };
            
            if (!supabaseClient) {
                showToast("Erro: Supabase não inicializado.");
                return;
            }
            
            try {
                btnSaveSale.disabled = true;
                btnSaveSale.textContent = 'Gravando...';
                
                const { data, error } = await supabaseClient
                    .from('vendas')
                    .insert([newSale])
                    .select();
                    
                if (error) throw error;
                
                if (data && data[0]) {
                    salesData.unshift(data[0]);
                    updateTotalDiaCard();
                    renderDailySales(activeSaleDate);
                    showToast("Venda registrada com sucesso!");
                    
                    // Resetar form
                    selectSaleProduct.selectedIndex = 0;
                    inputSaleValue.value = '';
                    inputSaleCost.value = '';
                }
            } catch (err) {
                console.error("Erro ao salvar venda:", err);
                showToast("Erro ao salvar venda no banco.");
            } finally {
                btnSaveSale.disabled = false;
                btnSaveSale.textContent = 'Registrar Venda';
            }
        });
    }
    
    // Excluir venda
    async function deleteSale(saleId) {
        if (!confirm("Tem certeza que deseja excluir esta venda permanentemente?")) return;
        if (!supabaseClient) return;
        
        try {
            const { error } = await supabaseClient
                .from('vendas')
                .delete()
                .eq('id', saleId);
                
            if (error) throw error;
            
            salesData = salesData.filter(s => s.id !== saleId);
            updateTotalDiaCard();
            renderDailySales(activeSaleDate);
            showToast("Venda excluída com sucesso!");
        } catch (err) {
            console.error("Erro ao excluir venda:", err);
            showToast("Erro ao excluir venda.");
        }
    }
    
    // Filtro de data e setas de navegação
    const dateInput = document.getElementById('input-sale-date');
    const btnPrevDay = document.getElementById('btn-prev-day');
    const btnNextDay = document.getElementById('btn-next-day');
    
    if (dateInput) {
        dateInput.addEventListener('change', () => {
            activeSaleDate = dateInput.value;
            renderDailySales(activeSaleDate);
        });
    }
    
    if (btnPrevDay) {
        btnPrevDay.addEventListener('click', () => {
            const date = new Date(activeSaleDate + 'T00:00:00');
            date.setDate(date.getDate() - 1);
            activeSaleDate = getLocalDateString(date);
            dateInput.value = activeSaleDate;
            renderDailySales(activeSaleDate);
        });
    }
    
    if (btnNextDay) {
        btnNextDay.addEventListener('click', () => {
            const date = new Date(activeSaleDate + 'T00:00:00');
            date.setDate(date.getDate() + 1);
            activeSaleDate = getLocalDateString(date);
            dateInput.value = activeSaleDate;
            renderDailySales(activeSaleDate);
        });
    }
    
    // Renderiza a lista de vendas e os cards de faturamento de uma data
    function renderDailySales(dateStr) {
        const filtered = salesData.filter(s => s.data === dateStr);
        
        const faturamento = filtered.reduce((sum, s) => sum + parseFloat(s.valor_venda), 0);
        const custo = filtered.reduce((sum, s) => sum + parseFloat(s.custo_estimado), 0);
        const lucro = faturamento - custo;
        const margem = custo > 0 ? (lucro / custo) * 100 : 0;
        
        document.getElementById('day-faturamento').textContent = formatCurrency(faturamento);
        document.getElementById('day-custo').textContent = formatCurrency(custo);
        document.getElementById('day-lucro').textContent = formatCurrency(lucro);
        document.getElementById('day-margem').textContent = margem.toFixed(0) + '%';
        
        // Cor do tile de lucro se negativo
        const profitTileVal = document.getElementById('day-lucro');
        const profitTile = profitTileVal.closest('.result-tile');
        if (lucro < 0) {
            profitTile.className = 'result-tile bg-red-light';
            profitTileVal.className = 'tile-value text-red';
        } else {
            profitTile.className = 'result-tile bg-green-light';
            profitTileVal.className = 'tile-value text-green';
        }
        
        const listContainer = document.getElementById('sales-list-items');
        listContainer.innerHTML = '';
        
        if (filtered.length === 0) {
            listContainer.innerHTML = '<div class="empty-sales-message">Nenhuma venda registrada nesta data.</div>';
            return;
        }
        
        filtered.forEach(sale => {
            const item = document.createElement('div');
            item.className = 'sales-list-item';
            
            const saleVal = parseFloat(sale.valor_venda);
            const saleProfit = parseFloat(sale.lucro_liquido);
            const profitText = saleProfit >= 0 ? `+${formatCurrency(saleProfit)}` : formatCurrency(saleProfit);
            const profitClass = saleProfit >= 0 ? 'text-green' : 'text-red';
            
            item.innerHTML = `
                <span class="col-prod" title="${sale.produto}">${sale.produto}</span>
                <span class="col-chan">${sale.canal_venda}</span>
                <span class="col-pay">${sale.forma_pagamento}</span>
                <span class="col-val text-right">
                    ${formatCurrency(saleVal)}
                    <span class="col-profit-span ${profitClass}">${profitText} lucro</span>
                </span>
                <span class="col-act">
                    <button class="btn-delete-sale" title="Excluir venda">🗑️</button>
                </span>
            `;
            
            item.querySelector('.btn-delete-sale').addEventListener('click', () => {
                deleteSale(sale.id);
            });
            
            listContainer.appendChild(item);
        });
    }

    // ==========================================
    // 3. ABA 2: CAPACIDADE
    // ==========================================
    const inputDiasTrabalho = document.getElementById('input-dias-trabalho');
    const inputBolosDia = document.getElementById('input-bolos-dia');
    const inputPrecoMedio = document.getElementById('input-preco-medio');

    // Outputs
    const valDiasTrabalho = document.getElementById('val-dias-trabalho');
    const valBolosDia = document.getElementById('val-bolos-dia');
    const valPrecoMedio = document.getElementById('val-preco-medio');
    const outBolosSemana = document.getElementById('out-bolos-semana');
    const outBolosMes = document.getElementById('out-bolos-mes');
    const outFaturamentoMensal = document.getElementById('out-faturamento-mensal');

    // Cenários
    const scenAtual = document.getElementById('scen-atual');
    const scenInicio = document.getElementById('scen-inicio');
    const scenEventos = document.getElementById('scen-eventos');
    const scenIfood = document.getElementById('scen-ifood');

    function calculateCapacity() {
        const diasTrabalho = Math.max(0, parseInt(inputDiasTrabalho.value) || 0);
        const bolosDia = Math.max(0, parseInt(inputBolosDia.value) || 0);
        const precoMedio = Math.max(0, parseFloat(inputPrecoMedio.value) || 0);

        // Cálculos
        const bolosSemana = diasTrabalho * bolosDia;
        const bolosMes = bolosSemana * 4;
        const faturamentoMensal = bolosMes * precoMedio;

        // Atualizar textos dos sliders
        valDiasTrabalho.textContent = `${diasTrabalho} ${diasTrabalho === 1 ? 'dia' : 'dias'}`;
        valBolosDia.textContent = `${bolosDia} ${bolosDia === 1 ? 'bolo' : 'bolos'}`;
        valPrecoMedio.textContent = formatCurrencyWhole(precoMedio);

        // Atualizar cards de resultado
        outBolosSemana.textContent = bolosSemana;
        outBolosMes.textContent = bolosMes;
        outFaturamentoMensal.textContent = formatCurrencyWhole(faturamentoMensal);

        // Atualizar cenários de crescimento
        scenAtual.textContent = `${formatCurrencyWhole(20 * precoMedio)}/mês`;
        scenInicio.textContent = `${formatCurrencyWhole(80 * precoMedio)}/mês`;
        scenEventos.textContent = `${formatCurrencyWhole(120 * precoMedio)}/mês`;
        scenIfood.textContent = `${formatCurrencyWhole(200 * precoMedio)}/mês`;

        // Recalcular custos e faturamento da aba 1 se houver bolo ativo
        calculateCostAndPrice();
    }

    const capacityInputs = [inputDiasTrabalho, inputBolosDia, inputPrecoMedio];
    capacityInputs.forEach(input => {
        input.addEventListener('input', calculateCapacity);
    });

    // ==========================================
    // 4. ABA 3: CLIENTES
    // ==========================================
    const inputPctColegas = document.getElementById('input-pct-colegas');
    const inputPctEventos = document.getElementById('input-pct-eventos');
    const inputPctIfood = document.getElementById('input-pct-ifood');

    const pctColegas = document.getElementById('pct-colegas');
    const pctEventos = document.getElementById('pct-eventos');
    const pctIfood = document.getElementById('pct-ifood');

    function balanceSliders(changedInput) {
        let valColegas = parseInt(inputPctColegas.value) || 0;
        let valEventos = parseInt(inputPctEventos.value) || 0;
        let valIfood = parseInt(inputPctIfood.value) || 0;

        const id = changedInput.id;
        
        if (id === 'input-pct-colegas') {
            const rem = 100 - valColegas;
            const currentOthersSum = valEventos + valIfood;
            if (currentOthersSum > 0) {
                valEventos = Math.round(rem * (valEventos / currentOthersSum));
                valIfood = rem - valEventos;
            } else {
                valEventos = Math.round(rem / 2);
                valIfood = rem - valEventos;
            }
        } else if (id === 'input-pct-eventos') {
            const rem = 100 - valEventos;
            const currentOthersSum = valColegas + valIfood;
            if (currentOthersSum > 0) {
                valColegas = Math.round(rem * (valColegas / currentOthersSum));
                valIfood = rem - valColegas;
            } else {
                valColegas = Math.round(rem / 2);
                valIfood = rem - valColegas;
            }
        } else if (id === 'input-pct-ifood') {
            const rem = 100 - valIfood;
            const currentOthersSum = valColegas + valEventos;
            if (currentOthersSum > 0) {
                valColegas = Math.round(rem * (valColegas / currentOthersSum));
                valEventos = rem - valColegas;
            } else {
                valColegas = Math.round(rem / 2);
                valEventos = rem - valColegas;
            }
        }

        inputPctColegas.value = valColegas;
        inputPctEventos.value = valEventos;
        inputPctIfood.value = valIfood;

        pctColegas.textContent = `${valColegas}%`;
        pctEventos.textContent = `${valEventos}%`;
        pctIfood.textContent = `${valIfood}%`;

        updateSliderTrack(inputPctColegas);
        updateSliderTrack(inputPctEventos);
        updateSliderTrack(inputPctIfood);
    }

    const segmentInputs = [inputPctColegas, inputPctEventos, inputPctIfood];
    segmentInputs.forEach(input => {
        input.addEventListener('input', function() {
            balanceSliders(this);
        });
    });

    // Otimização de teclado para mobile: oculta o footer ao abrir o teclado para liberar espaço de digitação
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            const footer = document.querySelector('.dashboard-footer');
            if (!footer) return;
            if (window.visualViewport.height < window.innerHeight * 0.8) {
                footer.classList.add('hidden');
            } else {
                footer.classList.remove('hidden');
            }
        });
    }

    // ==========================================
    // SEGURANÇA E AUTENTICAÇÃO (SUPABASE AUTH)
    // ==========================================
    const loginContainer = document.getElementById('login-container');
    const dashboardApp = document.getElementById('dashboard-app');
    const loginForm = document.getElementById('login-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginMsg = document.getElementById('login-msg');
    const btnLogin = document.getElementById('btn-login');
    const btnSignup = document.getElementById('btn-signup');
    const btnLogout = document.getElementById('btn-logout');

    if (supabaseClient) {
        // Escuta mudanças no estado de login
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                // Logado
                loginContainer.classList.add('hidden');
                dashboardApp.classList.remove('hidden');
                
                // Inicializa a aplicação localmente de imediato (offline-first)
                loadLocalCakesData();
                calculateCapacity();
                renderCakesGrid();
                
                // Carrega os dados da nuvem assincronamente em background para não travar a UI
                loadRemoteCakesData().then(() => {
                    loadSalesData();
                });
            } else {
                // Não logado
                dashboardApp.classList.add('hidden');
                loginContainer.classList.remove('hidden');
            }
        });
        
        // Listener de Login
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginMsg.classList.add('hidden');
            const email = loginEmail.value.trim();
            const password = loginPassword.value;
            
            btnLogin.disabled = true;
            btnLogin.textContent = 'Entrando...';
            
            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } catch (err) {
                loginMsg.textContent = "Erro ao entrar: " + err.message;
                loginMsg.className = "login-msg error";
                loginMsg.classList.remove('hidden');
            } finally {
                btnLogin.disabled = false;
                btnLogin.textContent = 'Entrar';
            }
        });
        
        // Listener de Cadastro (Criar Conta)
        btnSignup.addEventListener('click', async () => {
            loginMsg.classList.add('hidden');
            const email = loginEmail.value.trim();
            const password = loginPassword.value;
            
            if (!email || !password) {
                loginMsg.textContent = "Preencha e-mail e senha para cadastrar.";
                loginMsg.className = "login-msg error";
                loginMsg.classList.remove('hidden');
                return;
            }
            
            btnSignup.disabled = true;
            btnSignup.textContent = 'Cadastrando...';
            
            try {
                const { data, error } = await supabaseClient.auth.signUp({ email, password });
                if (error) throw error;
                loginMsg.textContent = "Cadastro realizado! Você foi logado.";
                loginMsg.className = "login-msg success";
                loginMsg.classList.remove('hidden');
            } catch (err) {
                loginMsg.textContent = "Erro ao cadastrar: " + err.message;
                loginMsg.className = "login-msg error";
                loginMsg.classList.remove('hidden');
            } finally {
                btnSignup.disabled = false;
                btnSignup.textContent = 'Criar Conta';
            }
        });
        
        // Listener de Logout
        if (btnLogout) {
            btnLogout.addEventListener('click', async () => {
                await supabaseClient.auth.signOut();
                showToast("Você saiu da conta.");
            });
        }
    } else {
        // Se Supabase falhar, exibe fallback local (para fins de teste/offline)
        loginContainer.classList.add('hidden');
        dashboardApp.classList.remove('hidden');
        loadLocalCakesData();
        calculateCapacity();
        renderCakesGrid();
    }

    // ==========================================
    // LÓGICA DO LOG DA SIDEBAR E DA VENDA RÁPIDA
    // ==========================================
    function renderSidebarSales(todaySales) {
        const sidebarList = document.getElementById('sidebar-sales-list-items');
        if (!sidebarList) return;
        
        sidebarList.innerHTML = '';
        
        if (todaySales.length === 0) {
            sidebarList.innerHTML = '<li class="empty-sales-state">Nenhuma venda hoje.</li>';
            return;
        }
        
        // Mostrar no máximo as últimas 5 vendas para manter a sidebar compacta
        const recentSales = todaySales.slice(0, 5);
        recentSales.forEach(sale => {
            const item = document.createElement('li');
            item.className = 'sale-item';
            
            // Tentar extrair hora de created_at (ex: "2026-06-29 21:03:54.99+00")
            let timeString = '';
            if (sale.created_at) {
                try {
                    const date = new Date(sale.created_at);
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    timeString = `${hours}:${minutes}`;
                } catch(e) {
                    timeString = '';
                }
            }
            
            item.innerHTML = `
                <div class="sale-item-info">
                    <span class="sale-item-name" title="${sale.produto}">${sale.produto}</span>
                    <span class="sale-item-meta">
                        ${timeString ? `<time class="sale-item-time">${timeString}</time>` : ''}
                        <span class="sale-item-channel">${timeString ? '• ' : ''}${sale.canal_venda}</span>
                    </span>
                </div>
                <span class="sale-item-value">+ ${formatCurrency(parseFloat(sale.valor_venda))}</span>
            `;
            sidebarList.appendChild(item);
        });
    }

    // Lógica de Venda Rápida
    let pendingQuickSaleCake = null;
    let selectedQuickSaleChannel = 'Balcão';
    let selectedQuickSalePayment = 'PIX';

    function openQuickSaleModal(cakeId) {
        const cake = cakesData[cakeId];
        if (!cake) return;
        
        pendingQuickSaleCake = cake;
        selectedQuickSaleChannel = 'Balcão';
        selectedQuickSalePayment = 'PIX';
        
        // Resetar visualmente os seletores do modal para o padrão
        document.querySelectorAll('#quick-sale-channel-selectors .quick-sale-selector-btn').forEach(btn => {
            if (btn.dataset.value === 'Balcão') btn.classList.add('active');
            else btn.classList.remove('active');
        });
        document.querySelectorAll('#quick-sale-payment-selectors .quick-sale-selector-btn').forEach(btn => {
            if (btn.dataset.value === 'PIX') btn.classList.add('active');
            else btn.classList.remove('active');
        });
        
        // Preencher detalhes do bolo no modal
        const modalImg = document.getElementById('quick-sale-img');
        const modalName = document.getElementById('quick-sale-name');
        const modalPrice = document.getElementById('quick-sale-price');
        
        if (modalImg) modalImg.src = cake.image;
        if (modalName) modalName.textContent = cake.name;
        if (modalPrice) modalPrice.textContent = formatCurrency(cake.price);
        
        // Abrir modal
        const overlay = document.getElementById('quick-sale-overlay');
        const modal = document.getElementById('quick-sale-modal');
        if (overlay) overlay.classList.add('active');
        if (modal) modal.classList.add('active');
    }

    function closeQuickSaleModal() {
        const overlay = document.getElementById('quick-sale-overlay');
        const modal = document.getElementById('quick-sale-modal');
        if (overlay) overlay.classList.remove('active');
        if (modal) modal.classList.remove('active');
        pendingQuickSaleCake = null;
    }

    // Registrar venda rápida
    async function registerQuickSale() {
        if (!pendingQuickSaleCake) return;
        
        const cake = pendingQuickSaleCake;
        const valorVenda = cake.price;
        
        // Calcular custo estimado
        const farinha = cake.farinha || 0;
        const ovos = cake.ovos || 0;
        const acucarManteiga = cake.acucarManteiga || 0;
        const outros = cake.outros || 0;
        const gas = cake.gas || 0;
        const embalagem = cake.embalagem || 0;
        const tempo = cake.tempo || 0;
        const valorHora = cake.valorHora || 0;
        const custoEstimado = farinha + ovos + acucarManteiga + outros + gas + embalagem + (tempo / 60) * valorHora;
        
        const lucroLiquido = valorVenda - custoEstimado;
        const margemLucro = custoEstimado > 0 ? (lucroLiquido / custoEstimado) * 100 : 0;
        const categoria = cake.category === 'caseiros' ? 'Caseiro' : cake.category === 'confeitados' ? 'Confeitado' : 'Doce';
        
        const todayStr = getLocalDateString(new Date());
        
        const newSale = {
            data: todayStr, // Dia atual
            produto: cake.name,
            categoria: categoria,
            canal_venda: selectedQuickSaleChannel,
            forma_pagamento: selectedQuickSalePayment,
            valor_venda: valorVenda,
            custo_estimado: custoEstimado,
            lucro_liquido: lucroLiquido,
            margem_lucro: margemLucro
        };
        
        if (!supabaseClient) {
            // Se Supabase falhar, registra localmente para testes offline
            const localId = 'temp-' + Date.now();
            const tempSale = { id: localId, created_at: new Date().toISOString(), ...newSale };
            salesData.unshift(tempSale);
            updateTotalDiaCard();
            if (activeSaleDate === todayStr) {
                renderDailySales(todayStr);
            }
            showToast("Venda registrada localmente!");
            closeQuickSaleModal();
            return;
        }
        
        try {
            const btnConfirm = document.getElementById('btn-confirm-quick-sale');
            if (btnConfirm) {
                btnConfirm.disabled = true;
                btnConfirm.textContent = 'Gravando...';
            }
            
            const { data, error } = await supabaseClient
                .from('vendas')
                .insert([newSale])
                .select();
                
            if (error) throw error;
            
            if (data && data[0]) {
                salesData.unshift(data[0]);
                updateTotalDiaCard();
                if (activeSaleDate === todayStr) {
                    renderDailySales(todayStr);
                }
                showToast("Venda registrada com sucesso!");
            }
        } catch (err) {
            console.error("Erro ao salvar venda rápida:", err);
            showToast("Erro ao registrar venda no banco.");
        } finally {
            const btnConfirm = document.getElementById('btn-confirm-quick-sale');
            if (btnConfirm) {
                btnConfirm.disabled = false;
                btnConfirm.textContent = 'Sim';
            }
            closeQuickSaleModal();
        }
    }

    // Configurar event listeners para o modal de venda rápida
    const closeQuickSaleBtn = document.getElementById('close-quick-sale-btn');
    const btnCancelQuickSale = document.getElementById('btn-cancel-quick-sale');
    const btnConfirmQuickSale = document.getElementById('btn-confirm-quick-sale');
    const quickSaleOverlay = document.getElementById('quick-sale-overlay');
    
    if (closeQuickSaleBtn) closeQuickSaleBtn.addEventListener('click', closeQuickSaleModal);
    if (btnCancelQuickSale) btnCancelQuickSale.addEventListener('click', closeQuickSaleModal);
    if (quickSaleOverlay) quickSaleOverlay.addEventListener('click', closeQuickSaleModal);
    if (btnConfirmQuickSale) btnConfirmQuickSale.addEventListener('click', registerQuickSale);

    // Configurar seletores interativos do modal de venda rápida
    document.querySelectorAll('#quick-sale-channel-selectors .quick-sale-selector-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#quick-sale-channel-selectors .quick-sale-selector-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedQuickSaleChannel = btn.dataset.value;
        });
    });
    
    document.querySelectorAll('#quick-sale-payment-selectors .quick-sale-selector-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#quick-sale-payment-selectors .quick-sale-selector-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedQuickSalePayment = btn.dataset.value;
        });
    });

    // Configurar filtros de categoria
    const btnFilterAll = document.getElementById('btn-filter-all');
    const btnFilterCaseiros = document.getElementById('btn-filter-caseiros');
    const btnFilterConfeitados = document.getElementById('btn-filter-confeitados');
    const btnFilterDoces = document.getElementById('btn-filter-doces');
    
    function setCategoryFilter(category, activeBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        if (activeBtn) activeBtn.classList.add('active');
        activeCategoryFilter = category;
        renderCakesGrid();
    }
    
    if (btnFilterAll) btnFilterAll.addEventListener('click', (e) => setCategoryFilter('all', e.currentTarget));
    if (btnFilterCaseiros) btnFilterCaseiros.addEventListener('click', (e) => setCategoryFilter('caseiro', e.currentTarget));
    if (btnFilterConfeitados) btnFilterConfeitados.addEventListener('click', (e) => setCategoryFilter('confeitado', e.currentTarget));
    if (btnFilterDoces) btnFilterDoces.addEventListener('click', (e) => setCategoryFilter('doce', e.currentTarget));
});
