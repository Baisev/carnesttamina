export function agregarAlCarrito(producto) {
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];

  const index = carrito.findIndex(item => item.producto_id === producto.producto_id);
  if (index !== -1) {
    carrito[index].cantidad += 1;
  } else {
    carrito.push({
      producto_id: producto.producto_id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1,
      imagen_url: producto.imagen_url
    });
  }

  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarContadorCarrito();

  window.dispatchEvent(new CustomEvent('cart:changed', {
    detail: { reason: 'add', itemId: producto.producto_id }
  }));
}

export function actualizarContadorCarrito() {
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  const contador = document.querySelector('.cart-count');
  if (contador) contador.textContent = total;
}

document.addEventListener('DOMContentLoaded', actualizarContadorCarrito);


