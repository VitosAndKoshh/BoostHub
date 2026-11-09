// Admin and Booster Dashboard Controller

let adminAllOrders = [];
let boosterAvailableOrders = [];
let boosterMyOrders = [];
let allUsersList = [];
let adminBoosterApplications = [];

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

      const roleDisplay = typeof getRoleDisplay === 'function' ? getRoleDisplay(currentUser.role) : { full: currentUser.role };
      notify.show({
        title: `Увійшли як: ${roleDisplay.full}`,
        message: `Користувач: ${currentUser.name}`,
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

    // 3. Load Booster Applications
    try {
      const appsRes = await fetch('/api/auth/booster-applications', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        adminBoosterApplications = appsData.applications || [];
        const pendingCount = adminBoosterApplications.filter(a => a.status === 'pending').length;
        const appsBadge = document.getElementById('admin-apps-badge');
        if (appsBadge) {
          appsBadge.textContent = pendingCount;
          appsBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
        }
        renderAdminBoosterApplications();
      }
    } catch (e) {
      console.warn('Could not load booster applications:', e);
    }
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

  tbody.innerHTML = allUsersList.map(user => {
    const verificationStatus = user.boosterVerification || 'None';
    const statusBadges = {
      Verified: '<span class="badge badge-success">✓ Verified</span>',
      Pending: '<span class="badge badge-warning">⏳ Pending</span>',
      Rejected: '<span class="badge badge-danger">✕ Rejected</span>',
      None: '<span class="badge" style="opacity: 0.5;">None</span>'
    };

    const isBoosterOrApplicant = user.role === 'booster' || verificationStatus !== 'None';

    let actionBtns = '<span class="text-muted text-xs">-</span>';
    if (isBoosterOrApplicant) {
      actionBtns = `
        <div class="d-flex gap-1">
          ${verificationStatus !== 'Verified' ? `<button class="btn btn-xs btn-success" onclick="adminUpdateBoosterVerification('${user.id}', 'Verified')">✅ Підтвердити</button>` : ''}
          ${verificationStatus !== 'Rejected' ? `<button class="btn btn-xs btn-outline-danger" onclick="adminUpdateBoosterVerification('${user.id}', 'Rejected')">❌ Відхилити</button>` : ''}
        </div>
      `;
    }

    const steamDiscordText = [
      user.steamId ? `Steam: ${user.steamId}` : '',
      user.discord ? `Discord: ${user.discord}` : ''
    ].filter(Boolean).join('<br/>') || '<span class="text-muted text-xs">Не вказано</span>';

    return `
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
        <td class="text-xs">${steamDiscordText}</td>
        <td>${statusBadges[verificationStatus] || verificationStatus}</td>
        <td>${user.completedOrders !== undefined ? user.completedOrders : '-'}</td>
        <td>${actionBtns}</td>
      </tr>
    `;
  }).join('');
}

async function adminUpdateBoosterVerification(userId, status) {
  try {
    const res = await fetch(`/api/auth/users/${userId}/verification`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ status })
    });

    const data = await res.json();
    if (res.ok) {
      notify.show({
        title: 'Статус оновлено!',
        message: `Статус верифікації для ${data.user?.name || 'бустера'}: ${status}`,
        type: status === 'Verified' ? 'success' : 'info'
      });
      loadAdminData();
    } else {
      notify.show({ title: 'Помилка', message: data.error || 'Не вдалося оновити статус', type: 'warning' });
    }
  } catch (err) {
    console.error('Admin verification update error:', err);
  }
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

async function openBoosterDashboard(initialTab = 'available') {
  if (!currentUser || (currentUser.role !== 'booster' && currentUser.role !== 'admin')) {
    notify.show({ title: 'Доступ обмежено', message: 'Потрібен акаунт бустера', type: 'warning' });
    return;
  }

  const modal = document.getElementById('booster-dashboard-modal');
  if (modal) modal.classList.add('open');

  await loadBoosterData();
  if (initialTab) {
    switchBoosterTab(initialTab);
  }
}

function closeBoosterDashboard() {
  const modal = document.getElementById('booster-dashboard-modal');
  if (modal) modal.classList.remove('open');
}

let currentBoosterPeriod = 'month';

function getBoosterPeriodLabel(period) {
  switch (period) {
    case 'today': return 'За сьогодні';
    case 'week': return 'За останні 7 днів';
    case 'month': return 'За останні 30 днів';
    case 'all': return 'За весь час';
    default: return 'За період';
  }
}

function getGameIcon(gameName, gameId) {
  const g = (gameName || gameId || '').toLowerCase();
  if (g.includes('val')) return '🎯';
  if (g.includes('cs') || g.includes('counter') || g.includes('premier') || g.includes('faceit')) return '💣';
  if (g.includes('lol') || g.includes('league')) return '⚔️';
  if (g.includes('dota')) return '🛡️';
  if (g.includes('apex')) return '🔥';
  return '🎮';
}

function changeBoosterPeriod(period) {
  currentBoosterPeriod = period;
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-period') === period);
  });
  renderBoosterStats();
}

function filterOrdersByPeriod(orders, period) {
  const now = Date.now();
  if (period === 'today') {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return orders.filter(o => {
      const d = new Date(o.acceptedAt || o.completedAt || o.createdAt).getTime();
      return d >= startOfToday.getTime();
    });
  }
  if (period === 'week') {
    const startOfWeek = now - 7 * 86400000;
    return orders.filter(o => {
      const d = new Date(o.acceptedAt || o.completedAt || o.createdAt).getTime();
      return d >= startOfWeek;
    });
  }
  if (period === 'month') {
    const startOfMonth = now - 30 * 86400000;
    return orders.filter(o => {
      const d = new Date(o.acceptedAt || o.completedAt || o.createdAt).getTime();
      return d >= startOfMonth;
    });
  }
  return orders; // 'all'
}

