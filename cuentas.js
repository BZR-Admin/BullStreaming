import { supabase } from "./supabase.js";

let cuentas = [];

async function load() {

  const { data } = await supabase
    .from("cuentas_propias")
    .select("*");

  cuentas = data || [];

  render();
}

load();

async function render() {

  const container = document.getElementById("container");
  container.innerHTML = "";

  for (const c of cuentas) {

    const usadas = await getUsadas(c.correo_cuenta, c.id_servicio);
    const capacidad = await getCapacidad(c.id_servicio);

    const estado = usadas >= capacidad ? "llena" : "disponible";

    const card = document.createElement("div");

    card.innerHTML = `
      <h3>${c.plataforma}</h3>
      <p>${c.correo_cuenta}</p>
      <p>${c.proveedor}</p>
      <p>${usadas}/${capacidad}</p>
      <p>${estado}</p>

      <button onclick="verClientes('${c.correo_cuenta}')">Clientes</button>
      <button onclick="eliminar('${c.id_cuenta}')">Eliminar</button>
    `;

    container.appendChild(card);
  }
}

async function getUsadas(correo, servicio) {

  const { count } = await supabase
    .from("ventas")
    .select("*", { count: "exact", head: true })
    .eq("usuario_correo", correo)
    .eq("id_servicio", servicio)
    .eq("tipo_venta", "VCP");

  return count || 0;
}

async function getCapacidad(id) {

  const { data } = await supabase
    .from("conf_venta_cuenta_propia")
    .select("cantidad")
    .eq("id_servicio", id)
    .single();

  return data?.cantidad || 5;
}
