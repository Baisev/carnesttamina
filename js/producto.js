import { supabase } from './supabaseClient.js';

const qs  = (s)=>document.querySelector(s);
const qsa = (s)=>Array.from(document.querySelectorAll(s));
const fmtCLP = v => new Intl.NumberFormat('es-CL',{
  style:'currency', currency:'CLP', maximumFractionDigits:0
}).format(v ?? 0);

function getId(){
  const u = new URL(location.href);
  return u.searchParams.get('id');
}

function stockEstado(n){
  if ((n ?? 0) <= 0) return { t:'Sin stock', cls:'out' };
  if (n <= 5)        return { t:`Stock bajo (${n})`, cls:'low' };
  return { t:`En stock (${n})`, cls:'ok' };
}

function agregarAlCarrito(p, qty){
  const key='carrito';
  const raw = localStorage.getItem(key);
  const cart = raw ? JSON.parse(raw) : [];
  const idx = cart.findIndex(i=>i.id === p.producto_id);
  if (idx>=0) cart[idx].cantidad += qty;
  else cart.push({
    id: p.producto_id,
    nombre: p.nombre,
    precio: p.precio,
    imagen: p.imagen_url,
    cantidad: qty
  });
  localStorage.setItem(key, JSON.stringify(cart));
  Swal.fire({
    icon:'success',
    title:'Agregado',
    text:'Producto agregado al carrito',
    timer:1200,
    showConfirmButton:false
  });
}

function tabs(){
  qsa('.tab-btn').forEach(b=>{
    b.addEventListener('click', ()=>{
      qsa('.tab-btn').forEach(x=>x.classList.remove('activo'));
      b.classList.add('activo');
      qsa('.tab-panel').forEach(x=>x.classList.remove('activo'));
      qs(`#tab-${b.dataset.tab}`).classList.add('activo');
    });
  });
}


(async function init(){
  const id = getId();
  if (!id) { 
    qs('#producto').innerHTML = '<p>Falta el parámetro ?id</p>'; 
    return; 
  }

  const { data: p, error } = await supabase
    .from('producto')
    .select('producto_id, nombre, precio, imagen_url, categoria, stock, activo, descripcion, unidad')
    .eq('producto_id', Number(id))
    .eq('activo', true)
    .single();

  if (error || !p){ 
    qs('#producto').innerHTML = '<p>Producto no encontrado.</p>'; 
    return; 
  }


  qs('#miga').innerHTML = `
    <a href="pag_principal.html">Inicio</a> /
    ${p.categoria ? `<a href="${p.categoria.toLowerCase()}.html">${p.categoria}</a> / ` : ''}
    <span>${p.nombre}</span>`;

  document.title = `${p.nombre} | Carnes Ttamiña`;
  qs('#img').src = p.imagen_url || '';
  qs('#nombre').textContent = p.nombre;
  qs('#precio').textContent = fmtCLP(p.precio);
  qs('#unidad').textContent = p.unidad ? ` / ${p.unidad}` : '';
  qs('#descripcion').textContent = p.descripcion || '';

  const st = stockEstado(p.stock);
  const stEl = qs('#stock'); 
  stEl.textContent = st.t; 
  stEl.classList.add(st.cls);


  const input = qs('#cantidad');
  qs('#menos').onclick = ()=>{ input.value = Math.max(1, (+input.value||1)-1); };
  qs('#mas').onclick   = ()=>{ input.value = (+input.value||1)+1; };
  const btnAgregar = qs('#agregar');
  if ((p.stock ?? 0) <= 0) btnAgregar.disabled = true;
  btnAgregar.onclick = ()=> agregarAlCarrito(p, Math.max(1, +input.value||1));


  qs('#desc-larga').innerHTML = (p.descripcion || '').replace(/\n/g,'<br>');
  qs('#specs').innerHTML = '<li>—</li>';
  tabs();


  if (p.categoria){
    const { data: rel } = await supabase
      .from('producto')
      .select('producto_id, nombre, precio, imagen_url')
      .eq('categoria', p.categoria)
      .neq('producto_id', p.producto_id)
      .eq('activo', true)
      .limit(8);

    qs('#rel').innerHTML = (rel ?? []).map(r=>`
      <a class="card" href="producto.html?id=${r.producto_id}">
        <img src="${r.imagen_url || ''}" alt="${r.nombre}">
        <div class="c-body">
          <div class="c-title">${r.nombre}</div>
          <div class="c-precio">${fmtCLP(r.precio)}</div>
        </div>
      </a>
    `).join('');
  }


  document.querySelectorAll('.info-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      item.classList.toggle('active');
    });
  });
})();

