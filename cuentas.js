import { supabase } from "./supabase.js";

/* =========================
   ESTADOS GLOBALES
========================= */
let cuentas = [];
let ventas = [];
let clientes = [];
let proveedores = [];
let servicios = [];

let serviciosMap = {};
let clientesMap = {};
let proveedoresMap = {};

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
const safe = (v) => (v === null || v === undefined ? "" : String(v));

const get = (id) => document.getElementById(id);

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
    proveedoresMap[p.nombre] = p;
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

  render();
}

/* =========================
   DISPONIBILIDAD
========================= */
function getDisponibilidad(cuenta) {
  const usadas = ventas.filter(v =>
    v.usuario_correo === cuenta.usuario_correo
  ).length;

  const servicio = serviciosMap[cuenta.id_servicio];
  const max = servicio?.capacidad || 0;

  return {
    usadas,
    max,
    full: usadas >= max
  };
}

/* =========================
   CLIENTES POR CUENTA
========================= */
function getClientesCuenta(cuenta) {
  return ventas.filter(v =>
    v.usuario_correo === cuenta.usuario_correo
  );
}

/* =========================
   SERVICIO NOMBRE
========================= */
function getServicioNombre(cuenta) {
  const s = serviciosMap[cuenta.id_servicio];
  return s?.servicio || "Servicio";
}

/* =========================
   RENDER
========================= */
function render() {
  const container = get("container");
  container.innerHTML = "";

  cuentas.forEach(cuenta => {

    const disp = getDisponibilidad(cuenta);
    const clientesCuenta = getClientesCuenta(cuenta);
    const servicioNombre = getServicioNombre(cuenta);

    const color = colorByDate(cuenta.fecha_vencimiento);

    const card = document.createElement("div");
    card.className = `card ${color}`;

    const dotColor = disp.full ? "red" : "green";

    card.innerHTML = `
      <div class="card-header" data-id="${cuenta.id}">

        <div>
          <h3>${servicioNombre}</h3>
          <p><b>Usuario:</b> ${cuenta.usuario_correo}</p>
          <p><b>Proveedor:</b> ${cuenta.proveedor || "-"}</p>
          <p><b>Vence:</b> ${cuenta.fecha_vencimiento || "-"}</p>
        </div>

        <div style="text-align:right;">
          <div class="status ${dotColor}"></div>
          <p>${disp.usadas}/${disp.max}</p>
        </div>

      </div>

      <div class="card-body hidden">

        <div class="btn-grid">
          <button onclick="whatsappProveedor('${cuenta.id}')">💬 WhatsApp</button>
          <button onclick="editarCorreo('${cuenta.id}')">✏️ Editar correo</button>
          <button onclick="editarFechaCuenta('${cuenta.id}')">📅 Vencimiento</button>
          <button onclick="eliminarCuenta('${cuenta.id}')">🗑️ Eliminar</button>
        </div>

        <hr>

        <h4>Clientes</h4>

        ${
          clientesCuenta.map(v => `
            <div class="cliente-row">
              <span>
                ${v.cliente} - ${v.perfil} - ${v.fecha_vencimiento}
              </span>

              <div>
                <button onclick="editarVenta('${v.id_venta}')">Editar</button>
                <button onclick="eliminarVenta('${v.id_venta}')">Eliminar</button>
              </div>
            </div>
          `).join("")
        }

        <button style="margin-top:10px; width:100%;"
          onclick="abrirAgregarCliente('${cuenta.id}')">
          ➕ Agregar cliente
        </button>

      </div>
    `;

    container.appendChild(card);
  });

  setupToggle();
}

/* =========================
   TOGGLE CARD
========================= */
function setupToggle() {
  document.querySelectorAll(".card-header").forEach(h => {
    h.onclick = () => {
      h.parentElement.querySelector(".card-body").classList.toggle("hidden");
    };
  });
}

