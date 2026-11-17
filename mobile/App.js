import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { colors } from './src/theme';
import { api } from './src/api';
import Header from './src/components/Header';
import TabBar from './src/components/TabBar';
import ServerConfigModal from './src/components/ServerConfigModal';
import AuthModal from './src/components/AuthModal';

import HomeScreen from './src/screens/HomeScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [serverStatus, setServerStatus] = useState('connected');
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [activeChatOrderId, setActiveChatOrderId] = useState('pre_order_consultation');

  const checkConnectionAndUser = async () => {
    try {
      const serverUrl = await api.getServerUrl();
      const res = await fetch(`${serverUrl}/api/catalog/games`, { method: 'GET' }).catch(() => null);
      if (res && res.ok) {
        setServerStatus('connected');
      } else {
        setServerStatus('offline');
      }
    } catch {
      setServerStatus('offline');
    }

    try {
      const user = await api.getProfile().catch(() => null);
      if (user) {
        setCurrentUser(user);
      } else {
        const stored = await api.getStoredUser().catch(() => null);
        if (stored) setCurrentUser(stored);
      }
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    checkConnectionAndUser();
  }, []);

  const handleOpenChatForOrder = (orderId) => {
    setActiveChatOrderId(orderId || 'pre_order_consultation');
    setActiveTab('chat');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="light" backgroundColor="#0a0b10" />

        {/* Global App Header */}
        <Header
          currentUser={currentUser}
          serverStatus={serverStatus}
          onOpenServerConfig={() => setServerModalVisible(true)}
          onOpenAuth={() => setAuthModalVisible(true)}
        />

        {/* Screen Switcher */}
        <View style={styles.content}>
          {activeTab === 'home' && (
            <HomeScreen
              currentUser={currentUser}
              onNavigateToOrders={() => setActiveTab('orders')}
              onOpenAuth={() => setAuthModalVisible(true)}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersScreen
              currentUser={currentUser}
              onOpenChatForOrder={handleOpenChatForOrder}
              onNavigateToHome={() => setActiveTab('home')}
              onOpenAuth={() => setAuthModalVisible(true)}
            />
          )}

          {activeTab === 'chat' && (
            <ChatScreen
              currentUser={currentUser}
              activeOrderId={activeChatOrderId}
              onOpenAuth={() => setAuthModalVisible(true)}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileScreen
              currentUser={currentUser}
              onUpdateUser={(u) => setCurrentUser(u)}
              onOpenAuth={() => setAuthModalVisible(true)}
            />
          )}
        </View>

        {/* Global Bottom Tab Bar */}
        <TabBar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        {/* Modals */}
        <ServerConfigModal
          visible={serverModalVisible}
          onClose={() => setServerModalVisible(false)}
          onServerChanged={checkConnectionAndUser}
        />

        <AuthModal
          visible={authModalVisible}
          onClose={() => setAuthModalVisible(false)}
          currentUser={currentUser}
          onAuthSuccess={(user) => setCurrentUser(user)}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
  },
});
