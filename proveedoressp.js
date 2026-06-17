
// =========================
// ESTADO LOCAL (AISLADO)
// =========================
let proveedoresList = [];


// =========================
// CARGAR PROVEEDORES
// =========================
async function loadProveedores() {
  try {
    const data = await getProveedores();

    proveedoresList = data;

    renderProveedores();

  } catch (error) {
    console.error("Error cargando proveedores:", error);
  }
}


// =========================
// RENDER PROVEEDORES (UI PRO)
// =========================
function renderProveedores() {
  const tbody = document.getElementById("tablaProveedores");

  if (!tbody) return;

  tbody.innerHTML = proveedoresList.map(p => `
    <tr>
      <td data-label="ID">${p.id_proveedor}</td>
      <td data-label="Proveedor">${p.proveedor}</td>
      <td data-label="WhatsApp">${p.whatsapp || "-"}</td>

      <td data-label="Acciones">
        <div class="acciones">

          <button class="btn-editar" onclick="openEditProveedor('${p.id_proveedor}')">
            Editar
          </button>

          <button class="btn-eliminar" onclick="removeProveedor('${p.id_proveedor}')">
            Eliminar
          </button>

        </div>
      </td>
    </tr>
  `).join("");
}


// =========================
// CREAR PROVEEDOR
// =========================
async function saveProveedor() {
  const proveedor = document.getElementById("proveedor_nombre").value;
  const whatsapp = document.getElementById("proveedor_whatsapp").value;

  if (!proveedor) {
    alert("El nombre del proveedor es obligatorio");
    return;
  }

  const data = {
    id_proveedor: crypto.randomUUID(),
    proveedor,
    whatsapp,
    estado: "Activo"
  };

  try {
    await addProveedor(data);

    await loadProveedores();

    document.getElementById("proveedor_nombre").value = "";
    document.getElementById("proveedor_whatsapp").value = "";

  } catch (error) {
    console.error("Error creando proveedor:", error);
  }
}


// =========================
// EDITAR PROVEEDOR
// =========================
function openEditProveedor(id) {
  const proveedor = proveedoresList.find(p => p.id_proveedor === id);
  if (!proveedor) return;

  document.getElementById("edit_id_proveedor").value = proveedor.id_proveedor;
  document.getElementById("edit_proveedor").value = proveedor.proveedor;
  document.getElementById("edit_whatsapp").value = proveedor.whatsapp || "";

  document.getElementById("modalProveedor").style.display = "block";
}


// =========================
// ACTUALIZAR PROVEEDOR
// =========================
async function updateProveedorUI() {
  const id = document.getElementById("edit_id_proveedor").value;
  const proveedor = document.getElementById("edit_proveedor").value;
  const whatsapp = document.getElementById("edit_whatsapp").value;

  try {
    await updateProveedor(id, {
      proveedor,
      whatsapp
    });

    document.getElementById("modalProveedor").style.display = "none";

    await loadProveedores();

  } catch (error) {
    console.error("Error actualizando proveedor:", error);
  }
}


// =========================
// ELIMINAR PROVEEDOR
// =========================
async function removeProveedor(id) {
  if (!confirm("¿Eliminar proveedor?")) return;

  try {
    await deleteProveedor(id);

    await loadProveedores();

  } catch (error) {
    console.error("Error eliminando proveedor:", error);
  }
}


// =========================
// INICIALIZACIÓN
// =========================
document.addEventListener("DOMContentLoaded", () => {
  loadProveedores();
});
