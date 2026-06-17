document.addEventListener("DOMContentLoaded", () => {
  const formVI = document.getElementById("formVentaIndependiente");
  const formVCP = document.getElementById("formVentaCuentaPropia");

  if (formVI) {
    formVI.addEventListener("submit", guardarVentaIndependiente);
  }

  if (formVCP) {
    formVCP.addEventListener("submit", guardarVentaCuentaPropia);
  }

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

async function afterVentaChange() {
  const data = await getInitialData();

  CACHE.ventas = data.ventas;
  CACHE.cuentasDisponibles = data.cuentasDisponibles;

  renderVentas();
  renderCuentasDisponibles();
}

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

  DB.configVentaIndependiente.forEach(servicio => {
    select.innerHTML += `
      <option 
        value="${servicio.ID_Servicio}"
        data-plataforma="${servicio.Plataforma || ""}"
      >
        ${servicio.Plataforma} - ${servicio.Servicio}
      </option>
    `;
  });

  select.onchange = () => {
    const option = select.options[select.selectedIndex];
    document.getElementById("viPlataforma").value = option.dataset.plataforma || "";
  };
}

function renderSelectServiciosVCP() {
  const select = document.getElementById("vcpServicio");
  if (!select) return;

  select.innerHTML = `<option value="">Seleccionar servicio</option>`;

  DB.configCuentaPropia.forEach(servicio => {
    select.innerHTML += `
      <option 
        value="${servicio.ID_Servicio}"
        data-plataforma="${servicio.Plataforma || ""}"
      >
        ${servicio.Plataforma} - ${servicio.Servicio}
      </option>
    `;
  });
}

function renderSelectCuentasVCP() {
  const servicio = document.getElementById("vcpServicio")?.value;
  const select = document.getElementById("vcpCuenta");

  if (!select) return;

  select.innerHTML = `<option value="">Seleccionar cuenta disponible</option>`;

  DB.cuentasDisponibles
    .filter(cuenta =>
      cuenta.ID_Servicio === servicio &&
      cuenta.Estado === "Activa" &&
      Number(cuenta.Disponibles) > 0
    )
    .forEach(cuenta => {
      select.innerHTML += `
        <option value="${cuenta.Correo_Cuenta}">
          ${cuenta.Correo_Cuenta} - ${cuenta.Usados}/${cuenta.Maximo} Disponible
        </option>
      `;
    });
}

function colocarFechasHoy() {
  const hoy = new Date().toISOString().split("T")[0];

  [
    "viFechaRegistro",
    "vcpFechaRegistro",
    "compraFechaCompra"
  ].forEach(id => {
    const input = document.getElementById(id);
    if (input && !input.value) input.value = hoy;
  });
}

/* =========================
   VENTA INDEPENDIENTE
========================= */

async function guardarVentaIndependiente(event) {
  event.preventDefault();

  const venta = {
    Tipo_Venta: "VI",
    ID_Cliente: document.getElementById("viCliente").value,
    Plataforma: document.getElementById("viPlataforma").value.trim(),
    ID_Servicio: document.getElementById("viServicio").value,
    "Usuario/Correo": document.getElementById("viUsuarioCorreo").value.trim(),
    Perfil: document.getElementById("viPerfil").value.trim(),
    Fecha_Registro: document.getElementById("viFechaRegistro").value,
    Fecha_Vencimiento: document.getElementById("viFechaVencimiento").value,
    Ganancia: document.getElementById("viGanancia").value,
    Estado: "Activa"
  };

  if (
    !venta.ID_Cliente ||
    !venta.Plataforma ||
    !venta.ID_Servicio ||
    !venta["Usuario/Correo"] ||
    !venta.Fecha_Registro ||
    !venta.Fecha_Vencimiento ||
    !venta.Ganancia
  ) {
    alert("Completa todos los campos obligatorios de la venta independiente.");
    return;
  }

  try {
    await addVenta(venta);
    alert("Venta independiente agregada correctamente.");
    limpiarVentaIndependiente();

  } catch (error) {
    console.error(error);
  }
}

async function pegarMensajeVI() {
  try {
    const texto = await navigator.clipboard.readText();
    document.getElementById("viMensaje").value = texto;
    detectarDatosVI();
  } catch (error) {
    alert("No se pudo leer el portapapeles. Pega el texto manualmente.");
  }
}

function limpiarVentaIndependiente() {
  document.getElementById("formVentaIndependiente").reset();
  document.getElementById("viMensaje").value = "";

  const hoy = new Date().toISOString().split("T")[0];
  document.getElementById("viFechaRegistro").value = hoy;
}

function detectarDatosVI() {
  const texto = document.getElementById("viMensaje").value;

  if (!texto.trim()) {
    alert("Pega primero el mensaje de entrega.");
    return;
  }

  const correo = detectarCorreo(texto);
  const perfil = detectarPerfil(texto);
  const fechaVencimiento = detectarFecha(texto);
  const servicioDetectado = detectarServicio(texto);

  if (correo) {
    document.getElementById("viUsuarioCorreo").value = correo;
  }

  if (perfil) {
    document.getElementById("viPerfil").value = perfil;
  }

  if (fechaVencimiento) {
    document.getElementById("viFechaVencimiento").value = fechaVencimiento;
  }

  if (servicioDetectado) {
    document.getElementById("viServicio").value = servicioDetectado.ID_Servicio;
    document.getElementById("viPlataforma").value = servicioDetectado.Plataforma;
  }
}

function detectarCorreo(texto) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = texto.match(emailRegex);
  if (match) return match[0];

  const lineas = texto.split(/\n/);

  for (const linea of lineas) {
    const lower = linea.toLowerCase();

    if (
      lower.includes("usuario") ||
      lower.includes("correo") ||
      lower.includes("cuenta") ||
      lower.includes("login")
    ) {
      const partes = linea.split(/:|-|=/);
      if (partes.length > 1) return partes.slice(1).join(" ").trim();
    }
  }

  return "";
}

