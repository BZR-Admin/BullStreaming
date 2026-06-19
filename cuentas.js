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

async function loadCuentas() {
  const { data } = await supabase.from("cuentas_propias").select("*");
  cuentas = data || [];

  setupPlatformOptions(); // 👈 AÑADIDO

  applyView();
}

async function loadCuentas() {
  const { data } = await supabase.from("cuentas_propias").select("*");
  cuentas = data || [];
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
   MODAL OPEN
========================= */
window.abrirModal = (idCuenta) => {
  document.getElementById("addCuentaId").value = idCuenta;

  const select = document.getElementById("addCliente");
  select.innerHTML = clientes.map(c =>
    `<option value="${c.id_cliente}">${c.nombre}</option>`
  ).join("");

  document.getElementById("modalAgregarCliente").showModal();
};

/* =========================
   MODAL CLOSE
========================= */
function setupModalClose() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-modal-close]");
    if (!btn) return;

    const modal = document.getElementById(btn.dataset.modalClose);
    if (modal) modal.close();
  });
}

/* =========================
   AGREGAR CLIENTE (FIX FINAL)
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
    applyView();
  });
}


function setupPlatformOptions() {
  const select = document.getElementById("filterPlatform");
  if (!select) return;

  const currentValue = select.value;

  const set = new Set();

  cuentas.forEach(c => {
    const plataforma = getPlataforma(c);
    if (plataforma) set.add(plataforma);
  });

  select.innerHTML = `<option value="">Todas las plataformas</option>`;

  [...set].sort().forEach(p => {
    select.innerHTML += `<option value="${p}">${p}</option>`;
  });

  const exists = [...select.options].some(opt => opt.value === currentValue);

  if (exists) select.value = currentValue;
}
/* =========================
   WHATSAPP
========================= */
window.whatsappProveedor = (id) => {
  const c = cuentas.find(x => x.id_cuenta === id);
  const p = proveedoresMap[c.proveedor];

  const tel = safe(p?.telefono || p?.celular || p?.whatsapp).replace(/\D/g, "");

  if (!tel) return alert("Proveedor sin número");

  const msg = `Hola Bull Streaming desea renovar ${getCorreo(c)} (${getServicio(c)?.servicio})`;

  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`);
};

/* =========================
   EDITAR / ELIMINAR CUENTA
========================= */
window.editarCorreo = async (id) => {
  const c = cuentas.find(x => x.id_cuenta === id);
  const nuevo = prompt("Nuevo correo", getCorreo(c));
  if (!nuevo) return;

  await supabase.from("ventas")
    .update({ usuario_correo: nuevo })
    .eq("usuario_correo", getCorreo(c));

  await supabase.from("cuentas_propias")
    .update({ correo_cuenta: nuevo })
    .eq("id_cuenta", id);

  await loadVentas();
  await loadCuentas();
};

window.eliminarCuenta = async (id) => {
  const c = cuentas.find(x => x.id_cuenta === id);

  if (!confirm("Eliminar cuenta y clientes?")) return;

  await supabase.from("ventas")
    .delete()
    .eq("usuario_correo", getCorreo(c));

  await supabase.from("cuentas_propias")
    .delete()
    .eq("id_cuenta", id);

  await loadVentas();
  await loadCuentas();
};

window.editarFecha = async (id) => {
  const nueva = prompt("YYYY-MM-DD");
  if (!nueva) return;

  await supabase.from("cuentas_propias")
    .update({ fecha_vencimiento: nueva })
    .eq("id_cuenta", id);

  await loadCuentas();
};

/* =========================
   CLIENTES EDIT
========================= */
window.editarVenta = async (id) => {
  const v = ventas.find(x => x.id_venta === id);

  const perfil = prompt("Perfil", v.perfil);
  const fecha = prompt("Fecha", v.fecha_vencimiento);

  await supabase.from("ventas")
    .update({ perfil, fecha_vencimiento: fecha })
    .eq("id_venta", id);

  await loadVentas();
  applyView();
};

window.eliminarVenta = async (id) => {
  await supabase.from("ventas")
    .delete()
    .eq("id_venta", id);

  await loadVentas();
  applyView();
};

/* =========================
   SEARCH + SORT
========================= */
function applyView() {
  let data = [...cuentas];

  const q = (document.getElementById("search")?.value || "").toLowerCase();

  if (q) {
    data = data.filter(c =>
      getCorreo(c).toLowerCase().includes(q) ||
      c.proveedor.toLowerCase().includes(q) ||
      getPlataforma(c).toLowerCase().includes(q)
    );
  }

  const sort = document.getElementById("sortBy")?.value;

const platform = document.getElementById("filterPlatform")?.value;

if (platform) {
  data = data.filter(c => getPlataforma(c) === platform);
}
  if (sort === "plataforma") {
    data.sort((a, b) => {
      const sa = serviciosMap[a.id_servicio]?.plataforma || "";
      const sb = serviciosMap[b.id_servicio]?.plataforma || "";
      return sa.localeCompare(sb);
    });
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
}

/* =========================
   EVENTS
========================= */
function setupEvents() {
  document.getElementById("search")?.addEventListener("input", applyView);
  document.getElementById("sortBy")?.addEventListener("change", applyView);
   document.getElementById("filterPlatform")?.addEventListener("change", applyView);
}
