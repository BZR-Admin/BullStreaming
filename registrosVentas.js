let filtroVentas = "";
let ordenVentasActual = "";

document.addEventListener("DOMContentLoaded", () => {
  const buscarVentas = document.getElementById("buscarVentas");
  const ordenVentas = document.getElementById("ordenVentas");

  if (buscarVentas) {
    buscarVentas.addEventListener("input", () => {
      filtroVentas = buscarVentas.value.toLowerCase().trim();
      renderTablaVentas();
    });
  }

  if (ordenVentas) {
    ordenVentas.addEventListener("change", () => {
      ordenVentasActual = ordenVentas.value;
      renderTablaVentas();
    });
  }
});

function renderTablaVentas() {
  const contenedor = document.getElementById("listaRegistroVentas");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  let ventas = [...DB.ventas];

  ventas = ventas.filter(venta => {
    const cliente = DB.clientes.find(c => c.ID_Cliente === venta.ID_Cliente);
    const nombreCliente = cliente ? cliente.Nombre : "";

    const servicioTexto = obtenerNombreServicioVenta(venta);

    const texto = `
      ${venta.ID_Venta || ""}
      ${venta.Tipo_Venta || ""}
      ${nombreCliente || ""}
      ${servicioTexto || ""}
      ${venta.Plataforma || ""}
      ${venta.ID_Servicio || ""}
      ${venta["Usuario/Correo"] || ""}
      ${venta.Perfil || ""}
      ${venta.Fecha_Registro || ""}
      ${venta.Fecha_Vencimiento || ""}
      ${venta.Ganancia || ""}
      ${venta.Estado || ""}
    `.toLowerCase();

    return texto.includes(filtroVentas);
  });

  ventas.sort((a, b) => {
    if (ordenVentasActual === "vencimientoAsc") {
      return new Date(a.Fecha_Vencimiento) - new Date(b.Fecha_Vencimiento);
    }

    if (ordenVentasActual === "vencimientoDesc") {
      return new Date(b.Fecha_Vencimiento) - new Date(a.Fecha_Vencimiento);
    }

    if (ordenVentasActual === "registroAsc") {
      return new Date(a.Fecha_Registro) - new Date(b.Fecha_Registro);
    }

    if (ordenVentasActual === "registroDesc") {
      return new Date(b.Fecha_Registro) - new Date(a.Fecha_Registro);
    }

    return 0;
  });

  if (ventas.length === 0) {
    contenedor.innerHTML = `
      <div class="card">
        No hay ventas para mostrar.
      </div>
    `;
    return;
  }

  ventas.forEach(venta => {
    const cliente = DB.clientes.find(c => c.ID_Cliente === venta.ID_Cliente);
    const nombreCliente = cliente ? cliente.Nombre : venta.ID_Cliente;
    const servicioTexto = obtenerNombreServicioVenta(venta);
    const clase = claseSemaforo(venta.Fecha_Vencimiento);

    contenedor.innerHTML += `
      <details class="registro-card ${clase}">
        <summary class="registro-resumen">
          <span class="registro-principal">
            ${escaparHtml(nombreCliente || "")}
          </span>

          <span class="registro-secundario">
            ${escaparHtml(servicioTexto || "")}
          </span>

          <span class="registro-correo">
            ${escaparHtml(venta["Usuario/Correo"] || "")}
          </span>

          <span class="registro-perfil">
            ${escaparHtml(venta.Perfil || "")}
          </span>

          <span class="registro-vencimiento">
            Vence: ${formatearFecha(venta.Fecha_Vencimiento)}
          </span>
        </summary>

        <div class="registro-detalle">
          <div class="registro-detalle-grid">
            <div><strong>ID Venta:</strong> ${escaparHtml(venta.ID_Venta || "")}</div>
            <div><strong>Tipo:</strong> ${escaparHtml(venta.Tipo_Venta || "")}</div>
            <div><strong>Registro:</strong> ${formatearFecha(venta.Fecha_Registro)}</div>
            <div><strong>Ganancia:</strong> $${Number(venta.Ganancia || 0).toFixed(2)}</div>
            <div><strong>Estado:</strong> ${escaparHtml(venta.Estado || "")}</div>
          </div>

          <div class="registro-acciones">
            <button class="btn-whatsapp" onclick="whatsappVenta('${escaparAttr(venta.ID_Venta)}')">
              WhatsApp
            </button>

            <button class="btn-renovar" onclick="renovarVentaRegistro('${escaparAttr(venta.ID_Venta)}')">
              Renovar
            </button>

            <button class="btn-editar" onclick="editarVentaRegistro('${escaparAttr(venta.ID_Venta)}')">
              Editar
            </button>

            <button class="btn-eliminar" onclick="eliminarVentaRegistro('${escaparAttr(venta.ID_Venta)}')">
              Eliminar
            </button>
          </div>
        </div>
      </details>
    `;
  });
}