function detectarPerfil(texto) {
  const lineas = texto.split(/\n/);

  for (const linea of lineas) {
    const lower = linea.toLowerCase();

    if (
      lower.includes("perfil") ||
      lower.includes("profile")
    ) {
      const partes = linea.split(/:|-|=/);
      if (partes.length > 1) return partes.slice(1).join(" ").trim();
    }
  }

  return "";
}

function detectarFecha(texto) {
  const patrones = [
    /(\d{4})-(\d{2})-(\d{2})/,
    /(\d{2})\/(\d{2})\/(\d{4})/,
    /(\d{2})-(\d{2})-(\d{4})/
  ];

  for (const patron of patrones) {
    const match = texto.match(patron);

    if (!match) continue;

    if (patron === patrones[0]) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }

    return `${match[3]}-${match[2]}-${match[1]}`;
  }

  return "";
}

function detectarServicio(texto) {
  const lower = texto.toLowerCase();

  return DB.configVentaIndependiente.find(servicio => {
    const plataforma = String(servicio.Plataforma || "").toLowerCase();
    const nombreServicio = String(servicio.Servicio || "").toLowerCase();

    return lower.includes(plataforma) || lower.includes(nombreServicio);
  });
}

/* =========================
   VENTA CUENTA PROPIA
========================= */

async function guardarVentaCuentaPropia(event) {
  event.preventDefault();

  const servicioId = document.getElementById("vcpServicio").value;
  const correoCuenta = document.getElementById("vcpCuenta").value;

  const servicio = DB.configCuentaPropia.find(s => s.ID_Servicio === servicioId);
  const cuenta = DB.cuentasDisponibles.find(c =>
    c.ID_Servicio === servicioId &&
    c.Correo_Cuenta === correoCuenta
  );

  if (!cuenta || Number(cuenta.Disponibles) <= 0) {
    alert("Esta cuenta ya no tiene perfiles disponibles.");
    return;
  }

  const venta = {
    Tipo_Venta: "VCP",
    ID_Cliente: document.getElementById("vcpCliente").value,
    Plataforma: servicio ? servicio.Plataforma : "",
    ID_Servicio: servicioId,
    "Usuario/Correo": correoCuenta,
    Perfil: document.getElementById("vcpPerfil").value.trim(),
    Fecha_Registro: document.getElementById("vcpFechaRegistro").value,
    Fecha_Vencimiento: document.getElementById("vcpFechaVencimiento").value,
    Ganancia: document.getElementById("vcpGanancia").value,
    Estado: "Activa"
  };

  if (
    !venta.ID_Cliente ||
    !venta.ID_Servicio ||
    !venta["Usuario/Correo"] ||
    !venta.Perfil ||
    !venta.Fecha_Registro ||
    !venta.Fecha_Vencimiento ||
    !venta.Ganancia
  ) {
    alert("Completa todos los campos obligatorios de la venta cuenta propia.");
    return;
  }

  try {
    await addVenta(venta);
    alert("Venta de cuenta propia agregada correctamente.");
    limpiarVentaCuentaPropia();
    await refrescarTodo();

  } catch (error) {
    console.error(error);
  }
}

function limpiarVentaCuentaPropia() {
  document.getElementById("formVentaCuentaPropia").reset();

  const hoy = new Date().toISOString().split("T")[0];
  document.getElementById("vcpFechaRegistro").value = hoy;
}
