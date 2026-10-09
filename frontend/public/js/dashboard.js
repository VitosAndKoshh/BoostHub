// Admin and Booster Dashboard Controller

let adminAllOrders = [];
let boosterAvailableOrders = [];
let boosterMyOrders = [];
let allUsersList = [];

// Switch Role Demo Quick Bar
async function switchDemoRole(role) {
  try {
    const res = await fetch('/api/auth/demo-switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });

    const data = await res.json();
    if (res.ok && data.token) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('cyberboost_token', authToken);
      updateUserAuthUI();

      notify.show({
        title: `Увійшли як: ${currentUser.name}`,
        message: `Роль: ${currentUser.role.toUpperCase()}`,
        type: 'success',
        sound: 'success'
      });

      // If user switched to admin, open admin panel if wanted
      if (role === 'admin') {
        openAdminDashboard();
      } else if (role === 'booster') {
        openBoosterDashboard();
      } else {
        closeAllModals();
        openOrderTrackerModal();
      }
    }
  } catch (err) {
    console.error('Demo switch error:', err);
  }
}

// ---------------- ADMIN DASHBOARD ----------------

async function openAdminDashboard() {
  if (!currentUser || currentUser.role !== 'admin') {
    notify.show({ title: 'Доступ обмежено', message: 'Потрібні права адміністратора', type: 'warning' });
    return;
  }

  const modal = document.getElementById('admin-dashboard-modal');
  if (modal) modal.classList.add('open');

  await loadAdminData();
}

function closeAdminDashboard() {
  const modal = document.getElementById('admin-dashboard-modal');
  if (modal) modal.classList.remove('open');
}

async function loadAdminData() {
  try {
    // 1. Load Orders
    const ordersRes = await fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const ordersData = await ordersRes.json();
    adminAllOrders = ordersData.orders || [];

    // 2. Load Users
    const usersRes = await fetch('/api/auth/users', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const usersData = await usersRes.json();
    allUsersList = usersData.users || [];

    renderAdminStats();
    renderAdminOrders();
    renderAdminUsers();
  } catch (err) {
    console.error('Failed to load admin data:', err);
  }
}

function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });
  document.querySelectorAll('.admin-tab-content').forEach(c => {
    c.style.display = c.id === `admin-tab-${tabName}` ? 'block' : 'none';
  });
}

function renderAdminStats() {
  const totalRevenueUSD = adminAllOrders.reduce((acc, o) => acc + (o.paymentStatus === 'verified' ? o.price : 0), 0);
  const activeOrdersCount = adminAllOrders.filter(o => o.status === 'in_progress' || o.status === 'paid').length;
  const completedOrdersCount = adminAllOrders.filter(o => o.status === 'completed').length;
  const boostersCount = allUsersList.filter(u => u.role === 'booster').length;

  const revEl = document.getElementById('admin-stat-revenue');
  const activeEl = document.getElementById('admin-stat-active');
  const compEl = document.getElementById('admin-stat-completed');
  const boostEl = document.getElementById('admin-stat-boosters');

  if (revEl) revEl.textContent = `$${totalRevenueUSD} (${Math.round(totalRevenueUSD * 41.5)} ₴)`;
  if (activeEl) activeEl.textContent = activeOrdersCount;
  if (compEl) compEl.textContent = completedOrdersCount;
  if (boostEl) boostEl.textContent = boostersCount;
}

