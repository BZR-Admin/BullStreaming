
// =========================
// ESTADO LOCAL
// =========================
let comprasList = [];


// =========================
// CARGAR COMPRAS
// =========================
async function loadCompras() {
  try {
    const data = await getCuentasPropias();

    comprasList = data;

    renderCompras();

  } catch (error) {
    console.error("Error cargando compras:", error);
  }
}


// =========================
// RENDER COMPRAS
// =========================
function renderCompras() {
  const tbody = document.getElementById("tablaCompras");

  if (!tbody) return;

  tbody.innerHTML = comprasList.map(c => `
    <tr>
      <td data-label="Servicio">${c.id_servicio}</td>
      <td data-label="Correo">${c.correo_cuenta}</td>
      <td data-label="Proveedor">${c.proveedor || "-"}</td>
      <td data-label="Compra">${c.fecha_compra || "-"}</td>
      <td data-label="Vence">${c.fecha_vencimiento || "-"}</td>
      <td data-label="Estado">${c.estado}</td>

      <td data-label="Acciones">
        <div class="acciones">

          <button class="btn-editar"
            onclick="openEditCompra('${c.id_cuenta}')">
            Editar
          </button>

          <button class="btn-eliminar"
            onclick="removeCompra('${c.id_cuenta}')">
            Eliminar
          </button>

        </div>
      </td>
    </tr>
  `).join("");
}


// =========================
// ELIMINAR COMPRA
// =========================
async function removeCompra(id) {
  if (!confirm("¿Eliminar cuenta?")) return;

  try {
    await deleteCuentaPropia(id);
    await loadCompras();

  } catch (error) {
    console.error("Error eliminando compra:", error);
  }
}


// =========================
// INICIALIZACIÓN
// =========================
document.addEventListener("DOMContentLoaded", () => {
  loadCompras();
});
