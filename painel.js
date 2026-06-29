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
            image: 'assets/images/bolo_cenoura.png',
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
            image: 'assets/images/bolo_vulcao.png',
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
            image: 'assets/images/bolo_cenoura.png',
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
            image: 'assets/images/bolo_morango.png',
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
            image: 'assets/images/bolo_morango.png',
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
            image: 'assets/images/bolo_morango.png',
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
            image: 'assets/images/copo_felicidade.png',
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
            image: 'assets/images/copo_felicidade.png',
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

    function loadLocalCakesData() {
        try {
            const saved = localStorage.getItem('bolos_da_palloma_cakes');
            if (saved) {
                cakesData = JSON.parse(saved);
                // Garantir que todos os bolos padrão existam se algum novo for adicionado
                Object.keys(DEFAULT_CAKES).forEach(key => {
                    if (!cakesData[key]) {
                        cakesData[key] = { ...DEFAULT_CAKES[key] };
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
                const remoteCakes = data.value;
                // Garantir que todos os bolos padrão existam
                Object.keys(DEFAULT_CAKES).forEach(key => {
                    if (!remoteCakes[key]) {
                        remoteCakes[key] = { ...DEFAULT_CAKES[key] };
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

    // Carrega local imediatamente (para evitar flash de tela em branco)
    loadLocalCakesData();
    // Busca dados atualizados da nuvem de forma assíncrona
    loadRemoteCakesData();

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
                    profitText = `+${profitPercent}% de Lucro`;
                } else if (profitPercent < 0) {
                    profitClass = 'profit-negative';
                    profitText = `${profitPercent}% de Prejuízo`;
                }
            }
            
            const card = document.createElement('div');
            card.className = 'cake-card';
            card.dataset.id = cake.id;
            
            card.innerHTML = `
                <div class="cake-card-img-wrapper">
                    ${cake.tag ? `<span class="cake-card-tag">${cake.tag}</span>` : ''}
                    <img src="${cake.image}" alt="${cake.name}" class="cake-card-img" onerror="this.src='assets/images/logo_icon.png'">
                </div>
                <div class="cake-card-content">
                    <span class="cake-card-category">${cake.category === 'caseiros' ? 'Caseiro' : cake.category === 'confeitados' ? 'Confeitado' : 'Doce'}</span>
                    <h4 class="cake-card-title">${cake.name}</h4>
                    <div class="cake-card-footer">
                        <span class="cake-card-price">${formatCurrency(cake.price)}</span>
                        <span class="profit-badge ${profitClass}">${profitText}</span>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                selectCake(cake.id);
            });
            
            cakesGrid.appendChild(card);
        });
        
        // Adicionar card especial 'TOTAL DO DIA'
        const totalCard = document.createElement('div');
        totalCard.className = 'cake-card cake-card-total';
        totalCard.id = 'card-total-dia';
        totalCard.innerHTML = `
            <div class="total-card-icon">📊</div>
            <h4 class="total-card-title">TOTAL DO DIA</h4>
            <p class="total-card-subtext">Atualizar diariamente as vendas</p>
        `;
        totalCard.addEventListener('click', (e) => {
            e.stopPropagation();
            showToast('Função de Sumário de Faturamento será liberada em breve!');
        });
        cakesGrid.appendChild(totalCard);
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
    // EXECUÇÃO INICIAL
    // ==========================================
    calculateCapacity();
    renderCakesGrid();
});
