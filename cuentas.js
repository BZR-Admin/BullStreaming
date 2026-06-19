import { supabase } from "./supabase.js";

/* =========================
   ESTADO GLOBAL
========================= */
let cuentas = [];
let ventas = [];
let clientes = [];
let proveedores = [];
let servicios = [];

let clientesMap = {};
let proveedoresMap = {};
let serviciosMap = {};

/* =========================
   UI STATE (NUEVO)
========================= */
let uiState = {
  scrollY: 0,
  search: "",
  platform: "",
};

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", async () => {
  setupEvents();
  setupModalClose();
  setupAgregarCliente();
  setupPlatformFilter(); // 🔥 NUEVO

  await Promise.all([
    loadClientes(),
    loadProveedores(),
    loadServicios()
  ]);

  await loadVentas();
  await loadCuentas();
});

/* =========================
   HELPERS GENERALES
========================= */
const safe = (v) => (v ?? "").toString().trim();

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function diffDays(v) {
  const d = parseDate(v);
  if (!d) return 9999;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);

  return Math.ceil((d - today) / 86400000);
}

function colorByDate(v) {
  const d = diffDays(v);
  if (d <= 0) return "red";
  if (d <= 2) return "yellow";
  return "green";
}

/* =========================
   LOAD DATA
========================= */
async function loadClientes() {
  const { data } = await supabase.from("clientes").select("*");
  clientes = data || [];

  clientesMap = Object.fromEntries(
    clientes.map(c => [c.id_cliente, c])
  );
}

async function loadProveedores() {
  const { data } = await supabase.from("proveedores").select("*");
  proveedores = data || [];

  proveedoresMap = Object.fromEntries(
    proveedores.map(p => [p.proveedor, p])
  );
}

async function loadServicios() {
  const { data } = await supabase.from("conf_venta_cuenta_propia").select("*");
  servicios = data || [];

  serviciosMap = Object.fromEntries(
    servicios.map(s => [s.id_servicio, s])
  );
}

async function loadVentas() {
  const { data } = await supabase.from("ventas").select("*");
  ventas = data || [];
}

async function loadCuentas() {
  const { data } = await supabase.from("cuentas_propias").select("*");
  cuentas = data || [];

  setupPlatformFilter(); // 🔥 actualizar filtro
  applyView();
}

/* =========================
   HELPERS CUENTA
========================= */
function getCorreo(c) {
  return safe(c.correo_cuenta);
}

function getServicio(c) {
  return serviciosMap[c.id_servicio];
}

function getPlataforma(c) {
  return serviciosMap[c.id_servicio]?.plataforma || "";
}

/* =========================
   DISPONIBILIDAD
========================= */
function getDisponibilidad(c) {
  const correo = getCorreo(c);

  const usadas = ventas.filter(v =>
    v.usuario_correo === correo
  ).length;

  const max = getServicio(c)?.cantidad || 0;

  return {
    usadas,
    max,
    free: max - usadas,
    full: usadas >= max
  };
}

/* =========================
   CLIENTES CUENTA
========================= */
function getClientes(c) {
  const correo = getCorreo(c);

  return ventas.filter(v =>
    v.usuario_correo === correo
  );
}

/* =========================
   FILTRO PLATAFORMA (NUEVO PRO)
========================= */
function setupPlatformFilter() {
  const select = document.getElementById("filterPlatform");
  if (!select) return;

  const current = select.value;

  const set = new Set();
  cuentas.forEach(c => {
    const p = getPlataforma(c);
    if (p) set.add(p);
  });

  select.innerHTML = `<option value="">Todas las plataformas</option>`;

  [...set].sort().forEach(p => {
    select.innerHTML += `<option value="${p}">${p}</option>`;
  });

  select.value = current;
}

/* =========================
   UI STATE SAVE/RESTORE
========================= */
function saveUIState() {
  uiState.scrollY = window.scrollY;
  uiState.search = document.getElementById("search")?.value || "";
  uiState.platform = document.getElementById("filterPlatform")?.value || "";
}

function restoreUIState() {
  window.scrollTo(0, uiState.scrollY);

  const s = document.getElementById("search");
  const p = document.getElementById("filterPlatform");

  if (s) s.value = uiState.search;
  if (p) p.value = uiState.platform;
}

