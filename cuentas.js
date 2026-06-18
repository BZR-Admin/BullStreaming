import { supabase } from "./supabase.js";

/* =========================
   ESTADO
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
   CLIENTES CUENTA (FIX REAL)
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
          <button style="width:100%; margin-top:10px;"
            onclick="abrirModal('${c.id_cuenta}')">
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
   WHATSAPP (FIX PROVEEDOR)
========================= */
window.whatsappProveedor = (id) => {
  const c = cuentas.find(x => x.id_cuenta === id);
  const p = proveedoresMap[c.proveedor];

  const tel = safe(p?.telefono || p?.celular || p?.whatsapp).replace(/\D/g, "");

  if (!tel) return alert("Proveedor sin número");

  const msg = `Hola Bull Streaming desea renovar esta cuenta ${getCorreo(c)} de ${getServicio(c)?.servicio}`;

  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`);
};

/* =========================
   MODAL AGREGAR CLIENTE (FIX REAL)
========================= */
window.abrirModal = (idCuenta) => {
  const modal = document.getElementById("modalAgregarCliente");

  document.getElementById("addCuentaId").value = idCuenta;

  const select = document.getElementById("addCliente");

  select.innerHTML = clientes
    .map(c => `<option value="${c.id_cliente}">${c.nombre}</option>`)
    .join("");

  modal.showModal();
};

/* =========================
   EDITAR CORREO (CASCADE)
========================= */
window.editarCorreo = async (id) => {
  const c = cuentas.find(x => x.id_cuenta === id);
  const nuevo = prompt("Nuevo correo", getCorreo(c));
  if (!nuevo) return;

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

/* =========================
   EDITAR FECHA
========================= */
window.editarFecha = async (id) => {
  const nueva = prompt("YYYY-MM-DD");
  if (!nueva) return;

  await supabase.from("cuentas_propias")
    .update({ fecha_vencimiento: nueva })
    .eq("id_cuenta", id);

  await loadCuentas();
};

/* =========================
   CLIENTES EDIT / DELETE
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
   SEARCH + SORT FIX FINAL
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
}
