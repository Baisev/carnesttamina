import { supabase } from './supabaseClient.js';

// Cerrar sesión
export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  localStorage.removeItem('usuario');
  localStorage.removeItem('rol');
  if (error) {
    console.error('Error al cerrar sesión:', error);
  } else {
    window.location.href = 'login.html';
  }
}

// Detectar sesión activa
export async function verificarSesion() {
  const { data } = await supabase.auth.getUser();
  if (data?.user) {
    localStorage.setItem('usuario', JSON.stringify(data.user));
    return data.user;
  } else {
    localStorage.removeItem('usuario');
    return null;
  }
}

// ---------- parte del login （￣︶￣）↗　 ----------
window.addEventListener('DOMContentLoaded', async () => {
  // Ejecutar solo en login.html
  if (!window.location.pathname.includes("login.html")) return;

  const form = document.getElementById('loginForm');
  const mensaje = document.getElementById('mensaje');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensaje.textContent = '';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    const { data: sessionData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      mensaje.textContent = 'Credenciales incorrectas o usuario no registrado.';
      console.error(error);
      return;
    }

    const user = sessionData.user;
    localStorage.setItem('usuario', JSON.stringify(user));

    // Buscar usuario en tabla 'usuario'
    const { data: usuarioDB, error: usuarioError } = await supabase
      .from('usuario')
      .select('usuario_id')
      .eq('auth_user_id', user.id)
      .single();

    if (usuarioError || !usuarioDB) {
      mensaje.textContent = 'No se encontró el usuario en la base de datos.';
      console.error(usuarioError);
      return;
    }

    const usuarioId = usuarioDB.usuario_id;

    // Buscar rol
    const { data: rolData, error: rolError } = await supabase
      .from('usuario_rol')
      .select('rol_id')
      .eq('usuario_id', usuarioId)
      .single();

    if (rolError || !rolData) {
      mensaje.textContent = 'El usuario no tiene un rol asignado.';
      console.error(rolError);
      return;
    }

    const rol_id = rolData.rol_id;
    localStorage.setItem('rol', rol_id);

    // Redirigir según el rol
    if (rol_id === 1) {
      window.location.href = 'pag_principal.html';
    } else {
      window.location.href = 'menu.html';
    }
  });
});





