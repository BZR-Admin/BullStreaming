
// =========================
// ESTADO LOCAL (AISLADO)
// =========================
let cuentasList = [];
let clientesList = [];


// =========================
// CARGAR CUENTAS + CLIENTES
// =========================
async function loadCuentas() {
  try {
    const [dataCuentas, dataClientes] = await Promise.all([
      getCuentasPropias(),
      getClientes()
    ]);

    cuentasList = dataCuentas;
    clientesList = dataClientes;

    renderCuentas();

  } catch (error) {
    console.error("Error cargando cuentas:", error);
  }
}


// =========================
// RENDER CUENTAS
// =========================
function renderCuentas() {
  const container = document.getElementById("contenedorCuentas");

  if (!container) return;

  container.innerHTML = cuentasList.map(c => {

    const clienteAsignado = clientesList.find(
      cl => cl.id_cliente === c.id_cliente
    );

    return `
      <div class="card-cuenta">

        <h3>${c.id_servicio}</h3>

        <p><b>Correo:</b> ${c.correo_cuenta}</p>
        <p><b>Proveedor:</b> ${c.proveedor || "-"}</p>
        <p><b>Estado:</b> ${c.estado}</p>
        <p><b>Vence:</b> ${c.fecha_vencimiento || "-"}</p>

        <p><b>Cliente:</b> ${clienteAsignado ? clienteAsignado.nombre : "Disponible"}</p>

        <div class="acciones">

          <button onclick="abrirAsignarCliente('${c.id_cuenta}')">
            Asignar
          </button>

          <button onclick="openEditCuenta('${c.id_cuenta}')">
            Editar
          </button>

          <button onclick="removeCuenta('${c.id_cuenta}')">
            Eliminar
          </button>

        </div>

      </div>
    `;
  }).join("");
}


// =========================
// CREAR CUENTA
// =========================
async function saveCuenta() {
  const id_servicio = document.getElementById("cuenta_id_servicio").value;
  const correo_cuenta = document.getElementById("cuenta_correo").value;
  const proveedor = document.getElementById("cuenta_proveedor").value;
  const fecha_vencimiento = document.getElementById("cuenta_fecha_vencimiento").value;

  if (!id_servicio || !correo_cuenta) {
    alert("Completa campos obligatorios");
    return;
  }

  const cuenta = {
    id_cuenta: crypto.randomUUID(),
    id_servicio,
    correo_cuenta,
    proveedor,
    fecha_compra: new Date().toISOString().split("T")[0],
    fecha_vencimiento,
    estado: "Activa",
    id_cliente: null
  };

  try {
    await addCuentaPropia(cuenta);
    await loadCuentas();

    document.getElementById("cuenta_correo").value = "";

  } catch (error) {
    console.error("Error creando cuenta:", error);
  }
}


// =========================
// ASIGNAR CLIENTE
// =========================
function abrirAsignarCliente(idCuenta) {
  const select = document.getElementById("selectClienteAsignar");

  if (!select) return;

  select.innerHTML = clientesList.map(c => `
    <option value="${c.id_cliente}">
      ${c.nombre}
    </option>
  `).join("");

  document.getElementById("btnConfirmarAsignar").onclick = async () => {
    const id_cliente = select.value;

    try {
      await updateCuentaPropia(idCuenta, {
        id_cliente,
        estado: "Asignada"
      });

      document.getElementById("modalAsignar").style.display = "none";

      await loadCuentas();

    } catch (error) {
      console.error("Error asignando cliente:", error);
    }
  };

  document.getElementById("modalAsignar").style.display = "block";
}


// =========================
// EDITAR CUENTA
// =========================
function openEditCuenta(id) {
  const cuenta = cuentasList.find(c => c.id_cuenta === id);
  if (!cuenta) return;

  document.getElementById("edit_id_cuenta").value = cuenta.id_cuenta;
  document.getElementById("edit_correo_cuenta").value = cuenta.correo_cuenta;
  document.getElementById("edit_estado").value = cuenta.estado;
  document.getElementById("edit_fecha_vencimiento").value = cuenta.fecha_vencimiento || "";

  document.getElementById("modalCuenta").style.display = "block";
}


// =========================
// ACTUALIZAR CUENTA
// =========================
async function updateCuentaUI() {
  const id = document.getElementById("edit_id_cuenta").value;
  const correo = document.getElementById("edit_correo_cuenta").value;
  const estado = document.getElementById("edit_estado").value;
  const vencimiento = document.getElementById("edit_fecha_vencimiento").value;

  try {
    await updateCuentaPropia(id, {
      correo_cuenta: correo,
      estado,
      fecha_vencimiento: vencimiento
    });

    document.getElementById("modalCuenta").style.display = "none";

    await loadCuentas();

  } catch (error) {
    console.error("Error actualizando cuenta:", error);
  }
}


// =========================
// ELIMINAR CUENTA
// =========================
async function removeCuenta(id) {
  if (!confirm("¿Eliminar cuenta?")) return;

  try {
    await deleteCuentaPropia(id);
    await loadCuentas();

  } catch (error) {
    console.error("Error eliminando cuenta:", error);
  }
}


// =========================
// INICIALIZACIÓN
// =========================
document.addEventListener("DOMContentLoaded", () => {
  loadCuentas();
});
