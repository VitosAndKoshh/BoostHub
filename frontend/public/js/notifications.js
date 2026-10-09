// Notification & Sound System (In-App Toasts + Web Audio Synthesizer + Web Push API)

class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('cyberboost_sound_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playPing() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  playSuccess() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => { // C5, E5, G5, C6
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.18, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.3);
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  playRankUp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.12, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.35);
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }
}

const sounds = new SoundFX();

// Toast notification manager
class NotificationManager {
  constructor() {
    this.container = document.getElementById('toast-container');
    this.hasPushPermission = (typeof Notification !== 'undefined' && Notification.permission === 'granted');
  }

  show({ title, message, type = 'info', sound = 'ping', duration = 4500 }) {
    if (!this.container) {
      this.container = document.getElementById('toast-container');
    }

    if (sound === 'ping') sounds.playPing();
    if (sound === 'success') sounds.playSuccess();
    if (sound === 'rankup') sounds.playRankUp();

    // Show native Web Push if permitted
    if (this.hasPushPermission && document.hidden) {
      try {
        new Notification(title, {
          body: message,
          icon: '/img/logo.png'
        });
      } catch (e) {
        console.warn('Push error:', e);
      }
    }

    if (!this.container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-in`;

    const iconMap = {
      success: '✓',
      info: '⚡',
      warning: '⚠️',
      rankup: '🔥',
      chat: '💬'
    };

    toast.innerHTML = `
      <div class="toast-icon">${iconMap[type] || '⚡'}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  async requestPushPermission() {
    if (typeof Notification === 'undefined') {
      this.show({ title: 'Сповіщення', message: 'Ваш браузер не підтримує Web Push', type: 'warning' });
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        this.hasPushPermission = true;
        this.show({
          title: 'Push-сповіщення увімкнено! 🔔',
          message: 'Ви отримуватимете оновлення про старт замовлень і повідомлення бустера навіть при згорнутому браузері.',
          type: 'success',
          sound: 'success'
        });
      } else {
        this.show({ title: 'Сповіщення вимкнено', message: 'Ви можете увімкнути їх у налаштуваннях браузера', type: 'info' });
      }
    } catch (e) {
      console.warn('Permission request error:', e);
    }
  }
}

const notify = new NotificationManager();
