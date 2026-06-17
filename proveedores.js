document.addEventListener("DOMContentLoaded", () => {
  const formProveedor = document.getElementById("formProveedor");
  const btnLimpiarProveedor = document.getElementById("btnLimpiarProveedor");

  if (formProveedor) {
    formProveedor.addEventListener("submit", guardarProveedor);
  }

  if (btnLimpiarProveedor) {
    btnLimpiarProveedor.addEventListener("click", limpiarFormProveedor);
  }
});

async function afterProveedorChange() {
  const data = await getInitialData();

  CACHE.proveedores = data.proveedores;

  renderProveedores();
}

function renderProveedores() {
  renderSelectProveedores();
  renderTablaProveedores();
}

function renderSelectProveedores() {
  const select = document.getElementById("compraProveedor");
  if (!select) return;

  select.innerHTML = `<option value="">Seleccionar proveedor</option>`;

  DB.proveedores.forEach(proveedor => {
    select.innerHTML += `
      <option 
        value="${proveedor.Proveedor}" 
        data-whatsapp="${proveedor.Whatsapp || ""}"
      >
        ${proveedor.Proveedor} - ${proveedor.Whatsapp || ""}
      </option>
    `;
  });

  select.addEventListener("change", () => {
    const option = select.options[select.selectedIndex];
    const whatsapp = option.dataset.whatsapp || "";
    const inputWhatsapp = document.getElementById("compraWhatsapp");

    if (inputWhatsapp) inputWhatsapp.value = whatsapp;
  });
}

function renderTablaProveedores() {
  const tbody = document.getElementById("tablaProveedores");
  if (!tbody) return;

  tbody.innerHTML = "";

  DB.proveedores.forEach(proveedor => {
    tbody.innerHTML += `
      <tr>
        <td>${proveedor.ID_Proveedor || ""}</td>
        <td>${proveedor.Proveedor || ""}</td>
        <td>${proveedor.Whatsapp || ""}</td>
        <td>
          <button class="btn-editar" onclick="editarProveedor('${proveedor.ID_Proveedor}')">Editar</button>
          <button class="btn-eliminar" onclick="eliminarProveedor('${proveedor.ID_Proveedor}')">Eliminar</button>
        </td>
      </tr>
    `;
  });
}

async function guardarProveedor(event) {
  event.preventDefault();

  const ID_Proveedor = document.getElementById("proveedorId").value;

  const proveedor = {
    Proveedor: document.getElementById("proveedorNombre").value.trim(),
    Whatsapp: document.getElementById("proveedorWhatsapp").value.trim()
  };

  if (!proveedor.Proveedor || !proveedor.Whatsapp) {
    alert("Proveedor y Whatsapp son obligatorios.");
    return;
  }

  try {
    if (ID_Proveedor) {
      proveedor.ID_Proveedor = ID_Proveedor;
      await updateProveedor(proveedor);
      alert("Proveedor actualizado correctamente.");
    } else {
      await addProveedor(proveedor);
      alert("Proveedor agregado correctamente.");
    }

    limpiarFormProveedor();
    await refrescarTodo();

  } catch (error) {
    console.error(error);
  }
}

function editarProveedor(ID_Proveedor) {
  const proveedor = DB.proveedores.find(p => p.ID_Proveedor === ID_Proveedor);

  if (!proveedor) {
    alert("Proveedor no encontrado.");
    return;
  }

  document.getElementById("proveedorId").value = proveedor.ID_Proveedor || "";
  document.getElementById("proveedorNombre").value = proveedor.Proveedor || "";
  document.getElementById("proveedorWhatsapp").value = proveedor.Whatsapp || "";

  mostrarPantalla("proveedores");
}

async function eliminarProveedor(ID_Proveedor) {
  const ok = confirmarEliminacion("¿Seguro que deseas eliminar este proveedor?");

  if (!ok) return;

  try {
    await deleteProveedor(ID_Proveedor);
    alert("Proveedor eliminado correctamente.");
    await refrescarTodo();

  } catch (error) {
    console.error(error);
  }
}

function limpiarFormProveedor() {
  document.getElementById("proveedorId").value = "";
  document.getElementById("proveedorNombre").value = "";
  document.getElementById("proveedorWhatsapp").value = "";
}
