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
  const { data } = await supabase.from("conf_venta_cuenta_propia").select("*");
  servicios = data || [];
}

async function loadProveedores() {
  const { data } = await supabase.from("proveedores").select("*");
  proveedores = data || [];
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

  if (!plataforma) return;

  const filtrados = servicios.filter(s => s.plataforma === plataforma);

  filtrados.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id_servicio;
    opt.textContent = s.servicio;
    select.appendChild(opt);
  });

  // Si solo hay un servicio, seleccionarlo automáticamente
  if (filtrados.length === 1) {
    select.value = filtrados[0].id_servicio;
  }

  resetSelect("proveedor", "Selecciona proveedor");
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

  const { error } = await supabase.from("cuentas_propias").insert([compra]);

  if (error) {
    console.error(error);
    return alert("Error al guardar la compra.");
  }

  alert("¡Compra registrada correctamente!");
  limpiar();
};

/* =========================
   LIMPIAR
========================= */
function limpiar() {
  document.getElementById("plataforma").value = "";
  setupServicios("");
  resetSelect("proveedor", "Selecciona proveedor");
  document.getElementById("correo").value = "";
  document.getElementById("vencimiento").value = "";
}
