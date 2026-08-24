import { requireAuth } from "./auth.js";
await requireAuth();

import { supabase } from "./supabase.js";

/* =========================
   ESTADO GLOBAL
========================= */
let servicios = [];
let proveedores = [];
let boots = [];

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([loadServicios(), loadProveedores(), loadBoots()]);
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

async function loadBoots() {
  const { data } = await supabase.from("proveedor_boots").select("*");
  boots = data || [];
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

  resetSelect("servicio", "Selecciona servicio");
  resetSelect("proveedor", "Selecciona proveedor");
}

/* =========================
   STEP 2: SERVICIOS
========================= */
function setupServicios(plataforma) {
  const select = document.getElementById("servicio");
  select.innerHTML = `<option value="">Selecciona servicio</option>`;
  select.disabled = !plataforma;

  resetSelect("proveedor", "Selecciona proveedor");

  if (!plataforma) return;

  const filtrados = servicios.filter(s => s.plataforma === plataforma);
  filtrados.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id_servicio;
    opt.textContent = s.servicio;
    select.appendChild(opt);
  });

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
    opt.value = p.proveedor;
    opt.textContent = p.proveedor;
    opt.dataset.whatsapp = p.whatsapp || "";
    select.appendChild(opt);
  });
}

/* =========================
   STEP 4: BOOTS (independiente, siempre visible)
========================= */
function setupBoots() {
  const select = document.getElementById("boot");
  select.innerHTML = `<option value="">Selecciona boot (opcional)</option>`;

  const ordenados = [...boots].sort((a, b) =>
    a.proveedor_boot.localeCompare(b.proveedor_boot, "es", { sensitivity: "base" })
  );

  ordenados.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b.proveedor_boot;
    opt.textContent = b.proveedor_boot;
    opt.dataset.link = b.link_boot || "";
    select.appendChild(opt);
  });
}

/* =========================
   HELPER RESET
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
    if (e.target.value) setupProveedores();
    else resetSelect("proveedor", "Selecciona proveedor");
  });

  // Al elegir boot, mostrar el link automáticamente
  document.getElementById("boot").addEventListener("change", (e) => {
    const sel = e.target;
    const link = sel.selectedOptions[0]?.dataset.link || "";
    document.getElementById("linkBoot").value = link;
  });

  // Inicializar boots (no dependen de nada más)
  setupBoots();
}

/* =========================
   GUARDAR COMPRA
========================= */
window.saveCompra = async () => {
  const id_servicio    = document.getElementById("servicio").value;
  const proveedorSel   = document.getElementById("proveedor");
  const proveedor      = proveedorSel.value;
  const whatsapp       = proveedorSel.selectedOptions[0]?.dataset.whatsapp || "";
  const correo         = document.getElementById("correo").value.trim();
  const vencimiento    = document.getElementById("vencimiento").value;
  const proveedor_boot = document.getElementById("boot").value;
  const link_boot      = document.getElementById("linkBoot").value.trim();
  const id_boot        = document.getElementById("idBoot").value.trim();

  if (!id_servicio || !proveedor || !correo || !vencimiento) {
    return alert("Por favor completa los campos obligatorios.");
  }

  const compra = {
    id_cuenta:       crypto.randomUUID(),
    id_servicio,
    proveedor,
    whatsapp,
    correo_cuenta:   correo,
    fecha_compra:    new Date().toISOString().split("T")[0],
    fecha_vencimiento: vencimiento,
    estado:          "Activa",
    // Boot (opcionales)
    proveedor_boot:  proveedor_boot || null,
    link_boot:       link_boot      || null,
    id_boot:         id_boot        || null,
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
  document.getElementById("plataforma").value  = "";
  setupServicios("");
  document.getElementById("correo").value      = "";
  document.getElementById("vencimiento").value = "";
  document.getElementById("boot").value        = "";
  document.getElementById("linkBoot").value    = "";
  document.getElementById("idBoot").value      = "";
}
