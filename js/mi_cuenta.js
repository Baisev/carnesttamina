// js/mi_cuenta.js
import { supabase } from './supabaseClient.js';

/* util */
const $ = (s) => document.querySelector(s);
const toast = (text, type='info') => {
  // mini toast con SweetAlert para feedback rápido
  const bg = type==='ok' ? '#10b981' : type==='warn' ? '#f59e0b' : type==='err' ? '#ef4444' : '#374151';
  const color = '#fff';
  const div = document.createElement('div');
  div.textContent = text;
  div.style.cssText = `position:fixed;right:16px;bottom:16px;background:${bg};color:${color};padding:10px 14px;border-radius:10px;z-index:9999;box-shadow:0 2px 6px rgba(0,0,0,.15)`;
  document.body.appendChild(div);
  setTimeout(()=>div.remove(), 2200);
};

let session = null;
let usuario = null;     // fila en tabla usuario
let cliente = null;     // fila en tabla cliente (si existe)
let usuarioId = null;

async function load() {
  // 1) Sesión
  const { data: sdata, error: sErr } = await supabase.auth.getSession();
  if (sErr) console.warn('getSession error:', sErr);
  const sess = sdata?.session;
  session = sess;
  if (!session) {
    toast('Inicia sesión para ver tu cuenta', 'warn');
    window.location.href = 'login.html';
    return;
  }

  // Pinta encabezado base
  const email = session.user.email || '—';
  $('#emailView').textContent = email;
  $('#vEmail').textContent = email;
  $('#avatar').textContent = (session.user.user_metadata?.name?.[0] || email?.[0] || 'U').toUpperCase();

  // 2) Trae fila de usuario (más robusto)
  //    - maybeSingle() para no romper si no hay fila
  //    - Fallback por email si no encuentra por auth_user_id
  let { data: u, error: uErr, status: uStatus } = await supabase
    .from('usuario')
    .select('usuario_id, nombre, cliente_id')
    .eq('auth_user_id', session.user.id)
    .maybeSingle();

  if (uErr) console.warn('SELECT usuario por auth_user_id =>', uErr, 'status:', uStatus);

  if (!u) {
    // Fallback: buscar por email (por si la fila se creó sin auth_user_id)
    const res2 = await supabase
      .from('usuario')
      .select('usuario_id, nombre, cliente_id, email')
      .eq('email', email)
      .maybeSingle();
    u = res2.data;
    if (res2.error) console.warn('SELECT usuario por email =>', res2.error);
  }

  if (!u) {
    // No hay fila de usuario: mostramos badge de no validado y dejamos valores por defecto
    $('#badgeIdentidad').className = 'badge badge-warn';
    $('#badgeIdentidad').textContent = 'Identidad no validada';
    console.warn('No existe fila en tabla usuario para este auth.uid().');
    return;
  }

  usuario = u;
  usuarioId = u.usuario_id;

  // 3) Trae cliente (si hay relación)
  cliente = null;
  if (u.cliente_id) {
    const { data: c, error: cErr, status: cStatus } = await supabase
      .from('cliente')
      .select('cliente_id, nombre_razon, rut')
      .eq('cliente_id', u.cliente_id)
      .maybeSingle();
    if (cErr) console.warn('SELECT cliente =>', cErr, 'status:', cStatus);
    cliente = c || null;
  }

  // 4) Pinta valores
  const nombre = u?.nombre || cliente?.nombre_razon || '';
  const rut = cliente?.rut || '';

  $('#vNombre').textContent = nombre || '—';
  $('#vRut').textContent = rut || '—';

  $('#inpNombre').value = nombre;
  $('#inpRut').value = rut;
  $('#inpEmail').value = email;
}
async function savePerfil() {
  const nombre = $('#inpNombre').value.trim();
  const rut = $('#inpRut').value.trim();
  if (!nombre) return toast('El nombre es requerido', 'warn');

  // usuario.nombre
  if (usuarioId) {
    const { error } = await supabase.from('usuario')
      .update({ nombre })
      .eq('usuario_id', usuarioId);
    if (error) return toast('Error guardando nombre', 'err');
  }

  // cliente: si existe, update; si no, intenta crearlo y enlazarlo
  if (cliente?.cliente_id) {
    const upd = { nombre_razon: nombre, rut: rut || null };
    const { error } = await supabase.from('cliente')
      .update(upd)
      .eq('cliente_id', cliente.cliente_id);
    if (error) return toast('Error guardando RUT', 'err');
  } else {
    // crear cliente y asociarlo al usuario (si quieres que siempre exista)
    if (rut || nombre) {
      const { data: cIns, error: cErr } = await supabase
        .from('cliente')
        .insert([{ nombre_razon: nombre, rut: rut || null, estado: 'activo', creado_en: new Date() }])
        .select('cliente_id')
        .maybeSingle();
      if (!cErr && cIns?.cliente_id) {
        await supabase.from('usuario').update({ cliente_id: cIns.cliente_id }).eq('usuario_id', usuarioId);
        cliente = { cliente_id: cIns.cliente_id, nombre_razon: nombre, rut };
      }
    }
  }

  // refresca UI
  $('#vNombre').textContent = nombre || '—';
  $('#vRut').textContent = rut || '—';
  $('#badgeIdentidad').className = 'badge badge-ok';
  $('#badgeIdentidad').textContent = 'Identidad validada';
  toast('Perfil actualizado', 'ok');
}

