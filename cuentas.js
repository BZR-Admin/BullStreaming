import { supabase } from "./supabase.js";

let cuentasGlobal = [];

// =====================
// CARGAR CUENTAS
// =====================
async function loadCuentas() {

  const { data: cuentas } = await supabase
    .from("cuentas_propias")
    .select("*");

  cuentasGlobal = cuentas || [];

  render(cuentasGlobal);
}

loadCuentas();

// =====================
// RENDER CARDS
// =====================
function render(data) {

  const container = document.getElementById("container");
  container.innerHTML = "";

  data.forEach(async (c) => {

    const usadas = await countVentas(c.usuario_correo);

    const capacidad = await getCapacidad(c.id_servicio);

    const estado = usadas >= capacidad ? "llena" : "disponible";

    const dias = diffDays(c.fecha_vencimiento);

    let color = "green";
    if (dias <= 0) color = "red";
    else if (dias <= 2) color = "yellow";

    const card = document.createElement("div");
    card.style.border = "1px solid #ccc";
    card.style.margin = "10px";
    card.style.padding = "10px";
    card.style.background = color;

    card.innerHTML = `
      <div>
        <span style="font-size:20px">
          ${estado === "disponible" ? "🟢" : "🔴"}
        </span>

        <h3>${c.plataforma}</h3>

        <p>${c.usuario_correo}</p>
        <p>${c.id_servicio}</p>
        <p>${c.fecha_vencimiento}</p>

        <p>${usadas}/${capacidad}</p>

        <button onclick="viewClients('${c.usuario_correo}')">
          Clientes
        </button>

        <button onclick="editCuenta('${c.id_cuenta}')">
          Editar
        </button>

        <button onclick="deleteCuenta('${c.id_cuenta}')">
          Eliminar
        </button>

        <button onclick="whatsappProveedor('${c.proveedor}')">
          WhatsApp
        </button>

      </div>
    `;

    container.appendChild(card);
  });
}

// =====================
// CONTAR VENTAS
// =====================
async function countVentas(email) {

  const { count } = await supabase
    .from("ventas")
    .select("*", { count: "exact", head: true })
    .eq("usuario_correo", email)
    .eq("tipo_venta", "VCP");

  return count || 0;
}

// =====================
// CAPACIDAD
// =====================
async function getCapacidad(id_servicio) {

  const { data } = await supabase
    .from("conf_venta_cuenta_propia")
    .select("cantidad")
    .eq("id_servicio", id_servicio)
    .single();

  return data?.cantidad || 5;
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
// VER CLIENTES
// =====================
window.viewClients = async (email) => {

  const { data } = await supabase
    .from("ventas")
    .select("*")
    .eq("usuario_correo", email)
    .eq("tipo_venta", "VCP");

  alert(JSON.stringify(data));
};

// =====================
// ELIMINAR CUENTA
// =====================
window.deleteCuenta = async (id) => {

  if (!confirm("Se eliminará la cuenta y sus clientes")) return;

  const { data: cuenta } = await supabase
    .from("cuentas_propias")
    .delete()
    .eq("id_cuenta", id);

  await supabase
    .from("ventas")
    .delete()
    .eq("id_servicio", id);

  loadCuentas();
};

// =====================
// WHATSAPP
// =====================
window.whatsappProveedor = (numero) => {

  const msg = `Hola Bull Streaming desea renovar esta cuenta:`;

  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`);
};
