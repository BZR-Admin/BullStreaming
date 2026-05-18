async function renderDashboard() {
  try {
    const dashboard = await getDashboard();

    document.getElementById("dashClientesActivos").textContent =
      dashboard.totalClientesActivos || 0;

    document.getElementById("dashGananciaDiaria").textContent =
      "$" + Number(dashboard.gananciaDiaria || 0).toFixed(2);

    document.getElementById("dashGananciaSemanal").textContent =
      "$" + Number(dashboard.gananciaSemanal || 0).toFixed(2);

    document.getElementById("dashGananciaMensual").textContent =
      "$" + Number(dashboard.gananciaMensual || 0).toFixed(2);

    renderCuentasVencidasDashboard(dashboard.cuentasPropiasVencidas || []);

  } catch (error) {
    console.error("Error cargando dashboard:", error);
  }
}

function renderCuentasVencidasDashboard(cuentas) {
  const tbody = document.getElementById("tablaCuentasVencidas");

  if (!tbody) return;

  tbody.innerHTML = "";

  if (cuentas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">No hay cuentas vencidas.</td>
      </tr>
    `;
    return;
  }

  cuentas.forEach(cuenta => {
    tbody.innerHTML += `
      <tr>
        <td>${cuenta.ID_Cuenta || ""}</td>
        <td>${cuenta.ID_Servicio || ""}</td>
        <td>${cuenta.Correo_Cuenta || ""}</td>
        <td>${formatearFecha(cuenta.Fecha_Vencimiento)}</td>
        <td>${cuenta.Proveedor || ""}</td>
        <td>${cuenta.Estado || ""}</td>
      </tr>
    `;
  });
}
