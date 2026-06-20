import { supabase } from "./supabase.js";

let mode = "clientes";       // "clientes" | "proveedores"
let editingId = null;        // id del registro que se está editando, si hay alguno
let currentData = [];        // último listado cargado, para poder buscar por id sin refetch

const container = document.getElementById("container");
const modal = document.getElementById("modalAgregarCliente");
const btnClientes = document.getElementById("btnClientes");
const btnProveedores = document.getElementById("btnProveedores");

// =====================
// HELPERS DE TABLA
// =====================
function tableName() {
  return mode === "clientes" ? "clientes" : "proveedores";
}

function idField() {
  return mode === "clientes" ? "id_cliente" : "id_proveedor";
}

function nameField() {
  return mode === "clientes" ? "nombre" : "proveedor";
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

// =====================
// CAMBIAR MODO
// =====================
window.setMode = (m) => {
  mode = m;

  btnClientes.classList.toggle("active-clientes", m === "clientes");
  btnProveedores.classList.toggle("active-proveedores", m === "proveedores");

  document.getElementById("nombre").value = "";
  document.getElementById("whatsapp").value = "";

  load();
};

// =====================
// GUARDAR (ALTA)
// =====================
window.save = async () => {
  const nombre = document.getElementById("nombre").value.trim();
  const whatsapp = document.getElementById("whatsapp").value.trim();

  if (!nombre) return alert("Nombre requerido");

  const payload = {
    [idField()]: crypto.randomUUID(),
    [nameField()]: nombre,
    whatsapp,
  };
  if (mode === "clientes") payload.estado = "Activo";

  const { error } = await supabase.from(tableName()).insert([payload]);

  if (error) return alert("Error al guardar: " + error.message);

  document.getElementById("nombre").value = "";
  document.getElementById("whatsapp").value = "";

  load();
};

// =====================
// CARGAR LISTA
// =====================
async function load() {
  container.innerHTML = `<div class="loader"></div>`;

  const { data, error } = await supabase.from(tableName()).select("*");

  if (error) {
    currentData = [];
    container.innerHTML = `<p class="empty-state">Error al cargar: ${escapeHtml(error.message)}</p>`;
    return;
  }

  currentData = data || [];

  if (currentData.length === 0) {
    const label = mode === "clientes" ? "clientes" : "proveedores";
    container.innerHTML = `<p class="empty-state">No hay ${label} registrados todavía.</p>`;
    return;
  }

  container.innerHTML = "";

  currentData.forEach((item) => {
    const id = item[idField()];
    const nombre = item[nameField()] || "";
    const whatsapp = item.whatsapp || "";

    const row = document.createElement("div");
    row.className = "cliente-row";
    row.innerHTML = `
      <span>${escapeHtml(nombre)}${whatsapp ? " — " + escapeHtml(whatsapp) : ""}</span>
      <button type="button" onclick="openEdit('${id}')">✏️ Editar</button>
      <button type="button" onclick="deleteItem('${id}')">🗑️ Eliminar</button>
    `;

    container.appendChild(row);
  });
}

load();

// =====================
// EDITAR
// =====================
window.openEdit = (id) => {
  const item = currentData.find((i) => i[idField()] === id);
  if (!item) return;

  editingId = id;

  document.getElementById("editNombre").value = item[nameField()] || "";
  document.getElementById("editWhatsapp").value = item.whatsapp || "";
  document.getElementById("modalTitle").textContent =
    mode === "clientes" ? "Editar cliente" : "Editar proveedor";

  modal.showModal();
};

window.cancelEdit = () => {
  modal.close();
};

window.confirmEdit = async () => {
  const nombre = document.getElementById("editNombre").value.trim();
  const whatsapp = document.getElementById("editWhatsapp").value.trim();

  if (!nombre) return alert("Nombre requerido");
  if (!editingId) return;

  const payload = { [nameField()]: nombre, whatsapp };

  const { error } = await supabase
    .from(tableName())
    .update(payload)
    .eq(idField(), editingId);

  if (error) return alert("Error al actualizar: " + error.message);

  modal.close();
  load();
};

// Cerrar el modal al hacer click afuera (sobre el ::backdrop nativo del <dialog>)
modal.addEventListener("click", (e) => {
  const rect = modal.getBoundingClientRect();
  const dentro =
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;

  if (!dentro) modal.close();
});

// Limpiar el id en edición sea cual sea la forma en que se cerró el modal
modal.addEventListener("close", () => {
  editingId = null;
});

// =====================
// ELIMINAR
// =====================
window.deleteItem = async (id) => {
  if (!confirm("¿Eliminar este registro?")) return;

  const { error } = await supabase.from(tableName()).delete().eq(idField(), id);

  if (error) return alert("Error al eliminar: " + error.message);

  load();
};
