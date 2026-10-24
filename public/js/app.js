// CyberBoost Master Application Orchestrator

let currentUser = null;
let authToken = localStorage.getItem('cyberboost_token') || null;
let activeTrackingOrderId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Language Init
  setLanguage(localStorage.getItem('cyberboost_lang') || 'ua');

  // 2. Auth State Check
  await initAuthState();

  // 3. Init Modules
  await initCalculator();
  await initCatalog();
  await initReviews();
  initSocketChat();

  cart.updateCartBadge();

  // Event Listeners for modals
  setupGlobalModalListeners();
});

// Helper to get role display names and icons
function getRoleDisplay(role) {
  if (role === 'booster') {
    return { label: 'Бустер', icon: '🎮', full: '🎮 Бустер', class: 'role-booster' };
  }
  if (role === 'admin') {
    return { label: 'Адміністратор', icon: '⚡', full: '⚡ Адміністратор', class: 'role-admin' };
  }
  return { label: 'Клієнт', icon: '👤', full: '👤 Клієнт', class: 'role-client' };
}

// Helper to get presence / operational status details
function getStatusDisplay(role, status) {
  if (role === 'booster') {
    switch (status) {
      case 'ready': return { text: 'Вільний', full: '🟢 Вільний • Готовий до бусту', icon: '🟢', class: 'ready' };
      case 'busy': case 'in_game': return { text: 'На бусті', full: '🎮 На замовленні • У грі', icon: '🎮', class: 'busy' };
      case 'resting': case 'afk': return { text: 'Відпочиває', full: '☕ Відпочиває • AFK', icon: '☕', class: 'resting' };
      case 'offline': return { text: 'Офлайн', full: '⚪ Не в мережі', icon: '⚪', class: 'offline' };
      default: return { text: 'Вільний', full: '🟢 Вільний', icon: '🟢', class: 'ready' };
    }
  } else if (role === 'admin') {
    switch (status) {
      case 'busy': return { text: 'Зайнятий', full: '🛡️ Staff • Зайнятий', icon: '🛡️', class: 'busy' };
      case 'offline': return { text: 'Офлайн', full: '⚪ Staff • Офлайн', icon: '⚪', class: 'offline' };
      default: return { text: 'В мережі', full: '🟢 CyberBoost Staff', icon: '🟢', class: 'online' };
    }
  } else {
    // Client
    switch (status) {
      case 'searching': return { text: 'Шукає буст', full: '🔍 Шукаю бустера', icon: '🔍', class: 'searching' };
      case 'in_boost': return { text: 'На бусті', full: '⚡ Акаунт на бусті', icon: '⚡', class: 'in_boost' };
      case 'afk': return { text: 'Відійшов', full: '☕ Відійшов • AFK', icon: '☕', class: 'afk' };
      case 'offline': return { text: 'Офлайн', full: '⚪ Не в мережі', icon: '⚪', class: 'offline' };
      default: return { text: 'В мережі', full: '🟢 В мережі • На зв\'язку', icon: '🟢', class: 'online' };
    }
  }
}

// Auth State Setup
async function initAuthState() {
  if (authToken) {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        currentUser = data.user;
      } else {
        // Token expired or invalid
        authToken = null;
        currentUser = null;
        localStorage.removeItem('cyberboost_token');
      }
    } catch (e) {
      console.warn('Auth check error:', e);
    }
  }

  updateUserAuthUI();
}

// Ensure quick switch alias is accessible
if (typeof switchDemoRole === 'function') {
  window.quickSwitchDemoRole = switchDemoRole;
}

function updateUserAuthUI() {
  const authNav = document.getElementById('nav-user-area');
  const navLinksContainer = document.getElementById('main-nav-links');

  // Update navbar links: only show Бустинг, Акаунти, Скіни CS2, Профілі користувачів AFTER registration and login!
  if (navLinksContainer) {
    if (currentUser) {
      navLinksContainer.innerHTML = `
        <a class="nav-link" href="#calculator">🚀 Бустинг</a>
        <a class="nav-link" href="#catalog" onclick="filterHeroCatalog('accounts')">👑 Акаунти</a>
        <a class="nav-link" href="#catalog" onclick="filterHeroCatalog('skins')">🗡️ Скіни CS2</a>
        <a class="nav-link" href="#guarantees" data-i18n="nav_guarantee">Гарантії</a>
        <a class="nav-link" href="#reviews" data-i18n="nav_reviews">Відгуки</a>
        <a class="nav-link text-cyan" href="javascript:void(0)" onclick="openAllUsersModal()">👥 Профілі користувачів</a>
      `;
    } else {
      navLinksContainer.innerHTML = `
        <a class="nav-link" href="#guarantees" data-i18n="nav_guarantee">Гарантії</a>
        <a class="nav-link" href="#reviews" data-i18n="nav_reviews">Відгуки</a>
      `;
    }
  }

  const demoRoleBtns = document.querySelectorAll('.demo-role-btn');

  // Highlight active role button in top demo banner
  demoRoleBtns.forEach(btn => {
    btn.classList.toggle('active', currentUser && btn.getAttribute('data-role') === currentUser.role);
  });

  if (!authNav) return;

  if (currentUser) {
    const roleInfo = getRoleDisplay(currentUser.role);
    const statusInfo = getStatusDisplay(currentUser.role, currentUser.status);
    let roleSpecificNav = '';

    if (currentUser.role === 'admin') {
      roleSpecificNav = `<button class="btn btn-outline-cyan btn-sm" onclick="openAdminDashboard()">⚡ Панель адміна</button>`;
    } else if (currentUser.role === 'booster') {
      roleSpecificNav = `
        <button class="btn btn-primary btn-sm btn-claim-order-nav" onclick="openBoosterDashboard('available')" title="Біржа замовлень - прийняти в роботу">
          ⚡ Прийняти замовлення <span id="nav-booster-avail-badge" class="badge badge-warning ml-1" style="display:none;">0</span>
        </button>
      `;
    } else {
      roleSpecificNav = `<button class="btn btn-outline-cyan btn-sm" onclick="openClientOrdersTab()">📦 Мої замовлення</button>`;
    }

    const profileTagLabel = currentUser.role === 'booster' ? '🎮 Акаунт бустера' : (currentUser.role === 'admin' ? '🛡️ Акаунт адміна' : '👤 Мій акаунт');
    const profileClickAction = "openUserProfileModal('settings')";

    authNav.innerHTML = `
      <div class="user-profile-badge">
        <div class="logged-role-badge ${roleInfo.class}">
          <span class="logged-role-label">Ви увійшли як:</span>
          <span class="logged-role-value">${roleInfo.full}</span>
        </div>
        <button class="btn btn-profile-nav btn-sm" onclick="${profileClickAction}" title="Особистий профіль (${statusInfo.full})">
          <span class="status-dot status-${statusInfo.class}" title="Мій статус: ${statusInfo.full}"></span>
          <img src="${currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" class="user-avatar-sm" />
          <span class="user-name-text">${currentUser.name}</span>
          <span class="profile-nav-tag">${profileTagLabel}</span>
        </button>
        ${roleSpecificNav}
        <button class="btn btn-icon-sm btn-logout" onclick="logoutUser()" title="Вийти з акаунту">🚪 Вийти</button>
      </div>
    `;

    // Also update booster available orders badge if booster
    if (currentUser.role === 'booster' && typeof loadBoosterData === 'function') {
      loadBoosterData();
    }
  } else {
    authNav.innerHTML = `
      <div class="auth-guest-buttons">
        <button class="btn btn-outline btn-sm" onclick="openAuthModal('login')">🔑 Увійти</button>
        <button class="btn btn-primary btn-sm" onclick="openAuthModal('register')">✨ Реєстрація</button>
      </div>
    `;
  }
}

function logoutUser() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('cyberboost_token');
  updateUserAuthUI();
  notify.show({
    title: 'Вихід виконано',
    message: 'Ви успішно вийшли з акаунту',
    type: 'info'
  });
}

// ---------------- ORDER TRACKER MODAL ----------------

async function openOrderTrackerModal(specificOrderId = null) {
  const modal = document.getElementById('tracker-modal');
  if (!modal) return;

  modal.classList.add('open');
  await renderOrderTracker(specificOrderId);
}

function closeOrderTrackerModal() {
  const modal = document.getElementById('tracker-modal');
  if (modal) modal.classList.remove('open');
  activeTrackingOrderId = null;
}

