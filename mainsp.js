// =========================
// MENÚ MÓVIL
// =========================
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


// =========================
// SAFE LOADER (DEBUG REAL)
// =========================
async function safeLoad(name, fn) {
  try {
    console.log(`📦 Cargando ${name}...`);
    await fn();
    console.log(`✅ OK ${name}`);
  } catch (e) {
    console.error(`❌ ERROR en ${name}:`, e);
  }
}


// =========================
// INICIO
// =========================
document.addEventListener("DOMContentLoaded", async () => {

  configurarMenuMovil();
  configurarNavegacion();

  // 🔥 CARGA POR MÓDULOS (SUPABASE REAL)
  if (typeof loadClientes === "function") {
    await safeLoad("clientes", loadClientes);
  }

  if (typeof loadProveedores === "function") {
    await safeLoad("proveedores", loadProveedores);
  }

  // 🔥 TABLA REAL: cuentas_propias
  if (typeof loadCompras === "function") {
    await safeLoad("cuentas_propias (compras)", loadCompras);
  }

  if (typeof loadCuentas === "function") {
    await safeLoad("cuentas (asignaciones)", loadCuentas);
  }

  if (typeof loadVentas === "function") {
    await safeLoad("ventas", loadVentas);
  }

  mostrarPantalla("inicio");
});


// =========================
// NAVEGACIÓN
// =========================
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

  const pantalla = document.getElementById(nombre);
  if (pantalla) pantalla.classList.add("activa");

  document.querySelectorAll("[data-pantalla]").forEach(btn => {
    btn.classList.toggle("activo", btn.dataset.pantalla === nombre);
  });
}


// =========================
// UTILIDADES FECHAS
// =========================
function formatearFecha(fecha) {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (isNaN(d)) return fecha;
  return d.toISOString().split("T")[0];
}


// =========================
// CONTROL DE VENCIMIENTOS
// =========================
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


// =========================
// WHATSAPP
// =========================
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


// =========================
// REFRESH GLOBAL
// =========================
async function refrescarTodo() {
  if (typeof loadClientes === "function") await loadClientes();
  if (typeof loadProveedores === "function") await loadProveedores();
  if (typeof loadCompras === "function") await loadCompras();
  if (typeof loadCuentas === "function") await loadCuentas();
  if (typeof loadVentas === "function") await loadVentas();
}

window.refrescarTodo = refrescarTodo;
