// Interactive Rank Boost Calculator (Matching GoRanked UI for Valorant, Dota 2, and CS2 Faceit)

let currentCalculatorState = {
  gameId: 'dota2', // Start with Dota 2 or Valorant
  currentRankId: 'archon_2',
  targetRankId: 'legend_1',
  currentElo: 2550,
  targetElo: 3150,
  options: {
    queueType: 'solo',
    stream: false,
    priority: false,
    offlineMode: true,
    specificAgents: 'Any'
  },
  priceUSD: 24,
  priceUAH: 990,
  estimatedHours: '3 - 5 год.'
};

let cachedGames = [];

// Initialize Calculator
async function initCalculator() {
  try {
    const res = await fetch('/api/catalog/games');
    const data = await res.json();
    cachedGames = data.games || [];
    renderGameTabs();
    // Default to Dota 2 or Valorant as requested
    loadGameCalculator('dota2');
  } catch (err) {
    console.error('Failed to load games:', err);
  }
}

// Render game tabs
function renderGameTabs() {
  const container = document.getElementById('calc-game-tabs');
  if (!container) return;

  container.innerHTML = cachedGames.map(game => `
    <button class="calc-tab-btn ${game.id === currentCalculatorState.gameId ? 'active' : ''}" onclick="switchCalcGame('${game.id}')">
      <span class="tab-icon">${game.icon}</span>
      <span class="tab-name">${game.name}</span>
      <span class="tab-tag">${game.tag}</span>
    </button>
  `).join('');
}

// Switch game
function switchCalcGame(gameId) {
  currentCalculatorState.gameId = gameId;
  const game = cachedGames.find(g => g.id === gameId);
  if (!game) return;

  if (game.id === 'dota2') {
    currentCalculatorState.currentRankId = 'archon_2';
    currentCalculatorState.targetRankId = 'legend_1';
    currentCalculatorState.currentElo = 2550;
    currentCalculatorState.targetElo = 3150;
  } else if (game.id === 'valorant') {
    currentCalculatorState.currentRankId = 'bronze_1';
    currentCalculatorState.targetRankId = 'silver_2';
    currentCalculatorState.currentElo = 350;
    currentCalculatorState.targetElo = 750;
  } else if (game.id === 'cs2_faceit') {
    currentCalculatorState.currentRankId = 'lvl_5';
    currentCalculatorState.targetRankId = 'lvl_7';
    currentCalculatorState.currentElo = 1055;
    currentCalculatorState.targetElo = 1375;
  } else {
    currentCalculatorState.currentRankId = game.ranks[0].id;
    currentCalculatorState.targetRankId = game.ranks[Math.min(3, game.ranks.length - 1)].id;
    currentCalculatorState.currentElo = game.ranks[0].defaultElo || 0;
    currentCalculatorState.targetElo = game.ranks[Math.min(3, game.ranks.length - 1)].defaultElo || 1000;
  }

  renderGameTabs();
  loadGameCalculator(gameId);
}

// ---------------- SVG BADGE GENERATOR FOR ALL GAMES ----------------

