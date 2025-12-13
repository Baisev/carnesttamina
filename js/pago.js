import { supabase } from "./supabaseClient.js";

const fmtCLP = v => new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
}).format(v);

const lista = document.getElementById("lista-productos");
const totalElem = document.getElementById("pago-total");
const btnConfirmar = document.getElementById("btnConfirmar");
const barra = document.getElementById("barra-progreso");
const estadoPago = document.getElementById("estadoPago");

const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
const datosCliente = JSON.parse(localStorage.getItem("datosCliente")) || {};

console.log("📌 Datos cliente cargados:", datosCliente);

let procesando = false;
let timeoutCompra;

if (!carrito.length) {
  lista.innerHTML = "<p>Tu carrito está vacío.</p>";
} else {
  let total = 0;
  lista.innerHTML = carrito.map(item => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;

    return `
      <div class="item">
        <img src="${item.imagen_url}">
        <div>
          <p><strong>${item.nombre}</strong></p>
          <p>Cantidad: ${item.cantidad}</p>
          <p>${fmtCLP(subtotal)}</p>
        </div>
      </div>
    `;
  }).join("");

  totalElem.textContent = fmtCLP(total);
}

async function procesarPago() {
  if (procesando) return;
  procesando = true;

  estadoPago.textContent = "Procesando pago...";

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    alert("Debes iniciar sesión para continuar.");
    window.location.href = "login.html";
    return;
  }

  const uid = authData.user.id;

  const { data: usuarioData, error: usuarioError } = await supabase
    .from("usuario")
    .select("cliente_id")
    .eq("auth_user_id", uid)
    .single();

  if (usuarioError || !usuarioData) {
    console.error("No se encontró cliente asociado al usuario.");
    alert("Hubo un problema con tu cuenta.");
    return;
  }

  const clienteId = usuarioData.cliente_id;

  if (datosCliente.guardarDireccion) {
    const { error: updateError } = await supabase
      .from("cliente")
      .update({
        direccion: datosCliente.direccion || null,
        telefono: datosCliente.telefono || null
      })
      .eq("cliente_id", clienteId);

    if (updateError) {
      console.error("Error al actualizar dirección:", updateError);
    }
  }

  const total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

  const { data: pedido, error: pedidoErr } = await supabase
    .from("pedido")
    .insert([{
      cliente_id: clienteId,
      metodo_pago: "simulado",
      estado: "pagado",
      total: total,
      fecha: new Date(),
      nombre_cliente: datosCliente.nombre || null,
      rut_cliente: datosCliente.rut || null,
      direccion: datosCliente.direccion || null,
      telefono: datosCliente.telefono || null
    }])
    .select()
    .single();

  if (pedidoErr) {
    console.error(pedidoErr);
    estadoPago.textContent = "❌ Error al generar el pedido.";
    return;
  }

  for (const item of carrito) {
    await supabase.from("pedido_item").insert([{
      pedido_id: pedido.pedido_id,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio,
      total_linea: item.precio * item.cantidad
    }]);
  }


  if (!datosCliente.email) {
    console.error("❌ ERROR: No existe datosCliente.email en localStorage");
    alert("No se pudo enviar la boleta porque falta tu correo.");
  } else {
    try {
      const respuesta = await fetch(
        "https://bag1caiwbidyevwiqqzd.supabase.co/functions/v1/enviar-boleta",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: datosCliente.email,
            nombre: datosCliente.nombre,
            telefono: datosCliente.telefono,
            direccion: datosCliente.direccion,
            pedido_id: pedido.pedido_id,
            fecha: new Date().toLocaleString("es-CL"),
            total: total,
            items: carrito.map((p) => ({
              nombre: p.nombre,
              cantidad: p.cantidad,
              total_linea: p.precio * p.cantidad
            }))
          })
        }
      );

      const data = await respuesta.json();
      console.log("📩 Respuesta función boleta:", data);

    } catch (error) {
      console.error("❌ Error enviando boleta:", error);
    }
  }


  try {
    await fetch("https://hook.us2.make.com/ne1tqo86ekvmspyjjk2fe1gfkj72gnvf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pedido_id: pedido.pedido_id,
        total,
        cliente: {
          nombre: datosCliente.nombre,
          telefono: datosCliente.telefono,
          direccion: datosCliente.direccion,
          email: datosCliente.email,
        },
        items: carrito.map((p) => ({
          nombre: p.nombre,
          cantidad: p.cantidad,
          precio_unitario: p.precio,
          total_linea: p.precio * p.cantidad,
        })),
      }),
    });
  } catch (e) {
    console.error("Error al llamar al webhook de Make:", e);
  }

  localStorage.removeItem("carrito");
  localStorage.removeItem("datosCliente");
  localStorage.setItem("carrito", JSON.stringify([]));

  estadoPago.textContent = "✔ Pago confirmado";

  setTimeout(() => {
    window.location.href = `pedido_detalle.html?id=${pedido.pedido_id}`;
  }, 1500);
}

btnConfirmar.addEventListener("click", () => {
  if (procesando) return;

  barra.style.width = "100%"; 
  procesarPago();
});

timeoutCompra = setTimeout(() => {
  if (!procesando) {
    barra.style.width = "100%";
    procesarPago();
  }
}, 4500);

document.getElementById("btnCancelar").addEventListener("click", () => {
  clearTimeout(timeoutCompra);
  window.location.href = "carrito.html";
});

