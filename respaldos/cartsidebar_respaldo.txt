(function () {
  const STORAGE_KEY = 'carrito';
  let els = {};

  document.addEventListener('DOMContentLoaded', init);

  window.addEventListener('cart:changed', () => {
    render();
  });

  function init() {
    injectUI();
    render();

    els.overlay.addEventListener('click', close);
    els.btnClose.addEventListener('click', close);
    els.items.addEventListener('click', onItemsClick);
    els.btnEmpty.addEventListener('click', emptyCart);
    els.btnCheckout.addEventListener('click', () => location.href = 'carrito.html');
  }

  function injectUI() {
    if (!document.querySelector('#cartOverlay')) {
      const ov = document.createElement('div');
      ov.id = 'cartOverlay';
      document.body.appendChild(ov);
    }
    if (!document.querySelector('#cartSidebar')) {
      const html = `
        <aside id="cartSidebar" aria-hidden="true">
          <div class="cs-header">
            <h3 class="cs-title">Tu carrito</h3>
            <button class="cs-close" aria-label="Cerrar">&times;</button>
          </div>
          <div class="cs-items"></div>
          <div class="cs-footer">
            <div class="cs-totalrow">
              <span>Total:</span>
              <strong class="cs-total">$0</strong>
            </div>
            <div class="cs-actions">
              <button class="cs-btn outline" id="csEmpty">Vaciar</button>
              <button class="cs-btn primary" id="csCheckout">Ir a pagar</button>
            </div>
          </div>
        </aside>`;
      document.body.insertAdjacentHTML('beforeend', html);
    }

    els.overlay   = document.querySelector('#cartOverlay');
    els.sidebar   = document.querySelector('#cartSidebar');
    els.items     = els.sidebar.querySelector('.cs-items');
    els.total     = els.sidebar.querySelector('.cs-total');
    els.btnClose  = els.sidebar.querySelector('.cs-close');
    els.btnEmpty  = els.sidebar.querySelector('#csEmpty');
    els.btnCheckout = els.sidebar.querySelector('#csCheckout');
  }

  function readCart() {
    try { const arr = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; return Array.isArray(arr) ? arr : []; }
    catch { return []; }
  }
  function writeCart(arr) { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }

  function open() {
    els.sidebar.classList.add('open');
    els.overlay.classList.add('open');
    document.body.classList.add('cs-noscr');
  }
  function close() {
    els.sidebar.classList.remove('open');
    els.overlay.classList.remove('open');
    document.body.classList.remove('cs-noscr');
  }

  function onItemsClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    let cart = readCart();
    const idx = cart.findIndex(x => String(x.producto_id) === String(id));
    if (idx === -1) return;

    if (act === 'inc') cart[idx].cantidad = (cart[idx].cantidad || 1) + 1;
    if (act === 'dec') cart[idx].cantidad = Math.max(1, (cart[idx].cantidad || 1) - 1);
    if (act === 'rm')  cart.splice(idx, 1);

    writeCart(cart);
    render();
  }

  function emptyCart() { writeCart([]); render(); }

  function render() {
    const cart = readCart();
    if (!cart.length) {
      els.items.innerHTML = `<p class="cs-empty">Tu carrito está vacío.</p>`;
      els.total.textContent = '$0';
      updateBadge(0);
      return;
    }

    let html = '';
    let total = 0;
    for (const it of cart) {
      const id  = it.producto_id;
      const nom = it.nombre || 'Producto';
      const img = it.imagen_url || 'img/placeholder.png';
      const qty = Number(it.cantidad || 1);
      const pr  = Number(it.precio || 0);
      const line = pr * qty;
      total += line;

      html += `
        <div class="cs-item">
          <img src="${img}" alt="${escapeHtml(nom)}">
          <div>
            <div class="cs-name">${escapeHtml(nom)}</div>
            <div class="cs-price">$${fmt(pr)} c/u</div>
            <div class="cs-qtyrow">
              <button data-act="dec" data-id="${id}">−</button>
              <span>${qty}</span>
              <button data-act="inc" data-id="${id}">+</button>
              <button class="cs-rm" data-act="rm" data-id="${id}">Quitar</button>
            </div>
          </div>
          <div><strong>$${fmt(line)}</strong></div>
        </div>`;
    }

    els.items.innerHTML = html;
    els.total.textContent = `$${fmt(total)}`;
    updateBadge(cart.reduce((a, it) => a + Number(it.cantidad || 1), 0));
  }

  function updateBadge(forceCount) {
    const el = document.querySelector('.cart-count');
    if (!el) return;
    if (forceCount != null) { el.textContent = String(forceCount); return; }
    const cart = readCart();
    el.textContent = String(cart.reduce((a, it) => a + Number(it.cantidad || 1), 0));
  }

  function fmt(n) { try { return Number(n).toLocaleString('es-CL'); } catch { return n; } }
  function escapeHtml(s='') {
    return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  // Enganche por delegación: por si la navbar se inyecta tarde
  window.addEventListener('load', () => {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('.cart-icon a, a[href*="carrito.html"]');
      if (!a) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || a.target === '_blank') return;
      e.preventDefault();
      if (!document.querySelector('#cartSidebar') || !document.querySelector('#cartOverlay')) return;
      open();
    });
  });
})();