/* =========================
   RENDER
========================= */
function render(data) {
  const container = document.getElementById("container");
  container.innerHTML = "";

  data.forEach(c => {

    const correo = getCorreo(c);
    const servicio = getServicio(c);
    const disp = getDisponibilidad(c);
    const clientesCuenta = getClientes(c);

    const color = colorByDate(c.fecha_vencimiento);

    const card = document.createElement("div");
    card.className = `card ${color}`;

    card.innerHTML = `
      <div class="card-header">
        <div>
          <h3>${servicio?.servicio || "Servicio"}</h3>
          <p><b>Correo:</b> ${correo}</p>
          <p><b>Proveedor:</b> ${c.proveedor}</p>
          <p><b>Plataforma:</b> ${getPlataforma(c)}</p>
          <p><b>Vence:</b> ${c.fecha_vencimiento}</p>
        </div>

        <div style="text-align:right;">
          <div class="status ${disp.full ? "red" : "green"}"></div>
          <p>${disp.usadas}/${disp.max}</p>
        </div>
      </div>

      <div class="card-body hidden">

        <div class="btn-grid">
          <button onclick="whatsappProveedor('${c.id_cuenta}')">WhatsApp</button>
          <button onclick="editarCorreo('${c.id_cuenta}')">Editar correo</button>
          <button onclick="editarFecha('${c.id_cuenta}')">Editar fecha</button>
          <button onclick="eliminarCuenta('${c.id_cuenta}')">Eliminar</button>
        </div>

        <hr>

        <h4>Clientes</h4>

        ${
          clientesCuenta.map(v => `
            <div class="cliente-row">
              <span>
                ${clientesMap[v.id_cliente]?.nombre || "Sin cliente"}
                - ${v.perfil}
                - ${v.fecha_vencimiento}
              </span>

              <div>
                <button onclick="editarVenta('${v.id_venta}')">Editar</button>
                <button onclick="eliminarVenta('${v.id_venta}')">Eliminar</button>
              </div>
            </div>
          `).join("")
        }

        ${!disp.full ? `
          <button onclick="abrirModal('${c.id_cuenta}')" style="width:100%; margin-top:10px;">
            + Agregar cliente
          </button>
        ` : ""}

      </div>
    `;

    container.appendChild(card);
  });

  setupToggle();
}

/* =========================
   TOGGLE
========================= */
function setupToggle() {
  document.querySelectorAll(".card-header").forEach(el => {
    el.onclick = () => {
      el.parentElement.querySelector(".card-body").classList.toggle("hidden");
    };
  });
}

/* =========================
   FILTER + SEARCH + SORT
========================= */
function applyView() {
  saveUIState(); // 🔥 guardar posición

  let data = [...cuentas];

  const q = (document.getElementById("search")?.value || "").toLowerCase();
  const platform = document.getElementById("filterPlatform")?.value;

  if (q) {
    data = data.filter(c =>
      getCorreo(c).toLowerCase().includes(q) ||
      c.proveedor.toLowerCase().includes(q) ||
      getPlataforma(c).toLowerCase().includes(q)
    );
  }

  if (platform) {
    data = data.filter(c =>
      getPlataforma(c) === platform
    );
  }

  const sort = document.getElementById("sortBy")?.value;

  if (sort === "plataforma") {
    data.sort((a, b) =>
      getPlataforma(a).localeCompare(getPlataforma(b))
    );
  }

  if (sort === "fecha_vencimiento") {
    data.sort((a, b) =>
      new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento)
    );
  }

  if (sort === "disponibilidad") {
    data.sort((a, b) =>
      getDisponibilidad(b).free - getDisponibilidad(a).free
    );
  }

  render(data);
  restoreUIState(); // 🔥 volver al punto exacto
}

/* =========================
   EVENTS
========================= */
function setupEvents() {
  document.getElementById("search")?.addEventListener("input", applyView);
  document.getElementById("sortBy")?.addEventListener("change", applyView);
  document.getElementById("filterPlatform")?.addEventListener("change", applyView);
}
