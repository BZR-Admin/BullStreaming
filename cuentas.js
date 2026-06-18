import { supabase } from "./supabase.js";

let cuentas = [];
let clientesMap = {};
let proveedoresMap = {};

// ================= INIT =================
window.onload = async () => {
  await loadClientes();
  await loadProveedores();
  await loadCuentas();

  document.getElementById("search").addEventListener("input", render);
};

// ================= CLIENTES =================
async function loadClientes() {
  const { data } = await supabase.from("clientes").select("*");

  (data || []).forEach(c => {
    clientesMap[c.id_cliente] = c.nombre;
  });
}

// ================= PROVEEDORES =================
async function loadProveedores() {
  const { data } = await supabase.from("proveedores").select("*");

  (data || []).forEach(p => {
    proveedoresMap[p.proveedor] = p.whatsapp;
  });
}

// ================= CUENTAS =================
async function loadCuentas() {
  const { data } = await supabase.from("cuentas_propias").select("*");

  // 🔥 eliminar duplicados por id_cuenta
  const unique = [...new Map((data || []).map(c => [c.id_cuenta, c])).values()];

  cuentas = unique;
  render();
}

// ================= RENDER =================
async function render() {

  const container = document.getElementById("container");
  container.innerHTML = "";

  const search = (document.getElementById("search").value || "").toLowerCase();

  for (const c of cuentas) {

    // 🔥 ventas de esa cuenta
    const { data: ventas } = await supabase
      .from("ventas")
      .select("*")
      .eq("usuario_correo", c.correo_cuenta)
      .eq("tipo_venta", "vcp");

    const used = ventas?.length || 0;

    const { data: conf } = await supabase
      .from("conf_venta_cuenta_propia")
      .select("*")
      .eq("id_servicio", c.id_servicio)
      .single();

    const cap = conf?.cantidad || 5;

    const clienteNames = (ventas || [])
      .map(v => clientesMap[v.id_cliente])
      .join(" ");

    // ================= SEARCH REAL =================
    const match =
      !search ||
      (c.correo_cuenta || "").toLowerCase().includes(search) ||
      (c.proveedor || "").toLowerCase().includes(search) ||
      (conf?.plataforma || "").toLowerCase().includes(search) ||
      (conf?.servicio || "").toLowerCase().includes(search) ||
      clienteNames.toLowerCase().includes(search);

    if (!match) continue;

    const wa = proveedoresMap[c.proveedor] || "";

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-header" onclick="toggle(this)">
        <div>
          <h3>${conf?.plataforma || ""} / ${conf?.servicio || ""}</h3>
          <p>${c.correo_cuenta}</p>
          <p>${c.proveedor}</p>
          <p>${used}/${cap}</p>
          <p>${c.fecha_vencimiento || ""}</p>
        </div>

        <div class="dot ${used >= cap ? 'red' : 'green'}"></div>
      </div>

      <div class="actions">
        <button onclick="wa('${wa}','${c.correo_cuenta}')">WA</button>
        <button onclick="editCorreo('${c.id_cuenta}')">✏️C</button>
        <button onclick="editFecha('${c.id_cuenta}')">📅F</button>
        <button onclick="delCuenta('${c.id_cuenta}')">🗑</button>
      </div>

      <div class="body hidden">

        ${(ventas || []).map(v => `
          <div class="row">
            <span>${clientesMap[v.id_cliente] || "cliente"} - ${v.perfil}</span>
            <button class="mini" onclick="editCliente('${v.id_venta}')">✏</button>
            <button class="mini danger" onclick="delCliente('${v.id_venta}')">x</button>
          </div>
        `).join("")}

        <button class="addBtn" onclick="addCliente('${c.id_cuenta}','${c.id_servicio}','${c.correo_cuenta}')">
          + cliente
        </button>

      </div>
    `;

    container.appendChild(card);
  }
}

// ================= TOGGLE =================
window.toggle = (el) => {
  el.parentElement.querySelector(".body").classList.toggle("hidden");
};

// ================= WHATSAPP =================
window.wa = (num, correo) => {
  if (!num) return alert("sin whatsapp proveedor");

  window.open(`https://wa.me/${num}?text=${encodeURIComponent(
    "Renovar cuenta " + correo
  )}`);
};

// ================= EDIT CLIENTE =================
window.editCliente = async (id) => {
  const nuevoPerfil = prompt("Nuevo perfil");
  const nuevaFecha = prompt("Nueva fecha (YYYY-MM-DD)");

  await supabase.from("ventas")
    .update({ perfil: nuevoPerfil, fecha_vencimiento: nuevaFecha })
    .eq("id_venta", id);

  loadCuentas();
};

// ================= DELETE CLIENTE =================
window.delCliente = async (id) => {
  await supabase.from("ventas")
    .delete()
    .eq("id_venta", id);

  loadCuentas();
};

// ================= ADD CLIENTE =================
window.addCliente = async (idCuenta, idServicio, correo) => {

  const cliente = prompt("ID cliente");
  const perfil = prompt("Perfil");
  const fecha = prompt("Fecha vencimiento");

  await supabase.from("ventas").insert([{
    id_venta: crypto.randomUUID(),
    tipo_venta: "vcp",
    id_cliente: cliente,
    id_servicio: idServicio,
    usuario_correo: correo,
    perfil,
    fecha_vencimiento: fecha,
    estado: "Activa"
  }]);

  loadCuentas();
};

// ================= PLACEHOLDERS =================
window.editCorreo = async (id) => alert("editar correo pendiente");
window.editFecha = async (id) => alert("editar fecha pendiente");
window.delCuenta = async (id) => alert("delete cuenta pendiente");
