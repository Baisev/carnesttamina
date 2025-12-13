window.addEventListener('scroll', () => {
  const footer = document.getElementById('footer');
  if (window.scrollY + window.innerHeight >= document.body.scrollHeight) {
    footer.classList.add('show'); 
  } else {
    footer.classList.remove('show'); 
  }
});

