import { supabase } from "./supabase.js";

let mode = "clientes";

// =====================
// CAMBIAR MODO
// =====================
window.setMode = (m) => {
  mode = m;
  load();
};

// =====================
// GUARDAR
// =====================
window.save = async () => {

  const nombre = document.getElementById("nombre").value;
  const whatsapp = document.getElementById("whatsapp").value;

  if (!nombre) return alert("Nombre requerido");

  if (mode === "clientes") {

    const { error } = await supabase
      .from("clientes")
      .insert([{
        id_cliente: crypto.randomUUID(),
        nombre,
        whatsapp,
        estado: "Activo"
      }]);

    if (error) return alert("Error");

  } else {

    const { error } = await supabase
      .from("proveedores")
      .insert([{
        id_proveedor: crypto.randomUUID(),
        proveedor: nombre,
        whatsapp
      }]);

    if (error) return alert("Error");
  }

  document.getElementById("nombre").value = "";
  document.getElementById("whatsapp").value = "";

  load();
};

// =====================
// CARGAR LISTA
// =====================
async function load() {

  const container = document.getElementById("container");
  container.innerHTML = "";

  let data;

  if (mode === "clientes") {

    const res = await supabase.from("clientes").select("*");
    data = res.data || [];

  } else {

    const res = await supabase.from("proveedores").select("*");
    data = res.data || [];
  }

  data.forEach(item => {

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <h3>${item.nombre || item.proveedor}</h3>
      <p>${item.whatsapp}</p>

      <button onclick="deleteItem('${mode}','${item.id_cliente || item.id_proveedor}')">
        Eliminar
      </button>
    `;

    container.appendChild(div);
  });
}

load();

// =====================
// ELIMINAR
// =====================
window.deleteItem = async (type, id) => {

  if (!confirm("Eliminar registro?")) return;

  if (type === "clientes") {

    await supabase
      .from("clientes")
      .delete()
      .eq("id_cliente", id);

  } else {

    await supabase
      .from("proveedores")
      .delete()
      .eq("id_proveedor", id);
  }

  load();
};
