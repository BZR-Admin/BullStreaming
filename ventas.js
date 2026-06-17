window.pegarMensajeVI = pegarMensajeVI;
window.detectarDatosVI = detectarDatosVI;
window.limpiarVentaIndependiente = limpiarVentaIndependiente;

document.addEventListener("DOMContentLoaded", () => {
  const formVI = document.getElementById("formVentaIndependiente");
  const formVCP = document.getElementById("formVentaCuentaPropia");

  if (formVI) formVI.addEventListener("submit", guardarVentaIndependiente);
  if (formVCP) formVCP.addEventListener("submit", guardarVentaCuentaPropia);

  const btnPegarVI = document.getElementById("btnPegarVI");
  const btnLimpiarVI = document.getElementById("btnLimpiarVI");
  const btnDetectarVI = document.getElementById("btnDetectarVI");

  if (btnPegarVI) btnPegarVI.addEventListener("click", pegarMensajeVI);
  if (btnLimpiarVI) btnLimpiarVI.addEventListener("click", limpiarVentaIndependiente);
  if (btnDetectarVI) btnDetectarVI.addEventListener("click", detectarDatosVI);

  const vcpServicio = document.getElementById("vcpServicio");
  if (vcpServicio) {
    vcpServicio.addEventListener("change", renderSelectCuentasVCP);
  }
});

/* =========================
   AFTER UPDATE
   Antes esto pedía getInitialData() completo al
   servidor (clientes, proveedores, cuentas, ventas,
   configs) solo para refrescar una venta. Ahora la
   venta ya viene del propio addVenta() y se aplica
   directo al estado local (ver main.js: aplicarVentaLocal),
   que además recalcula cuentasDisponibles en el cliente.
   Esta función queda solo como red de seguridad manual.
========================= */

async function afterVentaChange() {
  await refrescarModulo("ventas");
}

/* =========================
   RENDERS (USAN CACHE, QUE AHORA ES === DB)
========================= */

function renderVentas() {
  renderSelectServiciosVI();
  renderSelectServiciosVCP();
  renderSelectCuentasVCP();
  colocarFechasHoy();
}

function renderSelectServiciosVI() {
  const select = document.getElementById("viServicio");
  if (!select) return;

  select.innerHTML = `<option value="">Seleccionar servicio</option>`;

  CACHE.configVentaIndependiente.forEach(servicio => {
    select.innerHTML += `
      <option value="${servicio.ID_Servicio}"
        data-plataforma="${servicio.Plataforma || ""}">
        ${servicio.Plataforma} - ${servicio.Servicio}
      </option>
    `;
  });

  select.onchange = () => {
    const opt = select.options[select.selectedIndex];
    document.getElementById("viPlataforma").value = opt.dataset.plataforma || "";
  };
}

function renderSelectServiciosVCP() {
  const select = document.getElementById("vcpServicio");
  if (!select) return;

  select.innerHTML = `<option value="">Seleccionar servicio</option>`;

  CACHE.configCuentaPropia.forEach(servicio => {
    select.innerHTML += `
      <option value="${servicio.ID_Servicio}"
        data-plataforma="${servicio.Plataforma || ""}">
        ${servicio.Plataforma} - ${servicio.Servicio}
      </option>
    `;
  });
}

function renderSelectCuentasVCP() {
  const servicio = document.getElementById("vcpServicio")?.value;
  const select = document.getElementById("vcpCuenta");

  if (!select) return;

  CACHE.cuentasDisponibles
    .filter(c =>
      c.ID_Servicio === servicio &&
      c.Estado === "Activa" &&
      Number(c.Disponibles) > 0
    )
    .forEach(c => {
      select.innerHTML += `
        <option value="${c.Correo_Cuenta}">
          ${c.Correo_Cuenta} - ${c.Usados}/${c.Maximo}
        </option>
      `;
    });

  select.innerHTML = `<option value="">Seleccionar cuenta disponible</option>` + select.innerHTML;
}

