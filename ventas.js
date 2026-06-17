import { supabase } from "./supabase.js";

let mode = "VI";

// ================= MODE =================
window.setMode = (m) => {
  mode = m;
  document.getElementById("proveedor").style.display =
    m === "VCP" ? "block" : "none";
};

// ================= PARSER =================
window.parseText = async () => {
  const text = document.getElementById("texto").value;

  const correo = text.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0];
  const perfil = text.match(/Perfil:\s*(.*)/i)?.[1];
  const plataforma = text.match(/DISNEY|NETFLIX|PRIME|HBO|APPLE|SPOTIFY/i)?.[0];
  const venc = text.match(/Expira:\s*(.*)/i)?.[1];

  if (!correo) return alert("No se detectó correo");

  document.getElementById("correo").value = correo;
  document.getElementById("perfil").value = perfil || "";
  document.getElementById("plataforma").value = plataforma || "";

  if (venc) {
    const d = new Date(venc);
    if (!isNaN(d)) {
      document.getElementById("vencimiento").value =
        d.toISOString().split("T")[0];
    }
  }

  if (mode === "VCP") {
    await validarCuenta(correo);
  }
};

// ================= VALIDAR CUENTA =================
async function validarCuenta(correo) {

  const { data: cuentas } = await supabase
    .from("cuentas_propias")
    .select("*")
    .eq("correo_cuenta", correo);

  if (!cuentas || cuentas.length === 0) {
    return alert("No se encontró ninguna cuenta");
  }

  const cuenta = cuentas[0];

  const { count } = await supabase
    .from("ventas")
    .select("*", { count: "exact", head: true })
    .eq("usuario_correo", correo)
    .eq("tipo_venta", "VCP")
    .eq("id_servicio", cuenta.id_servicio);

  const capacidad = await getCapacidad(cuenta.id_servicio);

  if (count >= capacidad) {
    return alert("Cuenta detectada está llena");
  }

  const perfil = asignarPerfil(count);

  document.getElementById("perfil").value = perfil;
}

// ================= CAPACIDAD =================
async function getCapacidad(id_servicio) {

  const { data } = await supabase
    .from("conf_venta_cuenta_propia")
    .select("cantidad")
    .eq("id_servicio", id_servicio)
    .single();

  return data?.cantidad || 5;
}

// ================= PERFIL =================
function asignarPerfil(count) {
  return `Perfil ${count + 1}`;
}

// ================= GUARDAR VENTA =================
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

  alert("Venta registrada");
};
