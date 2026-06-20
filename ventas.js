import { supabase } from "./supabase.js";

let mode = "VI";

/* =========================
   SAFE QUERY
========================= */
async function safeQuery(query) {
  const { data, error } = await query;
  if (error) return [];
  return data || [];
}

/* =========================
   INIT
========================= */
window.onload = async () => {
  await Promise.all([
    loadClientes(),
    loadProveedores()
  ]);
  await loadPlataformas();
};

/* =========================
   CLIENTES (orden alfabético)
========================= */
async function loadClientes() {
  const data = await safeQuery(supabase.from("clientes").select("*"));

  const sorted = data.sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
  );

  const sel = document.getElementById("cliente");
  sel.innerHTML = `<option value="">— Selecciona cliente —</option>`;

  sorted.forEach(c => {
    sel.innerHTML += `<option value="${c.id_cliente}">${c.nombre}</option>`;
  });
}

/* =========================
   PLATAFORMAS
========================= */
async function loadPlataformas() {
  const table = mode === "VI"
    ? "conf_venta_perfiles_independientes"
    : "conf_venta_cuenta_propia";

  const data = await safeQuery(supabase.from(table).select("plataforma"));

  const unique = [...new Set(data.map(d => d?.plataforma).filter(Boolean))].sort();

  const sel = document.getElementById("plataforma");
  sel.innerHTML = `<option value="">— Selecciona plataforma —</option>`;

  unique.forEach(p => {
    sel.innerHTML += `<option value="${p}">${p}</option>`;
  });

  // Resetear servicio al cambiar plataformas
  document.getElementById("servicio").innerHTML =
    `<option value="">— Selecciona servicio —</option>`;
}

/* =========================
   SERVICIOS (al cambiar plataforma)
========================= */
window.loadServicios = async () => {
  const plataforma = document.getElementById("plataforma").value;

  const sel = document.getElementById("servicio");
  sel.innerHTML = `<option value="">— Selecciona servicio —</option>`;

  if (!plataforma) return;

  const table = mode === "VI"
    ? "conf_venta_perfiles_independientes"
    : "conf_venta_cuenta_propia";

  const data = await safeQuery(
    supabase.from(table).select("*").eq("plataforma", plataforma)
  );

  data.forEach(s => {
    sel.innerHTML += `<option value="${s.id_servicio}">${s.servicio}</option>`;
  });

  // Si solo hay un servicio, seleccionarlo automáticamente
  if (data.length === 1) sel.value = data[0].id_servicio;
};

/* =========================
   PROVEEDORES (orden alfabético)
========================= */
async function loadProveedores() {
  const data = await safeQuery(supabase.from("proveedores").select("*"));

  const sorted = data.sort((a, b) =>
    a.proveedor.localeCompare(b.proveedor, "es", { sensitivity: "base" })
  );

  const sel = document.getElementById("proveedor");
  sel.innerHTML = `<option value="">— Selecciona proveedor —</option>`;

  sorted.forEach(p => {
    sel.innerHTML += `<option value="${p.proveedor}">${p.proveedor}</option>`;
  });
}

/* =========================
   CAMBIO DE MODO VI / VCP
========================= */
window.setMode = (m) => {
  mode = m;

  // Botones switch
  document.getElementById("btnVI").className  = m === "VI"  ? "active-vi"  : "";
  document.getElementById("btnVCP").className = m === "VCP" ? "active-vcp" : "";

  // Badge header
  const badge = document.getElementById("modeBadge");
  badge.textContent = m;
  badge.className = m === "VCP" ? "mode-badge vcp" : "mode-badge";

  // Botón guardar color
  const btnSave = document.getElementById("btnSave");
  btnSave.className = m === "VCP" ? "btn-save vcp-mode" : "btn-save";

  // Campo proveedor solo en VCP
  document.getElementById("fieldProveedor").style.display =
    m === "VCP" ? "block" : "none";

  // Recargar plataformas para la tabla correcta
  loadPlataformas();
};

