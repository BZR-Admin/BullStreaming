import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

window.login = async function () {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {

    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    const user = userCredential.user;

    // 🔥 buscar rol en Firestore
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      alert("Usuario no registrado en sistema");
      return;
    }

    const data = snap.data();

    // 🔥 redirección por rol
    if (data.rol === "admin") {
      window.location.href = "dashboard_admin.html";
    } else {
      window.location.href = "dashboard_user.html";
    }

  } catch (error) {
    alert(error.message);
  }
};
