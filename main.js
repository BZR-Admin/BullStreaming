function configurarMenuMovil() {
  const btnMenu = document.getElementById("btnMenuMovil");
  const menu = document.getElementById("menuPrincipal");

  if (!btnMenu || !menu) return;

  btnMenu.addEventListener("click", () => {
    menu.classList.toggle("menu-abierto");
  });

  document.querySelectorAll("[data-pantalla]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        menu.classList.remove("menu-abierto");
      }
    });
  });
}

/* =========================
   ESTADO GLOBAL ÚNICO
   (antes existían DB y CACHE por separado,
    siempre llenados con los mismos datos;
    ahora hay una sola fuente de verdad)
========================= */

let DB = {
  configCuentaPropia: [],
  configVentaIndependiente: [],
  clientes: [],
  proveedores: [],
  cuentasPropias: [],
  ventas: [],
  cuentasDisponibles: []
};

// Alias de compatibilidad: código viejo en otros archivos que todavía
// lea/escriba CACHE.algo sigue funcionando porque apunta al mismo objeto.
let CACHE = DB;

/* =========================
   INICIO
========================= */

document.addEventListener("DOMContentLoaded", async () => {
  configurarMenuMovil();
  configurarNavegacion();

  await cargarDatos();

  mostrarPantalla("inicio");
});

/* =========================
   CARGA INICIAL (solo al entrar o si se fuerza)
========================= */

async function cargarDatos() {
  try {
    mostrarLoading();

    const data = await getInitialData();
    sincronizarData(data);

    renderTodo();

  } catch (error) {
    console.error("Error cargando datos:", error);
  } finally {
    ocultarLoading();
  }
}

/* =========================
   SINCRONIZACIÓN COMPLETA
   Solo se usa en la carga inicial o cuando
   explícitamente se quiera forzar un refetch total
   (por ejemplo, botón "Actualizar todo").
========================= */

function sincronizarData(data) {
  DB = data;
  CACHE = DB;
}

/* =========================
   MUTACIONES LOCALES DE ESTADO
   Estas funciones actualizan DB en memoria
   tras un alta/edición/borrado, sin volver
   a pedir getInitialData() completo al servidor.

   Cada módulo (clientes.js, ventas.js, etc.)
   debe llamar a la función correspondiente
   después de que el backend confirme la operación.
========================= */

/**
 * Inserta o reemplaza un registro dentro de DB[coleccion],
 * comparando por el campo idField.
 */
function upsertEnColeccion(coleccion, idField, registro) {
  if (!Array.isArray(DB[coleccion])) DB[coleccion] = [];

  const idx = DB[coleccion].findIndex(
    item => String(item[idField]) === String(registro[idField])
  );

  if (idx >= 0) {
    DB[coleccion][idx] = { ...DB[coleccion][idx], ...registro };
  } else {
    DB[coleccion].push(registro);
  }
}

/**
 * Elimina un registro de DB[coleccion] por su ID.
 */
function eliminarDeColeccion(coleccion, idField, idValor) {
  if (!Array.isArray(DB[coleccion])) return;

  DB[coleccion] = DB[coleccion].filter(
    item => String(item[idField]) !== String(idValor)
  );
}

/**
 * Recalcula cuentasDisponibles en el cliente, igual que
 * getCuentasDisponibles() en el backend, para no tener
 * que pedirlo de nuevo cada vez que cambia una venta VCP
 * o una cuenta propia.
 */
function recalcularCuentasDisponiblesLocal() {
  const maxPorServicio = {};
  (DB.configCuentaPropia || []).forEach(c => {
    maxPorServicio[c.ID_Servicio] = Number(c.Cantidad) || 0;
  });

  const usosPorCorreo = {};
  (DB.ventas || []).forEach(v => {
    if (v.Tipo_Venta === "VCP" && v.Estado === "Activa") {
      const key = v["Usuario/Correo"];
      usosPorCorreo[key] = (usosPorCorreo[key] || 0) + 1;
    }
  });

  DB.cuentasDisponibles = (DB.cuentasPropias || []).map(c => {
    const max = maxPorServicio[c.ID_Servicio] || 0;
    const usados = usosPorCorreo[c.Correo_Cuenta] || 0;

    return {
      ID_Cuenta: c.ID_Cuenta,
      ID_Servicio: c.ID_Servicio,
      Correo_Cuenta: c.Correo_Cuenta,
      Usados: usados,
      Maximo: max,
      Disponibles: max - usados,
      Estado: c.Estado
    };
  });
}

/* =========================
   API PÚBLICA DE ACTUALIZACIÓN LOCAL
   Estas son las funciones que deben llamar
   clientes.js / proveedores.js / compras.js / ventas.js
   en lugar de afterXChange() + getInitialData().
========================= */

function aplicarClienteLocal(cliente) {
  upsertEnColeccion("clientes", "ID_Cliente", cliente);
  renderClientes();
}

function quitarClienteLocal(ID_Cliente) {
  eliminarDeColeccion("clientes", "ID_Cliente", ID_Cliente);
  renderClientes();
}

