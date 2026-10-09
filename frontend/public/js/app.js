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
        // Token expired
        authToken = null;
        currentUser = null;
        localStorage.removeItem('cyberboost_token');
      }
    } catch (e) {
      console.warn('Auth check error:', e);
    }
  }

  // If no user logged in, default login as client demo for a seamless experience
  if (!currentUser) {
    try {
      const res = await fetch('/api/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'client' })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('cyberboost_token', authToken);
      }
    } catch (e) {
      console.warn('Default demo login error:', e);
    }
  }

  updateUserAuthUI();
}

function updateUserAuthUI() {
  const authNav = document.getElementById('nav-user-area');
  const demoRoleBtns = document.querySelectorAll('.demo-role-btn');

  // Highlight active role button in top banner
  demoRoleBtns.forEach(btn => {
    btn.classList.toggle('active', currentUser && btn.getAttribute('data-role') === currentUser.role);
  });

  if (!authNav) return;

  if (currentUser) {
    let roleSpecificNav = '';
    if (currentUser.role === 'admin') {
      roleSpecificNav = `<button class="btn btn-outline-cyan btn-sm" onclick="openAdminDashboard()">⚡ ${t('nav_admin')}</button>`;
    } else if (currentUser.role === 'booster') {
      roleSpecificNav = `<button class="btn btn-outline-cyan btn-sm" onclick="openBoosterDashboard()">🎮 ${t('nav_booster_panel')}</button>`;
    }

    authNav.innerHTML = `
      <div class="user-profile-badge">
        ${roleSpecificNav}
        <button class="btn btn-outline btn-sm" onclick="openOrderTrackerModal()">
          📦 ${t('nav_tracker')}
        </button>
        <div class="user-info-pill" onclick="openOrderTrackerModal()">
          <img src="${currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" class="user-avatar-sm" />
          <span class="user-name-text">${currentUser.name}</span>
          <span class="role-badge role-${currentUser.role}">${currentUser.role.toUpperCase()}</span>
        </div>
        <button class="btn btn-icon-sm" onclick="logoutUser()" title="${t('nav_logout')}">🚪</button>
      </div>
    `;
  } else {
    authNav.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="openAuthModal('login')">${t('nav_login')}</button>
      <button class="btn btn-primary btn-sm" onclick="openAuthModal('register')">Реєстрація</button>
    `;
  }
}

function logoutUser() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('cyberboost_token');
  updateUserAuthUI();
  notify.show({ title: 'Вихід', message: 'Ви успішно вийшли з акаунту', type: 'info' });
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

function openAuthModal(mode = 'login') {
  currentAuthMode = mode;
  const modal = document.getElementById('auth-modal');
  const title = document.getElementById('auth-modal-title');
  const regFields = document.getElementById('auth-register-fields');
  const submitBtn = document.getElementById('auth-submit-btn');
  const switchText = document.getElementById('auth-switch-text');

  if (modal) modal.classList.add('open');

  if (mode === 'login') {
    if (title) title.textContent = 'Вхід в акаунт CyberBoost';
    if (regFields) regFields.style.display = 'none';
    if (submitBtn) submitBtn.textContent = 'Увійти';
    if (switchText) switchText.innerHTML = `Немає акаунту? <a href="javascript:void(0)" onclick="openAuthModal('register')">Зареєструватися</a>`;
  } else {
    if (title) title.textContent = 'Реєстрація нового клієнта';
    if (regFields) regFields.style.display = 'block';
    if (submitBtn) submitBtn.textContent = 'Створити акаунт';
    if (switchText) switchText.innerHTML = `Вже є акаунт? <a href="javascript:void(0)" onclick="openAuthModal('login')">Увійти</a>`;
  }
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('open');
}

async function handleAuthFormSubmit(event) {
  if (event) event.preventDefault();
  const email = document.getElementById('auth-email')?.value;
  const password = document.getElementById('auth-password')?.value;
  const name = document.getElementById('auth-name')?.value;
  const discord = document.getElementById('auth-discord')?.value;

  const endpoint = currentAuthMode === 'login' ? '/api/auth/login' : '/api/auth/register';
  const payload = currentAuthMode === 'login'
    ? { email, password }
    : { email, password, name, discord };

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

      notify.show({
        title: `Ласкаво просимо, ${currentUser.name}!`,
        message: 'Ви успішно авторизувалися',
        type: 'success',
        sound: 'success'
      });
    } else {
      notify.show({ title: 'Помилка', message: data.error || 'Невірні дані', type: 'warning' });
    }
  } catch (err) {
    console.error('Auth submit error:', err);
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
