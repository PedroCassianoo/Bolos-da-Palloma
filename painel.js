document.addEventListener('DOMContentLoaded', function() {
    
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
        });
    });

    // ==========================================
    // HELPERS DE FORMATAÇÃO DE MOEDA (REAL)
    // ==========================================
    // Formatação padrão com decimais (ex: R$ 15,50)
    function formatCurrency(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // Formatação para valores inteiros limpos (ex: R$ 6.480)
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
    // 2. ABA 1: CUSTO & PREÇO
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
        // Obter valores numéricos limpando entradas inválidas e negativas (Math.max(0))
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
        
        // Integrado dinamicamente com a capacidade definida na Aba 2
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
        
        // Atualizar texto do rótulo e valor de lucro mensal integrado
        labelLucroMensal.textContent = `Lucro em ${volumeMes} bolos/mês`;
        priceLucroMensal.textContent = formatCurrencyWhole(Math.round(lucroMensal));
    }

    // Adicionar escuta nos inputs da calculadora
    const costInputs = [
        inputFarinha, inputOvos, inputAcucarManteiga, inputOutros,
        inputGas, inputEmbalagem, inputTempo, inputValorHora, inputMargin
    ];
    costInputs.forEach(input => {
        input.addEventListener('input', calculateCostAndPrice);
    });

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

        // Cálculos de capacidade
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

        // Atualizar cenários de crescimento baseados no preço médio
        scenAtual.textContent = `${formatCurrencyWhole(20 * precoMedio)}/mês`;
        scenInicio.textContent = `${formatCurrencyWhole(80 * precoMedio)}/mês`;
        scenEventos.textContent = `${formatCurrencyWhole(120 * precoMedio)}/mês`;
        scenIfood.textContent = `${formatCurrencyWhole(200 * precoMedio)}/mês`;

        // Recalcular custos também, pois a quantidade mensal mudou
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

    // Textos de Porcentagem
    const pctColegas = document.getElementById('pct-colegas');
    const pctEventos = document.getElementById('pct-eventos');
    const pctIfood = document.getElementById('pct-ifood');

    // Lógica para balancear os sliders para que a soma seja sempre 100%
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

        // Set values back to inputs
        inputPctColegas.value = valColegas;
        inputPctEventos.value = valEventos;
        inputPctIfood.value = valIfood;

        // Update displays
        pctColegas.textContent = `${valColegas}%`;
        pctEventos.textContent = `${valEventos}%`;
        pctIfood.textContent = `${valIfood}%`;



        // Atualizar preenchimento de track para os três sliders
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

    // ==========================================
    // EXECUÇÃO INICIAL
    // ==========================================
    calculateCapacity(); // Executa primeiro para definir o volumeMes inicial para o calculateCostAndPrice()
});
