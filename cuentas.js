let filtroPlataformaCuenta = "";
let busquedaCuentas = "";
let ordenCuentasActual = "disponibilidadDesc";

document.addEventListener("DOMContentLoaded", () => {
  const filtro = document.getElementById("filtroPlataformaCuentas");
  const buscar = document.getElementById("buscarCuentas");
  const orden = document.getElementById("ordenCuentas");

  if (filtro) {
    filtro.addEventListener("change", () => {
      filtroPlataformaCuenta = filtro.value;
      renderCuentasDisponibles();
    });
  }

  if (buscar) {
    buscar.addEventListener("input", () => {
      busquedaCuentas = buscar.value.toLowerCase().trim();
      renderCuentasDisponibles();
    });
  }

  if (orden) {
    orden.addEventListener("change", () => {
      ordenCuentasActual = orden.value;
      renderCuentasDisponibles();
    });
  }
});

async function afterCuentaChange() {
  const data = await getInitialData();

  CACHE.cuentasPropias = data.cuentasPropias;
  CACHE.cuentasDisponibles = data.cuentasDisponibles;

  renderCompras();
  renderCuentasDisponibles();
}

function renderCuentasDisponibles() {
  renderFiltroPlataformas();

  const contenedor = document.getElementById("listaCuentasDisponibles");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  let cuentas = Array.isArray(DB.cuentasDisponibles)
    ? [...DB.cuentasDisponibles]
    : [];

  cuentas = cuentas.map(cuenta => prepararCuentaDisponible(cuenta));

  cuentas = cuentas.filter(cuenta => {
    if (filtroPlataformaCuenta && cuenta.plataforma !== filtroPlataformaCuenta) {
      return false;
    }

    const textoClientes = cuenta.clientes
      .map(item => `${item.cliente} ${item.perfil} ${item.fechaVencimiento}`)
      .join(" ");

    const textoBusqueda = `
      ${cuenta.plataforma || ""}
      ${cuenta.Correo_Cuenta || ""}
      ${cuenta.proveedor || ""}
      ${cuenta.fechaVencimientoCuenta || ""}
      ${cuenta.estadoTexto || ""}
      ${textoClientes}
    `.toLowerCase();

    return textoBusqueda.includes(busquedaCuentas);
  });

  cuentas.sort((a, b) => {
    if (ordenCuentasActual === "disponibilidadDesc") {
      return b.disponibles - a.disponibles;
    }

    if (ordenCuentasActual === "disponibilidadAsc") {
      return a.disponibles - b.disponibles;
    }

    if (ordenCuentasActual === "vencimientoAsc") {
      return obtenerTiempoFecha(a.fechaVencimientoCuenta) - obtenerTiempoFecha(b.fechaVencimientoCuenta);
    }

    if (ordenCuentasActual === "vencimientoDesc") {
      return obtenerTiempoFecha(b.fechaVencimientoCuenta) - obtenerTiempoFecha(a.fechaVencimientoCuenta);
    }

    return 0;
  });

  if (cuentas.length === 0) {
    contenedor.innerHTML = `
      <div class="card">
        No hay cuentas para mostrar.
      </div>
    `;
    return;
  }

  const cuentasPorPlataforma = agruparPorPlataforma(cuentas);

  contenedor.innerHTML = Object.keys(cuentasPorPlataforma)
    .map(plataforma => {
      const tarjetas = cuentasPorPlataforma[plataforma]
        .map(cuenta => crearTarjetaCuenta(cuenta))
        .join("");

      return `
        <section class="grupo-plataforma">
          <h3>${escaparHtml(plataforma)}</h3>
          ${tarjetas}
        </section>
      `;
    })
    .join("");
}

