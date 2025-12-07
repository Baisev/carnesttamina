// Mostrar el footer solo cuando se llega al final de la página
window.addEventListener('scroll', () => {
  const footer = document.getElementById('footer');
  if (window.scrollY + window.innerHeight >= document.body.scrollHeight) {
    footer.classList.add('show'); // Mostrar footer
  } else {
    footer.classList.remove('show'); // Ocultar footer
  }
});

