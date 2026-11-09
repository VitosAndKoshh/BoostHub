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
    // Boosters see their assigned orders + available paid orders that need a booster (excluding ones this booster declined)
    const boosterOrders = allOrders.filter(o => {
      if (o.boosterId === user.id) return true;
      if (o.status === 'paid' && !o.boosterId) {
        if (Array.isArray(o.declinedBoosters) && o.declinedBoosters.includes(user.id)) return false;
        return true;
      }
      return false;
    });
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
    accountCredentials,
    isCustomPrice,
    originalCalculatedPrice
  } = req.body;

  if (!gameId || !title || !price) {
    return res.status(400).json({ error: 'Неповні дані замовлення' });
  }

  const numPrice = Number(price);

  if (paymentMethod === 'wallet') {
    const userFresh = db.getUserById(user.id);
    if (!userFresh || Number(userFresh.balance || 0) < numPrice) {
      return res.status(400).json({
        error: `Недостатньо коштів на балансі гаманця. До сплати: $${numPrice}, ваш баланс: $${userFresh ? userFresh.balance : 0}`
      });
    }
  }

  const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);

  if (paymentMethod === 'wallet') {
    db.updateUserBalance(user.id, -numPrice, 'payment', `Оплата замовлення ${orderId} (${title})`, { orderId });
  }

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
    isCustomPrice: !!isCustomPrice,
    originalCalculatedPrice: originalCalculatedPrice ? Number(originalCalculatedPrice) : Number(price),
    options: {
      ...(options || {}),
      isCustomPrice: !!isCustomPrice,
      originalCalculatedPrice: originalCalculatedPrice ? Number(originalCalculatedPrice) : Number(price)
    },
    accountCredentials: accountCredentials || {},
    streamUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [
      { time: new Date().toISOString(), text: `Замовлення створено клієнтом ${user.name}` },
      { time: new Date().toISOString(), text: `Оплату підтверджено (${paymentMethod || 'Онлайн-оплата'}). Очікує бустера.` },
      ...(isCustomPrice ? [{
        time: new Date().toISOString(),
        text: `💰 Клієнт запропонував свою ціну: ${price} (Рекомендована: ${originalCalculatedPrice || price}). Очікується згода бустера.`
      }] : [])
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
    text: isCustomPrice
      ? `Замовлення ${newOrder.id} успішно створено з вашою запропонованою ціною ${newOrder.price}! Бустер розгляне вашу пропозицію при взятті в роботу.`
      : `Замовлення ${newOrder.id} успішно створено! Бустера буде призначено протягом 10-15 хвилин. Ви можете залишати додаткові побажання тут.`,
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
    if (req.user.boosterVerification === 'Rejected') {
      return res.status(403).json({
        error: 'Ваш акаунт бустера відхилено адміністратором.'
      });
    }
    if (req.user.boosterVerification !== 'Verified') {
      db.updateUser(req.user.id, { boosterVerification: 'Verified' });
      req.user.boosterVerification = 'Verified';
    }
    boosterId = req.user.id;
    boosterName = req.user.name;
  } else if (!boosterId) {
    return res.status(400).json({ error: 'Оберіть бустера для призначення' });
  }

  if (!boosterName) {
    const booster = db.getUserById(boosterId);
    boosterName = booster ? booster.name : 'Booster';
  }

  const isCustom = Boolean(order.isCustomPrice || (order.options && order.options.isCustomPrice));
  const agreeEventText = isCustom
    ? `🤝 Бустер ${boosterName} погодився на запропоновану ціну ${order.price} та взяв замовлення в роботу!`
    : `Призначено бустера: ${boosterName}`;

  const updatedTimeline = [
    ...order.timeline,
    { time: new Date().toISOString(), text: agreeEventText }
  ];

  const updated = db.updateOrder(req.params.id, {
    boosterId,
    boosterName,
    boosterAgreedPrice: Number(order.price),
    boosterAgreedAt: new Date().toISOString(),
    status: 'in_progress',
    acceptedAt: order.acceptedAt || new Date().toISOString(),
    timeline: updatedTimeline
  });

  if (isCustom) {
    db.addMessage({
      id: 'msg_agree_' + Date.now(),
      orderId: order.id,
      senderId: 'system',
      senderName: 'CyberBoost Bot',
      senderRole: 'system',
      text: `🤝 Бустер ${boosterName} погодився на вашу ціну (${order.price}) та розпочав виконання замовлення!`,
      timestamp: new Date().toISOString()
    });
  }

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
    updates.completedAt = order.completedAt || new Date().toISOString();
    updates.closedBy = 'booster';
    updates.timeline.push({ time: new Date().toISOString(), text: `🎉 Буст успішно виконано на 100% бустером ${req.user.name || ''}!` });
  }

  const updated = db.updateOrder(req.params.id, updates);
  res.json({ order: updated });
});

