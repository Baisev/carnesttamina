import { supabase } from './supabaseClient.js';
import { actualizarContadorCarrito } from './carritoglobal.js';

document.addEventListener('DOMContentLoaded', () => {
  mostrarCarrito();
  actualizarContadorCarrito();
// ================================
// AUTOCOMPLETAR DATOS DEL CLIENTE
// ================================
  async function cargarDatosCliente() {
    try {
  await new Promise(resolve => setTimeout(resolve, 200));

  const { data: authData } = await supabase.auth.getUser();

  if (!authData || !authData.user) {
    console.log("No hay sesión activa (todavía).");
    return;
  }


    const uid = authData.user.id;

    const { data: usuarioData, error: userError } = await supabase
      .from("usuario")
      .select("cliente_id")
      .eq("auth_user_id", uid)
      .single();

    if (userError || !usuarioData) {
      console.log("Usuario sin cliente_id.");
      return;
    }

    const clienteId = usuarioData.cliente_id;

    const { data: cliente, error: cliError } = await supabase
      .from("cliente")
      .select("nombre_razon, rut, telefono, calle")
      .eq("cliente_id", clienteId)
      .single();

    if (cliError || !cliente) {
      console.log("No se halló cliente en la base.");
      return;
    }

    if (document.getElementById("nombre").value.trim() === "")
      document.getElementById("nombre").value = cliente.nombre_razon || "";

    if (document.getElementById("rut").value.trim() === "")
      document.getElementById("rut").value = cliente.rut || "";

    if (document.getElementById("telefono").value.trim() === "")
      document.getElementById("telefono").value = cliente.telefono || "";

    if (document.getElementById("direccion").value.trim() === "")
      document.getElementById("direccion").value = cliente.calle || "";

  } catch (err) {
    console.error("Error cargando datos del cliente:", err);
  }
}

cargarDatosCliente();
  sincronizarResumen();
});

function mostrarCarrito() {
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  const contenedor = document.querySelector('.carrito-body');
  const totalElem = document.getElementById('total');

  contenedor.innerHTML = '';

  if (carrito.length === 0) {
    contenedor.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding:20px;">
          🛒 Tu carrito está vacío.
        </td>
      </tr>`;
    totalElem.textContent = '$0';
    sincronizarResumen();
    return;
  }

  let total = 0;
  carrito.forEach((item, i) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;

    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td class="carrito-producto">
        <img src="${item.imagen_url}" class="miniatura">
        <span>${item.nombre}</span>
        </td>
      <td>
        <input type="number" value="${item.cantidad}" min="1"
               data-index="${i}" class="input-cantidad" style="width:60px;">
      </td>
      <td>${item.precio.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</td>
      <td>${subtotal.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</td>
      <td><button class="btn-eliminar" data-index="${i}">🗑️</button></td>
    `;
    contenedor.appendChild(fila);
  });

  totalElem.textContent = total.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
  sincronizarResumen();

  document.querySelectorAll('.input-cantidad')
          .forEach(input => input.addEventListener('change', actualizarCantidad));

  document.querySelectorAll('.btn-eliminar')
          .forEach(btn => btn.addEventListener('click', eliminarProducto));
}

function actualizarCantidad(e) {
  const index = e.target.dataset.index;
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  carrito[index].cantidad = parseInt(e.target.value) || 1;
  localStorage.setItem('carrito', JSON.stringify(carrito));
  mostrarCarrito();
}

function eliminarProducto(e) {
  const index = e.target.dataset.index;
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  carrito.splice(index, 1);
  localStorage.setItem('carrito', JSON.stringify(carrito));
  mostrarCarrito();
}

document.getElementById('vaciarCarrito').addEventListener('click', () => {
  localStorage.removeItem('carrito');
  mostrarCarrito();
});

function sincronizarResumen() {
  const total = document.getElementById('total').textContent;
  const resumenTotal = document.getElementById('carrito-total');
  if (resumenTotal) resumenTotal.textContent = total;
}
document.getElementById('btnPagar').addEventListener('click', () => {
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  if (!carrito.length) {
    alert("Tu carrito está vacío 😅");
    return;
  }

const nombre = document.getElementById("nombre").value.trim();
const rut = document.getElementById("rut").value.trim();
const direccion = document.getElementById("direccion").value.trim();
const telefono = document.getElementById("telefono").value.trim();
const email = document.getElementById("email").value.trim();
const guardarDireccion = document.getElementById("guardar_direccion").checked;

localStorage.setItem("datosCliente", JSON.stringify({
  nombre,
  rut,
  direccion,
  telefono,
  email,
  guardarDireccion
}));



  window.location.href = "pago.html";
});

