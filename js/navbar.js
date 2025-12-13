import { verificarSesion, cerrarSesion } from "./auth.js";


function irAtras(urlFallback = "pag_principal.html") {
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    const mismoOrigen = ref && ref.origin === window.location.origin;

    if (mismoOrigen && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = urlFallback;
    }
  } catch (e) {
    window.location.href = urlFallback;
  }
}

document.addEventListener("DOMContentLoaded", async () => {

  const btnVolver = document.getElementById("btnVolverNavbar");
  if (btnVolver) {
    btnVolver.addEventListener("click", (e) => {
      e.preventDefault();
      irAtras(); 
    });
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(".dropdown > a");
    if (trigger) {
      e.preventDefault();
      e.stopPropagation();

      const li = trigger.parentElement;
      const submenu = li.querySelector(".dropdown-menu");

      document.querySelectorAll(".dropdown-menu.show").forEach((m) => {
        if (m !== submenu) m.classList.remove("show");
      });

      if (submenu) submenu.classList.toggle("show");
      return;
    }

    if (!e.target.closest(".dropdown")) {
      document.querySelectorAll(".dropdown-menu.show").forEach((m) => m.classList.remove("show"));
    }
  });

  document.addEventListener("click", (e) => {
    const linkInsideMenu = e.target.closest(".dropdown-menu a");
    if (linkInsideMenu) {
      const menu = linkInsideMenu.closest(".dropdown-menu");
      if (menu) menu.classList.remove("show");
    }
  });

  setTimeout(() => {
    const navbarList = document.querySelector(".navbar-right ul");
    if (!navbarList) return;

    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const rol = localStorage.getItem("rol");

    if (!document.querySelector('a[href="pedidos.html"]')) {
      const liPedidos = document.createElement("li");
      const enlace = document.createElement("a");

      enlace.href = "pedidos.html";
      enlace.innerHTML = rol === "2"
        ? `<i class="fa fa-truck"></i> Pedidos`
        : `<i class="fa fa-shopping-basket"></i> Mis Pedidos`;

      liPedidos.appendChild(enlace);

      const dropdown = navbarList.querySelector(".dropdown");
      navbarList.insertBefore(liPedidos, dropdown);
    }

    const baseDatosLink = document.querySelector('a[href="menu.html"]');
    if (baseDatosLink && (!usuario || rol === "1")) {
      baseDatosLink.style.display = "none";
    }
  }, 200);

  const user = await verificarSesion();
  const dropdownBienvenido = document.querySelector(".navbar-right .dropdown.align-right");

  if (user && dropdownBienvenido) {
    const nombreUsuario = user.user_metadata?.nombre || user.email?.split("@")[0] || "Usuario";
    const linkPrincipal = dropdownBienvenido.querySelector(":scope > a");

    if (linkPrincipal) {
      linkPrincipal.innerHTML = `<i class="fa fa-user"></i> ${nombreUsuario}`;
    }

    const submenu = dropdownBienvenido.querySelector(".dropdown-menu");
    if (submenu) {
      submenu.innerHTML = `
        <li><a href="cuenta.html"><i class="fa fa-id-card"></i> Mi cuenta</a></li>
        <li><a id="cerrarSesionLink" href="#"><i class="fa fa-sign-out-alt"></i> Cerrar sesión</a></li>
      `;
    }
    document.getElementById("cerrarSesionLink")?.addEventListener("click", async (e) => {
      e.preventDefault();
      await cerrarSesion();
    });
  }
});



