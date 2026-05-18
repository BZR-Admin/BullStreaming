let filtroPlataformaCuenta = "";

document.addEventListener("DOMContentLoaded", () => {
  const filtro = document.getElementById("filtroPlataformaCuentas");

  if (filtro) {
    filtro.addEventListener("change", () => {
      filtroPlataformaCuenta = filtro.value;
      renderCuentasDisponibles();
    });
  }
});

function renderCuentasDisponibles() {
  renderFiltroPlataformas();

  const tbody = document.getElementById("tablaCuentasDisponibles");

  if (!tbody) return;

  tbody.innerHTML = "";

  let cuentas = [...DB.cuentasDisponibles];

  cuentas = cuentas.filter(cuenta => {
    const servicio = DB.configCuentaPropia.find(
      s => s.ID_Servicio === cuenta.ID_Servicio
    );

    const plataforma = servicio ? servicio.Plataforma : "";

    if (!filtroPlataformaCuenta) return true;

    return plataforma === filtroPlataformaCuenta;
  });

  cuentas.forEach(cuenta => {
    const servicio = DB.configCuentaPropia.find(
      s => s.ID_Servicio === cuenta.ID_Servicio
    );

    const plataforma = servicio ? servicio.Plataforma : "";

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
        <td data-label="Plataforma">${plataforma}</td>

        <td data-label="Usuario/Correo">
          ${cuenta.Correo_Cuenta || ""}
        </td>

        <td data-label="Disponibles">
          ${cuenta.Disponibles || 0}
        </td>

        <td data-label="Estado">
          ${estadoDisponibilidad}
        </td>
      </tr>
    `;
  });
}

function renderFiltroPlataformas() {
  const select = document.getElementById("filtroPlataformaCuentas");

  if (!select) return;

  const valorActual = select.value;

  const plataformas = [
    ...new Set(
      DB.configCuentaPropia.map(s => s.Plataforma)
    )
  ];

  select.innerHTML = `
    <option value="">Todas las plataformas</option>
  `;

  plataformas.forEach(plataforma => {
    select.innerHTML += `
      <option value="${plataforma}">
        ${plataforma}
      </option>
    `;
  });

  select.value = valorActual;
}
