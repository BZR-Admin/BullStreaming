
// =========================
// ESTADO LOCAL (AISLADO)
// =========================
let clientesList = [];


// =========================
// CARGAR CLIENTES
// =========================
async function loadClientes() {
  try {
    const data = await getClientes();

    clientesList = data;

    renderClientes();

  } catch (error) {
    console.error("Error cargando clientes:", error);
  }
}


// =========================
// RENDER CLIENTES (UI MEJORADA)
// =========================
function renderClientes() {
  const tbody = document.getElementById("tablaClientes");

  if (!tbody) return;

  tbody.innerHTML = clientesList.map(c => `
    <tr>
      <td data-label="ID">${c.id_cliente}</td>
      <td data-label="Nombre">${c.nombre}</td>
      <td data-label="WhatsApp">${c.whatsapp || "-"}</td>
      <td data-label="Estado">${c.estado || "Activo"}</td>

      <td data-label="Acciones">
        <div class="acciones">

          <button class="btn-editar" onclick="openEditCliente('${c.id_cliente}')">
            Editar
          </button>

          <button class="btn-eliminar" onclick="removeCliente('${c.id_cliente}')">
            Eliminar
          </button>

        </div>
      </td>
    </tr>
  `).join("");
}


// =========================
// CREAR CLIENTE
// =========================
async function saveCliente() {
  const nombre = document.getElementById("cliente_nombre").value;
  const whatsapp = document.getElementById("cliente_whatsapp").value;

  if (!nombre) {
    alert("El nombre es obligatorio");
    return;
  }

  const cliente = {
    id_cliente: crypto.randomUUID(),
    nombre,
    whatsapp,
    estado: "Activo"
  };

  try {
    await addCliente(cliente);

    await loadClientes();

    document.getElementById("cliente_nombre").value = "";
    document.getElementById("cliente_whatsapp").value = "";

  } catch (error) {
    console.error("Error creando cliente:", error);
  }
}


// =========================
// EDITAR CLIENTE
// =========================
function openEditCliente(id) {
  const cliente = clientesList.find(c => c.id_cliente === id);
  if (!cliente) return;

  document.getElementById("edit_id_cliente").value = cliente.id_cliente;
  document.getElementById("edit_nombre_cliente").value = cliente.nombre;
  document.getElementById("edit_whatsapp_cliente").value = cliente.whatsapp || "";

  document.getElementById("modalCliente").style.display = "block";
}


// =========================
// ACTUALIZAR CLIENTE
// =========================
async function updateClienteUI() {
  const id = document.getElementById("edit_id_cliente").value;
  const nombre = document.getElementById("edit_nombre_cliente").value;
  const whatsapp = document.getElementById("edit_whatsapp_cliente").value;

  try {
    await updateCliente(id, {
      nombre,
      whatsapp
    });

    document.getElementById("modalCliente").style.display = "none";

    await loadClientes();

  } catch (error) {
    console.error("Error actualizando cliente:", error);
  }
}


// =========================
// ELIMINAR CLIENTE
// =========================
async function removeCliente(id) {
  if (!confirm("¿Eliminar cliente?")) return;

  try {
    await deleteCliente(id);

    await loadClientes();

  } catch (error) {
    console.error("Error eliminando cliente:", error);
  }
}


// =========================
// INICIALIZACIÓN
// =========================
document.addEventListener("DOMContentLoaded", () => {
  loadClientes();
});
