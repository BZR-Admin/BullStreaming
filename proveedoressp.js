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
// RENDER TABLA
// =========================
function renderProveedores() {
  const tbody = document.getElementById("tablaProveedores");

  if (!tbody) return;

  tbody.innerHTML = proveedoresList.map(p => `
    <tr>
      <td>${p.id_proveedor}</td>
      <td>${p.proveedor}</td>
      <td>${p.whatsapp || ""}</td>
      <td>
        <button onclick="openEditProveedor('${p.id_proveedor}')">Editar</button>
        <button onclick="removeProveedor('${p.id_proveedor}')">Eliminar</button>
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
    alert("Nombre del proveedor obligatorio");
    return;
  }

  const data = {
    id_proveedor: crypto.randomUUID(),
    proveedor,
    whatsapp
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
// ABRIR EDITAR
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
