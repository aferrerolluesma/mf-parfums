/* ====================================================================
   MF PARFUMS — App
   ====================================================================
   IMPORTANTE: cambia este número por el WhatsApp real de la empresa,
   en formato internacional sin '+' ni espacios. Ejemplo España: 34600000000
   ==================================================================== */
const WHATSAPP_NUMBER = "34663230312"; // <-- EDITA AQUÍ tu número de empresa

// Los productos se cargan desde js/products.js

const euro = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const genderLabel = (g) => g === "hombre" ? "Hombre" : g === "mujer" ? "Mujer" : "Unisex";
const initials = (brand) => brand.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();

let currentFilter = "todos";
let cart = [];

function productImageHTML(p) {
  return p.image
    ? `<img src="${p.image}" alt="${p.brand} ${p.name}">`
    : `<span class="mf-monogram">${initials(p.brand)}</span>`;
}

function renderGrid(list) {
  const grid = document.getElementById('product-grid');
  const noResults = document.getElementById('no-results');
  if (list.length === 0) { grid.innerHTML = ""; noResults.hidden = false; return; }
  noResults.hidden = true;

  grid.innerHTML = list.map(p => {
    const discount = p.oldPrice ? Math.round(100 - (p.price / p.oldPrice) * 100) : null;
    return `
    <article class="product-card" data-id="${p.id}" tabindex="0">
      <div class="product-image">
        ${productImageHTML(p)}
        <span class="product-badge">${genderLabel(p.gender)}</span>
        ${discount ? `<span class="product-discount">-${discount}%</span>` : ""}
      </div>
      <div class="product-info">
        <p class="product-brand">${p.brand}</p>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-size">${p.size}</p>
        <div class="product-price-row">
          <span class="product-price">${euro(p.price)}</span>
          ${p.oldPrice ? `<span class="product-old-price">${euro(p.oldPrice)}</span>` : ""}
        </div>
      </div>
    </article>`;
  }).join("");

  grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => openProductModal(card.dataset.id));
    card.addEventListener('keypress', (e) => { if (e.key === 'Enter') openProductModal(card.dataset.id); });
  });
}

function applyFilter() {
  const list = currentFilter === "todos" ? PRODUCTS : PRODUCTS.filter(p => p.gender === currentFilter);
  renderGrid(list);
}

document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => { c.classList.remove('active'); c.setAttribute('aria-selected', 'false'); });
    chip.classList.add('active');
    chip.setAttribute('aria-selected', 'true');
    currentFilter = chip.dataset.filter;
    applyFilter();
  });
});

/* ---------------- SEARCH ---------------- */
const searchToggle = document.getElementById('search-toggle');
const searchOverlay = document.getElementById('search-overlay');
const searchClose = document.getElementById('search-close');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

function openSearch() { searchOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; setTimeout(() => searchInput.focus(), 250); }
function closeSearch() { searchOverlay.classList.remove('open'); document.body.style.overflow = ''; searchInput.value = ""; searchResults.innerHTML = ""; }
searchToggle.addEventListener('click', openSearch);
searchClose.addEventListener('click', closeSearch);
searchOverlay.addEventListener('click', (e) => { if (e.target === searchOverlay) closeSearch(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeSearch(); closeCart(); closeProductModal(); closeCheckoutModal(); } });

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) { searchResults.innerHTML = ""; return; }
  const matches = PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  if (matches.length === 0) {
    searchResults.innerHTML = `<p class="search-empty">No hemos encontrado perfumes que coincidan con "${searchInput.value}".</p>`;
    return;
  }
  searchResults.innerHTML = matches.map(p => `
    <div class="search-result-item" data-id="${p.id}">
      <div><span class="sr-brand">${p.brand}</span><span class="sr-name">${p.name}</span></div>
      <span class="sr-price">${euro(p.price)}</span>
    </div>`).join("");
  searchResults.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => { closeSearch(); openProductModal(item.dataset.id); });
  });
});

/* ---------------- PRODUCT MODAL ---------------- */
const productModalOverlay = document.getElementById('product-modal-overlay');
let activeProduct = null;

