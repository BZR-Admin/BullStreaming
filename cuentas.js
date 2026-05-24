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

function renderCuentasDisponibles() {
  renderFiltroPlataformas();

  const tbody = document.getElementById("tablaCuentasDisponibles");
  if (!tbody) return;

  tbody.innerHTML = "";

  let cuentas = Array.isArray(DB.cuentasDisponibles)
    ? [...DB.cuentasDisponibles]
    : [];

  cuentas = cuentas
    .map(cuenta => {
      const cuentaOriginal = obtenerCuentaOriginal(cuenta);
      const plataforma = obtenerPlataformaCuenta(cuenta);
      const disponibles = Number(cuenta.Disponibles) || 0;
      const proveedor = cuentaOriginal ? cuentaOriginal.Proveedor : "";
      const fechaVencimiento = cuentaOriginal ? cuentaOriginal.Fecha_Vencimiento : "";
      const clientesOcupando = obtenerClientesOcupandoCuenta(cuenta);

      return {
        ...cuenta,
        cuentaOriginal,
        plataforma,
        disponibles,
        proveedor,
        fechaVencimiento,
        clientesOcupando
      };
    });

  cuentas = cuentas.filter(cuenta => {
    if (filtroPlataformaCuenta && cuenta.plataforma !== filtroPlataformaCuenta) {
      return false;
    }

    const textoClientes = cuenta.clientesOcupando
      .map(item => `${item.cliente} ${item.perfil} ${item.fechaVencimiento}`)
      .join(" ");

    const textoBusqueda = `
      ${cuenta.plataforma || ""}
      ${cuenta.Correo_Cuenta || ""}
      ${cuenta.disponibles || ""}
      ${cuenta.proveedor || ""}
      ${cuenta.fechaVencimiento || ""}
      ${cuenta.Estado || ""}
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
      return obtenerTiempoFecha(a.fechaVencimiento) - obtenerTiempoFecha(b.fechaVencimiento);
    }

    if (ordenCuentasActual === "vencimientoDesc") {
      return obtenerTiempoFecha(b.fechaVencimiento) - obtenerTiempoFecha(a.fechaVencimiento);
    }

    return 0;
  });

  if (cuentas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td data-label="Resultado" colspan="7">
          No hay cuentas para mostrar.
        </td>
      </tr>
    `;
    return;
  }

  cuentas.forEach(cuenta => {
    const clase = claseDisponibilidad(cuenta.disponibles);
    const estado = estadoDisponibilidad(cuenta.disponibles, cuenta.cuentaOriginal);
    const htmlClientes = crearHtmlClientesCuenta(cuenta.clientesOcupando);

    tbody.innerHTML += `
      <tr class="${clase}">
        <td data-label="Plataforma">
          ${escaparHtml(cuenta.plataforma)}
        </td>

        <td data-label="Usuario/Correo">
          ${escaparHtml(cuenta.Correo_Cuenta || "")}
        </td>

        <td data-label="Disponibles">
          ${cuenta.disponibles}
        </td>

        <td data-label="Estado">
          ${escaparHtml(estado)}
        </td>

        <td data-label="Proveedor">
          ${escaparHtml(cuenta.proveedor)}
        </td>

        <td data-label="Fecha Vencimiento">
          ${formatearFecha(cuenta.fechaVencimiento)}
        </td>

        <td data-label="Clientes">
          ${htmlClientes}
        </td>
      </tr>
    `;
  });
}

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

  select.innerHTML = `
    <option value="">Todas las plataformas</option>
  `;

  plataformas.forEach(plataforma => {
    select.innerHTML += `
      <option value="${escaparHtml(plataforma)}">
        ${escaparHtml(plataforma)}
      </option>
    `;
  });

  select.value = valorActual;
}

function obtenerPlataformaCuenta(cuenta) {
  const servicio = (DB.configCuentaPropia || []).find(s =>
    String(s.ID_Servicio || "").trim() === String(cuenta.ID_Servicio || "").trim()
  );

  return servicio ? servicio.Plataforma : cuenta.ID_Servicio;
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

function obtenerClientesOcupandoCuenta(cuenta) {
  return (DB.ventas || [])
    .filter(venta => {
      const esCuentaPropia = String(venta.Tipo_Venta || "").trim() === "VCP";

      const mismaCuenta =
        String(venta["Usuario/Correo"] || "").trim().toLowerCase() ===
        String(cuenta.Correo_Cuenta || "").trim().toLowerCase();

      const mismoServicio =
        String(venta.ID_Servicio || "").trim() ===
        String(cuenta.ID_Servicio || "").trim();

      const estaActiva = String(venta.Estado || "").trim() === "Activa";

      return esCuentaPropia && mismaCuenta && mismoServicio && estaActiva;
    })
    .map(venta => {
      const cliente = (DB.clientes || []).find(c =>
        String(c.ID_Cliente || "").trim() === String(venta.ID_Cliente || "").trim()
      );

      const nombreCliente = cliente ? cliente.Nombre : venta.ID_Cliente;

      return {
        cliente: nombreCliente || "",
        perfil: venta.Perfil || "Sin perfil",
        fechaVencimiento: venta.Fecha_Vencimiento || ""
      };
    })
    .sort((a, b) => {
      return obtenerTiempoFecha(a.fechaVencimiento) - obtenerTiempoFecha(b.fechaVencimiento);
    });
}

function crearHtmlClientesCuenta(clientes) {
  if (!clientes || clientes.length === 0) {
    return `
      <details class="clientes-cuenta">
        <summary>0 clientes</summary>
        <div class="clientes-cuenta-lista">
          Nadie está ocupando esta cuenta.
        </div>
      </details>
    `;
  }

  const items = clientes.map(item => {
    return `
      <li>
        ${escaparHtml(item.cliente)} - 
        ${escaparHtml(item.perfil)} - 
        Vence: ${formatearFecha(item.fechaVencimiento)}
      </li>
    `;
  }).join("");

  return `
    <details class="clientes-cuenta">
      <summary>Clientes (${clientes.length})</summary>
      <ul class="clientes-cuenta-lista">
        ${items}
      </ul>
    </details>
  `;
}

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

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
