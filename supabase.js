// =========================
// SUPABASE CLIENT
// =========================

// 🔴 PON AQUÍ TU URL (ME LA FALTA)
const SUPABASE_URL = "https://tsjooishylasseijkard.supabase.co";

// 🔑 TU KEY (la que enviaste)
const SUPABASE_ANON_KEY = "sb_publishable_i4drihcN_x3GTKpm3Ayptg_Pp3LzWPf";

// Crear cliente Supabase (CDN)
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// inicialización
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


// =========================
// CLIENTES
// tabla: clientes
// =========================
async function getClientes() {
  const { data, error } = await supabaseClient
    .from("clientes")
    .select("*");

  if (error) throw error;
  return data;
}

async function addCliente(cliente) {
  const { error } = await supabaseClient
    .from("clientes")
    .insert([cliente]);

  if (error) throw error;
}

async function updateCliente(id, updates) {
  const { error } = await supabaseClient
    .from("clientes")
    .update(updates)
    .eq("id_cliente", id);

  if (error) throw error;
}

async function deleteCliente(id) {
  const { error } = await supabaseClient
    .from("clientes")
    .delete()
    .eq("id_cliente", id);

  if (error) throw error;
}


// =========================
// PROVEEDORES
// tabla: proveedores
// =========================
async function getProveedores() {
  const { data, error } = await supabaseClient
    .from("proveedores")
    .select("*");

  if (error) throw error;
  return data;
}

async function addProveedor(dataRow) {
  const { error } = await supabaseClient
    .from("proveedores")
    .insert([dataRow]);

  if (error) throw error;
}

async function updateProveedor(id, updates) {
  const { error } = await supabaseClient
    .from("proveedores")
    .update(updates)
    .eq("id_proveedor", id);

  if (error) throw error;
}

async function deleteProveedor(id) {
  const { error } = await supabaseClient
    .from("proveedores")
    .delete()
    .eq("id_proveedor", id);

  if (error) throw error;
}


// =========================
// CUENTAS PROPIAS (COMPRAS)
// tabla: cuentas_propias
// =========================
async function getCuentasPropias() {
  const { data, error } = await supabaseClient
    .from("cuentas_propias")
    .select("*");

  if (error) throw error;
  return data;
}

async function addCuentaPropia(row) {
  const { error } = await supabaseClient
    .from("cuentas_propias")
    .insert([row]);

  if (error) throw error;
}

async function updateCuentaPropia(id, updates) {
  const { error } = await supabaseClient
    .from("cuentas_propias")
    .update(updates)
    .eq("id_cuenta", id);

  if (error) throw error;
}

async function deleteCuentaPropia(id) {
  const { error } = await supabaseClient
    .from("cuentas_propias")
    .delete()
    .eq("id_cuenta", id);

  if (error) throw error;
}


// =========================
// VENTAS
// tabla: ventas
// =========================
async function getVentas() {
  const { data, error } = await supabaseClient
    .from("ventas")
    .select("*");

  if (error) throw error;
  return data;
}

async function addVenta(row) {
  const { error } = await supabaseClient
    .from("ventas")
    .insert([row]);

  if (error) throw error;
}

async function updateVenta(id, updates) {
  const { error } = await supabaseClient
    .from("ventas")
    .update(updates)
    .eq("id_venta", id);

  if (error) throw error;
}

async function deleteVenta(id) {
  const { error } = await supabaseClient
    .from("ventas")
    .delete()
    .eq("id_venta", id);

  if (error) throw error;
}
