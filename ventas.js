import { supabase } from "./supabase.js";

let mode = "VI";

// ========================
// CAMBIO DE MODO
// ========================
window.setMode = (m) => {
  mode = m;

  document.getElementById("proveedor").style.display =
    m === "VCP" ? "block" : "none";
};

// ========================
// PARSER MODAL
// ========================
window.openParser = () => {
  document.getElementById("parserBox").style.display = "block";
};

window.closeParser = () => {
  document.getElementById("parserBox").style.display = "none";
};

window.clearText = () => {
  document.getElementById("texto").value = "";
};

// ========================
// PARSER INTELIGENTE
// ========================
window.parseText = async () => {
  const text = document.getElementById("texto").value;

  const email = text.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0];
  const perfil = text.match(/Perfil:\s*(.*)/i)?.[1];
  const plataforma = text.match(/DISNEY|NETFLIX|PRIME|HBO|APPLE|SPOTIFY/i)?.[0];
  const vencimiento = text.match(/Expira:\s*(.*)/i)?.[1];

  if (!email) return alert("No se detectó correo");

  document.getElementById("correo").value = email;
  document.getElementById("perfil").value = perfil || "";
  document.getElementById("plataforma").value = plataforma || "";

  if (vencimiento) {
    const date = new Date(vencimiento);
    if (!isNaN(date)) {
      document.getElementById("vencimiento").value =
        date.toISOString().split("T")[0];
    }
  }

  // SOLO VALIDACIÓN VCP
  if (mode === "VCP") {
    await validarCuenta(email);
  }
};

// ========================
// VALIDAR CUENTA + PERFIL
// ========================
async function validarCuenta(email) {
  const { data: cuentas } = await supabase
    .from("cuentas_propias")
    .select("*")
    .eq("usuario_correo", email);

  if (!cuentas || cuentas.length === 0) {
    return alert("No se encontró ninguna cuenta");
  }

  const cuenta = cuentas[0];

  const { data: ventas } = await supabase
    .from("ventas")
    .select("perfil")
    .eq("usuario_correo", email)
    .eq("tipo_venta", "VCP");

  const capacidad = await obtenerCapacidad(cuenta.id_servicio);

  const usadas = ventas?.length || 0;

  if (usadas >= capacidad) {
    return alert("Cuenta detectada está llena");
  }

  const perfilLibre = asignarPerfilLibre(ventas || [], capacidad);

  if (!perfilLibre) {
    return alert("No hay perfiles disponibles");
  }

  document.getElementById("perfil").value = perfilLibre;
}

// ========================
// CAPACIDAD SERVICIO
// ========================
async function obtenerCapacidad(id_servicio) {
  const { data } = await supabase
    .from("conf_venta_cuenta_propia")
    .select("cantidad")
    .eq("id_servicio", id_servicio)
    .single();

  return data?.cantidad || 5;
}

// ========================
// ASIGNAR PERFIL LIBRE
// ========================
function asignarPerfilLibre(ventas, capacidad) {
  const perfilesBase = Array.from(
    { length: capacidad },
    (_, i) => `Perfil${i + 1}`
  );

  const usados = ventas.map(v => v.perfil);

  return perfilesBase.find(p => !usados.includes(p));
}

// ========================
// GUARDAR VENTA
// ========================
window.saveVenta = async () => {

  const venta = {
    id_venta: crypto.randomUUID(),
    tipo_venta: mode,
    id_cliente: document.getElementById("cliente").value || null,
    plataforma: document.getElementById("plataforma").value,
    id_servicio: document.getElementById("servicio").value,
    usuario_correo: document.getElementById("correo").value,
    perfil: document.getElementById("perfil").value,
    fecha_vencimiento: document.getElementById("vencimiento").value,
    ganancia: Number(document.getElementById("ganancia").value || 0),
    estado: "Activa",
    fecha_registro: new Date().toISOString()
  };

  const { error } = await supabase
    .from("ventas")
    .insert([venta]);

  if (error) {
    console.error(error);
    return alert("Error al guardar venta");
  }

  alert("Venta registrada correctamente");

  limpiarFormulario();
};

// ========================
// LIMPIAR FORM
// ========================
function limpiarFormulario() {
  document.getElementById("cliente").value = "";
  document.getElementById("plataforma").value = "";
  document.getElementById("servicio").value = "";
  document.getElementById("correo").value = "";
  document.getElementById("perfil").value = "";
  document.getElementById("vencimiento").value = "";
  document.getElementById("ganancia").value = "";
}
