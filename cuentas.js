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

  await loadClientes();
  await loadProveedores();
  await loadServicios();
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
  today.setHours(0,0,0,0);
  d.setHours(0,0,0,0);

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

  clientes.forEach(c => {
    clientesMap[c.id_cliente] = c;
  });
}

async function loadProveedores() {
  const { data } = await supabase.from("proveedores").select("*");
  proveedores = data || [];

  proveedores.forEach(p => {
    proveedoresMap[p.proveedor] = p;
  });
}

async function loadServicios() {
  const { data } = await supabase.from("conf_venta_cuenta_propia").select("*");
  servicios = data || [];

  servicios.forEach(s => {
    serviciosMap[s.id_servicio] = s;
  });
}

async function loadVentas() {
  const { data } = await supabase.from("ventas").select("*");
  ventas = data || [];
}

async function loadCuentas() {
  const { data } = await supabase.from("cuentas_propias").select("*");
  cuentas = data || [];

  applyView();
}

/* =========================
   SERVICIO
========================= */
function getServicio(cuenta) {
  return serviciosMap[cuenta.id_servicio];
}

/* =========================
   CORREO (FIX IMPORTANTE)
========================= */
function getCorreo(c) {
  return safe(c.correo_cuenta || c.usuario_correo);
}

/* =========================
   DISPONIBILIDAD REAL
========================= */
function getDisponibilidad(cuenta) {
  const correo = getCorreo(cuenta);

  const usadas = ventas.filter(v =>
    v.usuario_correo === correo
  ).length;

  const servicio = getServicio(cuenta);
  const max = servicio?.cantidad || 0;

  return {
    usadas,
    max,
    full: usadas >= max
  };
}

/* =========================
   CLIENTES CUENTA
========================= */
function getClientesCuenta(cuenta) {
  const correo = getCorreo(cuenta);

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

  data.forEach(cuenta => {

    const correo = getCorreo(cuenta);
    const servicio = getServicio(cuenta);

    const disp = getDisponibilidad(cuenta);
    const clientesCuenta = getClientesCuenta(cuenta);

    const color = colorByDate(cuenta.fecha_vencimiento);

    const card = document.createElement("div");
    card.className = `card ${color}`;

    card.innerHTML = `
      <div class="card-header">

        <div>
          <h3>${servicio?.servicio || "Servicio"}</h3>
          <p><b>Correo:</b> ${correo}</p>
          <p><b>Proveedor:</b> ${cuenta.proveedor || "-"}</p>
          <p><b>Vence:</b> ${cuenta.fecha_vencimiento || "-"}</p>
        </div>

        <div style="text-align:right;">
          <div class="status ${disp.full ? "red" : "green"}"></div>
          <p>${disp.usadas}/${disp.max}</p>
        </div>

      </div>

      <div class="card-body hidden">

        <div class="btn-grid">
          <button onclick="whatsappProveedor('${cuenta.id_cuenta}')">WhatsApp</button>
          <button onclick="editarCorreo('${cuenta.id_cuenta}')">Editar correo</button>
          <button onclick="editarFecha('${cuenta.id_cuenta}')">Editar fecha</button>
          <button onclick="eliminarCuenta('${cuenta.id_cuenta}')">Eliminar</button>
        </div>

        <hr>

        <h4>Clientes</h4>

        ${
          clientesCuenta.map(v => `
            <div class="cliente-row">
              <span>${v.cliente} - ${v.perfil} - ${v.fecha_vencimiento}</span>
              <div>
                <button onclick="editarVenta('${v.id_venta}')">Editar</button>
                <button onclick="eliminarVenta('${v.id_venta}')">Eliminar</button>
              </div>
            </div>
          `).join("")
        }

        <button style="width:100%; margin-top:10px;"
          onclick="abrirModal('${cuenta.id_cuenta}')">
          + Agregar cliente
        </button>

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
   WHATSAPP (FIX)
========================= */
window.whatsappProveedor = (id) => {
  const c = cuentas.find(x => x.id_cuenta === id);
  if (!c) return;

  const prov = proveedoresMap[c.proveedor];
  const tel = safe(prov?.whatsapp).replace(/\D/g, "");

  if (!tel) return alert("Proveedor sin WhatsApp");

  const msg = `Hola Bull Streaming desea renovar esta cuenta ${getCorreo(c)} de ${c.id_servicio}`;

  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`);
};

/* =========================
   EDITAR CORREO (CASCADE FIX)
========================= */
window.editarCorreo = async (id) => {
  const c = cuentas.find(x => x.id_cuenta === id);
  const nuevo = prompt("Nuevo correo:", getCorreo(c));
  if (!nuevo) return;

  if (!confirm("Esto actualizará TODOS los clientes de esta cuenta")) return;

  const old = getCorreo(c);

  await supabase.from("ventas")
    .update({ usuario_correo: nuevo })
    .eq("usuario_correo", old);

  await supabase.from("cuentas_propias")
    .update({ correo_cuenta: nuevo })
    .eq("id_cuenta", id);

  await loadVentas();
  await loadCuentas();
};

/* =========================
   ELIMINAR CUENTA
========================= */
window.eliminarCuenta = async (id) => {
  const c = cuentas.find(x => x.id_cuenta === id);

  if (!confirm("Eliminar cuenta y todos sus clientes?")) return;

  const correo = getCorreo(c);

  await supabase.from("ventas")
    .delete()
    .eq("usuario_correo", correo);

  await supabase.from("cuentas_propias")
    .delete()
    .eq("id_cuenta", id);

  await loadVentas();
  await loadCuentas();
};

/* =========================
   EDITAR FECHA
========================= */
window.editarFecha = async (id) => {
  const nueva = prompt("Nueva fecha YYYY-MM-DD");
  if (!nueva) return;

  await supabase.from("cuentas_propias")
    .update({ fecha_vencimiento: nueva })
    .eq("id_cuenta", id);

  await loadCuentas();
};

/* =========================
   SEARCH + SORT + FILTER (FIX CLAVE)
========================= */
function applyView() {
  const q = (document.getElementById("search")?.value || "").toLowerCase();

  let data = [...cuentas];

  if (q) {
    data = data.filter(c => {
      const correo = getCorreo(c);
      return (
        correo.toLowerCase().includes(q) ||
        (c.proveedor || "").toLowerCase().includes(q) ||
        (c.id_servicio || "").toLowerCase().includes(q)
      );
    });
  }

  const sort = document.getElementById("sortBy")?.value;

  if (sort === "fecha_vencimiento") {
    data.sort((a,b) =>
      new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento)
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
