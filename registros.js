import { supabase } from "./supabase.js";

let ventas = [];

// =====================
// CARGAR DATOS
// =====================
async function load() {

  const { data } = await supabase
    .from("ventas")
    .select("*");

  ventas = data || [];

  render();
}

load();

// =====================
// RENDER CARDS
// =====================
function render() {

  const container = document.getElementById("container");
  container.innerHTML = "";

  ventas.forEach(v => {

    const dias = diff(v.fecha_vencimiento);

    let colorClass = "green";
    if (dias <= 0) colorClass = "red";
    else if (dias <= 2) colorClass = "yellow";

    const card = document.createElement("div");
    card.className = `card ${colorClass}`;

    card.innerHTML = `
      
      <h3>${v.plataforma}</h3>

      <div onclick="toggle(this.parentElement)" style="cursor:pointer;">
        <p><b>${v.usuario_correo}</b></p>
        <p>${v.perfil}</p>
        <p>Vence: ${v.fecha_vencimiento}</p>
      </div>

      <div class="card-content">

        <hr>

        <p><b>Cliente:</b> ${v.id_cliente || "-"}</p>
        <p><b>Servicio:</b> ${v.id_servicio}</p>
        <p><b>Tipo:</b> ${v.tipo_venta}</p>

        <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">

          <button onclick="whatsapp('${v.usuario_correo}','${v.perfil}','${v.fecha_vencimiento}')">
            WhatsApp
          </button>

          <button onclick="renovar('${v.id_venta}')">
            Renovar
          </button>

          <button onclick="editar('${v.id_venta}')">
            Editar
          </button>

          <button onclick="eliminar('${v.id_venta}')">
            Eliminar
          </button>

        </div>

      </div>
    `;

    container.appendChild(card);
  });
}

// =====================
// EXPANDIR TARJETA
// =====================
window.toggle = (el) => {
  el.classList.toggle("active");
};

// =====================
// DIAS RESTANTES
// =====================
function diff(date) {
  return Math.ceil((new Date(date) - new Date()) / 86400000);
}

// =====================
// WHATSAPP
// =====================
window.whatsapp = (correo, perfil, fecha) => {

  const msg = `
Hola 👋 Bull Streaming

Usuario: ${correo}
Perfil: ${perfil}
Vence: ${fecha}

¿Deseas renovar?
  `;

  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
};

// =====================
// RENOVAR
// =====================
window.renovar = async (id) => {

  const nueva = prompt("Nueva fecha (YYYY-MM-DD)");

  if (!nueva) return;

  await supabase
    .from("ventas")
    .update({ fecha_vencimiento: nueva })
    .eq("id_venta", id);

  load();
};

// =====================
// EDITAR
// =====================
window.editar = async (id) => {

  const campo = prompt("Campo: usuario / perfil / ganancia / vencimiento");
  const valor = prompt("Nuevo valor");

  if (!campo || !valor) return;

  let update = {};

  if (campo === "usuario") update.usuario_correo = valor;
  if (campo === "perfil") update.perfil = valor;
  if (campo === "ganancia") update.ganancia = Number(valor);
  if (campo === "vencimiento") update.fecha_vencimiento = valor;

  await supabase
    .from("ventas")
    .update(update)
    .eq("id_venta", id);

  load();
};

// =====================
// ELIMINAR
// =====================
window.eliminar = async (id) => {

  if (!confirm("¿Eliminar venta?")) return;

  await supabase
    .from("ventas")
    .delete()
    .eq("id_venta", id);

  load();
};
