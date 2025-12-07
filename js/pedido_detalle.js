// js/pedido_detalle.js
import { supabase } from "./supabaseClient.js";

const params = new URLSearchParams(window.location.search);
const pedidoID = Number(params.get("id"));

const qs = (s) => document.querySelector(s);
const fmtCLP = (v) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(v ?? 0);

let pedidoGlobal = null;
let itemsGlobal = [];

document.addEventListener("DOMContentLoaded", async () => {
  const cont = qs("#detalle");
  if (!cont) return;

  if (!pedidoID) {
    cont.innerHTML = `<p>ID de pedido inválido.</p>`;
    return;
  }

  try {
    const { data: pedido, error: errPedido } = await supabase
      .from("pedido")
      .select("*")
      .eq("pedido_id", pedidoID)
      .single();

    if (errPedido || !pedido) {
      console.error("Error pedido:", errPedido);
      cont.innerHTML = `<p>No se pudo cargar el pedido.</p>`;
      return;
    }
    pedidoGlobal = pedido;

    const { data: items, error: errItems } = await supabase
      .from("pedido_item")
      .select("*")
      .eq("pedido_id", pedidoID);

    if (errItems) {
      console.error("Error items:", errItems);
      cont.innerHTML = `<p>No se pudieron cargar los productos del pedido.</p>`;
      return;
    }

    if (!items || !items.length) {
      cont.innerHTML = `<p>Este pedido no tiene productos asociados.</p>`;
      return;
    }
    itemsGlobal = items;

    const idsProd = [...new Set(items.map((i) => i.producto_id))];

    const { data: productos, error: errProd } = await supabase
      .from("producto")
      .select("producto_id, nombre, imagen_url, unidad")
      .in("producto_id", idsProd);

    if (errProd) {
      console.error("Error productos:", errProd);
    }

  const mapProd = {};
  productos.forEach(p => {
    mapProd[p.producto_id] = p;
  });

  // --- Datos de envío / cliente ---
  // Aquí asumimos posibles nombres de columnas. Ajusta si tu tabla 'pedido'
  // usa otros nombres (por ejemplo direccion_envio, calle_envio, etc.)
  const partesDireccion = [];

  // Calle / dirección principal
  if (pedido.calle_envio) {
    partesDireccion.push(pedido.calle_envio);
  } else if (pedido.calle) {
    partesDireccion.push(pedido.calle);
  } else if (pedido.direccion_envio) {
    partesDireccion.push(pedido.direccion_envio);
  } else if (pedido.direccion) {
    partesDireccion.push(pedido.direccion);
  }

  // Número
  if (pedido.numero) {
    partesDireccion.push(`#${pedido.numero}`);
  }

  // Comuna / ciudad
  if (pedido.comuna) {
    partesDireccion.push(pedido.comuna);
  }
  if (pedido.ciudad) {
    partesDireccion.push(pedido.ciudad);
  }

  const direccionEnvio = partesDireccion.join(", ");

  // Nombre y teléfono de contacto (usa el que exista)
  const nombreDestinatario =
    pedido.nombre_destinatario ||
    pedido.nombre_cliente ||
    pedido.nombre ||
    "";

  const telefonoContacto =
    pedido.telefono_contacto ||
    pedido.telefono ||
    "";

  // Tipo de entrega / método (si lo tuvieras en la tabla)
  const tipoEntrega =
    pedido.tipo_entrega ||
    pedido.metodo_entrega ||
    "";

  // Bloque HTML solo si hay algo que mostrar
  const bloqueEnvio =
    direccionEnvio || nombreDestinatario || telefonoContacto || tipoEntrega
      ? `
      <h3>Datos de envío</h3>
      <p><strong>Destinatario:</strong> ${nombreDestinatario || "—"}</p>
      <p><strong>Dirección:</strong> ${direccionEnvio || "—"}</p>
      ${
        tipoEntrega
          ? `<p><strong>Tipo de entrega:</strong> ${tipoEntrega}</p>`
          : ""
      }
      ${
        telefonoContacto
          ? `<p><strong>Teléfono de contacto:</strong> ${telefonoContacto}</p>`
          : ""
      }
      <hr>
    `
      : "";

  // --- Render del pedido completo ---
  cont.innerHTML = `
    <div class="pedido-box">
      <h2>🧾 Pedido #${pedidoID}</h2>
      <p><strong>Fecha:</strong> ${new Date(pedido.fecha).toLocaleString()}</p>
      <p><strong>Estado:</strong> ${pedido.estado ?? "—"}</p>
      <p><strong>Total:</strong> ${fmtCLP(pedido.total)}</p>
      <hr>

      ${bloqueEnvio}

      <h3>Productos del pedido:</h3>

      ${items
        .map((i) => {
          const p = mapProd[i.producto_id] ?? {};
          return `
          <div class="item">
            <img src="${p.imagen_url || "img/placeholder.jpg"}" alt="">
            <div class="item-info">
              <a href="producto.html?id=${i.producto_id}">
                ${p.nombre ?? "Producto eliminado"}
              </a>
              <p>Cantidad: ${i.cantidad} ${p.unidad || ""}</p>
              <p>Precio unidad: ${fmtCLP(i.precio_unitario)}</p>
              <p><strong>Total línea: ${fmtCLP(i.total_linea)}</strong></p>
            </div>
          </div>
        `;
        })
        .join("")}
    </div>
  `;

    // === 5) Configurar panel solo para empleados ===
    configurarPanelEstadoEmpleado();

    // === 6) Boleta PDF (si tienes el botón en el HTML) ===
    const btnBoleta = qs("#btnBoleta");
    if (btnBoleta) {
      btnBoleta.addEventListener("click", generarBoletaPDF);
    }
  } catch (err) {
    console.error("Error general en detalle de pedido:", err);
    cont.innerHTML = `<p>❌ Ocurrió un error al cargar el detalle del pedido.</p>`;
  }
});

