import { supabase } from './supabaseClient.js';

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Obtener usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    // Si no hay sesión -> redirige a la página de acceso denegado
    if (!user) {
      window.location.href = "pasaporte.html";
      return;
    }

    // Buscar el rol del usuario en la base
    const { data, error } = await supabase
      .from('usuario')
      .select(`
        usuario_id,
        usuario_rol(
          rol(
            rol_id,
            nombre
          )
        )
      `)
      .eq('auth_user_id', user.id)
      .single();

    if (error || !data) {
      console.error("Error al obtener rol:", error);
      window.location.href = "pasaporte.html";
      return;
    }

    // Obtener el rol (por defecto 1 = cliente)
    const rol = data.usuario_rol?.[0]?.rol?.rol_id || 1;

    // Si no es empleado (rol_id = 2), redirigir
    if (rol !== 2) {
      window.location.href = "pasaporte.html";
    }

  } catch (err) {
    console.error("Error en la validación de acceso:", err);
    window.location.href = "pasaporte.html";
  }
});