function prepararCuentaDisponible(cuenta) {
  const cuentaOriginal = obtenerCuentaOriginal(cuenta);
  const servicio = obtenerServicioCuenta(cuenta);

  const plataforma = servicio ? servicio.Plataforma : cuenta.ID_Servicio;
  const proveedor = cuentaOriginal ? cuentaOriginal.Proveedor : "";
  const fechaVencimientoCuenta = cuentaOriginal ? cuentaOriginal.Fecha_Vencimiento : "";

  const usados = Number(cuenta.Usados) || 0;
  const maximo = Number(cuenta.Maximo) || 0;
  const disponibles = Number(cuenta.Disponibles) || 0;

  const clientes = obtenerClientesOcupandoCuenta(cuenta);

  return {
    ...cuenta,
    cuentaOriginal,
    servicio,
    plataforma,
    proveedor,
    fechaVencimientoCuenta,
    usados,
    maximo,
    disponibles,
    clientes,
    estadoTexto: estadoDisponibilidad(disponibles, cuentaOriginal)
  };
}

function crearTarjetaCuenta(cuenta) {
  const clase = claseDisponibilidad(cuenta.disponibles);
  const idCuenta = cuenta.ID_Cuenta || "";
  const clientesHtml = crearHtmlClientesCuenta(cuenta);
  const formularioAgregar = crearFormularioAgregarVentaCuenta(cuenta);

  return `
    <details class="cuenta-card ${clase}">
      <summary class="cuenta-resumen">
        <span class="cuenta-resumen-plataforma">
          ${escaparHtml(cuenta.plataforma)}
        </span>

        <span class="cuenta-resumen-correo">
          ${escaparHtml(cuenta.Correo_Cuenta || "")}
        </span>

        <span class="cuenta-resumen-disponibilidad">
          ${cuenta.usados}/${cuenta.maximo}
        </span>

        <span class="cuenta-resumen-proveedor">
          Prov. ${escaparHtml(cuenta.proveedor || "")}
        </span>

        <span class="cuenta-resumen-vencimiento">
          Vence: ${formatearFecha(cuenta.fechaVencimientoCuenta)}
        </span>
      </summary>

      <div class="cuenta-detalle">
        <div class="cuenta-info-extra">
          <div><strong>Estado:</strong> ${escaparHtml(cuenta.estadoTexto)}</div>
          <div><strong>Disponibles:</strong> ${cuenta.disponibles}</div>
          <div><strong>Cuenta:</strong> ${escaparHtml(cuenta.Correo_Cuenta || "")}</div>
        </div>

        <div class="cuenta-clientes-box">
          <h4>Clientes en esta cuenta</h4>
          ${clientesHtml}
        </div>

        ${cuenta.disponibles > 0 ? formularioAgregar : `
          <div class="mensaje-sin-disponibilidad">
            Esta cuenta no tiene perfiles disponibles.
          </div>
        `}
      </div>
    </details>
  `;
}

function crearHtmlClientesCuenta(cuenta) {
  if (!cuenta.clientes || cuenta.clientes.length === 0) {
    return `
      <div class="cliente-cuenta-vacio">
        0 clientes
      </div>
    `;
  }

  return cuenta.clientes.map(venta => crearTarjetaClienteVentaCuenta(venta)).join("");
}