// ===============================
// PANEL DE ESTADO PARA EMPLEADO
// ===============================

function configurarPanelEstadoEmpleado() {
  const panel = qs("#panel-estado-empleado");
  if (!panel || !pedidoGlobal) return;

  const rol = localStorage.getItem("rol"); // "1" = cliente, "2" = empleado
  const esEmpleado = rol === "2";

  // Mostrar estado actual
  const spanEstadoActual = qs("#estado-actual-text");
  if (spanEstadoActual) spanEstadoActual.textContent = pedidoGlobal.estado || "—";

  // Si no es empleado → ocultar
  if (!esEmpleado) {
    panel.style.display = "none";
    return;
  }

  // Excluir pedidos pendientes de pago
  const estadoLower = (pedidoGlobal.estado || "").toLowerCase();
  const esPendientePago =
    estadoLower === "pendiente" ||
    estadoLower === "pendiente de pago" ||
    (estadoLower.startsWith("pendiente") &&
      !estadoLower.includes("envío") &&
      !estadoLower.includes("envio"));

  if (esPendientePago) {
    panel.style.display = "none";
    return;
  }

  // Si pasa los filtros → mostrar panel
  panel.style.display = "block";

  panel.addEventListener("click", async (e) => {
    const btn = e.target.closest(".estado-btn[data-estado]");
    if (!btn) return;

    const nuevoEstado = btn.dataset.estado;
    if (!nuevoEstado) return;

    const textoOriginal = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Guardando...";

    // 🔥 Actualizar en Supabase
    const { error } = await supabase
      .from("pedido")
      .update({ estado: nuevoEstado })
      .eq("pedido_id", pedidoID);

    btn.disabled = false;
    btn.textContent = textoOriginal;

    if (error) {
      console.error("Error actualizando estado:", error);
      if (window.Swal) {
        Swal.fire(
          "Error",
          "No se pudo actualizar el estado del pedido.\nRevisa la consola (F12) por si es un problema de RLS.",
          "error"
        );
      } else {
        alert("No se pudo actualizar el estado del pedido.");
      }
      return;
    }

    // ✅ Solo si el UPDATE fue OK, actualizamos el front
    pedidoGlobal.estado = nuevoEstado;

    const spanDetalle = qs("#estado-detalle");
    if (spanDetalle) spanDetalle.textContent = nuevoEstado;

    const spanActual = qs("#estado-actual-text");
    if (spanActual) spanActual.textContent = nuevoEstado;

    if (window.Swal) {
      Swal.fire(
        "Estado actualizado",
        "El estado del pedido se ha modificado correctamente.",
        "success"
      );
    }
  });
}

// ===============================
// BOLETA PDF (simple)
// ===============================

async function generarBoletaPDF() {
  if (!pedidoGlobal || !itemsGlobal.length) {
    alert("No hay datos del pedido para generar la boleta.");
    return;
  }

  if (!window.jspdf) {
    alert("La librería jsPDF no está disponible.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  const colorPrincipal = [139, 0, 0];

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(...colorPrincipal);
  pdf.text("Carnes Ttamiña", 20, 20);

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);
  pdf.text("Boleta de compra", 20, 30);

  const fecha = new Date(pedidoGlobal.fecha).toLocaleString("es-CL");
  pdf.text(`Pedido N°: ${pedidoGlobal.pedido_id || pedidoID}`, 20, 45);
  pdf.text(`Fecha: ${fecha}`, 20, 52);
  pdf.text(`Estado: ${pedidoGlobal.estado || "-"}`, 20, 59);
  pdf.text(`Total: ${fmtCLP(pedidoGlobal.total)}`, 20, 66);

  let y = 80;
  pdf.setFont("helvetica", "bold");
  pdf.text("Producto", 20, y);
  pdf.text("Cant.", 100, y);
  pdf.text("Total", 150, y);
  pdf.setFont("helvetica", "normal");
  y += 8;

  itemsGlobal.forEach((it) => {
    const lineaTotal = it.total_linea ?? 0;
    pdf.text(`ID ${it.producto_id}`, 20, y);
    pdf.text(String(it.cantidad ?? 0), 105, y);
    pdf.text(`$${Number(lineaTotal).toLocaleString("es-CL")}`, 150, y, {
      align: "right",
    });
    y += 8;
  });

  y += 10;
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...colorPrincipal);
  pdf.text(
    `TOTAL: $${Number(pedidoGlobal.total || 0).toLocaleString("es-CL")}`,
    20,
    y
  );

  pdf.save(`Boleta_Pedido_${pedidoID}.pdf`);
}




