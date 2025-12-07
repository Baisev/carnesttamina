import { supabase } from './supabaseClient.js';

async function cargarUsuarios() {
  const { data, error } = await supabase
    .from('usuario')
    .select('usuario_id, email, nombre, usuario_rol(rol_id, rol(nombre))')

  if (error) {
    console.error('Error Supabase:', error)
    alert('Error al cargar los usuarios\n\nRevisa la consola (F12) para más detalles.')
    return
  }

  const tbody = document.querySelector('#tabla-usuarios tbody')
  tbody.innerHTML = ''

  data.forEach(u => {
    const rolActual = u.usuario_rol?.[0]?.rol?.nombre || 'cliente'
    const fila = document.createElement('tr')
    fila.innerHTML = `
      <td>${u.usuario_id}</td>
      <td>${u.email}</td>
      <td>${u.nombre || ''}</td>
      <td>${rolActual}</td>
      <td>
        <select id="rol-${u.usuario_id}">
          <option value="1" ${rolActual === 'cliente' ? 'selected' : ''}>Cliente</option>
          <option value="2" ${rolActual === 'empleado' ? 'selected' : ''}>Empleado</option>
        </select>
      </td>
      <td><button onclick="actualizarRol(${u.usuario_id})">Guardar</button></td>
    `
    tbody.appendChild(fila)
  })
}

window.actualizarRol = async function (usuarioId) {
  const nuevoRol = document.querySelector(`#rol-${usuarioId}`).value

  await supabase.from('usuario_rol').delete().eq('usuario_id', usuarioId)

  const { error } = await supabase
    .from('usuario_rol')
    .insert([{ usuario_id: usuarioId, rol_id: nuevoRol }])

  if (error) {
    console.error('Error al actualizar rol:', error)
    alert('Error al actualizar rol')
  } else {
    alert('Rol actualizado correctamente')
    cargarUsuarios()
  }
}

document.addEventListener('DOMContentLoaded', cargarUsuarios)



