// Services Catalog Manager

let cachedServices = [];
let activeCatalogFilter = 'all';

async function initCatalog() {
  try {
    const res = await fetch('/api/catalog/services');
    const data = await res.json();
    cachedServices = data.services || [];
    renderCatalog();
  } catch (e) {
    console.error('Failed to load services:', e);
  }
}

function filterCatalog(category) {
  activeCatalogFilter = category;
  document.querySelectorAll('.cat-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-category') === category);
  });
  renderCatalog();
}

function renderCatalog() {
  const container = document.getElementById('catalog-grid');
  if (!container) return;

  let filtered = cachedServices;
  if (activeCatalogFilter !== 'all') {
    filtered = cachedServices.filter(s =>
      s.gameId === activeCatalogFilter || s.category === activeCatalogFilter
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>У цій категорії поки немає послуг. Ви можете замовити індивідуальний буст у нашому чаті!</p>
        <button class="btn btn-outline" onclick="openLiveChat()">💬 Написати консультанту</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(service => `
    <div class="service-card cyber-card">
      <div class="service-header">
        <div class="service-icon-box">${service.icon || '⚡'}</div>
        <div class="service-badge-tag">${service.badge || 'PRO'}</div>
      </div>

      <div class="service-game-label">${service.gameName}</div>
      <h3 class="service-title">${service.title}</h3>
      <p class="service-desc">${service.description}</p>

      <ul class="service-features-list">
        ${(service.features || []).map(f => `<li><span class="check-icon">✓</span> ${f}</li>`).join('')}
      </ul>

      <div class="service-footer">
        <div class="service-pricing">
          <div class="service-price-usd">$${service.price}</div>
          <div class="service-price-uah">${service.priceUAH || Math.round(service.price * 41.5)} ₴</div>
          <div class="service-delivery">⏱ ${service.deliveryTime || '1-3 год.'}</div>
        </div>

        <div class="service-actions">
          <button class="btn btn-primary btn-sm" onclick="buyCatalogService('${service.id}')">
            ${t('cat_btn_buy')}
          </button>
          <button class="btn btn-outline btn-sm" onclick="addCatalogServiceToCart('${service.id}')" title="${t('cat_btn_cart')}">
            🛒
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function buyCatalogService(serviceId) {
  const service = cachedServices.find(s => s.id === serviceId);
  if (!service) return;

  const orderItem = {
    gameId: service.gameId,
    gameName: service.gameName,
    serviceType: 'catalog_service',
    title: service.title,
    currentRank: '-',
    targetRank: service.title,
    price: service.price,
    priceUAH: service.priceUAH || Math.round(service.price * 41.5),
    options: { serviceId: service.id },
    icon: service.icon
  };

  openCheckoutModal(orderItem);
}

function addCatalogServiceToCart(serviceId) {
  const service = cachedServices.find(s => s.id === serviceId);
  if (!service) return;

  const cartItem = {
    id: 'srv_' + service.id + '_' + Date.now(),
    gameId: service.gameId,
    gameName: service.gameName,
    serviceType: 'catalog_service',
    title: service.title,
    price: service.price,
    priceUAH: service.priceUAH || Math.round(service.price * 41.5),
    options: { serviceId: service.id },
    icon: service.icon
  };

  cart.addItem(cartItem);
}
