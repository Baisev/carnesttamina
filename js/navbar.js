import { verificarSesion, cerrarSesion } from "./auth.js";

// 👉 1) FUNCIÓN GLOBAL DE "VOLVER"
function irAtras(urlFallback = "pag_principal.html") {
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    const mismoOrigen = ref && ref.origin === window.location.origin;

    if (mismoOrigen && window.history.length > 1) {
      // Venimos de otra página del mismo sitio → atrás en el historial
      window.history.back();
    } else {
      // Si no hay historial útil, vamos al fallback
      window.location.href = urlFallback;
    }
  } catch (e) {
    window.location.href = urlFallback;
  }
}

document.addEventListener("DOMContentLoaded", async () => {

  // 👉 2) ENGANCHE DEL BOTÓN "VOLVER" DEL NAVBAR
  const btnVolver = document.getElementById("btnVolverNavbar");
  if (btnVolver) {
    btnVolver.addEventListener("click", (e) => {
      e.preventDefault();
      irAtras(); // si quieres, puedes pasar otro fallback: irAtras("pedidos.html")
    });
  }

  // ===============================
  // CONTROL DE DROPDOWNS
  // ===============================
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

  // ===============================
  // CONTROL DE ENLACES SEGÚN ROL
  // ===============================
  setTimeout(() => {
    const navbarList = document.querySelector(".navbar-right ul");
    if (!navbarList) return;

    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const rol = localStorage.getItem("rol");

    // 🔸 Agregar enlace "Pedidos / Mis pedidos" si no existe
    if (!document.querySelector('a[href="pedidos.html"]')) {
      const liPedidos = document.createElement("li");
      const enlace = document.createElement("a");

      enlace.href = "pedidos.html";
      enlace.innerHTML = rol === "2"
        ? `<i class="fa fa-truck"></i> Pedidos`
        : `<i class="fa fa-shopping-basket"></i> Mis Pedidos`;

      liPedidos.appendChild(enlace);

      // Insertar antes del último elemento (el dropdown)
      const dropdown = navbarList.querySelector(".dropdown");
      navbarList.insertBefore(liPedidos, dropdown);
    }

    // 🔸 Ocultar "Base de Datos" si la tienes y el usuario no es empleado
    const baseDatosLink = document.querySelector('a[href="menu.html"]');
    if (baseDatosLink && (!usuario || rol === "1")) {
      baseDatosLink.style.display = "none";
    }
  }, 200);

  // ===============================
  // BIENVENIDA Y CIERRE DE SESIÓN
  // ===============================
  const user = await verificarSesion();
  const dropdownBienvenido = document.querySelector(".navbar-right .dropdown.align-right");

  if (user && dropdownBienvenido) {
    const nombreUsuario = user.user_metadata?.nombre || user.email?.split("@")[0] || "Usuario";
    const linkPrincipal = dropdownBienvenido.querySelector(":scope > a");

    // Mostrar saludo personalizado
    if (linkPrincipal) {
      linkPrincipal.innerHTML = `<i class="fa fa-user"></i> ${nombreUsuario}`;
    }

    // Actualizar el menú del dropdown
    const submenu = dropdownBienvenido.querySelector(".dropdown-menu");
    if (submenu) {
      submenu.innerHTML = `
        <li><a href="cuenta.html"><i class="fa fa-id-card"></i> Mi cuenta</a></li>
        <li><a id="cerrarSesionLink" href="#"><i class="fa fa-sign-out-alt"></i> Cerrar sesión</a></li>
      `;
    }

    // Cerrar sesión
    document.getElementById("cerrarSesionLink")?.addEventListener("click", async (e) => {
      e.preventDefault();
      await cerrarSesion();
    });
  }
});



