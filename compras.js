document.addEventListener("DOMContentLoaded", () => {
  const formCompra = document.getElementById("formCompra");

  if (formCompra) {
    formCompra.addEventListener("submit", guardarCompra);
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
  const tbody = document.getElementById("tablaCompras");
  if (!tbody) return;

  tbody.innerHTML = "";

  DB.cuentasPropias.forEach(cuenta => {
    const servicio = DB.configCuentaPropia.find(s => s.ID_Servicio === cuenta.ID_Servicio);
    const plataforma = servicio ? servicio.Plataforma : cuenta.ID_Servicio;

    const clase = claseSemaforo(cuenta.Fecha_Vencimiento);

    tbody.innerHTML += `
      <tr class="${clase}">
        <td>${cuenta.ID_Cuenta || ""}</td>
        <td>${cuenta.ID_Servicio || ""}</td>
        <td>${cuenta.Correo_Cuenta || ""}</td>
        <td>${formatearFecha(cuenta.Fecha_Compra)}</td>
        <td>${formatearFecha(cuenta.Fecha_Vencimiento)}</td>
        <td>${cuenta.Proveedor || ""}</td>
        <td>${cuenta.Whatsapp || ""}</td>
        <td>${cuenta.Estado || ""}</td>
        <td>
          <button class="btn-whatsapp" onclick="whatsappCompra('${cuenta.ID_Cuenta}')">WhatsApp</button>

          <button class="btn-editar" onclick="editarCompra('${cuenta.ID_Cuenta}')">
            Editar
          </button>

          <button class="btn-eliminar" onclick="eliminarCompra('${cuenta.ID_Cuenta}')">
            Eliminar
          </button>
        </td>
      </tr>
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
    await refrescarTodo();

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
