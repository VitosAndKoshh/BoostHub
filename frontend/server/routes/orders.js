const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, adminMiddleware, staffMiddleware } = require('./auth');

// GET /api/orders - list filtered by role
router.get('/', authMiddleware, (req, res) => {
  const user = req.user;
  const allOrders = db.getOrders();

  if (user.role === 'admin') {
    return res.json({ orders: allOrders });
  }

  if (user.role === 'booster') {
    // Boosters see their assigned orders + available paid orders that need a booster
    const boosterOrders = allOrders.filter(o => o.boosterId === user.id || (o.status === 'paid' && !o.boosterId));
    return res.json({ orders: boosterOrders });
  }

  // Client sees their own orders
  const clientOrders = allOrders.filter(o => o.clientId === user.id);
  res.json({ orders: clientOrders });
});

// GET /api/orders/:id
router.get('/:id', authMiddleware, (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Замовлення не знайдено' });
  }

  // Permissions check
  const user = req.user;
  if (user.role === 'client' && order.clientId !== user.id) {
    return res.status(403).json({ error: 'Немає доступу до цього замовлення' });
  }

  res.json({ order });
});

// POST /api/orders - Create a new order
router.post('/', authMiddleware, (req, res) => {
  const user = req.user;
  const {
    gameId,
    gameName,
    serviceType, // 'rank_boost' | 'catalog_service' | 'custom'
    title,
    currentRank,
    targetRank,
    currentRankValue,
    targetRankValue,
    price,
    priceUAH,
    paymentMethod,
    options,
    accountCredentials
  } = req.body;

  if (!gameId || !title || !price) {
    return res.status(400).json({ error: 'Неповні дані замовлення' });
  }

  const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);

  const newOrder = {
    id: orderId,
    clientId: user.id,
    clientName: user.name,
    clientDiscord: user.discord || '',
    boosterId: null,
    boosterName: null,
    gameId,
    gameName: gameName || 'Game',
    serviceType: serviceType || 'rank_boost',
    title,
    currentRank: currentRank || '-',
    targetRank: targetRank || '-',
    currentRankValue: currentRankValue || 0,
    targetRankValue: targetRankValue || 0,
    progressRank: currentRank || '-',
    progressPercent: 0,
    price: Number(price),
    currency: 'USD',
    priceUAH: priceUAH ? Number(priceUAH) : Math.round(Number(price) * 41.5),
    status: 'paid', // Instant verification / ready for assignment in demo
    paymentStatus: 'verified',
    paymentMethod: paymentMethod || 'card',
    options: options || {},
    accountCredentials: accountCredentials || {},
    streamUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [
      { time: new Date().toISOString(), text: `Замовлення створено клієнтом ${user.name}` },
      { time: new Date().toISOString(), text: `Оплату підтверджено (${paymentMethod || 'Онлайн-оплата'}). Очікує бустера.` }
    ]
  };

  db.addOrder(newOrder);

  // Send initial welcome message to order chat
  db.addMessage({
    id: 'msg_' + Date.now(),
    orderId: newOrder.id,
    senderId: 'system',
    senderName: 'CyberBoost Bot',
    senderRole: 'system',
    text: `Замовлення ${newOrder.id} успішно створено! Бустера буде призначено протягом 10-15 хвилин. Ви можете залишати додаткові побажання тут.`,
    timestamp: new Date().toISOString()
  });

  res.json({ order: newOrder });
});

// POST /api/orders/:id/assign - Assign or Claim Booster
router.post('/:id/assign', authMiddleware, staffMiddleware, (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Замовлення не знайдено' });
  }

  let boosterId = req.body.boosterId;
  let boosterName = req.body.boosterName;

  // If booster is taking the order themselves
  if (req.user.role === 'booster') {
    boosterId = req.user.id;
    boosterName = req.user.name;
  } else if (!boosterId) {
    return res.status(400).json({ error: 'Оберіть бустера для призначення' });
  }

  if (!boosterName) {
    const booster = db.getUserById(boosterId);
    boosterName = booster ? booster.name : 'Booster';
  }

  const updatedTimeline = [
    ...order.timeline,
    { time: new Date().toISOString(), text: `Призначено бустера: ${boosterName}` }
  ];

  const updated = db.updateOrder(req.params.id, {
    boosterId,
    boosterName,
    status: 'in_progress',
    timeline: updatedTimeline
  });

  // System message in chat
  db.addMessage({
    id: 'msg_' + Date.now(),
    orderId: order.id,
    senderId: boosterId,
    senderName: boosterName,
    senderRole: 'booster',
    text: `Привіт! Я твій бустер ${boosterName}. Я прийняв замовлення і незабаром розпочну гру!`,
    timestamp: new Date().toISOString()
  });

  res.json({ order: updated });
});

// POST /api/orders/:id/progress - Update Rank / Progress % / Stream URL
router.post('/:id/progress', authMiddleware, staffMiddleware, (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Замовлення не знайдено' });
  }

  const { progressPercent, progressRank, streamUrl, statusNote, status } = req.body;
  const updates = {};

  if (progressPercent !== undefined) updates.progressPercent = Number(progressPercent);
  if (progressRank !== undefined) updates.progressRank = progressRank;
  if (streamUrl !== undefined) updates.streamUrl = streamUrl;
  if (status) updates.status = status;

  const newTimelineItem = statusNote
    ? { time: new Date().toISOString(), text: statusNote }
    : { time: new Date().toISOString(), text: `Оновлено прогрес: ${updates.progressRank || ''} (${updates.progressPercent || 0}%)` };

  updates.timeline = [...order.timeline, newTimelineItem];

  if (updates.progressPercent >= 100 || status === 'completed') {
    updates.status = 'completed';
    updates.timeline.push({ time: new Date().toISOString(), text: '🎉 Буст успішно виконано на 100%!' });
  }

  const updated = db.updateOrder(req.params.id, updates);
  res.json({ order: updated });
});

// POST /api/orders/:id/verify-payment (Admin only)
router.post('/:id/verify-payment', authMiddleware, adminMiddleware, (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Замовлення не знайдено' });
  }

  const { paymentStatus } = req.body; // 'verified', 'pending', 'refunded'
  const newStatus = paymentStatus === 'verified' ? 'paid' : order.status;

  const updatedTimeline = [
    ...order.timeline,
    { time: new Date().toISOString(), text: `Адміністратор оновив статус оплати: ${paymentStatus}` }
  ];

  const updated = db.updateOrder(req.params.id, {
    paymentStatus,
    status: newStatus,
    timeline: updatedTimeline
  });

  res.json({ order: updated });
});

module.exports = router;
