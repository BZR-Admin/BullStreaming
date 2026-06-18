import { supabase } from "./supabase.js";

let cuentas = [];
let clientesMap = {};

// ================= SAFE =================
async function safe(q){
  const {data,error}=await q;
  return error ? [] : data || [];
}

// ================= INIT =================
window.onload = async () => {

  await loadClientes();
  await loadCuentas();

  document.getElementById("search").addEventListener("input", render);
};

// ================= CLIENTES =================
async function loadClientes(){

  const data = await safe(
    supabase.from("clientes").select("*")
  );

  clientesMap = {};
  data.forEach(c=>{
    clientesMap[c.id_cliente]=c.nombre;
  });
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

  const search = document.getElementById("search").value.toLowerCase();
  const filter = document.getElementById("filterPlatform").value;

  let list = cuentas;

  // 🔥 FILTER
  if(filter){
    list = list.filter(c=>c.plataforma===filter);
  }

  // 🔥 SEARCH (REAL GLOBAL)
  if(search){
    list = list.filter(c=>
      (c.correo_cuenta||"").toLowerCase().includes(search) ||
      (c.plataforma||"").toLowerCase().includes(search) ||
      (c.servicio||"").toLowerCase().includes(search) ||
      (c.proveedor||"").toLowerCase().includes(search)
    );
  }

  for(const c of list){

    const used = await getUsed(c.correo_cuenta,c.id_servicio);
    const cap = await getCap(c.id_servicio);

    const card = document.createElement("div");
    card.className="card";

    card.innerHTML=`
      <div class="card-header" onclick="toggle(this)">
        <div>
          <h3>${c.plataforma||""} / ${c.servicio||""}</h3>
          <p>${c.correo_cuenta}</p>
          <p>${c.proveedor||""}</p>
          <p>${used}/${cap}</p>
          <p>${c.fecha_vencimiento||""}</p>
        </div>

        <div class="dot ${used>=cap?'red':'green'}"></div>
      </div>

      <!-- BOTONES PEQUEÑOS -->
      <div class="actions">
        <button onclick="wa('${c.correo_cuenta}','${c.plataforma}')">WA</button>
        <button onclick="editCorreo('${c.id_cuenta}','${c.correo_cuenta}')">C</button>
        <button onclick="editFecha('${c.id_cuenta}')">F</button>
        <button onclick="delCuenta('${c.id_cuenta}','${c.correo_cuenta}')">X</button>
      </div>

      <!-- CLIENTES SOLO AL EXPAND -->
      <div class="body hidden">
        ${await getClientesHTML(c.correo_cuenta)}
      </div>
    `;

    container.appendChild(card);
  }
}

// ================= CLIENTES HTML =================
async function getClientesHTML(correo){

  const data = await safe(
    supabase.from("ventas")
    .select("*")
    .eq("usuario_correo",correo)
    .eq("tipo_venta","VCP")
  );

  if(!data.length) return "<p>Sin clientes</p>";

  return data.map(v=>`
    <div class="row">
      <span>${clientesMap[v.id_cliente]||v.id_cliente} - ${v.perfil}</span>
      <button onclick="editV('${v.id_venta}')">e</button>
      <button onclick="delV('${v.id_venta}')">x</button>
    </div>
  `).join("");
}

// ================= USED =================
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

  return d?.cantidad||5;
}

// ================= TOGGLE =================
window.toggle=(el)=>{
  el.parentElement.querySelector(".body").classList.toggle("hidden");
};

// ================= SORT FIX =================
window.sortBy=(type)=>{

  if(type==="vencimiento"){
    cuentas.sort((a,b)=>
      new Date(a.fecha_vencimiento)-new Date(b.fecha_vencimiento)
    );
  }

  if(type==="disponibilidad"){
    cuentas.sort((a,b)=>
      (a.id_cuenta>b.id_cuenta?1:-1)
    );
  }

  render();
};

// ================= WHATSAPP =================
window.wa=(correo,plataforma)=>{
  window.open(`https://wa.me/?text=${encodeURIComponent(
    `Hola Bull Streaming, renovación ${correo} ${plataforma}`
  )}`);
};