/* =========================
   WHATSAPP PROVEEDOR
========================= */
window.whatsappProveedor = (id) => {
  const cuenta = cuentas.find(c => c.id === id);
  if (!cuenta) return;

  const prov = proveedoresMap[cuenta.proveedor];

  const tel = prov?.whatsapp?.replace(/\D/g, "");
  if (!tel) return alert("Proveedor sin WhatsApp");

  const msg = `Hola Bull Streaming desea renovar esta cuenta ${cuenta.usuario_correo} de ${getServicioNombre(cuenta)}. ¿Puedo hacerlo?`;

  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`);
};

/* =========================
   EDITAR CORREO (CASCADE)
========================= */
window.editarCorreo = async (id) => {
  const cuenta = cuentas.find(c => c.id === id);
  if (!cuenta) return;

  const nuevo = prompt("Nuevo correo:", cuenta.usuario_correo);
  if (!nuevo) return;

  if (!confirm("Se cambiará en TODOS los clientes de esta cuenta. ¿Continuar?")) return;

  await supabase
    .from("ventas")
    .update({ usuario_correo: nuevo })
    .eq("usuario_correo", cuenta.usuario_correo);

  await supabase
    .from("cuentas_propias")
    .update({ usuario_correo: nuevo })
    .eq("id", id);

  await loadVentas();
  await loadCuentas();
};

/* =========================
   ELIMINAR CUENTA (CASCADE)
========================= */
window.eliminarCuenta = async (id) => {
  const cuenta = cuentas.find(c => c.id === id);
  if (!cuenta) return;

  if (!confirm("Se eliminarán TODOS los clientes de esta cuenta. ¿Continuar?")) return;

  await supabase
    .from("ventas")
    .delete()
    .eq("usuario_correo", cuenta.usuario_correo);

  await supabase
    .from("cuentas_propias")
    .delete()
    .eq("id", id);

  await loadVentas();
  await loadCuentas();
};

/* =========================
   EDITAR FECHA CUENTA
========================= */
window.editarFechaCuenta = async (id) => {
  const nueva = prompt("Nueva fecha (YYYY-MM-DD)");
  if (!nueva) return;

  await supabase
    .from("cuentas_propias")
    .update({ fecha_vencimiento: nueva })
    .eq("id", id);

  await loadCuentas();
};

/* =========================
   CLIENTES: EDITAR VENTA
========================= */
window.editarVenta = async (id) => {
  const v = ventas.find(x => x.id_venta === id);
  if (!v) return;

  const perfil = prompt("Perfil:", v.perfil);
  if (!perfil) return;

  const fecha = prompt("Fecha vencimiento:", v.fecha_vencimiento);
  if (!fecha) return;

  await supabase
    .from("ventas")
    .update({ perfil, fecha_vencimiento: fecha })
    .eq("id_venta", id);

  await loadVentas();
  render();
};

/* =========================
   ELIMINAR VENTA
========================= */
window.eliminarVenta = async (id) => {
  if (!confirm("Eliminar cliente de la cuenta?")) return;

  await supabase
    .from("ventas")
    .delete()
    .eq("id_venta", id);

  await loadVentas();
  render();
};

/* =========================
   AGREGAR CLIENTE
========================= */
window.abrirAgregarCliente = (idCuenta) => {
  const modal = get("modalAgregarCliente");
  const select = get("addCliente");

  select.innerHTML = clientes.map(c =>
    `<option value="${c.id_cliente}">${c.nombre}</option>`
  ).join("");

  get("addCuentaId").value = idCuenta;

  modal.showModal();
};

get("formAgregarCliente").addEventListener("submit", async (e) => {
  e.preventDefault();

  const idCuenta = get("addCuentaId").value;
  const clienteId = get("addCliente").value;
  const perfil = get("addPerfil").value;
  const fecha = get("addFechaVencimiento").value;

  const cuenta = cuentas.find(c => c.id === idCuenta);
  const cliente = clientesMap[clienteId];

  await supabase.from("ventas").insert([{
    cliente: cliente.nombre,
    id_cliente: clienteId,
    usuario_correo: cuenta.usuario_correo,
    plataforma: cuenta.plataforma,
    id_servicio: cuenta.id_servicio,
    perfil,
    fecha_vencimiento: fecha
  }]);

  get("modalAgregarCliente").close();

  await loadVentas();
  render();
});

/* =========================
   CLOSE MODALS
========================= */
document.querySelectorAll("[data-modal-close]").forEach(btn => {
  btn.onclick = () => {
    const modal = document.getElementById(btn.dataset.modalClose);
    modal?.close();
  };
});

/* =========================
   EVENTOS
========================= */
function setupEvents() {
  const search = get("search");
  const platform = get("filterPlatform");

  search?.addEventListener("input", render);
  platform?.addEventListener("change", render);
}