function renderBoosterStats() {
  if (!currentUser) return;

  // Header user info & quick banner
  const headerInfo = document.getElementById('booster-header-user-info');
  if (headerInfo) {
    headerInfo.innerHTML = `Нікнейм: <strong>${currentUser.name}</strong> | Ранг: <span class="text-cyan">${currentUser.rankTitle || 'Radiant / Faceit 10 (PRO)'}</span> | Рейтинг: <span class="text-warning">⭐ ${currentUser.rating || 5.0}</span>`;
  }

  // Calculate all-time summary
  const allCompleted = boosterMyOrders.filter(o => o.status === 'completed');
  const allEarnedUSD = allCompleted.reduce((sum, o) => sum + Math.round((o.price || 0) * 0.8), 0);
  const allEarnedUAH = allCompleted.reduce((sum, o) => sum + Math.round((o.priceUAH || (o.price || 0) * 41.5) * 0.8), 0);

  const kpiBanner = document.getElementById('booster-quick-kpi-banner');
  if (kpiBanner) {
    kpiBanner.innerHTML = `
      <div class="booster-kpi-card">
        <div class="kpi-icon">💰</div>
        <div>
          <div class="kpi-label">Всього зароблено (весь час)</div>
          <div class="kpi-value text-success">$${allEarnedUSD.toLocaleString()} <span class="kpi-sub">(${allEarnedUAH.toLocaleString()} ₴)</span></div>
        </div>
      </div>
      <div class="booster-kpi-card">
        <div class="kpi-icon">📋</div>
        <div>
          <div class="kpi-label">Всього прийнято заявок</div>
          <div class="kpi-value text-cyan">${boosterMyOrders.length}</div>
        </div>
      </div>
      <div class="booster-kpi-card">
        <div class="kpi-icon">🏆</div>
        <div>
          <div class="kpi-label">Успішно виконано</div>
          <div class="kpi-value text-gold">${allCompleted.length}</div>
        </div>
      </div>
      <div class="booster-kpi-card">
        <div class="kpi-icon">⭐</div>
        <div>
          <div class="kpi-label">Рейтинг виконавця</div>
          <div class="kpi-value text-warning">${currentUser.rating || 5.0} / 5.0</div>
        </div>
      </div>
    `;
  }

  // Filter orders for the selected period
  const periodOrders = filterOrdersByPeriod(boosterMyOrders, currentBoosterPeriod);
  const periodCompleted = periodOrders.filter(o => o.status === 'completed');
  const periodInProgress = periodOrders.filter(o => o.status !== 'completed');

  const periodEarnedUSD = periodCompleted.reduce((sum, o) => sum + Math.round((o.price || 0) * 0.8), 0);
  const periodEarnedUAH = periodCompleted.reduce((sum, o) => sum + Math.round((o.priceUAH || (o.price || 0) * 41.5) * 0.8), 0);
  const periodPendingUSD = periodInProgress.reduce((sum, o) => sum + Math.round((o.price || 0) * 0.8), 0);
  const periodPendingUAH = periodInProgress.reduce((sum, o) => sum + Math.round((o.priceUAH || (o.price || 0) * 41.5) * 0.8), 0);

  // Period label tag
  const periodTag = document.getElementById('booster-period-tag');
  if (periodTag) {
    periodTag.textContent = getBoosterPeriodLabel(currentBoosterPeriod);
  }

  // Period summary cards
  const summaryContainer = document.getElementById('booster-period-summary');
  if (summaryContainer) {
    summaryContainer.innerHTML = `
      <div class="period-stat-card cyber-card">
        <div class="stat-top">
          <span class="stat-title">💵 Заробіток за період</span>
          <span class="badge badge-success">Виплата 80%</span>
        </div>
        <div class="stat-number text-success">$${periodEarnedUSD.toLocaleString()} <span class="stat-unit">(${periodEarnedUAH.toLocaleString()} ₴)</span></div>
        <div class="stat-footnote text-muted">
          ${periodPendingUSD > 0 ? `+ $${periodPendingUSD} (${periodPendingUAH} ₴) очікує завершення` : 'Всі прийняті замовлення виплачені'}
        </div>
      </div>

      <div class="period-stat-card cyber-card">
        <div class="stat-top">
          <span class="stat-title">📋 Прийнято заявок</span>
          <span class="badge badge-info">${getBoosterPeriodLabel(currentBoosterPeriod)}</span>
        </div>
        <div class="stat-number text-cyan">${periodOrders.length} <span class="stat-unit">заявок</span></div>
        <div class="stat-footnote text-muted">
          Виконано: <strong>${periodCompleted.length}</strong> | В роботі: <strong>${periodInProgress.length}</strong>
        </div>
      </div>

      <div class="period-stat-card cyber-card">
        <div class="stat-top">
          <span class="stat-title">🏁 Успішність виконання</span>
          <span class="badge badge-warning">Winrate</span>
        </div>
        <div class="stat-number text-gold">
          ${periodOrders.length > 0 ? Math.round((periodCompleted.length / periodOrders.length) * 100) : 100}%
        </div>
        <div class="stat-footnote text-muted">
          ${periodCompleted.length} з ${periodOrders.length} замовлень завершено
        </div>
      </div>
    `;
  }

  // Breakdown by game for selected period
  const gameStats = {};
  periodOrders.forEach(o => {
    const game = o.gameName || 'Інші ігри';
    if (!gameStats[game]) {
      gameStats[game] = {
        gameName: game,
        gameId: o.gameId,
        acceptedCount: 0,
        completedCount: 0,
        inProgressCount: 0,
        earnedUSD: 0,
        earnedUAH: 0,
        pendingUSD: 0,
        pendingUAH: 0
      };
    }
    gameStats[game].acceptedCount += 1;
    const payoutUSD = Math.round((o.price || 0) * 0.8);
    const payoutUAH = Math.round((o.priceUAH || (o.price || 0) * 41.5) * 0.8);

    if (o.status === 'completed') {
      gameStats[game].completedCount += 1;
      gameStats[game].earnedUSD += payoutUSD;
      gameStats[game].earnedUAH += payoutUAH;
    } else {
      gameStats[game].inProgressCount += 1;
      gameStats[game].pendingUSD += payoutUSD;
      gameStats[game].pendingUAH += payoutUAH;
    }
  });

  const gameList = Object.values(gameStats).sort((a, b) => b.acceptedCount - a.acceptedCount);
  const gameContainer = document.getElementById('booster-game-stats-container');

  if (gameContainer) {
    if (gameList.length === 0) {
      gameContainer.innerHTML = `
        <div class="p-4 text-center text-muted">
          Немає прийнятих заявок за обраний період (${getBoosterPeriodLabel(currentBoosterPeriod)}).
          <div class="mt-2"><button class="btn btn-outline-cyan btn-xs" onclick="changeBoosterPeriod('all')">Показати за весь час</button></div>
        </div>
      `;
    } else {
      const maxCount = Math.max(...gameList.map(g => g.acceptedCount), 1);
      gameContainer.innerHTML = `
        <div class="game-stats-grid">
          ${gameList.map(g => {
            const icon = getGameIcon(g.gameName, g.gameId);
            const percent = periodOrders.length > 0 ? Math.round((g.acceptedCount / periodOrders.length) * 100) : 0;
            return `
              <div class="game-stat-card cyber-card">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <div class="d-flex align-items-center gap-2">
                    <span class="game-icon-bubble">${icon}</span>
                    <strong class="game-title-text">${g.gameName}</strong>
                  </div>
                  <span class="badge badge-info">${percent}% заявок</span>
                </div>

                <div class="game-stat-body my-3">
                  <div class="d-flex justify-content-between align-items-baseline mb-1">
                    <span class="text-muted text-xs">Прийнято заявок:</span>
                    <span class="game-order-count text-cyan fw-bold">${g.acceptedCount} замовл.</span>
                  </div>
                  <div class="d-flex justify-content-between align-items-baseline mb-2">
                    <span class="text-muted text-xs">Зароблено:</span>
                    <span class="text-success fw-bold">$${g.earnedUSD} (${g.earnedUAH} ₴)</span>
                  </div>
                  <div class="game-progress-bar">
                    <div class="game-progress-fill" style="width: ${(g.acceptedCount / maxCount) * 100}%"></div>
                  </div>
                </div>

                <div class="d-flex justify-content-between text-xs text-muted pt-2 border-top" style="border-color: rgba(255,255,255,0.08) !important;">
                  <span>Виконано: <strong class="text-success">${g.completedCount}</strong></span>
                  <span>В роботі: <strong class="text-warning">${g.inProgressCount}</strong></span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  }

  // History Table
  const tbody = document.getElementById('booster-orders-history-tbody');
  if (tbody) {
    if (periodOrders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-muted">Немає замовлень за обраний період</td></tr>`;
    } else {
      tbody.innerHTML = periodOrders.map(o => {
        const dateStr = new Date(o.acceptedAt || o.createdAt).toLocaleDateString('uk-UA', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
        const icon = getGameIcon(o.gameName, o.gameId);
        const payoutUSD = Math.round((o.price || 0) * 0.8);
        const payoutUAH = Math.round((o.priceUAH || (o.price || 0) * 41.5) * 0.8);
        const isDone = o.status === 'completed';

        return `
          <tr>
            <td>
              <strong>${o.id}</strong><br/>
              <span class="text-xs text-muted">${o.title}</span>
            </td>
            <td>
              <span class="badge badge-info">${icon} ${o.gameName}</span>
            </td>
            <td class="text-xs text-muted">${dateStr}</td>
            <td>
              <span class="badge ${isDone ? 'badge-success' : 'badge-warning'}">
                ${isDone ? '✅ Виконано' : '⚡ В роботі'}
              </span>
            </td>
            <td>$${o.price} (${o.priceUAH} ₴)</td>
            <td class="fw-bold ${isDone ? 'text-success' : 'text-warning'}">
              +$${payoutUSD} (${payoutUAH} ₴)
            </td>
          </tr>
        `;
      }).join('');
    }
  }
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

    const activeInWork = boosterMyOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');

    // Update badge counts in tabs: ONLY count active orders in progress!
    const availCountEl = document.getElementById('booster-tab-avail-count');
    if (availCountEl) {
      availCountEl.textContent = boosterAvailableOrders.length;
      availCountEl.style.display = boosterAvailableOrders.length > 0 ? 'inline-block' : 'none';
    }

    const myCountEl = document.getElementById('booster-tab-my-count');
    if (myCountEl) {
      myCountEl.textContent = activeInWork.length;
      myCountEl.style.display = activeInWork.length > 0 ? 'inline-block' : 'none';
    }

    const navBadge = document.getElementById('nav-booster-avail-badge');
    if (navBadge) {
      navBadge.textContent = boosterAvailableOrders.length;
      navBadge.style.display = boosterAvailableOrders.length > 0 ? 'inline-block' : 'none';
    }

    const profileAvailCountEl = document.getElementById('profile-booster-avail-count');
    if (profileAvailCountEl) {
      profileAvailCountEl.textContent = boosterAvailableOrders.length;
    }

    const profileMyCountEl = document.getElementById('profile-booster-my-count');
    if (profileMyCountEl) {
      profileMyCountEl.textContent = activeInWork.length;
    }

    renderBoosterStats();
    renderBoosterAvailableOrders();
    renderBoosterMyOrders();
    renderBoosterSettings();
    renderBoosterWalletUI();
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
  if (tabName === 'settings') {
    renderBoosterSettings();
  }
}

function renderBoosterAvailableOrders() {
  const container = document.getElementById('booster-available-list');
  const profileContainer = document.getElementById('profile-booster-available-list');
  if (!container && !profileContainer) return;

  const isVerified = currentUser && (currentUser.boosterVerification === 'Verified' || currentUser.role === 'booster' || currentUser.role === 'admin');
  const verificationBanner = currentUser?.boosterVerification === 'Rejected' ? `
    <div class="verification-warning-banner p-3 mb-3 border-danger cyber-box text-center" style="grid-column: 1 / -1; background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444;">
      <div style="font-size: 1.5rem; margin-bottom: 4px;">⚠️</div>
      <strong class="text-danger">Ваш акаунт бустера відхилено</strong>
      <div class="text-xs text-muted mt-1">Зверніться до адміністратора в чаті підтримки для уточнення інформації.</div>
    </div>
  ` : '';

  if (boosterAvailableOrders.length === 0) {
    const emptyHtml = `
      ${verificationBanner}
      <div class="empty-state p-4 text-center" style="grid-column: 1 / -1;">
        <div style="font-size: 2rem; margin-bottom: 8px;">⏳</div>
        <h4>Наразі немає нових вільних замовлень</h4>
        <p class="text-muted text-xs">Щойно клієнт здійснить оплату, нове замовлення миттєво з'явиться тут для взяття в роботу!</p>
      </div>
    `;
    if (container) container.innerHTML = emptyHtml;
    if (profileContainer) profileContainer.innerHTML = emptyHtml;
    return;
  }

  const ordersHtml = verificationBanner + boosterAvailableOrders.map(order => {
    const payoutUSD = Math.round((order.price || 0) * 0.8);
    const payoutUAH = Math.round((order.priceUAH || (order.price || 0) * 41.5) * 0.8);
    const isCustom = !!(order.isCustomPrice || order.options?.isCustomPrice);
    const origPrice = order.originalCalculatedPrice || order.options?.originalCalculatedPrice;

    return `
      <div class="booster-order-card cyber-card border-warning">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="badge badge-warning">⚡ Очікує бустера</span>
          <span class="text-xs text-muted">ID: ${order.id}</span>
        </div>
        <h4 style="margin-bottom: 4px;">${order.title}</h4>
        <div class="text-xs text-muted mb-2">Гра: <strong>${order.gameName}</strong> | Сервер: ${order.accountCredentials?.server || 'EU'}</div>

        <div class="options-tag-row mb-3">
          ${order.options?.queueType === 'duo' ? '<span class="tag tag-duo">👥 Duo Queue</span>' : '<span class="tag">Solo</span>'}
          ${order.options?.stream ? '<span class="tag tag-stream">🎥 Discord Stream</span>' : ''}
          ${order.options?.priority ? '<span class="tag tag-vip">⚡ Express VIP</span>' : ''}
          ${order.options?.offlineMode ? '<span class="tag">Offline Steam</span>' : ''}
        </div>

        ${isCustom ? `
          <div class="booster-price-agree-card mb-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="custom-price-badge-tag">💰 Пропозиція клієнта</span>
              ${origPrice ? `<span class="text-xs text-muted">Каталог: ${origPrice}</span>` : ''}
            </div>
            <div class="text-xs text-warning">
              Клієнт запропонував свою ціну: <strong class="text-gold">${order.price}</strong> (${order.priceUAH || Math.round(order.price * 41.5)} ₴). Чи згодні ви взятися за таке замовлення?
            </div>
          </div>
        ` : ''}

        <div class="p-2 cyber-box mb-3 d-flex justify-content-between align-items-center">
          <div>
            <span class="text-xs text-muted">${isCustom ? 'Запропоновано клієнтом:' : 'Вартість замовлення:'}</span>
            <div class="text-sm fw-bold">${order.price} (${order.priceUAH || Math.round(order.price * 41.5)} ₴)</div>
          </div>
          <div class="text-end">
            <span class="text-xs text-success fw-bold">💰 Ваша виплата (80%):</span>
            <div class="text-lg text-success fw-bold">+${payoutUSD} (${payoutUAH} ₴)</div>
          </div>
        </div>

        <div class="d-flex gap-2">
          <button class="btn ${isVerified ? (isCustom ? 'btn-success' : 'btn-primary') : 'btn-outline'} btn-sm flex-grow-1" onclick="claimBoosterOrder('${order.id}')" ${!isVerified ? 'style="opacity: 0.6;" title="Потрібна верифікація акаунту"' : ''}>
            ${isVerified ? (isCustom ? `🤝 Згоден взятися за ${order.price} (Прийняти)` : '⚡ Прийняти замовлення') : '🔒 Потрібна верифікація'}
          </button>
          <button class="btn btn-outline btn-sm" onclick="openLiveChat('${order.id}', '${order.title}')">
            💬 Чат
          </button>
        </div>
      </div>`;
  }).join('');

  if (container) container.innerHTML = ordersHtml;
  if (profileContainer) profileContainer.innerHTML = ordersHtml;
}

function renderBoosterMyOrders() {
  const container = document.getElementById('booster-my-list');
  const profileContainer = document.getElementById('profile-booster-my-list');
  if (!container && !profileContainer) return;

  // Filter ONLY active orders in work! Completed orders are removed from this list.
  const activeOrders = (boosterMyOrders || []).filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const completedOrders = (boosterMyOrders || []).filter(o => o.status === 'completed');

  if (activeOrders.length === 0) {
    const emptyHtml = `
      <div class="empty-state p-4 text-center" style="grid-column: 1 / -1;">
        <div style="font-size: 2.2rem; margin-bottom: 8px;">🎮</div>
        <h4>Немає активних замовлень у роботі</h4>
        <p class="text-muted text-xs mb-3">Усі взяті бусти успішно завершено! Їх виплати зараховано до вашого гаманця.</p>
        <button class="btn btn-primary btn-sm" onclick="if(typeof switchClientTab==='function') switchClientTab('booster-avail'); if(typeof switchBoosterTab==='function') switchBoosterTab('available');">
          ⚡ Взяти нове буст-замовлення
        </button>
      </div>
      ${completedOrders.length > 0 ? `
        <div class="col-12 mt-4" style="grid-column: 1 / -1;">
          <details class="cyber-box p-3">
            <summary class="text-xs text-muted cursor-pointer d-flex justify-content-between align-items-center">
              <span>📜 <strong>Архів завершених замовлень (${completedOrders.length})</strong></span>
              <span class="text-cyan">Показати завершені бусти ▾</span>
            </summary>
            <div class="catalog-grid mt-3">
              ${renderCompletedBoosterCards(completedOrders)}
            </div>
          </details>
        </div>
      ` : ''}
    `;
    if (container) container.innerHTML = emptyHtml;
    if (profileContainer) profileContainer.innerHTML = emptyHtml;
    return;
  }

  const activeOrdersHtml = activeOrders.map(order => {
    const payoutUSD = Math.round((order.price || 0) * 0.8);
    const payoutUAH = Math.round((order.priceUAH || (order.price || 0) * 41.5) * 0.8);
    const initialPct = order.progressPercent || 0;
    const basePrice = order.originalPrice || order.price || 0;
    const initialCalcPrice = Math.max(1, Math.round(basePrice * (Math.max(1, initialPct) / 100)));

    let partialAlert = '';
    if (order.partialClose && order.partialClose.status === 'pending') {
      partialAlert = `
        <div class="p-3 mb-3 cyber-box border-warning" style="background: rgba(234, 179, 8, 0.1);">
          <div class="d-flex align-items-center gap-2 mb-1">
            <span style="font-size: 1.1rem;">⏳</span>
            <strong class="text-warning text-xs">Запит на дострокове закриття надіслано клієнту</strong>
          </div>
          <div class="text-xs text-muted">
            Ви запропонували завершити буст на <strong>${order.partialClose.progressPercent}%</strong> за зменшеною сумою <strong>$${order.partialClose.proposedPrice} (${order.partialClose.proposedPriceUAH} ₴)</strong>. Очікуємо підтвердження клієнта.
          </div>
        </div>
      `;
    }

    return `
    <div class="booster-order-card cyber-card border-cyan">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="badge badge-info">⚡ В процесі</span>
        <span class="text-xs text-muted">Ціна: $${order.price} (${order.priceUAH || Math.round(order.price * 41.5)} ₴)</span>
      </div>
      <h4 style="margin-bottom: 4px;">${order.title}</h4>
      <div class="text-muted text-xs mb-2">Клієнт: <strong>${order.clientName}</strong> (${order.accountCredentials?.login || 'Login'})</div>

      <!-- Booster Payout Highlight for this order -->
      <div class="p-2 mb-3 cyber-box d-flex justify-content-between align-items-center" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: var(--radius-sm);">
        <span class="text-xs text-muted">💰 Ви отримаєте за цей буст (80%):</span>
        <span class="text-sm fw-bold text-success">+${payoutUSD} (${payoutUAH} ₴)</span>
      </div>

      <div class="progress-bar-container my-3">
        <div class="d-flex justify-content-between text-xs mb-1">
          <span>Поточний: <strong>${order.progressRank || order.currentRank}</strong></span>
          <span>Прогрес: <strong>${order.progressPercent || 0}%</strong></span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${order.progressPercent || 0}%"></div>
        </div>
      </div>

      ${partialAlert}
      <div class="booster-control-box p-3 mb-3">
        <div class="mb-2">
          <label class="form-label text-xs">Оновити поточний ранг / статус:</label>
          <input type="text" id="booster-rank-input-${order.id}" class="form-control form-control-sm" placeholder="Напр: Gold 3 (+45 RR)" value="${order.progressRank || ''}" />
        </div>
        <div class="mb-2">
          <label class="form-label text-xs">Відсоток виконання (%):</label>
          <input type="range" id="booster-slider-${order.id}" class="form-range" min="0" max="100" value="${initialPct}" oninput="updateBoosterSliderDisplay('${order.id}', this.value, ${basePrice})" />
          <div class="d-flex justify-content-between text-xs text-muted mt-1">
            <span>Прогрес: <strong id="slider-val-${order.id}" class="text-cyan">${initialPct}%</strong></span>
            <span id="slider-price-calc-${order.id}" class="text-warning">Сума при закритті: $${initialCalcPrice}</span>
          </div>
        </div>

        <!-- Partial Boost Close Proposal Button -->
        <div class="mb-3">
          <button type="button" class="btn btn-outline-warning btn-sm w-100" id="btn-partial-close-${order.id}" onclick="requestBoosterPartialClose('${order.id}')" title="Запропонувати клієнту закрити буст на поточному відсотку за зменшеною ціною">
            ⏹️ Запропонувати закрити на <span id="btn-partial-pct-${order.id}">${initialPct}%</span> (за <span id="btn-partial-price-${order.id}">$${initialCalcPrice}</span>)
          </button>
          <div class="text-muted text-dim mt-1" style="font-size: 0.7rem;">
            *Якщо клієнт погодиться, ціна замовлення зменшиться пропорційно. Якщо відхилить — буст продовжиться.
          </div>
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

      <div class="d-flex gap-2">
        <button class="btn btn-outline btn-sm flex-grow-1" onclick="openLiveChat('${order.id}', '${order.title}')">
          💬 Чат із клієнтом
        </button>
        <button class="btn btn-dark btn-sm" onclick="openOrderTrackerModal('${order.id}')">
          Деталі трекера
        </button>
      </div>
    </div>
  `;
  }).join('');

  const completedAccordionHtml = completedOrders.length > 0 ? `
    <div class="col-12 mt-4" style="grid-column: 1 / -1;">
      <details class="cyber-box p-3">
        <summary class="text-xs text-muted cursor-pointer d-flex justify-content-between align-items-center">
          <span>📜 <strong>Архів завершених замовлень (${completedOrders.length})</strong></span>
          <span class="text-cyan">Показати завершені бусти ▾</span>
        </summary>
        <div class="catalog-grid mt-3">
          ${renderCompletedBoosterCards(completedOrders)}
        </div>
      </details>
    </div>
  ` : '';

  const fullHtml = activeOrdersHtml + completedAccordionHtml;

  if (container) container.innerHTML = fullHtml;
  if (profileContainer) profileContainer.innerHTML = fullHtml;
}

function renderCompletedBoosterCards(completedOrders) {
  return completedOrders.map(order => {
    const payoutUSD = Math.round((order.price || 0) * 0.8);
    const payoutUAH = Math.round((order.priceUAH || (order.price || 0) * 41.5) * 0.8);

    let closedLabel = '🎉 Завершено на 100%';
    if (order.closedBy === 'client') {
      closedLabel = '✅ Прийнято та закрито клієнтом';
    } else if (order.closedBy === 'client_partial_agreement') {
      closedLabel = `🤝 Закрито за взаємною згодою на ${order.progressPercent}%`;
    }

    return `
      <div class="booster-order-card cyber-card border-success" style="opacity: 0.94;">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="badge badge-success">✅ Виконано</span>
          <span class="text-xs text-muted">ID: ${order.id}</span>
        </div>
        <h4 style="margin-bottom: 4px;">${order.title}</h4>
        <div class="text-muted text-xs mb-2">Клієнт: <strong>${order.clientName}</strong></div>

        <div class="p-2 mb-2 cyber-box text-xs border-success" style="background: rgba(16, 185, 129, 0.1);">
          <div class="text-success fw-bold">${closedLabel}</div>
          <div class="text-muted mt-1">Виплачено бустеру: <strong class="text-success">+$${payoutUSD} (${payoutUAH} ₴)</strong></div>
        </div>

        <div class="d-flex gap-2 mt-2">
          <button class="btn btn-outline btn-xs flex-grow-1" onclick="openLiveChat('${order.id}', '${order.title}')">
            💬 Чат
          </button>
          <button class="btn btn-dark btn-xs" onclick="openOrderTrackerModal('${order.id}')">
            📊 Трекер
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function claimBoosterOrder(orderId) {
  if (!currentUser || (currentUser.role !== 'booster' && currentUser.role !== 'admin')) {
    notify.show({
      title: 'Доступ обмежено',
      message: 'Лише акаунти бустерів можуть приймати замовлення в роботу.',
      type: 'warning'
    });
    return;
  }

  const targetOrder = (boosterAvailableOrders || []).find(o => o.id === orderId);
  const isCustom = targetOrder && (targetOrder.isCustomPrice || targetOrder.options?.isCustomPrice);

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
      notify.show({
        title: isCustom ? 'Ціну погоджено! 🤝' : 'Замовлення успішно прийнято! ⚡',
        message: isCustom
          ? `Ви погодилися на запропоновану ціну ${targetOrder?.price || ''} та взяли замовлення в роботу!`
          : 'Ви закріплені за замовленням. Перейдіть до "Замовлення в роботі" для старту.',
        type: 'success',
        sound: 'rankup'
      });
      await loadBoosterData();
      switchBoosterTab('my');
      if (typeof switchClientTab === 'function') {
        switchClientTab('booster-my');
      }
    } else {
      const data = await res.json();
      notify.show({ title: 'Помилка', message: data.error || 'Не вдалося прийняти замовлення', type: 'warning' });
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

function updateBoosterSliderDisplay(orderId, val, basePrice) {
  const numVal = parseInt(val, 10) || 0;
  const valEl = document.getElementById(`slider-val-${orderId}`);
  if (valEl) valEl.textContent = numVal + '%';

  const priceCalc = Math.max(1, Math.round(basePrice * (Math.max(1, numVal) / 100)));
  const priceCalcEl = document.getElementById(`slider-price-calc-${orderId}`);
  if (priceCalcEl) priceCalcEl.textContent = `Сума при закритті: $${priceCalc}`;

  const btnPct = document.getElementById(`btn-partial-pct-${orderId}`);
  if (btnPct) btnPct.textContent = numVal + '%';

  const btnPrice = document.getElementById(`btn-partial-price-${orderId}`);
  if (btnPrice) btnPrice.textContent = `$${priceCalc}`;
}

async function requestBoosterPartialClose(orderId) {
  const slider = document.getElementById(`booster-slider-${orderId}`);
  const pct = parseInt(slider?.value, 10) || 50;

  if (pct <= 0) {
    notify.show({ title: 'Помилка', message: 'Відсоток виконання має бути більше 0% для дострокового закриття!', type: 'warning' });
    return;
  }
  if (pct >= 100) {
    completeBoosterOrder(orderId);
    return;
  }

  const order = (boosterMyOrders || []).find(o => o.id === orderId);
  const basePrice = order ? (order.originalPrice || order.price) : 0;
  const calcPrice = Math.max(1, Math.round(basePrice * (pct / 100)));
  const calcPriceUAH = Math.round(calcPrice * 41.5);

  const confirmed = confirm(`Ви бажаєте запропонувати клієнту закрити буст на ${pct}% виконання за зменшеною ціною $${calcPrice} (${calcPriceUAH} ₴ замість $${basePrice})?`);
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/orders/${orderId}/partial-close-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        progressPercent: pct,
        note: `Бустер запропонував завершити буст на ${pct}% за $${calcPrice} (${calcPriceUAH} ₴)`
      })
    });

    if (res.ok) {
      const data = await res.json();
      notify.show({
        title: 'Запит надіслано клієнту! 📨',
        message: `Запропоновано закрити на ${pct}% за ціною $${calcPrice} (${calcPriceUAH} ₴). Очікуємо підтвердження клієнта.`,
        type: 'info'
      });
      if (socket && socket.connected) {
        socket.emit('order_progress_sync', data.order);
      }
      loadBoosterData();
    } else {
      const data = await res.json();
      notify.show({ title: 'Помилка', message: data.error || 'Не вдалося надіслати запит', type: 'warning' });
    }
  } catch (err) {
    console.error('Partial close request error:', err);
  }
}

function reloadDashboardOrders() {
  if (currentUser?.role === 'admin') loadAdminData();
  if (currentUser?.role === 'booster') loadBoosterData();
}

// ---------------- BOOSTER PROFILE & SETTINGS ----------------

let currentBoosterStatusSelect = 'ready';

function renderBoosterSettings() {
  if (!currentUser) return;

  const nameInput = document.getElementById('booster-settings-name');
  if (nameInput) nameInput.value = currentUser.name || '';

  const rankInput = document.getElementById('booster-settings-rank');
  if (rankInput) rankInput.value = currentUser.rankTitle || 'Radiant / Faceit 10 (3100 ELO)';

  const discordInput = document.getElementById('booster-settings-discord');
  if (discordInput) discordInput.value = currentUser.discord || '';

  const telegramInput = document.getElementById('booster-settings-telegram');
  if (telegramInput) telegramInput.value = currentUser.telegram || '';

  const avatarInput = document.getElementById('booster-settings-avatar-input');
  if (avatarInput) avatarInput.value = currentUser.avatar || '';

  const statusMsgInput = document.getElementById('booster-settings-status-msg');
  if (statusMsgInput) statusMsgInput.value = currentUser.statusMessage || '';

  renderBoosterStatusGrid();
}

function selectBoosterAvatar(url) {
  const avatarInput = document.getElementById('booster-settings-avatar-input');
  if (avatarInput) avatarInput.value = url;
}

function renderBoosterStatusGrid() {
  const container = document.getElementById('booster-settings-status-grid');
  if (!container || !currentUser) return;

  currentBoosterStatusSelect = currentUser.status || 'ready';

  const statuses = [
    { key: 'ready', icon: '🟢', label: 'Вільний (Готовий до бусту)' },
    { key: 'busy', icon: '🎮', label: 'На замовленні (У грі)' },
    { key: 'resting', icon: '☕', label: 'Відпочиває (AFK)' },
    { key: 'offline', icon: '⚪', label: 'Офлайн' }
  ];

  container.innerHTML = statuses.map(s => `
    <div class="status-opt-card ${currentBoosterStatusSelect === s.key ? 'active' : ''}" onclick="selectBoosterStatusOption('${s.key}')">
      <span>${s.icon}</span>
      <span>${s.label}</span>
    </div>
  `).join('');
}

function selectBoosterStatusOption(statusKey) {
  currentBoosterStatusSelect = statusKey;
  renderBoosterStatusGrid();
}

async function submitBoosterProfileUpdate(event) {
  if (event) event.preventDefault();

  const name = document.getElementById('booster-settings-name')?.value?.trim();
  const rankTitle = document.getElementById('booster-settings-rank')?.value?.trim();
  const discord = document.getElementById('booster-settings-discord')?.value?.trim();
  const telegram = document.getElementById('booster-settings-telegram')?.value?.trim();
  const avatar = document.getElementById('booster-settings-avatar-input')?.value?.trim();
  const statusMessage = document.getElementById('booster-settings-status-msg')?.value?.trim();

  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name,
        rankTitle,
        discord,
        telegram,
        avatar,
        status: currentBoosterStatusSelect,
        statusMessage
      })
    });

    const data = await res.json();
    if (res.ok && data.user) {
      currentUser = data.user;
      updateUserAuthUI();
      notify.show({
        title: 'Профіль бустера оновлено! 🎮',
        message: `Статус: ${getStatusDisplay('booster', currentUser.status).text}`,
        type: 'success',
        sound: 'success'
      });
      loadBoosterData();
    } else {
      notify.show({ title: 'Помилка', message: data.error || 'Не вдалося зберегти дані', type: 'warning' });
    }
  } catch (err) {
    console.error('Update booster profile error:', err);
  }
}

// Global window bindings for booster dashboard
window.openBoosterDashboard = openBoosterDashboard;
window.closeBoosterDashboard = closeBoosterDashboard;
window.switchBoosterTab = switchBoosterTab;
window.claimBoosterOrder = claimBoosterOrder;

async function declineBoosterOrder(orderId) {
  if (!currentUser || (currentUser.role !== 'booster' && currentUser.role !== 'admin')) {
    return;
  }

  const targetOrder = (boosterAvailableOrders || []).find(o => o.id === orderId);
  const conf = confirm(`Ви дійсно не згодні взятися за замовлення ${targetOrder?.title || orderId} за ціною ${targetOrder?.price || ''}?`);
  if (!conf) return;

  try {
    const res = await fetch(`/api/orders/${orderId}/decline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (res.ok) {
      notify.show({
        title: 'Пропозицію відхилено ❌',
        message: 'Ви відхилили ціну замовлення. Його приховано з вашого списку.',
        type: 'info'
      });
      await loadBoosterData();
    } else {
      const data = await res.json();
      notify.show({ title: 'Помилка', message: data.error || 'Не вдалося відхилити замовлення', type: 'warning' });
    }
  } catch (err) {
    console.error('Decline error:', err);
  }
}
window.declineBoosterOrder = declineBoosterOrder;

window.submitBoosterProgress = submitBoosterProgress;
window.completeBoosterOrder = completeBoosterOrder;
window.loadBoosterData = loadBoosterData;
window.selectBoosterAvatar = selectBoosterAvatar;
window.selectBoosterStatusOption = selectBoosterStatusOption;
window.submitBoosterProfileUpdate = submitBoosterProfileUpdate;
window.changeBoosterPeriod = changeBoosterPeriod;
window.adminUpdateBoosterVerification = adminUpdateBoosterVerification;


// ---------------- BOOSTER WALLET & EARNINGS BREAKDOWN ----------------

function renderBoosterWalletUI() {
  if (!currentUser || (currentUser.role !== 'booster' && currentUser.role !== 'admin')) return;

  const completedOrders = (boosterMyOrders || []).filter(o => o.status === 'completed');
  const inProgressOrders = (boosterMyOrders || []).filter(o => o.status !== 'completed');

  const earnedUSD = completedOrders.reduce((sum, o) => sum + Math.round((o.price || 0) * 0.8), 0);
  const earnedUAH = completedOrders.reduce((sum, o) => sum + Math.round((o.priceUAH || (o.price || 0) * 41.5) * 0.8), 0);

  const pendingUSD = inProgressOrders.reduce((sum, o) => sum + Math.round((o.price || 0) * 0.8), 0);
  const pendingUAH = inProgressOrders.reduce((sum, o) => sum + Math.round((o.priceUAH || (o.price || 0) * 41.5) * 0.8), 0);

  const totalEarnedUSD = earnedUSD + pendingUSD;
  const totalEarnedUAH = earnedUAH + pendingUAH;

  // 1. Update wallet badge in profile tab
  const walletBadge = document.getElementById('profile-booster-wallet-badge');
  if (walletBadge) {
    walletBadge.textContent = `$${earnedUSD}`;
  }

  // 2. Hide hero right-side badge in booster profile as requested
  const heroBadge = document.getElementById('profile-hero-right-badge');
  if (heroBadge) {
    heroBadge.style.display = 'none';
  }

  // 3. Update quick banner in Tab 1 (Settings)
  const quickBanner = document.getElementById('profile-booster-wallet-banner');
  if (quickBanner) {
    quickBanner.innerHTML = `
      <div class="cyber-box p-3" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(14, 18, 34, 0.9)); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: var(--radius-md);">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div class="d-flex align-items-center gap-3">
            <div style="font-size: 2rem; background: rgba(16, 185, 129, 0.2); border-radius: 50%; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
              💳
            </div>
            <div>
              <div class="text-xs text-muted">Гаманець бустера (Виплата 80%):</div>
              <div class="d-flex align-items-baseline gap-2">
                <span class="text-xl fw-bold text-success">$${earnedUSD}</span>
                <span class="text-sm text-muted">(${earnedUAH} ₴)</span>
                <span class="badge badge-success text-xs">Доступно</span>
              </div>
            </div>
          </div>

          <div class="d-flex align-items-center gap-3 flex-wrap">
            <div class="text-end">
              <div class="text-xs text-warning fw-bold">⏳ За бусти в роботі:</div>
              <div class="text-md fw-bold text-gold">+$${pendingUSD} <small class="text-xs text-muted">(${pendingUAH} ₴)</small></div>
              <div class="text-xs text-muted">ви отримаєте після виконання</div>
            </div>
            <button type="button" class="btn btn-success btn-sm" onclick="switchClientTab('booster-wallet')">
              💸 Деталі та виплата
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 4. Update full wallet container in Tab 6
  const walletContainer = document.getElementById('profile-booster-wallet-content');
  if (walletContainer) {
    walletContainer.innerHTML = `
      <div class="booster-wallet-view">
        <!-- 3 Balance Cards -->
        <div class="row g-3 mb-4" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
          <!-- Card 1: Available Balance -->
          <div class="cyber-card p-3" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(14, 18, 34, 0.9)); border: 1px solid rgba(16, 185, 129, 0.5);">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="text-xs text-muted">💰 Доступно до виплати:</span>
              <span class="badge badge-success text-xs">Готово до виводу</span>
            </div>
            <div class="d-flex align-items-baseline gap-2 my-2">
              <span class="text-2xl fw-bold text-success">$${earnedUSD}</span>
              <span class="text-sm text-muted">(${earnedUAH} ₴)</span>
            </div>
            <div class="text-xs text-muted">Зароблені кошти за завершені замовлення (${completedOrders.length} вик.)</div>
          </div>

          <!-- Card 2: Pending Payout ("за скільки він получить денгов") -->
          <div class="cyber-card p-3" style="background: linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(14, 18, 34, 0.9)); border: 1px solid rgba(234, 179, 8, 0.5);">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="text-xs text-warning fw-bold">⏳ За замовлення в роботі:</span>
              <span class="badge badge-warning text-xs">${inProgressOrders.length} активних</span>
            </div>
            <div class="d-flex align-items-baseline gap-2 my-2">
              <span class="text-2xl fw-bold text-gold">+$${pendingUSD}</span>
              <span class="text-sm text-muted">(${pendingUAH} ₴)</span>
            </div>
            <div class="text-xs text-warning">Ви отримаєте ці кошти одразу після виконання поточних бустів</div>
          </div>

          <!-- Card 3: Total Earnings & Rate -->
          <div class="cyber-card p-3" style="background: linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(14, 18, 34, 0.9)); border: 1px solid rgba(0, 240, 255, 0.35);">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="text-xs text-muted">⚡ Загальний оборот:</span>
              <span class="badge badge-info text-xs">Ставка: 80%</span>
            </div>
            <div class="d-flex align-items-baseline gap-2 my-2">
              <span class="text-2xl fw-bold text-cyan">$${totalEarnedUSD}</span>
              <span class="text-sm text-muted">(${totalEarnedUAH} ₴)</span>
            </div>
            <div class="text-xs text-muted">Всього зароблено та очікується в роботі</div>
          </div>
        </div>

        <!-- Breakdown per Active Order -->
        <div class="cyber-box p-3 mb-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4 class="text-cyan mb-1" style="font-size: 1.1rem; margin: 0;">🎮 За скільки грошей ви отримаєте за активні замовлення</h4>
              <div class="text-xs text-muted">Детальний розрахунок вашої виплати (80%) за кожне прийняте замовлення:</div>
            </div>
            <span class="badge badge-gold">${inProgressOrders.length} у роботі</span>
          </div>

          ${inProgressOrders.length === 0 ? `
            <div class="p-4 text-center text-muted text-xs">
              <div style="font-size: 1.8rem; margin-bottom: 6px;">⏳</div>
              У вас наразі немає активних замовлень у процесі виконання.<br />
              Перейдіть у вкладку <strong>«⚡ Буст замовлення»</strong> та прийміть вільне замовлення в роботу!
            </div>
          ` : `
            <div class="d-flex flex-column gap-2">
              ${inProgressOrders.map(order => {
                const payoutUSD = Math.round((order.price || 0) * 0.8);
                const payoutUAH = Math.round((order.priceUAH || (order.price || 0) * 41.5) * 0.8);
                return `
                  <div class="p-3 cyber-card d-flex justify-content-between align-items-center flex-wrap gap-2" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(0, 240, 255, 0.25); border-radius: var(--radius-sm);">
                    <div>
                      <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span class="badge badge-info text-xs">${order.gameName}</span>
                        <strong style="font-size: 0.95rem;">${order.title}</strong>
                        <span class="text-xs text-muted">ID: ${order.id}</span>
                      </div>
                      <div class="text-xs text-muted">
                        Клієнт: <strong>${order.clientName}</strong> | Прогрес: <strong class="text-gold">${order.progressPercent || 0}%</strong> (${order.progressRank || order.currentRank})
                        ${(order.isCustomPrice || order.options?.isCustomPrice) ? '<span class="custom-price-badge-tag ml-1">💰 Ціна клієнта</span>' : ''}
                      </div>
                    </div>

                    <div class="text-end">
                      <span class="text-xs text-muted">Ваша чиста виплата (80%):</span>
                      <div class="text-lg fw-bold text-success">
                        +$${payoutUSD} <small class="text-muted" style="font-size: 0.85rem;">(${payoutUAH} ₴)</small>
                      </div>
                      <span class="text-xs text-dim">Ціна клієнта: $${order.price}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- Withdrawal Form -->
        <div class="cyber-box p-3">
          <h4 class="text-cyan mb-2" style="font-size: 1.1rem; margin: 0;">💸 Замовити виведення зароблених коштів</h4>
          <div class="text-xs text-muted mb-3">Виплати на картки українських банків (Monobank, PrivatBank) та USDT зараховуються протягом 5-15 хвилин.</div>

          <form onsubmit="handleBoosterPayoutRequest(event)">
            <div class="row-2-col mb-3">
              <div>
                <label class="form-label text-xs">Спосіб виплати:</label>
                <select id="payout-method" class="form-control text-xs">
                  <option value="card_ua">💳 Банківська картка UA (Monobank / PrivatBank / Visa / MC)</option>
                  <option value="usdt">💎 USDT (TRC-20 / BEP-20)</option>
                  <option value="iban">🏦 IBAN рахунок (UAH)</option>
                </select>
              </div>
              <div>
                <label class="form-label text-xs">Реквізити (Номер картки або USDT гаманець):</label>
                <input type="text" id="payout-address" class="form-control text-xs" placeholder="4149 4991 .... або T..." required />
              </div>
            </div>

            <div class="row-2-col mb-3">
              <div>
                <label class="form-label text-xs">Сума для виведення ($ USD):</label>
                <div class="d-flex align-items-center gap-2">
                  <input type="number" id="payout-amount-usd" class="form-control text-xs fw-bold text-success" min="5" max="${Math.max(earnedUSD, 5)}" value="${earnedUSD > 0 ? earnedUSD : 0}" required />
                  <button type="button" class="btn btn-outline-cyan btn-xs" onclick="document.getElementById('payout-amount-usd').value = ${earnedUSD};">Вся сума</button>
                </div>
              </div>
              <div class="d-flex align-items-end">
                <button type="submit" class="btn btn-success btn-sm w-100" ${earnedUSD <= 0 ? 'disabled' : ''}>
                  🚀 Підтвердити виплату $${earnedUSD > 0 ? earnedUSD : 0}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
  }
}

function handleBoosterPayoutRequest(event) {
  if (event) event.preventDefault();
  const address = document.getElementById('payout-address')?.value?.trim();
  const amount = parseFloat(document.getElementById('payout-amount-usd')?.value);

  if (!address) {
    notify.show({ title: 'Помилка', message: 'Вкажіть реквізити картки чи гаманця!', type: 'warning' });
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    notify.show({ title: 'Помилка', message: 'Вкажіть коректну суму для виведення!', type: 'warning' });
    return;
  }

  notify.show({
    title: 'Запит на виплату створено! 💸',
    message: `Суму $${amount} (${Math.round(amount * 41.5)} ₴) відправлено на ${address.slice(0, 6)}... Зарахування протягом 5-15 хвилин.`,
    type: 'success',
    sound: 'rankup'
  });
}

window.renderBoosterWalletUI = renderBoosterWalletUI;
window.handleBoosterPayoutRequest = handleBoosterPayoutRequest;
window.updateBoosterSliderDisplay = updateBoosterSliderDisplay;
window.requestBoosterPartialClose = requestBoosterPartialClose;
window.renderCompletedBoosterCards = renderCompletedBoosterCards;
window.renderBoosterMyOrders = renderBoosterMyOrders;

// ---------------- CLIENT WALLET UI & TOP-UP ----------------

async function renderClientWalletUI() {
  if (!currentUser) return;

  // Refresh user wallet data from server if logged in
  if (authToken) {
    try {
      const res = await fetch('/api/auth/wallet', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        currentUser.balance = data.balance;
        currentUser.transactions = data.transactions;
      }
    } catch (e) {}
  }

  const balanceUSD = Number(currentUser.balance || 0);
  const balanceUAH = Math.round(balanceUSD * 41.5);
  const transactions = Array.isArray(currentUser.transactions) ? currentUser.transactions : [];

  // 1. Update Badge in Profile Nav Tabs
  const walletBadge = document.getElementById('profile-client-wallet-badge');
  if (walletBadge) {
    walletBadge.textContent = `$${balanceUSD}`;
  }

  // 2. Update Navbar balance pill
  const navBalance = document.getElementById('nav-client-balance');
  if (navBalance) {
    navBalance.textContent = `$${balanceUSD}`;
  }

  // 3. Update Quick Banner in Tab 1 (Settings)
  const quickBanner = document.getElementById('profile-client-wallet-banner');
  if (quickBanner) {
    quickBanner.innerHTML = `
      <div class="cyber-box p-3" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(14, 18, 34, 0.9)); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: var(--radius-md);">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div class="d-flex align-items-center gap-3">
            <div style="font-size: 2rem; background: rgba(16, 185, 129, 0.2); border-radius: 50%; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
              💳
            </div>
            <div>
              <div class="text-xs text-muted">Особистий баланс клієнта CyberBoost:</div>
              <div class="d-flex align-items-baseline gap-2">
                <span class="text-xl fw-bold text-success">$${balanceUSD}</span>
                <span class="text-sm text-muted">(${balanceUAH} ₴)</span>
                <span class="badge badge-success text-xs">Доступно для покупок</span>
              </div>
            </div>
          </div>

          <div class="d-flex align-items-center gap-2">
            <button type="button" class="btn btn-success btn-sm" onclick="switchClientTab('client-wallet')">
              ⚡ Швидке поповнення
            </button>
            <button type="button" class="btn btn-outline-cyan btn-sm" onclick="switchClientTab('orders')">
              📦 Мої замовлення
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 4. Update full wallet container in Tab 7
  const walletContainer = document.getElementById('profile-client-wallet-content');
  if (walletContainer) {
    const txRows = transactions.length > 0 ? transactions.map(tx => {
      const isPositive = Number(tx.amount) >= 0;
      const typeBadge = tx.type === 'topup' 
        ? '<span class="badge badge-success text-xs">Поповнення</span>'
        : (tx.type === 'payment' ? '<span class="badge badge-warning text-xs">Оплата бусту</span>' : '<span class="badge badge-info text-xs">Операція</span>');
      const dateStr = tx.date ? new Date(tx.date).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' }) : 'Нещодавно';
      return `
        <tr>
          <td class="text-xs text-muted">${dateStr}</td>
          <td>${typeBadge}</td>
          <td class="text-xs text-dim">${tx.description || '-'}</td>
          <td class="fw-bold ${isPositive ? 'text-success' : 'text-danger'}">${isPositive ? '+' : ''}$${Math.abs(tx.amount)}</td>
          <td class="text-xs text-muted">$${tx.balanceAfter !== undefined ? tx.balanceAfter : balanceUSD}</td>
        </tr>
      `;
    }).join('') : `
      <tr>
        <td colspan="5" class="text-center text-muted p-4">Історія транзакцій порожня. Поповніть баланс, щоб оплачувати замовлення в 1 клік!</td>
      </tr>
    `;

    walletContainer.innerHTML = `
      <div class="client-wallet-view">
        <!-- Virtual Cyber Card & Quick Stats Grid -->
        <div class="row g-3 mb-4" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          <!-- Card 1: Virtual Card -->
          <div class="client-virtual-card p-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="virtual-card-chip">💳 CHIP</span>
              <span class="virtual-card-brand text-gold fw-bold">CyberBoost Pay</span>
            </div>
            <div class="text-xs text-muted mb-1">Поточний баланс клієнта:</div>
            <div class="d-flex align-items-baseline gap-2 mb-3">
              <span class="text-3xl fw-bold text-white">$${balanceUSD}</span>
              <span class="text-md text-cyan">(${balanceUAH} ₴)</span>
            </div>
            <div class="d-flex justify-content-between align-items-center text-xs text-muted">
              <span>ВЛАСНИК: <strong class="text-white">${currentUser.name}</strong></span>
              <span>СТАТУС: <span class="text-success fw-bold">АКТИВНИЙ</span></span>
            </div>
          </div>

          <!-- Card 2: Quick Top-Up Form -->
          <div class="cyber-card p-4" style="background: rgba(14, 18, 34, 0.85); border: 1px solid rgba(0, 240, 255, 0.25);">
            <h5 class="text-cyan mb-2" style="font-size: 1.05rem;">⚡ Швидке поповнення гаманця</h5>
            <p class="text-xs text-muted mb-3">Оберіть суму та платіжну систему для миттєвого зарахування коштів:</p>

            <!-- Preset amount pills -->
            <div class="d-flex gap-2 flex-wrap mb-3">
              <button type="button" class="btn btn-outline-cyan btn-xs" onclick="setTopupAmount(10)">+$10 (415 ₴)</button>
              <button type="button" class="btn btn-outline-cyan btn-xs" onclick="setTopupAmount(25)">+$25 (1,038 ₴)</button>
              <button type="button" class="btn btn-outline-cyan btn-xs" onclick="setTopupAmount(50)">+$50 (2,075 ₴)</button>
              <button type="button" class="btn btn-outline-cyan btn-xs" onclick="setTopupAmount(100)">+$100 (4,150 ₴)</button>
              <button type="button" class="btn btn-outline-cyan btn-xs" onclick="setTopupAmount(200)">+$200 (8,300 ₴)</button>
            </div>

            <form onsubmit="handleClientTopupSubmit(event)">
              <div class="mb-3">
                <label class="form-label text-xs">Сума поповнення ($ USD):</label>
                <div class="d-flex align-items-center gap-2">
                  <span class="text-gold fw-bold">$</span>
                  <input type="number" id="client-topup-amount" class="form-control text-sm fw-bold text-success" min="1" max="10000" value="50" oninput="updateTopupUAHDisplay(this.value)" required />
                  <span id="client-topup-uah-preview" class="text-xs text-muted" style="white-space: nowrap;">(2,075 ₴)</span>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label text-xs">Спосіб оплати:</label>
                <select id="client-topup-method" class="form-select text-xs">
                  <option value="Visa / Mastercard">💳 Банківська картка (Visa / Mastercard)</option>
                  <option value="Monobank / Приват24">📱 Monobank / Приват24</option>
                  <option value="Apple Pay / Google Pay">🍏 Apple Pay / Google Pay</option>
                  <option value="USDT TRC20 / Crypto">💎 Криптовалюта (USDT TRC20 / TON / BTC)</option>
                </select>
              </div>

              <button type="submit" id="client-topup-btn" class="btn btn-success btn-sm w-100" style="font-weight: 700;">
                💳 Поповнити гаманець
              </button>
            </form>
          </div>
        </div>

        <!-- Transactions History -->
        <div class="cyber-box p-3">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="text-cyan mb-0" style="font-size: 1rem;">📜 Історія операцій гаманця</h5>
            <span class="text-xs text-muted">Всього операцій: ${transactions.length}</span>
          </div>

          <div style="overflow-x: auto;">
            <table class="cyber-table text-xs">
              <thead>
                <tr>
                  <th>Дата та час</th>
                  <th>Тип</th>
                  <th>Опис операції</th>
                  <th>Сума</th>
                  <th>Баланс після</th>
                </tr>
              </thead>
              <tbody>
                ${txRows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
}

function setTopupAmount(amount) {
  const input = document.getElementById('client-topup-amount');
  if (input) {
    input.value = amount;
    updateTopupUAHDisplay(amount);
  }
}

function updateTopupUAHDisplay(val) {
  const preview = document.getElementById('client-topup-uah-preview');
  if (preview) {
    const num = Number(val) || 0;
    preview.textContent = `(${Math.round(num * 41.5)} ₴)`;
  }
}

async function handleClientTopupSubmit(event) {
  if (event) event.preventDefault();
  const amount = parseFloat(document.getElementById('client-topup-amount')?.value);
  const method = document.getElementById('client-topup-method')?.value || 'Банківська картка';

  if (isNaN(amount) || amount <= 0) {
    if (typeof notify !== 'undefined') notify.show({ title: 'Помилка', message: 'Вкажіть коректну суму поповнення (від $1)!', type: 'warning' });
    return;
  }

  const btn = document.getElementById('client-topup-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Обробка платежу...';
  }

  try {
    const res = await fetch('/api/auth/wallet/topup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ amount, method })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Помилка поповнення');

    currentUser.balance = data.balance;
    currentUser.transactions = data.transactions;

    if (typeof notify !== 'undefined') {
      notify.show({
        title: 'Баланс поповнено! 💳',
        message: `Успішно зараховано +$${amount} (${Math.round(amount * 41.5)} ₴) через ${method}. Поточний баланс: $${data.balance}`,
        type: 'success',
        sound: 'rankup'
      });
    }

    renderClientWalletUI();
    if (typeof updateUserAuthUI === 'function') updateUserAuthUI();
  } catch (err) {
    if (typeof notify !== 'undefined') notify.show({ title: 'Помилка', message: err.message, type: 'error' });
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '💳 Поповнити гаманець';
    }
  }
}

// ---------------- ADMIN BOOSTER APPLICATIONS ----------------

function renderAdminBoosterApplications() {
  const container = document.getElementById('admin-applications-list');
  if (!container) return;

  if (adminBoosterApplications.length === 0) {
    container.innerHTML = `
      <div class="cyber-box p-4 text-center text-muted">
        Немає нових заявок на бустера. Коли кандидат заповнить анкету, вона з'явиться тут.
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      ${adminBoosterApplications.map(app => {
        const isPending = app.status === 'pending';
        const isApproved = app.status === 'approved';
        const statusBadge = isPending 
          ? '<span class="badge badge-warning">⏳ Очікує розгляду</span>'
          : (isApproved ? '<span class="badge badge-success">✅ Схвалено (Бустер)</span>' : '<span class="badge badge-danger">❌ Відхилено</span>');
        const createdDate = app.createdAt ? new Date(app.createdAt).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' }) : 'Нещодавно';

        return `
          <div class="cyber-card p-3" style="border-left: 4px solid ${isPending ? '#f59e0b' : (isApproved ? '#10b981' : '#ef4444')}; background: rgba(14, 18, 34, 0.85);">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
              <div class="d-flex align-items-center gap-2">
                <span style="font-size: 1.3rem;">🎮</span>
                <span class="text-md fw-bold text-white">${app.name}</span>
                ${statusBadge}
              </div>
              <div class="text-xs text-muted">Подано: ${createdDate}</div>
            </div>

            <div class="row g-2 mb-3" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
              <div class="cyber-box p-2">
                <div class="text-xs text-muted">📱 Контакт (Discord/TG):</div>
                <div class="text-sm fw-bold text-gold">${app.contact}</div>
              </div>
              <div class="cyber-box p-2">
                <div class="text-xs text-muted">🎯 Основна гра & Ранг:</div>
                <div class="text-sm fw-bold text-cyan">${app.game} • <span class="text-white">${app.rank}</span></div>
              </div>
              <div class="cyber-box p-2">
                <div class="text-xs text-muted">🌐 Steam профіль:</div>
                <a href="${app.steamUrl}" target="_blank" rel="noopener noreferrer" class="text-xs text-info text-truncate d-block" style="max-width: 260px;" title="${app.steamUrl}">
                  🔗 Відкрити Steam профіль ↗
                </a>
              </div>
            </div>

            ${app.note ? `
              <div class="cyber-box p-2 mb-3" style="background: rgba(255,255,255,0.03);">
                <div class="text-xs text-muted mb-1">📝 Tracker.gg / Досвід бустингу:</div>
                <div class="text-xs text-white" style="white-space: pre-line;">${app.note}</div>
              </div>
            ` : ''}

            ${isPending ? `
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-outline-danger btn-sm" onclick="reviewBoosterApplication('${app.id}', 'rejected')">
                  ❌ Відхилити
                </button>
                <button type="button" class="btn btn-success btn-sm" onclick="reviewBoosterApplication('${app.id}', 'approved')">
                  ✅ Схвалити та призначити бустером
                </button>
              </div>
            ` : (app.reviewedBy ? `<div class="text-xs text-muted text-end">Перевірив: ${app.reviewedBy} (${app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString('uk-UA') : ''})</div>` : '')}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

async function reviewBoosterApplication(id, status) {
  try {
    const res = await fetch(`/api/auth/booster-applications/${id}/review`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Помилка оновлення');

    if (typeof notify !== 'undefined') {
      notify.show({
        title: status === 'approved' ? 'Заявку схвалено! ✅' : 'Заявку відхилено ❌',
        message: data.message,
        type: status === 'approved' ? 'success' : 'info'
      });
    }

    loadAdminData();
  } catch (err) {
    if (typeof notify !== 'undefined') notify.show({ title: 'Помилка', message: err.message, type: 'error' });
  }
}

window.renderClientWalletUI = renderClientWalletUI;
window.setTopupAmount = setTopupAmount;
window.updateTopupUAHDisplay = updateTopupUAHDisplay;
window.handleClientTopupSubmit = handleClientTopupSubmit;
window.renderAdminBoosterApplications = renderAdminBoosterApplications;
window.reviewBoosterApplication = reviewBoosterApplication;
