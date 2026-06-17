import { supabase } from "./supabase.js";

// =====================
// CARGAR SERVICIOS
// =====================
async function loadServicios() {

  const { data } = await supabase
    .from("conf_venta_cuenta_propia")
    .select("*");

  const select = document.getElementById("servicio");

  data.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id_servicio;
    opt.textContent = `${s.plataforma} - ${s.servicio}`;
    select.appendChild(opt);
  });
}

loadServicios();

// =====================
// GUARDAR COMPRA
// =====================
window.saveCompra = async () => {

  const compra = {
    id_cuenta: crypto.randomUUID(),
    id_servicio: document.getElementById("servicio").value,
    proveedor: document.getElementById("proveedor").value,
    correo_cuenta: document.getElementById("correo").value,
    whatsapp: document.getElementById("whatsapp").value,
    fecha_vencimiento: document.getElementById("vencimiento").value,
    estado: "Activa"
  };

  const { error } = await supabase
    .from("cuentas_propias")
    .insert([compra]);

  if (error) {
    console.error(error);
    return alert("Error al guardar compra");
  }

  alert("Compra registrada correctamente");

  limpiar();
};

// =====================
// LIMPIAR FORM
// =====================
function limpiar() {

  document.getElementById("proveedor").value = "";
  document.getElementById("correo").value = "";
  document.getElementById("whatsapp").value = "";
  document.getElementById("vencimiento").value = "";
}
