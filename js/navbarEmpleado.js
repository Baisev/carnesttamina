document.addEventListener('DOMContentLoaded', () => {
  const rol = Number(localStorage.getItem('rol'));

  if (rol === 2) {
    const navbarContainer = document.querySelector('.navbar-container');


    const menuBtn = document.createElement('button');
    menuBtn.classList.add('menu-btn');
    menuBtn.innerHTML = '<i class="fa fa-bars"></i>';
    navbarContainer.insertBefore(menuBtn, navbarContainer.firstChild);

    const sideMenu = document.createElement('div');
    sideMenu.classList.add('side-menu');
    sideMenu.innerHTML = `
      <div class="side-menu-content">
        <h3>Panel Empleado</h3>
        <ul>
          <li><a href="menu.html"><i class="fa fa-box"></i> Base de Datos</a></li>
          <li><a href="gestion_usuarios.html"><i class="fa fa-users-cog"></i> Gestión de Usuarios</a></li>
          <li><a href="pedidos.html"><i class="fa fa-truck"></i> Pedidos</a></li>
        </ul>
      </div>
    `;
    document.body.appendChild(sideMenu);

    menuBtn.addEventListener('click', () => {
      sideMenu.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!sideMenu.contains(e.target) && !menuBtn.contains(e.target)) {
        sideMenu.classList.remove('open');
      }
    });
  }
});

