let DB = {
  configCuentaPropia: [],
  configVentaIndependiente: [],
  clientes: [],
  proveedores: [],
  cuentasPropias: [],
  ventas: [],
  cuentasDisponibles: []
};

document.addEventListener("DOMContentLoaded", async () => {
  configurarMenuMovil();
  configurarNavegacion();
  await cargarDatos();
  mostrarPantalla("inicio");
});

async function cargarDatos() {
  try {
    DB = await getInitialData();

    await safeRender("Clientes", renderClientes);
    await safeRender("Proveedores", renderProveedores);
    await safeRender("Ventas", renderVentas);
    await safeRender("Compras", renderCompras);
    await safeRender("Cuentas disponibles", renderCuentasDisponibles);
    await safeRender("Dashboard", renderDashboard);

  } catch (error) {
    console.error("No se pudieron cargar los datos:", error);
  }
}

async function safeRender(nombre, fn) {
  try {
    if (typeof fn === "function") {
      await fn();
    }
  } catch (error) {
    console.error("Error renderizando " + nombre + ":", error);
  }
}

function configurarNavegacion() {
  document.querySelectorAll("[data-pantalla]").forEach(boton => {
    boton.addEventListener("click", () => {
      const pantalla = boton.dataset.pantalla;
      mostrarPantalla(pantalla);
    });
  });
}

function mostrarPantalla(nombrePantalla) {
  document.querySelectorAll(".pantalla").forEach(section => {
    section.classList.remove("activa");
  });

  const pantalla = document.getElementById("pantalla-" + nombrePantalla);

  if (pantalla) {
    pantalla.classList.add("activa");
  }

  document.querySelectorAll("[data-pantalla]").forEach(boton => {
    boton.classList.remove("activo");

    if (boton.dataset.pantalla === nombrePantalla) {
      boton.classList.add("activo");
    }
  });
}

function formatearFecha(fecha) {
  if (!fecha) return "";

  const date = new Date(fecha);

  if (isNaN(date)) return fecha;

  return date.toISOString().split("T")[0];
}

function limpiarFormulario(formId) {
  const form = document.getElementById(formId);
  if (form) form.reset();
}

function confirmarEliminacion(mensaje = "¿Seguro que deseas eliminar este registro?") {
  return confirm(mensaje);
}

async function refrescarTodo() {
  await cargarDatos();
}

function diasParaVencer(fechaVencimiento) {
  if (!fechaVencimiento) return 999;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const vencimiento = new Date(fechaVencimiento);
  vencimiento.setHours(0, 0, 0, 0);

  const diferencia = vencimiento - hoy;
  return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
}

function claseSemaforo(fechaVencimiento) {
  const dias = diasParaVencer(fechaVencimiento);

  if (dias <= 0) return "fila-roja";
  if (dias <= 3) return "fila-amarilla";

  return "fila-verde";
}

function limpiarTelefono(numero) {
  return String(numero || "").replace(/\D/g, "");
}

function abrirWhatsapp(numero, mensaje) {
  const telefono = limpiarTelefono(numero);

  if (!telefono) {
    alert("No hay número de WhatsApp registrado.");
    return;
  }

  const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}

function configurarMenuMovil() {
  const btnMenu = document.getElementById("btnMenuMovil");
  const menu = document.getElementById("menuPrincipal");

  if (!btnMenu || !menu) return;

  btnMenu.addEventListener("click", () => {
    menu.classList.toggle("menu-abierto");
  });

  document.querySelectorAll("[data-pantalla]").forEach(boton => {
    boton.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        menu.classList.remove("menu-abierto");
      }
    });
  });
}

function mostrarLoading() {
  document.getElementById("loadingOverlay")
    ?.classList.add("activo");
}

function ocultarLoading() {
  document.getElementById("loadingOverlay")
    ?.classList.remove("activo");
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escaparAttr(valor) {
  return escaparHtml(valor);
}