async function renderOrderTracker(targetOrderId = null) {
  const listContainer = document.getElementById('tracker-orders-list');
  const detailsContainer = document.getElementById('tracker-order-details');
  if (!listContainer || !detailsContainer) return;

  if (!currentUser) {
    listContainer.innerHTML = `<div class="p-4 text-center">Будь ласка, увійдіть щоб переглянути замовлення.</div>`;
    return;
  }

  try {
    const res = await fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    const orders = data.orders || [];

    if (orders.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-tracker">
          <div class="empty-icon">📦</div>
          <p>${t('tracker_no_orders')}</p>
          <button class="btn btn-primary btn-sm" onclick="closeOrderTrackerModal(); scrollToSection('calculator');">Створити замовлення</button>
        </div>
      `;
      detailsContainer.innerHTML = '';
      return;
    }

    // Determine active order
    let selectedOrder = orders.find(o => o.id === targetOrderId) || orders[0];
    activeTrackingOrderId = selectedOrder.id;

    // Render left sidebar orders list
    listContainer.innerHTML = orders.map(order => `
      <div class="tracker-order-tab-card ${order.id === selectedOrder.id ? 'active' : ''}" onclick="selectTrackingOrder('${order.id}')">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="order-id-badge">${order.id}</span>
          <span class="badge ${order.status === 'completed' ? 'badge-success' : (order.status === 'in_progress' ? 'badge-info' : 'badge-warning')}">
            ${order.status === 'completed' ? '100% Виконано' : (order.status === 'in_progress' ? `${order.progressPercent}%` : 'Оплачено')}
          </span>
        </div>
        <div class="order-item-title-sm">${order.title}</div>
        <div class="order-game-tag-sm">${order.gameName} | $${order.price}</div>
      </div>
    `).join('');

    // Render right details view
    renderOrderDetailsView(selectedOrder);
  } catch (err) {
    console.error('Tracker load error:', err);
  }
}

function selectTrackingOrder(orderId) {
  renderOrderTracker(orderId);
}

function refreshActiveTrackerOrder(orderId) {
  const modal = document.getElementById('tracker-modal');
  if (modal && modal.classList.contains('open')) {
    renderOrderTracker(orderId || activeTrackingOrderId);
  }
}

function renderOrderDetailsView(order) {
  const container = document.getElementById('tracker-order-details');
  if (!container) return;

  const statusMap = {
    paid: { label: t('tracker_status_paid'), badgeClass: 'badge-warning' },
    in_progress: { label: t('tracker_status_in_progress'), badgeClass: 'badge-info' },
    completed: { label: t('tracker_status_completed'), badgeClass: 'badge-success' },
    cancelled: { label: 'Скасовано', badgeClass: 'badge-danger' }
  };

  const statusInfo = statusMap[order.status] || { label: order.status, badgeClass: 'badge-info' };

  container.innerHTML = `
    <div class="tracker-detail-card">
      <div class="d-flex justify-content-between align-items-start mb-3">
        <div>
          <span class="badge ${statusInfo.badgeClass} mb-2">${statusInfo.label}</span>
          <h2 class="tracker-title-main">${order.title}</h2>
          <div class="text-muted">ID: <strong>${order.id}</strong> | Створено: ${new Date(order.createdAt).toLocaleString()}</div>
        </div>
        <button class="btn btn-outline-cyan btn-sm" onclick="openLiveChat('${order.id}', '${order.title}')">
          💬 ${t('tracker_btn_chat')}
        </button>
      </div>

      <div class="tracker-progress-section cyber-box my-4">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div>${t('tracker_progress')} <strong class="text-cyan">${order.progressRank || order.currentRank}</strong></div>
          <div class="fw-bold text-gradient-gold">${order.progressPercent || 0}%</div>
        </div>
        <div class="progress-track-lg">
          <div class="progress-fill-animated" style="width: ${order.progressPercent || 0}%"></div>
        </div>
        <div class="d-flex justify-content-between text-xs text-muted mt-2">
          <span>Старт: <strong>${order.currentRank}</strong></span>
          <span>Ціль: <strong>${order.targetRank}</strong></span>
        </div>
      </div>

      <div class="tracker-info-grid mb-4">
        <div class="tracker-info-item">
          <div class="info-label">${t('tracker_booster_assigned')}</div>
          <div class="info-val">
            ${order.boosterName ? `<span class="booster-assigned-tag">⚡ ${order.boosterName} (Radiant / Pro)</span>` : `<span class="text-warning">${t('tracker_booster_none')}</span>`}
          </div>
        </div>

        <div class="tracker-info-item">
          <div class="info-label">Вартість:</div>
          <div class="info-val">$${order.price} (${order.priceUAH} ₴)</div>
        </div>

        <div class="tracker-info-item">
          <div class="info-label">Режим черги:</div>
          <div class="info-val">${order.options?.queueType === 'duo' ? '👥 Duo Queue (Спільна гра)' : '👤 Solo Boost'}</div>
        </div>

        <div class="tracker-info-item">
          <div class="info-label">Сервер / Акаунт:</div>
          <div class="info-val">${order.accountCredentials?.server || 'EU'} (${order.accountCredentials?.login || 'Secret'})</div>
        </div>
      </div>

      ${order.streamUrl ? `
        <div class="stream-banner mb-4">
          <div class="stream-icon">🔴</div>
          <div>
            <div class="fw-bold">${t('tracker_stream_active')}</div>
            <a href="${order.streamUrl}" target="_blank" class="stream-link">${order.streamUrl}</a>
          </div>
        </div>
      ` : ''}

      <div class="tracker-timeline-box">
        <h4 class="mb-3">${t('tracker_timeline_title')}</h4>
        <div class="timeline-list">
          ${(order.timeline || []).slice().reverse().map(event => `
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-time">${new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div class="timeline-text">${event.text}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// ---------------- REVIEWS INIT ----------------

async function initReviews() {
  const container = document.getElementById('reviews-grid');
  if (!container) return;

  try {
    const res = await fetch('/api/catalog/reviews');
    const data = await res.json();
    const reviews = data.reviews || [];

    container.innerHTML = reviews.map(rev => `
      <div class="review-card cyber-card">
        <div class="review-header">
          <div class="review-author-box">
            <div class="author-avatar">${rev.author.charAt(0)}</div>
            <div>
              <div class="author-name">${rev.author}</div>
              <div class="review-game-tag">${rev.game}</div>
            </div>
          </div>
          <div class="review-stars">${'⭐'.repeat(rev.rating)}</div>
        </div>
        <p class="review-comment">"${rev.comment}"</p>
        <div class="review-date">${rev.date}</div>
      </div>
    `).join('');
  } catch (e) {
    console.error('Failed to load reviews:', e);
  }
}

// ---------------- AUTH MODAL (LOGIN/REGISTER) ----------------

let currentAuthMode = 'login';

function selectAuthRole(role) {
  const roleInput = document.getElementById('auth-role-value');
  const clientCard = document.getElementById('role-select-client');
  const boosterCard = document.getElementById('role-select-booster');
  const boosterFields = document.getElementById('auth-booster-fields');

  if (roleInput) roleInput.value = role;

  if (role === 'booster') {
    if (clientCard) clientCard.classList.remove('active');
    if (boosterCard) boosterCard.classList.add('active');
    if (boosterFields) boosterFields.style.display = 'block';
  } else {
    if (clientCard) clientCard.classList.add('active');
    if (boosterCard) boosterCard.classList.remove('active');
    if (boosterFields) boosterFields.style.display = 'none';
  }
}

function openAuthModal(mode = 'login') {
  currentAuthMode = mode;
  const modal = document.getElementById('auth-modal');
  const title = document.getElementById('auth-modal-title');
  const submitBtn = document.getElementById('auth-submit-btn');
  const switchText = document.getElementById('auth-switch-text');
  const errorBox = document.getElementById('auth-error-msg');

  if (errorBox) {
    errorBox.style.display = 'none';
    errorBox.textContent = '';
  }

  // Reset inputs
  const emailInput = document.getElementById('auth-email');
  if (emailInput) emailInput.value = '';
  const pwdInput = document.getElementById('auth-password');
  if (pwdInput) pwdInput.value = '';

  if (modal) modal.classList.add('open');

  if (mode === 'login') {
    if (title) title.textContent = 'Вхід в акаунт CyberBoost';
    if (submitBtn) submitBtn.textContent = 'Увійти в акаунт';
    if (switchText) switchText.innerHTML = `Немає акаунту? <a href="javascript:void(0)" onclick="openAuthModal('register')">Зареєструватися</a>`;
  } else {
    // Registration must be as simple as possible: ONLY email and password
    if (title) title.textContent = 'Реєстрація акаунту';
    if (submitBtn) submitBtn.textContent = 'Зареєструватися';
    if (switchText) switchText.innerHTML = `Вже зареєстровані? <a href="javascript:void(0)" onclick="openAuthModal('login')">Увійти в акаунт</a>`;
  }
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('open');
  const errorBox = document.getElementById('auth-error-msg');
  if (errorBox) errorBox.style.display = 'none';
}

async function handleAuthFormSubmit(event) {
  if (event) event.preventDefault();
  const errorBox = document.getElementById('auth-error-msg');
  if (errorBox) errorBox.style.display = 'none';

  const email = document.getElementById('auth-email')?.value?.trim();
  const password = document.getElementById('auth-password')?.value;

  if (!email || !password) {
    if (errorBox) {
      errorBox.textContent = 'Будь ласка, введіть email та пароль';
      errorBox.style.display = 'block';
    }
    return;
  }

  if (password.length < 6) {
    if (errorBox) {
      errorBox.textContent = 'Пароль має містити щонайменше 6 символів';
      errorBox.style.display = 'block';
    }
    return;
  }

  const endpoint = currentAuthMode === 'login' ? '/api/auth/login' : '/api/auth/register';
  // Strictly email and password ONLY!
  const payload = { email, password };

  const submitBtn = document.getElementById('auth-submit-btn');
  const originalBtnText = submitBtn ? submitBtn.textContent : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Зачекайте...';
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && data.token) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('cyberboost_token', authToken);
      updateUserAuthUI();
      closeAuthModal();

      const isReg = currentAuthMode === 'register';

      if (isReg) {
        notify.show({
          title: 'Акаунт успішно створено!',
          message: 'Заповніть особисту інформацію та ігри у вашому Account',
          type: 'success',
          sound: 'success'
        });
        // Registration flow: Landing -> Register -> Email+Password -> Account Created -> Account/Profile
        openUserProfileModal('settings');
      } else {
        const roleDisplay = getRoleDisplay(currentUser.role);
        notify.show({
          title: 'Успішний вхід!',
          message: `Ви увійшли як: ${currentUser.name} (${roleDisplay.full})`,
          type: 'success',
          sound: 'success'
        });
      }
    } else {
      const errMsg = data.error || 'Помилка авторизації. Перевірте введені дані.';
      if (errorBox) {
        errorBox.textContent = errMsg;
        errorBox.style.display = 'block';
      }
      notify.show({ title: 'Помилка', message: errMsg, type: 'warning' });
    }
  } catch (err) {
    console.error('Auth submit error:', err);
    if (errorBox) {
      errorBox.textContent = 'Сервер недоступний або сталася помилка з’єднання';
      errorBox.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  }
}

// ---------------- CLIENT VIP PROFILE & ORDER HUB ----------------

function switchClientTab(tabName) {
  document.querySelectorAll('.client-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });
  document.querySelectorAll('.client-tab-content').forEach(c => {
    c.style.display = c.id === `client-tab-${tabName}` ? 'block' : 'none';
  });
  if (tabName === 'orders') {
    renderClientOrdersInProfile();
  }
}

function openClientOrdersTab() {
  if (!currentUser) {
    openAuthModal('login');
    return;
  }
  if (currentUser.role === 'booster') {
    if (typeof openBoosterDashboard === 'function') {
      openBoosterDashboard('my');
    }
    return;
  }
  openUserProfileModal();
  switchClientTab('orders');
}

async function renderClientOrdersInProfile() {
  const container = document.getElementById('client-orders-list-container');
  const badgeEl = document.getElementById('client-orders-badge');
  if (!container || !currentUser) return;

  container.innerHTML = `<div class="p-4 text-center text-muted" style="grid-column: 1 / -1;">Завантаження ваших замовлень...</div>`;

  try {
    const res = await fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    const orders = (data.orders || []).filter(o => o.clientId === currentUser.id);

    if (badgeEl) {
      badgeEl.textContent = orders.length;
      badgeEl.style.display = orders.length > 0 ? 'inline-block' : 'none';
    }

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state p-4 text-center" style="grid-column: 1 / -1;">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">📦</div>
          <h4>У вас наразі немає створених замовлень</h4>
          <p class="text-muted text-xs mb-3">Оберіть послугу бусту зі знижкою VIP 5% та почніть прокачку прямо зараз!</p>
          <button class="btn btn-primary btn-sm" onclick="switchClientTab('newboost')">🚀 Замовити перший буст</button>
        </div>
      `;
      return;
    }

    container.innerHTML = orders.map(order => {
      const statusMap = {
        paid: { label: '⏳ Очікує бустера', badgeClass: 'badge-warning' },
        in_progress: { label: '⚡ В процесі', badgeClass: 'badge-info' },
        completed: { label: '✅ Виконано (100%)', badgeClass: 'badge-success' },
        cancelled: { label: 'Скасовано', badgeClass: 'badge-danger' }
      };
      const st = statusMap[order.status] || { label: order.status, badgeClass: 'badge-info' };
      const percent = order.status === 'completed' ? 100 : (order.progressPercent || 0);

      return `
        <div class="booster-order-card cyber-card ${order.status === 'completed' ? 'border-success' : 'border-cyan'}">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="badge ${st.badgeClass}">${st.label}</span>
            <span class="text-xs text-muted">ID: ${order.id}</span>
          </div>
          <h4 style="margin-bottom: 4px;">${order.title}</h4>
          <div class="text-xs text-muted mb-2">
            Гра: <strong>${order.gameName}</strong> | Вартість: <strong class="text-success">$${order.price} (${order.priceUAH || Math.round(order.price * 41.5)} ₴)</strong>
          </div>

          <div class="p-2 cyber-box mb-2 text-xs">
            ${order.boosterName ? `
              <div class="d-flex align-items-center gap-1 text-cyan">
                <span>⚡ Ваш бустер:</span>
                <strong>${order.boosterName}</strong>
              </div>
            ` : `
              <div class="text-warning">⏳ Пошук вільного PRO-бустера... Замовлення вже оплачено!</div>
            `}
          </div>

          <div class="progress-bar-container my-3">
            <div class="d-flex justify-content-between text-xs mb-1">
              <span>Ранг: <strong>${order.progressRank || order.currentRank}</strong></span>
              <span class="fw-bold text-gradient-gold">${percent}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${percent}%"></div>
            </div>
            <div class="d-flex justify-content-between text-xs text-muted mt-1">
              <span>Старт: ${order.currentRank}</span>
              <span>Ціль: ${order.targetRank}</span>
            </div>
          </div>

          ${order.streamUrl ? `
            <div class="mb-2 text-xs">
              <a href="${order.streamUrl}" target="_blank" class="btn btn-xs btn-outline-cyan w-100">🎥 Дивитися стрім гри</a>
            </div>
          ` : ''}

          <div class="d-flex gap-2 mt-3">
            <button class="btn btn-outline-cyan btn-sm flex-grow-1" onclick="closeUserProfileModal(); openLiveChat('${order.id}', '${order.title}')">
              💬 Чат
            </button>
            <button class="btn btn-outline btn-sm flex-grow-1" onclick="closeUserProfileModal(); openOrderTrackerModal('${order.id}')">
              📊 Трекер
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error fetching client orders:', err);
    container.innerHTML = `<div class="p-3 text-center text-danger" style="grid-column: 1 / -1;">Не вдалося завантажити замовлення</div>`;
  }
}

// ---------------- USER ACCOUNT / PROFILE MODAL ----------------

async function openUserProfileModal(defaultTab = 'settings') {
  if (!currentUser) {
    openAuthModal('login');
    return;
  }

  const modal = document.getElementById('user-profile-modal');
  if (!modal) return;

  const roleInfo = getRoleDisplay(currentUser.role);

  // Fill in display header
  const avatarEl = document.getElementById('profile-display-avatar');
  if (avatarEl) avatarEl.src = currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

  const roleBadgeEl = document.getElementById('profile-display-role-badge');
  if (roleBadgeEl) {
    roleBadgeEl.className = `profile-role-pill ${roleInfo.class}`;
    roleBadgeEl.textContent = roleInfo.full;
  }

  const nameEl = document.getElementById('profile-display-name');
  if (nameEl) nameEl.textContent = currentUser.name;

  const emailEl = document.getElementById('profile-display-email');
  if (emailEl) emailEl.textContent = `📧 ${currentUser.email}`;

  const joinedEl = document.getElementById('profile-display-joined');
  if (joinedEl) {
    const joinedDate = currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Нещодавно';
    joinedEl.textContent = `🗓️ Зареєстрований: ${joinedDate}`;
  }

  // 1. Common Account inputs
  const emailInput = document.getElementById('profile-email-input');
  if (emailInput) emailInput.value = currentUser.email || '';

  const nameInput = document.getElementById('profile-name-input');
  if (nameInput) nameInput.value = currentUser.name || '';

  const avatarInput = document.getElementById('profile-avatar-input');
  if (avatarInput) avatarInput.value = currentUser.avatar || '';

  // Password inputs
  const pwdInput = document.getElementById('profile-password-input');
  if (pwdInput) pwdInput.value = '';
  const pwdConfirm = document.getElementById('profile-password-confirm');
  if (pwdConfirm) pwdConfirm.value = '';

  // Setup user status selector
  selectedProfileStatus = currentUser.status || (currentUser.role === 'booster' ? 'ready' : 'online');
  renderProfileStatusOptions();
  const statusMsgInput = document.getElementById('profile-status-message-input');
  if (statusMsgInput) {
    statusMsgInput.value = currentUser.statusMessage || '';
  }

  // 2. Render My Games block
  renderUserGamesList();

  // 3. Render Booster Information block
  const steamInput = document.getElementById('profile-booster-steamid');
  if (steamInput) steamInput.value = currentUser.steamId || '';

  const discordInput = document.getElementById('profile-booster-discord');
  if (discordInput) discordInput.value = currentUser.discord || '';

  renderBoosterVerificationUI();

  // Switch to requested tab (default is 'settings')
  switchClientTab(defaultTab);

  modal.classList.add('open');
}

function closeUserProfileModal() {
  const modal = document.getElementById('user-profile-modal');
  if (modal) modal.classList.remove('open');
}

function selectPresetAvatar(url) {
  const avatarInput = document.getElementById('profile-avatar-input');
  if (avatarInput) avatarInput.value = url;
  updateProfileAvatarPreview(url);
}

function updateProfileAvatarPreview(url) {
  const avatarEl = document.getElementById('profile-display-avatar');
  if (avatarEl && url) {
    avatarEl.src = url;
  }
}

// ---------------- 1. COMMON ACCOUNT INFORMATION ----------------

async function submitUserProfileUpdate(event) {
  if (event) event.preventDefault();
  if (!currentUser) return;

  const name = document.getElementById('profile-name-input')?.value?.trim();
  const email = document.getElementById('profile-email-input')?.value?.trim();
  const avatar = document.getElementById('profile-avatar-input')?.value?.trim();
  const statusMessage = document.getElementById('profile-status-message-input')?.value?.trim();
  const password = document.getElementById('profile-password-input')?.value;
  const passwordConfirm = document.getElementById('profile-password-confirm')?.value;

  if (password && password !== passwordConfirm) {
    notify.show({ title: 'Помилка', message: 'Нові паролі не співпадають!', type: 'warning' });
    return;
  }

  const payload = {
    name,
    email,
    avatar,
    status: selectedProfileStatus,
    statusMessage
  };

  if (password) {
    payload.password = password;
  }

  const saveBtn = document.getElementById('profile-save-btn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Збереження...';
  }

  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && data.user) {
      currentUser = data.user;
      updateUserAuthUI();

      const nameEl = document.getElementById('profile-display-name');
      if (nameEl) nameEl.textContent = currentUser.name;
      const emailEl = document.getElementById('profile-display-email');
      if (emailEl) emailEl.textContent = `📧 ${currentUser.email}`;
      const avatarEl = document.getElementById('profile-display-avatar');
      if (avatarEl) avatarEl.src = currentUser.avatar || '';

      notify.show({
        title: 'Дані акаунту збережено! ✨',
        message: 'Базову інформацію успішно оновлено',
        type: 'success',
        sound: 'success'
      });
    } else {
      notify.show({
        title: 'Помилка оновлення',
        message: data.error || 'Не вдалося зберегти дані',
        type: 'warning'
      });
    }
  } catch (err) {
    console.error('Profile update error:', err);
    notify.show({ title: 'Помилка', message: 'Помилка з’єднання із сервером', type: 'warning' });
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 Зберегти базові дані';
    }
  }
}

// ---------------- 2. GAME INFORMATION (MY GAMES) ----------------

function renderUserGamesList() {
  const container = document.getElementById('profile-my-games-list');
  if (!container) return;

  const games = (currentUser && Array.isArray(currentUser.games)) ? currentUser.games : [];
  if (games.length === 0) {
    container.innerHTML = `
      <div class="text-xs text-muted p-3 text-center border rounded" style="border-color: rgba(255,255,255,0.08) !important;">
        🎮 Ігор поки не додано. Натисніть <strong>[+ Add Game]</strong>, щоб додати гру та MMR.
      </div>
    `;
    return;
  }

  container.innerHTML = games.map(g => `
    <div class="my-game-card">
      <div class="my-game-info">
        <div class="my-game-title">
          <span>${getGameIcon(g.game, g.id)}</span>
          <span>${g.game}</span>
        </div>
        <div class="my-game-mmr">MMR: ${g.mmr}</div>
      </div>
      <div class="my-game-actions">
        <button type="button" class="btn-game-edit" onclick="openAddGameModal('${g.id}')">Edit</button>
        <button type="button" class="btn-game-remove" onclick="removeUserGame('${g.id}')">Remove</button>
      </div>
    </div>
  `).join('');
}

function openAddGameModal(editId = null) {
  const modal = document.getElementById('add-game-modal');
  const title = document.getElementById('add-game-modal-title');
  const idInput = document.getElementById('add-game-edit-id');
  const select = document.getElementById('add-game-select');
  const customRow = document.getElementById('add-game-custom-row');
  const customInput = document.getElementById('add-game-custom-input');
  const mmrInput = document.getElementById('add-game-mmr-input');

  if (!modal) return;

  if (editId) {
    const existing = (currentUser.games || []).find(g => g.id === editId);
    if (existing) {
      if (title) title.textContent = '✏️ Редагувати гру (Edit Game)';
      if (idInput) idInput.value = editId;
      if (mmrInput) mmrInput.value = existing.mmr;

      const knownOptions = ['Dota 2', 'CS2', 'Valorant', 'Apex', 'League of Legends', 'Rocket League', 'Overwatch 2'];
      if (knownOptions.includes(existing.game)) {
        if (select) select.value = existing.game;
        if (customRow) customRow.style.display = 'none';
        if (customInput) customInput.value = '';
      } else {
        if (select) select.value = 'custom';
        if (customRow) customRow.style.display = 'block';
        if (customInput) customInput.value = existing.game;
      }
    }
  } else {
    if (title) title.textContent = '🎮 Додати гру (+ Add Game)';
    if (idInput) idInput.value = '';
    if (select) select.value = 'Dota 2';
    if (customRow) customRow.style.display = 'none';
    if (customInput) customInput.value = '';
    if (mmrInput) mmrInput.value = '100';
  }

  modal.classList.add('open');
}

function closeAddGameModal() {
  const modal = document.getElementById('add-game-modal');
  if (modal) modal.classList.remove('open');
}

function handleGameSelectChange(val) {
  const customRow = document.getElementById('add-game-custom-row');
  if (customRow) {
    customRow.style.display = val === 'custom' ? 'block' : 'none';
  }
}

async function handleSaveGameSubmit(event) {
  if (event) event.preventDefault();
  if (!currentUser) return;

  const editId = document.getElementById('add-game-edit-id')?.value;
  const selectVal = document.getElementById('add-game-select')?.value;
  const customVal = document.getElementById('add-game-custom-input')?.value?.trim();
  const mmrVal = document.getElementById('add-game-mmr-input')?.value?.trim() || '100';

  const gameTitle = selectVal === 'custom' ? (customVal || 'Game') : selectVal;

  let updatedGames = Array.isArray(currentUser.games) ? [...currentUser.games] : [];

  if (editId) {
    const idx = updatedGames.findIndex(g => g.id === editId);
    if (idx !== -1) {
      updatedGames[idx] = { id: editId, game: gameTitle, mmr: mmrVal };
    }
  } else {
    updatedGames.push({
      id: 'gm_' + Date.now(),
      game: gameTitle,
      mmr: mmrVal
    });
  }

  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ games: updatedGames })
    });

    const data = await res.json();
    if (res.ok && data.user) {
      currentUser = data.user;
      renderUserGamesList();
      closeAddGameModal();
      notify.show({
        title: editId ? 'Гру оновлено!' : 'Гру додано в My Games! 🎮',
        message: `${gameTitle} — MMR: ${mmrVal}`,
        type: 'success',
        sound: 'success'
      });
    } else {
      notify.show({ title: 'Помилка', message: data.error || 'Не вдалося зберегти гру', type: 'warning' });
    }
  } catch (err) {
    console.error('Save game error:', err);
  }
}

async function removeUserGame(gameId) {
  if (!currentUser) return;
  const existing = (currentUser.games || []).find(g => g.id === gameId);
  const gameName = existing ? existing.game : 'Гру';

  const updatedGames = (currentUser.games || []).filter(g => g.id !== gameId);

  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ games: updatedGames })
    });

    const data = await res.json();
    if (res.ok && data.user) {
      currentUser = data.user;
      renderUserGamesList();
      notify.show({
        title: 'Гру видалено',
        message: `${gameName} видалено зі списку My Games`,
        type: 'info'
      });
    }
  } catch (err) {
    console.error('Remove game error:', err);
  }
}

// ---------------- 3. BOOSTER INFO & VERIFICATION HANDLERS ----------------

function renderBoosterVerificationUI() {
  const badge = document.getElementById('booster-verification-status-badge');
  const hint = document.getElementById('booster-verification-hint');
  const verifyBtn = document.getElementById('btn-send-admin-verification');
  if (!badge || !currentUser) return;

  const status = currentUser.boosterVerification || 'None';
  badge.textContent = status;
  badge.className = `verification-status-pill pill-${status.toLowerCase()}`;

  if (status === 'Pending') {
    if (hint) hint.innerHTML = '⏳ <strong>Verification status: Pending</strong>. Профіль відправлено на перевірку адміністратора. До підтвердження доступ до виконання замовлень обмежено.';
    if (verifyBtn) {
      verifyBtn.disabled = true;
      verifyBtn.textContent = '⏳ На розгляді у Admin';
    }
  } else if (status === 'Verified') {
    if (hint) hint.innerHTML = '✅ <strong>Verification status: Verified</strong>. Вітаємо! Ваш акаунт верифіковано. Ви маєте повний доступ до взяття замовлень на біржі.';
    if (verifyBtn) {
      verifyBtn.disabled = true;
      verifyBtn.textContent = '✅ Верифіковано';
    }
  } else if (status === 'Rejected') {
    if (hint) hint.innerHTML = '❌ <strong>Verification status: Rejected</strong>. Вашу заявку відхилено адміністратором. Будь ласка, перевірте Steam ID та Discord і надішліть повторно.';
    if (verifyBtn) {
      verifyBtn.disabled = false;
      verifyBtn.textContent = '🔄 Надіслати повторно на перевірку';
    }
  } else {
    // None
    if (hint) hint.innerHTML = 'Вкажіть Steam ID та Discord nickname, після чого надішліть профіль на перевірку Admin.';
    if (verifyBtn) {
      verifyBtn.disabled = false;
      verifyBtn.textContent = '📤 Відправити профіль на перевірку Admin';
    }
  }
}

async function handleBoosterInfoSave(event) {
  if (event) event.preventDefault();
  if (!currentUser) return;

  const steamId = document.getElementById('profile-booster-steamid')?.value?.trim();
  const discord = document.getElementById('profile-booster-discord')?.value?.trim();

  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ steamId, discord })
    });

    const data = await res.json();
    if (res.ok && data.user) {
      currentUser = data.user;
      notify.show({
        title: 'Збережено! ⚡',
        message: 'Steam ID та Discord nickname успішно збережено',
        type: 'success',
        sound: 'success'
      });
    } else {
      notify.show({ title: 'Помилка', message: data.error || 'Не вдалося зберегти дані', type: 'warning' });
    }
  } catch (err) {
    console.error('Save booster info error:', err);
  }
}

async function submitBoosterVerification() {
  if (!currentUser) return;

  const steamId = document.getElementById('profile-booster-steamid')?.value?.trim();
  const discord = document.getElementById('profile-booster-discord')?.value?.trim();

  if (!steamId && !discord) {
    notify.show({
      title: 'Вкажіть дані',
      message: 'Для верифікації вкажіть ваш Steam ID або Discord nickname',
      type: 'warning'
    });
    return;
  }

  const btn = document.getElementById('btn-send-admin-verification');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Відправка...';
  }

  try {
    const res = await fetch('/api/auth/booster-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ steamId, discord })
    });

    const data = await res.json();
    if (res.ok && data.user) {
      currentUser = data.user;
      renderBoosterVerificationUI();
      updateUserAuthUI();
      notify.show({
        title: 'Заявку надіслано! ⏳',
        message: 'Verification status: Pending. Адміністратор перевірить ваші дані.',
        type: 'info',
        sound: 'success'
      });
    } else {
      notify.show({ title: 'Помилка', message: data.error || 'Не вдалося відправити профіль', type: 'warning' });
      if (btn) btn.disabled = false;
    }
  } catch (err) {
    console.error('Verification submit error:', err);
    if (btn) btn.disabled = false;
  }
}

// ---------------- GLOBAL MODAL HELPERS ----------------

function closeAllModals() {
  document.querySelectorAll('.modal, .drawer, .overlay').forEach(el => {
    el.classList.remove('open');
  });
}

function setupGlobalModalListeners() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// ---------------- ALL USERS DIRECTORY ----------------

let directoryUsersList = [];
let currentDirectoryFilter = 'all';
let currentDirectorySearch = '';

async function openAllUsersModal(filterRole = 'all') {
  if (!currentUser) {
    if (typeof notify !== 'undefined' && notify.show) {
      notify.show({
        title: 'Потрібна авторизація',
        message: 'Профілі користувачів доступні лише після реєстрації або входу на сайт!',
        type: 'info'
      });
    }
    openAuthModal('login');
    return;
  }

  currentDirectoryFilter = filterRole;
  currentDirectorySearch = '';
  const searchInput = document.getElementById('all-users-search');
  if (searchInput) searchInput.value = '';

  const modal = document.getElementById('all-users-modal');
  if (!modal) return;

  // Update tabs
  document.querySelectorAll('.all-users-tab').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-filter') === currentDirectoryFilter);
  });

  modal.classList.add('open');

  try {
    const res = await fetch('/api/auth/all-profiles');
    const data = await res.json();
    directoryUsersList = data.users || [];
    renderAllUsersGrid();
  } catch (err) {
    console.error('Failed to load all user profiles:', err);
    notify.show({ title: 'Помилка', message: 'Не вдалося завантажити профілі користувачів', type: 'warning' });
  }
}

function closeAllUsersModal() {
  const modal = document.getElementById('all-users-modal');
  if (modal) modal.classList.remove('open');
}

function filterAllUsers(role) {
  currentDirectoryFilter = role;
  document.querySelectorAll('.all-users-tab').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-filter') === role);
  });
  renderAllUsersGrid();
}

function handleAllUsersSearch(query) {
  currentDirectorySearch = (query || '').toLowerCase().trim();
  renderAllUsersGrid();
}

function renderAllUsersGrid() {
  const grid = document.getElementById('all-users-grid');
  if (!grid) return;

  let filtered = directoryUsersList;

  if (currentDirectoryFilter !== 'all') {
    filtered = filtered.filter(u => u.role === currentDirectoryFilter);
  }

  if (currentDirectorySearch) {
    filtered = filtered.filter(u => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const discord = (u.discord || '').toLowerCase();
      const rank = (u.rankTitle || '').toLowerCase();
      return name.includes(currentDirectorySearch) ||
             email.includes(currentDirectorySearch) ||
             discord.includes(currentDirectorySearch) ||
             rank.includes(currentDirectorySearch);
    });
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">🔍</div>
        <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-main); margin-bottom: 4px;">Користувачів не знайдено</div>
        <div class="text-xs">Спробуйте змінити фільтр або пошуковий запит</div>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(user => {
    const isMe = currentUser && currentUser.id === user.id;
    const roleInfo = getRoleDisplay(user.role);
    const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString('uk-UA', { month: 'short', year: 'numeric' }) : '2026';

    let roleStatsHtml = '';
    if (user.role === 'booster') {
      const gamesHtml = Array.isArray(user.games) && user.games.length > 0
        ? `<div class="user-game-tags">${user.games.map(g => `<span class="user-game-tag">${g}</span>`).join('')}</div>`
        : '';

      roleStatsHtml = `
        <div class="user-directory-stats">
          <div>
            <div class="user-dir-stat-label">Виконано</div>
            <div class="user-dir-stat-val text-success">${user.completedOrders || 0}</div>
          </div>
          <div>
            <div class="user-dir-stat-label">Рейтинг</div>
            <div class="user-dir-stat-val text-gold">⭐ ${user.rating || 5.0}</div>
          </div>
        </div>
        ${user.rankTitle ? `<div class="text-xs text-cyan" style="font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${user.rankTitle}">🏆 ${user.rankTitle}</div>` : ''}
        ${gamesHtml}
      `;
    } else if (user.role === 'admin') {
      roleStatsHtml = `
        <div class="user-directory-stats">
          <div>
            <div class="user-dir-stat-label">Статус</div>
            <div class="user-dir-stat-val text-danger">🛡️ Staff / Admin</div>
          </div>
          <div>
            <div class="user-dir-stat-label">Платформа</div>
            <div class="user-dir-stat-val text-cyan">CyberBoost</div>
          </div>
        </div>
        <div class="text-xs text-muted">⚡ Повний доступ до управління системою та гарантій безпеки</div>
      `;
    } else {
      // Client
      roleStatsHtml = `
        <div class="user-directory-stats">
          <div>
            <div class="user-dir-stat-label">Статус акаунту</div>
            <div class="user-dir-stat-val text-cyan">🎮 Клієнт</div>
          </div>
          <div>
            <div class="user-dir-stat-label">Кешбек рівень</div>
            <div class="user-dir-stat-val text-gold">VIP Tier</div>
          </div>
        </div>
        ${user.discord ? `<div class="text-xs text-dim" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">💬 Discord: <span class="text-main">${user.discord}</span></div>` : '<div class="text-xs text-muted">Зареєстрований клієнт</div>'}
      `;
    }

    const actionBtn = isMe
      ? `<button class="btn btn-primary btn-sm w-100" onclick="closeAllUsersModal(); openUserProfileModal();">✏️ Мій профіль (Редагувати)</button>`
      : `<button class="btn btn-outline-cyan btn-sm w-100" onclick="viewPublicUserProfile('${user.id}')">👁️ Переглянути профіль</button>`;

    return `
      <div class="user-directory-card ${isMe ? 'current-user-card' : ''}">
        <div class="user-directory-header">
          <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}" class="user-directory-avatar role-${user.role}" />
          <div class="user-directory-info">
            <div class="user-directory-name">
              ${user.name}
              ${isMe ? '<span class="badge badge-info text-xs" style="font-size: 0.6rem; padding: 2px 6px;">ВИ</span>' : ''}
            </div>
            <span class="user-directory-role role-${user.role}">${roleInfo.full}</span>
            <div class="text-xs text-muted mt-1">🗓️ В системі з ${joined}</div>
          </div>
        </div>

        ${roleStatsHtml}

        <div class="mt-auto pt-2">
          ${actionBtn}
        </div>
      </div>
    `;
  }).join('');
}

// ---------------- PUBLIC PROFILE VIEWER MODAL ----------------

async function viewPublicUserProfile(userId) {
  if (currentUser && currentUser.id === userId) {
    closeAllUsersModal();
    openUserProfileModal();
    return;
  }

  let user = directoryUsersList.find(u => u.id === userId);
  if (!user) {
    try {
      const res = await fetch(`/api/auth/profile/${userId}`);
      const data = await res.json();
      user = data.user;
    } catch (e) {
      console.error(e);
    }
  }

  if (!user) {
    notify.show({ title: 'Помилка', message: 'Користувача не знайдено', type: 'warning' });
    return;
  }

  const modal = document.getElementById('public-user-modal');
  const body = document.getElementById('public-user-modal-body');
  const title = document.getElementById('public-user-modal-title');
  if (!modal || !body) return;

  const roleInfo = getRoleDisplay(user.role);
  const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Нещодавно';

  if (title) title.textContent = `Профіль: ${user.name}`;

  let extraSections = '';
  if (user.role === 'booster') {
    const gamesBadges = Array.isArray(user.games)
      ? user.games.map(g => `<span class="badge badge-primary">${g.toUpperCase()}</span>`).join(' ')
      : '';

    extraSections = `
      <div class="cyber-box p-3 mb-3">
        <h5 class="text-cyan mb-2">🎮 Ігрове резюме бустера</h5>
        <div class="mb-2"><strong>Звання / Ранг:</strong> <span class="text-gold">${user.rankTitle || 'Верифікований бустер'}</span></div>
        <div class="mb-2"><strong>Спеціалізація в іграх:</strong> ${gamesBadges || '<span class="text-muted">CS2, Valorant, Dota 2</span>'}</div>
        <div class="row-2-col">
          <div class="profile-stat-box">
            <div class="stat-box-val text-success">${user.completedOrders || 0}</div>
            <div class="stat-box-lbl">Виконано замовлень</div>
          </div>
          <div class="profile-stat-box">
            <div class="stat-box-val text-warning">⭐ ${user.rating || 5.0}</div>
            <div class="stat-box-lbl">Середня оцінка</div>
          </div>
        </div>
      </div>
    `;
  } else if (user.role === 'admin') {
    extraSections = `
      <div class="cyber-box p-3 mb-3">
        <h5 class="text-danger mb-2">🛡️ CyberBoost Staff</h5>
        <div class="text-xs text-muted mb-2">Офіційний представник адміністрації та арбітражу платформи CyberBoost.</div>
        <div class="badge badge-danger">Офіційно верифікований</div>
      </div>
    `;
  } else {
    // Client
    extraSections = `
      <div class="cyber-box p-3 mb-3">
        <h5 class="text-cyan mb-2">👤 Інформація клієнта</h5>
        <div class="text-xs text-muted mb-3">Зареєстрований користувач сервісу з доступом до індивідуальних замовлень та безпечних угод.</div>
        <div class="row-2-col">
          <div class="profile-stat-box">
            <div class="stat-box-val text-cyan">VIP</div>
            <div class="stat-box-lbl">Рівень акаунту</div>
          </div>
          <div class="profile-stat-box">
            <div class="stat-box-val text-success">Захищено</div>
            <div class="stat-box-lbl">Гарантія безпеки</div>
          </div>
        </div>
      </div>
    `;
  }

  body.innerHTML = `
    <div class="public-profile-hero mb-4">
      <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" class="public-profile-avatar" />
      <div>
        <h3 style="margin: 0 0 4px 0;">${user.name}</h3>
        <span class="logged-role-badge ${roleInfo.class}">${roleInfo.full}</span>
        <div class="text-xs text-muted mt-2">🗓️ Зареєстрований: ${joinedDate}</div>
      </div>
    </div>

    ${extraSections}

    <div class="cyber-box p-3 mb-4">
      <h5 class="mb-2">📞 Зв'язок з користувачем</h5>
      <div class="text-xs mb-1"><strong>Email:</strong> ${user.email}</div>
      ${user.discord ? `<div class="text-xs mb-1"><strong>Discord:</strong> <span class="text-cyan">${user.discord}</span></div>` : ''}
      ${user.telegram ? `<div class="text-xs mb-1"><strong>Telegram:</strong> <span class="text-cyan">${user.telegram}</span></div>` : ''}
      ${!user.discord && !user.telegram ? `<div class="text-xs text-muted">Контакти приховані користувачем</div>` : ''}
    </div>

    <div class="d-flex gap-2">
      <button class="btn btn-outline w-100" onclick="closePublicUserModal()">Закрити</button>
      ${user.role === 'booster' ? `<button class="btn btn-primary w-100" onclick="closePublicUserModal(); closeAllUsersModal(); openOrderTrackerModal();">📦 Замовити буст</button>` : ''}
    </div>
  `;

  modal.classList.add('open');
}

function closePublicUserModal() {
  const modal = document.getElementById('public-user-modal');
  if (modal) modal.classList.remove('open');
}

/* ---------------- HERO & GAMES DROPDOWN HANDLERS (Images 1 & 2) ---------------- */

// 1. Toggle "Всі ігри" Dropdown
function toggleAllGamesDropdown(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('all-games-dropdown-menu');
  const btn = document.getElementById('btn-all-games-toggle');
  if (!menu) return;

  const isOpen = menu.classList.contains('show');
  if (isOpen) {
    menu.classList.remove('show');
    if (btn) btn.classList.remove('active');
  } else {
    menu.classList.add('show');
    if (btn) btn.classList.add('active');
    const searchInput = document.getElementById('games-dropdown-search');
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 60);
    }
  }
}

// Global click outside to close dropdown
document.addEventListener('click', (e) => {
  const wrap = document.getElementById('games-dropdown-wrap');
  const menu = document.getElementById('all-games-dropdown-menu');
  const btn = document.getElementById('btn-all-games-toggle');
  if (wrap && menu && !wrap.contains(e.target)) {
    menu.classList.remove('show');
    if (btn) btn.classList.remove('active');
  }
});

// 2. Filter games inside the dropdown
function filterGamesDropdownList(query) {
  const q = (query || '').toLowerCase().trim();
  const items = document.querySelectorAll('#games-dropdown-list .game-drop-item');
  items.forEach(item => {
    const text = item.innerText.toLowerCase();
    if (!q || text.includes(q)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

// ---------------- HERO SEARCH WITH RICH GAME DESCRIPTIONS & SERVICES ----------------

const HERO_SEARCH_GAMES = [
  {
    id: 'dota2',
    name: 'Dota 2',
    iconBg: '#a82c20',
    iconSymbol: '🛡️',
    calcKey: 'dota2',
    services: [
      { label: '👑 Аккаунты', type: 'catalog', param: 'accounts', isAccount: true },
      { label: 'Буст MMR в Dota 2', type: 'calc', target: 'dota2' },
      { label: 'Буст Калибровки в Dota 2', type: 'catalog', param: 'placement' },
      { label: 'Отыгрыш Низкого приоритета в Dota 2', type: 'catalog', param: 'all' },
      { label: 'Буст Порядочности в Dota 2', type: 'catalog', param: 'all' },
      { label: 'Тренировки в Dota 2', type: 'catalog', param: 'coaching' },
      { label: 'Фарм жетонів рольового пошуку Dota 2', type: 'catalog', param: 'all' }
    ]
  },
  {
    id: 'cs2_faceit',
    name: 'Counter-Strike 2',
    iconBg: '#d97706',
    iconSymbol: '💣',
    calcKey: 'cs2_faceit',
    services: [
      { label: '👑 Аккаунты', type: 'catalog', param: 'accounts', isAccount: true },
      { label: 'Буст FACEIT в CS2', type: 'calc', target: 'cs2_faceit' },
      { label: 'Калибровка Faceit в Counter-Strike 2', type: 'catalog', param: 'placement' },
      { label: 'Буст Premier в Counter-Strike 2', type: 'catalog', param: 'wins' },
      { label: 'Буст Competitive в Counter-Strike 2', type: 'catalog', param: 'wins' },
      { label: 'Буст Калибровки Premier в Counter-Strike 2', type: 'catalog', param: 'placement' },
      { label: 'Буст Калибровки Competitive в Counter-Strike 2', type: 'catalog', param: 'placement' },
      { label: 'Тренировки в CS2', type: 'catalog', param: 'coaching' }
    ]
  },
  {
    id: 'lol',
    name: 'League of Legends',
    iconBg: '#0284c7',
    iconSymbol: '⚔️',
    calcKey: 'lol',
    services: [
      { label: '👑 Аккаунты', type: 'catalog', param: 'accounts', isAccount: true },
      { label: 'Буст Solo/Duo в League of Legends', type: 'catalog', param: 'lol' },
      { label: 'Калибровка в League of Legends', type: 'catalog', param: 'placement' },
      { label: 'Буст побед в League of Legends', type: 'catalog', param: 'wins' },
      { label: 'Тренировки (Коучинг) в LoL', type: 'catalog', param: 'coaching' },
      { label: 'Прокачка уровня в LoL', type: 'catalog', param: 'all' }
    ]
  },
  {
    id: 'valorant',
    name: 'Valorant',
    iconBg: '#e11d48',
    iconSymbol: '🎯',
    calcKey: 'valorant',
    services: [
      { label: '👑 Аккаунты', type: 'catalog', param: 'accounts', isAccount: true },
      { label: 'Буст ранга в Valorant (Iron - Radiant)', type: 'calc', target: 'valorant' },
      { label: 'Калибровка нового акта в Valorant', type: 'catalog', param: 'placement' },
      { label: 'Duo буст без передачи аккаунта', type: 'calc', target: 'valorant' },
      { label: 'Тренировки от Radiant', type: 'catalog', param: 'coaching' },
      { label: 'Пакет побед в Valorant', type: 'catalog', param: 'wins' }
    ]
  },
  {
    id: 'wow',
    name: 'World of Warcraft (WOW Classic)',
    iconBg: '#2563eb',
    iconSymbol: '🏰',
    calcKey: 'wow',
    services: [
      { label: '👑 Аккаунты', type: 'catalog', param: 'accounts', isAccount: true },
      { label: 'Буст Mythic+ подземелий', type: 'catalog', param: 'all' },
      { label: 'Рейды и золото WoW', type: 'catalog', param: 'all' },
      { label: 'Прокачка уровня персонажа 1-80', type: 'catalog', param: 'all' },
      { label: 'PvP Арена рейтинг', type: 'catalog', param: 'all' }
    ]
  },
  {
    id: 'apex',
    name: 'Apex Legends',
    iconBg: '#dc2626',
    iconSymbol: '🔥',
    calcKey: 'apex',
    services: [
      { label: '👑 Аккаунты', type: 'catalog', param: 'accounts', isAccount: true },
      { label: 'Буст ранга Predator / Master', type: 'catalog', param: 'all' },
      { label: 'Бейджи 20 Kills / 4000 DMG', type: 'catalog', param: 'all' },
      { label: 'Калибровка и победы в Apex', type: 'catalog', param: 'placement' }
    ]
  },
  {
    id: 'gta5',
    name: 'Grand Theft Auto V',
    iconBg: '#16a34a',
    iconSymbol: '🚗',
    calcKey: 'gta5',
    services: [
      { label: '👑 Аккаунты GTA Online', type: 'catalog', param: 'accounts', isAccount: true },
      { label: 'Прокачка денег и уровней', type: 'catalog', param: 'all' },
      { label: 'Разблокировка предметов и авто', type: 'catalog', param: 'all' }
    ]
  },
  {
    id: 'mafia',
    name: 'Mafia The Old Country',
    iconBg: '#7f1d1d',
    iconSymbol: '🎩',
    calcKey: 'mafia',
    services: [
      { label: '👑 Аккаунты', type: 'catalog', param: 'accounts', isAccount: true },
      { label: 'Прохождение сюжета и миссий', type: 'catalog', param: 'all' },
      { label: 'Трофеи и достижения 100%', type: 'catalog', param: 'all' }
    ]
  }
];

function openHeroSearchDropdown(query = '') {
  const dropdown = document.getElementById('hero-search-dropdown');
  const input = document.getElementById('hero-game-search-input');
  if (!dropdown) return;

  const currentVal = (query !== undefined && query !== null && query !== '') ? query : (input ? input.value : '');
  renderHeroSearchDropdown(currentVal);
  dropdown.style.display = 'block';
}

function closeHeroSearchDropdown() {
  const dropdown = document.getElementById('hero-search-dropdown');
  if (dropdown) dropdown.style.display = 'none';
}

function renderHeroSearchDropdown(query = '') {
  const container = document.getElementById('hero-search-dropdown-content');
  if (!container) return;

  const q = (query || '').toLowerCase().trim();

  // Filter games based on search query
  let filteredGames = HERO_SEARCH_GAMES;
  if (q) {
    filteredGames = HERO_SEARCH_GAMES.filter(game => {
      const matchName = game.name.toLowerCase().includes(q) || game.id.toLowerCase().includes(q);
      const matchService = game.services.some(s => s.label.toLowerCase().includes(q));
      return matchName || matchService;
    });
  }

  if (filteredGames.length === 0) {
    container.innerHTML = `
      <div class="search-empty-results">
        <div style="font-size: 1.8rem; margin-bottom: 6px;">🔍</div>
        <div>За запитом <strong>«${escapeSearchHtml(query)}»</strong> нічого не знайдено</div>
        <div class="text-xs text-muted mt-2">Спробуйте ввести назву гри (напр: Dota 2, CS2, Valorant) або послугу (MMR, Faceit, Акаунти, Калібровка)</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredGames.map(game => {
    return `
      <div class="search-game-block">
        <div class="search-game-header" onclick="selectSearchGame('${game.id}', '${game.name}')" title="Перейти до послуг ${game.name}">
          <div class="search-game-title-group">
            <div class="search-game-logo-badge" style="background: ${game.iconBg};">
              ${game.iconSymbol}
            </div>
            <span class="search-game-title">${game.name}</span>
          </div>
          <span class="search-game-arrow" title="Відкрити гру">↘</span>
        </div>

        <div class="search-services-pills">
          ${game.services.map(srv => {
            const isMatch = q && srv.label.toLowerCase().includes(q);
            const accountClass = srv.isAccount ? 'pill-account' : '';
            const matchClass = isMatch ? 'highlighted' : '';
            return `
              <span class="search-service-pill ${accountClass} ${matchClass}" onclick="event.stopPropagation(); selectSearchPill('${game.id}', '${srv.type}', '${srv.param || srv.target || ''}', '${escapeSearchHtml(srv.label)}')">
                ${srv.label}
              </span>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function escapeSearchHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

function selectSearchGame(gameId, gameName) {
  closeHeroSearchDropdown();
  selectSiteGame(gameId);
}

function selectSearchPill(gameId, serviceType, param, label) {
  closeHeroSearchDropdown();

  if (param === 'accounts' || param === 'skins') {
    if (typeof filterHeroCatalog === 'function') {
      filterHeroCatalog(param);
    }
    return;
  }

  if (serviceType === 'calc') {
    const calcKey = param || (gameId === 'cs2' ? 'cs2_faceit' : gameId);
    if (typeof switchCalcGame === 'function') {
      switchCalcGame(calcKey);
    }
    const calcEl = document.getElementById('calculator');
    if (calcEl) calcEl.scrollIntoView({ behavior: 'smooth' });
    if (typeof notify !== 'undefined' && notify.show) {
      notify.show({
        title: label || '🚀 Бустинг',
        message: 'Калькулятор налаштовано! Оберіть бажаний ранг.',
        type: 'info'
      });
    }
    return;
  }

  if (serviceType === 'catalog') {
    if (typeof filterCatalog === 'function') {
      filterCatalog(param || 'all');
    }
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
    if (typeof notify !== 'undefined' && notify.show) {
      notify.show({
        title: label || '🎮 Каталог послуг',
        message: 'Каталог відкрито за обраною категорією!',
        type: 'info'
      });
    }
    return;
  }

  selectSiteGame(gameId);
}

// 3. Search / filter games in the Hero showcase
function handleHeroGameSearch(query) {
  openHeroSearchDropdown(query);

  const q = (query || '').toLowerCase().trim();
  const cards = document.querySelectorAll('#hero-games-cards-grid .hero-game-card');
  const tickers = document.querySelectorAll('#hero-ticker-scroll .ticker-item');

  cards.forEach(card => {
    const title = card.innerText.toLowerCase();
    if (!q || title.includes(q)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });

  tickers.forEach(btn => {
    const text = btn.innerText.toLowerCase();
    if (!q || text.includes(q)) {
      btn.style.display = 'inline-block';
    } else {
      btn.style.display = 'none';
    }
  });
}

// 4. Select a Game across the platform
const GAME_DISPLAY_NAMES = {
  'dota2': 'Dota 2',
  'cs2_faceit': 'Counter-Strike 2',
  'cs2': 'Counter-Strike 2',
  'valorant': 'Valorant',
  'lol': 'League of Legends',
  'pubg': 'PUBG',
  'pubg_mobile': 'PUBG Mobile',
  'fortnite': 'Fortnite',
  'minecraft': 'Minecraft',
  'brawl_stars': 'Brawl Stars',
  'apex': 'Apex Legends',
  'wow': 'World of Warcraft',
  'wow_classic': 'WOW Classic',
  'rocket_league': 'Rocket League',
  'gta5': 'Grand Theft Auto V',
  'gta4': 'Grand Theft Auto IV',
  'roblox': 'Roblox',
  'clash': 'Clash of Clans',
  'mobile_legends': 'Mobile Legends',
  'mafia': 'Mafia The Old Country'
};

function selectSiteGame(gameKey) {
  // Close the dropdown if open
  const menu = document.getElementById('all-games-dropdown-menu');
  const btn = document.getElementById('btn-all-games-toggle');
  if (menu) menu.classList.remove('show');
  if (btn) btn.classList.remove('active');

  const gameName = GAME_DISPLAY_NAMES[gameKey] || gameKey;

  // Highlight active ticker item
  const tickers = document.querySelectorAll('#hero-ticker-scroll .ticker-item');
  tickers.forEach(item => {
    const onclickStr = item.getAttribute('onclick') || '';
    item.classList.toggle('active', onclickStr.includes(`'${gameKey}'`));
  });

  // Highlight active dropdown item
  const dropItems = document.querySelectorAll('#games-dropdown-list .game-drop-item');
  dropItems.forEach(item => {
    const onclickStr = item.getAttribute('onclick') || '';
    item.classList.toggle('active', onclickStr.includes(`'${gameKey}'`));
  });

  // Check if this game is supported by the boost calculator
  const calculatorGames = ['dota2', 'valorant', 'cs2_faceit', 'cs2'];
  if (calculatorGames.includes(gameKey)) {
    const targetCalcKey = (gameKey === 'cs2') ? 'cs2_faceit' : gameKey;
    if (typeof switchCalcGame === 'function') {
      switchCalcGame(targetCalcKey);
    }
    const calcSection = document.getElementById('calculator');
    if (calcSection) {
      calcSection.scrollIntoView({ behavior: 'smooth' });
    }
    if (typeof notify !== 'undefined' && notify.show) {
      notify.show({
        title: `🎮 ${gameName}`,
        message: 'Калькулятор бустингу переключено! Оберіть бажаний ранг.',
        type: 'info'
      });
    }
    return;
  }

  // If game is in catalog services (e.g. lol, coaching, etc.)
  if (typeof filterCatalog === 'function') {
    if (gameKey === 'lol') {
      filterCatalog('lol');
    } else {
      filterCatalog('all');
    }
  }

  const catalogSection = document.getElementById('catalog');
  if (catalogSection) {
    catalogSection.scrollIntoView({ behavior: 'smooth' });
  }

  if (typeof notify !== 'undefined' && notify.show) {
    notify.show({
      title: `🎮 ${gameName}`,
      message: 'Перегляньте доступні послуги, акаунти або зверніться до онлайн-консультанта!',
      type: 'info'
    });
  }
}

// 5. Hero Category Quick Action Buttons
function filterHeroCatalog(category) {
  if (category === 'boost') {
    const calc = document.getElementById('calculator');
    if (calc) calc.scrollIntoView({ behavior: 'smooth' });
    if (typeof notify !== 'undefined' && notify.show) {
      notify.show({
        title: '🚀 Буст рейтингу',
        message: 'Оберіть гру та поточний ранг у калькуляторі нижче!',
        type: 'info'
      });
    }
    return;
  }

  const catSection = document.getElementById('catalog');
  if (catSection) catSection.scrollIntoView({ behavior: 'smooth' });

  if (category === 'accounts') {
    if (typeof filterCatalog === 'function') filterCatalog('all');
    if (typeof notify !== 'undefined' && notify.show) {
      notify.show({
        title: '👑 Ігрові акаунти',
        message: 'Доступні перевірені акаунти з моментальною передачею даних.',
        type: 'info'
      });
    }
  } else if (category === 'skins') {
    if (typeof filterCatalog === 'function') filterCatalog('cs2');
    if (typeof notify !== 'undefined' && notify.show) {
      notify.show({
        title: '🗡️ Скіни CS2',
        message: 'Перевірте доступні скіни та інвентар CS2 у каталозі.',
        type: 'info'
      });
    }
  } else if (category === 'packages') {
    if (typeof filterCatalog === 'function') filterCatalog('placement');
    if (typeof notify !== 'undefined' && notify.show) {
      notify.show({
        title: '📦 Пакети бустингу',
        message: 'Калібрування та пакетні замовлення за вигідною ціною.',
        type: 'info'
      });
    }
  }
}

// Global bindings for client profile and navigation
window.switchClientTab = switchClientTab;
window.openClientOrdersTab = openClientOrdersTab;
window.renderClientOrdersInProfile = renderClientOrdersInProfile;
window.openUserProfileModal = openUserProfileModal;
window.closeUserProfileModal = closeUserProfileModal;
window.selectPresetAvatar = selectPresetAvatar;
window.updateProfileAvatarPreview = updateProfileAvatarPreview;
window.submitUserProfileUpdate = submitUserProfileUpdate;
window.filterHeroCatalog = filterHeroCatalog;

// Global bindings for My Games & Booster Information
window.openAddGameModal = openAddGameModal;
window.closeAddGameModal = closeAddGameModal;
window.handleGameSelectChange = handleGameSelectChange;
window.handleSaveGameSubmit = handleSaveGameSubmit;
window.removeUserGame = removeUserGame;
window.renderUserGamesList = renderUserGamesList;
window.renderBoosterVerificationUI = renderBoosterVerificationUI;
window.handleBoosterInfoSave = handleBoosterInfoSave;
window.submitBoosterVerification = submitBoosterVerification;

// Global bindings for Hero rich search dropdown
window.openHeroSearchDropdown = openHeroSearchDropdown;
window.closeHeroSearchDropdown = closeHeroSearchDropdown;
window.renderHeroSearchDropdown = renderHeroSearchDropdown;
window.handleHeroGameSearch = handleHeroGameSearch;
window.selectSearchGame = selectSearchGame;
window.selectSearchPill = selectSearchPill;

// Close search dropdown on click outside
document.addEventListener('click', (e) => {
  const searchWrap = document.getElementById('hero-main-search-wrap');
  if (searchWrap && !searchWrap.contains(e.target)) {
    closeHeroSearchDropdown();
  }
});


