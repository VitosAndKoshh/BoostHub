const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'cyberboost-super-secret-key-2026';

// Middleware to verify JWT token
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Неавторизовано: відсутній токен' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Користувача не знайдено' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Недійсний токен' });
  }
};

// Admin middleware
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Доступ лише для адміністраторів' });
  }
};

// Booster or Admin middleware
const staffMiddleware = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'booster')) {
    next();
  } else {
    res.status(403).json({ error: 'Доступ лише для бустерів та адміністраторів' });
  }
};

// POST /api/auth/register - Simple registration with ONLY email & password
router.post('/register', (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Вкажіть email та пароль' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.getUserByEmail(normalizedEmail);
  if (existing) {
    return res.status(400).json({ error: 'Користувач з таким email вже існує' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль має містити щонайменше 6 символів' });
  }

  const isBooster = role === 'booster';
  const defaultName = normalizedEmail.split('@')[0];
  const salt = bcrypt.genSaltSync(10);
  const newUser = {
    id: 'usr_' + Date.now(),
    email: normalizedEmail,
    passwordHash: bcrypt.hashSync(password, salt),
    name: defaultName,
    role: isBooster ? 'booster' : 'client',
    steamId: '',
    discord: '',
    telegram: '',
    boosterVerification: isBooster ? 'Verified' : 'None',
    avatar: isBooster 
      ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: isBooster ? 'ready' : 'online',
    statusMessage: isBooster ? '🟢 Вільний • Готовий приймати замовлення' : '🟢 В мережі',
    rating: 5.0,
    completedOrders: 0,
    rankTitle: isBooster ? 'Pro Booster' : '',
    games: [],
    createdAt: new Date().toISOString()
  };

  db.addUser(newUser);

  const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
  const { passwordHash, ...userSafe } = newUser;
  res.json({ token, user: userSafe });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Введіть email та пароль' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = db.getUserByEmail(normalizedEmail);
  if (!user) {
    return res.status(400).json({ error: 'Невірний email або пароль' });
  }

  const isValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isValid) {
    return res.status(400).json({ error: 'Невірний email або пароль' });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  const { passwordHash, ...userSafe } = user;
  res.json({ token, user: userSafe });
});

// POST /api/auth/demo-switch (Quick login for demo / testing purposes)
router.post('/demo-switch', (req, res) => {
  const { role } = req.body; // 'client', 'booster', 'admin'
  let targetEmail = 'client@boost.gg';
  if (role === 'booster') targetEmail = 'booster@boost.gg';
  if (role === 'admin') targetEmail = 'admin@boost.gg';

  const user = db.getUserByEmail(targetEmail);
  if (!user) {
    return res.status(404).json({ error: 'Демо акаунт не знайдено' });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  const { passwordHash, ...userSafe } = user;
  res.json({ token, user: userSafe });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const { passwordHash, ...userSafe } = req.user;
  res.json({ user: userSafe });
});

// PUT /api/auth/profile - Update personal profile
router.put('/profile', authMiddleware, (req, res) => {
  const { name, email, discord, telegram, steamId, avatar, rankTitle, games, password, status, statusMessage } = req.body;
  const updates = {};

  if (name !== undefined && name.trim()) updates.name = name.trim();
  if (email !== undefined && email.trim()) updates.email = email.trim().toLowerCase();
  if (discord !== undefined) updates.discord = discord.trim();
  if (telegram !== undefined) updates.telegram = telegram.trim();
  if (steamId !== undefined) updates.steamId = steamId.trim();
  if (avatar !== undefined && avatar.trim()) updates.avatar = avatar.trim();
  if (status !== undefined) updates.status = status;
  if (statusMessage !== undefined) updates.statusMessage = statusMessage.trim();
  if (rankTitle !== undefined) updates.rankTitle = rankTitle.trim();
  if (req.body.boosterVerification !== undefined) updates.boosterVerification = req.body.boosterVerification;
  if (Array.isArray(games)) updates.games = games;

  if (password && password.trim()) {
    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль має містити щонайменше 6 символів' });
    }
    const salt = bcrypt.genSaltSync(10);
    updates.passwordHash = bcrypt.hashSync(password, salt);
  }

  const updatedUser = db.updateUser(req.user.id, updates);
  if (!updatedUser) {
    return res.status(404).json({ error: 'Користувача не знайдено' });
  }

  const { passwordHash, ...userSafe } = updatedUser;
  res.json({ user: userSafe, message: 'Профіль успішно оновлено' });
});

// POST /api/auth/booster-verification - Send booster profile for Admin verification
router.post('/booster-verification', authMiddleware, (req, res) => {
  const { steamId, discord } = req.body;
  const currentSteam = steamId !== undefined ? steamId.trim() : (req.user.steamId || '');
  const currentDiscord = discord !== undefined ? discord.trim() : (req.user.discord || '');

  if (!currentSteam && !currentDiscord) {
    return res.status(400).json({ error: 'Будь ласка, вкажіть Steam ID або Discord nickname' });
  }

  const updates = {
    steamId: currentSteam,
    discord: currentDiscord,
    boosterVerification: 'Pending',
    role: 'booster'
  };

  const updatedUser = db.updateUser(req.user.id, updates);
  const { passwordHash, ...userSafe } = updatedUser;
  res.json({
    user: userSafe,
    message: 'Профіль надіслано на перевірку адміністратору. Статус: Pending'
  });
});

// PUT /api/auth/users/:id/verification - Admin updates booster verification status
router.put('/users/:id/verification', authMiddleware, adminMiddleware, (req, res) => {
  const { status } = req.body; // 'Verified', 'Pending', 'Rejected', 'None'
  if (!['Verified', 'Pending', 'Rejected', 'None'].includes(status)) {
    return res.status(400).json({ error: 'Некоректний статус верифікації' });
  }

  const target = db.getUserById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'Користувача не знайдено' });
  }

  const updates = { boosterVerification: status };
  if (status === 'Verified') {
    updates.role = 'booster';
  }

  const updated = db.updateUser(target.id, updates);
  const { passwordHash, ...userSafe } = updated;
  res.json({ user: userSafe, message: `Статус верифікації бустера оновлено: ${status}` });
});

