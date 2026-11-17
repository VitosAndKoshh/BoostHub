import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { api } from '../api';

const STATUS_OPTIONS = [
  { id: 'online', label: '🟢 В мережі' },
  { id: 'searching', label: '🔍 Шукаю бустера' },
  { id: 'in_boost', label: '⚡ На бусті' },
  { id: 'away', label: '☕ Відійшов' },
  { id: 'offline', label: '🔴 Офлайн' },
];

const PRESET_GAMES = [
  'Dota 2',
  'CS2',
  'Valorant',
  'Apex Legends',
  'League of Legends',
  'Fortnite',
  'Rocket League',
  'Overwatch 2',
];

const GAME_RANK_PRESETS = {
  'Dota 2': ['Herald (100-750 MMR)', 'Guardian (770-1530 MMR)', 'Crusader (1540-2300 MMR)', 'Archon (2310-3070 MMR)', 'Legend (3080-3840 MMR)', 'Ancient (3850-4610 MMR)', 'Divine (4620-5410 MMR)', 'Immortal (6000+ MMR)'],
  'CS2': ['Silver 1 - Elite', 'Gold Nova 1 - Master', 'Master Guardian 1 - Elite', 'Distinguished Master Guardian', 'Legendary Eagle Master', 'Supreme / Global Elite', 'Faceit 1-3 (Level 1-3)', 'Faceit 4-7 (Level 4-7)', 'Faceit 8-9 (Level 8-9)', 'Faceit 10 (2000-2500 ELO)', 'Faceit 10 (2500+ ELO)'],
  'Valorant': ['Iron 1-3', 'Bronze 1-3', 'Silver 1-3', 'Gold 1-3', 'Platinum 1-3', 'Diamond 1-3', 'Ascendant 1-3', 'Immortal 1-3', 'Radiant'],
  'Apex Legends': ['Rookie', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Apex Predator'],
  'League of Legends': ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'],
};

export default function ProfileScreen({ currentUser, onUpdateUser, onOpenAuth }) {
  // Wallet state
  const [wallet, setWallet] = useState({ balanceUAH: 1500, balanceUSD: 36 });
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [walletAmount, setWalletAmount] = useState('500');
  const [walletActionType, setWalletActionType] = useState('topup'); // 'topup' | 'withdraw'

  // My Games modal state
  const [gameModalVisible, setGameModalVisible] = useState(false);
  const [editingGameId, setEditingGameId] = useState(null);
  const [selectedGameName, setSelectedGameName] = useState('Dota 2');
  const [exactLevelInput, setExactLevelInput] = useState('Herald (100-750 MMR)');
  const [steamUrlInput, setSteamUrlInput] = useState('');
  const [roleInput, setRoleInput] = useState('Carry / Mid');

  // Booster Application modal state
  const [boosterModalVisible, setBoosterModalVisible] = useState(false);
  const [boosterDiscord, setBoosterDiscord] = useState('');
  const [boosterRealName, setBoosterRealName] = useState('');
  const [boosterSteamUrl, setBoosterSteamUrl] = useState('');
  const [boosterMainGame, setBoosterMainGame] = useState('CS2');
  const [boosterRank, setBoosterRank] = useState('Faceit 10 (2600 ELO)');
  const [boosterComment, setBoosterComment] = useState('');
  const [submittingBooster, setSubmittingBooster] = useState(false);

  // Status dropdown state
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadWalletData();
    }
  }, [currentUser]);

  const loadWalletData = async () => {
    try {
      const data = await api.getWallet();
      if (data && data.wallet) {
        setWallet(data.wallet);
      }
    } catch (err) {
      console.log('Error loading wallet:', err);
    }
  };

  const handleStatusChange = async (statusId) => {
    setStatusMenuOpen(false);
    if (!currentUser) return;
    try {
      const updated = await api.updateProfile({ status: statusId });
      onUpdateUser && onUpdateUser(updated);
      Alert.alert('Статус оновлено', 'Ваш статус успішно змінено в мережі');
    } catch (err) {
      Alert.alert('Помилка', err.message);
    }
  };

  // Wallet operations
  const handleWalletSubmit = async () => {
    const num = Number(walletAmount);
    if (!num || num <= 0) {
      Alert.alert('Помилка', 'Введіть коректну суму');
      return;
    }

    setLoading(true);
    try {
      if (walletActionType === 'topup') {
        const data = await api.topUpWallet(num);
        if (data && data.wallet) setWallet(data.wallet);
        Alert.alert('Успішно', `Гаманець поповнено на ${num} ₴!`);
      } else {
        const data = await api.withdrawWallet(num, 'Запит з мобільного додатку');
        if (data && data.wallet) setWallet(data.wallet);
        Alert.alert('Успішно', `Запит на вивід ${num} ₴ прийнято в обробку.`);
      }
      setWalletModalVisible(false);
    } catch (err) {
      Alert.alert('Помилка', err.message || 'Операція не вдалася');
    } finally {
      setLoading(false);
    }
  };

  // Game operations
  const openAddGameModal = (gameObj = null) => {
    if (gameObj) {
      setEditingGameId(gameObj.id);
      setSelectedGameName(gameObj.game || 'Dota 2');
      setExactLevelInput(gameObj.level || gameObj.rank || gameObj.mmr || '100');
      setSteamUrlInput(gameObj.steamUrl || '');
      setRoleInput(gameObj.role || '');
    } else {
      setEditingGameId(null);
      setSelectedGameName('Dota 2');
      setExactLevelInput(GAME_RANK_PRESETS['Dota 2'] ? GAME_RANK_PRESETS['Dota 2'][0] : '100 MMR');
      setSteamUrlInput(currentUser?.steamId?.startsWith('http') ? currentUser.steamId : '');
      setRoleInput('Carry / Mid');
    }
    setGameModalVisible(true);
  };

  const handleSaveGame = async () => {
    if (!exactLevelInput.trim()) {
      Alert.alert('Помилка', 'Вкажіть ваш рівень, ранг або MMR');
      return;
    }

    const currentGames = Array.isArray(currentUser.games) ? [...currentUser.games] : [];
    const newGame = {
      id: editingGameId || 'gm_' + Date.now(),
      game: selectedGameName,
      level: exactLevelInput.trim(),
      rank: exactLevelInput.trim(),
      mmr: exactLevelInput.trim(),
      steamUrl: steamUrlInput.trim(),
      role: roleInput.trim(),
    };

    let updatedList;
    if (editingGameId) {
      updatedList = currentGames.map((g) => (g.id === editingGameId ? newGame : g));
    } else {
      updatedList = [...currentGames, newGame];
    }

    try {
      const updatedUser = await api.updateProfile({ games: updatedList });
      onUpdateUser && onUpdateUser(updatedUser);
      setGameModalVisible(false);
      Alert.alert('Успішно! 🎮', `Гру ${selectedGameName} збережено в My Games.`);
    } catch (err) {
      Alert.alert('Помилка', err.message || 'Не вдалося зберегти гру');
    }
  };

  const handleDeleteGame = async (gameId) => {
    Alert.alert(
      'Видалити гру?',
      'Ви впевнені, що хочете прибрати цю гру з вашого профілю?',
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: async () => {
            const currentGames = Array.isArray(currentUser.games) ? [...currentUser.games] : [];
            const filtered = currentGames.filter((g) => g.id !== gameId);
            try {
              const updatedUser = await api.updateProfile({ games: filtered });
              onUpdateUser && onUpdateUser(updatedUser);
            } catch (err) {
              Alert.alert('Помилка', err.message);
            }
          },
        },
      ]
    );
  };

  // Booster Application submit
  const handleSubmitBoosterApp = async () => {
    if (!boosterDiscord.trim() || !boosterRealName.trim() || !boosterSteamUrl.trim()) {
      Alert.alert('Помилка', 'Заповніть обов\'язкові поля (Discord/TG, Ім\'я, Steam URL)');
      return;
    }

    setSubmittingBooster(true);
    try {
      await api.submitBoosterApplication({
        discord: boosterDiscord.trim(),
        name: boosterRealName.trim(),
        steamUrl: boosterSteamUrl.trim(),
        game: boosterMainGame,
        rank: boosterRank.trim(),
        comment: boosterComment.trim(),
      });
      setBoosterModalVisible(false);
      Alert.alert('Заявку надіслано! ⚡', 'Адміністрація CyberBoost розгляне вашу заявку протягом 24 годин.');
    } catch (err) {
      Alert.alert('Помилка', err.message || 'Не вдалося надіслати заявку');
    } finally {
      setSubmittingBooster(false);
    }
  };

  const openSteamLink = (url) => {
    if (!url) return;
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(cleanUrl).catch(() => {
      Alert.alert('Помилка', 'Не вдалося відкрити посилання Steam');
    });
  };

  if (!currentUser) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="person-circle-outline" size={54} color={colors.cyan} />
        <Text style={styles.emptyTitle}>Профіль користувача</Text>
        <Text style={styles.emptySubtitle}>
          Увійдіть у свій акаунт, щоб керувати балансом гаманця, своїми іграми (My Games) та статусом.
        </Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={onOpenAuth}>
          <Text style={styles.btnPrimaryText}>Увійти або зареєструватись</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const userGames = Array.isArray(currentUser.games) ? currentUser.games : [];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* User Card */}
      <View style={styles.profileCard}>
        <View style={styles.userTopRow}>
          <Image
            source={{ uri: currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160' }}
            style={styles.avatarLarge}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.nameText}>{currentUser.name}</Text>
            <Text style={styles.emailText}>{currentUser.email}</Text>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>
                {currentUser.role === 'booster' ? '⚡ Верифікований бустер' : (currentUser.role === 'admin' ? '🛡️ CyberBoost Staff' : '👤 Клієнт платформи')}
              </Text>
            </View>
          </View>
        </View>

        {/* Status Dropdown / Switcher */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionSmallLabel}>Мій статус:</Text>
          <TouchableOpacity
            style={styles.statusPickerBtn}
            onPress={() => setStatusMenuOpen(!statusMenuOpen)}
            activeOpacity={0.7}
          >
            <Text style={styles.statusPickerText}>
              {STATUS_OPTIONS.find((s) => s.id === currentUser.status)?.label || '🟢 В мережі'}
            </Text>
            <Ionicons name={statusMenuOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.cyan} />
          </TouchableOpacity>

          {statusMenuOpen && (
            <View style={styles.statusMenu}>
              {STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={styles.statusMenuItem}
                  onPress={() => handleStatusChange(opt.id)}
                >
                  <Text style={styles.statusMenuItemText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Wallet Card */}
      <View style={styles.walletCard}>
        <View style={styles.walletHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="wallet-outline" size={20} color={colors.cyan} />
            <Text style={styles.walletTitle}>Електронний гаманець</Text>
          </View>
          <View style={styles.walletBadge}>
            <Text style={styles.walletBadgeText}>CyberPay</Text>
          </View>
        </View>

        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Баланс рахунку:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={styles.balanceValUAH}>{wallet.balanceUAH || 0} ₴</Text>
              <Text style={styles.balanceValUSD}>(${wallet.balanceUSD || Math.round((wallet.balanceUAH || 0) / 41.5)})</Text>
            </View>
          </View>
        </View>

        <View style={styles.walletBtnsRow}>
          <TouchableOpacity
            style={styles.btnTopUp}
            onPress={() => {
              setWalletActionType('topup');
              setWalletModalVisible(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={16} color="#000" />
            <Text style={styles.btnTopUpText}>Поповнити</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnWithdraw}
            onPress={() => {
              setWalletActionType('withdraw');
              setWalletModalVisible(true);
            }}
          >
            <Ionicons name="arrow-up-circle-outline" size={16} color={colors.cyan} />
            <Text style={styles.btnWithdrawText}>Вивести</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* My Games Section */}
      <View style={styles.myGamesCard}>
        <View style={styles.myGamesHeader}>
          <View>
            <Text style={styles.myGamesTitle}>🎮 My Games (Мої ігри)</Text>
            <Text style={styles.myGamesSub}>Вказуйте ваші ігри, рівні та Steam профілі</Text>
          </View>
          <TouchableOpacity
            style={styles.btnAddGame}
            onPress={() => openAddGameModal(null)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color="#000" />
            <Text style={styles.btnAddGameText}>Додати гру</Text>
          </TouchableOpacity>
        </View>

        {userGames.length === 0 ? (
          <View style={styles.emptyGamesBox}>
            <Text style={styles.emptyGamesText}>
              🎮 Ігор поки не додано. Натисніть [Додати гру], щоб вказати ваш рівень або MMR!
            </Text>
          </View>
        ) : (
          <View style={styles.gamesListWrap}>
            {userGames.map((g) => (
              <View key={g.id} style={styles.gameCardItem}>
                <View style={styles.gameCardTop}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={styles.gameItemTitle}>🎮 {g.game}</Text>
                      {Boolean(g.role) && (
                        <View style={styles.roleTagPill}>
                          <Text style={styles.roleTagPillText}>{g.role}</Text>
                        </View>
                      )}
                    </View>

                    {/* Exact Level / Rank / MMR */}
                    <View style={styles.levelRow}>
                      <Text style={styles.levelRowLabel}>⭐ Точний рівень / MMR:</Text>
                      <View style={styles.levelBadge}>
                        <Text style={styles.levelBadgeText}>{g.level || g.rank || g.mmr || '100'}</Text>
                      </View>
                    </View>

                    {/* Steam Profile Button */}
                    {Boolean(g.steamUrl) && (
                      <TouchableOpacity
                        style={styles.steamBtn}
                        onPress={() => openSteamLink(g.steamUrl)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="link-outline" size={13} color={colors.cyan} />
                        <Text style={styles.steamBtnText}>Steam профіль ↗</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.gameActionsCol}>
                    <TouchableOpacity
                      style={styles.gameActionIcon}
                      onPress={() => openAddGameModal(g)}
                    >
                      <Ionicons name="pencil" size={15} color={colors.cyan} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.gameActionIcon}
                      onPress={() => handleDeleteGame(g.id)}
                    >
                      <Ionicons name="trash-outline" size={15} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Become a Booster Banner */}
      {currentUser.role !== 'booster' && currentUser.role !== 'admin' && (
        <View style={styles.boosterBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Ionicons name="trophy-outline" size={24} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={styles.boosterBannerTitle}>Стати бустером CyberBoost</Text>
              <Text style={styles.boosterBannerDesc}>
                Маєш високий ранг у CS2, Dota 2, Valorant чи Apex? Заробляй гроші на улюблених іграх!
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.btnBecomeBooster}
            onPress={() => setBoosterModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnBecomeBoosterText}>⚡ Подати заявку на бустера</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL 1: Add/Edit Game */}
      <Modal visible={gameModalVisible} transparent animationType="slide" onRequestClose={() => setGameModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingGameId ? '✏️ Редагувати рівень гри' : '🎮 Додати гру та рівень'}
              </Text>
              <TouchableOpacity onPress={() => setGameModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textDim} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Game selection chips */}
              <Text style={styles.inputFieldLabel}>Оберіть гру (Game):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {PRESET_GAMES.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.modalGameChip, selectedGameName === g && styles.modalGameChipActive]}
                    onPress={() => {
                      setSelectedGameName(g);
                      if (GAME_RANK_PRESETS[g]) {
                        setExactLevelInput(GAME_RANK_PRESETS[g][0]);
                      }
                    }}
                  >
                    <Text style={[styles.modalGameChipText, selectedGameName === g && styles.modalGameChipTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Quick preset rank */}
              {Boolean(GAME_RANK_PRESETS[selectedGameName]) && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.inputFieldLabel}>🏆 Швидкий вибір рангу:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {GAME_RANK_PRESETS[selectedGameName].map((preset) => (
                      <TouchableOpacity
                        key={preset}
                        style={[styles.presetRankPill, exactLevelInput === preset && styles.presetRankPillActive]}
                        onPress={() => setExactLevelInput(preset)}
                      >
                        <Text style={[styles.presetRankPillText, exactLevelInput === preset && styles.presetRankPillTextActive]}>
                          {preset}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Exact Rank / Level / MMR Input */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.inputFieldLabel}>⭐ Ваш точний рівень, ранг або MMR:</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={exactLevelInput}
                  onChangeText={setExactLevelInput}
                  placeholder="напр: 100 або 3500 MMR або Faceit 10 (2950 ELO)"
                  placeholderTextColor={colors.textDim}
                />
              </View>

              {/* Steam Profile Link Input */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.inputFieldLabel}>🔗 Посилання на Steam (Steam профіль для гри):</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={steamUrlInput}
                  onChangeText={setSteamUrlInput}
                  placeholder="https://steamcommunity.com/id/your_profile"
                  placeholderTextColor={colors.textDim}
                  autoCapitalize="none"
                />
              </View>

              {/* Role / Position */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.inputFieldLabel}>🎯 Ваша основна роль або позиція (опціонально):</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={roleInput}
                  onChangeText={setRoleInput}
                  placeholder="Carry / Mid / Duelist / AWP / Entry"
                  placeholderTextColor={colors.textDim}
                />
              </View>

              <TouchableOpacity style={styles.btnPrimary} onPress={handleSaveGame}>
                <Text style={styles.btnPrimaryText}>💾 Зберегти гру</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Wallet Top-Up / Withdraw */}
      <Modal visible={walletModalVisible} transparent animationType="fade" onRequestClose={() => setWalletModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {walletActionType === 'topup' ? '💳 Поповнення гаманця' : '💸 Виведення коштів'}
              </Text>
              <TouchableOpacity onPress={() => setWalletModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textDim} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputFieldLabel}>Сума в гривнях (UAH):</Text>
            <TextInput
              style={styles.modalTextInput}
              value={walletAmount}
              onChangeText={setWalletAmount}
              keyboardType="numeric"
              placeholder="500"
              placeholderTextColor={colors.textDim}
            />

            <View style={styles.quickAmountRow}>
              {['200', '500', '1000', '2500'].map((amt) => (
                <TouchableOpacity key={amt} style={styles.quickAmtBtn} onPress={() => setWalletAmount(amt)}>
                  <Text style={styles.quickAmtText}>{amt} ₴</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleWalletSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.btnPrimaryText}>
                  {walletActionType === 'topup' ? 'Поповнити баланс' : 'Підтвердити вивід'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Become a Booster Application */}
      <Modal visible={boosterModalVisible} transparent animationType="slide" onRequestClose={() => setBoosterModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏆 Заявка: Стати бустером</Text>
              <TouchableOpacity onPress={() => setBoosterModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textDim} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.inputFieldLabel}>1) Нік у Discord або Telegram:</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={boosterDiscord}
                  onChangeText={setBoosterDiscord}
                  placeholder="@username_tg або DiscordNick#1234"
                  placeholderTextColor={colors.textDim}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.inputFieldLabel}>2) Ваше реальне ім'я:</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={boosterRealName}
                  onChangeText={setBoosterRealName}
                  placeholder="Олександр / Михайло"
                  placeholderTextColor={colors.textDim}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.inputFieldLabel}>3) Посилання на відкритий Steam профіль:</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={boosterSteamUrl}
                  onChangeText={setBoosterSteamUrl}
                  placeholder="https://steamcommunity.com/id/..."
                  placeholderTextColor={colors.textDim}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.inputFieldLabel}>4) Гра та поточний ранг / ELO:</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={boosterRank}
                  onChangeText={setBoosterRank}
                  placeholder="CS2 Faceit 10 (2950 ELO) або Radiant"
                  placeholderTextColor={colors.textDim}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.inputFieldLabel}>5) Додатково (Tracker.gg або досвід):</Text>
                <TextInput
                  style={[styles.modalTextInput, { height: 60 }]}
                  value={boosterComment}
                  onChangeText={setBoosterComment}
                  placeholder="Посилання на tracker.gg, досвід гри в командах..."
                  placeholderTextColor={colors.textDim}
                  multiline
                />
              </View>

              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={handleSubmitBoosterApp}
                disabled={submittingBooster}
              >
                {submittingBooster ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.btnPrimaryText}>⚡ Надіслати заявку на перевірку</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textMain,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    marginBottom: 14,
  },
  userTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.cyan,
  },
  nameText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textMain,
  },
  emailText: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 2,
  },
  roleTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 4,
  },
  roleTagText: {
    fontSize: 10,
    color: colors.cyan,
    fontWeight: '700',
  },
  statusSection: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
  },
  sectionSmallLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDim,
    marginBottom: 6,
  },
  statusPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusPickerText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMain,
  },
  statusMenu: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: 6,
    overflow: 'hidden',
  },
  statusMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  statusMenuItemText: {
    fontSize: 13,
    color: colors.textMain,
  },
  walletCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    padding: 16,
    marginBottom: 14,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  walletTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.cyan,
  },
  walletBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  walletBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.cyan,
  },
  balanceRow: {
    marginBottom: 14,
  },
  balanceLabel: {
    fontSize: 11,
    color: colors.textDim,
    marginBottom: 2,
  },
  balanceValUAH: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.green,
  },
  balanceValUSD: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  walletBtnsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnTopUp: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.cyan,
    borderRadius: 10,
    paddingVertical: 10,
  },
  btnTopUpText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
  },
  btnWithdraw: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: colors.cyan,
    borderRadius: 10,
    paddingVertical: 10,
  },
  btnWithdrawText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.cyan,
  },
  myGamesCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    marginBottom: 14,
  },
  myGamesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  myGamesTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textMain,
  },
  myGamesSub: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
  },
  btnAddGame: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cyan,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  btnAddGameText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000',
  },
  emptyGamesBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  emptyGamesText: {
    fontSize: 12,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 17,
  },
  gamesListWrap: {
    gap: 10,
  },
  gameCardItem: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
  },
  gameCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gameItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMain,
  },
  roleTagPill: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  roleTagPillText: {
    fontSize: 10,
    color: colors.cyan,
    fontWeight: '700',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  levelRowLabel: {
    fontSize: 11,
    color: colors.textDim,
  },
  levelBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.cyan,
  },
  steamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.35)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  steamBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.cyan,
  },
  gameActionsCol: {
    flexDirection: 'column',
    gap: 8,
    marginLeft: 8,
  },
  gameActionIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boosterBanner: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    padding: 16,
    marginBottom: 20,
  },
  boosterBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.gold,
  },
  boosterBannerDesc: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
    lineHeight: 16,
  },
  btnBecomeBooster: {
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnBecomeBoosterText: {
    fontSize: 13,
    fontWeight: '850',
    color: '#000',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: colors.border,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textMain,
  },
  modalInputGroup: {
    marginBottom: 12,
  },
  inputFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.cyan,
    marginBottom: 6,
  },
  modalTextInput: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textMain,
  },
  modalGameChip: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
  },
  modalGameChipActive: {
    borderColor: colors.cyan,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
  },
  modalGameChipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalGameChipTextActive: {
    color: colors.cyan,
    fontWeight: '700',
  },
  presetRankPill: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 6,
  },
  presetRankPillActive: {
    borderColor: colors.cyan,
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
  },
  presetRankPillText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  presetRankPillTextActive: {
    color: colors.cyan,
    fontWeight: '700',
  },
  quickAmountRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  quickAmtBtn: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickAmtText: {
    fontSize: 12,
    color: colors.cyan,
    fontWeight: '700',
  },
  btnPrimary: {
    backgroundColor: colors.cyan,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
});
