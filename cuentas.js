import { supabase } from "./supabase.js";

let cuentas = [];
let clientesMap = {};
let sortState = {
  vencimiento: "asc",
  disponibilidad: "desc"
};

// ================= SAFE =================
async function safe(q) {
  const { data, error } = await q;
  if (error) return [];
  return data || [];
}

// ================= INIT =================
window.onload = async () => {
  await loadClientesMap();
  await loadCuentas();
  await loadPlataformas();
};

// ================= CLIENTES MAP =================
async function loadClientesMap() {

  const data = await safe(
    supabase.from("clientes").select("*")
  );

  clientesMap = {};
  data.forEach(c => {
    clientesMap[c.id_cliente] = c.nombre;
  });
}

// ================= CUENTAS =================
async function loadCuentas() {

  cuentas = await safe(
    supabase.from("cuentas_propias").select("*")
  );

  render();
}

// ================= RENDER =================
async function render() {

  const container = document.getElementById("container");
  container.innerHTML = "";

  const filter = document.getElementById("filterPlatform")?.value || "";
  const search = document.getElementById("search")?.value?.toLowerCase() || "";

  for (const c of cuentas) {

    if (filter && c.plataforma !== filter) continue;
    if (search && !c.correo_cuenta.toLowerCase().includes(search)) continue;

    const usadas = await getUsadas(c.correo_cuenta, c.id_servicio);
    const capacidad = await getCapacidad(c.id_servicio);

    const disponibilidad = `${usadas}/${capacidad}`;

    const clientes = await getClientes(c.correo_cuenta);

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-header" onclick="toggleCard(this)">

        <div>
          <h3>${c.plataforma}</h3>
          <p>${c.servicio}</p>
          <p>${c.correo_cuenta}</p>
          <p>${c.proveedor}</p>
          <p>${disponibilidad}</p>
        </div>

        <div class="status ${usadas >= capacidad ? 'red' : 'green'}"></div>

      </div>

      <div class="card-actions">
        <button onclick="whatsapp('${c.correo_cuenta}','${c.plataforma}')">WA</button>
        <button onclick="editCorreo('${c.id_cuenta}','${c.correo_cuenta}')">E-Correo</button>
        <button onclick="editFecha('${c.id_cuenta}')">E-Fecha</button>
        <button onclick="deleteCuenta('${c.id_cuenta}','${c.correo_cuenta}')">Del</button>
      </div>

      <div class="card-body hidden">

        ${clientes.length === 0 ? "<p>Sin clientes</p>" : ""}

        ${clientes.map(v => `
          <div class="cliente-row">
            <span>${clientesMap[v.id_cliente] || v.id_cliente} - ${v.perfil} - ${v.fecha_vencimiento}</span>

            <button onclick="editCliente('${v.id_venta}')">E</button>
            <button onclick="deleteCliente('${v.id_venta}')">X</button>
          </div>
        `).join("")}

        <button onclick="addCliente('${c.id_cuenta}','${c.id_servicio}','${c.correo_cuenta}')">
          + Cliente
        </button>

      </div>
    `;

    container.appendChild(card);
  }
}

// ================= CLIENTES DE CUENTA =================
async function getClientes(correo) {

  return await safe(
    supabase
      .from("ventas")
      .select("*")
      .eq("usuario_correo", correo)
      .eq("tipo_venta", "VCP")
  );
}

// ================= USADAS =================
async function getUsadas(correo, servicio) {

  const { count } = await supabase
    .from("ventas")
    .select("*", { count: "exact", head: true })
    .eq("usuario_correo", correo)
    .eq("id_servicio", servicio)
    .eq("tipo_venta", "VCP");

  return count || 0;
}

// ================= CAPACIDAD =================
async function getCapacidad(id) {

  const data = await safe(
    supabase
      .from("conf_venta_cuenta_propia")
      .select("cantidad")
      .eq("id_servicio", id)
      .single()
  );

  return data?.cantidad || 5;
}

// ================= TOGGLE =================
window.toggleCard = (el) => {
  const body = el.parentElement.querySelector(".card-body");
  body.classList.toggle("hidden");
};

// ================= FILTER =================
window.filterPlatform = () => render();

document.getElementById("search")?.addEventListener("input", render);

// ================= SORT =================
window.sortBy = (type) => {

  if (type === "vencimiento") {
    cuentas.sort((a, b) =>
      sortState.vencimiento === "asc"
        ? new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento)
        : new Date(b.fecha_vencimiento) - new Date(a.fecha_vencimiento)
    );

    sortState.vencimiento =
      sortState.vencimiento === "asc" ? "desc" : "asc";
  }

  if (type === "disponibilidad") {
    cuentas.sort((a, b) =>
      sortState.disponibilidad === "asc"
        ? a.id_cuenta.localeCompare(b.id_cuenta)
        : b.id_cuenta.localeCompare(a.id_cuenta)
    );

    sortState.disponibilidad =
      sortState.disponibilidad === "asc" ? "desc" : "asc";
  }

  render();
};

// ================= WHATSAPP =================
window.whatsapp = (correo, plataforma) => {

  const msg = `Hola, Bull Streaming desea renovar la cuenta ${correo} de ${plataforma}. ¿Puedo hacerlo?`;

  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
};
