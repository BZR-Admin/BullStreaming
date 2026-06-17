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

let DB = {};
let CACHE = {};

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
   CARGA INICIAL
========================= */

async function cargarDatos() {
  try {
    const data = await getInitialData();

    sincronizarData(data);

    renderTodo();

  } catch (error) {
    console.error("Error cargando datos:", error);
  }
}

/* =========================
   SINCRONIZACIÓN ÚNICA
========================= */

function sincronizarData(data) {
  DB = structuredClone(data);
  CACHE = structuredClone(data);
}

/* =========================
   REFRESH INTELIGENTE
========================= */

async function refrescarModulo(modulo) {
  try {
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

/* =========================
   LOADING
========================= */

function mostrarLoading() {
  document.getElementById("loadingOverlay")?.classList.add("activo");
}

function ocultarLoading() {
  document.getElementById("loadingOverlay")?.classList.remove("activo");
}
