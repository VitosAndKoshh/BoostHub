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

    // Update badge counts in tabs
    const availCountEl = document.getElementById('booster-tab-avail-count');
    if (availCountEl) {
      availCountEl.textContent = boosterAvailableOrders.length;
      availCountEl.style.display = boosterAvailableOrders.length > 0 ? 'inline-block' : 'none';
    }

    const myCountEl = document.getElementById('booster-tab-my-count');
    if (myCountEl) {
      myCountEl.textContent = boosterMyOrders.length;
      myCountEl.style.display = boosterMyOrders.length > 0 ? 'inline-block' : 'none';
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
      profileMyCountEl.textContent = boosterMyOrders.length;
    }

    renderBoosterStats();
    renderBoosterAvailableOrders();
    renderBoosterMyOrders();
    renderBoosterSettings();
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

        <div class="p-2 cyber-box mb-3 d-flex justify-content-between align-items-center">
          <div>
            <span class="text-xs text-muted">Вартість замовлення:</span>
            <div class="text-sm fw-bold">$${order.price} (${order.priceUAH || Math.round(order.price * 41.5)} ₴)</div>
          </div>
          <div class="text-end">
            <span class="text-xs text-success fw-bold">💰 Ваша виплата (80%):</span>
            <div class="text-lg text-success fw-bold">+$${payoutUSD} (${payoutUAH} ₴)</div>
          </div>
        </div>

        <div class="d-flex gap-2">
          <button class="btn ${isVerified ? 'btn-primary' : 'btn-outline'} btn-sm flex-grow-1" onclick="claimBoosterOrder('${order.id}')" ${!isVerified ? 'style="opacity: 0.6;" title="Потрібна верифікація акаунту"' : ''}>
            ${isVerified ? '⚡ Прийняти замовлення' : '🔒 Потрібна верифікація'}
          </button>
          <button class="btn btn-outline btn-sm" onclick="openLiveChat('${order.id}', '${order.title}')">
            💬 Чат
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (container) container.innerHTML = ordersHtml;
  if (profileContainer) profileContainer.innerHTML = ordersHtml;
}

function renderBoosterMyOrders() {
  const container = document.getElementById('booster-my-list');
  const profileContainer = document.getElementById('profile-booster-my-list');
  if (!container && !profileContainer) return;

  if (boosterMyOrders.length === 0) {
    const emptyHtml = `<div class="empty-state p-4 text-center" style="grid-column: 1 / -1;"><p>У вас немає активних замовлень у роботі. Оберіть замовлення у вкладці "⚡ Прийняти замовлення"!</p></div>`;
    if (container) container.innerHTML = emptyHtml;
    if (profileContainer) profileContainer.innerHTML = emptyHtml;
    return;
  }

  const myOrdersHtml = boosterMyOrders.map(order => `
    <div class="booster-order-card cyber-card ${order.status === 'completed' ? 'border-success' : 'border-cyan'}">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="badge ${order.status === 'completed' ? 'badge-success' : 'badge-info'}">
          ${order.status === 'completed' ? '✅ Виконано' : '⚡ В процесі'}
        </span>
        <span class="fw-bold text-success">$${order.price} (${order.priceUAH || Math.round(order.price * 41.5)} ₴)</span>
      </div>
      <h4>${order.title}</h4>
      <div class="text-muted text-xs mb-2">Клієнт: <strong>${order.clientName}</strong> (${order.accountCredentials?.login || 'Login'})</div>

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

  if (container) container.innerHTML = myOrdersHtml;
  if (profileContainer) profileContainer.innerHTML = myOrdersHtml;
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
        title: 'Замовлення успішно прийнято! ⚡',
        message: 'Ви закріплені за замовленням. Перейдіть до "Мої замовлення" для старту.',
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
window.submitBoosterProgress = submitBoosterProgress;
window.completeBoosterOrder = completeBoosterOrder;
window.loadBoosterData = loadBoosterData;
window.selectBoosterAvatar = selectBoosterAvatar;
window.selectBoosterStatusOption = selectBoosterStatusOption;
window.submitBoosterProfileUpdate = submitBoosterProfileUpdate;
window.changeBoosterPeriod = changeBoosterPeriod;
window.adminUpdateBoosterVerification = adminUpdateBoosterVerification;
