import { supabase } from "./supabase.js";

let cuentas = [];

// ================= LOAD =================
window.onload = async () => {
  await loadCuentas();
  await loadPlataformasFilter();
};

// ================= SAFE =================
async function safe(query) {
  const { data, error } = await query;
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

// ================= LOAD CUENTAS =================
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

  for (const c of cuentas) {

    const usadas = await getUsadas(c.correo_cuenta, c.id_servicio);
    const capacidad = await getCapacidad(c.id_servicio);

    const estado = usadas >= capacidad ? "llena" : "disponible";

    const dias = diffDays(c.fecha_vencimiento);
    const color = getColor(dias);

    const card = document.createElement("div");
    card.className = "card";
    card.style.borderLeft = `6px solid ${color}`;

    card.innerHTML = `
      <div class="card-header" onclick="toggleCard(this)">

        <div>
          <h3>${c.plataforma}</h3>
          <p>${c.servicio}</p>
          <p>${c.correo_cuenta}</p>
          <p>${c.proveedor || ""}</p>
          <p>${usadas}/${capacidad}</p>
        </div>

        <div class="status">
          <div class="dot ${estado}"></div>
        </div>

      </div>

      <div class="card-body hidden">

        <div id="clientes-${c.id_cuenta}">Cargando clientes...</div>

        <button onclick="addCliente('${c.id_cuenta}','${c.id_servicio}','${c.correo_cuenta}')">
          + Añadir cliente
        </button>

        <div class="actions">

          <button onclick="whatsapp('${c.correo_cuenta}','${c.plataforma}','${c.proveedor}')">
            WhatsApp
          </button>

          <button onclick="editCorreo('${c.id_cuenta}','${c.correo_cuenta}')">
            Editar correo
          </button>

          <button onclick="editVencimiento('${c.id_cuenta}')">
            Editar vencimiento
          </button>

          <button onclick="deleteCuenta('${c.id_cuenta}','${c.correo_cuenta}')">
            Eliminar
          </button>

        </div>

      </div>
    `;

    container.appendChild(card);

    loadClientesCuenta(c);
  }
}

// ================= CLIENTES DE CUENTA =================
async function loadClientesCuenta(cuenta) {

  const data = await safe(
    supabase
      .from("ventas")
      .select("*")
      .eq("usuario_correo", cuenta.correo_cuenta)
      .eq("tipo_venta", "VCP")
  );

  const container = document.getElementById(`clientes-${cuenta.id_cuenta}`);
  container.innerHTML = "";

  if (!data.length) {
    container.innerHTML = "<p>Sin clientes</p>";
    return;
  }

  data.forEach(v => {

    const row = document.createElement("div");

    row.innerHTML = `
      <p>
        ${v.id_cliente || "Cliente"} - ${v.perfil} - ${v.fecha_vencimiento}
      </p>

      <button onclick="editCliente('${v.id_venta}')">Editar</button>
      <button onclick="deleteCliente('${v.id_venta}')">Eliminar</button>
    `;

    container.appendChild(row);
  });
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

// ================= DIAS =================
function diffDays(date) {

  const hoy = new Date();
  const f = new Date(date);

  return Math.ceil((f - hoy) / (1000 * 60 * 60 * 24));
}

// ================= COLORES =================
function getColor(dias) {
  if (dias <= 0) return "red";
  if (dias <= 2) return "yellow";
  return "green";
}

// ================= TOGGLE CARD =================
window.toggleCard = (el) => {
  const body = el.parentElement.querySelector(".card-body");
  body.classList.toggle("hidden");
};

// ================= WHATSAPP =================
window.whatsapp = (correo, plataforma, proveedor) => {

  const msg = `Hola, Bull Streaming desea renovar la cuenta ${correo} de ${plataforma}. ¿Puedo hacerlo?`;

  window.open(
    `https://wa.me/?text=${encodeURIComponent(msg)}`,
    "_blank"
  );
};

// ================= EDIT CORREO =================
window.editCorreo = async (id, oldCorreo) => {

  const nuevo = prompt("Nuevo correo:");

  if (!nuevo) return;

  const ok = confirm("Esto cambiará también los clientes asociados");

  if (!ok) return;

  await supabase
    .from("cuentas_propias")
    .update({ correo_cuenta: nuevo })
    .eq("id_cuenta", id);

  await supabase
    .from("ventas")
    .update({ usuario_correo: nuevo })
    .eq("usuario_correo", oldCorreo);

  loadCuentas();
};

// ================= EDIT VENCIMIENTO =================
window.editVencimiento = async (id) => {

  const fecha = prompt("Nueva fecha (YYYY-MM-DD)");

  if (!fecha) return;

  await supabase
    .from("cuentas_propias")
    .update({ fecha_vencimiento: fecha })
    .eq("id_cuenta", id);

  loadCuentas();
};

// ================= DELETE CUENTA =================
window.deleteCuenta = async (id, correo) => {

  const ok = confirm("Se eliminará la cuenta y sus clientes");

  if (!ok) return;

  await supabase.from("cuentas_propias").delete().eq("id_cuenta", id);

  await supabase.from("ventas").delete().eq("usuario_correo", correo);

  loadCuentas();
};

// ================= ADD CLIENTE =================
window.addCliente = async (idCuenta, idServicio, correo) => {

  const id_cliente = prompt("ID cliente:");
  const perfil = prompt("Perfil:");
  const fecha = prompt("Fecha vencimiento:");

  await supabase.from("ventas").insert([{
    id_venta: crypto.randomUUID(),
    tipo_venta: "VCP",
    id_cliente,
    id_servicio: idServicio,
    usuario_correo: correo,
    perfil,
    fecha_vencimiento: fecha,
    estado: "Activa",
    fecha_registro: new Date().toISOString()
  }]);

  loadCuentas();
};

// ================= CLIENTE EDIT =================
window.editCliente = async (id) => {

  const perfil = prompt("Nuevo perfil:");
  const fecha = prompt("Nueva fecha:");

  await supabase
    .from("ventas")
    .update({
      perfil,
      fecha_vencimiento: fecha
    })
    .eq("id_venta", id);

  loadCuentas();
};

// ================= DELETE CLIENTE =================
window.deleteCliente = async (id) => {

  await supabase
    .from("ventas")
    .delete()
    .eq("id_venta", id);

  loadCuentas();
};

// ================= PLATAFORMAS FILTER =================
async function loadPlataformasFilter() {

  const data = await safe(
    supabase.from("cuentas_propias").select("plataforma")
  );

  const sel = document.getElementById("filterPlatform");

  const unique = [...new Set(data.map(d => d.plataforma))];

  unique.forEach(p => {
    sel.innerHTML += `<option value="${p}">${p}</option>`;
  });
}

// ================= FILTER =================
window.filterPlatform = () => {

  const value = document.getElementById("filterPlatform").value;

  if (!value) return loadCuentas();

  cuentas = cuentas.filter(c => c.plataforma === value);

  render();
};
