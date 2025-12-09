import { supabase } from './supabaseClient.js';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('registerForm');
  const mensaje = document.getElementById('mensaje');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensaje.textContent = '';

    const nombre = document.getElementById('nombre').value.trim();
    const rut = document.getElementById('rut').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmarPassword = document.getElementById('confirmarPassword').value.trim();

    const codigoPais = document.getElementById('codigoPais').value;
    const telefonoInput = document.getElementById('telefono').value.trim();
    const direccion = document.getElementById('direccion').value.trim();

    // 🔐 Validación de contraseña mínima
    if (password.length < 6) {
      mensaje.textContent = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    // 🔐 Confirmación de contraseña
    if (password !== confirmarPassword) {
      mensaje.textContent = 'Las contraseñas no coinciden.';
      return;
    }

    // 📱 Validación de teléfono según país
    // Quitamos espacios, guiones, etc. y dejamos solo dígitos
    const soloDigitos = telefonoInput.replace(/\D/g, '');

    if (!soloDigitos) {
      mensaje.textContent = 'Debes ingresar un teléfono válido.';
      return;
    }

    // Validación especial para Chile (+56): +56 9 XXXXXXXX (9 dígitos empezando en 9)
    if (codigoPais === '+56') {
      if (soloDigitos.length !== 9 || !soloDigitos.startsWith('9')) {
        mensaje.textContent = 'Para Chile, el teléfono debe comenzar con 9 y tener 9 dígitos (ej: 9 1234 5678).';
        return;
      }
    } else {
      // Validación genérica para otros países (entre 7 y 12 dígitos)
      if (soloDigitos.length < 7 || soloDigitos.length > 12) {
        mensaje.textContent = 'Debes ingresar un teléfono válido para el país seleccionado.';
        return;
      }
    }

    // Guardamos el teléfono completo con el código de país
    const telefono = codigoPais + soloDigitos;

    // 1️⃣ Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error(authError);

      // Manejo amigable de correo duplicado
      const msg = (authError.message || '').toLowerCase();
      if (msg.includes('already registered') || msg.includes('user already registered')) {
        mensaje.textContent = 'Este correo ya está registrado. Intenta iniciar sesión.';
      } else {
        mensaje.textContent = 'Error al registrar usuario: ' + authError.message;
      }
      return;
    }

    const authUserId = authData.user.id;

  //Crear cliente (incluye teléfono y dirección)
const { data: clienteData, error: clienteError } = await supabase
  .from('cliente')
  .insert([{
    nombre_razon: nombre,
    email: email,
    rut: rut || null,
    telefono: telefono,      
    calle: direccion || null, 
    comuna: null,
    ciudad: null,
    referencia: null,
    estado: 'activo',
  }])
  .select('cliente_id')
  .single();


    if (clienteError) {
      console.error(clienteError);
      mensaje.textContent = "Error al crear cliente: " + clienteError.message;
      return;
    }

    const clienteId = clienteData.cliente_id;

    // 3️⃣ Crear usuario interno con cliente_id
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('usuario')
      .insert([{
        email,
        nombre,
        cliente_id: clienteId,
        hash_password: password,
        activo: true,
        auth_user_id: authUserId
      }])
      .select('usuario_id')
      .single();

    if (usuarioError) {
      console.error(usuarioError);
      mensaje.textContent = "Error al guardar usuario: " + usuarioError.message;
      return;
    }

    const usuarioId = usuarioData.usuario_id;

    // 4️⃣ Asignar rol cliente
    const { error: rolError } = await supabase
      .from('usuario_rol')
      .insert([{ usuario_id: usuarioId, rol_id: 1 }]);

    if (rolError) {
      console.error(rolError);
      mensaje.textContent = "Error al asignar rol: " + rolError.message;
      return;
    }

    alert("¡Registro exitoso! Ahora puedes iniciar sesión.");
    window.location.href = "login.html";
  });
});