function crearTarjetaClienteVentaCuenta(venta) {
  const idSeguroVenta = idSeguro(venta.ID_Venta);

  return `
    <details class="cliente-cuenta-card">
      <summary>
        ${escaparHtml(venta.cliente)} - 
        ${escaparHtml(venta.perfil)} - 
        Vence: ${formatearFecha(venta.fechaVencimiento)}
      </summary>

      <div class="cliente-cuenta-editor">
        <label>Cliente</label>
        <select id="editCliente_${idSeguroVenta}">
          ${crearOptionsClientes(venta.ID_Cliente, false)}
        </select>

        <label>Perfil</label>
        <input 
          id="editPerfil_${idSeguroVenta}" 
          type="text" 
          value="${escaparAttr(venta.perfil)}" 
        />

        <label>Fecha vencimiento</label>
        <input 
          id="editFecha_${idSeguroVenta}" 
          type="date" 
          value="${formatearFecha(venta.fechaVencimiento)}" 
        />

        <label>Ganancia</label>
        <input 
          id="editGanancia_${idSeguroVenta}" 
          type="number" 
          step="0.01" 
          value="${escaparAttr(venta.ganancia)}" 
        />

        <label>Estado</label>
        <select id="editEstado_${idSeguroVenta}">
          <option value="Activa" ${venta.estado === "Activa" ? "selected" : ""}>Activa</option>
          <option value="Inactiva" ${venta.estado === "Inactiva" ? "selected" : ""}>Inactiva</option>
          <option value="Vencida" ${venta.estado === "Vencida" ? "selected" : ""}>Vencida</option>
        </select>

        <div class="acciones">
          <button 
            class="btn-principal" 
            type="button" 
            onclick="guardarEdicionVentaCuenta('${escaparAttr(venta.ID_Venta)}')"
          >
            Guardar cambios
          </button>

          <button 
            class="btn-eliminar" 
            type="button" 
            onclick="eliminarVentaCuentaDesdeCuenta('${escaparAttr(venta.ID_Venta)}')"
          >
            Eliminar
          </button>
        </div>
      </div>
    </details>
  `;
}

function crearFormularioAgregarVentaCuenta(cuenta) {
  const idSeguroCuenta = idSeguro(cuenta.ID_Cuenta);

  return `
    <details class="form-agregar-vcp">
      <summary>+ Añadir cliente a esta cuenta</summary>

      <div class="form-agregar-vcp-grid">
        <label>Cliente</label>
        <select id="addCliente_${idSeguroCuenta}">
          ${crearOptionsClientes("", true)}
        </select>

        <label>Perfil</label>
        <input id="addPerfil_${idSeguroCuenta}" type="text" placeholder="Ej: Perfil 1" />

        <label>Fecha vencimiento</label>
        <input id="addFecha_${idSeguroCuenta}" type="date" />

        <label>Ganancia</label>
        <input id="addGanancia_${idSeguroCuenta}" type="number" step="0.01" />

        <button 
          type="button" 
          class="btn-principal" 
          onclick="agregarVentaCuentaDesdeCuenta('${escaparAttr(cuenta.ID_Cuenta)}')"
        >
          Guardar venta cuenta propia
        </button>
      </div>
    </details>
  `;
}

/* =========================
   ACCIONES VCP DESDE CUENTAS
========================= */

async function agregarVentaCuentaDesdeCuenta(ID_Cuenta) {
  const cuentaBase = obtenerCuentaDisponiblePorId(ID_Cuenta);

  if (!cuentaBase) {
    alert("No se encontró la cuenta.");
    return;
  }

  const cuenta = prepararCuentaDisponible(cuentaBase);

  if (Number(cuenta.disponibles) <= 0) {
    alert("Esta cuenta no tiene perfiles disponibles.");
    return;
  }

  const idSeguroCuenta = idSeguro(cuenta.ID_Cuenta);

  const ID_Cliente = document.getElementById(`addCliente_${idSeguroCuenta}`)?.value || "";
  const Perfil = document.getElementById(`addPerfil_${idSeguroCuenta}`)?.value.trim() || "";
  const Fecha_Vencimiento = document.getElementById(`addFecha_${idSeguroCuenta}`)?.value || "";
  const Ganancia = document.getElementById(`addGanancia_${idSeguroCuenta}`)?.value || "";

  if (!ID_Cliente || !Perfil || !Fecha_Vencimiento || !Ganancia) {
    alert("Completa cliente, perfil, fecha de vencimiento y ganancia.");
    return;
  }

  const venta = {
    Tipo_Venta: "VCP",
    ID_Cliente,
    Plataforma: cuenta.plataforma,
    ID_Servicio: cuenta.ID_Servicio,
    "Usuario/Correo": cuenta.Correo_Cuenta,
    Perfil,
    Fecha_Registro: hoyISO(),
    Fecha_Vencimiento,
    Ganancia,
    Estado: "Activa"
  };

  try {
    await addVenta(venta);
    alert("Venta de cuenta propia agregada correctamente.");
    await refrescarTodo();

  } catch (error) {
    console.error(error);
  }
}

