document.addEventListener("DOMContentLoaded", () => {
  const formCliente = document.getElementById("formCliente");
  const btnLimpiarCliente = document.getElementById("btnLimpiarCliente");

  if (formCliente) {
    formCliente.addEventListener("submit", guardarCliente);
  }

  if (btnLimpiarCliente) {
    btnLimpiarCliente.addEventListener("click", limpiarFormCliente);
  }
});

function renderClientes() {
  renderSelectClientes();
  renderTablaClientes();
}

function renderSelectClientes() {
  const selects = [
    document.getElementById("viCliente"),
    document.getElementById("vcpCliente")
  ];

  selects.forEach(select => {
    if (!select) return;

    select.innerHTML = `<option value="">Seleccionar cliente</option>`;

    DB.clientes
      .filter(cliente => cliente.Estado === "Activo")
      .forEach(cliente => {
        select.innerHTML += `
          <option value="${cliente.ID_Cliente}">
            ${cliente.Nombre} - ${cliente.Whatsapp}
          </option>
        `;
      });
  });
}

function renderTablaClientes() {
  const tbody = document.getElementById("tablaClientes");
  if (!tbody) return;

  tbody.innerHTML = "";

  DB.clientes.forEach(cliente => {
    tbody.innerHTML += `
      <tr>
        <td>${cliente.ID_Cliente || ""}</td>
        <td>${cliente.Nombre || ""}</td>
        <td>${cliente.Whatsapp || ""}</td>
        <td>${cliente.Estado || ""}</td>
        <td>
          <button class="btn-editar" onclick="editarCliente('${cliente.ID_Cliente}')">Editar</button>
          <button class="btn-eliminar" onclick="eliminarCliente('${cliente.ID_Cliente}')">Eliminar</button>
        </td>
      </tr>
    `;
  });
}

async function guardarCliente(event) {
  event.preventDefault();

  const ID_Cliente = document.getElementById("clienteId").value;

  const cliente = {
    Nombre: document.getElementById("clienteNombre").value.trim(),
    Whatsapp: document.getElementById("clienteWhatsapp").value.trim(),
    Estado: document.getElementById("clienteEstado").value
  };

  if (!cliente.Nombre || !cliente.Whatsapp) {
    alert("Nombre y Whatsapp son obligatorios.");
    return;
  }

  try {
    if (ID_Cliente) {
      cliente.ID_Cliente = ID_Cliente;
      await updateCliente(cliente);
      alert("Cliente actualizado correctamente.");
    } else {
      await addCliente(cliente);
      alert("Cliente agregado correctamente.");
    }

    limpiarFormCliente();
    await refrescarTodo();

  } catch (error) {
    console.error(error);
  }
}

function editarCliente(ID_Cliente) {
  const cliente = DB.clientes.find(c => c.ID_Cliente === ID_Cliente);

  if (!cliente) {
    alert("Cliente no encontrado.");
    return;
  }

  document.getElementById("clienteId").value = cliente.ID_Cliente || "";
  document.getElementById("clienteNombre").value = cliente.Nombre || "";
  document.getElementById("clienteWhatsapp").value = cliente.Whatsapp || "";
  document.getElementById("clienteEstado").value = cliente.Estado || "Activo";

  mostrarPantalla("clientes");
}

async function eliminarCliente(ID_Cliente) {
  const ok = confirmarEliminacion("¿Seguro que deseas eliminar este cliente?");

  if (!ok) return;

  try {
    await deleteCliente(ID_Cliente);
    alert("Cliente eliminado correctamente.");
    await refrescarTodo();

  } catch (error) {
    console.error(error);
  }
}

function limpiarFormCliente() {
  document.getElementById("clienteId").value = "";
  document.getElementById("clienteNombre").value = "";
  document.getElementById("clienteWhatsapp").value = "";
  document.getElementById("clienteEstado").value = "Activo";
}
