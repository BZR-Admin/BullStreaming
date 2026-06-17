
// =========================
// ESTADO LOCAL
// =========================
let ventas = [];
let clientesListLocal = [];
let cuentasListLocal = [];


// =========================
// CARGAR DATOS
// =========================
async function loadVentas() {
  try {
    const [dataVentas, dataClientes, dataCuentas] = await Promise.all([
      getVentas(),
      getClientes(),
      getCuentasPropias()
    ]);

    ventas = dataVentas;
    clientesList = dataClientes;
    cuentasList = dataCuentas;

    renderVentas();

  } catch (error) {
    console.error("Error cargando ventas:", error);
  }
}


// =========================
// RENDER VENTAS
// =========================
function renderVentas() {
  const tbody = document.getElementById("tablaVentas");

  if (!tbody) return;

  tbody.innerHTML = ventas.map(v => {

    const cliente = clientesList.find(c => c.id_cliente === v.id_cliente);
    const cuenta = cuentasList.find(c => c.id_cuenta === v.id_cuenta);

    return `
      <tr>
        <td>${v.id_venta}</td>
        <td>${cliente ? cliente.nombre : "Sin cliente"}</td>
        <td>${cuenta ? cuenta.correo_cuenta : "-"}</td>
        <td>${v.tipo_venta}</td>
        <td>${v.precio || 0}</td>
        <td>${v.fecha_registro || ""}</td>
        <td>${v.fecha_vencimiento || ""}</td>
        <td>${v.estado}</td>

        <td>
          <button onclick="openEditVenta('${v.id_venta}')">Editar</button>
          <button onclick="removeVenta('${v.id_venta}')">Eliminar</button>
        </td>
      </tr>
    `;
  }).join("");
}


// =========================
// CREAR VENTA
// =========================
async function saveVenta() {
  const id_cliente = document.getElementById("id_cliente").value;
  const id_cuenta = document.getElementById("id_cuenta").value;
  const tipo_venta = document.getElementById("tipo_venta").value;
  const precio = parseFloat(document.getElementById("precio").value);

  if (!id_cliente || !id_cuenta) {
    alert("Completa cliente y cuenta");
    return;
  }

  const venta = {
    id_venta: crypto.randomUUID(),
    id_cliente,
    id_cuenta,
    tipo_venta,
    precio,
    fecha_registro: new Date().toISOString().split("T")[0],
    estado: "Activa"
  };

  try {
    await addVenta(venta);

    // 🔥 IMPORTANTE: marcar cuenta como asignada/vendida
    await updateCuentaPropia(id_cuenta, {
      estado: "Vendida"
    });

    await loadVentas();

    document.getElementById("precio").value = "";

  } catch (error) {
    console.error("Error creando venta:", error);
  }
}


// =========================
// EDITAR VENTA
// =========================
function openEditVenta(id) {
  const venta = ventas.find(v => v.id_venta === id);
  if (!venta) return;

  document.getElementById("edit_id_venta").value = venta.id_venta;
  document.getElementById("edit_precio").value = venta.precio;
  document.getElementById("edit_estado").value = venta.estado;
  document.getElementById("modalVenta").style.display = "block";
}


// =========================
// ACTUALIZAR VENTA
// =========================
async function updateVentaUI() {
  const id = document.getElementById("edit_id_venta").value;
  const precio = parseFloat(document.getElementById("edit_precio").value);
  const estado = document.getElementById("edit_estado").value;

  try {
    await updateVenta(id, {
      precio,
      estado
    });

    document.getElementById("modalVenta").style.display = "none";

    await loadVentas();

  } catch (error) {
    console.error("Error actualizando venta:", error);
  }
}


// =========================
// ELIMINAR VENTA
// =========================
async function removeVenta(id) {
  if (!confirm("¿Eliminar venta?")) return;

  try {
    await deleteVenta(id);

    await loadVentas();

  } catch (error) {
    console.error("Error eliminando venta:", error);
  }
}


// =========================
// INICIALIZACIÓN
// =========================
document.addEventListener("DOMContentLoaded", () => {
  loadVentas();
});
