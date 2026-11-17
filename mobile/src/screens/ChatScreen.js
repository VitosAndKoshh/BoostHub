import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { api } from '../api';

export default function ChatScreen({ currentUser, activeOrderId = 'pre_order_consultation', onOpenAuth }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    let socketInstance = null;
    let isMounted = true;

    async function initChat() {
      try {
        // 1. Fetch existing message history
        const data = await api.getChatMessages(activeOrderId);
        if (isMounted && data.messages) {
          setMessages(data.messages);
        }

        // 2. Connect to Socket.io
        socketInstance = await api.getSocket();
        
        socketInstance.on('connect', () => {
          if (isMounted) setSocketConnected(true);
          socketInstance.emit('join_room', activeOrderId);
        });

        socketInstance.on('disconnect', () => {
          if (isMounted) setSocketConnected(false);
        });

        socketInstance.on('new_message', (msg) => {
          if (isMounted && (msg.orderId === activeOrderId || (!msg.orderId && activeOrderId === 'pre_order_consultation'))) {
            setMessages((prev) => [...prev, msg]);
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        });

        if (socketInstance.connected) {
          if (isMounted) setSocketConnected(true);
          socketInstance.emit('join_room', activeOrderId);
        }
      } catch (err) {
        console.log('Chat initialization error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initChat();

    return () => {
      isMounted = false;
      if (socketInstance) {
        socketInstance.off('new_message');
        socketInstance.off('connect');
        socketInstance.off('disconnect');
      }
    };
  }, [activeOrderId]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;

    const senderName = currentUser ? currentUser.name : 'Гість';
    const senderId = currentUser ? currentUser.id : 'guest_' + Date.now();
    const senderRole = currentUser ? currentUser.role : 'client';

    const msgPayload = {
      orderId: activeOrderId,
      senderId,
      senderName,
      senderRole,
      text,
    };

    setInputText('');

    try {
      const socket = await api.getSocket();
      socket.emit('send_message', msgPayload);
    } catch (e) {
      console.log('Socket send error:', e);
    }
  };

  const sendQuickPrompt = (text) => {
    setInputText(text);
  };

  const renderMessageItem = ({ item }) => {
    const isMe = currentUser ? item.senderId === currentUser.id : false;
    const isBooster = item.senderRole === 'booster';
    const isAdmin = item.senderRole === 'admin';

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          {!isMe && (
            <View style={styles.senderHeader}>
              <Text style={styles.senderName}>{item.senderName || 'Користувач'}</Text>
              {isBooster && (
                <View style={styles.roleBadgeBooster}>
                  <Text style={styles.roleBadgeText}>⚡ Бустер</Text>
                </View>
              )}
              {isAdmin && (
                <View style={styles.roleBadgeAdmin}>
                  <Text style={styles.roleBadgeText}>🛡️ Підтримка</Text>
                </View>
              )}
            </View>
          )}

          <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
            {item.text}
          </Text>

          <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
            {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Top Channel Bar */}
      <View style={styles.channelBar}>
        <View style={styles.channelLeft}>
          <View style={[styles.socketDot, socketConnected ? styles.dotGreen : styles.dotOrange]} />
          <View>
            <Text style={styles.channelTitle}>
              {activeOrderId === 'pre_order_consultation' ? '💬 Онлайн консультація CyberBoost' : `📦 Чат замовлення #${activeOrderId.slice(0, 8)}`}
            </Text>
            <Text style={styles.channelStatus}>
              {socketConnected ? '🟢 Підключено до Live Socket' : '🟠 З\'єднання з сервером...'}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages Feed */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.cyan} />
          <Text style={styles.loadingText}>Завантаження історії повідомлень...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id || String(Math.random())}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyChatBox}>
              <Ionicons name="chatbubbles-outline" size={40} color={colors.textDim} />
              <Text style={styles.emptyChatTitle}>Почніть розмову</Text>
              <Text style={styles.emptyChatDesc}>
                Задайте будь-яке запитання щодо бустингу, термінів або зв'яжіться з вашим бустером!
              </Text>
            </View>
          }
        />
      )}

      {/* Quick Prompt Chips */}
      <View style={styles.quickPrompts}>
        <TouchableOpacity style={styles.quickChip} onPress={() => sendQuickPrompt('Привіт! Як швидко почнеться буст?')}>
          <Text style={styles.quickChipText}>⚡ Коли початок?</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickChip} onPress={() => sendQuickPrompt('Які гарантії збереження акаунту?')}>
          <Text style={styles.quickChipText}>🛡️ Безпека</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickChip} onPress={() => sendQuickPrompt('Я готовий почати гру в Duo!')}>
          <Text style={styles.quickChipText}>🎮 Готовий до Duo</Text>
        </TouchableOpacity>
      </View>

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Напишіть повідомлення..."
          placeholderTextColor={colors.textDim}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={17} color={inputText.trim() ? '#000' : colors.textDim} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  channelBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  channelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  socketDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: {
    backgroundColor: colors.green,
  },
  dotOrange: {
    backgroundColor: colors.orange,
  },
  channelTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMain,
  },
  channelStatus: {
    fontSize: 10,
    color: colors.textDim,
    marginTop: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  emptyChatBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyChatTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textMain,
    marginTop: 10,
  },
  emptyChatDesc: {
    fontSize: 12,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  msgRowMe: {
    justifyContent: 'flex-end',
  },
  msgRowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: 'rgba(0, 240, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.45)',
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderBottomLeftRadius: 2,
  },
  senderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.cyan,
  },
  roleBadgeBooster: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  roleBadgeAdmin: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.gold,
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
  },
  msgTextMe: {
    color: colors.textMain,
  },
  msgTextOther: {
    color: colors.textMain,
  },
  msgTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  msgTimeMe: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  msgTimeOther: {
    color: colors.textDim,
  },
  quickPrompts: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  quickChip: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quickChipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textMain,
    maxHeight: 80,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
