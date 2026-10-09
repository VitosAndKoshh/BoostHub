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

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { email, password, name, discord } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Заповніть усі обов’язкові поля (email, пароль, ім’я)' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'Користувач з таким email вже існує' });
  }

  const salt = bcrypt.genSaltSync(10);
  const newUser = {
    id: 'usr_' + Date.now(),
    email,
    passwordHash: bcrypt.hashSync(password, salt),
    name,
    discord: discord || '',
    role: 'client',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
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

  const user = db.getUserByEmail(email);
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

// GET /api/auth/users (admin only)
router.get('/users', authMiddleware, adminMiddleware, (req, res) => {
  const users = db.getUsers().map(u => {
    const { passwordHash, ...safe } = u;
    return safe;
  });
  res.json({ users });
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

module.exports = { router, authMiddleware, adminMiddleware, staffMiddleware };
