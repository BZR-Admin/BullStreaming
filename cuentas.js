function renderCuentasDisponibles() {
  const tbody = document.getElementById("tablaCuentasDisponibles");

  if (!tbody) return;

  tbody.innerHTML = "";

  DB.cuentasDisponibles.forEach(cuenta => {

    let estadoDisponibilidad = "";

    if (Number(cuenta.Disponibles) <= 0) {
      estadoDisponibilidad = "Sin disponibilidad";
    } else if (Number(cuenta.Disponibles) <= 2) {
      estadoDisponibilidad = "Pocas disponibles";
    } else {
      estadoDisponibilidad = "Disponible";
    }

    tbody.innerHTML += `
      <tr>
        <td>${cuenta.ID_Cuenta || ""}</td>

        <td>${cuenta.ID_Servicio || ""}</td>

        <td>${cuenta.Correo_Cuenta || ""}</td>

        <td>${cuenta.Usados || 0}</td>

        <td>${cuenta.Maximo || 0}</td>

        <td>${cuenta.Disponibles || 0}</td>

        <td>
          ${cuenta.Usados || 0}/${cuenta.Maximo || 0}
          - ${estadoDisponibilidad}
        </td>

        <td>${cuenta.Estado || ""}</td>
      </tr>
    `;
  });
}
