import { supabase } from "./supabase.js";

let cuentas = [];
let clientesMap = {};
let sort = { venc: true, disp: true };

// ================= INIT =================
window.onload = async () => {
  await loadClientes();
  await loadCuentas();
  await loadPlataformas();
};

// ================= SAFE =================
async function safe(q){
  const {data,error}=await q;
  return error ? [] : data || [];
}

// ================= CLIENTES MAP =================
async function loadClientes(){

  const data = await safe(
    supabase.from("clientes").select("*")
  );

  clientesMap = {};
  data.forEach(c => clientesMap[c.id_cliente] = c.nombre);
}

// ================= CUENTAS =================
async function loadCuentas(){

  cuentas = await safe(
    supabase.from("cuentas_propias").select("*")
  );

  render();
}

// ================= RENDER =================
async function render(){

  const container = document.getElementById("container");
  container.innerHTML="";

  const search = (document.getElementById("search")?.value || "").toLowerCase();
  const filter = document.getElementById("filterPlatform")?.value;

  for(const c of cuentas){

    if(filter && c.plataforma !== filter) continue;

    const used = await getUsed(c.correo_cuenta, c.id_servicio);
    const cap = await getCap(c.id_servicio);

    const clientes = await getClientes(c.correo_cuenta);

    const card = document.createElement("div");
    card.className="card";

    card.innerHTML=`
      <div class="card-header" onclick="toggle(this)">

        <div class="info">
          <h3>${c.plataforma || ""} / ${c.servicio || ""}</h3>
          <p>📧 ${c.correo_cuenta}</p>
          <p>🏢 ${c.proveedor || ""}</p>
          <p>📊 ${used}/${cap}</p>
          <p>📅 ${c.fecha_vencimiento || ""}</p>
        </div>

        <div class="dot ${used>=cap?'red':'green'}"></div>

      </div>

      <!-- BOTONES PRINCIPALES (2x2) -->
      <div class="actions">

        <button onclick="wa('${c.correo_cuenta}','${c.plataforma}')">WhatsApp</button>
        <button onclick="editCorreo('${c.id_cuenta}','${c.correo_cuenta}')">Correo</button>
        <button onclick="editFecha('${c.id_cuenta}')">Fecha</button>
        <button onclick="delCuenta('${c.id_cuenta}','${c.correo_cuenta}')">Eliminar</button>

      </div>

      <!-- CLIENTES (COLAPSADO) -->
      <div class="body hidden">

        ${clientes.map(v=>`
          <div class="row">
            <span>${clientesMap[v.id_cliente]||v.id_cliente} - ${v.perfil} - ${v.fecha_vencimiento}</span>
            <button onclick="editV('${v.id_venta}')">✏</button>
            <button onclick="delV('${v.id_venta}')">🗑</button>
          </div>
        `).join("")}

        <button class="add" onclick="addCliente('${c.id_cuenta}','${c.id_servicio}','${c.correo_cuenta}')">
          + Añadir cliente
        </button>

      </div>
    `;

    container.appendChild(card);
  }
}

// ================= CLIENTES =================
async function getClientes(correo){
  return await safe(
    supabase.from("ventas")
    .select("*")
    .eq("usuario_correo",correo)
    .eq("tipo_venta","VCP")
  );
}

// ================= USO =================
async function getUsed(correo,id){
  const {count} = await supabase
    .from("ventas")
    .select("*",{count:"exact",head:true})
    .eq("usuario_correo",correo)
    .eq("id_servicio",id);

  return count||0;
}

// ================= CAP =================
async function getCap(id){
  const d = await safe(
    supabase.from("conf_venta_cuenta_propia")
    .select("cantidad")
    .eq("id_servicio",id)
    .single()
  );

  return d?.cantidad || 5;
}

// ================= TOGGLE =================
window.toggle = (el)=>{
  el.parentElement.querySelector(".body").classList.toggle("hidden");
};

// ================= WHATSAPP =================
window.wa = (correo,plataforma)=>{
  const msg = `Hola, Bull Streaming desea renovar la cuenta ${correo} de ${plataforma}.`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
};

// ================= EDIT CORREO =================
window.editCorreo = async (id,old)=>{

  const nuevo = prompt("Nuevo correo:");
  if(!nuevo) return;

  if(!confirm("Se cambiará también en clientes")) return;

  await supabase.from("cuentas_propias")
    .update({correo_cuenta:nuevo})
    .eq("id_cuenta",id);

  await supabase.from("ventas")
    .update({usuario_correo:nuevo})
    .eq("usuario_correo",old);

  loadCuentas();
};

// ================= EDIT FECHA =================
window.editFecha = async (id)=>{

  const f = prompt("Nueva fecha (YYYY-MM-DD)");
  if(!f) return;

  await supabase.from("cuentas_propias")
    .update({fecha_vencimiento:f})
    .eq("id_cuenta",id);

  loadCuentas();
};

// ================= DELETE CUENTA =================
window.delCuenta = async (id,correo)=>{

  if(!confirm("Se eliminará cuenta y clientes")) return;

  await supabase.from("cuentas_propias").delete().eq("id_cuenta",id);
  await supabase.from("ventas").delete().eq("usuario_correo",correo);

  loadCuentas();
};

// ================= CLIENTES =================
window.addCliente = async (idCuenta,idServ,correo)=>{

  const id_cliente = prompt("ID cliente:");
  const perfil = prompt("Perfil:");
  const fecha = prompt("Fecha:");

  await supabase.from("ventas").insert([{
    id_venta: crypto.randomUUID(),
    tipo_venta:"VCP",
    id_cliente,
    id_servicio:idServ,
    usuario_correo:correo,
    perfil,
    fecha_vencimiento:fecha
  }]);

  loadCuentas();
};

// ================= CLIENTE EDIT =================
window.editV = async (id)=>{
  const perfil = prompt("Perfil:");
  const fecha = prompt("Fecha:");
  await supabase.from("ventas")
    .update({perfil,fecha_vencimiento:fecha})
    .eq("id_venta",id);

  loadCuentas();
};

// ================= DELETE CLIENTE =================
window.delV = async (id)=>{
  await supabase.from("ventas").delete().eq("id_venta",id);
  loadCuentas();
};

// ================= SORT =================
window.sortBy = (type)=>{

  if(type==="vencimiento"){
    cuentas.sort((a,b)=>
      new Date(a.fecha_vencimiento)-new Date(b.fecha_vencimiento)
    );
  }

  if(type==="disponibilidad"){
    cuentas.sort((a,b)=>a.id_cuenta.localeCompare(b.id_cuenta));
  }

  render();
};