/* =========================
   PARSER DE TEXTO
========================= */
window.parseText = async () => {
  const text = document.getElementById("texto").value;

  const correo    = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
  const perfil    = text.match(/Perfil:\s*(.*)/i)?.[1]?.trim();
  const plataforma = text.match(/DISNEY|NETFLIX|PRIME|HBO|APPLE|SPOTIFY/i)?.[0]?.toUpperCase();
  const venc      = text.match(/Expira\s*·\s*(.*)/i)?.[1];

  if (!correo) return alert("No se detectó correo en el texto.");

  document.getElementById("correo").value = correo;
  document.getElementById("perfil").value = perfil || "";

  // ── MODO VI ──
  if (mode === "VI") {
    if (plataforma) {
      document.getElementById("plataforma").value = plataforma;

      const data = await safeQuery(
        supabase
          .from("conf_venta_perfiles_independientes")
          .select("*")
          .eq("plataforma", plataforma)
      );

      const sel = document.getElementById("servicio");
      sel.innerHTML = `<option value="">— Selecciona servicio —</option>`;
      data.forEach(s => {
        sel.innerHTML += `<option value="${s.id_servicio}">${s.servicio}</option>`;
      });
      if (data.length === 1) sel.value = data[0].id_servicio;
    }

    if (venc) {
      const d = new Date(venc);
      if (!isNaN(d)) {
        document.getElementById("vencimiento").value = d.toISOString().split("T")[0];
      }
    }

    toggleParser();
    return;
  }

  // ── MODO VCP ──
  const ok = await validarCuenta(correo);
  if (!ok) {
    document.getElementById("correo").value = "";
    document.getElementById("perfil").value = "";
  } else {
    toggleParser();
  }
};

/* =========================
   VALIDAR CUENTA (VCP)
========================= */
async function validarCuenta(correo) {
  const cuentas = await safeQuery(
    supabase.from("cuentas_propias").select("*").eq("correo_cuenta", correo)
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

  const confArr = await safeQuery(
    supabase
      .from("conf_venta_cuenta_propia")
      .select("cantidad, plataforma, servicio")
      .eq("id_servicio", cuenta.id_servicio)
  );

  const conf = confArr[0];
  const capacidad = conf?.cantidad || 5;

  if (count >= capacidad) {
    alert("❌ Cuenta llena");
    return false;
  }

  // Autocompletar campos
  document.getElementById("plataforma").value = conf?.plataforma || "";
  await loadServicios();
  document.getElementById("servicio").value  = cuenta.id_servicio;
  document.getElementById("proveedor").value = cuenta.proveedor || "";

  return true;
}

/* =========================
   GUARDAR VENTA
========================= */
window.saveVenta = async () => {
  // Validación previa en modo VCP
  if (mode === "VCP") {
    const correo = document.getElementById("correo").value.trim();
    if (!correo) return alert("Ingresa el correo de la cuenta.");
    const ok = await validarCuenta(correo);
    if (!ok) return;
  }

  const venta = {
    id_venta:         crypto.randomUUID(),
    tipo_venta:       mode,
    id_cliente:       document.getElementById("cliente").value || null,
    plataforma:       document.getElementById("plataforma").value,
    id_servicio:      document.getElementById("servicio").value,
    usuario_correo:   document.getElementById("correo").value.trim(),
    perfil:           document.getElementById("perfil").value.trim(),
    fecha_vencimiento: document.getElementById("vencimiento").value,
    ganancia:         Number(document.getElementById("ganancia").value || 0),
    estado:           "Activa",
    fecha_registro:   new Date().toISOString()
  };

  if (!venta.plataforma || !venta.id_servicio || !venta.usuario_correo || !venta.fecha_vencimiento) {
    return alert("Por favor completa los campos obligatorios.");
  }

  const { error } = await supabase.from("ventas").insert([venta]);

  if (error) {
    console.error(error);
    return alert("Error al guardar la venta.");
  }

  alert("✔ Venta registrada correctamente");
  limpiar();
};

/* =========================
   LIMPIAR FORM
========================= */
function limpiar() {
  document.getElementById("correo").value     = "";
  document.getElementById("perfil").value     = "";
  document.getElementById("ganancia").value   = "";
  document.getElementById("vencimiento").value = "";
  document.getElementById("plataforma").value = "";
  document.getElementById("servicio").innerHTML =
    `<option value="">— Selecciona servicio —</option>`;
}
