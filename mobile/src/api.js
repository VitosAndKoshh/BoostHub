import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';

const DEFAULT_SERVER_URL = 'http://192.168.1.105:3000';
const STORAGE_KEYS = {
  SERVER_URL: '@cyberboost_server_url',
  AUTH_TOKEN: '@cyberboost_auth_token',
  USER_DATA: '@cyberboost_user_data',
};

let currentSocket = null;

export const api = {
  async getServerUrl() {
    try {
      const url = await AsyncStorage.getItem(STORAGE_KEYS.SERVER_URL);
      return url || DEFAULT_SERVER_URL;
    } catch {
      return DEFAULT_SERVER_URL;
    }
  },

  async setServerUrl(url) {
    try {
      const clean = url.trim().replace(/\/$/, '');
      await AsyncStorage.setItem(STORAGE_KEYS.SERVER_URL, clean);
      if (currentSocket) {
        currentSocket.disconnect();
        currentSocket = null;
      }
      return clean;
    } catch (e) {
      console.error('Failed to save server URL', e);
      return DEFAULT_SERVER_URL;
    }
  },

  async getToken() {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch {
      return null;
    }
  },

  async setToken(token) {
    try {
      if (token) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      }
    } catch (e) {
      console.error('Failed to set token', e);
    }
  },

  async getStoredUser() {
    try {
      const str = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return str ? JSON.parse(str) : null;
    } catch {
      return null;
    }
  },

  async setStoredUser(user) {
    try {
      if (user) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      }
    } catch (e) {
      console.error('Failed to set user', e);
    }
  },

  async request(path, options = {}) {
    const serverUrl = await this.getServerUrl();
    const token = await this.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const fullUrl = `${serverUrl}${path}`;
    const res = await fetch(fullUrl, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}`);
    }
    return data;
  },

  // Auth
  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      await this.setToken(data.token);
      await this.setStoredUser(data.user);
    }
    return data;
  },

  async register(name, email, password, role = 'client') {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    if (data.token) {
      await this.setToken(data.token);
      await this.setStoredUser(data.user);
    }
    return data;
  },

  async logout() {
    await this.setToken(null);
    await this.setStoredUser(null);
  },

  async getProfile() {
    const data = await this.request('/api/auth/me');
    if (data.user) {
      await this.setStoredUser(data.user);
    }
    return data.user;
  },

  async updateProfile(updates) {
    const data = await this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (data.user) {
      await this.setStoredUser(data.user);
    }
    return data.user;
  },

  // Wallet
  async getWallet() {
    return await this.request('/api/auth/wallet');
  },

  async topUpWallet(amount, method = 'card') {
    return await this.request('/api/auth/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ amount, method }),
    });
  },

  async withdrawWallet(amount, details = '') {
    return await this.request('/api/auth/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, details }),
    });
  },

  // Booster Application
  async submitBoosterApplication(appData) {
    return await this.request('/api/auth/booster-application', {
      method: 'POST',
      body: JSON.stringify(appData),
    });
  },

  // Orders
  async getOrders() {
    return await this.request('/api/orders');
  },

  async createOrder(orderData) {
    return await this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Chat
  async getChatMessages(orderId = 'pre_order_consultation') {
    return await this.request(`/api/chat/${orderId}`);
  },

  // Socket.IO Realtime Connection
  async getSocket() {
    if (currentSocket && currentSocket.connected) {
      return currentSocket;
    }

    const serverUrl = await this.getServerUrl();
    if (currentSocket) {
      currentSocket.disconnect();
    }

    currentSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 5000,
    });

    return currentSocket;
  },

  disconnectSocket() {
    if (currentSocket) {
      currentSocket.disconnect();
      currentSocket = null;
    }
  }
};
