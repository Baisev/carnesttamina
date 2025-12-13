import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('resetForm');
  const mensaje = document.getElementById('mensaje');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensaje.textContent = '';

    const email = document.getElementById('email').value.trim();
    if (!email) {
      mensaje.textContent = 'Ingresa un correo válido.';
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/cambiar_contrasena.html`,
      });

      if (error) {
        console.error(error);
        const msg = (error.message || '').toLowerCase();

        if (msg.includes('rate limit')) {
          mensaje.textContent =
            'Se ha alcanzado el límite de correos de recuperación. Inténtalo más tarde o contacta a la carnicería.';
        } else {
          mensaje.textContent = 'No se pudo enviar el correo: ' + error.message;
        }
        return;
      }

      if (window.Swal) {
        Swal.fire(
          'Correo enviado',
          'Si el correo existe en el sistema, recibirás un enlace para restablecer tu contraseña.',
          'success'
        );
      } else {
        alert('Si el correo existe, se ha enviado un enlace de recuperación.');
      }
    } catch (err) {
      console.error(err);
      mensaje.textContent = 'Ocurrió un error inesperado. Inténtalo más tarde.';
    }
  });
});