function generateRankSVG(rank, isLarge = false, gameId = 'dota2') {
  const size = isLarge ? 48 : 38;
  const color = rank.color || '#fbbf24';

  // 1. VALORANT BADGES (Photo 2)
  if (gameId === 'valorant') {
    const subRoman = rank.sub || 'I';
    const tier = rank.tier || 'bronze';

    if (tier === 'radiant') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 44 44" class="rank-vector-svg">
          <polygon points="22,3 38,16 32,38 12,38 6,16" fill="url(#grad-radiant)" stroke="#fff" stroke-width="1.5" />
          <polygon points="22,8 34,18 29,34 15,34 10,18" fill="#ffe066" opacity="0.9" />
          <polygon points="22,12 28,22 22,27 16,22" fill="#ffffff" />
          <defs>
            <linearGradient id="grad-radiant" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fff" />
              <stop offset="50%" stop-color="#fbbf24" />
              <stop offset="100%" stop-color="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>
      `;
    }

    // Faceted Valorant polygon with roman numeral sub-badge
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 44 44" class="rank-vector-svg">
        <!-- Main Polygon Shield -->
        <polygon points="22,4 37,14 37,30 22,40 7,30 7,14" fill="${color}" fill-opacity="0.25" stroke="${color}" stroke-width="2" />
        <!-- Inner Facet -->
        <polygon points="22,9 33,17 33,28 22,35 11,28 11,17" fill="${color}" fill-opacity="0.85" stroke="#ffffff" stroke-width="0.75" />
        <!-- Inner Core Diamond -->
        <polygon points="22,14 28,22 22,30 16,22" fill="#ffffff" fill-opacity="0.9" />
        <!-- Sub-tier Roman Indicator pill -->
        <circle cx="22" cy="38" r="5.5" fill="#0f1423" stroke="${color}" stroke-width="1.2" />
        <text x="22" y="40.5" text-anchor="middle" fill="#ffffff" font-size="7.5" font-family="Outfit, sans-serif" font-weight="800">${subRoman}</text>
      </svg>
    `;
  }

  // 2. DOTA 2 MEDALS (Photo 1)
  if (gameId === 'dota2') {
    const starsCount = rank.stars || 1;
    const tier = rank.tier || 'archon';

    // Medals background shapes by tier
    let tierShape = '';
    if (tier === 'herald') {
      tierShape = `<polygon points="22,6 36,16 30,34 14,34 8,16" fill="#84cc16" stroke="#4d7c0f" stroke-width="1.5" />`;
    } else if (tier === 'guardian') {
      tierShape = `<circle cx="22" cy="20" r="14" fill="#94a3b8" stroke="#475569" stroke-width="2" />`;
    } else if (tier === 'crusader') {
      tierShape = `<polygon points="22,4 36,12 36,28 22,36 8,28 8,12" fill="#b45309" stroke="#78350f" stroke-width="1.5" />`;
    } else if (tier === 'archon') {
      tierShape = `
        <polygon points="22,4 38,14 34,32 22,38 10,32 6,14" fill="#38bdf8" stroke="#0284c7" stroke-width="1.8" />
        <circle cx="22" cy="20" r="8" fill="#0369a1" />
      `;
    } else if (tier === 'legend') {
      tierShape = `
        <polygon points="22,2 38,10 38,26 22,40 6,26 6,10" fill="#fbbf24" stroke="#b45309" stroke-width="1.8" />
        <polygon points="22,8 32,16 22,32 12,16" fill="#f59e0b" />
      `;
    } else if (tier === 'ancient') {
      tierShape = `
        <polygon points="22,2 40,14 34,34 22,40 10,34 4,14" fill="#c084fc" stroke="#7e22ce" stroke-width="2" />
        <polygon points="22,8 32,18 22,30 12,18" fill="#a855f7" />
      `;
    } else if (tier === 'divine') {
      tierShape = `
        <polygon points="22,2 40,12 36,32 22,42 8,32 4,12" fill="#f59e0b" stroke="#fff" stroke-width="1.5" />
        <polygon points="22,6 34,16 22,34 10,16" fill="#fbbf24" />
        <circle cx="22" cy="18" r="6" fill="#fff" />
      `;
    } else { // immortal
      tierShape = `
        <polygon points="22,2 42,12 38,36 22,44 6,36 2,12" fill="#ef4444" stroke="#ffd700" stroke-width="2" />
        <polygon points="22,6 34,16 22,36 10,16" fill="#ffd700" />
      `;
    }

    // Stars rendered at the top of the medal
    let starsHtml = '';
    const starSpacing = 4.8;
    const startX = 22 - ((starsCount - 1) * starSpacing) / 2;
    for (let i = 0; i < starsCount; i++) {
      const sx = startX + i * starSpacing;
      starsHtml += `<polygon points="${sx},2.5 ${sx + 1.2},5 ${sx + 3},5.3 ${sx + 1.8},6.5 ${sx + 2.2},8.5 ${sx},7.2 ${sx - 2.2},8.5 ${sx - 1.8},6.5 ${sx - 3},5.3 ${sx - 1.2},5" fill="#ffd700" stroke="#000" stroke-width="0.4" />`;
    }

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 44 44" class="dota-medal-svg">
        ${tierShape}
        ${starsHtml}
      </svg>
    `;
  }

  // 3. CS2 FACEIT RINGS (Photo from previous message)
  if (gameId === 'cs2_faceit') {
    const strokeWidth = isLarge ? 4 : 3.5;
    const radius = (size - strokeWidth * 2) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeColor = rank.color || '#eab308';
    const strokePercent = rank.strokePercent !== undefined ? rank.strokePercent : 100;
    const strokeDashoffset = circumference - (strokePercent / 100) * circumference;

    if (rank.id === 'lvl_1') {
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="faceit-badge-svg">
          <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="${strokeWidth}" />
          <circle cx="${center}" cy="${center - radius}" r="${strokeWidth + 0.5}" fill="#ffffff" />
          <text x="${center}" y="${center + 4.5}" text-anchor="middle" fill="#ffffff" font-size="${isLarge ? 15 : 13}" font-family="Outfit, sans-serif" font-weight="700">1</text>
        </svg>
      `;
    }

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="faceit-badge-svg">
        <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="${strokeWidth}" />
        <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"
          stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}"
          stroke-linecap="round" transform="rotate(-90 ${center} ${center})" />
        <text x="${center}" y="${center + (isLarge ? 5 : 4.5)}" text-anchor="middle" fill="${strokeColor}" font-size="${isLarge ? 15 : 13}" font-family="Outfit, sans-serif" font-weight="800">${rank.value}</text>
      </svg>
    `;
  }

  // Fallback Emoji Icon
  return `<span style="font-size: ${isLarge ? '1.8rem' : '1.3rem'}">${rank.icon || '⭐'}</span>`;
}

// ---------------- LOAD CALCULATOR CARDS ----------------

function loadGameCalculator(gameId) {
  const game = cachedGames.find(g => g.id === gameId);
  if (!game) return;

  renderRankCards(game);
  renderAgentPicker(game);
  recalculateBoostPrice();
}

function renderRankCards(game) {
  const leftCard = document.getElementById('calc-start-card');
  const rightCard = document.getElementById('calc-target-card');
  if (!leftCard || !rightCard) return;

  const curRank = game.ranks.find(r => r.id === currentCalculatorState.currentRankId) || game.ranks[0];
  const tarRank = game.ranks.find(r => r.id === currentCalculatorState.targetRankId) || game.ranks[game.ranks.length - 1];

  // Grid column count based on game
  let gridColsClass = 'grid-cols-6';
  if (game.id === 'cs2_faceit') gridColsClass = 'grid-cols-6';
  if (game.id === 'valorant') gridColsClass = 'grid-cols-6';
  if (game.id === 'dota2') gridColsClass = 'grid-cols-6';

  // Render Left Card (Початковий Ранг)
  leftCard.innerHTML = `
    <div class="faceit-card-header">
      <div class="d-flex align-items-center gap-3">
        <div class="faceit-header-icon">${generateRankSVG(curRank, true, game.id)}</div>
        <div>
          <div class="faceit-header-subtitle">Початковий Ранг</div>
          <div class="faceit-header-title">${curRank.name}</div>
        </div>
      </div>
      <div class="faceit-chevron-up">^</div>
    </div>

    <div class="faceit-ranks-grid ${gridColsClass}">
      ${game.ranks.map(r => `
        <button type="button" class="faceit-rank-btn ${r.id === currentCalculatorState.currentRankId ? 'active' : ''}"
          onclick="selectCurrentRank('${r.id}')" title="${r.name}">
          ${generateRankSVG(r, false, game.id)}
        </button>
      `).join('')}
    </div>

    <div class="faceit-elo-control-bar">
      <button type="button" class="elo-step-btn" onclick="stepCurrentElo(-1)">−</button>
      <div class="elo-value-display">
        <input type="number" id="input-current-elo" class="elo-input" value="${currentCalculatorState.currentElo}"
          onchange="onCurrentEloInputChange(this.value)" />
      </div>
      <button type="button" class="elo-step-btn" onclick="stepCurrentElo(1)">+</button>
    </div>
  `;

  // Render Right Card (Кінцевий Ранг)
  rightCard.innerHTML = `
    <div class="faceit-card-header">
      <div class="d-flex align-items-center gap-3">
        <div class="faceit-header-icon">${generateRankSVG(tarRank, true, game.id)}</div>
        <div>
          <div class="faceit-header-subtitle">Кінцевий Ранг</div>
          <div class="faceit-header-title">${tarRank.name}</div>
        </div>
      </div>
      <div class="faceit-chevron-up">^</div>
    </div>

    <div class="faceit-ranks-grid ${gridColsClass}">
      ${game.ranks.map(r => `
        <button type="button" class="faceit-rank-btn ${r.id === currentCalculatorState.targetRankId ? 'active' : ''}"
          onclick="selectTargetRank('${r.id}')" title="${r.name}">
          ${generateRankSVG(r, false, game.id)}
        </button>
      `).join('')}
    </div>

    <div class="faceit-elo-control-bar">
      <button type="button" class="elo-step-btn" onclick="stepTargetElo(-1)">−</button>
      <div class="elo-value-display">
        <input type="number" id="input-target-elo" class="elo-input" value="${currentCalculatorState.targetElo}"
          onchange="onTargetEloInputChange(this.value)" />
      </div>
      <button type="button" class="elo-step-btn" onclick="stepTargetElo(1)">+</button>
    </div>
  `;
}

// ---------------- RANK SELECTION & STEPPERS ----------------

function selectCurrentRank(rankId) {
  const game = cachedGames.find(g => g.id === currentCalculatorState.gameId);
  const curRank = game.ranks.find(r => r.id === rankId);
  if (!curRank) return;

  currentCalculatorState.currentRankId = rankId;
  currentCalculatorState.currentElo = curRank.defaultElo || 500;

  // Auto adjust target rank if needed
  const tarRank = game.ranks.find(r => r.id === currentCalculatorState.targetRankId);
  if (tarRank && (tarRank.value <= curRank.value || currentCalculatorState.targetElo <= currentCalculatorState.currentElo)) {
    const higherRank = game.ranks.find(r => r.value > curRank.value);
    if (higherRank) {
      currentCalculatorState.targetRankId = higherRank.id;
      currentCalculatorState.targetElo = higherRank.defaultElo || (currentCalculatorState.currentElo + 250);
    }
  }

  renderRankCards(game);
  recalculateBoostPrice();
}

function selectTargetRank(rankId) {
  const game = cachedGames.find(g => g.id === currentCalculatorState.gameId);
  const tarRank = game.ranks.find(r => r.id === rankId);
  const curRank = game.ranks.find(r => r.id === currentCalculatorState.currentRankId);

  if (curRank && tarRank && tarRank.value <= curRank.value) {
    notify.show({
      title: 'Увага',
      message: 'Кінцевий ранг повинен бути вищим за початковий!',
      type: 'warning'
    });
    return;
  }

  currentCalculatorState.targetRankId = rankId;
  currentCalculatorState.targetElo = tarRank.defaultElo || 1200;

  renderRankCards(game);
  recalculateBoostPrice();
}

function stepCurrentElo(direction) {
  const game = cachedGames.find(g => g.id === currentCalculatorState.gameId);
  const step = game.eloStep || 25;
  const newElo = Math.max(1, currentCalculatorState.currentElo + (direction * step));

  if (newElo >= currentCalculatorState.targetElo) {
    notify.show({ title: 'Увага', message: 'Початковий рейтинг не може перевищувати кінцевий!', type: 'warning' });
    return;
  }

  currentCalculatorState.currentElo = newElo;

  // Find nearest rank
  const matchingRank = game.ranks.find(r => newElo >= (r.minElo !== undefined ? r.minElo : (r.defaultElo - 100)) && newElo <= (r.maxElo !== undefined ? r.maxElo : (r.defaultElo + 100)));
  if (matchingRank) {
    currentCalculatorState.currentRankId = matchingRank.id;
  }

  renderRankCards(game);
  recalculateBoostPrice();
}

function stepTargetElo(direction) {
  const game = cachedGames.find(g => g.id === currentCalculatorState.gameId);
  const step = game.eloStep || 25;
  const newElo = currentCalculatorState.targetElo + (direction * step);

  if (newElo <= currentCalculatorState.currentElo) {
    notify.show({ title: 'Увага', message: 'Кінцевий рейтинг повинен бути вищим за початковий!', type: 'warning' });
    return;
  }

  currentCalculatorState.targetElo = newElo;

  // Find nearest rank
  const matchingRank = game.ranks.find(r => newElo >= (r.minElo !== undefined ? r.minElo : (r.defaultElo - 100)) && newElo <= (r.maxElo !== undefined ? r.maxElo : (r.defaultElo + 100)));
  if (matchingRank) {
    currentCalculatorState.targetRankId = matchingRank.id;
  }

  renderRankCards(game);
  recalculateBoostPrice();
}

function onCurrentEloInputChange(val) {
  const num = parseInt(val, 10);
  if (isNaN(num) || num < 1) return;
  if (num >= currentCalculatorState.targetElo) {
    currentCalculatorState.targetElo = num + 100;
  }
  currentCalculatorState.currentElo = num;

  const game = cachedGames.find(g => g.id === currentCalculatorState.gameId);
  if (game) {
    const matchingRank = game.ranks.find(r => num >= (r.minElo || 0) && num <= (r.maxElo || 99999));
    if (matchingRank) currentCalculatorState.currentRankId = matchingRank.id;
  }

  renderRankCards(game);
  recalculateBoostPrice();
}

function onTargetEloInputChange(val) {
  const num = parseInt(val, 10);
  if (isNaN(num) || num <= currentCalculatorState.currentElo) {
    notify.show({ title: 'Увага', message: 'Кінцевий рейтинг повинен бути вищим за початковий!', type: 'warning' });
    return;
  }
  currentCalculatorState.targetElo = num;

  const game = cachedGames.find(g => g.id === currentCalculatorState.gameId);
  if (game) {
    const matchingRank = game.ranks.find(r => num >= (r.minElo || 0) && num <= (r.maxElo || 99999));
    if (matchingRank) currentCalculatorState.targetRankId = matchingRank.id;
  }

  renderRankCards(game);
  recalculateBoostPrice();
}

function renderAgentPicker(game) {
  const agentContainer = document.getElementById('calc-agent-picker-container');
  if (!agentContainer) return;

  if (game.agents) {
    agentContainer.style.display = 'block';
    agentContainer.innerHTML = `
      <label class="form-label">${t('calc_opt_agent')}</label>
      <select id="calc-agent-select" class="form-select" onchange="updateCalcAgent(this.value)">
        ${game.agents.map(a => `<option value="${a}">${a}</option>`).join('')}
      </select>
    `;
  } else if (game.roles) {
    agentContainer.style.display = 'block';
    agentContainer.innerHTML = `
      <label class="form-label">Бажана позиція / роль</label>
      <select id="calc-agent-select" class="form-select" onchange="updateCalcAgent(this.value)">
        ${game.roles.map(r => `<option value="${r}">${r}</option>`).join('')}
      </select>
    `;
  } else {
    agentContainer.style.display = 'none';
  }
}

function toggleCalcOption(optKey, value) {
  if (optKey === 'queueType') {
    currentCalculatorState.options.queueType = value;
  } else {
    currentCalculatorState.options[optKey] = Boolean(value);
  }
  recalculateBoostPrice();
}

function updateCalcAgent(agent) {
  currentCalculatorState.options.specificAgents = agent;
  recalculateBoostPrice();
}

// ---------------- PRICE RECALCULATION ----------------

async function recalculateBoostPrice() {
  const game = cachedGames.find(g => g.id === currentCalculatorState.gameId);
  if (!game) return;

  try {
    const res = await fetch('/api/catalog/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: currentCalculatorState.gameId,
        currentRankId: currentCalculatorState.currentRankId,
        targetRankId: currentCalculatorState.targetRankId,
        currentElo: currentCalculatorState.currentElo,
        targetElo: currentCalculatorState.targetElo,
        options: currentCalculatorState.options
      })
    });

    if (res.ok) {
      const data = await res.json();
      currentCalculatorState.priceUSD = data.finalPriceUSD;
      currentCalculatorState.priceUAH = data.finalPriceUAH;
      currentCalculatorState.estimatedHours = data.estimatedHours;
      updateCalculatorSummaryUI();
    }
  } catch (e) {
    console.warn('Calculation error:', e);
  }
}

function updateCalculatorSummaryUI() {
  const usdEl = document.getElementById('calc-summary-usd');
  const uahEl = document.getElementById('calc-summary-uah');
  const timeEl = document.getElementById('calc-summary-time');

  if (usdEl) usdEl.textContent = `$${currentCalculatorState.priceUSD}`;
  if (uahEl) uahEl.textContent = `${currentCalculatorState.priceUAH} ₴`;
  if (timeEl) timeEl.textContent = currentCalculatorState.estimatedHours;
}

function orderCalculatorBoost() {
  const game = cachedGames.find(g => g.id === currentCalculatorState.gameId);
  const curRank = game.ranks.find(r => r.id === currentCalculatorState.currentRankId) || game.ranks[0];
  const tarRank = game.ranks.find(r => r.id === currentCalculatorState.targetRankId) || game.ranks[game.ranks.length - 1];

  const orderItem = {
    gameId: game.id,
    gameName: game.name,
    serviceType: 'rank_boost',
    title: `${game.name} Boost: ${curRank.name} → ${tarRank.name}`,
    currentRank: `${curRank.name} (${currentCalculatorState.currentElo} Rating)`,
    targetRank: `${tarRank.name} (${currentCalculatorState.targetElo} Rating)`,
    currentRankValue: curRank.value,
    targetRankValue: tarRank.value,
    price: currentCalculatorState.priceUSD,
    priceUAH: currentCalculatorState.priceUAH,
    options: {
      ...currentCalculatorState.options,
      currentElo: currentCalculatorState.currentElo,
      targetElo: currentCalculatorState.targetElo
    },
    icon: game.icon
  };

  openCheckoutModal(orderItem);
}

function addCalculatorBoostToCart() {
  const game = cachedGames.find(g => g.id === currentCalculatorState.gameId);
  const curRank = game.ranks.find(r => r.id === currentCalculatorState.currentRankId) || game.ranks[0];
  const tarRank = game.ranks.find(r => r.id === currentCalculatorState.targetRankId) || game.ranks[game.ranks.length - 1];

  const cartItem = {
    id: 'boost_' + Date.now(),
    gameId: game.id,
    gameName: game.name,
    serviceType: 'rank_boost',
    title: `${game.name}: ${curRank.name} → ${tarRank.name}`,
    currentRank: `${curRank.name} (${currentCalculatorState.currentElo})`,
    targetRank: `${tarRank.name} (${currentCalculatorState.targetElo})`,
    currentRankValue: curRank.value,
    targetRankValue: tarRank.value,
    price: currentCalculatorState.priceUSD,
    priceUAH: currentCalculatorState.priceUAH,
    options: {
      ...currentCalculatorState.options,
      currentElo: currentCalculatorState.currentElo,
      targetElo: currentCalculatorState.targetElo
    },
    icon: game.icon
  };

  cart.addItem(cartItem);
}
