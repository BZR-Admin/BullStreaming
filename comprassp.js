
// =========================
// ESTADO LOCAL
// =========================
let compras = [];


// =========================
// CARGAR COMPRAS
// =========================
async function loadCompras() {
  try {
    compras = await getCuentasPropias();
    renderCompras();
  } catch (error) {
    console.error("Error cargando compras:", error);
  }
}


// =========================
// RENDER TABLA
// =========================
function renderCompras() {
  const tbody = document.getElementById("tablaCompras");

  if (!tbody) return;

  tbody.innerHTML = compras.map(c => `
    <tr>
      <td>${c.id_cuenta}</td>
      <td>${c.id_servicio}</td>
      <td>${c.correo_cuenta}</td>
      <td>${c.proveedor || ""}</td>
      <td>${c.fecha_compra || ""}</td>
      <td>${c.fecha_vencimiento || ""}</td>
      <td>${c.estado}</td>
      <td>
        <button onclick="openEditCompra('${c.id_cuenta}')">Editar</button>
        <button onclick="removeCompra('${c.id_cuenta}')">Eliminar</button>
      </td>
    </tr>
  `).join("");
}


// =========================
// CREAR COMPRA (CUENTA PROPIA)
// =========================
async function saveCompra() {
  const id_servicio = document.getElementById("id_servicio").value;
  const correo_cuenta = document.getElementById("correo_cuenta").value;
  const proveedor = document.getElementById("proveedor").value;
  const fecha_compra = document.getElementById("fecha_compra").value;
  const fecha_vencimiento = document.getElementById("fecha_vencimiento").value;

  if (!id_servicio || !correo_cuenta) {
    alert("Completa los campos obligatorios");
    return;
  }

  const compra = {
    id_cuenta: crypto.randomUUID(),
    id_servicio,
    correo_cuenta,
    proveedor,
    fecha_compra,
    fecha_vencimiento,
    estado: "Activa"
  };

  try {
    await addCuentaPropia(compra);

    // 🔥 actualización instantánea
    await loadCompras();

    // limpiar inputs
    document.getElementById("correo_cuenta").value = "";

  } catch (error) {
    console.error("Error creando compra:", error);
  }
}


// =========================
// ABRIR EDITAR COMPRA
// =========================
function openEditCompra(id) {
  const compra = compras.find(c => c.id_cuenta === id);
  if (!compra) return;

  document.getElementById("edit_id_cuenta").value = compra.id_cuenta;
  document.getElementById("edit_correo_cuenta").value = compra.correo_cuenta;
  document.getElementById("edit_estado").value = compra.estado;
  document.getElementById("edit_fecha_vencimiento").value = compra.fecha_vencimiento || "";

  document.getElementById("modalCompra").style.display = "block";
}


// =========================
// ACTUALIZAR COMPRA
// =========================
async function updateCompraUI() {
  const id_cuenta = document.getElementById("edit_id_cuenta").value;
  const correo_cuenta = document.getElementById("edit_correo_cuenta").value;
  const estado = document.getElementById("edit_estado").value;
  const fecha_vencimiento = document.getElementById("edit_fecha_vencimiento").value;

  try {
    await updateCuentaPropia(id_cuenta, {
      correo_cuenta,
      estado,
      fecha_vencimiento
    });

    document.getElementById("modalCompra").style.display = "none";

    // 🔥 refresh instantáneo
    await loadCompras();

  } catch (error) {
    console.error("Error actualizando compra:", error);
  }
}


// =========================
// ELIMINAR COMPRA
// =========================
async function removeCompra(id) {
  if (!confirm("¿Eliminar esta cuenta?")) return;

  try {
    await deleteCuentaPropia(id);

    // 🔥 refresh instantáneo
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