/* actualizar credenciales (email/password) */
async function saveCuenta() {
  const newEmail = $('#inpEmail').value.trim();
  const p1 = $('#inpPass1').value;
  const p2 = $('#inpPass2').value;

  if (!newEmail && !p1 && !p2) {
    toast('No hay cambios', 'warn'); 
    return;
  }

  // email
  if (newEmail && newEmail !== session.user.email) {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) return toast('Error actualizando e-mail', 'err');
    $('#vEmail').textContent = newEmail;
    $('#emailView').textContent = newEmail;
    toast('Revisa tu correo para confirmar el cambio de e-mail', 'ok');
  }

  // password
  if (p1 || p2) {
    if (p1.length < 6) return toast('La contraseña debe tener ≥ 6 caracteres', 'warn');
    if (p1 !== p2)    return toast('Las contraseñas no coinciden', 'warn');
    const { error } = await supabase.auth.updateUser({ password: p1 });
    if (error) return toast('Error actualizando contraseña', 'err');
    $('#inpPass1').value = ''; $('#inpPass2').value = '';
    toast('Contraseña actualizada', 'ok');
  }
}

/* toggles “Modificar / Guardar / Cancelar” como en ML */
function setupToggles() {
  // PERFIL: mostrar inputs cuando el usuario edite
  const panelPerfil = document.querySelectorAll('#eNombre, #eRut');
  const valuesPerfil = document.querySelectorAll('#vNombre, #vRut');

  const showPerfilEdit = (show) => {
    panelPerfil.forEach(el => el.style.display = show ? 'block' : 'none');
    valuesPerfil.forEach(el => el.style.display = show ? 'none' : 'block');
  };

  // por defecto: modo ver
  showPerfilEdit(false);

  // si el usuario toca cualquier campo de la sección, mostrar edición
  valuesPerfil.forEach(v => {
    v.addEventListener('click', () => showPerfilEdit(true));
  });

  // botones
  document.querySelector('[data-save="perfil"]').addEventListener('click', async () => {
    await savePerfil();
    showPerfilEdit(false);
  });
  document.querySelector('[data-cancel="perfil"]').addEventListener('click', () => {
    // reset inputs y volver a ver
    $('#inpNombre').value = $('#vNombre').textContent === '—' ? '' : $('#vNombre').textContent;
    $('#inpRut').value = $('#vRut').textContent === '—' ? '' : $('#vRut').textContent;
    showPerfilEdit(false);
  });

  // CUENTA: email editable al click
  const vEmail = $('#vEmail');
  const eEmail = $('#eEmail');
  const emailInput = $('#inpEmail');

  const showEmailEdit = (show) => {
    eEmail.style.display = show ? 'block' : 'none';
    vEmail.style.display = show ? 'none' : 'block';
  };
  showEmailEdit(false);

  vEmail.addEventListener('click', () => showEmailEdit(true));

  document.querySelector('[data-save="cuenta"]').addEventListener('click', async () => {
    await saveCuenta();
    showEmailEdit(false);
  });
  document.querySelector('[data-cancel="cuenta"]').addEventListener('click', () => {
    emailInput.value = vEmail.textContent;
    $('#inpPass1').value = ''; $('#inpPass2').value = '';
    showEmailEdit(false);
  });
}

/* iniciar */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await load();
    setupToggles();
  } catch (e) {
    console.error(e);
    toast('No se pudieron cargar tus datos', 'err');
  }
});
