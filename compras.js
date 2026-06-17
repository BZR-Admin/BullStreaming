let filtroCompras = "";
let ordenComprasActual = "";

document.addEventListener("DOMContentLoaded", () => {
  const formCompra = document.getElementById("formCompra");

  if (formCompra) {
    formCompra.addEventListener("submit", guardarCompra);
  }

  const buscarCompras = document.getElementById("buscarCompras");
  const ordenCompras = document.getElementById("ordenCompras");

  if (buscarCompras) {
    buscarCompras.addEventListener("input", () => {
      filtroCompras = buscarCompras.value.toLowerCase().trim();
      renderTablaCompras();
    });
  }

  if (ordenCompras) {
    ordenCompras.addEventListener("change", () => {
      ordenComprasActual = ordenCompras.value;
      renderTablaCompras();
    });
  }
});

/* =========================
   RENDER PRINCIPAL
========================= */

function renderCompras() {
  renderSelectServiciosCompra();
  renderTablaCompras();
}

/* =========================
   SELECT SERVICIOS (CACHE)
========================= */

function renderSelectServiciosCompra() {
  const select = document.getElementById("compraServicio");
  if (!select) return;

  select.innerHTML = `<option value="">Seleccionar servicio</option>`;

  CACHE.configCuentaPropia.forEach(servicio => {
    select.innerHTML += `
      <option value="${servicio.ID_Servicio}">
        ${servicio.Plataforma} - ${servicio.Servicio}
      </option>
    `;
  });
}

/* =========================
   TABLA PRINCIPAL (OPTIMIZADA)
========================= */

function renderTablaCompras() {
  const contenedor = document.getElementById("listaRegistroCompras");
  if (!contenedor) return;

  let cuentas = [...CACHE.cuentasPropias];

  const filtro = filtroCompras || "";

  cuentas = cuentas.filter(c => {
    const servicio = obtenerServicioCompra(c);

    return `
      ${c.ID_Cuenta}
      ${c.ID_Servicio}
      ${servicio}
      ${c.Correo_Cuenta}
      ${c.Fecha_Compra}
      ${c.Fecha_Vencimiento}
      ${c.Proveedor}
      ${c.Whatsapp}
      ${c.Estado}
    `.toLowerCase().includes(filtro);
  });

  cuentas.sort((a, b) => {
    switch (ordenComprasActual) {
      case "vencimientoAsc":
        return new Date(a.Fecha_Vencimiento) - new Date(b.Fecha_Vencimiento);

      case "vencimientoDesc":
        return new Date(b.Fecha_Vencimiento) - new Date(a.Fecha_Vencimiento);

      case "compraAsc":
        return new Date(a.Fecha_Compra) - new Date(b.Fecha_Compra);

      case "compraDesc":
        return new Date(b.Fecha_Compra) - new Date(a.Fecha_Compra);

      default:
        return 0;
    }
  });

  if (cuentas.length === 0) {
    contenedor.innerHTML = `<div class="card">No hay compras</div>`;
    return;
  }

  let html = "";

  for (const cuenta of cuentas) {
    const servicio = obtenerServicioCompra(cuenta);
    const clase = claseSemaforo(cuenta.Fecha_Vencimiento);

    html += `
      <details class="registro-card ${clase}">
        <summary class="registro-resumen registro-resumen-compras">
          <span>${escaparHtml(servicio || "")}</span>
          <span>${escaparHtml(cuenta.Correo_Cuenta || "")}</span>
          <span>Prov. ${escaparHtml(cuenta.Proveedor || "")}</span>
          <span>Vence: ${formatearFecha(cuenta.Fecha_Vencimiento)}</span>
        </summary>

        <div class="registro-detalle">
          <div class="registro-detalle-grid">
            <div><strong>ID:</strong> ${escaparHtml(cuenta.ID_Cuenta)}</div>
            <div><strong>Servicio:</strong> ${escaparHtml(cuenta.ID_Servicio)}</div>
            <div><strong>Compra:</strong> ${formatearFecha(cuenta.Fecha_Compra)}</div>
            <div><strong>WhatsApp:</strong> ${escaparHtml(cuenta.Whatsapp)}</div>
            <div><strong>Estado:</strong> ${escaparHtml(cuenta.Estado)}</div>
          </div>

          <div class="registro-acciones">
            <button onclick="whatsappCompra('${escaparAttr(cuenta.ID_Cuenta)}')">WhatsApp</button>
            <button onclick="editarCompra('${escaparAttr(cuenta.ID_Cuenta)}')">Editar</button>
            <button onclick="eliminarCompra('${escaparAttr(cuenta.ID_Cuenta)}')">Eliminar</button>
          </div>
        </div>
      </details>
    `;
  }

  contenedor.innerHTML = html;
}

/* =========================
   GUARDAR (SIN REFRESH TOTAL)
========================= */

async function guardarCompra(event) {
  event.preventDefault();

  const ID_Cuenta = document.getElementById("formCompra").dataset.editando || "";

  const cuenta = {
    ID_Servicio: document.getElementById("compraServicio").value,
    Correo_Cuenta: document.getElementById("compraCorreo").value.trim(),
    Fecha_Compra: document.getElementById("compraFechaCompra").value,
    Fecha_Vencimiento: document.getElementById("compraFechaVencimiento").value,
    Proveedor: document.getElementById("compraProveedor").value,
    Whatsapp: document.getElementById("compraWhatsapp").value.trim(),
    Estado: document.getElementById("compraEstado").value
  };

  if (!cuenta.ID_Servicio || !cuenta.Correo_Cuenta ||
      !cuenta.Fecha_Compra || !cuenta.Fecha_Vencimiento) {
    alert("Completa todos los campos");
    return;
  }

  try {
    if (ID_Cuenta) {
      cuenta.ID_Cuenta = ID_Cuenta;
      await updateCuentaPropia(cuenta);
    } else {
      await addCuentaPropia(cuenta);
    }

    limpiarFormCompra();

    // 🔥 SOLO ACTUALIZAMOS ESTE MÓDULO
    await afterCompraChange();

  } catch (error) {
    console.error(error);
  }
}

/* =========================
   AFTER CHANGE (CLAVE)
========================= */

async function afterCompraChange() {
  const data = await getInitialData();

  CACHE.cuentasPropias = data.cuentasPropias;
  CACHE.cuentasDisponibles = data.cuentasDisponibles;

  renderCompras();
  renderCuentasDisponibles();
}

/* =========================
   DELETE
========================= */

async function eliminarCompra(ID_Cuenta) {
  const ok = confirmarEliminacion("¿Eliminar compra?");
  if (!ok) return;

  try {
    await deleteCuentaPropia(ID_Cuenta);

    await afterCompraChange();

  } catch (e) {
    console.error(e);
  }
}