function openProductModal(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  activeProduct = p;
  document.getElementById('modal-image').innerHTML = productImageHTML(p);
  document.getElementById('modal-brand').textContent = p.brand;
  document.getElementById('modal-name').textContent = p.name;
  document.getElementById('modal-gender').textContent = genderLabel(p.gender) + " · Tester original";
  document.getElementById('modal-desc').textContent = p.notes;
  document.getElementById('modal-sizes').innerHTML = `<span class="modal-size-chip">${p.size}</span>`;
  document.getElementById('modal-price').textContent = euro(p.price);
  const waMsg = encodeURIComponent(`Hola, me interesa el perfume ${p.brand} - ${p.name} (${p.size}) que vi en la web. ¿Me dais más información?`);
  document.getElementById('modal-whatsapp').href = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`;
  productModalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeProductModal() { productModalOverlay.classList.remove('open'); document.body.style.overflow = ''; }
document.getElementById('modal-close').addEventListener('click', closeProductModal);
productModalOverlay.addEventListener('click', (e) => { if (e.target === productModalOverlay) closeProductModal(); });
document.getElementById('modal-add-cart').addEventListener('click', () => {
  if (activeProduct) { addToCart(activeProduct.id); closeProductModal(); openCart(); }
});

/* ---------------- CART ---------------- */
const cartOverlay = document.getElementById('cart-overlay');
const cartDrawer = document.getElementById('cart-drawer');
const cartItemsEl = document.getElementById('cart-items');
const cartEmptyEl = document.getElementById('cart-empty');
const cartFooterEl = document.getElementById('cart-footer');
const cartCountEl = document.getElementById('cart-count');
const cartTotalEl = document.getElementById('cart-total-amount');

function addToCart(id) {
  const existing = cart.find(i => i.id === id);
  if (existing) existing.qty += 1; else cart.push({ id, qty: 1 });
  renderCart();
}
function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  renderCart();
}
function removeFromCart(id) { cart = cart.filter(i => i.id !== id); renderCart(); }

function renderCart() {
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  cartCountEl.textContent = totalQty;
  if (cart.length === 0) {
    cartEmptyEl.hidden = false; cartFooterEl.hidden = true;
    cartItemsEl.querySelectorAll('.cart-item').forEach(el => el.remove());
    return;
  }
  cartEmptyEl.hidden = true; cartFooterEl.hidden = false;
  let total = 0;
  cartItemsEl.innerHTML = cart.map(item => {
    const p = PRODUCTS.find(x => x.id === item.id);
    if (!p) return "";
    const lineTotal = p.price * item.qty;
    total += lineTotal;
    return `
    <div class="cart-item" data-id="${p.id}">
      <div class="cart-item-img">${productImageHTML(p)}</div>
      <div>
        <p class="cart-item-name">${p.name}</p>
        <p class="cart-item-meta">${p.brand} · ${p.size}</p>
        <div class="cart-item-qty">
          <button class="qty-btn" data-action="dec">&minus;</button>
          <span>${item.qty}</span>
          <button class="qty-btn" data-action="inc">+</button>
        </div>
      </div>
      <div class="cart-item-right">
        <span class="cart-item-price">${euro(lineTotal)}</span>
        <button class="cart-item-remove" data-action="remove">Quitar</button>
      </div>
    </div>`;
  }).join("");
  cartTotalEl.textContent = euro(total);
  cartItemsEl.querySelectorAll('.cart-item').forEach(el => {
    const id = el.dataset.id;
    el.querySelector('[data-action="inc"]').addEventListener('click', () => changeQty(id, 1));
    el.querySelector('[data-action="dec"]').addEventListener('click', () => changeQty(id, -1));
    el.querySelector('[data-action="remove"]').addEventListener('click', () => removeFromCart(id));
  });
}

function openCart() { cartOverlay.classList.add('open'); cartDrawer.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeCart() { cartOverlay.classList.remove('open'); cartDrawer.classList.remove('open'); document.body.style.overflow = ''; }
document.getElementById('cart-toggle').addEventListener('click', openCart);
document.getElementById('cart-close').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

/* ---------------- CHECKOUT ---------------- */
const checkoutModalOverlay = document.getElementById('checkout-modal-overlay');

function openCheckout() {
  if (cart.length === 0) return;
  let total = 0; let linesHTML = "";
  cart.forEach(item => {
    const p = PRODUCTS.find(x => x.id === item.id);
    if (!p) return;
    const lineTotal = p.price * item.qty;
    total += lineTotal;
    linesHTML += `${p.brand} ${p.name} (${p.size}) x${item.qty} — ${euro(lineTotal)}<br>`;
  });
  document.getElementById('checkout-summary').innerHTML = linesHTML + `<br><strong>Total: ${euro(total)}</strong>`;
  closeCart();
  checkoutModalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCheckoutModal() { checkoutModalOverlay.classList.remove('open'); document.body.style.overflow = ''; }
document.getElementById('cart-checkout').addEventListener('click', openCheckout);
document.getElementById('checkout-close').addEventListener('click', closeCheckoutModal);
checkoutModalOverlay.addEventListener('click', (e) => { if (e.target === checkoutModalOverlay) closeCheckoutModal(); });

document.getElementById('checkout-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('cf-name').value.trim();
  const phone = document.getElementById('cf-phone').value.trim();
  const address = document.getElementById('cf-address').value.trim();
  const city = document.getElementById('cf-city').value.trim();
  const zip = document.getElementById('cf-zip').value.trim();
  const notes = document.getElementById('cf-notes').value.trim();

  let total = 0; let lines = [];
  cart.forEach(item => {
    const p = PRODUCTS.find(x => x.id === item.id);
    if (!p) return;
    const lineTotal = p.price * item.qty;
    total += lineTotal;
    lines.push(`• ${p.brand} ${p.name} (${p.size}) x${item.qty} = ${euro(lineTotal)}`);
  });

  const message = `¡Hola! Quiero hacer este pedido en MF Parfums:\n\n${lines.join("\n")}\n\nTotal: ${euro(total)}\n\nDatos de envío:\nNombre: ${name}\nTeléfono: ${phone}\nDirección: ${address}\nCiudad: ${city}\nCódigo postal: ${zip}\n${notes ? "Notas: " + notes : ""}`;

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  cart = [];
  renderCart();
  closeCheckoutModal();
  e.target.reset();
});

/* ---------------- WHATSAPP GENERAL LINKS ---------------- */
function setGeneralWhatsappLinks() {
  const msg = encodeURIComponent("Hola, tengo una consulta sobre un perfume de MF Parfums.");
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  document.getElementById('contact-whatsapp').href = url;
  document.getElementById('footer-whatsapp').href = url;
}

/* ---------------- MOBILE NAV ---------------- */
const burger = document.getElementById('burger');
const mainNav = document.getElementById('main-nav');
burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  mainNav.classList.toggle('mobile-open');
  burger.setAttribute('aria-expanded', mainNav.classList.contains('mobile-open'));
});
mainNav.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => { burger.classList.remove('open'); mainNav.classList.remove('mobile-open'); });
});

/* ---------------- BACK TO TOP ---------------- */
const backToTop = document.getElementById('back-to-top');
window.addEventListener('scroll', () => { backToTop.classList.toggle('visible', window.scrollY > 600); });
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ---------------- INIT ---------------- */
applyFilter();
renderCart();
setGeneralWhatsappLinks();


