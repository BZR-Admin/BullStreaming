import { supabase } from "./supabase.js";

let ventas = [];
let clientesMap = {};
let serviciosMap = {};
let plataformas = [];

// ===================== INIT =====================
window.onload = async () => {
  await Promise.all([
    loadClientes(),
    loadServicios(),
    loadVentas()
  ]);

  setupEvents();
};

// ===================== CLIENTES =====================
async function loadClientes() {
  const { data } = await supabase.from("clientes").select("*");

  data.forEach(c => {
    clientesMap[c.id_cliente] = {
      nombre: c.nombre,
      whatsapp: c.whatsapp
    };
  });
}

// ===================== SERVICIOS =====================
async function loadServicios() {
  const { data } = await supabase.from("servicios").select("*");

  data.forEach(s => {
    serviciosMap[s.id_servicio] = s.nombre;
  });
}

// ===================== VENTAS =====================
async function loadVentas() {
  const { data } = await supabase.from("ventas").select("*");

  ventas = data || [];

  extractPlatforms();
  render(ventas);
}

// ===================== EXTRAE PLATAFORMAS =====================
function extractPlatforms() {
  const set = new Set();

  ventas.forEach(v => {
    if (v.plataforma) set.add(v.plataforma);
  });

  plataformas = [...set];

  const select = document.getElementById("filterPlatform");
  select.innerHTML = `<option value="">Plataforma</option>`;

  plataformas.forEach(p => {
    select.innerHTML += `<option value="${p}">${p}</option>`;
  });
}

// ===================== RENDER =====================
function render(data) {

  const container = document.getElementById("container");
  container.innerHTML = "";

  data.forEach(v => {

    const cliente = clientesMap[v.id_cliente] || { nombre: "Sin cliente", whatsapp: "" };
    const servicioNombre = serviciosMap[v.id_servicio] || "Servicio desconocido";

    const dias = getDays(v.fecha_vencimiento);
    const color = getColor(dias);

    const card = document.createElement("div");
    card.className = `card ${color}`;

    card.innerHTML = `
      <div class="card-header" onclick="toggle(this.parentElement)">
        
        <div>
          <h3>${cliente.nombre}</h3>
          <p>${v.plataforma} / ${servicioNombre}</p>
          <p>${v.usuario_correo}</p>
          <p><b>Vence:</b> ${v.fecha_vencimiento}</p>
        </div>

        <div>
          <span>${dias} días</span>
        </div>

      </div>

      <div class="card-body hidden">

        <p><b>Cliente:</b> ${cliente.nombre}</p>
        <p><b>WhatsApp:</b> ${cliente.whatsapp}</p>
        <p><b>Plataforma:</b> ${v.plataforma}</p>
        <p><b>Servicio:</b> ${servicioNombre}</p>
        <p><b>Usuario:</b> ${v.usuario_correo}</p>
        <p><b>Perfil:</b> ${v.perfil}</p>
        <p><b>Vencimiento:</b> ${v.fecha_vencimiento}</p>

        <div class="card-actions">

          <button onclick="sendWhatsApp(
            '${cliente.whatsapp}',
            '${v.usuario_correo}',
            '${v.perfil}',
            '${v.fecha_vencimiento}',
            '${servicioNombre}'
          )">
            WhatsApp
          </button>

          <button onclick="renovar('${v.id_venta}')">Renovar</button>
          <button onclick="editar('${v.id_venta}')">Editar</button>
          <button onclick="eliminar('${v.id_venta}')">Eliminar</button>

        </div>

      </div>
    `;

    container.appendChild(card);
  });
}

// ===================== TOGGLE =====================
window.toggle = (el) => {
  const body = el.querySelector(".card-body");
  body.classList.toggle("hidden");
};

// ===================== DIAS =====================
function getDays(date) {
  return Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
}

// ===================== COLOR LOGIC =====================
function getColor(dias) {
  if (dias <= 0) return "red";
  if (dias <= 2) return "yellow";
  return "green";
}

// ===================== WHATSAPP RENOVACIÓN =====================
window.sendWhatsApp = (telefono, usuario, perfil, fecha, servicio) => {

  const msg = `¡Hola! Bull Streaming te informa que está por vencer tu servicio de Perfil de ${servicio}.

Usuario: ${usuario}
Perfil: ${perfil}
Fecha de vencimiento: ${fecha}

¿Puedes confirmar si deseas renovar?`;

  const url = `https://wa.me/${telefono}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
};

// ===================== RENOVAR =====================
window.renovar = async (id) => {

  const nueva = prompt("Nueva fecha de vencimiento (YYYY-MM-DD)");

  if (!nueva) return;

  await supabase
    .from("ventas")
    .update({ fecha_vencimiento: nueva })
    .eq("id_venta", id);

  loadVentas();
};

// ===================== EDITAR =====================
window.editar = async (id) => {

  const campo = prompt("Campo: usuario / perfil / fecha");
  const valor = prompt("Nuevo valor");

  if (!campo || !valor) return;

  let update = {};

  if (campo === "usuario") update.usuario_correo = valor;
  if (campo === "perfil") update.perfil = valor;
  if (campo === "fecha") update.fecha_vencimiento = valor;

  await supabase
    .from("ventas")
    .update(update)
    .eq("id_venta", id);

  loadVentas();
};

// ===================== ELIMINAR =====================
window.eliminar = async (id) => {

  if (!confirm("¿Eliminar venta?")) return;

  await supabase
    .from("ventas")
    .delete()
    .eq("id_venta", id);

  loadVentas();
};

// ===================== FILTROS + BUSQUEDA + SORT =====================
function setupEvents() {

  const search = document.getElementById("search");
  const platform = document.getElementById("filterPlatform");
  const sortBy = document.getElementById("sortBy");
  const sortDir = document.getElementById("sortDirection");

  function apply() {

    let data = [...ventas];

    // SEARCH GLOBAL
    const q = search.value.toLowerCase();

    if (q) {
      data = data.filter(v => {
        const cliente = clientesMap[v.id_cliente]?.nombre || "";
        const servicio = serviciosMap[v.id_servicio] || "";

        return (
          cliente.toLowerCase().includes(q) ||
          servicio.toLowerCase().includes(q) ||
          v.usuario_correo?.toLowerCase().includes(q) ||
          v.plataforma?.toLowerCase().includes(q) ||
          v.perfil?.toLowerCase().includes(q)
        );
      });
    }

    // PLATFORM FILTER
    if (platform.value) {
      data = data.filter(v => v.plataforma === platform.value);
    }

    // SORT
    const key = sortBy.value;
    const dir = sortDir.value === "asc" ? 1 : -1;

    data.sort((a, b) => {
      if (!a[key]) return 0;
      if (!b[key]) return 0;

      return a[key].toString().localeCompare(b[key].toString()) * dir;
    });

    render(data);
  }

  search.addEventListener("input", apply);
  platform.addEventListener("change", apply);
  sortBy.addEventListener("change", apply);
  sortDir.addEventListener("change", apply);
}

// ===================== RELOAD =====================
window.reload = () => loadVentas();