// POST /api/orders/:id/partial-close-request - Booster requests to close early at X% progress with reduced price
router.post('/:id/partial-close-request', authMiddleware, staffMiddleware, (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Замовлення не знайдено' });
  }

  if (order.boosterId && order.boosterId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Тільки призначений бустер або адмін може запропонувати дострокове закриття' });
  }

  const { progressPercent, note } = req.body;
  const percent = Math.min(99, Math.max(1, parseInt(progressPercent, 10) || 50));
  const basePrice = order.originalPrice || order.price;
  const proposedPrice = Math.max(1, Math.round(basePrice * (percent / 100)));
  const proposedPriceUAH = Math.round(proposedPrice * 41.5);

  const partialClose = {
    status: 'pending',
    requestedBy: req.user.id,
    requestedByName: req.user.name,
    requestedAt: new Date().toISOString(),
    progressPercent: percent,
    originalPrice: basePrice,
    proposedPrice: proposedPrice,
    proposedPriceUAH: proposedPriceUAH,
    note: note || `Бустер запропонував закрити замовлення на ${percent}% за зменшеною ціною $${proposedPrice} (${proposedPriceUAH} ₴).`
  };

  const timelineMsg = `⏹️ Бустер ${req.user.name} запропонував достроково завершити буст на ${percent}% виконання. Запропонована нова ціна: $${proposedPrice} (${proposedPriceUAH} ₴ замість $${basePrice}). Очікується відповідь клієнта.`;

  const updates = {
    progressPercent: percent,
    partialClose: partialClose,
    timeline: [...order.timeline, { time: new Date().toISOString(), text: timelineMsg }]
  };

  try {
    db.addChatMessage(order.id, {
      senderRole: 'system',
      senderName: 'CyberBoost Arbitrage',
      message: `🔔 Бустер запропонував завершити буст на ${percent}% за зменшеною ціною $${proposedPrice} (${proposedPriceUAH} ₴). Клієнт може погодитися або відхилити пропозицію в трекері замовлення.`
    });
  } catch (e) {
    console.error('Chat message error:', e);
  }

  const updated = db.updateOrder(req.params.id, updates);
  res.json({ success: true, order: updated });
});

