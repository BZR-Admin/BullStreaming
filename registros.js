import { supabase } from "./supabase.js";

let ventas = [];
let clientesMap = {};
let serviciosMap = {};
let cuentasPropiasSet = new Set(); // 👈 NUEVO: correos que tienen cuenta propia

// Si en Supabase tu segunda tabla tiene otro nombre exacto,
// cambia aquí el nombre, no en todo el código.
const TABLAS_CONF_SERVICIOS = [
  "conf_venta_cuenta_propia",
  "conf_venta_perfiles_independientes"
];

// ===================== INIT =====================
window.addEventListener("DOMContentLoaded", async () => {
  setupFilters();

  await loadClientes();
  await loadServicios();
  await loadCuentasPropias(); // 👈 NUEVO
  await loadVentas();
});

// ===================== HELPERS =====================
function safe(value) {
  return value === null || value === undefined ? "" : String(value);
}

function normalizeId(value) {
  return safe(value).trim();
}

function escapeHtml(value) {
  return safe(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getVentaById(id) {
  return ventas.find(v => safe(v.id_venta) === safe(id));
}

// ===================== CLIENTES =====================
async function loadClientes() {
  const { data, error } = await supabase
    .from("clientes")
    .select("*");

  if (error) {
    console.error("Error clientes:", error);
    return;
  }

  clientesMap = {};

  if (!Array.isArray(data)) return;

  data.forEach(c => {
    const id = normalizeId(c.id_cliente);

    clientesMap[id] = {
      nombre: safe(c.nombre) || "Sin cliente",
      whatsapp: safe(c.whatsapp)
    };
  });
}

// ===================== SERVICIOS =====================
async function loadServicios() {
  serviciosMap = {};

  for (const tabla of TABLAS_CONF_SERVICIOS) {
    const { data, error } = await supabase
      .from(tabla)
      .select("id_servicio, plataforma, servicio");

    if (error) {
      console.warn(`No se pudo cargar la tabla ${tabla}:`, error.message);
      continue;
    }

    if (!Array.isArray(data)) continue;

    data.forEach(s => {
      const id = normalizeId(s.id_servicio);

      if (!id) return;

      serviciosMap[id] = {
        plataforma: safe(s.plataforma),
        servicio: safe(s.servicio)
      };
    });
  }
}

// ===================== CUENTAS PROPIAS (para el enlace) =====================
async function loadCuentasPropias() {
  cuentasPropiasSet = new Set();

  const { data, error } = await supabase
    .from("cuentas_propias")
    .select("correo_cuenta");

  if (error) {
    console.warn("No se pudo cargar cuentas_propias:", error.message);
    return;
  }

  if (!Array.isArray(data)) return;

  data.forEach(c => {
    const correo = normalizeId(c.correo_cuenta).toLowerCase();
    if (correo) cuentasPropiasSet.add(correo);
  });
}

function esCuentaPropia(correo) {
  return cuentasPropiasSet.has(normalizeId(correo).toLowerCase());
}

// ===================== VENTAS =====================
async function loadVentas() {
  const { data, error } = await supabase
    .from("ventas")
    .select("*");

  if (error) {
    console.error("Error ventas:", error);
    return;
  }

  ventas = Array.isArray(data) ? data : [];

  setupPlatformOptions();

  // IMPORTANTE:
  // No hacemos render(ventas) directo.
  // Así se conserva búsqueda, filtro y orden actual.
  applyCurrentView();
}

// ===================== PLATAFORMAS =====================
function setupPlatformOptions() {
  const select = document.getElementById("filterPlatform");
  if (!select) return;

  const currentValue = select.value;

  const set = new Set();

  ventas.forEach(v => {
    if (v.plataforma) set.add(v.plataforma);
  });

  select.innerHTML = `<option value="">Todas las plataformas</option>`;

  [...set].sort().forEach(p => {
    select.innerHTML += `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`;
  });

  const exists = [...select.options].some(opt => opt.value === currentValue);

  if (exists) {
    select.value = currentValue;
  }
}

// ===================== SERVICIO POR ID =====================
function getServicioNombre(v) {

  const id = normalizeId(v.id_servicio);

  const conf = serviciosMap[id];

  if (conf?.servicio) {
    return conf.servicio; // 👈 SIEMPRE NOMBRE REAL
  }

  // fallback limpio
  if (v.servicio_nombre) return v.servicio_nombre;
  if (v.servicio) return v.servicio;
  if (v.plan) return v.plan;

  return "Servicio";
}

// ===================== CLIENTE POR ID =====================
function getCliente(v) {
  const idCliente = normalizeId(v.id_cliente);

  return clientesMap[idCliente] || {
    nombre: "Sin cliente",
    whatsapp: ""
  };
}

// ===================== FECHAS =====================
function parseDate(value) {
  if (!value) return null;

  // Si viene como serial de Excel
  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(excelEpoch.getTime() + value * 86400000);
  }

  const text = String(value).trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const [y, m, d] = text.substring(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  const parsed = new Date(text);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const date = parseDate(value);

  if (!date) return safe(value) || "-";

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function diffDays(value) {
  const date = parseDate(value);

  if (!date) return 9999;

  const today = new Date();

  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return Math.ceil((date - today) / 86400000);
}

// ===================== COLOR =====================
function getColor(dias) {
  if (dias <= 0) return "red";
  if (dias <= 2) return "yellow";
  return "green";
}

function getDiasText(dias) {
  if (dias < 0) return `Vencido hace ${Math.abs(dias)} día(s)`;
  if (dias === 0) return "Vence hoy";
  if (dias === 1) return "Falta 1 día";
  return `Faltan ${dias} días`;
}

// ===================== RENDER =====================
function render(data) {
  const container = document.getElementById("container");
  if (!container) return;

  container.innerHTML = "";

  if (!data.length) {
    container.innerHTML = `
      <div class="card">
        <h3>Sin ventas encontradas</h3>
        <p>No hay resultados para la búsqueda o filtro actual.</p>
      </div>
    `;
    return;
  }

  data.forEach(v => {
    const cliente = getCliente(v);
    const servicioNombre = getServicioNombre(v);

    const dias = diffDays(v.fecha_vencimiento);
    const color = getColor(dias);

    const fechaVencimiento = formatDate(v.fecha_vencimiento);

    // 👇 NUEVO: si el correo tiene cuenta propia, lo mostramos como enlace
    const correoHtml = esCuentaPropia(v.usuario_correo)
      ? `<a href="cuentas.html?correo=${encodeURIComponent(normalizeId(v.usuario_correo))}"
           onclick="event.stopPropagation()"
           style="color:#00c6ff; text-decoration:none; font-weight:600;">${escapeHtml(v.usuario_correo)}</a>`
      : escapeHtml(v.usuario_correo || "");

    const card = document.createElement("div");
    card.className = `card ${color}`;
    card.dataset.idVenta = safe(v.id_venta);

    card.innerHTML = `
      <div class="card-header">

        <div>
          <h3>${escapeHtml(cliente.nombre)}</h3>

          <p>
            ${escapeHtml(v.plataforma)}
            /
            ${escapeHtml(servicioNombre)}
          </p>

          <p>${correoHtml}</p>

          <p>
            <b>Vence:</b>
            ${escapeHtml(fechaVencimiento)}
          </p>
        </div>

        <div class="status-badge">
          <span>${escapeHtml(getDiasText(dias))}</span>
        </div>

      </div>

      <div class="card-body hidden">

        <div class="info-grid">
          <p><b>Cliente:</b> ${escapeHtml(cliente.nombre)}</p>
          <p><b>WhatsApp:</b> ${escapeHtml(cliente.whatsapp || "-")}</p>
          <p><b>Plataforma:</b> ${escapeHtml(v.plataforma)}</p>
          <p><b>Servicio:</b> ${escapeHtml(servicioNombre)}</p>
          <p><b>Usuario:</b> ${correoHtml}</p>
          <p><b>Perfil:</b> ${escapeHtml(v.perfil)}</p>
          <p><b>Vencimiento:</b> ${escapeHtml(fechaVencimiento)}</p>
        </div>

        <div class="btn-grid">

          <button type="button" data-action="whatsapp" data-id="${escapeHtml(v.id_venta)}">
            💬 WhatsApp
          </button>

          <button type="button" data-action="renovar" data-id="${escapeHtml(v.id_venta)}">
            🔁 Renovar
          </button>

          <button type="button" data-action="editar" data-id="${escapeHtml(v.id_venta)}">
            ✏️ Editar
          </button>

          <button type="button" data-action="eliminar" data-id="${escapeHtml(v.id_venta)}">
            🗑️ Eliminar
          </button>

        </div>

      </div>
    `;

    container.appendChild(card);
  });
}

// ===================== TOGGLE =====================
function toggleCard(card) {
  if (!card) return;

  const body = card.querySelector(".card-body");
  if (!body) return;

  body.classList.toggle("hidden");
}

window.toggleCard = toggleCard;

// ===================== WHATSAPP =====================
window.sendWhatsApp = (idVenta) => {
  const venta = getVentaById(idVenta);
  if (!venta) return;

  const cliente = getCliente(venta);
  const servicioNombre = getServicioNombre(venta);

  const tel = safe(cliente.whatsapp).replace(/\D/g, "");

  if (!tel) {
    alert("Este cliente no tiene WhatsApp registrado.");
    return;
  }

  const msg = `¡Hola! Bull Streaming te informa que está por vencer tu servicio de ${servicioNombre}.

Usuario: ${safe(venta.usuario_correo)}
Perfil: ${safe(venta.perfil)}
Fecha de vencimiento: ${formatDate(venta.fecha_vencimiento)}

¿Puedes confirmar si deseas renovar?`;

  window.open(
    `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`,
    "_blank"
  );
};

// ===================== RENOVAR =====================
window.renovar = async (id) => {
  const nueva = prompt("Nueva fecha (YYYY-MM-DD)");
  if (!nueva) return;

  await supabase
    .from("ventas")
    .update({ fecha_vencimiento: nueva })
    .eq("id_venta", id);

  await loadVentas();
};

// ===================== EDITAR =====================
window.editar = async (id) => {

  const venta = getVentaById(id);
  if (!venta) return;

  // 1. PERFIL
  const nuevoPerfil = prompt(
    `Perfil actual: ${venta.perfil}\n\nEscribe el nuevo perfil:`,
    venta.perfil
  );

  if (!nuevoPerfil) return;

  // 2. FECHA (INPUT DATE NATIVO)
  const input = document.createElement("input");
  input.type = "date";
  input.value = venta.fecha_vencimiento;

  const ok = confirm("Selecciona la nueva fecha y luego presiona ACEPTAR");

  if (!ok) return;

  const nuevaFecha = prompt(
    "Escribe la fecha en formato YYYY-MM-DD o déjalo igual:",
    venta.fecha_vencimiento
  );

  if (!nuevaFecha) return;

  await supabase
    .from("ventas")
    .update({
      perfil: nuevoPerfil,
      fecha_vencimiento: nuevaFecha
    })
    .eq("id_venta", id);

  await loadVentas();
};
// ===================== ELIMINAR =====================
window.eliminar = async (id) => {
  if (!confirm("¿Eliminar venta?")) return;

  await supabase
    .from("ventas")
    .delete()
    .eq("id_venta", id);

  await loadVentas();
};

// ===================== FILTROS + SEARCH + SORT =====================
function setupFilters() {
  const search = document.getElementById("search");
  const platform = document.getElementById("filterPlatform");
  const sort = document.getElementById("sortBy");
  const container = document.getElementById("container");

  search?.addEventListener("input", applyCurrentView);
  platform?.addEventListener("change", applyCurrentView);
  sort?.addEventListener("change", applyCurrentView);

  container?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");

    if (btn) {
      e.stopPropagation();

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === "whatsapp") window.sendWhatsApp(id);
      if (action === "renovar") window.renovar(id);
      if (action === "editar") window.editar(id);
      if (action === "eliminar") window.eliminar(id);

      return;
    }

    const header = e.target.closest(".card-header");

    if (header) {
      toggleCard(header.closest(".card"));
    }
  });
}

