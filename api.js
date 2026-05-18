const API_URL = "https://script.google.com/macros/s/AKfycbyzXEhPfIsoaA7AqgVtdFHWwEX0voo-3nFmY8gSKjmZDovMXMRApyGaXhHU_HnUqUQM/exec";

async function apiRequest(action, payload = {}) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action,
        payload
      })
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || "Error desconocido");
    }

    return result.data;

  } catch (error) {
    console.error("Error en API:", error);
    alert("Error: " + error.message);
    throw error;
  }
}

/* =========================
   DATOS INICIALES
========================= */

async function getInitialData() {
  return await apiRequest("getInitialData");
}

/* =========================
   CLIENTES
========================= */

async function addCliente(cliente) {
  return await apiRequest("addCliente", cliente);
}

async function updateCliente(cliente) {
  return await apiRequest("updateCliente", cliente);
}

async function deleteCliente(ID_Cliente) {
  return await apiRequest("deleteCliente", { ID_Cliente });
}

/* =========================
   PROVEEDORES
========================= */

async function addProveedor(proveedor) {
  return await apiRequest("addProveedor", proveedor);
}

async function updateProveedor(proveedor) {
  return await apiRequest("updateProveedor", proveedor);
}

async function deleteProveedor(ID_Proveedor) {
  return await apiRequest("deleteProveedor", { ID_Proveedor });
}

/* =========================
   CUENTAS PROPIAS / COMPRAS
========================= */

async function addCuentaPropia(cuenta) {
  return await apiRequest("addCuentaPropia", cuenta);
}

async function updateCuentaPropia(cuenta) {
  return await apiRequest("updateCuentaPropia", cuenta);
}

async function deleteCuentaPropia(ID_Cuenta) {
  return await apiRequest("deleteCuentaPropia", { ID_Cuenta });
}

/* =========================
   VENTAS
========================= */

async function addVenta(venta) {
  return await apiRequest("addVenta", venta);
}

async function updateVenta(venta) {
  return await apiRequest("updateVenta", venta);
}

async function renovarVenta(ID_Venta, Fecha_Vencimiento) {
  return await apiRequest("renovarVenta", {
    ID_Venta,
    Fecha_Vencimiento
  });
}

async function deleteVenta(ID_Venta) {
  return await apiRequest("deleteVenta", { ID_Venta });
}

/* =========================
   DASHBOARD
========================= */

async function getDashboard() {
  return await apiRequest("getDashboard");
}