async function guardarEdicionVentaCuenta(ID_Venta) {
  const ventaActual = DB.ventas.find(v => v.ID_Venta === ID_Venta);

  if (!ventaActual) {
    alert("Venta no encontrada.");
    return;
  }

  const idSeguroVenta = idSeguro(ID_Venta);

  const ID_Cliente = document.getElementById(`editCliente_${idSeguroVenta}`)?.value || "";
  const Perfil = document.getElementById(`editPerfil_${idSeguroVenta}`)?.value.trim() || "";
  const Fecha_Vencimiento = document.getElementById(`editFecha_${idSeguroVenta}`)?.value || "";
  const Ganancia = document.getElementById(`editGanancia_${idSeguroVenta}`)?.value || "";
  const Estado = document.getElementById(`editEstado_${idSeguroVenta}`)?.value || "Activa";

  if (!ID_Cliente || !Perfil || !Fecha_Vencimiento || !Ganancia) {
    alert("Completa cliente, perfil, fecha de vencimiento y ganancia.");
    return;
  }

  try {
    await updateVenta({
      ID_Venta,
      ID_Cliente,
      Perfil,
      Fecha_Vencimiento,
      Ganancia,
      Estado
    });

    alert("Venta actualizada correctamente.");

  } catch (error) {
    console.error(error);
  }
}

async function eliminarVentaCuentaDesdeCuenta(ID_Venta) {
  const ok = confirmarEliminacion("¿Seguro que deseas eliminar esta venta de la cuenta?");

  if (!ok) return;

  try {
    await deleteVenta(ID_Venta);
    alert("Venta eliminada correctamente.");
    await refrescarTodo();

  } catch (error) {
    console.error(error);
  }
}

/* =========================
   BUSQUEDA / DATOS
========================= */

function renderFiltroPlataformas() {
  const select = document.getElementById("filtroPlataformaCuentas");
  if (!select) return;

  const valorActual = select.value;

  const plataformas = [
    ...new Set(
      (DB.configCuentaPropia || [])
        .map(s => s.Plataforma)
        .filter(Boolean)
    )
  ].sort((a, b) => {
    return String(a).localeCompare(String(b), "es", {
      sensitivity: "base"
    });
  });

  select.innerHTML = `<option value="">Todas las plataformas</option>`;

  plataformas.forEach(plataforma => {
    select.innerHTML += `
      <option value="${escaparAttr(plataforma)}">
        ${escaparHtml(plataforma)}
      </option>
    `;
  });

  select.value = valorActual;
}

function obtenerCuentaDisponiblePorId(ID_Cuenta) {
  return (DB.cuentasDisponibles || []).find(c =>
    String(c.ID_Cuenta || "").trim() === String(ID_Cuenta || "").trim()
  );
}

function obtenerCuentaOriginal(cuenta) {
  let cuentaOriginal = (DB.cuentasPropias || []).find(c =>
    String(c.ID_Cuenta || "").trim() === String(cuenta.ID_Cuenta || "").trim()
  );

  if (cuentaOriginal) return cuentaOriginal;

  cuentaOriginal = (DB.cuentasPropias || []).find(c =>
    String(c.Correo_Cuenta || "").trim().toLowerCase() ===
      String(cuenta.Correo_Cuenta || "").trim().toLowerCase() &&
    String(c.ID_Servicio || "").trim() === String(cuenta.ID_Servicio || "").trim()
  );

  return cuentaOriginal || null;
}

function obtenerServicioCuenta(cuenta) {
  return (DB.configCuentaPropia || []).find(s =>
    String(s.ID_Servicio || "").trim() === String(cuenta.ID_Servicio || "").trim()
  ) || null;
}

