import { supabase } from "./supabase.js";

let ventas = [];

async function load() {

  const { data } = await supabase
    .from("ventas")
    .select("*");

  ventas = data || [];

  render();
}

load();

function render() {

  const container = document.getElementById("container");
  container.innerHTML = "";

  ventas.forEach(v => {

    const dias = diff(v.fecha_vencimiento);

    let color = "green";
    if (dias <= 0) color = "red";
    else if (dias <= 2) color = "yellow";

    const card = document.createElement("div");
    card.style.background = color;

    card.innerHTML = `
      <h3>${v.plataforma}</h3>
      <p>${v.usuario_correo}</p>
      <p>${v.perfil}</p>
      <p>${v.fecha_vencimiento}</p>

      <button onclick="whatsapp('${v.usuario_correo}','${v.perfil}','${v.fecha_vencimiento}')">WhatsApp</button>
      <button onclick="eliminar('${v.id_venta}')">Eliminar</button>
    `;

    container.appendChild(card);
  });
}

function diff(date) {
  return Math.ceil((new Date(date) - new Date()) / 86400000);
}

window.eliminar = async (id) => {

  await supabase
    .from("ventas")
    .delete()
    .eq("id_venta", id);

  load();
};

window.whatsapp = (correo, perfil, fecha) => {

  const msg = `
Hola Bull Streaming:
Usuario: ${correo}
Perfil: ${perfil}
Vence: ${fecha}
  `;

  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
};
