// js/cambiar_contrasena.js
import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('changeForm');
  const mensaje = document.getElementById('mensaje');

  // 1) Verificar que hay una sesión válida (la que crea Supabase al entrar desde el mail)
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error(error);
  }

  const session = data?.session ?? null;

  if (!session) {
    mensaje.textContent =
      'Este enlace no es válido o ha expirado. Vuelve a solicitar la recuperación de contraseña.';
    if (form) form.style.display = 'none';
    return;
  }

  // 2) Manejar el submit del formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensaje.textContent = '';

    const pass = document.getElementById('password').value.trim();
    const pass2 = document.getElementById('confirmPassword').value.trim();

    if (pass.length < 6) {
      mensaje.textContent = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }
    if (pass !== pass2) {
      mensaje.textContent = 'Las contraseñas no coinciden.';
      return;
    }

    const { error: updError } = await supabase.auth.updateUser({ password: pass });

    if (updError) {
      console.error(updError);
      mensaje.textContent = 'No se pudo cambiar la contraseña: ' + updError.message;
      return;
    }

    if (window.Swal) {
      Swal.fire(
        'Contraseña actualizada',
        'Tu contraseña ha sido cambiada correctamente. Ahora puedes iniciar sesión.',
        'success'
      ).then(() => {
        window.location.href = 'login.html';
      });
    } else {
      alert('Contraseña actualizada. Ahora puedes iniciar sesión.');
      window.location.href = 'login.html';
    }
  });
});
