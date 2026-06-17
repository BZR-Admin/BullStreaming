import { supabase } from "./supabase.js";

let mode = "VI"; // default

window.setMode = (m) => {
  mode = m;
  document.getElementById("proveedor").style.display = (m === "VCP") ? "block" : "none";
};

window.openParser = () => {
  document.getElementById("parserBox").style.display = "block";
};

window.closeParser = () => {
  document.getElementById("parserBox").style.display = "none";
};

window.clearText = () => {
  document.getElementById("texto").value = "";
};


// 🧠 PARSER INTELIGENTE
window.parseText = async () => {
  const text = document.getElementById("texto").value;

  const email = text.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0];
  const perfil = text.match(/Perfil:\s*(.*)/i)?.[1];
  const plataforma = text.match(/DISNEY|NETFLIX|PRIME|HBO|APPLE|SPOTIFY/i)?.[0];

  if (!email) return alert("No se detectó correo");

  document.getElementById("correo").value = email;
  document.getElementById("perfil").value = perfil || "";
  document.getElementById("plataforma").value = plataforma || "";

  // 🔍 buscar cuenta disponible (VCP)
  if (mode === "VCP") {
    const { data } = await supabase
      .from("cuentas_propias")
      .select("*")
      .eq("usuario_correo", email);

    if (!data || data.length === 0) {
      return alert("No se encontró ninguna cuenta");
    }

    // validar capacidad
    const cuenta = data[0];

    const { count } = await supabase
      .from("ventas")
      .select("*", { count: "exact", head: true })
      .eq("usuario_correo", email);

    const max = 5; // luego lo conectamos a conf

    if (count >= max) {
      return alert("Cuenta detectada está llena");
    }

    alert("Cuenta disponible asignada");
  }
};


// 💾 GUARDAR VENTA
window.saveVenta = async () => {

  const venta = {
    id_venta: crypto.randomUUID(),
    tipo_venta: mode,
    id_cliente: null,
    plataforma: document.getElementById("plataforma").value,
    id_servicio: document.getElementById("servicio").value,
    usuario_correo: document.getElementById("correo").value,
    perfil: document.getElementById("perfil").value,
    fecha_vencimiento: document.getElementById("vencimiento").value,
    ganancia: document.getElementById("ganancia").value || 0,
    estado: "Activa",
    fecha_registro: new Date()
  };

  const { error } = await supabase
    .from("ventas")
    .insert([venta]);

  if (error) return alert("Error al guardar");

  alert("Venta registrada");
};
