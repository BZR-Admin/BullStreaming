function renderTablaVentas() {
  const tbody = document.getElementById("tablaVentas");
  if (!tbody) return;

  tbody.innerHTML = "";

  DB.ventas.forEach(venta => {
    const cliente = DB.clientes.find(c => c.ID_Cliente === venta.ID_Cliente);
    const nombreCliente = cliente ? cliente.Nombre : venta.ID_Cliente;

    tbody.innerHTML += `
      <tr>
        <td>${venta.ID_Venta || ""}</td>
        <td>${venta.Tipo_Venta || ""}</td>
        <td>${nombreCliente || ""}</td>
        <td>${venta.Plataforma || ""}</td>
        <td>${venta.ID_Servicio || ""}</td>
        <td>${venta["Usuario/Correo"] || ""}</td>
        <td>${venta.Perfil || ""}</td>
        <td>${formatearFecha(venta.Fecha_Registro)}</td>
        <td>${formatearFecha(venta.Fecha_Vencimiento)}</td>
        <td>$${Number(venta.Ganancia || 0).toFixed(2)}</td>
        <td>${venta.Estado || ""}</td>
        <td>
          <button class="btn-renovar" onclick="renovarVentaRegistro('${venta.ID_Venta}')">Renovar</button>
          <button class="btn-editar" onclick="editarVentaRegistro('${venta.ID_Venta}')">Editar</button>
          <button class="btn-eliminar" onclick="eliminarVentaRegistro('${venta.ID_Venta}')">Eliminar</button>
        </td>
      </tr>
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
