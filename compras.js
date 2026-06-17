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

function renderCompras() {
  renderSelectServiciosCompra();
  renderTablaCompras();
}

function renderSelectServiciosCompra() {
  const select = document.getElementById("compraServicio");
  if (!select) return;

  select.innerHTML = `<option value="">Seleccionar servicio</option>`;

  DB.configCuentaPropia.forEach(servicio => {
    select.innerHTML += `
      <option value="${servicio.ID_Servicio}">
        ${servicio.Plataforma} - ${servicio.Servicio}
      </option>
    `;
  });
}

function renderTablaCompras() {
  const contenedor = document.getElementById("listaRegistroCompras");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  let cuentas = Array.isArray(DB.cuentasPropias)
  ? [...DB.cuentasPropias]
  : [];

  cuentas = cuentas.filter(cuenta => {
    const servicio = obtenerServicioCompra(cuenta);

    const texto = `
      ${cuenta.ID_Cuenta || ""}
      ${cuenta.ID_Servicio || ""}
      ${servicio || ""}
      ${cuenta.Correo_Cuenta || ""}
      ${cuenta.Fecha_Compra || ""}
      ${cuenta.Fecha_Vencimiento || ""}
      ${cuenta.Proveedor || ""}
      ${cuenta.Whatsapp || ""}
      ${cuenta.Estado || ""}
    `.toLowerCase();

    return texto.includes(filtroCompras || "");
  });

  cuentas.sort((a, b) => {
    if (ordenComprasActual === "vencimientoAsc") {
      return new Date(a.Fecha_Vencimiento) - new Date(b.Fecha_Vencimiento);
    }

    if (ordenComprasActual === "vencimientoDesc") {
      return new Date(b.Fecha_Vencimiento) - new Date(a.Fecha_Vencimiento);
    }

    if (ordenComprasActual === "compraAsc") {
      return new Date(a.Fecha_Compra) - new Date(b.Fecha_Compra);
    }

    if (ordenComprasActual === "compraDesc") {
      return new Date(b.Fecha_Compra) - new Date(a.Fecha_Compra);
    }

    return 0;
  });

  if (cuentas.length === 0) {
    contenedor.innerHTML = `
      <div class="card">
        No hay compras para mostrar.
      </div>
    `;
    return;
  }

  cuentas.forEach(cuenta => {
    const servicio = obtenerServicioCompra(cuenta);
    const clase = claseSemaforo(cuenta.Fecha_Vencimiento);

    contenedor.innerHTML += `
      <details class="registro-card ${clase}">
        <summary class="registro-resumen registro-resumen-compras">
          <span class="registro-principal">
            ${escaparHtml(servicio || "")}
          </span>

          <span class="registro-correo">
            ${escaparHtml(cuenta.Correo_Cuenta || "")}
          </span>

          <span class="registro-proveedor">
            Prov. ${escaparHtml(cuenta.Proveedor || "")}
          </span>

          <span class="registro-vencimiento">
            Vence: ${formatearFecha(cuenta.Fecha_Vencimiento)}
          </span>
        </summary>

        <div class="registro-detalle">
          <div class="registro-detalle-grid">
            <div><strong>ID Cuenta:</strong> ${escaparHtml(cuenta.ID_Cuenta || "")}</div>
            <div><strong>ID Servicio:</strong> ${escaparHtml(cuenta.ID_Servicio || "")}</div>
            <div><strong>Fecha compra:</strong> ${formatearFecha(cuenta.Fecha_Compra)}</div>
            <div><strong>Whatsapp:</strong> ${escaparHtml(cuenta.Whatsapp || "")}</div>
            <div><strong>Estado:</strong> ${escaparHtml(cuenta.Estado || "")}</div>
          </div>

          <div class="registro-acciones">
            <button class="btn-whatsapp" onclick="whatsappCompra('${escaparAttr(cuenta.ID_Cuenta)}')">
              WhatsApp
            </button>

            <button class="btn-editar" onclick="editarCompra('${escaparAttr(cuenta.ID_Cuenta)}')">
              Editar
            </button>

            <button class="btn-eliminar" onclick="eliminarCompra('${escaparAttr(cuenta.ID_Cuenta)}')">
              Eliminar
            </button>
          </div>
        </div>
      </details>
    `;
  });
}
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

  if (
    !cuenta.ID_Servicio ||
    !cuenta.Correo_Cuenta ||
    !cuenta.Fecha_Compra ||
    !cuenta.Fecha_Vencimiento
  ) {
    alert("Completa todos los campos obligatorios.");
    return;
  }

  try {
    if (ID_Cuenta) {
      cuenta.ID_Cuenta = ID_Cuenta;
      await updateCuentaPropia(cuenta);

      alert("Compra actualizada correctamente.");
    } else {
      await addCuentaPropia(cuenta);

      alert("Compra agregada correctamente.");
    }

    limpiarFormCompra();


  } catch (error) {
    console.error(error);
  }
}

function editarCompra(ID_Cuenta) {
  const cuenta = DB.cuentasPropias.find(c => c.ID_Cuenta === ID_Cuenta);

  if (!cuenta) {
    alert("Cuenta no encontrada.");
    return;
  }

  document.getElementById("compraServicio").value = cuenta.ID_Servicio || "";
  document.getElementById("compraCorreo").value = cuenta.Correo_Cuenta || "";
  document.getElementById("compraFechaCompra").value = formatearFecha(cuenta.Fecha_Compra);
  document.getElementById("compraFechaVencimiento").value = formatearFecha(cuenta.Fecha_Vencimiento);
  document.getElementById("compraProveedor").value = cuenta.Proveedor || "";
  document.getElementById("compraWhatsapp").value = cuenta.Whatsapp || "";
  document.getElementById("compraEstado").value = cuenta.Estado || "Activa";

  document.getElementById("formCompra").dataset.editando = cuenta.ID_Cuenta;

  mostrarPantalla("compra");
}

async function eliminarCompra(ID_Cuenta) {
  const ok = confirmarEliminacion(
    "¿Seguro que deseas eliminar esta compra?"
  );

  if (!ok) return;

  try {
    await deleteCuentaPropia(ID_Cuenta);

    alert("Compra eliminada correctamente.");

    await refrescarTodo();

  } catch (error) {
    console.error(error);
  }
}

function limpiarFormCompra() {
  document.getElementById("formCompra").reset();

  delete document.getElementById("formCompra").dataset.editando;
}

function whatsappCompra(ID_Cuenta) {
  const cuenta = DB.cuentasPropias.find(c => c.ID_Cuenta === ID_Cuenta);

  if (!cuenta) {
    alert("Cuenta no encontrada.");
    return;
  }

  const servicio = DB.configCuentaPropia.find(s => s.ID_Servicio === cuenta.ID_Servicio);
  const plataforma = servicio ? servicio.Plataforma : cuenta.ID_Servicio;

  const mensaje = `¡Hola! Me gustaría renovar el servicio de ${plataforma}:

Cuenta: ${cuenta.Correo_Cuenta || ""}

¿Puedo hacerlo?`;

  abrirWhatsapp(cuenta.Whatsapp, mensaje);
}

function obtenerServicioCompra(cuenta) {
  const servicio = (DB.configCuentaPropia || []).find(s =>
    String(s.ID_Servicio || "").trim() === String(cuenta.ID_Servicio || "").trim()
  );

  if (servicio && servicio.Servicio) {
    return servicio.Servicio;
  }

  if (servicio && servicio.Plataforma) {
    return servicio.Plataforma;
  }

  return cuenta.ID_Servicio || "";
}
