import { supabase } from "./supabase.js";

let ventasGlobal = [];

// =====================
// CARGAR VENTAS
// =====================
async function loadVentas() {

  const { data } = await supabase
    .from("ventas")
    .select("*");

  ventasGlobal = data || [];

  render(ventasGlobal);
}

loadVentas();

// =====================
// RENDER CARDS
// =====================
function render(data) {

  const container = document.getElementById("container");
  container.innerHTML = "";

  data.forEach(v => {

    const dias = diffDays(v.fecha_vencimiento);

    let color = "green";
    if (dias <= 0) color = "red";
    else if (dias <= 2) color = "yellow";

    const card = document.createElement("div");

    card.style.padding = "12px";
    card.style.margin = "10px";
    card.style.border = "1px solid #ccc";
    card.style.background = color;

    card.innerHTML = `
      <h3>${v.plataforma}</h3>

      <p><b>Cliente:</b> ${v.id_cliente || "-"}</p>
      <p><b>Servicio:</b> ${v.id_servicio}</p>
      <p><b>Usuario:</b> ${v.usuario_correo}</p>
      <p><b>Perfil:</b> ${v.perfil}</p>
      <p><b>Vencimiento:</b> ${v.fecha_vencimiento}</p>

      ${v.tipo_venta === "VCP" ? `<p><b>Proveedor:</b> ${v.proveedor || "-"}</p>` : ""}

      <div>
        <button onclick="whatsapp('${v.usuario_correo}','${v.perfil}','${v.fecha_vencimiento}','${v.id_servicio}')">
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
    `;

    container.appendChild(card);
  });
}

// =====================
// DIAS RESTANTES
// =====================
function diffDays(date) {
  const hoy = new Date();
  const fin = new Date(date);

  return Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
}

// =====================
// WHATSAPP
// =====================
window.whatsapp = (correo, perfil, fecha) => {

  const msg = `
¡Hola! Bull Streaming te informa que está por vencer tu servicio.

Usuario: ${correo}
Perfil: ${perfil}
Fecha de vencimiento: ${fecha}

¿Deseas renovar?
  `;

  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
};

// =====================
// RENOVAR
// =====================
window.renovar = async (id) => {

  const nuevaFecha = prompt("Nueva fecha (YYYY-MM-DD)");

  if (!nuevaFecha) return;

  await supabase
    .from("ventas")
    .update({ fecha_vencimiento: nuevaFecha })
    .eq("id_venta", id);

  loadVentas();
};

// =====================
// EDITAR
// =====================
window.editar = async (id) => {

  const campo = prompt("Campo a editar: usuario / perfil / ganancia / vencimiento");
  const valor = prompt("Nuevo valor");

  if (!campo || !valor) return;

  const update = {};

  if (campo === "usuario") update.usuario_correo = valor;
  if (campo === "perfil") update.perfil = valor;
  if (campo === "ganancia") update.ganancia = Number(valor);
  if (campo === "vencimiento") update.fecha_vencimiento = valor;

  await supabase
    .from("ventas")
    .update(update)
    .eq("id_venta", id);

  loadVentas();
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

  loadVentas();
};
