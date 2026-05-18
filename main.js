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
  configurarNavegacion();
  await cargarDatos();
  mostrarPantalla("inicio");
});

async function cargarDatos() {
  try {
    DB = await getInitialData();

    if (typeof renderClientes === "function") renderClientes();
    if (typeof renderProveedores === "function") renderProveedores();
    if (typeof renderVentas === "function") renderVentas();
    if (typeof renderCompras === "function") renderCompras();
    if (typeof renderCuentasDisponibles === "function") renderCuentasDisponibles();
    if (typeof renderDashboard === "function") renderDashboard();

  } catch (error) {
    console.error("No se pudieron cargar los datos:", error);
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
