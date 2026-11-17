import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { api } from '../api';

export default function ServerConfigModal({ visible, onClose, onServerChanged }) {
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (visible) {
      api.getServerUrl().then((saved) => {
        setUrl(saved);
        setTestResult(null);
      });
    }
  }, [visible]);

  const testConnection = async (testUrl) => {
    const target = (testUrl || url).trim().replace(/\/$/, '');
    if (!target) return;
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(`${target}/api/catalog/games`, { method: 'GET' });
      if (res.ok) {
        setTestResult({ success: true, message: '✅ Підключено успішно! Сервер CyberBoost доступний.' });
      } else {
        setTestResult({ success: false, message: `⚠️ Сервер відповів з помилкою: ${res.status}` });
      }
    } catch (err) {
      setTestResult({ success: false, message: `❌ Не вдалося з'єднатися: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    const clean = url.trim().replace(/\/$/, '');
    if (!clean) {
      Alert.alert('Помилка', 'Введіть коректну адресу сервера');
      return;
    }
    await api.setServerUrl(clean);
    onServerChanged && onServerChanged(clean);
    onClose();
  };

  const setPreset = (presetUrl) => {
    setUrl(presetUrl);
    testConnection(presetUrl);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="server" size={20} color={colors.cyan} />
              <Text style={styles.title}>Адреса Сервера (API)</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={colors.textDim} />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Вкажіть адресу запущеного бекенду CyberBoost. Якщо тестуєте на фізичному телефоні — використовуйте локальну IP адресу комп'ютера в Wi-Fi мережі.
          </Text>

          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="http://192.168.1.105:3000"
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.presetsRow}>
            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => setPreset('http://192.168.1.105:3000')}
            >
              <Text style={styles.presetChipText}>📡 Wi-Fi (192.168.1.105:3000)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => setPreset('http://localhost:3000')}
            >
              <Text style={styles.presetChipText}>💻 Localhost (3000)</Text>
            </TouchableOpacity>
          </View>

          {testing && (
            <View style={styles.testingRow}>
              <ActivityIndicator size="small" color={colors.cyan} />
              <Text style={styles.testingText}>Перевірка зв'язку з сервером...</Text>
            </View>
          )}

          {testResult && (
            <View style={[styles.resultBox, testResult.success ? styles.resultSuccess : styles.resultError]}>
              <Text style={[styles.resultText, testResult.success ? styles.textSuccess : styles.textError]}>
                {testResult.message}
              </Text>
            </View>
          )}

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => testConnection()}
              disabled={testing}
            >
              <Text style={styles.btnSecondaryText}>Тест зв'язку</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleSave}>
              <Text style={styles.btnPrimaryText}>Зберегти</Text>
            </TouchableOpacity>
          </View>
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
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textMain,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.cyan,
    marginBottom: 12,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  presetChipText: {
    fontSize: 11,
    color: colors.cyan,
    fontWeight: '600',
  },
  testingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  testingText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  resultBox: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  resultSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  resultError: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  resultText: {
    fontSize: 12,
    fontWeight: '600',
  },
  textSuccess: {
    color: colors.green,
  },
  textError: {
    color: colors.danger,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: colors.textMain,
    fontSize: 13,
    fontWeight: '700',
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: colors.cyan,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
});
