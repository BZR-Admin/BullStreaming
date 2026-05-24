let filtroPlataformaCuenta = "";

document.addEventListener("DOMContentLoaded", () => {
  const filtro = document.getElementById("filtroPlataformaCuentas");

  if (filtro) {
    filtro.addEventListener("change", () => {
      filtroPlataformaCuenta = filtro.value;
      renderCuentasDisponibles();
    });
  }
});

function renderCuentasDisponibles() {
  renderFiltroPlataformas();

  const tbody = document.getElementById("tablaCuentasDisponibles");
  if (!tbody) return;

  tbody.innerHTML = "";

  let cuentas = [...DB.cuentasDisponibles];

  cuentas = cuentas.filter(cuenta => {
    const plataforma = obtenerPlataformaCuenta(cuenta);

    if (!filtroPlataformaCuenta) return true;

    return plataforma === filtroPlataformaCuenta;
  });

  cuentas.sort((a, b) => {
    const disponiblesA = Number(a.Disponibles) || 0;
    const disponiblesB = Number(b.Disponibles) || 0;

    return disponiblesB - disponiblesA;
  });

  if (cuentas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td data-label="Resultado" colspan="7">
          No hay cuentas disponibles para mostrar.
        </td>
      </tr>
    `;
    return;
  }

  cuentas.forEach(cuenta => {
    const cuentaOriginal = obtenerCuentaOriginal(cuenta);
    const plataforma = obtenerPlataformaCuenta(cuenta);
    const disponibles = Number(cuenta.Disponibles) || 0;
    const clase = claseDisponibilidad(disponibles);
    const estado = estadoDisponibilidad(disponibles, cuentaOriginal);
    const proveedor = cuentaOriginal ? cuentaOriginal.Proveedor : "";
    const fechaVencimiento = cuentaOriginal ? cuentaOriginal.Fecha_Vencimiento : "";

    const clientesOcupando = obtenerClientesOcupandoCuenta(cuenta);
    const htmlClientes = crearHtmlClientesCuenta(clientesOcupando);

    tbody.innerHTML += `
      <tr class="${clase}">
        <td data-label="Plataforma">
          ${escaparHtml(plataforma)}
        </td>

        <td data-label="Usuario/Correo">
          ${escaparHtml(cuenta.Correo_Cuenta || "")}
        </td>

        <td data-label="Disponibles">
          ${disponibles}
        </td>

        <td data-label="Estado">
          ${escaparHtml(estado)}
        </td>

        <td data-label="Proveedor">
          ${escaparHtml(proveedor)}
        </td>

        <td data-label="Fecha Vencimiento">
          ${formatearFecha(fechaVencimiento)}
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
      DB.configCuentaPropia
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
  const servicio = DB.configCuentaPropia.find(s =>
    String(s.ID_Servicio || "").trim() === String(cuenta.ID_Servicio || "").trim()
  );

  return servicio ? servicio.Plataforma : cuenta.ID_Servicio;
}

function obtenerCuentaOriginal(cuenta) {
  let cuentaOriginal = DB.cuentasPropias.find(c =>
    String(c.ID_Cuenta || "").trim() === String(cuenta.ID_Cuenta || "").trim()
  );

  if (cuentaOriginal) return cuentaOriginal;

  cuentaOriginal = DB.cuentasPropias.find(c =>
    String(c.Correo_Cuenta || "").trim().toLowerCase() ===
      String(cuenta.Correo_Cuenta || "").trim().toLowerCase() &&
    String(c.ID_Servicio || "").trim() === String(cuenta.ID_Servicio || "").trim()
  );

  return cuentaOriginal || null;
}

function obtenerClientesOcupandoCuenta(cuenta) {
  return DB.ventas
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
      const cliente = DB.clientes.find(c =>
        String(c.ID_Cliente || "").trim() === String(venta.ID_Cliente || "").trim()
      );

      const nombreCliente = cliente ? cliente.Nombre : venta.ID_Cliente;
      const perfil = venta.Perfil || "Sin perfil";

      return {
        cliente: nombreCliente,
        perfil: perfil
      };
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
        Cl. ${escaparHtml(item.cliente)} - ${escaparHtml(item.perfil)}
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

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