function applyCurrentView() {
  const search = document.getElementById("search");
  const platform = document.getElementById("filterPlatform");
  const sort = document.getElementById("sortBy");

  let data = [...ventas];

  const q = safe(search?.value).trim().toLowerCase();

  if (q) {
    data = data.filter(v => {
      const cliente = getCliente(v);
      const servicioNombre = getServicioNombre(v);

      const texto = [
        cliente.nombre,
        cliente.whatsapp,
        v.id_venta,
        v.tipo_venta,
        v.id_cliente,
        v.plataforma,
        v.id_servicio,
        servicioNombre,
        v.usuario_correo,
        v.perfil,
        formatDate(v.fecha_registro),
        formatDate(v.fecha_vencimiento),
        v.ganancia,
        v.estado
      ]
        .map(safe)
        .join(" ")
        .toLowerCase();

      return texto.includes(q);
    });
  }

  if (platform?.value) {
    data = data.filter(v => v.plataforma === platform.value);
  }

  if (sort?.value === "fecha_vencimiento") {
    data.sort((a, b) => {
      const da = parseDate(a.fecha_vencimiento);
      const db = parseDate(b.fecha_vencimiento);

      return (da?.getTime() || 0) - (db?.getTime() || 0);
    });
  }

  if (sort?.value === "fecha_registro") {
    data.sort((a, b) => {
      const da = parseDate(a.fecha_registro);
      const db = parseDate(b.fecha_registro);

      return (da?.getTime() || 0) - (db?.getTime() || 0);
    });
  }

  render(data);
}