function renderAdminOrders() {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  if (adminAllOrders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center">Замовлень немає</td></tr>`;
    return;
  }

  tbody.innerHTML = adminAllOrders.map(order => {
    const statusBadges = {
      paid: '<span class="badge badge-warning">Оплачено (Очікує бустера)</span>',
      in_progress: '<span class="badge badge-info">У процесі</span>',
      completed: '<span class="badge badge-success">Виконано</span>',
      cancelled: '<span class="badge badge-danger">Скасовано</span>'
    };

    return `
      <tr>
        <td><strong>${order.id}</strong></td>
        <td>
          <div class="table-game-tag">${order.gameName}</div>
          <div class="table-order-title">${order.title}</div>
        </td>
        <td>
          <div>${order.clientName}</div>
          <small class="text-muted">${order.clientDiscord || order.accountCredentials?.discord || '-'}</small>
        </td>
        <td>
          <div class="fw-bold">$${order.price}</div>
          <small class="badge-pay ${order.paymentStatus === 'verified' ? 'pay-ok' : 'pay-pending'}">
            ${order.paymentStatus === 'verified' ? '✓ Оплачено' : 'Очікує'}
          </small>
        </td>
        <td>${statusBadges[order.status] || order.status}</td>
        <td>
          ${order.boosterName ? `<span class="booster-tag">⚡ ${order.boosterName}</span>` : '<span class="text-warning">Не призначено</span>'}
        </td>
        <td>
          <div class="action-buttons-group">
            <button class="btn btn-xs btn-primary" onclick="openAssignBoosterModal('${order.id}')">Призначити</button>
            <button class="btn btn-xs btn-outline" onclick="openLiveChat('${order.id}', '${order.title}')">Чат</button>
            <button class="btn btn-xs btn-dark" onclick="openOrderTrackerModal('${order.id}')">Деталі</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderAdminUsers() {
  const tbody = document.getElementById('admin-users-tbody');
  if (!tbody) return;

  tbody.innerHTML = allUsersList.map(user => `
    <tr>
      <td>
        <div class="d-flex align-items-center gap-2">
          <img src="${user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}" class="user-avatar-sm" />
          <strong>${user.name}</strong>
        </div>
      </td>
      <td>${user.email}</td>
      <td>
        <span class="role-badge role-${user.role}">${user.role.toUpperCase()}</span>
      </td>
      <td>${user.completedOrders !== undefined ? user.completedOrders : '-'}</td>
      <td>${user.rating ? `⭐ ${user.rating}` : '-'}</td>
    </tr>
  `).join('');
}

// Assign Booster Modal
let assignTargetOrderId = null;
function openAssignBoosterModal(orderId) {
  assignTargetOrderId = orderId;
  const modal = document.getElementById('assign-booster-modal');
  const select = document.getElementById('assign-booster-select');
  if (!modal || !select) return;

  const boosters = allUsersList.filter(u => u.role === 'booster');
  select.innerHTML = boosters.map(b => `<option value="${b.id}">${b.name} (${b.rankTitle || 'Pro Booster'})</option>`).join('');

  modal.classList.add('open');
}

function closeAssignBoosterModal() {
  const modal = document.getElementById('assign-booster-modal');
  if (modal) modal.classList.remove('open');
  assignTargetOrderId = null;
}

async function submitAssignBooster() {
  if (!assignTargetOrderId) return;
  const select = document.getElementById('assign-booster-select');
  const boosterId = select?.value;
  if (!boosterId) return;

  try {
    const res = await fetch(`/api/orders/${assignTargetOrderId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ boosterId })
    });

    if (res.ok) {
      notify.show({ title: 'Бустера призначено! ⚡', message: 'Замовлення переведено в статус виконання', type: 'success', sound: 'success' });
      closeAssignBoosterModal();
      loadAdminData();
    }
  } catch (err) {
    console.error('Assign error:', err);
  }
}

// Add New Service Form Handler
async function submitCreateNewService(event) {
  if (event) event.preventDefault();
  const title = document.getElementById('new-srv-title')?.value;
  const gameId = document.getElementById('new-srv-game')?.value;
  const category = document.getElementById('new-srv-category')?.value;
  const price = document.getElementById('new-srv-price')?.value;
  const deliveryTime = document.getElementById('new-srv-delivery')?.value;
  const description = document.getElementById('new-srv-desc')?.value;
  const features = document.getElementById('new-srv-features')?.value;

  if (!title || !price) {
    notify.show({ title: 'Помилка', message: 'Заповніть назву та ціну', type: 'warning' });
    return;
  }

  try {
    const res = await fetch('/api/catalog/services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title,
        gameId,
        category,
        price,
        deliveryTime,
        description,
        features: features ? features.split(',').map(f => f.trim()) : []
      })
    });

    if (res.ok) {
      notify.show({ title: 'Послугу додано в каталог! 🎉', message: title, type: 'success', sound: 'success' });
      document.getElementById('form-add-service')?.reset();
      initCatalog();
    }
  } catch (err) {
    console.error('Add service error:', err);
  }
}

