import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { api } from '../api';

const GAMES = [
  { id: 'cs2', name: 'CS2', icon: '💣', ranks: ['Silver 1', 'Gold Nova 3', 'Master Guardian', 'LEM', 'Global Elite', 'Faceit 10 (2500+ ELO)'] },
  { id: 'dota2', name: 'Dota 2', icon: '🛡️', ranks: ['Herald (100 MMR)', 'Guardian (1000 MMR)', 'Crusader (2000 MMR)', 'Archon (3000 MMR)', 'Legend (4000 MMR)', 'Ancient (4500 MMR)', 'Divine (5000 MMR)', 'Immortal (6000+ MMR)'] },
  { id: 'valorant', name: 'Valorant', icon: '🎯', ranks: ['Iron 1', 'Bronze 2', 'Silver 3', 'Gold 2', 'Platinum 3', 'Diamond 2', 'Ascendant 3', 'Immortal', 'Radiant'] },
  { id: 'apex', name: 'Apex Legends', icon: '🔥', ranks: ['Rookie', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Apex Predator'] },
  { id: 'lol', name: 'League of Legends', icon: '⚔️', ranks: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Challenger'] },
];

export default function HomeScreen({ currentUser, onNavigateToOrders, onOpenAuth }) {
  const [selectedGame, setSelectedGame] = useState(GAMES[0]);
  const [currentRankIdx, setCurrentRankIdx] = useState(1);
  const [targetRankIdx, setTargetRankIdx] = useState(3);
  const [isDuo, setIsDuo] = useState(false);
  const [isTurbo, setIsTurbo] = useState(false);
  const [isStream, setIsStream] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Price Calculation Logic
  const rankDiff = Math.max(1, targetRankIdx - currentRankIdx);
  const basePriceUAH = 250 + rankDiff * 180;
  const duoMultiplier = isDuo ? 1.35 : 1.0;
  const turboMultiplier = isTurbo ? 1.25 : 1.0;
  const streamMultiplier = isStream ? 1.15 : 1.0;

  const finalPriceUAH = Math.round(basePriceUAH * duoMultiplier * turboMultiplier * streamMultiplier);
  const finalPriceUSD = Math.round(finalPriceUAH / 41.5);

  const handleOrder = async () => {
    if (!currentUser) {
      Alert.alert(
        'Потрібна авторизація',
        'Для оформлення замовлення, будь ласка, увійдіть або зареєструйтесь.',
        [
          { text: 'Скасувати', style: 'cancel' },
          { text: 'Увійти', onPress: onOpenAuth },
        ]
      );
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        game: selectedGame.name,
        service: 'Рейтинг буст',
        currentRank: selectedGame.ranks[currentRankIdx],
        targetRank: selectedGame.ranks[targetRankIdx],
        options: {
          duo: isDuo,
          turbo: isTurbo,
          stream: isStream,
        },
        priceUAH: finalPriceUAH,
        priceUSD: finalPriceUSD,
      };

      await api.createOrder(orderData);
      Alert.alert(
        'Замовлення створено! ⚡',
        `Ваше замовлення на ${selectedGame.name} (${orderData.currentRank} ➔ ${orderData.targetRank}) прийнято в обробку.`,
        [
          { text: 'Переглянути замовлення', onPress: onNavigateToOrders },
        ]
      );
    } catch (err) {
      Alert.alert('Помилка', err.message || 'Не вдалося створити замовлення');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Header */}
      <View style={styles.heroSection}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>⚡ ТОП-1 СЕРВІС В УКРАЇНІ</Text>
        </View>
        <Text style={styles.heroTitle}>
          ВСІ ГЕЙМІНГ ПОСЛУГИ{'\n'}В ПАРІ КЛІКІВ ДО ПЕРЕМОГИ
        </Text>
        <Text style={styles.heroSubtitle}>
          Професійний бустинг рейтингу, калібрування та супровід від Pro-гравців.
        </Text>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statVal}>14,800+</Text>
          <Text style={styles.statLbl}>Замовлень</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statVal}>99.4%</Text>
          <Text style={styles.statLbl}>Вінрейт</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statVal}>10 хв</Text>
          <Text style={styles.statLbl}>Старт</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statVal, { color: colors.gold }]}>⭐ 4.98</Text>
          <Text style={styles.statLbl}>Оцінка</Text>
        </View>
      </View>

      {/* Game Selector Chips */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🎮 Оберіть гру</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gamesScroll}>
        {GAMES.map((game) => {
          const isSelected = selectedGame.id === game.id;
          return (
            <TouchableOpacity
              key={game.id}
              style={[styles.gameChip, isSelected && styles.gameChipActive]}
              onPress={() => {
                setSelectedGame(game);
                setCurrentRankIdx(0);
                setTargetRankIdx(Math.min(2, game.ranks.length - 1));
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.gameChipIcon}>{game.icon}</Text>
              <Text style={[styles.gameChipText, isSelected && styles.gameChipTextActive]}>
                {game.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Calculator Card */}
      <View style={styles.calcCard}>
        <View style={styles.calcHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="calculator-outline" size={18} color={colors.cyan} />
            <Text style={styles.calcTitle}>Калькулятор рангу ({selectedGame.name})</Text>
          </View>
          <View style={styles.instantTag}>
            <Text style={styles.instantTagText}>⚡ Миттєвий розрахунок</Text>
          </View>
        </View>

        {/* Current Rank Picker */}
        <View style={styles.rankRow}>
          <Text style={styles.rankLabel}>Ваш поточний ранг:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ranksScroll}>
            {selectedGame.ranks.map((rank, idx) => (
              <TouchableOpacity
                key={rank}
                style={[styles.rankPill, currentRankIdx === idx && styles.rankPillActiveCurrent]}
                onPress={() => {
                  setCurrentRankIdx(idx);
                  if (targetRankIdx <= idx) {
                    setTargetRankIdx(Math.min(idx + 1, selectedGame.ranks.length - 1));
                  }
                }}
              >
                <Text style={[styles.rankPillText, currentRankIdx === idx && styles.rankPillTextActive]}>
                  {rank}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Target Rank Picker */}
        <View style={styles.rankRow}>
          <Text style={styles.rankLabel}>Бажаний ранг (Ціль):</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ranksScroll}>
            {selectedGame.ranks.map((rank, idx) => {
              const isTargetActive = targetRankIdx === idx;
              const isBelowCurrent = idx <= currentRankIdx;
              return (
                <TouchableOpacity
                  key={rank}
                  disabled={isBelowCurrent}
                  style={[
                    styles.rankPill,
                    isTargetActive && styles.rankPillActiveTarget,
                    isBelowCurrent && styles.rankPillDisabled,
                  ]}
                  onPress={() => setTargetRankIdx(idx)}
                >
                  <Text
                    style={[
                      styles.rankPillText,
                      isTargetActive && styles.rankPillTextActiveGold,
                      isBelowCurrent && styles.rankPillTextDisabled,
                    ]}
                  >
                    {rank}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Extra Boost Options */}
        <Text style={styles.optionsTitle}>Додаткові опції:</Text>
        <View style={styles.optionsGrid}>
          <TouchableOpacity
            style={[styles.optionCard, isDuo && styles.optionCardActive]}
            onPress={() => setIsDuo(!isDuo)}
            activeOpacity={0.7}
          >
            <Ionicons name={isDuo ? 'checkbox' : 'square-outline'} size={18} color={isDuo ? colors.cyan : colors.textDim} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.optionLabel}>Duo Гра з бустером (+35%)</Text>
              <Text style={styles.optionSub}>Граєте разом у команді без передачі акаунту</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, isTurbo && styles.optionCardActive]}
            onPress={() => setIsTurbo(!isTurbo)}
            activeOpacity={0.7}
          >
            <Ionicons name={isTurbo ? 'checkbox' : 'square-outline'} size={18} color={isTurbo ? colors.cyan : colors.textDim} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.optionLabel}>Турбо швидкість (+25%)</Text>
              <Text style={styles.optionSub}>Пріоритетний старт до 10 хвилин</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, isStream && styles.optionCardActive]}
            onPress={() => setIsStream(!isStream)}
            activeOpacity={0.7}
          >
            <Ionicons name={isStream ? 'checkbox' : 'square-outline'} size={18} color={isStream ? colors.cyan : colors.textDim} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.optionLabel}>Пряма трансляція гри (+15%)</Text>
              <Text style={styles.optionSub}>Закритий стрім на Twitch / Discord</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Price & Order Action */}
        <View style={styles.checkoutBar}>
          <View>
            <Text style={styles.priceLabel}>Разом до сплати:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={styles.priceUAH}>{finalPriceUAH} ₴</Text>
              <Text style={styles.priceUSD}>(${finalPriceUSD})</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.orderBtn}
            onPress={handleOrder}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.orderBtnText}>Замовити буст</Text>
                <Ionicons name="arrow-forward" size={16} color="#000" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Security & Guarantees */}
      <View style={styles.guaranteeBox}>
        <View style={styles.guaranteeItem}>
          <Ionicons name="shield-checkmark" size={20} color={colors.green} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.guaranteeTitle}>Повна безпека та VPN</Text>
            <Text style={styles.guaranteeDesc}>Бустери використовують зашифроване підключення вашої країни.</Text>
          </View>
        </View>
        <View style={[styles.guaranteeItem, { marginTop: 12 }]}>
          <Ionicons name="lock-closed" size={20} color={colors.cyan} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.guaranteeTitle}>Збереження інвентарю</Text>
            <Text style={styles.guaranteeDesc}>Безпека скінів та речей на 100% гарантована платформою.</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.cyan,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textMain,
    lineHeight: 28,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.cyan,
  },
  statLbl: {
    fontSize: 10,
    color: colors.textDim,
    marginTop: 2,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textMain,
  },
  gamesScroll: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  gameChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  gameChipActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderColor: colors.cyan,
  },
  gameChipIcon: {
    fontSize: 16,
  },
  gameChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  gameChipTextActive: {
    color: colors.cyan,
  },
  calcCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  calcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calcTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.cyan,
  },
  instantTag: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  instantTagText: {
    fontSize: 10,
    color: colors.gold,
    fontWeight: '700',
  },
  rankRow: {
    marginBottom: 12,
  },
  rankLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  ranksScroll: {
    gap: 6,
  },
  rankPill: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  rankPillActiveCurrent: {
    borderColor: colors.cyan,
    backgroundColor: 'rgba(0, 240, 255, 0.18)',
  },
  rankPillActiveTarget: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
  },
  rankPillDisabled: {
    opacity: 0.4,
  },
  rankPillText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  rankPillTextActive: {
    color: colors.cyan,
    fontWeight: '800',
  },
  rankPillTextActiveGold: {
    color: colors.gold,
    fontWeight: '800',
  },
  rankPillTextDisabled: {
    color: colors.textDim,
  },
  optionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.cyan,
    marginTop: 4,
    marginBottom: 8,
  },
  optionsGrid: {
    gap: 8,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    padding: 10,
  },
  optionCardActive: {
    borderColor: 'rgba(0, 240, 255, 0.5)',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMain,
  },
  optionSub: {
    fontSize: 10,
    color: colors.textDim,
    marginTop: 2,
  },
  checkoutBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  priceLabel: {
    fontSize: 11,
    color: colors.textDim,
  },
  priceUAH: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.cyan,
  },
  priceUSD: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  orderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cyan,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  orderBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
  },
  guaranteeBox: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 14,
  },
  guaranteeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  guaranteeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMain,
  },
  guaranteeDesc: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
    lineHeight: 15,
  },
});
