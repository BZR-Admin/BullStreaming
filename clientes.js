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

/* =========================
   AFTER CHANGE (IMPORTANTE)
========================= */

async function afterClienteChange() {
  const data = await getInitialData();

  CACHE.clientes = data.clientes;

  renderClientes();
}

/* =========================
   RENDER PRINCIPAL
========================= */

function renderClientes() {
  renderSelectClientes();
  renderTablaClientes();
}

/* =========================
   SELECT CLIENTES (CACHE)
========================= */

function renderSelectClientes() {
  const selects = [
    document.getElementById("viCliente"),
    document.getElementById("vcpCliente")
  ];

  const clientesOrdenados = [...CACHE.clientes]
    .filter(c => String(c.Estado || "").trim() === "Activo")
    .sort((a, b) =>
      String(a.Nombre).localeCompare(String(b.Nombre), "es", {
        sensitivity: "base"
      })
    );

  selects.forEach(select => {
    if (!select) return;

    select.innerHTML = `<option value="">Seleccionar cliente</option>`;

    clientesOrdenados.forEach(cliente => {
      select.innerHTML += `
        <option value="${cliente.ID_Cliente}">
          ${cliente.Nombre} - ${cliente.Whatsapp}
        </option>
      `;
    });
  });
}

/* =========================
   TABLA CLIENTES
========================= */

function renderTablaClientes() {
  const tbody = document.getElementById("tablaClientes");
  if (!tbody) return;

  const clientes = CACHE.clientes;

  let html = "";

  for (const cliente of clientes) {
    html += `
      <tr>
        <td>${cliente.ID_Cliente || ""}</td>
        <td>${cliente.Nombre || ""}</td>
        <td>${cliente.Whatsapp || ""}</td>
        <td>${cliente.Estado || ""}</td>
        <td>
          <button onclick="editarCliente('${cliente.ID_Cliente}')">Editar</button>
          <button onclick="eliminarCliente('${cliente.ID_Cliente}')">Eliminar</button>
        </td>
      </tr>
    `;
  }

  tbody.innerHTML = html;
}

/* =========================
   GUARDAR CLIENTE
========================= */

async function guardarCliente(event) {
  event.preventDefault();

  const ID_Cliente = document.getElementById("clienteId").value;

  const cliente = {
    Nombre: clienteNombre.value.trim(),
    Whatsapp: clienteWhatsapp.value.trim(),
    Estado: clienteEstado.value
  };

  if (!cliente.Nombre || !cliente.Whatsapp) {
    alert("Nombre y Whatsapp son obligatorios");
    return;
  }

  try {
    if (ID_Cliente) {
      cliente.ID_Cliente = ID_Cliente;
      await updateCliente(cliente);
    } else {
      await addCliente(cliente);
    }

    limpiarFormCliente();

    // 🔥 IMPORTANTE: solo refresca clientes
    await afterClienteChange();

  } catch (error) {
    console.error(error);
  }
}

/* =========================
   EDITAR
========================= */

function editarCliente(ID_Cliente) {
  const cliente = CACHE.clientes.find(c => c.ID_Cliente === ID_Cliente);

  if (!cliente) return alert("Cliente no encontrado");

  clienteId.value = cliente.ID_Cliente || "";
  clienteNombre.value = cliente.Nombre || "";
  clienteWhatsapp.value = cliente.Whatsapp || "";
  clienteEstado.value = cliente.Estado || "Activo";

  mostrarPantalla("clientes");
}

/* =========================
   ELIMINAR
========================= */

async function eliminarCliente(ID_Cliente) {
  const ok = confirmarEliminacion("¿Eliminar cliente?");
  if (!ok) return;

  try {
    await deleteCliente(ID_Cliente);

    // 🔥 SOLO REFRESCA CLIENTES
    await afterClienteChange();

  } catch (error) {
    console.error(error);
  }
}

/* =========================
   LIMPIAR FORM
========================= */

function limpiarFormCliente() {
  clienteId.value = "";
  clienteNombre.value = "";
  clienteWhatsapp.value = "";
  clienteEstado.value = "Activo";
}
