// Shopping Cart & Checkout Flow Manager

class CartManager {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('cyberboost_cart') || '[]');
    this.promoCode = null;
    this.discountPercent = 0;
  }

  save() {
    localStorage.setItem('cyberboost_cart', JSON.stringify(this.items));
    this.updateCartBadge();
  }

  addItem(item) {
    this.items.push(item);
    this.save();
    this.renderCartDrawer();
    this.openDrawer();
    notify.show({
      title: 'Додано в кошик! 🛒',
      message: `${item.title} ($${item.price})`,
      type: 'success',
      sound: 'ping'
    });
  }

  removeItem(index) {
    this.items.splice(index, 1);
    this.save();
    this.renderCartDrawer();
  }

  clear() {
    this.items = [];
    this.promoCode = null;
    this.discountPercent = 0;
    this.save();
    this.renderCartDrawer();
  }

  getSubtotalUSD() {
    return this.items.reduce((sum, item) => sum + Number(item.price), 0);
  }

  getTotalUSD() {
    const subtotal = this.getSubtotalUSD();
    const discount = (subtotal * this.discountPercent) / 100;
    return Math.max(0, Math.round((subtotal - discount) * 100) / 100);
  }

  getTotalUAH() {
    return Math.round(this.getTotalUSD() * 41.5);
  }

  updateCartBadge() {
    const badge = document.getElementById('nav-cart-badge');
    if (badge) {
      badge.textContent = this.items.length;
      badge.style.display = this.items.length > 0 ? 'inline-block' : 'none';
    }
  }

  openDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
    this.renderCartDrawer();
  }

  closeDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }

  renderCartDrawer() {
    const container = document.getElementById('cart-items-list');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total-usd');
    const totalUahEl = document.getElementById('cart-total-uah');
    const discountRow = document.getElementById('cart-discount-row');
    const discountVal = document.getElementById('cart-discount-val');

    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = `
        <div class="empty-cart-state">
          <div class="empty-icon">🛒</div>
          <p>${t('cart_empty')}</p>
        </div>
      `;
      if (subtotalEl) subtotalEl.textContent = '$0';
      if (totalEl) totalEl.textContent = '$0';
      if (totalUahEl) totalUahEl.textContent = '0 ₴';
      if (discountRow) discountRow.style.display = 'none';
      return;
    }

    container.innerHTML = this.items.map((item, idx) => `
      <div class="cart-item">
        <div class="cart-item-icon">${item.icon || '⚡'}</div>
        <div class="cart-item-info">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-game">${item.gameName}</div>
          <div class="cart-item-price">$${item.price} (${item.priceUAH || Math.round(item.price * 41.5)} ₴)</div>
        </div>
        <button class="cart-item-del" onclick="cart.removeItem(${idx})" title="Видалити">✕</button>
      </div>
    `).join('');

    const subtotal = this.getSubtotalUSD();
    const totalUSD = this.getTotalUSD();
    const totalUAH = this.getTotalUAH();

    if (subtotalEl) subtotalEl.textContent = `$${subtotal}`;
    if (totalEl) totalEl.textContent = `$${totalUSD}`;
    if (totalUahEl) totalUahEl.textContent = `${totalUAH} ₴`;

    if (discountRow && this.discountPercent > 0) {
      discountRow.style.display = 'flex';
      discountVal.textContent = `-${this.discountPercent}% ($${Math.round(subtotal * this.discountPercent) / 100})`;
    } else if (discountRow) {
      discountRow.style.display = 'none';
    }
  }

  async applyPromoCode(code) {
    if (!code || !code.trim()) return;

    try {
      const res = await fetch('/api/catalog/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() })
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        this.promoCode = data.code;
        this.discountPercent = data.discountPercent;
        this.renderCartDrawer();
        notify.show({
          title: 'Промокод активовано! 🎁',
          message: `Знижка -${data.discountPercent}% успішно застосована до замовлення.`,
          type: 'success',
          sound: 'success'
        });
      } else {
        notify.show({
          title: 'Помилка промокоду',
          message: data.error || 'Промокод недійсний',
          type: 'warning'
        });
      }
    } catch (e) {
      console.warn('Promo error:', e);
    }
  }

  checkoutCart() {
    if (this.items.length === 0) {
      notify.show({ title: 'Кошик порожній', message: 'Додайте послугу перед оформленням', type: 'warning' });
      return;
    }

    const consolidatedOrder = {
      gameId: this.items[0].gameId,
      gameName: this.items.length === 1 ? this.items[0].gameName : 'CyberBoost Пакет',
      serviceType: this.items[0].serviceType || 'package',
      title: this.items.length === 1 ? this.items[0].title : `Пакет послуг (${this.items.length} поз.)`,
      currentRank: this.items[0].currentRank || '-',
      targetRank: this.items[0].targetRank || '-',
      price: this.getTotalUSD(),
      priceUAH: this.getTotalUAH(),
      options: { items: this.items },
      icon: '🛒'
    };

    this.closeDrawer();
    openCheckoutModal(consolidatedOrder, true);
  }
}

