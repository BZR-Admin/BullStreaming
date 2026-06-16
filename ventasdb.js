let tipoVenta = "VI";

window.setType = function(type){
  tipoVenta = type;
  alert("Tipo de venta: " + type);
}

window.clearText = function(){
  document.getElementById("textInput").value = "";
}

window.processText = function(){

  const text = document.getElementById("textInput").value;

  if(!text){
    alert("No hay texto");
    return;
  }

  // 🔥 DETECCIONES BÁSICAS
  let usuario = text.match(/Usuario:\s*(.*)/i);
  let password = text.match(/Contraseña:\s*(.*)/i);
  let perfil = text.match(/Perfil:\s*(.*)/i);
  let vencimiento = text.match(/Expira:\s*(.*)/i);

  const data = {
    tipoVenta,
    usuario: usuario ? usuario[1] : null,
    password: password ? password[1] : null,
    perfil: perfil ? perfil[1] : null,
    vencimiento: vencimiento ? vencimiento[1] : null
  };

  console.log("DATA DETECTADA:", data);

  alert("Datos detectados. Revisa consola (F12)");
}
