let DB = {
  configCuentaPropia: [],
  configVentaIndependiente: [],
  clientes: [],
  proveedores: [],
  cuentasPropias: [],
  ventas: [],
  cuentasDisponibles: []
};

let CACHE = {
  clientes: [],
  proveedores: [],
  ventas: [],
  cuentasPropias: [],
  cuentasDisponibles: [],
  configVentaIndependiente: [],
  configCuentaPropia: []
};

document.addEventListener("DOMContentLoaded", async () => {
  configurarMenuMovil();
  configurarNavegacion();
  await cargarDatos();
  mostrarPantalla("inicio");
});

/* =========================
   CARGA PRINCIPAL
========================= */

async function cargarDatos() {
  try {
    const data = await getInitialData();

    // 🔥 IMPORTANTE: sincronizar ambos estados
    syncData(data);

    renderClientes();
    renderProveedores();
    renderVentas();
    renderCompras();
    renderCuentasDisponibles();
    renderDashboard();

  } catch (e) {
    console.error("Error cargando datos:", e);
  }
}

/* =========================
   SINCRONIZACIÓN GLOBAL
========================= */

function syncData(data) {
  Object.assign(DB, data);
  Object.assign(CACHE, data);
}

/* =========================
   REFRESCO INTELIGENTE (NO FULL)
========================= */

async function refrescarModulo(modulo) {
  try {
    const data = await getInitialData();
    syncData(data);

    switch (modulo) {
      case "clientes":
        renderClientes();
        break;

      case "proveedores":
        renderProveedores();
        break;

      case "ventas":
        renderVentas();
        renderCuentasDisponibles();
        break;

      case "compras":
        renderCompras();
        renderCuentasDisponibles();
        break;

      case "dashboard":
        renderDashboard();
        break;

      default:
        renderClientes();
        renderProveedores();
        renderVentas();
        renderCompras();
        renderCuentasDisponibles();
        renderDashboard();
    }

  } catch (error) {
    console.error("Error refrescando módulo:", error);
  }
}

/* =========================
   NAVEGACIÓN
========================= */

function configurarNavegacion() {
  document.querySelectorAll("[data-pantalla]").forEach(boton => {
    boton.addEventListener("click", () => {
      mostrarPantalla(boton.dataset.pantalla);
    });
  });
}

function mostrarPantalla(nombrePantalla) {
  document.querySelectorAll(".pantalla").forEach(section => {
    section.classList.remove("activa");
  });

  const pantalla = document.getElementById("pantalla-" + nombrePantalla);

  if (pantalla) pantalla.classList.add("activa");

  document.querySelectorAll("[data-pantalla]").forEach(btn => {
    btn.classList.toggle("activo", btn.dataset.pantalla === nombrePantalla);
  });
}

/* =========================
   UTILIDADES
========================= */

function formatearFecha(fecha) {
  if (!fecha) return "";
  const date = new Date(fecha);
  if (isNaN(date)) return fecha;
  return date.toISOString().split("T")[0];
}

function limpiarFormulario(formId) {
  document.getElementById(formId)?.reset();
}

function confirmarEliminacion(msg = "¿Seguro que deseas eliminar este registro?") {
  return confirm(msg);
}

/* =========================
   SEMÁFORO
========================= */

function diasParaVencer(fechaVencimiento) {
  if (!fechaVencimiento) return 999;

  const hoy = new Date();
  hoy.setHours(0,0,0,0);

  const venc = new Date(fechaVencimiento);
  venc.setHours(0,0,0,0);

  return Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
}

function claseSemaforo(fechaVencimiento) {
  const d = diasParaVencer(fechaVencimiento);

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

  if (!tel) return alert("No hay número registrado");

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
