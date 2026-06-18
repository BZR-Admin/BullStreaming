import { supabase } from "./supabase.js";

let cuentas = [];
let clientesMap = {};
let sortState = { venc: true, disp: true };

// ================= SAFE =================
async function safe(q){
  const {data,error} = await q;
  if(error) return [];
  return data || [];
}

// ================= INIT =================
window.onload = async () => {
  await loadClientes();
  await loadCuentas();
  await loadPlataformas();
};

// ================= CLIENTES MAP =================
async function loadClientes(){

  const data = await safe(
    supabase.from("Clientes").select("*")
  );

  clientesMap = {};
  data.forEach(c=>{
    clientesMap[c.id_cliente]=c.nombre;
  });
}

// ================= CUENTAS =================
async function loadCuentas(){

  cuentas = await safe(
    supabase.from("Cuentas_Propias").select("*")
  );

  render();
}

// ================= RENDER =================
async function render(){

  const container = document.getElementById("container");
  container.innerHTML="";

  const search = document.getElementById("search").value.toLowerCase();
  const filter = document.getElementById("filterPlatform").value;

  for(const c of cuentas){

    if(filter && c.plataforma !== filter) continue;

    const used = await getUsed(c.correo_cuenta, c.id_servicio);
    const cap = await getCap(c.id_servicio);

    const clienteList = await getClientes(c.correo_cuenta);

    const card = document.createElement("div");
    card.className="card";

    card.innerHTML=`
      <div class="card-header" onclick="toggle(this)">
        <div>
          <h3>${c.plataforma || ""}</h3>
          <p>${c.servicio || ""}</p>
          <p>${c.correo_cuenta}</p>
          <p>${c.proveedor || ""}</p>
          <p>${used}/${cap}</p>
        </div>

        <div class="status ${used>=cap?'red':'green'}"></div>
      </div>

      <div class="card-actions">
        <button onclick="wa('${c.whatsapp}','${c.correo_cuenta}','${c.plataforma}')">WA</button>
        <button onclick="editCorreo('${c.id_cuenta}')">Correo</button>
        <button onclick="editFecha('${c.id_cuenta}')">Fecha</button>
        <button onclick="delCuenta('${c.id_cuenta}')">Del</button>
      </div>

      <div class="card-body hidden">

        ${clienteList.map(v=>`
          <div class="cliente-row">
            <span>${clientesMap[v.id_cliente] || v.id_cliente} - ${v.perfil} - ${v.fecha_vencimiento}</span>
            <button onclick="editV('${v.id_venta}')">E</button>
            <button onclick="delV('${v.id_venta}')">X</button>
          </div>
        `).join("")}

      </div>
    `;

    container.appendChild(card);
  }
}

// ================= CLIENTES =================
async function getClientes(correo){
  return await safe(
    supabase.from("Ventas")
    .select("*")
    .eq("usuario_correo",correo)
    .eq("tipo_venta","VCP")
  );
}

// ================= USED =================
async function getUsed(correo,id){
  const {count} = await supabase
  .from("Ventas")
  .select("*",{count:"exact",head:true})
  .eq("usuario_correo",correo)
  .eq("id_servicio",id);

  return count||0;
}

// ================= CAP =================
async function getCap(id){
  const d = await safe(
    supabase.from("Conf_Venta_Cuenta_Propia")
    .select("cantidad")
    .eq("id_servicio",id)
    .single()
  );

  return d?.cantidad || 5;
}

// ================= TOGGLE =================
window.toggle = (el)=>{
  el.parentElement.querySelector(".card-body").classList.toggle("hidden");
};
