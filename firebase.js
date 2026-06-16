import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB4VEJxsxMWK0DFlu0jST6cBQBlHFUk0-g",
  authDomain: "bd-bull-streaming.firebaseapp.com",
  projectId: "bd-bull-streaming",
  storageBucket: "bd-bull-streaming.firebasestorage.app",
  messagingSenderId: "151325862722",
  appId: "1:151325862722:web:a7e1613209018ed761b6db",
  measurementId: "G-7FYT9VY081"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
