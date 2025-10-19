// js/precios.js

document.addEventListener('DOMContentLoaded', () => {
    const contenedorPrecios = document.getElementById('contenedor-precios');
    
    // Función para obtener el enlace de WhatsApp
    function getWhatsappLink(message) {
        const encodedMessage = encodeURIComponent(message);
        // Usa la constante definida en data.js
        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    }

    // Iterar sobre cada producto
    productos.forEach(producto => {
        // Genera el enlace de WhatsApp para cada producto
        const whatsappLink = getWhatsappLink(producto.cta_mensaje);

        // Crear la estructura HTML de la tarjeta
        const tarjeta = document.createElement('div');
        tarjeta.classList.add('tarjeta-servicio'); // Clase para estilos CSS (ver paso 4)
        
        tarjeta.innerHTML = `
            <div class="tarjeta-encabezado">
                <img src="${producto.logo}" alt="Logo de ${producto.nombre}" class="logo-plataforma">
                <h3>${producto.nombre}</h3>
            </div>
            <p class="plan-nombre">${producto.plan}</p>
            
            <div class="precio-box">
                <span class="moneda">$</span>
                <span class="precio-valor neon-yellow">${producto.precio}</span>
                <span class="periodo">/ mes</span>
            </div>
            
            <p class="descripcion">${producto.descripcion}</p>
            
            <a href="${whatsappLink}" target="_blank" class="btn cta-whatsapp btn-primary">
                Lo Quiero 📲
            </a>
        `;
        
        contenedorPrecios.appendChild(tarjeta);
    });
});