// POST /api/orders/:id/partial-close-respond - Client accepts or declines partial closure
router.post('/:id/partial-close-respond', authMiddleware, (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Замовлення не знайдено' });
  }

  if (order.clientId && order.clientId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Лише замовник або адміністратор може відповісти на пропозицію' });
  }

  if (!order.partialClose || order.partialClose.status !== 'pending') {
    return res.status(400).json({ error: 'Немає активної пропозиції дострокового закриття' });
  }

  const { accept } = req.body;
  const updates = {};

  if (accept) {
    const finalPrice = order.partialClose.proposedPrice;
    const finalPriceUAH = order.partialClose.proposedPriceUAH;
    const finalPercent = order.partialClose.progressPercent;

    updates.price = finalPrice;
    updates.priceUAH = finalPriceUAH;
    updates.progressPercent = finalPercent;
    updates.status = 'completed';
    updates.completedAt = new Date().toISOString();
    updates.closedBy = 'client_partial_agreement';
    updates.partialClose = {
      ...order.partialClose,
      status: 'accepted',
      resolvedAt: new Date().toISOString(),
      resolvedBy: req.user.id
    };

    const timelineMsg = `🤝 Клієнт ${req.user.name} погодився на дострокове закриття бусту на ${finalPercent}% за зменшеною ціною $${finalPrice} (${finalPriceUAH} ₴). Замовлення успішно завершено!`;
    updates.timeline = [...order.timeline, { time: new Date().toISOString(), text: timelineMsg }];

    try {
      db.addChatMessage(order.id, {
        senderRole: 'system',
        senderName: 'CyberBoost Arbitrage',
        message: `🤝 Умови дострокового закриття прийнято замовником! Ціну перераховано до $${finalPrice} (${finalPriceUAH} ₴). Буст завершено.`
      });
    } catch (e) {}
  } else {
    updates.partialClose = {
      ...order.partialClose,
      status: 'declined',
      resolvedAt: new Date().toISOString(),
      resolvedBy: req.user.id
    };

    const timelineMsg = `❌ Клієнт ${req.user.name} не погодився на дострокове закриття бусту. Буст продовжується у звичайному режимі.`;
    updates.timeline = [...order.timeline, { time: new Date().toISOString(), text: timelineMsg }];

    try {
      db.addChatMessage(order.id, {
        senderRole: 'system',
        senderName: 'CyberBoost Arbitrage',
        message: `❌ Клієнт не погодився на дострокове закриття за зменшеною ціною. Роботу над бустом буде продовжено.`
      });
    } catch (e) {}
  }

  const updated = db.updateOrder(req.params.id, updates);
  res.json({ success: true, order: updated, accepted: !!accept });
});

// POST /api/orders/:id/client-complete - Client confirms completion and closes boost (Two-party completion)
router.post('/:id/client-complete', authMiddleware, (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Замовлення не знайдено' });
  }

  if (order.clientId && order.clientId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Лише замовник або адміністратор може підтвердити виконання' });
  }

  if (order.status === 'completed') {
    return res.status(400).json({ error: 'Замовлення вже завершено' });
  }

  const updates = {
    status: 'completed',
    progressPercent: 100,
    completedAt: new Date().toISOString(),
    closedBy: 'client',
    timeline: [
      ...order.timeline,
      { time: new Date().toISOString(), text: `✅ Замовник ${req.user.name} підтвердив повне виконання робіт та успішно закрив замовлення!` }
    ]
  };

  try {
    db.addChatMessage(order.id, {
      senderRole: 'system',
      senderName: 'CyberBoost Arbitrage',
      message: `✅ Замовник підтвердив завершення бусту! Роботу прийнято, буст офіційно закрито.`
    });
  } catch (e) {}

  const updated = db.updateOrder(req.params.id, updates);
  res.json({ success: true, order: updated });
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


// POST /api/orders/:id/decline - Booster declines custom price offer
router.post('/:id/decline', authMiddleware, staffMiddleware, (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Замовлення не знайдено' });
  }

  const boosterId = req.user.id;
  const boosterName = req.user.name || 'Booster';
  const declinedList = Array.isArray(order.declinedBoosters) ? [...order.declinedBoosters] : [];
  if (!declinedList.includes(boosterId)) {
    declinedList.push(boosterId);
  }

  const updatedTimeline = [
    ...order.timeline,
    { time: new Date().toISOString(), text: `❌ Бустер ${boosterName} не погодився на запропоновану ціну ${order.price}.` }
  ];

  const updated = db.updateOrder(req.params.id, {
    declinedBoosters: declinedList,
    timeline: updatedTimeline
  });

  db.addMessage({
    id: 'msg_decline_' + Date.now(),
    orderId: order.id,
    senderId: 'system',
    senderName: 'CyberBoost Bot',
    senderRole: 'system',
    text: `❌ Бустер ${boosterName} відхилив цінову пропозицію (${order.price}). Очікується згода іншого бустера.`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, order: updated });
});

module.exports = router;
