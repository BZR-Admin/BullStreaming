// js/precios.js

// Verifica si 'productos' y WHATSAPP_NUMBER están definidos (deben ser cargados por data2.js)
// Si data2.js no se carga correctamente, esta verificación evita ReferenceErrors.
if (typeof productos === 'undefined' || typeof WHATSAPP_NUMBER === 'undefined') {
    // Muestra un error limpio en la consola para debugging
    console.error("Error en precios.js: Las dependencias (productos o WHATSAPP_NUMBER) no están definidas. Asegúrate de que data2.js se cargue correctamente ANTES de precios.js.");
} else {
    document.addEventListener('DOMContentLoaded', () => {
        const contenedor = document.getElementById('contenedor-precios');
        if (contenedor) {
            // Llama a la función para renderizar
            crearTarjetasServicio(productos, contenedor);
        }
    });
}


/**
 * Crea una tarjeta HTML para un servicio de streaming.
 * @param {Object} producto - Objeto con detalles del plan (de data2.js).
 * @returns {string} HTML de la tarjeta.
 */
function crearTarjetaServicio(producto) {
    // Placeholder simple para el logo si la ruta falla
    const defaultLogo = 'https://placehold.co/60x60/111/fff?text=LOGO';
    
    // El enlace de WhatsApp para cada producto, usando el mensaje del producto
    const whatsappMessage = producto.cta_mensaje;
    const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

    let precioPrincipal;
    let periodoDisplay;
    let moneda = '$';

    // Lógica para manejar precios con múltiples opciones (ej: Spotify)
    if (producto.precio && producto.precio.includes('-')) {
        // Si tiene el guion, tomamos el primer valor como principal y ajustamos el periodo.
        precioPrincipal = producto.precio.split('-')[0].trim();
        periodoDisplay = '/ mes (Ver planes)';
    } else {
        // Si es un precio normal
        precioPrincipal = producto.precio || 'N/A';
        periodoDisplay = '/ mes';
    }

    return `
        <div class="tarjeta-servicio">
            <div class="tarjeta-encabezado">
                <!-- Fallback de imagen en caso de error de carga -->
                <img src="${producto.logo || defaultLogo}" alt="Logo ${producto.nombre}" class="logo-plataforma" onerror="this.onerror=null;this.src='${defaultLogo}'">
                <h3>${producto.nombre}</h3>
                <p class="plan-nombre">${producto.plan}</p>
            </div>
            
            <div class="tarjeta-cuerpo">
                <p class="descripcion">${producto.descripcion}</p>
                <div class="precio-box">
                    <span class="moneda">${moneda}</span>
                    <span class="precio-valor neon-yellow">${precioPrincipal}</span>
                    <span class="periodo">${periodoDisplay}</span>
                </div>
            </div>

            <a href="${whatsappLink}" target="_blank" class="btn btn-primary cta-whatsapp">
                Lo Quiero 📲
            </a>
        </div>
    `;
}

/**
 * Inserta las tarjetas de servicio en el contenedor HTML.
 * @param {Array} productosArray - El arreglo de productos a mostrar.
 * @param {HTMLElement} contenedor - El elemento donde se insertarán las tarjetas.
 */
function crearTarjetasServicio(productosArray, contenedor) {
    // Mapeamos el array a un string de HTML y lo insertamos de una vez
    contenedor.innerHTML = productosArray.map(crearTarjetaServicio).join('');
}
