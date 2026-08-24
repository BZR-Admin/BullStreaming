import { supabase } from "./supabase.js";

export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // No hay sesión → manda al login
    window.location.href = "login.html";
    return null;
  }

  return session.user;
}

export async function logout() {
  await supabase.auth.signOut();
  window.location.href = "login.html";
}