// ---------------- BOOSTER DASHBOARD ----------------

async function openBoosterDashboard() {
  if (!currentUser || (currentUser.role !== 'booster' && currentUser.role !== 'admin')) {
    notify.show({ title: 'Доступ обмежено', message: 'Потрібен акаунт бустера', type: 'warning' });
    return;
  }

  const modal = document.getElementById('booster-dashboard-modal');
  if (modal) modal.classList.add('open');

  await loadBoosterData();
}

function closeBoosterDashboard() {
  const modal = document.getElementById('booster-dashboard-modal');
  if (modal) modal.classList.remove('open');
}

async function loadBoosterData() {
  try {
    const res = await fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    const orders = data.orders || [];

    boosterMyOrders = orders.filter(o => o.boosterId === currentUser.id);
    boosterAvailableOrders = orders.filter(o => !o.boosterId && o.status === 'paid');

    renderBoosterAvailableOrders();
    renderBoosterMyOrders();
  } catch (err) {
    console.error('Failed to load booster data:', err);
  }
}

function switchBoosterTab(tabName) {
  document.querySelectorAll('.booster-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });
  document.querySelectorAll('.booster-tab-content').forEach(c => {
    c.style.display = c.id === `booster-tab-${tabName}` ? 'block' : 'none';
  });
}

function renderBoosterAvailableOrders() {
  const container = document.getElementById('booster-available-list');
  if (!container) return;

  if (boosterAvailableOrders.length === 0) {
    container.innerHTML = `<div class="empty-state p-4"><p>Наразі немає вільних замовлень. Нові з'являться щойно клієнт здійснить оплату!</p></div>`;
    return;
  }

  container.innerHTML = boosterAvailableOrders.map(order => `
    <div class="booster-order-card cyber-card">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="badge badge-warning">Вільне замовлення</span>
        <span class="fw-bold text-success">$${order.price} (${order.priceUAH} ₴)</span>
      </div>
      <h4>${order.title}</h4>
      <div class="text-muted mb-2">Гра: ${order.gameName} | Сервер: ${order.accountCredentials?.server || 'EU'}</div>
      <div class="options-tag-row mb-3">
        ${order.options?.queueType === 'duo' ? '<span class="tag tag-duo">👥 Duo Queue</span>' : '<span class="tag">Solo</span>'}
        ${order.options?.stream ? '<span class="tag tag-stream">🎥 Discord Stream</span>' : ''}
        ${order.options?.priority ? '<span class="tag tag-vip">⚡ Express VIP</span>' : ''}
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-primary btn-sm flex-grow-1" onclick="claimBoosterOrder('${order.id}')">
          ⚡ Взяти в роботу
        </button>
        <button class="btn btn-outline btn-sm" onclick="openLiveChat('${order.id}', '${order.title}')">
          💬 Чат
        </button>
      </div>
    </div>
  `).join('');
}

function renderBoosterMyOrders() {
  const container = document.getElementById('booster-my-list');
  if (!container) return;

  if (boosterMyOrders.length === 0) {
    container.innerHTML = `<div class="empty-state p-4"><p>У вас немає активних замовлень. Оберіть замовлення у вкладці "Доступні замовлення"!</p></div>`;
    return;
  }

  container.innerHTML = boosterMyOrders.map(order => `
    <div class="booster-order-card cyber-card ${order.status === 'completed' ? 'border-success' : 'border-cyan'}">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="badge ${order.status === 'completed' ? 'badge-success' : 'badge-info'}">
          ${order.status === 'completed' ? 'Виконано' : 'В процесі'}
        </span>
        <span class="fw-bold">$${order.price}</span>
      </div>
      <h4>${order.title}</h4>
      <div class="text-muted mb-2">Клієнт: <strong>${order.clientName}</strong> (${order.accountCredentials?.login || 'Login'})</div>

      <div class="progress-bar-container my-3">
        <div class="d-flex justify-content-between text-xs mb-1">
          <span>Поточний: <strong>${order.progressRank || order.currentRank}</strong></span>
          <span>Прогрес: <strong>${order.progressPercent || 0}%</strong></span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${order.progressPercent || 0}%"></div>
        </div>
      </div>

      ${order.status !== 'completed' ? `
        <div class="booster-control-box p-3 mb-3">
          <div class="mb-2">
            <label class="form-label text-xs">Оновити поточний ранг / статус:</label>
            <input type="text" id="booster-rank-input-${order.id}" class="form-control form-control-sm" placeholder="Напр: Gold 3 (+45 RR)" value="${order.progressRank || ''}" />
          </div>
          <div class="mb-2">
            <label class="form-label text-xs">Відсоток виконання (%):</label>
            <input type="range" id="booster-slider-${order.id}" class="form-range" min="0" max="100" value="${order.progressPercent || 0}" oninput="document.getElementById('slider-val-${order.id}').textContent = this.value + '%'" />
            <div class="text-end text-xs text-muted"><span id="slider-val-${order.id}">${order.progressPercent || 0}%</span></div>
          </div>
          <div class="mb-2">
            <label class="form-label text-xs">Посилання на стрім (Twitch / Discord):</label>
            <input type="text" id="booster-stream-${order.id}" class="form-control form-control-sm" placeholder="https://twitch.tv/..." value="${order.streamUrl || ''}" />
          </div>
          <div class="d-flex gap-2 mt-3">
            <button class="btn btn-primary btn-sm flex-grow-1" onclick="submitBoosterProgress('${order.id}')">
              💾 Зберегти прогрес
            </button>
            <button class="btn btn-success btn-sm" onclick="completeBoosterOrder('${order.id}')">
              🎉 Завершити на 100%
            </button>
          </div>
        </div>
      ` : ''}

      <div class="d-flex gap-2">
        <button class="btn btn-outline btn-sm flex-grow-1" onclick="openLiveChat('${order.id}', '${order.title}')">
          💬 Чат із клієнтом
        </button>
        <button class="btn btn-dark btn-sm" onclick="openOrderTrackerModal('${order.id}')">
          Деталі трекера
        </button>
      </div>
    </div>
  `).join('');
}

async function claimBoosterOrder(orderId) {
  try {
    const res = await fetch(`/api/orders/${orderId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({})
    });

    if (res.ok) {
      notify.show({ title: 'Замовлення взято в роботу! ⚡', message: 'Повідомте клієнта в чаті', type: 'success', sound: 'success' });
      loadBoosterData();
    }
  } catch (err) {
    console.error('Claim error:', err);
  }
}

async function submitBoosterProgress(orderId) {
  const rankInput = document.getElementById(`booster-rank-input-${orderId}`)?.value;
  const sliderVal = document.getElementById(`booster-slider-${orderId}`)?.value;
  const streamUrl = document.getElementById(`booster-stream-${orderId}`)?.value;

  try {
    const res = await fetch(`/api/orders/${orderId}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        progressRank: rankInput,
        progressPercent: sliderVal,
        streamUrl: streamUrl,
        statusNote: `Бустер оновив прогрес: ${rankInput} (${sliderVal}%)`
      })
    });

    if (res.ok) {
      const data = await res.json();
      notify.show({ title: 'Прогрес оновлено! 🚀', message: `${rankInput} (${sliderVal}%)`, type: 'rankup', sound: 'rankup' });

      if (socket && socket.connected) {
        socket.emit('order_progress_sync', data.order);
      }

      loadBoosterData();
    }
  } catch (err) {
    console.error('Progress update error:', err);
  }
}

async function completeBoosterOrder(orderId) {
  try {
    const res = await fetch(`/api/orders/${orderId}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        progressPercent: 100,
        status: 'completed',
        statusNote: 'Буст успішно завершено! Вітаємо з новим рангом.'
      })
    });

    if (res.ok) {
      const data = await res.json();
      notify.show({ title: 'Замовлення виконано на 100%! 🏆', message: 'Дякуємо за відмінну роботу', type: 'success', sound: 'success' });

      if (socket && socket.connected) {
        socket.emit('order_progress_sync', data.order);
      }

      loadBoosterData();
    }
  } catch (err) {
    console.error('Complete error:', err);
  }
}

function reloadDashboardOrders() {
  if (currentUser?.role === 'admin') loadAdminData();
  if (currentUser?.role === 'booster') loadBoosterData();
}
