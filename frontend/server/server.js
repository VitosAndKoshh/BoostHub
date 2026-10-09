const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');
const db = require('./db');

const { router: authRouter } = require('./routes/auth');
const catalogRouter = require('./routes/catalog');
const ordersRouter = require('./routes/orders');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/orders', ordersRouter);

// Chat API endpoint to get chat history for an order or pre-order
app.get('/api/chat/:orderId', (req, res) => {
  const orderId = req.params.orderId;
  const messages = db.getMessages(orderId);
  res.json({ messages });
});

// Socket.io Real-Time Handler
io.on('connection', (socket) => {
  // Join a specific room (order room or general consultation room)
  socket.on('join_room', (room) => {
    socket.join(room);
  });

  // Client or Booster sends message
  socket.on('send_message', (data) => {
    const { orderId, senderId, senderName, senderRole, text } = data;
    if (!text || !text.trim()) return;

    const newMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      orderId: orderId || 'pre_order_consultation',
      senderId: senderId || 'anonymous',
      senderName: senderName || 'User',
      senderRole: senderRole || 'client',
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    db.addMessage(newMessage);

    // Broadcast message to everyone in the room
    const room = orderId || 'pre_order_consultation';
    io.to(room).emit('new_message', newMessage);
  });

  // Typing event
  socket.on('typing', ({ room, userName }) => {
    socket.to(room).emit('user_typing', { userName });
  });

  // Live order progress notification
  socket.on('order_progress_sync', (orderData) => {
    io.emit('order_status_changed', orderData);
  });
});

// Fallback for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`🚀 CyberBoost server running on http://localhost:${PORT}`);
});