function renderVentas() {
  renderSelectServiciosVI();
  renderSelectServiciosVCP();
  renderSelectCuentasVCP();
  colocarFechasHoy();
  renderTablaVentas();
}

async function renovarVentaRegistro(ID_Venta) {
  const nuevaFecha = prompt("Nueva fecha de vencimiento (YYYY-MM-DD):");

  if (!nuevaFecha) return;

  try {
    await renovarVenta(ID_Venta, nuevaFecha);
    alert("Venta renovada correctamente.");
    await refrescarTodo();

  } catch (error) {
    console.error(error);
  }
}

async function editarVentaRegistro(ID_Venta) {
  const venta = DB.ventas.find(v => v.ID_Venta === ID_Venta);

  if (!venta) {
    alert("Venta no encontrada.");
    return;
  }

  const nuevoCorreo = prompt("Usuario/Correo:", venta["Usuario/Correo"] || "");
  if (nuevoCorreo === null) return;

  const nuevoPerfil = prompt("Perfil:", venta.Perfil || "");
  if (nuevoPerfil === null) return;

  const nuevaFechaRegistro = prompt(
    "Fecha registro (YYYY-MM-DD):",
    formatearFecha(venta.Fecha_Registro)
  );
  if (nuevaFechaRegistro === null) return;

  const nuevaFechaVencimiento = prompt(
    "Fecha vencimiento (YYYY-MM-DD):",
    formatearFecha(venta.Fecha_Vencimiento)
  );
  if (nuevaFechaVencimiento === null) return;

  const nuevaGanancia = prompt("Ganancia:", venta.Ganancia || "");
  if (nuevaGanancia === null) return;

  try {
    await updateVenta({
      ID_Venta,
      "Usuario/Correo": nuevoCorreo,
      Perfil: nuevoPerfil,
      Fecha_Registro: nuevaFechaRegistro,
      Fecha_Vencimiento: nuevaFechaVencimiento,
      Ganancia: nuevaGanancia
    });

    alert("Venta actualizada correctamente.");
    await refrescarTodo();

  } catch (error) {
    console.error(error);
  }
}

async function eliminarVentaRegistro(ID_Venta) {
  const ok = confirmarEliminacion("¿Seguro que deseas eliminar esta venta?");

  if (!ok) return;

  try {
    await deleteVenta(ID_Venta);
    alert("Venta eliminada correctamente.");
    await refrescarTodo();

  } catch (error) {
    console.error(error);
  }
}

function whatsappVenta(ID_Venta) {
  const venta = DB.ventas.find(v => v.ID_Venta === ID_Venta);

  if (!venta) {
    alert("Venta no encontrada.");
    return;
  }

  const cliente = DB.clientes.find(c => c.ID_Cliente === venta.ID_Cliente);

  if (!cliente || !cliente.Whatsapp) {
    alert("El cliente no tiene WhatsApp registrado.");
    return;
  }

  const mensaje = `¡Hola! Bull Streaming te informa que está por vencer tu servicio de ${venta.Plataforma}, cuyo acceso es:

Usuario: ${venta["Usuario/Correo"] || ""}
Perfil: ${venta.Perfil || ""}
Fecha de vencimiento: ${formatearFecha(venta.Fecha_Vencimiento)}

¿Puedes confirmar si deseas renovar?`;

  abrirWhatsapp(cliente.Whatsapp, mensaje);
}

function obtenerNombreServicioVenta(venta) {
  if (!venta) return "";

  const tipoVenta = String(venta.Tipo_Venta || "").trim();
  const idServicio = String(venta.ID_Servicio || "").trim();

  const configCuentaPropia = Array.isArray(DB.configCuentaPropia)
    ? DB.configCuentaPropia
    : [];

  const configVentaIndependiente = Array.isArray(DB.configVentaIndependiente)
    ? DB.configVentaIndependiente
    : [];

  let servicio = null;

  if (tipoVenta === "VCP") {
    servicio = configCuentaPropia.find(s =>
      String(s.ID_Servicio || "").trim() === idServicio
    );
  }

  if (tipoVenta === "VI") {
    servicio = configVentaIndependiente.find(s =>
      String(s.ID_Servicio || "").trim() === idServicio
    );
  }

  if (servicio && servicio.Servicio) {
    return servicio.Servicio;
  }

  if (servicio && servicio.Plataforma) {
    return servicio.Plataforma;
  }

  return idServicio || venta.Plataforma || "";
}
