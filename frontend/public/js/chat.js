// Real-Time Socket.IO Live Chat Manager

let socket = null;
let activeChatRoom = 'pre_order_consultation';
let chatOrderContext = null;

function initSocketChat() {
  if (typeof io !== 'undefined') {
    socket = io();

    socket.on('connect', () => {
      console.log('Connected to CyberBoost Real-Time Socket');
      if (activeChatRoom) {
        socket.emit('join_room', activeChatRoom);
      }
    });

    socket.on('new_message', (msg) => {
      if (msg.orderId === activeChatRoom) {
        appendMessageToUI(msg);
        sounds.playPing();
      } else {
        // Notification for background room message
        notify.show({
          title: `Нове повідомлення від ${msg.senderName}`,
          message: msg.text,
          type: 'chat',
          sound: 'ping'
        });
      }
    });

    socket.on('order_status_changed', (orderData) => {
      notify.show({
        title: `Оновлення по замовленню ${orderData.id}!`,
        message: `Статус: ${orderData.status} | Прогрес: ${orderData.progressRank || ''} (${orderData.progressPercent}%)`,
        type: 'rankup',
        sound: 'rankup'
      });
      // Refresh current tracker if open
      if (typeof refreshActiveTrackerOrder === 'function') {
        refreshActiveTrackerOrder(orderData.id);
      }
      if (typeof reloadDashboardOrders === 'function') {
        reloadDashboardOrders();
      }
    });

    socket.on('user_typing', ({ userName }) => {
      const typingEl = document.getElementById('chat-typing-indicator');
      if (typingEl) {
        typingEl.textContent = `${userName} ${t('chat_typing')}`;
        typingEl.style.display = 'block';
        setTimeout(() => {
          typingEl.style.display = 'none';
        }, 2000);
      }
    });
  }
}

// Open chat window (for general pre-order consultation or specific order)
async function openLiveChat(orderId = null, orderTitle = null) {
  const chatModal = document.getElementById('chat-drawer');
  const chatOverlay = document.getElementById('chat-overlay');
  const headerTitle = document.getElementById('chat-header-title');
  const headerSub = document.getElementById('chat-header-sub');

  activeChatRoom = orderId || 'pre_order_consultation';
  chatOrderContext = orderId;

  if (headerTitle) {
    headerTitle.textContent = orderId
      ? `Чат замовлення ${orderId}`
      : `Онлайн-консультація перед замовленням`;
  }

  if (headerSub) {
    headerSub.textContent = orderTitle || 'Підтримка 24/7 та перевірені бустери онлайн';
  }

  if (socket && socket.connected) {
    socket.emit('join_room', activeChatRoom);
  }

  if (chatModal) chatModal.classList.add('open');
  if (chatOverlay) chatOverlay.classList.add('open');

  await loadChatHistory(activeChatRoom);
}

function closeLiveChat() {
  const chatModal = document.getElementById('chat-drawer');
  const chatOverlay = document.getElementById('chat-overlay');
  if (chatModal) chatModal.classList.remove('open');
  if (chatOverlay) chatOverlay.classList.remove('open');
}

// Load message history from API
async function loadChatHistory(roomId) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  container.innerHTML = '<div class="chat-loading"><div class="spinner"></div> Завантаження повідомлень...</div>';

  try {
    const res = await fetch(`/api/chat/${roomId}`);
    const data = await res.json();
    const messages = data.messages || [];

    if (messages.length === 0) {
      container.innerHTML = `
        <div class="empty-chat">
          <div class="empty-icon">💬</div>
          <p>Немає повідомлень. Почніть діалог першим!</p>
        </div>
      `;
    } else {
      container.innerHTML = '';
      messages.forEach(msg => appendMessageToUI(msg, false));
    }

    scrollChatToBottom();
  } catch (err) {
    console.error('Chat load error:', err);
  }
}

// Append message item into DOM
function appendMessageToUI(msg, autoScroll = true) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  // Clear empty state if present
  const emptyState = container.querySelector('.empty-chat');
  if (emptyState) emptyState.remove();

  const isMe = currentUser && (msg.senderId === currentUser.id);
  const msgEl = document.createElement('div');
  msgEl.className = `chat-msg ${isMe ? 'msg-outgoing' : 'msg-incoming'} ${msg.senderRole === 'system' ? 'msg-system' : ''}`;

  const roleLabelMap = {
    admin: '<span class="role-badge role-admin">Адміністратор</span>',
    booster: '<span class="role-badge role-booster">Бустер PRO</span>',
    client: '<span class="role-badge role-client">Клієнт</span>',
    system: '<span class="role-badge role-system">Система</span>'
  };

  const roleBadge = roleLabelMap[msg.senderRole] || '';
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  msgEl.innerHTML = `
    <div class="msg-bubble">
      <div class="msg-header">
        <span class="msg-author">${msg.senderName}</span>
        ${roleBadge}
        <span class="msg-time">${time}</span>
      </div>
      <div class="msg-text">${escapeHtml(msg.text)}</div>
    </div>
  `;

  container.appendChild(msgEl);
  if (autoScroll) scrollChatToBottom();
}

// Send Message
function handleSendMessage(event) {
  if (event) event.preventDefault();
  const input = document.getElementById('chat-input-text');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  const senderId = currentUser ? currentUser.id : 'guest_' + Math.random().toString(36).substr(2, 5);
  const senderName = currentUser ? currentUser.name : 'Гість';
  const senderRole = currentUser ? currentUser.role : 'client';

  const payload = {
    orderId: activeChatRoom,
    senderId,
    senderName,
    senderRole,
    text
  };

  if (socket && socket.connected) {
    socket.emit('send_message', payload);
  } else {
    // Fallback direct UI append for offline
    appendMessageToUI({
      ...payload,
      id: 'local_' + Date.now(),
      timestamp: new Date().toISOString()
    });
  }

  input.value = '';
  input.focus();
}

function handleChatInputKeypress(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
}

function scrollChatToBottom() {
  const container = document.getElementById('chat-messages-container');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

function escapeHtml(string) {
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
