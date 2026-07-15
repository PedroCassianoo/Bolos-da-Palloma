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
