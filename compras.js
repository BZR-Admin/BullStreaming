import { supabase } from "./supabase.js";

/* =========================
   ESTADO GLOBAL
========================= */
let servicios = [];
let proveedores = [];

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([loadServicios(), loadProveedores()]);
  setupPlatformas();
  setupEvents();
});

/* =========================
   LOAD DATA
========================= */
async function loadServicios() {
  try {
    const { data, error } = await supabase
      .from("conf_venta_cuenta_propia")
      .select("*");

    if (error) throw error;
    servicios = data || [];
  } catch (err) {
    console.error("Error cargando servicios:", err);
    servicios = [];
    alert("No se pudieron cargar los servicios. Intenta recargar la página.");
  }
}

async function loadProveedores() {
  try {
    const { data, error } = await supabase.from("proveedores").select("*");

    if (error) throw error;
    proveedores = data || [];
  } catch (err) {
    console.error("Error cargando proveedores:", err);
    proveedores = [];
    alert("No se pudieron cargar los proveedores. Intenta recargar la página.");
  }
}

/* =========================
   STEP 1: PLATAFORMAS
========================= */
function setupPlatformas() {
  const select = document.getElementById("plataforma");
  select.innerHTML = `<option value="">Selecciona plataforma</option>`;

  const plataformas = [...new Set(servicios.map(s => s.plataforma))].sort();

  plataformas.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    select.appendChild(opt);
  });

  // Resetear los siguientes pasos
  resetSelect("servicio", "Selecciona servicio");
  resetSelect("proveedor", "Selecciona proveedor");
}

/* =========================
   STEP 2: SERVICIOS (filtrado por plataforma)
========================= */
function setupServicios(plataforma) {
  const select = document.getElementById("servicio");
  select.innerHTML = `<option value="">Selecciona servicio</option>`;
  select.disabled = !plataforma;

  // Siempre reseteamos proveedor al cambiar/borrar plataforma,
  // antes de salir, para no dejar el select en un estado inconsistente.
  resetSelect("proveedor", "Selecciona proveedor");

  if (!plataforma) return;

  const filtrados = servicios.filter(s => s.plataforma === plataforma);

  filtrados.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id_servicio;
    opt.textContent = s.servicio;
    select.appendChild(opt);
  });

  // Si solo hay un servicio, seleccionarlo automáticamente
  // y disparar el flujo de proveedores como si el usuario lo hubiera elegido.
  if (filtrados.length === 1) {
    select.value = filtrados[0].id_servicio;
    setupProveedores();
  }
}

/* =========================
   STEP 3: PROVEEDORES
========================= */
function setupProveedores() {
  const select = document.getElementById("proveedor");
  select.innerHTML = `<option value="">Selecciona proveedor</option>`;
  select.disabled = false;

  const ordenados = [...proveedores].sort((a, b) =>
    a.proveedor.localeCompare(b.proveedor, "es", { sensitivity: "base" })
  );

  ordenados.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.proveedor; // guardamos el nombre, igual que en cuentas_propias
    opt.textContent = p.proveedor;
    opt.dataset.whatsapp = p.whatsapp || "";
    select.appendChild(opt);
  });
}

/* =========================
   HELPER
========================= */
function resetSelect(id, placeholder) {
  const select = document.getElementById(id);
  select.innerHTML = `<option value="">${placeholder}</option>`;
  select.disabled = true;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* =========================
   EVENTS
========================= */
function setupEvents() {
  document.getElementById("plataforma").addEventListener("change", (e) => {
    setupServicios(e.target.value);
  });

  document.getElementById("servicio").addEventListener("change", (e) => {
    if (e.target.value) {
      setupProveedores();
    } else {
      resetSelect("proveedor", "Selecciona proveedor");
    }
  });
}

/* =========================
   GUARDAR COMPRA
========================= */
window.saveCompra = async () => {
  const id_servicio = document.getElementById("servicio").value;
  const proveedorSelect = document.getElementById("proveedor");
  const proveedor = proveedorSelect.value;
  const whatsapp = proveedorSelect.selectedOptions[0]?.dataset.whatsapp || "";
  const correo = document.getElementById("correo").value.trim();
  const vencimiento = document.getElementById("vencimiento").value;

  if (!id_servicio || !proveedor || !correo || !vencimiento) {
    return alert("Por favor completa todos los campos.");
  }

  if (!isValidEmail(correo)) {
    return alert("Por favor ingresa un correo válido.");
  }

  const compra = {
    id_cuenta: crypto.randomUUID(),
    id_servicio,
    proveedor,
    whatsapp,
    correo_cuenta: correo,
    fecha_compra: new Date().toISOString().split("T")[0],
    fecha_vencimiento: vencimiento,
    estado: "Activa"
  };

  try {
    const { error } = await supabase.from("cuentas_propias").insert([compra]);
    if (error) throw error;

    alert("¡Compra registrada correctamente!");
    limpiar();
  } catch (err) {
    console.error("Error al guardar la compra:", err);
    alert("Error al guardar la compra. Intenta de nuevo.");
  }
};

/* =========================
   LIMPIAR
========================= */
function limpiar() {
  document.getElementById("plataforma").value = "";
  setupServicios("");
  document.getElementById("correo").value = "";
  document.getElementById("vencimiento").value = "";
}
