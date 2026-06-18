import { supabase } from "./supabase.js";

let mode = "VI";

// ================= SAFE QUERY =================
async function safeQuery(query) {
  const { data, error } = await query;
  if (error) return [];
  return data || [];
}

// ================= INIT =================
window.onload = async () => {
  await loadClientes();
  await loadPlataformas();
  await loadProveedores();
};

// ================= CLIENTES =================
async function loadClientes() {
  const data = await safeQuery(supabase.from("clientes").select("*"));

  const sel = document.getElementById("cliente");
  sel.innerHTML = "<option value=''>Cliente</option>";

  data.forEach(c => {
    sel.innerHTML += `<option value="${c.id_cliente}">${c.nombre}</option>`;
  });
}

// ================= PLATAFORMAS =================
async function loadPlataformas() {

  const table = (mode === "VI")
    ? "conf_venta_perfiles_independientes"
    : "conf_venta_cuenta_propia";

  const data = await safeQuery(
    supabase.from(table).select("plataforma")
  );

  const sel = document.getElementById("plataforma");
  sel.innerHTML = "<option value=''>Plataforma</option>";

  const unique = [...new Set(data.map(d => d?.plataforma).filter(Boolean))];

  unique.forEach(p => {
    sel.innerHTML += `<option value="${p}">${p}</option>`;
  });
}

// ================= SERVICIOS =================
window.loadServicios = async () => {

  const plataforma = document.getElementById("plataforma").value;
  if (!plataforma) return;

  const table = (mode === "VI")
    ? "conf_venta_perfiles_independientes"
    : "conf_venta_cuenta_propia";

  const data = await safeQuery(
    supabase
      .from(table)
      .select("*")
      .eq("plataforma", plataforma)
  );

  const sel = document.getElementById("servicio");
  sel.innerHTML = "<option value=''>Servicio</option>";

  data.forEach(s => {
    sel.innerHTML += `<option value="${s.id_servicio}">${s.servicio}</option>`;
  });
};

// ================= PROVEEDORES =================
async function loadProveedores() {
  const data = await safeQuery(supabase.from("proveedores").select("*"));

  const sel = document.getElementById("proveedor");
  sel.innerHTML = "<option value=''>Proveedor</option>";

  data.forEach(p => {
    sel.innerHTML += `<option value="${p.proveedor}">${p.proveedor}</option>`;
  });
}

// ================= MODE =================
window.setMode = (m) => {

  mode = m;

  document.getElementById("proveedor").style.display =
    (m === "VCP") ? "block" : "none";

  loadPlataformas();
};

// ================= PARSER =================
window.parseText = async () => {

  const text = document.getElementById("texto").value;

  const correo = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
  const perfil = text.match(/Perfil:\s*(.*)/i)?.[1]?.trim();
  const plataforma = text.match(/DISNEY|NETFLIX|PRIME|HBO|APPLE|SPOTIFY/i)?.[0];
  const venc = text.match(/Expira\s*·\s*(.*)/i)?.[1];

  if (!correo) return alert("No se detectó correo");

  document.getElementById("correo").value = correo;
  document.getElementById("perfil").value = perfil || "";

  // ================= VI (FIX REAL) =================
  if (mode === "VI") {

    if (plataforma) {
      document.getElementById("plataforma").value = plataforma;

      // 🔥 DIRECTO SIN loadServicios (FIX CLAVE)
      const table = "conf_venta_perfiles_independientes";

      const data = await safeQuery(
        supabase.from(table)
          .select("*")
          .eq("plataforma", plataforma)
      );

      const sel = document.getElementById("servicio");
      sel.innerHTML = "<option value=''>Servicio</option>";

      data.forEach(s => {
        sel.innerHTML += `
          <option value="${s.id_servicio}">
            ${s.servicio}
          </option>
        `;
      });
    }

    if (venc) {
      const d = new Date(venc);
      if (!isNaN(d)) {
        document.getElementById("vencimiento").value =
          d.toISOString().split("T")[0];
      }
    }

    return;
  }

  // ================= VCP =================
  document.getElementById("plataforma").value = plataforma || "";

  const ok = await validarCuenta(correo);
  if (!ok) {
    document.getElementById("correo").value = "";
    document.getElementById("perfil").value = "";
  }
};

// ================= VALIDAR CUENTA =================
async function validarCuenta(correo) {

  const cuentas = await safeQuery(
    supabase.from("cuentas_propias")
      .select("*")
      .eq("correo_cuenta", correo)
  );

  if (!cuentas.length) {
    alert("❌ No se encontró la cuenta");
    return false;
  }

  const cuenta = cuentas[0];

  const { count } = await supabase
    .from("ventas")
    .select("*", { count: "exact", head: true })
    .eq("usuario_correo", correo)
    .eq("tipo_venta", "VCP")
    .eq("id_servicio", cuenta.id_servicio);

  const conf = await safeQuery(
    supabase.from("conf_venta_cuenta_propia")
      .select("cantidad, plataforma, servicio")
      .eq("id_servicio", cuenta.id_servicio)
      .single()
  );

  const capacidad = conf?.cantidad || 5;

  if (count >= capacidad) {
    alert("❌ Cuenta llena");
    return false;
  }

  document.getElementById("plataforma").value = conf.plataforma;

  await loadServicios();

  document.getElementById("servicio").value = cuenta.id_servicio;
  document.getElementById("proveedor").value = cuenta.proveedor || "";

  return true;
}

// ================= SAVE =================
window.saveVenta = async () => {

  if (mode === "VCP") {
    const ok = await validarCuenta(document.getElementById("correo").value);
    if (!ok) return;
  }

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

  const { error } = await supabase.from("ventas").insert([venta]);

  if (error) return alert("Error");

  alert("✔ Venta registrada");
};

// ================= LIMPIAR =================
function limpiar() {
  document.getElementById("correo").value = "";
  document.getElementById("perfil").value = "";
  document.getElementById("ganancia").value = "";
}
