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
  setupEditarCliente();
  setupEditarCuentaFecha();

  await Promise.all([
    loadClientes(),
    loadProveedores(),
    loadServicios()
  ]);

  await loadVentas();
  await loadCuentas();

  handleDeepLink(); // 👈 NUEVO: si viene ?correo=... en la URL, abre y resalta esa cuenta
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

  setupPlatformOptions();

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
    card.dataset.correo = correo.toLowerCase(); // 👈 NUEVO: para poder ubicarla desde registros.js

    card.innerHTML = `
      <div class="card-header">
        <div>
          <h3></b> ${getPlataforma(c)}</h3>
          <p><b>Correo:</b> ${correo}</p>
          <p><b>Proveedor:</b> ${c.proveedor}</p>
          <p><b>${servicio?.servicio || "Servicio"}</p>
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
   DEEP LINK (viene desde registros.js) — NUEVO
========================= */
function handleDeepLink() {
  const params = new URLSearchParams(location.search);
  const correoParam = params.get("correo");
  if (!correoParam) return;

  const target = correoParam.trim().toLowerCase();

  const card = [...document.querySelectorAll(".card")]
    .find(el => el.dataset.correo === target);

  if (!card) return;

  card.querySelector(".card-body")?.classList.remove("hidden");
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  card.classList.add("highlight");

  setTimeout(() => card.classList.remove("highlight"), 2500);
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
   MODAL OPEN — AGREGAR CLIENTE
========================= */
window.abrirModal = (idCuenta) => {
  document.getElementById("addCuentaId").value = idCuenta;

  // Resetear buscador al abrir
  const searchInput = document.getElementById("addClienteSearch");
  const hiddenInput = document.getElementById("addCliente");
  if (searchInput) {
    searchInput.value = "";
    searchInput.classList.remove("selected");
  }
  if (hiddenInput) hiddenInput.value = "";

  document.getElementById("modalAgregarCliente").showModal();

  // Focus al buscador con pequeño delay para que el modal termine de abrir
  setTimeout(() => searchInput?.focus(), 80);
};

/* =========================
   BUSCADOR DE CLIENTE EN MODAL
========================= */
function setupClienteSearchModal() {
  const input    = document.getElementById("addClienteSearch");
  const dropdown = document.getElementById("addClienteDropdown");
  const hidden   = document.getElementById("addCliente");
  if (!input) return;

  const clientesOrdenados = () => [...clientes].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
  );

  function renderOpciones(lista, query) {
    if (!lista.length) {
      dropdown.innerHTML = `<div class="cliente-empty">Sin resultados</div>`;
    } else {
      const re = query
        ? new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
        : null;
      dropdown.innerHTML = lista.map(c => {
        const nombre = re ? c.nombre.replace(re, "<mark>$1</mark>") : c.nombre;
        return `<div class="cliente-option" data-id="${c.id_cliente}" data-nombre="${c.nombre}">${nombre}</div>`;
      }).join("");
      dropdown.querySelectorAll(".cliente-option").forEach(el => {
        el.addEventListener("mousedown", e => {
          e.preventDefault();
          hidden.value = el.dataset.id;
          input.value  = el.dataset.nombre;
          input.classList.add("selected");
          dropdown.classList.remove("open");
        });
      });
    }
    dropdown.classList.add("open");
  }

  input.addEventListener("focus", () => {
    const q = input.value.trim();
    const lista = q
      ? clientesOrdenados().filter(c => c.nombre.toLowerCase().includes(q.toLowerCase()))
      : clientesOrdenados();
    renderOpciones(lista, q);
  });

  input.addEventListener("input", () => {
    hidden.value = "";
    input.classList.remove("selected");
    const q = input.value.trim();
    const lista = q
      ? clientesOrdenados().filter(c => c.nombre.toLowerCase().includes(q.toLowerCase()))
      : clientesOrdenados();
    renderOpciones(lista, q);
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      dropdown.classList.remove("open");
      if (!hidden.value) input.value = "";
    }, 150);
  });
}

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
   AGREGAR CLIENTE
========================= */
function setupAgregarCliente() {
  // Inicializar el buscador del modal
  setupClienteSearchModal();

  const form = document.getElementById("formAgregarCliente");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const idCuenta  = document.getElementById("addCuentaId").value;
    const idCliente = document.getElementById("addCliente").value;
    const perfil    = document.getElementById("addPerfil").value;
    const fecha     = document.getElementById("addFechaVencimiento").value;
    const ganancia  = document.getElementById("addGanancia").value;

    if (!idCliente) return alert("Seleccioná un cliente de la lista.");

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
      fecha_registro: (() => { const n = new Date(); const p = x => String(x).padStart(2,'0'); return `${n.getFullYear()}-${p(n.getMonth()+1)}-${p(n.getDate())}T${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`; })(),
      fecha_vencimiento: fecha,
      ganancia: parseFloat(ganancia || 0),
      estado: "activa"
    }]);

    document.getElementById("modalAgregarCliente").close();

    await loadVentas();
    applyView();
  });
}

/* =========================
   EDITAR CLIENTE/VENTA — usa modal
========================= */
function setupEditarCliente() {
  const form = document.getElementById("formEditarCliente");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("editVentaId").value;
    const perfil = document.getElementById("editPerfil").value;
    const fecha = document.getElementById("editFechaVencimiento").value;

    await supabase.from("ventas")
      .update({ perfil, fecha_vencimiento: fecha })
      .eq("id_venta", id);

    document.getElementById("modalEditarCliente").close();

    await loadVentas();
    applyView();
  });
}

window.editarVenta = (id) => {
  const v = ventas.find(x => x.id_venta === id);
  if (!v) return;

  document.getElementById("editVentaId").value = id;
  document.getElementById("editPerfil").value = v.perfil || "";
  document.getElementById("editFechaVencimiento").value = v.fecha_vencimiento || "";

  document.getElementById("modalEditarCliente").showModal();
};

/* =========================
   EDITAR FECHA DE CUENTA — usa modal
========================= */
function setupEditarCuentaFecha() {
  const form = document.getElementById("formEditarCuentaFecha");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("editCuentaFechaId").value;
    const fecha = document.getElementById("editCuentaFechaVencimiento").value;

    await supabase.from("cuentas_propias")
      .update({ fecha_vencimiento: fecha })
      .eq("id_cuenta", id);

    document.getElementById("modalEditarCuentaFecha").close();

    await loadCuentas();
  });
}

window.editarFecha = (id) => {
  const c = cuentas.find(x => x.id_cuenta === id);
  if (!c) return;

  document.getElementById("editCuentaFechaId").value = id;
  document.getElementById("editCuentaFechaVencimiento").value = c.fecha_vencimiento || "";

  document.getElementById("modalEditarCuentaFecha").showModal();
};

/* =========================
   FILTRO DE PLATAFORMA
========================= */
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

window.eliminarVenta = async (id) => {
  await supabase.from("ventas")
    .delete()
    .eq("id_venta", id);

  await loadVentas();
  applyView();
};

/* =========================
   SEARCH + FILTER + SORT
========================= */
function applyView() {
  let data = [...cuentas];

  // Búsqueda por texto
  const q = (document.getElementById("search")?.value || "").toLowerCase();
  if (q) {
    data = data.filter(c =>
      getCorreo(c).toLowerCase().includes(q) ||
      c.proveedor.toLowerCase().includes(q) ||
      getPlataforma(c).toLowerCase().includes(q)
    );
  }

  // Filtro por plataforma (aplicado ANTES del sort)
  const platform = document.getElementById("filterPlatform")?.value;
  if (platform) {
    data = data.filter(c => getPlataforma(c) === platform);
  }

  // Ordenamiento
  const sort = document.getElementById("sortBy")?.value;

  if (sort === "plataforma") {
    data.sort((a, b) => {
      const sa = getPlataforma(a);
      const sb = getPlataforma(b);
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
