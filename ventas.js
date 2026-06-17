import { supabase } from "./supabase.js";

let mode = "VI";

// ================= INIT =================
window.onload = async () => {
  await loadClientes();
  await loadPlataformas();
  await loadProveedores();
};

// ================= CLIENTES =================
async function loadClientes() {
  const { data } = await supabase.from("clientes").select("*");

  const sel = document.getElementById("cliente");
  sel.innerHTML = "<option>Cliente</option>";

  data.forEach(c => {
    sel.innerHTML += `<option value="${c.id_cliente}">${c.nombre}</option>`;
  });
}

// ================= PLATAFORMAS =================
async function loadPlataformas() {
  const { data } = await supabase.from("conf_venta_cuenta_propia").select("plataforma");

  const sel = document.getElementById("plataforma");
  sel.innerHTML = "<option>Plataforma</option>";

  const unique = [...new Set(data.map(d => d.plataforma))];

  unique.forEach(p => {
    sel.innerHTML += `<option value="${p}">${p}</option>`;
  });
}

// ================= SERVICIOS DEPENDIENTE =================
window.loadServicios = async () => {

  const plataforma = document.getElementById("plataforma").value;

  const { data } = await supabase
    .from("conf_venta_cuenta_propia")
    .select("*")
    .eq("plataforma", plataforma);

  const sel = document.getElementById("servicio");
  sel.innerHTML = "";

  data.forEach(s => {
    sel.innerHTML += `<option value="${s.id_servicio}">${s.servicio}</option>`;
  });
};

// ================= PROVEEDORES =================
async function loadProveedores() {
  const { data } = await supabase.from("proveedores").select("*");

  const sel = document.getElementById("proveedor");
  sel.innerHTML = "";

  data.forEach(p => {
    sel.innerHTML += `<option value="${p.proveedor}">${p.proveedor}</option>`;
  });
}

// ================= MODE =================
window.setMode = (m) => {
  mode = m;

  document.getElementById("proveedor").style.display =
    m === "VCP" ? "block" : "none";
};

// ================= SAVE =================
window.saveVenta = async () => {

  const venta = {
    id_venta: crypto.randomUUID(),
    tipo_venta: mode,
    id_cliente: document.getElementById("cliente").value,
    plataforma: document.getElementById("plataforma").value,
    id_servicio: document.getElementById("servicio").value,
    usuario_correo: document.getElementById("correo").value,
    perfil: document.getElementById("perfil").value,
    fecha_vencimiento: document.getElementById("vencimiento").value,
    ganancia: Number(document.getElementById("ganancia").value || 0),
    estado: "Activa",
    fecha_registro: new Date().toISOString()
  };

  const { error } = await supabase.from("ventas").insert([venta]);

  if (error) return alert("Error al guardar");

  alert("Venta registrada ✔");
};
