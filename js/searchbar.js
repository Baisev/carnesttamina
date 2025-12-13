import { supabase } from './supabaseClient.js';

const input = document.querySelector('.navbar-search input');
if (!input) { /* si no hay buscador en esta página, salimos */  }

const host = document.querySelector('.navbar-search');
const panel = document.createElement('div');
panel.id = 'search-panel';
panel.innerHTML = `<div class="search-head">Buscar productos</div>
<ul id="search-results" style="list-style:none;margin:0;padding:0"></ul>
<div class="search-foot" id="search-foot" style="display:none"></div>`;
host.appendChild(panel);

const ul = panel.querySelector('#search-results');
const foot = panel.querySelector('#search-foot');

let items = [];
let activeIndex = -1;
const fmtCLP = v => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(v ?? 0);

const debounce = (fn, ms=220) => {
  let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); };
};

function openPanel() { panel.classList.add('open'); }
function closePanel() { panel.classList.remove('open'); activeIndex=-1; }
function setActive(i) {
  Array.from(ul.children).forEach((li, idx)=> li.classList.toggle('is-active', idx===i));
  activeIndex = i;
}

function render(list, q) {
  ul.innerHTML = '';
  if (!list || list.length===0) {
    ul.innerHTML = `<div class="search-empty">No se encontraron productos</div>`;
    foot.style.display = 'none';
    return;
  }

  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
  list.forEach(p => {
    const li = document.createElement('li');
    li.className = 'search-item';
    li.innerHTML = `
      <img src="${p.imagen_url || 'img/placeholder-producto.jpg'}" alt="">
      <div>
        <div class="name">${(p.nombre || '').replace(re, '<mark>$1</mark>')}</div>
        <div class="meta">${p.categoria ?? ''}${p.stock!=null ? ` · Stock: ${p.stock}` : ''}</div>
      </div>
      <div class="price">${fmtCLP(p.precio)}</div>
    `;
    li.addEventListener('click', () => {
      window.location.href = `producto.html?id=${p.producto_id}`;
    });
    ul.appendChild(li);
  });

  foot.innerHTML = `Ver todos los resultados para <b>"${q}"</b>`;
  foot.style.display = 'block';
  foot.onclick = () => window.location.href = `buscar.html?q=${encodeURIComponent(input.value.trim())}`;
}

async function query(q) {
  if (!q || q.length < 2) { ul.innerHTML=''; foot.style.display='none'; return; }

  ul.innerHTML = `<div class="search-empty">Buscando…</div>`;
  foot.style.display = 'none';

  const { data, error } = await supabase
    .from('producto')
    .select('producto_id, nombre, precio, imagen_url, categoria, stock, activo, descripcion')
    .eq('activo', true)
    .or(`nombre.ilike.%${q}%,descripcion.ilike.%${q}%`)
    .order('nombre', { ascending: true })
    .limit(10);

  if (error) {
    ul.innerHTML = `<div class="search-empty">Error al buscar</div>`;
    return;
  }
  items = data || [];
  render(items, q);
}

const doSearch = debounce(async () => {
  const q = input.value.trim();
  if (!q) { closePanel(); return; }
  openPanel();
  await query(q);
}, 200);

input.addEventListener('focus', () => {
  if (input.value.trim().length >= 1) openPanel();
});
input.addEventListener('input', doSearch);

input.addEventListener('keydown', (e) => {
  if (!panel.classList.contains('open')) return;
  const count = ul.children.length;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (count === 0) return;
    const next = activeIndex + 1 >= count ? 0 : activeIndex + 1;
    setActive(next);
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (count === 0) return;
    const prev = activeIndex - 1 < 0 ? count - 1 : activeIndex - 1;
    setActive(prev);
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    if (activeIndex >= 0 && ul.children[activeIndex]) {
      ul.children[activeIndex].click();
    } else {
      if (items.length > 0) {
        window.location.href = `producto.html?id=${items[0].producto_id}`;
      } else {
        closePanel();
      }
    }
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    closePanel();
  }
});

document.addEventListener('click', (e) => {
  if (!panel.contains(e.target) && !host.contains(e.target)) closePanel();
});
