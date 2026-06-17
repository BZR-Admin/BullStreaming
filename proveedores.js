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

/* =========================
   AFTER CHANGE (IMPORTANTE)
========================= */

async function afterProveedorChange() {
  const data = await getInitialData();

  CACHE.proveedores = data.proveedores;

  renderProveedores();
}

/* =========================
   RENDER PRINCIPAL
========================= */

function renderProveedores() {
  renderSelectProveedores();
  renderTablaProveedores();
}

/* =========================
   SELECT PROVEEDORES (CACHE)
========================= */

function renderSelectProveedores() {
  const select = document.getElementById("compraProveedor");
  if (!select) return;

  select.innerHTML = `<option value="">Seleccionar proveedor</option>`;

  CACHE.proveedores.forEach(proveedor => {
    select.innerHTML += `
      <option value="${proveedor.Proveedor}" 
              data-whatsapp="${proveedor.Whatsapp || ""}">
        ${proveedor.Proveedor} - ${proveedor.Whatsapp || ""}
      </option>
    `;
  });
}

/* 🔥 FIX IMPORTANTE: evento fuera del render */
document.addEventListener("change", (e) => {
  if (e.target.id === "compraProveedor") {
    const option = e.target.options[e.target.selectedIndex];
    const whatsapp = option.dataset.whatsapp || "";

    const input = document.getElementById("compraWhatsapp");
    if (input) input.value = whatsapp;
  }
});

/* =========================
   TABLA PROVEEDORES
========================= */

function renderTablaProveedores() {
  const tbody = document.getElementById("tablaProveedores");
  if (!tbody) return;

  let html = "";

  for (const p of CACHE.proveedores) {
    html += `
      <tr>
        <td>${p.ID_Proveedor || ""}</td>
        <td>${p.Proveedor || ""}</td>
        <td>${p.Whatsapp || ""}</td>
        <td>
          <button onclick="editarProveedor('${p.ID_Proveedor}')">Editar</button>
          <button onclick="eliminarProveedor('${p.ID_Proveedor}')">Eliminar</button>
        </td>
      </tr>
    `;
  }

  tbody.innerHTML = html;
}

/* =========================
   GUARDAR
========================= */

async function guardarProveedor(event) {
  event.preventDefault();

  const ID_Proveedor = proveedorId.value;

  const proveedor = {
    Proveedor: proveedorNombre.value.trim(),
    Whatsapp: proveedorWhatsapp.value.trim()
  };

  if (!proveedor.Proveedor || !proveedor.Whatsapp) {
    alert("Completa todos los campos");
    return;
  }

  try {
    if (ID_Proveedor) {
      proveedor.ID_Proveedor = ID_Proveedor;
      await updateProveedor(proveedor);
    } else {
      await addProveedor(proveedor);
    }

    limpiarFormProveedor();

    // 🔥 IMPORTANTE: solo actualiza proveedores
    await afterProveedorChange();

  } catch (error) {
    console.error(error);
  }
}

/* =========================
   EDITAR
========================= */

function editarProveedor(ID_Proveedor) {
  const proveedor = CACHE.proveedores.find(p => p.ID_Proveedor === ID_Proveedor);

  if (!proveedor) return alert("Proveedor no encontrado");

  proveedorId.value = proveedor.ID_Proveedor || "";
  proveedorNombre.value = proveedor.Proveedor || "";
  proveedorWhatsapp.value = proveedor.Whatsapp || "";

  mostrarPantalla("proveedores");
}

/* =========================
   ELIMINAR
========================= */

async function eliminarProveedor(ID_Proveedor) {
  const ok = confirmarEliminacion("¿Eliminar proveedor?");
  if (!ok) return;

  try {
    await deleteProveedor(ID_Proveedor);

    await afterProveedorChange();

  } catch (error) {
    console.error(error);
  }
}

/* =========================
   LIMPIAR
========================= */

function limpiarFormProveedor() {
  proveedorId.value = "";
  proveedorNombre.value = "";
  proveedorWhatsapp.value = "";
}