const cart = new CartManager();

// Checkout Modal Handling
let pendingCheckoutItem = null;
let isCartCheckout = false;

function openCheckoutModal(orderItem, fromCart = false) {
  pendingCheckoutItem = orderItem;
  isCartCheckout = fromCart;

  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  // Pre-fill user Discord if logged in
  if (currentUser && currentUser.discord) {
    const discordInput = document.getElementById('checkout-discord');
    if (discordInput) discordInput.value = currentUser.discord;
  }

  // Render preview of what's being ordered
  const titleEl = document.getElementById('checkout-summary-title');
  const priceEl = document.getElementById('checkout-summary-price');
  const uahEl = document.getElementById('checkout-summary-uah');

  if (titleEl) titleEl.textContent = orderItem.title;
  if (priceEl) priceEl.textContent = `$${orderItem.price}`;
  if (uahEl) uahEl.textContent = `${orderItem.priceUAH || Math.round(orderItem.price * 41.5)} ₴`;

  modal.classList.add('open');
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) modal.classList.remove('open');
  pendingCheckoutItem = null;
}

// Submit Checkout Order
async function submitCheckoutOrder(event) {
  if (event) event.preventDefault();
  if (!pendingCheckoutItem) return;

  const serverRegion = document.getElementById('checkout-server')?.value || 'EU';
  const loginAccount = document.getElementById('checkout-login')?.value || 'Guest';
  const discordContact = document.getElementById('checkout-discord')?.value || 'None';
  const notes = document.getElementById('checkout-notes')?.value || '';
  const payMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'card';

  if (!currentUser) {
    notify.show({
      title: 'Потрібна авторизація',
      message: 'Будь ласка, увійдіть або скористайтеся тестовим акаунтом зверху сайту!',
      type: 'warning'
    });
    openAuthModal();
    return;
  }

  const payload = {
    ...pendingCheckoutItem,
    paymentMethod: payMethod,
    accountCredentials: {
      server: serverRegion,
      login: loginAccount,
      discord: discordContact,
      notes: notes
    }
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      if (isCartCheckout) {
        cart.clear();
      }

      closeCheckoutModal();

      notify.show({
        title: 'Замовлення створено та оплачено! 🚀',
        message: `Замовлення ${data.order.id} передано в роботу. Бустер підключається!`,
        type: 'success',
        sound: 'success',
        duration: 6000
      });

      // Open Tracker directly
      openOrderTrackerModal(data.order.id);
    } else {
      notify.show({ title: 'Помилка створення', message: data.error || 'Спробуйте знову', type: 'warning' });
    }
  } catch (err) {
    console.error('Checkout error:', err);
    notify.show({ title: 'Помилка', message: 'Не вдалося створити замовлення', type: 'warning' });
  }
}
