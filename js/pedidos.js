import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("lista-pedidos");
  if (!contenedor) return;

  contenedor.innerHTML = `<p>Cargando tus pedidos...</p>`;

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      contenedor.innerHTML = `
        <p>
          Debes 
          <a href="login.html" style="color:#5353ec; font-weight:bold; text-decoration:underline;">
            Iniciar Sesión
          </a> 
          para ver tus pedidos.
        </p>`;
      return;
    }

    const usuarioID = user.id;
    const rol = Number(localStorage.getItem("rol") || "0");
    console.log("Rol detectado:", rol);
    console.log("Usuario actual UUID:", usuarioID);

    const SELECT_CON_RELACIONES = `
      *,
      pedido_item(
        cantidad,
        total_linea,
        producto(
          nombre,
          imagen_url
        )
      )
    `;

    let pedidosQuery;

    if (rol === 1) {
      const { data: usuarioRow, error: usrErr } = await supabase
        .from("usuario")
        .select("cliente_id")
        .eq("auth_user_id", usuarioID)
        .single();

      if (usrErr || !usuarioRow?.cliente_id) {
        console.error("Error obteniendo cliente_id:", usrErr);
        contenedor.innerHTML = `<p>No se pudo obtener tu perfil de cliente.</p>`;
        return;
      }

      const clienteID = usuarioRow.cliente_id;
      console.log("cliente_id:", clienteID);

      pedidosQuery = supabase
        .from("pedido")
        .select(SELECT_CON_RELACIONES)
        .eq("cliente_id", clienteID)
        .order("fecha", { ascending: false });

      console.log("🧾 Modo cliente");
    } else if (rol === 2) {
      pedidosQuery = supabase
        .from("pedido")
        .select(SELECT_CON_RELACIONES)
        .order("fecha", { ascending: false });

      console.log("🧾 Modo empleado");
    } else {
      contenedor.innerHTML = `<p>No tienes permisos para ver pedidos.</p>`;
      return;
    }

    const { data: pedidos, error } = await pedidosQuery;
    if (error) throw error;

    if (!pedidos || pedidos.length === 0) {
      contenedor.innerHTML = `<p>No hay pedidos registrados.</p>`;
      return;
    }

    pedidos.forEach((p) => {
      if (typeof p.total === "string") {
        p.total = Number(p.total.trim().replace(",", "."));
      }
    });

    const fmtCLP = (v) =>
      new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
      }).format(v ?? 0);

    const ITEMS_POR_PAGINA = 9;
    let paginaActual = 1;

    const paginacionDiv = document.getElementById("paginacion");
    const btnPrev = document.getElementById("btn-prev");
    const btnNext = document.getElementById("btn-next");
    const lblPagina = document.getElementById("pagina-actual");

    const pedidosOriginales = [...pedidos];
    let pedidosFiltrados = [...pedidosOriginales];

    let totalPaginas = Math.max(
      1,
      Math.ceil(pedidosFiltrados.length / ITEMS_POR_PAGINA)
    );

    function renderPagina(pagina) {
      paginaActual = pagina;

      const inicio = (pagina - 1) * ITEMS_POR_PAGINA;
      const fin = inicio + ITEMS_POR_PAGINA;
      const pedidosPagina = pedidosFiltrados.slice(inicio, fin);

      if (!pedidosPagina.length) {
        contenedor.innerHTML = `<p>No se encontraron pedidos con los filtros seleccionados.</p>`;
        lblPagina.textContent = `Página 0 de 0`;
        if (btnPrev) btnPrev.disabled = true;
        if (btnNext) btnNext.disabled = true;
        if (paginacionDiv) paginacionDiv.style.display = "none";
        return;
      }

      contenedor.innerHTML = pedidosPagina
        .map((p, index) => {
          const numeroPedido =
            rol === 1 ? inicio + index + 1 : p.pedido_id;

          const imagenes = p.pedido_item
            ?.map((i) => i.producto?.imagen_url)
            .filter((img) => img);

          const imagenPrincipal =
            imagenes?.[0] ??
            "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/480px-No_image_available.svg.png";

          return `
            <div class="pedido-card">
              <div class="pedido-img">
                <img class="pedido-img-img" src="${imagenPrincipal}" alt="Pedido" />
              </div>

              <h3>
                Pedido #${numeroPedido}
                ${rol === 1 ? `<span class="id-real">(ID real: ${p.pedido_id})</span>` : ""}
              </h3>
              <p><strong>Fecha:</strong> ${new Date(p.fecha).toLocaleString()}</p>
              <p><strong>Total:</strong> ${fmtCLP(Number(p.total))}</p>

              <button class="ver-detalle" data-id="${p.pedido_id}">
                Ver detalles
              </button>
            </div>
          `;
        })
        .join("");

      if (lblPagina) {
        lblPagina.textContent = `Página ${paginaActual} de ${totalPaginas}`;
      }
      if (btnPrev) btnPrev.disabled = paginaActual === 1;
      if (btnNext) btnNext.disabled = paginaActual === totalPaginas;

      contenedor.querySelectorAll(".ver-detalle").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const id = e.target.dataset.id;
          window.location.href = `pedido_detalle.html?id=${id}`;
        });
      });

      if (paginacionDiv) paginacionDiv.style.display = "flex";
    }
    const filtroEstado = document.getElementById("filtro-estado");
    const filtroPedido = document.getElementById("filtro-pedido");
    const filtroFecha = document.getElementById("filtro-fecha");

    function aplicarFiltros() {
      let filtrados = [...pedidosOriginales];

      if (filtroEstado && filtroEstado.value !== "todos") {
        const estadoBuscado = filtroEstado.value.toLowerCase();
        filtrados = filtrados.filter(
          (p) => (p.estado ?? "").toLowerCase() === estadoBuscado
        );
      }

      if (filtroFecha) {
        if (filtroFecha.value === "recientes") {
          filtrados.sort(
            (a, b) => new Date(b.fecha) - new Date(a.fecha)
          );
        }

        if (filtroFecha.value === "antiguos") {
          filtrados.sort(
            (a, b) => new Date(a.fecha) - new Date(b.fecha)
          );
        }
      }

      if (filtroPedido && filtroPedido.value.trim() !== "") {
        const numeroBuscado = Number(filtroPedido.value.trim());
        filtrados = filtrados.filter(
          (p) => p.pedido_id === numeroBuscado
        );
      }

      pedidosFiltrados = filtrados;

      totalPaginas = Math.max(
        1,
        Math.ceil(pedidosFiltrados.length / ITEMS_POR_PAGINA)
      );

      renderPagina(1);
    }

    if (filtroEstado) filtroEstado.addEventListener("change", aplicarFiltros);
    if (filtroPedido) filtroPedido.addEventListener("input", aplicarFiltros);
    if (filtroFecha) filtroFecha.addEventListener("change", aplicarFiltros);

    if (btnPrev) {
      btnPrev.addEventListener("click", () => {
        if (paginaActual > 1) renderPagina(paginaActual - 1);
      });
    }

    if (btnNext) {
      btnNext.addEventListener("click", () => {
        if (paginaActual < totalPaginas)
          renderPagina(paginaActual + 1);
      });
    }

    renderPagina(1);

    document.getElementById("btn-volver")?.addEventListener("click", () => {
      window.location.href = "pag_principal.html";
    });

    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("pedido-img-img")) {
        const modal = document.getElementById("img-modal");
        const modalImg = document.getElementById("imgModalBig");

        if (!modal || !modalImg) return;

        modal.style.display = "flex";
        modalImg.src = e.target.src;
      }
    });

    document.querySelector(".img-close")?.addEventListener("click", () => {
      const modal = document.getElementById("img-modal");
      if (modal) modal.style.display = "none";
    });

    document.getElementById("img-modal")?.addEventListener("click", (e) => {
      if (e.target.id === "img-modal") {
        e.target.style.display = "none";
      }
    });
  } catch (err) {
    console.error("Error cargando pedidos:", err);
    contenedor.innerHTML = `<p> Ocurrió un error al cargar los pedidos.</p>`;
  }
});
