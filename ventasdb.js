import { db } from "./firebase.js";

import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let tipoVenta = "VI";

window.setType = function(type){
  tipoVenta = type;
  alert("Tipo de venta: " + type);
}

window.clearText = function(){
  document.getElementById("textInput").value = "";
}

window.processText = async function(){

  const text = document.getElementById("textInput").value;

  if(!text){
    alert("No hay texto");
    return;
  }

  let usuario = text.match(/Usuario:\s*(.*)/i);
  let password = text.match(/Contraseña:\s*(.*)/i);
  let perfil = text.match(/Perfil:\s*(.*)/i);
  let vencimiento = text.match(/Expira:\s*(.*)/i);

  const data = {
    tipoVenta,
    usuario: usuario ? usuario[1] : "",
    password: password ? password[1] : "",
    perfil: perfil ? perfil[1] : "",
    vencimiento: vencimiento ? vencimiento[1] : "",
    fecha: new Date().toISOString()
  };

  try {

    await addDoc(collection(db, "ventas"), data);

    alert("✅ Venta registrada en Firebase");

  } catch (error) {
    console.error(error);
    alert("Error al guardar venta");
  }
}
