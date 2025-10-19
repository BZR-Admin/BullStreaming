// js/revendedores.js

document.addEventListener('DOMContentLoaded', () => {
    // Verifica si la constante WHATSAPP_NUMBER fue cargada por data2.js
    if (typeof WHATSAPP_NUMBER === 'undefined') {
        console.error("Error: WHATSAPP_NUMBER no está definido. Asegúrate de que data2.js se cargue antes.");
        return;
    }

    // Mensaje de WhatsApp solicitado por el usuario
    const CTA_MESSAGE = 'Me interesa ser Bull revendedor';

    function getWhatsappLink(message) {
        const encodedMessage = encodeURIComponent(message);
        // Usa la constante definida en data2.js
        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    }

    const ctaButton = document.getElementById('cta-revendedores');
    if (ctaButton) {
        // Asigna el enlace de WhatsApp al botón
        ctaButton.href = getWhatsappLink(CTA_MESSAGE);
    }
});
