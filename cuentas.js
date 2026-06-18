import { supabase } from "./supabase.js";

let cuentas = [];
let clientes = {};
let proveedores = {};

// ================= INIT =================
window.onload = async () => {
  await loadClientes();
  await loadProveedores();
  await loadCuentas();

  document.getElementById("search").addEventListener("input", render);
};

// ================= CLIENTES MAP =================
async function loadClientes(){
  const {data} = await supabase.from("Clientes").select("*");

  data.forEach(c=>{
    clientes[c.id_cliente]=c.nombre;
  });
}

// ================= PROVEEDORES MAP =================
async function loadProveedores(){
  const {data} = await supabase.from("Proveedor").select("*");

  data.forEach(p=>{
    proveedores[p.proveedor]=p.whatsapp;
  });
}

// ================= CUENTAS =================
async function loadCuentas(){
  const {data} = await supabase.from("Cuentas_Propias").select("*");
  cuentas = data || [];
  render();
}

// ================= RENDER =================
async function render(){

  const container = document.getElementById("container");
  container.innerHTML = "";

  const search = document.getElementById("search").value.toLowerCase();

  // orden por plataforma fijo
  const ordenPlataformas = ["NETFLIX","DISNEY","PRIME","HBO","APPLE"];

  cuentas.sort((a,b)=>{
    return ordenPlataformas.indexOf(a.plataforma) - ordenPlataformas.indexOf(b.plataforma);
  });

  for(const c of cuentas){

    const clienteVentas = await supabase
      .from("Ventas")
      .select("*")
      .eq("usuario_correo", c.correo_cuenta)
      .eq("tipo_venta","VCP");

    const used = clienteVentas.data?.length || 0;

    const conf = await supabase
      .from("Conf_Venta_Cuenta_Propia")
      .select("*")
      .eq("id_servicio", c.id_servicio)
      .single();

    const cap = conf.data?.cantidad || 5;

    // SEARCH REAL
    if(search){
      const match =
        (c.correo_cuenta||"").toLowerCase().includes(search) ||
        (c.proveedor||"").toLowerCase().includes(search) ||
        Object.values(clientes).some(n=>n.toLowerCase().includes(search));

      if(!match) continue;
    }

    const provWA = proveedores[c.proveedor] || "";

    const card = document.createElement("div");
    card.className="card";

    card.innerHTML = `
      <div class="card-header" onclick="toggle(this)">
        <div>
          <h3>${conf.data?.plataforma || ""} / ${conf.data?.servicio || ""}</h3>
          <p>${c.correo_cuenta}</p>
          <p>${c.proveedor}</p>
          <p>${used}/${cap}</p>
          <p>${c.fecha_vencimiento}</p>
        </div>

        <div class="dot ${used>=cap?'red':'green'}"></div>
      </div>

      <div class="actions">
        <button onclick="wa('${provWA}','${c.correo_cuenta}')">WA</button>
        <button onclick="editCorreo('${c.id_cuenta}')">Correo</button>
        <button onclick="editFecha('${c.id_cuenta}')">Fecha</button>
        <button onclick="delCuenta('${c.id_cuenta}')">Del</button>
      </div>

      <div class="body hidden">

        ${clienteVentas.data?.map(v=>`
          <div class="row">
            <span>${clientes[v.id_cliente] || v.id_cliente} - ${v.perfil}</span>
            <button onclick="editCliente('${v.id_venta}')">E</button>
            <button onclick="delCliente('${v.id_venta}')">X</button>
          </div>
        `).join("") || ""}

        <button onclick="addCliente('${c.id_cuenta}','${c.id_servicio}','${c.correo_cuenta}')">
          + Cliente
        </button>

      </div>
    `;

    container.appendChild(card);
  }
}

// ================= TOGGLE =================
window.toggle = (el)=>{
  el.parentElement.querySelector(".body").classList.toggle("hidden");
};

// ================= WHATSAPP =================
window.wa = (wa,correo)=>{
  window.open(`https://wa.me/${wa}?text=Renovar ${correo}`);
};
