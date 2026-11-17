import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { api } from '../api';

export default function OrdersScreen({ currentUser, onOpenChatForOrder, onNavigateToHome, onOpenAuth }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    if (!currentUser) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const data = await api.getOrders();
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      console.log('Failed to load orders', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [currentUser]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in_progress':
        return { label: '⚡ На бусті', bg: 'rgba(0, 240, 255, 0.15)', border: colors.cyan, color: colors.cyan };
      case 'completed':
        return { label: '✅ Виконано', bg: 'rgba(16, 185, 129, 0.15)', border: colors.green, color: colors.green };
      case 'pending':
      default:
        return { label: '⏳ Очікує бустера', bg: 'rgba(255, 215, 0, 0.15)', border: colors.gold, color: colors.gold };
    }
  };

  if (!currentUser) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.cyan} />
        <Text style={styles.emptyTitle}>Вхід у систему</Text>
        <Text style={styles.emptySubtitle}>
          Щоб переглядати ваші замовлення, будь ласка, авторизуйтесь у своєму акаунті.
        </Text>
        <TouchableOpacity style={styles.btnAction} onPress={onOpenAuth}>
          <Text style={styles.btnActionText}>Увійти в акаунт</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.cyan} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Мої замовлення</Text>
          <Text style={styles.subtitle}>Відстежуйте прогрес бустингу в реальному часі</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="reload" size={16} color={colors.cyan} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.cyan} />
          <Text style={styles.loadingText}>Завантаження списку замовлень...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="cube-outline" size={44} color={colors.textDim} />
          <Text style={styles.emptyCardTitle}>Замовлень поки немає</Text>
          <Text style={styles.emptyCardText}>
            Розрахуйте вартість та створіть свій перший буст в нашому зручному калькуляторі!
          </Text>
          <TouchableOpacity style={styles.btnAction} onPress={onNavigateToHome}>
            <Text style={styles.btnActionText}>⚡ Розрахувати буст</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.ordersList}>
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);
            const progress = order.progress || (order.status === 'completed' ? 100 : (order.status === 'in_progress' ? 50 : 10));

            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.cardTop}>
                  <View style={styles.gameInfoRow}>
                    <Text style={styles.gameTitle}>🎮 {order.game || 'Game'}</Text>
                    <Text style={styles.orderId}>#{order.id.slice(0, 8)}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                    <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                {/* Rank progression */}
                <View style={styles.ranksFlow}>
                  <View style={styles.rankBox}>
                    <Text style={styles.rankFlowLabel}>Поточний</Text>
                    <Text style={styles.rankFlowVal}>{order.currentRank || 'Ранг 1'}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color={colors.cyan} />
                  <View style={styles.rankBox}>
                    <Text style={styles.rankFlowLabel}>Бажаний</Text>
                    <Text style={[styles.rankFlowVal, { color: colors.gold }]}>{order.targetRank || 'Ранг 2'}</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressSection}>
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabel}>Прогрес виконання:</Text>
                    <Text style={styles.progressVal}>{progress}%</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                  </View>
                </View>

                {/* Footer with price & chat button */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.footerPriceLbl}>Вартість:</Text>
                    <Text style={styles.footerPriceVal}>{order.priceUAH || order.price || 450} ₴</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.chatBtn}
                    onPress={() => onOpenChatForOrder && onOpenChatForOrder(order.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chatbubbles" size={15} color="#000" />
                    <Text style={styles.chatBtnText}>Чат замовлення</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textMain,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textMain,
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textMain,
    marginTop: 10,
  },
  emptyCardText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
    marginBottom: 16,
  },
  btnAction: {
    backgroundColor: colors.cyan,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  btnActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
  },
  ordersList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gameInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gameTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textMain,
  },
  orderId: {
    fontSize: 11,
    color: colors.textDim,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ranksFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    padding: 10,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rankBox: {
    flex: 1,
  },
  rankFlowLabel: {
    fontSize: 10,
    color: colors.textDim,
    marginBottom: 2,
  },
  rankFlowVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.cyan,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: colors.textDim,
  },
  progressVal: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.cyan,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.cyan,
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerPriceLbl: {
    fontSize: 10,
    color: colors.textDim,
  },
  footerPriceVal: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.green,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cyan,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chatBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
});