// PUT /api/auth/status - Quick update presence / operational status
router.put('/status', authMiddleware, (req, res) => {
  const { status, statusMessage } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Вкажіть статус' });
  }

  const allowedStatuses = ['online', 'ready', 'busy', 'resting', 'in_boost', 'searching', 'afk', 'offline'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Некоректний статус' });
  }

  const updatedUser = db.updateUserStatus(req.user.id, status, statusMessage);
  if (!updatedUser) {
    return res.status(404).json({ error: 'Користувача не знайдено' });
  }

  const { passwordHash, ...userSafe } = updatedUser;
  res.json({ user: userSafe, message: 'Статус успішно оновлено' });
});

// GET /api/auth/users (admin only)
router.get('/users', authMiddleware, adminMiddleware, (req, res) => {
  const users = db.getUsers().map(u => {
    const { passwordHash, ...safe } = u;
    return safe;
  });
  res.json({ users });
});

// GET /api/auth/all-profiles - Public list of user profiles (clients, boosters, admin)
router.get('/all-profiles', (req, res) => {
  const users = db.getUsers().map(u => {
    const { passwordHash, ...safe } = u;
    return safe;
  });
  res.json({ users });
});

// GET /api/auth/profile/:id - Public single user profile
router.get('/profile/:id', (req, res) => {
  const user = db.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Користувача не знайдено' });
  }
  const { passwordHash, ...safe } = user;
  res.json({ user: safe });
});

// GET /api/auth/boosters
router.get('/boosters', (req, res) => {
  const boosters = db.getUsers()
    .filter(u => u.role === 'booster')
    .map(u => {
      const { passwordHash, email, ...safe } = u;
      return safe;
    });
  res.json({ boosters });
});

// ---------------- CLIENT WALLET ENDPOINTS ----------------

