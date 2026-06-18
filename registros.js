import { supabase } from "./supabase.js";

let ventas = [];
let clientesMap = {};

// ===================== INIT =====================
window.onload = async () => {

  await loadClientes();
  await loadVentas();

  setupFilters();
};

// ===================== CLIENTES =====================
async function loadClientes() {

  const { data } = await supabase.from("clientes").select("*");

  if (!Array.isArray(data)) return;

  data.forEach(c => {
    clientesMap[c.id_cliente] = {
      nombre: c.nombre,
      whatsapp: c.whatsapp
    };
  });
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
  render(ventas);
}

// ===================== PLATAFORMAS =====================
function setupPlatformOptions() {

  const select = document.getElementById("filterPlatform");
  if (!select) return;

  const set = new Set();

  ventas.forEach(v => {
    if (v.plataforma) set.add(v.plataforma);
  });

  select.innerHTML = `<option value="">Todas las plataformas</option>`;

  [...set].forEach(p => {
    select.innerHTML += `<option value="${p}">${p}</option>`;
  });
}

// ===================== RENDER =====================
function render(data) {

  const container = document.getElementById("container");
  container.innerHTML = "";

  data.forEach(v => {

    const cliente = clientesMap[v.id_cliente] || {
      nombre: "Sin cliente",
      whatsapp: ""
    };

    // 🔥 FIX SERVICIO (sin ID)
    const servicioNombre =
      v.servicio_nombre ||
      v.servicio ||
      v.plan ||
      v.id_servicio ||
      "Servicio";

    const dias = diff(v.fecha_vencimiento);
    const color = getColor(dias);

    const card = document.createElement("div");
    card.className = `card ${color}`;

    card.innerHTML = `
      <div class="card-header" onclick="toggleCard(this.parentElement)">

        <div>
          <h3>${cliente.nombre}</h3>
          <p>${v.plataforma} / ${servicioNombre}</p>
          <p>${v.usuario_correo || ""}</p>
          <p><b>Vence:</b> ${v.fecha_vencimiento}</p>
        </div>

        <div>
          <span>${dias} días</span>
        </div>

      </div>

      <div class="card-body hidden">

        <p><b>Cliente:</b> ${cliente.nombre}</p>
        <p><b>WhatsApp:</b> ${cliente.whatsapp || "-"}</p>
        <p><b>Plataforma:</b> ${v.plataforma}</p>
        <p><b>Servicio:</b> ${servicioNombre}</p>
        <p><b>Usuario:</b> ${v.usuario_correo}</p>
        <p><b>Perfil:</b> ${v.perfil}</p>
        <p><b>Vencimiento:</b> ${v.fecha_vencimiento}</p>

        <div class="btn-grid">

          <button onclick="sendWhatsApp(
            '${cliente.whatsapp}',
            '${v.usuario_correo}',
            '${v.perfil}',
            '${v.fecha_vencimiento}',
            '${v.plataforma}'
          )">💬 WhatsApp</button>

          <button onclick="renovar('${v.id_venta}')">🔁 Renovar</button>
          <button onclick="editar('${v.id_venta}')">✏️ Editar</button>
          <button onclick="eliminar('${v.id_venta}')">🗑️ Eliminar</button>

        </div>

      </div>
    `;

    container.appendChild(card);
  });
}

// ===================== TOGGLE =====================
window.toggleCard = (el) => {
  const body = el.querySelector(".card-body");
  if (!body) return;
  body.classList.toggle("hidden");
};

// ===================== DIAS =====================
function diff(date) {
  return Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
}

// ===================== COLOR =====================
function getColor(dias) {

  if (dias <= 0) return "red";
  if (dias <= 2) return "yellow";
  return "green";
}

// ===================== WHATSAPP =====================
window.sendWhatsApp = (tel, usuario, perfil, fecha, plataforma) => {

  if (!tel) return;

  const msg = `¡Hola! Bull Streaming te informa que está por vencer tu servicio de ${plataforma}.

Usuario: ${usuario}
Perfil: ${perfil}
Fecha de vencimiento: ${fecha}

¿Deseas renovar?`;

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

  const campo = prompt("usuario / perfil / fecha");
  const valor = prompt("nuevo valor");

  if (!campo || !valor) return;

  let update = {};

  if (campo === "usuario") update.usuario_correo = valor;
  if (campo === "perfil") update.perfil = valor;
  if (campo === "fecha") update.fecha_vencimiento = valor;

  await supabase
    .from("ventas")
    .update(update)
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

  function apply() {

    let data = [...ventas];

    // 🔍 SEARCH GLOBAL
    const q = (search?.value || "").toLowerCase();

    if (q) {
      data = data.filter(v => {

        const cliente = clientesMap[v.id_cliente]?.nombre || "";
        const servicio = v.servicio || v.servicio_nombre || "";
        const correo = v.usuario_correo || "";

        return (
          cliente.toLowerCase().includes(q) ||
          servicio.toLowerCase().includes(q) ||
          correo.toLowerCase().includes(q) ||
          v.plataforma?.toLowerCase().includes(q) ||
          v.perfil?.toLowerCase().includes(q)
        );
      });
    }

    // 🟦 FILTRO PLATAFORMA
    if (platform?.value) {
      data = data.filter(v => v.plataforma === platform.value);
    }

    // ⏳ SORT SOLO FECHAS
    if (sort?.value === "fecha_vencimiento") {
      data.sort((a, b) =>
        new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento)
      );
    }

    if (sort?.value === "fecha_registro") {
      data.sort((a, b) =>
        new Date(a.fecha_registro) - new Date(b.fecha_registro)
      );
    }

    render(data);
  }

  search?.addEventListener("input", apply);
  platform?.addEventListener("change", apply);
  sort?.addEventListener("change", apply);
}