function colocarFechasHoy() {
  const hoy = new Date().toISOString().split("T")[0];

  ["viFechaRegistro","vcpFechaRegistro","compraFechaCompra"]
  .forEach(id => {
    const input = document.getElementById(id);
    if (input && !input.value) input.value = hoy;
  });
}

/* =========================
   GUARDAR VENTA INDIVIDUAL (VI)
========================= */

async function guardarVentaIndependiente(event) {
  event.preventDefault();

  const venta = {
    Tipo_Venta: "VI",
    ID_Cliente: viCliente.value,
    Plataforma: viPlataforma.value.trim(),
    ID_Servicio: viServicio.value,
    "Usuario/Correo": viUsuarioCorreo.value.trim(),
    Perfil: viPerfil.value.trim(),
    Fecha_Registro: viFechaRegistro.value,
    Fecha_Vencimiento: viFechaVencimiento.value,
    Ganancia: viGanancia.value,
    Estado: "Activa"
  };

  if (!venta.ID_Cliente || !venta.Plataforma || !venta.ID_Servicio ||
      !venta["Usuario/Correo"] || !venta.Fecha_Registro ||
      !venta.Fecha_Vencimiento || !venta.Ganancia) {
    alert("Completa todos los campos");
    return;
  }

  const btnSubmit = event.target.querySelector('button[type="submit"]');
  if (btnSubmit) btnSubmit.disabled = true;

  try {
    const ventaGuardada = await addVenta(venta);
    alert("Venta agregada");

    limpiarVentaIndependiente();

    // 🔥 Antes: await afterVentaChange() -> refetch completo del servidor.
    // Ahora: la venta ya viene confirmada desde el backend (con su ID
    // generado), así que la aplicamos directo al estado local.
    aplicarVentaLocal(ventaGuardada);

  } catch (e) {
    console.error(e);
    alert("No se pudo guardar la venta. Intenta de nuevo.");
  } finally {
    if (btnSubmit) btnSubmit.disabled = false;
  }
}

/* =========================
   GUARDAR VENTA VCP
========================= */

async function guardarVentaCuentaPropia(event) {
  event.preventDefault();

  const servicioId = vcpServicio.value;
  const correoCuenta = vcpCuenta.value;

  const servicio = CACHE.configCuentaPropia.find(s => s.ID_Servicio === servicioId);
  const cuenta = CACHE.cuentasDisponibles.find(c =>
    c.ID_Servicio === servicioId &&
    c.Correo_Cuenta === correoCuenta
  );

  if (!cuenta || Number(cuenta.Disponibles) <= 0) {
    alert("Sin disponibilidad");
    return;
  }

  const venta = {
    Tipo_Venta: "VCP",
    ID_Cliente: vcpCliente.value,
    Plataforma: servicio ? servicio.Plataforma : "",
    ID_Servicio: servicioId,
    "Usuario/Correo": correoCuenta,
    Perfil: vcpPerfil.value.trim(),
    Fecha_Registro: vcpFechaRegistro.value,
    Fecha_Vencimiento: vcpFechaVencimiento.value,
    Ganancia: vcpGanancia.value,
    Estado: "Activa"
  };

  const btnSubmit = event.target.querySelector('button[type="submit"]');
  if (btnSubmit) btnSubmit.disabled = true;

  try {
    const ventaGuardada = await addVenta(venta);
    alert("Venta VCP agregada");

    limpiarVentaCuentaPropia();

    // 🔥 Igual que en VI: aplicamos la venta confirmada al estado local.
    // aplicarVentaLocal ya recalcula cuentasDisponibles y vuelve a
    // pintar selects/tablas relevantes (ver main.js).
    aplicarVentaLocal(ventaGuardada);

  } catch (e) {
    console.error(e);
    alert("No se pudo guardar la venta. Intenta de nuevo.");
  } finally {
    if (btnSubmit) btnSubmit.disabled = false;
  }
}

window.pegarMensajeVI = pegarMensajeVI;
window.limpiarVentaIndependiente = limpiarVentaIndependiente;
window.detectarDatosVI = detectarDatosVI;
window.guardarVentaIndependiente = guardarVentaIndependiente;
window.guardarVentaCuentaPropia = guardarVentaCuentaPropia;
