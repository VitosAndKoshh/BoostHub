const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('./auth');

// GET /api/catalog/games
router.get('/games', (req, res) => {
  res.json({ games: db.getGames() });
});

// GET /api/catalog/services
router.get('/services', (req, res) => {
  const { gameId, category } = req.query;
  let services = db.getServices();

  if (gameId && gameId !== 'all') {
    services = services.filter(s => s.gameId === gameId);
  }
  if (category && category !== 'all') {
    services = services.filter(s => s.category === category);
  }

  res.json({ services });
});

// POST /api/catalog/services (Admin only)
router.post('/services', authMiddleware, adminMiddleware, (req, res) => {
  const { title, gameId, gameName, category, price, priceUAH, deliveryTime, badge, icon, description, features } = req.body;
  if (!title || !price) {
    return res.status(400).json({ error: 'Введіть назву та ціну послуги' });
  }

  const newService = {
    id: 'srv_' + Date.now(),
    title,
    gameId: gameId || 'other',
    gameName: gameName || 'Custom Game',
    category: category || 'custom',
    price: Number(price),
    currency: 'USD',
    priceUAH: priceUAH ? Number(priceUAH) : Math.round(Number(price) * 41.5),
    deliveryTime: deliveryTime || '1-2 дні',
    badge: badge || 'NEW',
    icon: icon || '⚡',
    description: description || '',
    features: Array.isArray(features) ? features : (features ? features.split(',').map(f => f.trim()) : [])
  };

  db.addService(newService);
  res.json({ service: newService });
});

// PUT /api/catalog/services/:id (Admin only)
router.put('/services/:id', authMiddleware, adminMiddleware, (req, res) => {
  const updated = db.updateService(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Послугу не знайдено' });
  }
  res.json({ service: updated });
});

// DELETE /api/catalog/services/:id (Admin only)
router.delete('/services/:id', authMiddleware, adminMiddleware, (req, res) => {
  db.deleteService(req.params.id);
  res.json({ success: true, message: 'Послугу видалено' });
});

// POST /api/catalog/calculate
router.post('/calculate', (req, res) => {
  const { gameId, currentRankId, targetRankId, currentElo, targetElo, options } = req.body;
  const game = db.getGameById(gameId);

  if (!game) {
    return res.status(400).json({ error: 'Гру не знайдено' });
  }

  let currentRank = game.ranks.find(r => r.id === currentRankId);
  let targetRank = game.ranks.find(r => r.id === targetRankId);

  // If ELO numbers are passed
  const curEloNum = currentElo !== undefined ? Number(currentElo) : (currentRank ? currentRank.defaultElo : 0);
  const tarEloNum = targetElo !== undefined ? Number(targetElo) : (targetRank ? targetRank.defaultElo : 0);

  if (game.isEloBased && currentElo !== undefined && targetElo !== undefined) {
    if (tarEloNum <= curEloNum) {
      return res.status(400).json({ error: 'Цільовий ELO повинен бути вищим за поточний' });
    }

    // Auto-detect ranks based on ELO
    const foundCurRank = game.ranks.find(r => curEloNum >= r.minElo && curEloNum <= r.maxElo);
    const foundTarRank = game.ranks.find(r => tarEloNum >= r.minElo && tarEloNum <= r.maxElo);
    if (foundCurRank) currentRank = foundCurRank;
    if (foundTarRank) targetRank = foundTarRank;
  }

  if (!currentRank || !targetRank) {
    return res.status(400).json({ error: 'Некоректні ранги' });
  }

  if (tarEloNum <= curEloNum && targetRank.value <= currentRank.value) {
    return res.status(400).json({ error: 'Цільовий ранг/ELO повинен бути вищим за поточний' });
  }

  // Calculate base price
  let basePrice = 0;
  if (game.isEloBased && currentElo !== undefined && targetElo !== undefined) {
    const eloDelta = tarEloNum - curEloNum;
    if (game.id === 'cs2_faceit') {
      // ~$2.2 per 25 ELO (~$8.8 per 100 ELO)
      basePrice = Math.max(8, (eloDelta / 25) * 2.3);
    } else if (game.id === 'cs2_premier') {
      // ~$1.8 per 250 ELO
      basePrice = Math.max(8, (eloDelta / 250) * 1.8);
    } else if (game.id === 'dota2') {
      // ~$3.5 per 100 MMR
      basePrice = Math.max(6, (eloDelta / 50) * 1.75);
    } else {
      // Valorant / LoL by points
      basePrice = Math.max(8, (eloDelta / 100) * 9.5);
    }
  } else {
    for (const rank of game.ranks) {
      if (rank.value > currentRank.value && rank.value <= targetRank.value) {
        basePrice += rank.basePrice;
      }
    }
  }

  // Multipliers & Add-ons
  let multiplier = 1.0;
  let addOnTotal = 0;

  if (options) {
    if (options.queueType === 'duo') {
      multiplier += 0.40; // +40% for Duo Queue
    }
    if (options.stream) {
      addOnTotal += 5; // +$5 for Live Stream
    }
    if (options.priority) {
      multiplier += 0.25; // +25% for VIP Express delivery
    }
    if (options.specificAgents && options.specificAgents !== 'Any') {
      addOnTotal += 4; // +$4 for specific agent lock
    }
  }

  const finalUSD = Math.round((basePrice * multiplier + addOnTotal) * 100) / 100;
  const finalUAH = Math.round(finalUSD * 41.5);

  // Estimated hours
  const eloDiff = tarEloNum > curEloNum ? (tarEloNum - curEloNum) : (targetRank.value - currentRank.value) * 100;
  const estimatedHours = Math.max(2, Math.round((eloDiff / 100) * 3));

  res.json({
    gameId,
    gameName: game.name,
    currentRank,
    targetRank,
    currentElo: curEloNum,
    targetElo: tarEloNum,
    basePrice: Math.round(basePrice * 100) / 100,
    finalPriceUSD: finalUSD,
    finalPriceUAH: finalUAH,
    estimatedHours: `${estimatedHours} - ${Math.round(estimatedHours * 1.4)} год.`
  });
});

// POST /api/catalog/promo/validate
router.post('/promo/validate', (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Введіть промокод' });
  }

  const promo = db.getPromoCodes().find(p => p.code.toUpperCase() === code.toUpperCase().trim());
  if (!promo) {
    return res.status(404).json({ error: 'Промокод недійсний або прострочений' });
  }

  res.json({ valid: true, discountPercent: promo.discountPercent, code: promo.code });
});

// GET /api/catalog/reviews
router.get('/reviews', (req, res) => {
  res.json({ reviews: db.getReviews() });
});

// POST /api/catalog/reviews
router.post('/reviews', authMiddleware, (req, res) => {
  const { game, rating, comment } = req.body;
  if (!comment || !rating) {
    return res.status(400).json({ error: 'Заповніть коментар та оберіть оцінку' });
  }

  const newReview = {
    id: 'rev_' + Date.now(),
    author: req.user.name,
    game: game || 'All Games',
    rating: Math.min(5, Math.max(1, Number(rating))),
    comment,
    date: 'Щойно'
  };

  db.addReview(newReview);
  res.json({ review: newReview });
});

module.exports = router;
