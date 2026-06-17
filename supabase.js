// =========================
// SUPABASE CLIENT
// =========================

// 🔴 PON AQUÍ TU URL (ME LA FALTA)
const SUPABASE_URL = "https://tsjooishylasseijkard.supabase.co";

// 🔑 TU KEY (la que enviaste)
const SUPABASE_ANON_KEY = "sb_publishable_i4drihcN_x3GTKpm3Ayptg_Pp3LzWPf";

// Crear cliente Supabase (CDN)
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



// =========================
// CLIENTES
// =========================

async function getClientes() {
  const { data, error } = await sb
    .from('clientes')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data;
}

async function addCliente(cliente) {
  const { data, error } = await sb
    .from('clientes')
    .insert([cliente])
    .select();

  if (error) throw error;
  return data;
}

async function updateCliente(id, updates) {
  const { data, error } = await sb
    .from('clientes')
    .update(updates)
    .eq('id_cliente', id)
    .select();

  if (error) throw error;
  return data;
}

async function deleteCliente(id) {
  const { error } = await sb
    .from('clientes')
    .delete()
    .eq('id_cliente', id);

  if (error) throw error;
}



// =========================
// PROVEEDORES
// =========================

async function getProveedores() {
  const { data, error } = await sb
    .from('proveedores')
    .select('*')
    .order('proveedor', { ascending: true });

  if (error) throw error;
  return data;
}

async function addProveedor(proveedor) {
  const { data, error } = await sb
    .from('proveedores')
    .insert([proveedor])
    .select();

  if (error) throw error;
  return data;
}

async function updateProveedor(id, updates) {
  const { data, error } = await sb
    .from('proveedores')
    .update(updates)
    .eq('id_proveedor', id)
    .select();

  if (error) throw error;
  return data;
}

async function deleteProveedor(id) {
  const { error } = await sb
    .from('proveedores')
    .delete()
    .eq('id_proveedor', id);

  if (error) throw error;
}



// =========================
// CUENTAS PROPIAS (COMPRAS)
// =========================

async function getCuentasPropias() {
  const { data, error } = await sb
    .from('cuentas_propias')
    .select('*')
    .order('fecha_compra', { ascending: false });

  if (error) throw error;
  return data;
}

async function addCuentaPropia(cuenta) {
  const { data, error } = await sb
    .from('cuentas_propias')
    .insert([cuenta])
    .select();

  if (error) throw error;
  return data;
}

async function updateCuentaPropia(id, updates) {
  const { data, error } = await sb
    .from('cuentas_propias')
    .update(updates)
    .eq('id_cuenta', id)
    .select();

  if (error) throw error;
  return data;
}

async function deleteCuentaPropia(id) {
  const { error } = await sb
    .from('cuentas_propias')
    .delete()
    .eq('id_cuenta', id);

  if (error) throw error;
}



// =========================
// VENTAS
// =========================

async function getVentas() {
  const { data, error } = await sb
    .from('ventas')
    .select('*')
    .order('fecha_registro', { ascending: false });

  if (error) throw error;
  return data;
}

async function addVenta(venta) {
  const { data, error } = await sb
    .from('ventas')
    .insert([venta])
    .select();

  if (error) throw error;
  return data;
}

async function updateVenta(id, updates) {
  const { data, error } = await sb
    .from('ventas')
    .update(updates)
    .eq('id_venta', id)
    .select();

  if (error) throw error;
  return data;
}

async function deleteVenta(id) {
  const { error } = await sb
    .from('ventas')
    .delete()
    .eq('id_venta', id);

  if (error) throw error;
}



// =========================
// UTILIDAD: REFRESH GLOBAL SIMPLE
// =========================

async function refreshAll(loadFunctions = []) {
  for (const fn of loadFunctions) {
    await fn();
  }
}