// GET /api/auth/wallet - Get current balance & transaction history
router.get('/wallet', authMiddleware, (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Користувача не знайдено' });
  }
  res.json({
    balance: user.balance !== undefined ? Number(user.balance) : 0,
    balanceUAH: Math.round((Number(user.balance || 0)) * 41.5),
    transactions: user.transactions || []
  });
});

// POST /api/auth/wallet/topup - Top up client balance
router.post('/wallet/topup', authMiddleware, (req, res) => {
  const { amount, method } = req.body;
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Вкажіть коректну суму поповнення (більше 0)' });
  }

  const methodName = method || 'Банківська картка';
  const updatedUser = db.updateUserBalance(
    req.user.id,
    numAmount,
    'topup',
    `Поповнення гаманця (${methodName})`,
    { method: methodName }
  );

  if (!updatedUser) {
    return res.status(500).json({ error: 'Не вдалося оновити баланс' });
  }

  res.json({
    success: true,
    message: `Гаманець успішно поповнено на $${numAmount}!`,
    balance: updatedUser.balance,
    balanceUAH: Math.round(Number(updatedUser.balance) * 41.5),
    transactions: updatedUser.transactions || []
  });
});

// ---------------- BOOSTER APPLICATION ENDPOINTS ----------------

// POST /api/auth/booster-application - Submit application to become a booster
router.post('/booster-application', (req, res) => {
  const { name, contact, steamUrl, game, rank, note, userId } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Вкажіть ваше ім\'я' });
  }
  if (!contact || !contact.trim()) {
    return res.status(400).json({ error: 'Вкажіть нік у Discord або Telegram для зв\'язку' });
  }
  if (!steamUrl || !steamUrl.trim()) {
    return res.status(400).json({ error: 'Вкажіть посилання на відкритий профіль Steam' });
  }
  if (!game || !game.trim()) {
    return res.status(400).json({ error: 'Оберіть основну гру' });
  }
  if (!rank || !rank.trim()) {
    return res.status(400).json({ error: 'Вкажіть поточний ранг або ELO' });
  }

  const appData = {
    userId: userId || null,
    name: name.trim(),
    contact: contact.trim(),
    steamUrl: steamUrl.trim(),
    game: game.trim(),
    rank: rank.trim(),
    note: (note || '').trim()
  };

  const created = db.createBoosterApplication(appData);
  res.json({
    success: true,
    message: 'Заявку успішно надіслано! Наш адміністратор зв\'яжеться з вами найближчим часом.',
    application: created
  });
});

// GET /api/auth/booster-applications - Admin view all applications
router.get('/booster-applications', authMiddleware, adminMiddleware, (req, res) => {
  const applications = db.getBoosterApplications();
  res.json({ applications });
});

// PUT /api/auth/booster-applications/:id/review - Admin approve or reject application
router.put('/booster-applications/:id/review', authMiddleware, adminMiddleware, (req, res) => {
  const { status, note } = req.body; // 'approved' | 'rejected'
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Некоректний статус заявки' });
  }

  const app = db.getBoosterApplicationById(req.params.id);
  if (!app) {
    return res.status(404).json({ error: 'Заявку не знайдено' });
  }

  const updated = db.updateBoosterApplication(app.id, {
    status,
    note: note !== undefined ? note : app.note,
    reviewedBy: req.user.name
  });

  // If approved and the candidate has a user account, upgrade role to booster
  if (status === 'approved' && app.userId) {
    const candidateUser = db.getUserById(app.userId);
    if (candidateUser && candidateUser.role !== 'admin') {
      db.updateUser(candidateUser.id, {
        role: 'booster',
        boosterVerification: 'Verified',
        rankTitle: `${app.game} • ${app.rank}`,
        status: 'ready',
        statusMessage: '🟢 Вільний • Готовий до бусту'
      });
    }
  }

  res.json({
    success: true,
    message: status === 'approved' ? 'Заявку схвалено! Користувача переведено в статус бустера.' : 'Заявку відхилено.',
    application: updated
  });
});

module.exports = { router, authMiddleware, adminMiddleware, staffMiddleware };
