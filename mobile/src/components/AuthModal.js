import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { api } from '../api';

export default function AuthModal({ visible, onClose, currentUser, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('client');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Помилка', 'Введіть Email та Пароль');
      return;
    }
    if (isRegister && !name.trim()) {
      Alert.alert('Помилка', 'Введіть ваше ім\'я');
      return;
    }

    setLoading(true);
    try {
      let data;
      if (isRegister) {
        data = await api.register(name.trim(), email.trim(), password.trim(), role);
      } else {
        data = await api.login(email.trim(), password.trim());
      }

      onAuthSuccess && onAuthSuccess(data.user);
      onClose();
      Alert.alert('Успішно', `Вітаємо, ${data.user.name}!`);
    } catch (err) {
      Alert.alert('Помилка авторизації', err.message || 'Невірні дані');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (quickEmail, quickPass) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setLoading(true);
    try {
      const data = await api.login(quickEmail, quickPass);
      onAuthSuccess && onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      Alert.alert('Помилка', err.message || 'Не вдалося увійти');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    onAuthSuccess && onAuthSuccess(null);
    onClose();
  };

  if (currentUser) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <View style={styles.header}>
              <Text style={styles.title}>Мій акаунт</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color={colors.textDim} />
              </TouchableOpacity>
            </View>

            <View style={styles.userInfoRow}>
              <View style={styles.userAvatarBox}>
                <Text style={styles.userAvatarText}>{currentUser.name?.charAt(0) || 'U'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userNameText}>{currentUser.name}</Text>
                <Text style={styles.userEmailText}>{currentUser.email}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>
                    {currentUser.role === 'booster' ? '⚡ Бустер' : (currentUser.role === 'admin' ? '🛡️ Адміністратор' : '👤 Клієнт')}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              <Text style={styles.btnLogoutText}>Вийти з акаунту</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>{isRegister ? 'Створити акаунт' : 'Вхід у CyberBoost'}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color={colors.textDim} />
              </TouchableOpacity>
            </View>

            {isRegister && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ваше ім'я / Нікнейм:</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Alex_Pro"
                  placeholderTextColor={colors.textDim}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email адреса:</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="client@boost.gg"
                placeholderTextColor={colors.textDim}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Пароль:</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textDim}
                secureTextEntry
              />
            </View>

            {isRegister && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Я хочу бути:</Text>
                <View style={styles.roleSelectRow}>
                  <TouchableOpacity
                    style={[styles.roleSelectBtn, role === 'client' && styles.roleSelectBtnActive]}
                    onPress={() => setRole('client')}
                  >
                    <Text style={[styles.roleSelectText, role === 'client' && styles.roleSelectTextActive]}>
                      👤 Клієнт
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleSelectBtn, role === 'booster' && styles.roleSelectBtnActive]}
                    onPress={() => setRole('booster')}
                  >
                    <Text style={[styles.roleSelectText, role === 'booster' && styles.roleSelectTextActive]}>
                      ⚡ Бустер
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.btnPrimaryText}>{isRegister ? 'Зареєструватися' : 'Увійти'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleModeBtn}
              onPress={() => setIsRegister(!isRegister)}
            >
              <Text style={styles.toggleModeText}>
                {isRegister ? 'Вже маєте акаунт? Увійти' : 'Немає акаунту? Зареєструватися'}
              </Text>
            </TouchableOpacity>

            <View style={styles.quickLoginDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Швидкий тестовий вхід</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.quickButtonsRow}>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => quickLogin('client@boost.gg', 'client123')}
              >
                <Text style={styles.quickBtnText}>👤 Клієнт</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => quickLogin('booster@boost.gg', 'booster123')}
              >
                <Text style={styles.quickBtnText}>⚡ Бустер</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => quickLogin('admin@cyberboost.gg', 'admin123')}
              >
                <Text style={styles.quickBtnText}>🛡️ Адмін</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textMain,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    color: colors.cyan,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textMain,
  },
  roleSelectRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleSelectBtn: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  roleSelectBtnActive: {
    borderColor: colors.cyan,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
  },
  roleSelectText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  roleSelectTextActive: {
    color: colors.cyan,
    fontWeight: '800',
  },
  btnPrimary: {
    backgroundColor: colors.cyan,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  btnPrimaryText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
  toggleModeBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleModeText: {
    fontSize: 12,
    color: colors.cyan,
    fontWeight: '600',
  },
  quickLoginDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  dividerText: {
    paddingHorizontal: 10,
    fontSize: 11,
    color: colors.textDim,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickBtnText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: 16,
  },
  userAvatarBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    borderWidth: 1,
    borderColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.cyan,
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textMain,
  },
  userEmailText: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    color: colors.cyan,
    fontWeight: '700',
  },
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 10,
    paddingVertical: 12,
  },
  btnLogoutText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
});
