// VULN-10: XSS protection for database-sourced values
function estoqueEscapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

document.addEventListener("DOMContentLoaded", () => {
    // Carrega a tabela no primeiro load
    window.carregarEstoque();
});

window.carregarEstoque = async function() {
    const tbody = document.getElementById("estoque-lista-tbody");
    if (!tbody) return;

    const client = window.supabaseClient || (window.parent && window.parent.supabaseClient);
    if (!client) {
        console.warn("[Lista Mestra] Supabase não inicializado.");
        tbody.innerHTML = `<tr><td colspan="6" class="px-8 py-4 text-center text-on-surface-variant">Erro de conexão com o banco de dados.</td></tr>`;
        return;
    }

    try {
        const { data: insumos, error } = await client
            .from("insumos")
            .select("*")
            .order("nome");

        if (error) {
            console.error("Erro ao buscar insumos:", error);
            tbody.innerHTML = `<tr><td colspan="6" class="px-8 py-4 text-center text-on-surface-variant">Erro ao carregar dados.</td></tr>`;
            return;
        }

        tbody.innerHTML = ""; // Limpa a tabela

        if (!insumos || insumos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="px-8 py-4 text-center text-on-surface-variant">Nenhum insumo encontrado.</td></tr>`;
            return;
        }

        insumos.forEach(item => {
            // Lógica de UI para ícone baseado na categoria
            let icon = "grain";
            let bgClass = "bg-secondary-container";
            let iconClass = "text-secondary";

            if (item.categoria && item.categoria.toLowerCase().includes("refrigerado")) {
                icon = "icecream";
                bgClass = "bg-primary-fixed-dim/20";
                iconClass = "text-primary-container";
            } else if (item.categoria && item.categoria.toLowerCase().includes("secos")) {
                icon = "scatter_plot";
            }

            // Lógica de alerta de nível mínimo
            const isBaixo = item.quantidade < item.nivel_minimo;
            const minColorClass = isBaixo ? "text-tertiary" : "text-on-surface-variant";
            const minArrow = isBaixo ? `<span class="material-symbols-outlined text-xs ml-1 align-middle">arrow_downward</span>` : "";

            // Formatação do Preço
            const precoFormatado = item.preco ? `R$ ${item.preco.toFixed(2).replace('.', ',')}` : "N/D";

            const tr = document.createElement("tr");
            tr.className = "hover:bg-surface-container/30 transition-colors group";
            tr.innerHTML = `
                <td class="px-8 py-4">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-lg ${bgClass} flex items-center justify-center shrink-0 overflow-hidden">
                            <span class="material-symbols-outlined ${iconClass}">${icon}</span>
                        </div>
                        <div>
                            <p class="font-semibold text-base">${estoqueEscapeHTML(item.nome)}</p>
                            <p class="text-sm text-on-surface-variant">${estoqueEscapeHTML(item.unidade) || '-'}</p>
                        </div>
                    </div>
                </td>
                <td class="px-8 py-4"><span class="bg-surface-container-high px-3 py-1 rounded-full text-xs font-medium text-on-surface-variant">${estoqueEscapeHTML(item.categoria) || '-'}</span></td>
                <td class="px-8 py-4 font-medium">${estoqueEscapeHTML(String(item.quantidade))} ${estoqueEscapeHTML(item.unidade) || ''}</td>
                <td class="px-8 py-4 ${minColorClass}">${estoqueEscapeHTML(String(item.nivel_minimo || 0))} ${estoqueEscapeHTML(item.unidade) || ''} ${minArrow}</td>
                <td class="px-8 py-4">${estoqueEscapeHTML(precoFormatado)} / ${estoqueEscapeHTML(item.unidade) || ''}</td>
                <td class="px-8 py-4 text-right">
                    <button class="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-high">
                        <span class="material-symbols-outlined">more_horiz</span>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Atualiza a contagem no footer da tabela
        const footerText = document.querySelector(".p-6.border-t.border-outline-variant\\\\/60 span");
        if (footerText) {
            footerText.textContent = `Mostrando ${insumos.length} itens (Total)`;
        }

    } catch (err) {
        console.error("Erro interno ao renderizar tabela:", err);
    }
};
