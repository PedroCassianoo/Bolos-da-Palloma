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
    // HELPER DE FORMATAÇÃO DE MOEDA (REAL)
    // ==========================================
    function formatCurrency(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

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

    function calculateCostAndPrice() {
        // Obter valores numéricos limpando entradas inválidas
        const farinha = parseFloat(inputFarinha.value) || 0;
        const ovos = parseFloat(inputOvos.value) || 0;
        const acucarManteiga = parseFloat(inputAcucarManteiga.value) || 0;
        const outros = parseFloat(inputOutros.value) || 0;
        const gas = parseFloat(inputGas.value) || 0;
        const embalagem = parseFloat(inputEmbalagem.value) || 0;
        const tempo = parseFloat(inputTempo.value) || 0;
        const valorHora = parseFloat(inputValorHora.value) || 0;
        const margemPercentual = parseFloat(inputMargin.value) || 0;

        // Cálculos
        const totalIngredientes = farinha + ovos + acucarManteiga + outros;
        const totalOperacional = gas + embalagem;
        const totalMaoDeObra = (tempo / 60) * valorHora;
        const custoTotal = totalIngredientes + totalOperacional + totalMaoDeObra;

        // Precificação (Fórmula de Markup correspondente ao rascunho)
        const margemDecimal = margemPercentual / 100;
        const precoSugerido = custoTotal * (1 + margemDecimal);
        const lucroBolo = precoSugerido - custoTotal;
        const lucroMensal = lucroBolo * 30;

        // Atualizar interface
        calcIngredientes.textContent = formatCurrency(totalIngredientes);
        calcOperacional.textContent = formatCurrency(totalOperacional);
        calcMaoDeObra.textContent = formatCurrency(totalMaoDeObra);
        calcCustoTotal.textContent = formatCurrency(custoTotal);
        
        marginValueText.textContent = `${margemPercentual}%`;
        priceSugerido.textContent = formatCurrency(precoSugerido);
        priceLucroBolo.textContent = formatCurrency(lucroBolo);
        priceLucroMensal.textContent = formatCurrency(Math.round(lucroMensal));
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
        const diasTrabalho = parseInt(inputDiasTrabalho.value) || 0;
        const bolosDia = parseInt(inputBolosDia.value) || 0;
        const precoMedio = parseFloat(inputPrecoMedio.value) || 0;

        // Cálculos de capacidade
        const bolosSemana = diasTrabalho * bolosDia;
        const bolosMes = bolosSemana * 4;
        const faturamentoMensal = bolosMes * precoMedio;

        // Atualizar textos dos sliders
        valDiasTrabalho.textContent = `${diasTrabalho} ${diasTrabalho === 1 ? 'dia' : 'dias'}`;
        valBolosDia.textContent = `${bolosDia} ${bolosDia === 1 ? 'bolo' : 'bolos'}`;
        valPrecoMedio.textContent = formatCurrency(precoMedio).replace(',00', '');

        // Atualizar cards de resultado
        outBolosSemana.textContent = bolosSemana;
        outBolosMes.textContent = bolosMes;
        outFaturamentoMensal.textContent = formatCurrency(faturamentoMensal).replace(',00', '');

        // Atualizar cenários de crescimento baseados no preço médio
        scenAtual.textContent = `${formatCurrency(20 * precoMedio).replace(',00', '')}/mês`;
        scenInicio.textContent = `${formatCurrency(80 * precoMedio).replace(',00', '')}/mês`;
        scenEventos.textContent = `${formatCurrency(120 * precoMedio).replace(',00', '')}/mês`;
        scenIfood.textContent = `${formatCurrency(200 * precoMedio).replace(',00', '')}/mês`;
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

    // Barras de Progresso Visuais
    const barColegas = document.getElementById('bar-colegas');
    const barEventos = document.getElementById('bar-eventos');
    const barIfood = document.getElementById('bar-ifood');

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

        // Update progress bars widths
        barColegas.style.width = `${valColegas}%`;
        barEventos.style.width = `${valEventos}%`;
        barIfood.style.width = `${valIfood}%`;
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
    calculateCostAndPrice();
    calculateCapacity();
});
