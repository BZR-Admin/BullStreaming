
// =========================
// ESTADO LOCAL
// =========================
let ventasList = [];
let clientesList = [];
let cuentasList = [];


// =========================
// CARGAR VENTAS + RELACIONES
// =========================
async function loadVentas() {
  try {
    const [dataVentas, dataClientes, dataCuentas] = await Promise.all([
      getVentas(),
      getClientes(),
      getCuentasPropias()
    ]);

    ventasList = dataVentas;
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

  tbody.innerHTML = ventasList.map(v => {

    const cliente = clientesList.find(c => c.id_cliente === v.id_cliente);
    const cuenta = cuentasList.find(c => c.id_cuenta === v.id_cuenta);

    return `
      <tr>
        <td data-label="Cliente">${cliente ? cliente.nombre : "-"}</td>
        <td data-label="Cuenta">${cuenta ? cuenta.correo_cuenta : "-"}</td>
        <td data-label="Tipo">${v.tipo_venta}</td>
        <td data-label="Precio">${v.precio || 0}</td>
        <td data-label="Fecha">${v.fecha_registro || "-"}</td>
        <td data-label="Vence">${v.fecha_vencimiento || "-"}</td>
        <td data-label="Estado">${v.estado}</td>

        <td data-label="Acciones">
          <div class="acciones">

            <button class="btn-editar"
              onclick="openEditVenta('${v.id_venta}')">
              Editar
            </button>

            <button class="btn-eliminar"
              onclick="removeVenta('${v.id_venta}')">
              Eliminar
            </button>

          </div>
        </td>
      </tr>
    `;
  }).join("");
}


// =========================
// CREAR VENTA
// =========================
async function saveVenta() {
  const id_cliente = document.getElementById("venta_id_cliente").value;
  const id_cuenta = document.getElementById("venta_id_cuenta").value;
  const tipo_venta = document.getElementById("venta_tipo").value;
  const precio = parseFloat(document.getElementById("venta_precio").value);

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

    // 🔥 marcar cuenta como vendida
    await updateCuentaPropia(id_cuenta, {
      estado: "Vendida"
    });

    await loadVentas();

    document.getElementById("venta_precio").value = "";

  } catch (error) {
    console.error("Error creando venta:", error);
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