function obtenerClientesOcupandoCuenta(cuenta) {
  return (DB.ventas || [])
    .filter(venta => {
      const esCuentaPropia = String(venta.Tipo_Venta || "").trim() === "VCP";

      const mismaCuenta =
        String(venta["Usuario/Correo"] || "").trim().toLowerCase() ===
        String(cuenta.Correo_Cuenta || "").trim().toLowerCase();

      const mismoServicio =
        String(venta.ID_Servicio || "").trim() === String(cuenta.ID_Servicio || "").trim();

      const estaActiva = String(venta.Estado || "").trim() === "Activa";

      return esCuentaPropia && mismaCuenta && mismoServicio && estaActiva;
    })
    .map(venta => {
      const cliente = (DB.clientes || []).find(c =>
        String(c.ID_Cliente || "").trim() === String(venta.ID_Cliente || "").trim()
      );

      return {
        ID_Venta: venta.ID_Venta,
        ID_Cliente: venta.ID_Cliente,
        cliente: cliente ? cliente.Nombre : venta.ID_Cliente,
        perfil: venta.Perfil || "",
        fechaVencimiento: venta.Fecha_Vencimiento || "",
        ganancia: venta.Ganancia || "",
        estado: venta.Estado || "Activa"
      };
    })
    .sort((a, b) => {
      return obtenerTiempoFecha(a.fechaVencimiento) - obtenerTiempoFecha(b.fechaVencimiento);
    });
}

function crearOptionsClientes(selectedId = "", soloActivos = true) {
  const clientes = [...(DB.clientes || [])]
    .filter(cliente => {
      if (!soloActivos) return true;

      return String(cliente.Estado || "").trim() === "Activo" ||
        String(cliente.ID_Cliente || "").trim() === String(selectedId || "").trim();
    })
    .sort((a, b) => {
      return String(a.Nombre || "").localeCompare(String(b.Nombre || ""), "es", {
        sensitivity: "base"
      });
    });

  let html = `<option value="">Seleccionar cliente</option>`;

  clientes.forEach(cliente => {
    const selected = String(cliente.ID_Cliente || "").trim() === String(selectedId || "").trim()
      ? "selected"
      : "";

    html += `
      <option value="${escaparAttr(cliente.ID_Cliente)}" ${selected}>
        ${escaparHtml(cliente.Nombre || "")} - ${escaparHtml(cliente.Whatsapp || "")}
      </option>
    `;
  });

  return html;
}

function agruparPorPlataforma(cuentas) {
  return cuentas.reduce((grupos, cuenta) => {
    const plataforma = cuenta.plataforma || "Sin plataforma";

    if (!grupos[plataforma]) {
      grupos[plataforma] = [];
    }

    grupos[plataforma].push(cuenta);
    return grupos;
  }, {});
}

/* =========================
   UTILIDADES
========================= */

function claseDisponibilidad(disponibles) {
  if (disponibles <= 0) return "disp-roja";
  if (disponibles <= 2) return "disp-amarilla";

  return "disp-verde";
}

function estadoDisponibilidad(disponibles, cuentaOriginal) {
  const estadoCuenta = cuentaOriginal ? cuentaOriginal.Estado : "";

  if (disponibles <= 0) {
    return estadoCuenta && estadoCuenta !== "Activa"
      ? "Sin disponibilidad - " + estadoCuenta
      : "Sin disponibilidad";
  }

  if (disponibles <= 2) {
    return estadoCuenta && estadoCuenta !== "Activa"
      ? "Pocas disponibles - " + estadoCuenta
      : "Pocas disponibles";
  }

  return estadoCuenta && estadoCuenta !== "Activa"
    ? "Disponible - " + estadoCuenta
    : "Disponible";
}

function obtenerTiempoFecha(fecha) {
  const date = new Date(fecha);

  if (isNaN(date)) {
    return 9999999999999;
  }

  return date.getTime();
}

function hoyISO() {
  return new Date().toISOString().split("T")[0];
}

function idSeguro(valor) {
  return String(valor || "")
    .replace(/[^a-zA-Z0-9_-]/g, "_");
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escaparAttr(valor) {
  return escaparHtml(valor);
}