function aplicarProveedorLocal(proveedor) {
  upsertEnColeccion("proveedores", "ID_Proveedor", proveedor);
  renderProveedores();
}

function quitarProveedorLocal(ID_Proveedor) {
  eliminarDeColeccion("proveedores", "ID_Proveedor", ID_Proveedor);
  renderProveedores();
}

function aplicarCuentaPropiaLocal(cuenta) {
  upsertEnColeccion("cuentasPropias", "ID_Cuenta", cuenta);
  recalcularCuentasDisponiblesLocal();
  renderCompras();
  renderCuentasDisponibles();
}

function quitarCuentaPropiaLocal(ID_Cuenta) {
  eliminarDeColeccion("cuentasPropias", "ID_Cuenta", ID_Cuenta);
  recalcularCuentasDisponiblesLocal();
  renderCompras();
  renderCuentasDisponibles();
}

function aplicarVentaLocal(venta) {
  upsertEnColeccion("ventas", "ID_Venta", venta);
  recalcularCuentasDisponiblesLocal();
  renderVentas();
  renderCuentasDisponibles();
}

function quitarVentaLocal(ID_Venta) {
  eliminarDeColeccion("ventas", "ID_Venta", ID_Venta);
  recalcularCuentasDisponiblesLocal();
  renderVentas();
  renderCuentasDisponibles();
}

/* =========================
   REFRESH MANUAL (por módulo o total)
   Solo golpea el servidor cuando el usuario
   lo pide explícitamente, ya no después de cada
   alta/edición/borrado.
========================= */

async function refrescarModulo(modulo) {
  try {
    mostrarLoading();

    const data = await getInitialData();
    sincronizarData(data);

    const acciones = {
      clientes: renderClientes,
      proveedores: renderProveedores,
      ventas: () => {
        renderVentas();
        renderCuentasDisponibles();
      },
      compras: renderCompras,
      cuentas: renderCuentasDisponibles,
      dashboard: renderDashboard
    };

    if (acciones[modulo]) {
      acciones[modulo]();
    } else {
      renderTodo();
    }

  } catch (error) {
    console.error("Error refrescando módulo:", error);
  } finally {
    ocultarLoading();
  }
}

/* =========================
   RENDER GLOBAL
========================= */

function renderTodo() {
  renderClientes();
  renderProveedores();
  renderVentas();
  renderCompras();
  renderCuentasDisponibles();
  renderDashboard();
}

/* =========================
   NAVEGACIÓN
========================= */

function configurarNavegacion() {
  document.querySelectorAll("[data-pantalla]").forEach(btn => {
    btn.addEventListener("click", () => {
      mostrarPantalla(btn.dataset.pantalla);
    });
  });
}

function mostrarPantalla(nombre) {
  document.querySelectorAll(".pantalla").forEach(p => {
    p.classList.remove("activa");
  });

  const pantalla = document.getElementById("pantalla-" + nombre);
  if (pantalla) pantalla.classList.add("activa");

  document.querySelectorAll("[data-pantalla]").forEach(btn => {
    btn.classList.toggle("activo", btn.dataset.pantalla === nombre);
  });
}

/* =========================
   UTILIDADES
========================= */

function formatearFecha(fecha) {
  if (!fecha) return "";

  const d = new Date(fecha);
  if (isNaN(d)) return fecha;

  return d.toISOString().split("T")[0];
}

function limpiarFormulario(id) {
  document.getElementById(id)?.reset();
}

function confirmarEliminacion(msg = "¿Seguro que deseas eliminar este registro?") {
  return confirm(msg);
}

/* =========================
   SEMÁFORO
========================= */

function diasParaVencer(fecha) {
  if (!fecha) return 999;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const venc = new Date(fecha);
  venc.setHours(0, 0, 0, 0);

  return Math.ceil((venc - hoy) / 86400000);
}

function claseSemaforo(fecha) {
  const d = diasParaVencer(fecha);

  if (d <= 0) return "fila-roja";
  if (d <= 3) return "fila-amarilla";
  return "fila-verde";
}

/* =========================
   WHATSAPP
========================= */

function limpiarTelefono(num) {
  return String(num || "").replace(/\D/g, "");
}

function abrirWhatsapp(numero, mensaje) {
  const tel = limpiarTelefono(numero);

  if (!tel) {
    alert("No hay número registrado");
    return;
  }

  window.open(
    `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`,
    "_blank"
  );
}

/**
 * Refresco total manual. Antes se llamaba después de
 * CADA alta/edición/borrado (muy costoso). Ahora solo
 * se debe usar para un botón explícito de "Actualizar todo"
 * o como red de seguridad si algo quedó inconsistente.
 */
async function refrescarTodo() {
  await cargarDatos();
}

window.refrescarTodo = refrescarTodo;
window.refrescarModulo = refrescarModulo;

/* =========================
   LOADING
========================= */

function mostrarLoading() {
  document.getElementById("loadingOverlay")?.classList.add("activo");
}

function ocultarLoading() {
  document.getElementById("loadingOverlay")?.classList.remove("activo");
}
