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
   ESTADO UI (NUEVO)
========================= */
let currentSearch = "";
let currentPlatform = "";
let currentSort = "";
let expandedCardId = null;
let lastScroll = 0;

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", async () => {
  setupEvents();
  setupModalClose();
  setupAgregarCliente();

  await Promise.all([
    loadClientes(),
    loadProveedores(),
    loadServicios()
  ]);

  await loadVentas();
  await loadCuentas();
});

/* =========================
   HELPERS
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

  setupPlatformOptions(); // 🔥 NUEVO
  applyView();
}

/* =========================
   PLATAFORMAS (FILTRO NUEVO)
========================= */
function setupPlatformOptions() {
  const select = document.getElementById("filterPlatform");
  if (!select) return;

  const set = new Set();

  cuentas.forEach(c => {
    const p = getPlataforma(c);
    if (p) set.add(p);
  });

  const current = currentPlatform;

  select.innerHTML = `<option value="">Todas las plataformas</option>`;

  [...set].sort().forEach(p => {
    select.innerHTML += `<option value="${p}">${p}</option>`;
  });

  select.value = current;
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
   CLIENTES
========================= */
function getClientes(c) {
  const correo = getCorreo(c);

  return ventas.filter(v =>
    v.usuario_correo === correo
  );
}

/* =========================
   RENDER
========================= */
function render(data) {
  const container = document.getElementById("container");

  lastScroll = window.scrollY;

  container.innerHTML = "";

  data.forEach(c => {

    const correo = getCorreo(c);
    const servicio = getServicio(c);
    const disp = getDisponibilidad(c);
    const clientesCuenta = getClientes(c);

    const color = colorByDate(c.fecha_vencimiento);

    const card = document.createElement("div");
    card.className = `card ${color}`;
    card.dataset.id = c.id_cuenta;

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

  restoreUI();
}

/* =========================
   RESTAURAR UI (NUEVO)
========================= */
function restoreUI() {
  // filtro
  const search = document.getElementById("search");
  const platform = document.getElementById("filterPlatform");
  const sort = document.getElementById("sortBy");

  if (search) search.value = currentSearch;
  if (platform) platform.value = currentPlatform;
  if (sort) sort.value = currentSort;

  // expandido
  if (expandedCardId) {
    const el = document.querySelector(`[data-id="${expandedCardId}"]`);
    if (el) el.querySelector(".card-body")?.classList.remove("hidden");
  }

  window.scrollTo(0, lastScroll);
}

/* =========================
   TOGGLE
========================= */
function setupToggle() {
  document.querySelectorAll(".card-header").forEach(el => {
    el.onclick = () => {
      const card = el.parentElement;
      const id = card.dataset.id;

      const body = card.querySelector(".card-body");
      body.classList.toggle("hidden");

      expandedCardId = id;
    };
  });
}

/* =========================
   MODAL
========================= */
window.abrirModal = (idCuenta) => {
  document.getElementById("addCuentaId").value = idCuenta;

  const select = document.getElementById("addCliente");
  select.innerHTML = clientes.map(c =>
    `<option value="${c.id_cliente}">${c.nombre}</option>`
  ).join("");

  document.getElementById("modalAgregarCliente").showModal();
};

function setupModalClose() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-modal-close]");
    if (!btn) return;

    const modal = document.getElementById(btn.dataset.modalClose);
    if (modal) modal.close();
  });
}

/* =========================
   AGREGAR CLIENTE
========================= */
function setupAgregarCliente() {
  const form = document.getElementById("formAgregarCliente");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const idCuenta = document.getElementById("addCuentaId").value;
    const idCliente = document.getElementById("addCliente").value;
    const perfil = document.getElementById("addPerfil").value;
    const fecha = document.getElementById("addFechaVencimiento").value;
    const ganancia = document.getElementById("addGanancia").value;

    const cuenta = cuentas.find(c => c.id_cuenta === idCuenta);
    if (!cuenta) return;

    await supabase.from("ventas").insert([{
      id_venta: crypto.randomUUID(),
      tipo_venta: "VCP",
      id_cliente: idCliente,
      plataforma: getPlataforma(cuenta),
      id_servicio: cuenta.id_servicio,
      usuario_correo: cuenta.correo_cuenta,
      perfil,
      fecha_registro: new Date().toISOString(),
      fecha_vencimiento: fecha,
      ganancia: parseFloat(ganancia || 0),
      estado: "activa"
    }]);

    document.getElementById("modalAgregarCliente").close();

    await loadVentas();
    await loadCuentas();
  });
}

/* =========================
   FILTROS + SORT + SEARCH
========================= */
function applyView() {

  const search = document.getElementById("search");
  const platform = document.getElementById("filterPlatform");
  const sort = document.getElementById("sortBy");

  currentSearch = search?.value || "";
  currentPlatform = platform?.value || "";
  currentSort = sort?.value || "";

  let data = [...cuentas];

  if (currentSearch) {
    data = data.filter(c =>
      getCorreo(c).toLowerCase().includes(currentSearch.toLowerCase()) ||
      c.proveedor.toLowerCase().includes(currentSearch.toLowerCase()) ||
      getPlataforma(c).toLowerCase().includes(currentSearch.toLowerCase())
    );
  }

  if (currentPlatform) {
    data = data.filter(c => getPlataforma(c) === currentPlatform);
  }

  if (currentSort === "fecha_vencimiento") {
    data.sort((a, b) =>
      new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento)
    );
  }

  if (currentSort === "disponibilidad") {
    data.sort((a, b) =>
      getDisponibilidad(b).free - getDisponibilidad(a).free
    );
  }

  render(data);
}

/* =========================
   EVENTS
========================= */
function setupEvents() {
  document.getElementById("search")?.addEventListener("input", applyView);
  document.getElementById("sortBy")?.addEventListener("change", applyView);
  document.getElementById("filterPlatform")?.addEventListener("change", applyView);
}
