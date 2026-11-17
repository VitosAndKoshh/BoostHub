import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function Header({
  currentUser,
  onlineCount = 1566,
  serverStatus = 'connected',
  onOpenServerConfig,
  onOpenAuth,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>⚡</Text>
        </View>
        <View>
          <Text style={styles.brandTitle}>
            CYBER<Text style={styles.brandAccent}>BOOST</Text>
          </Text>
          <View style={styles.onlineBadge}>
            <View style={[styles.statusDot, serverStatus === 'connected' ? styles.dotGreen : styles.dotOrange]} />
            <Text style={styles.onlineText}>{onlineCount} ONLINE</Text>
          </View>
        </View>
      </View>

      <View style={styles.rightRow}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onOpenServerConfig}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="server-outline" size={19} color={colors.cyan} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.userProfileBtn}
          onPress={onOpenAuth}
          activeOpacity={0.8}
        >
          {currentUser ? (
            <View style={styles.userLoggedInWrap}>
              <Image
                source={{ uri: currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' }}
                style={styles.avatarImg}
              />
              <Text style={styles.userName} numberOfLines={1}>
                {currentUser.name}
              </Text>
            </View>
          ) : (
            <View style={styles.loginBtnWrap}>
              <Ionicons name="person-circle-outline" size={18} color={colors.cyan} />
              <Text style={styles.loginBtnText}>Увійти</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(10, 11, 16, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 20,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textMain,
    letterSpacing: 1,
  },
  brandAccent: {
    color: colors.cyan,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotGreen: {
    backgroundColor: colors.green,
  },
  dotOrange: {
    backgroundColor: colors.orange,
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.green,
    letterSpacing: 0.5,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userProfileBtn: {
    borderRadius: 20,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  userLoggedInWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 120,
  },
  avatarImg: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  userName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.cyan,
  },
  loginBtnWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 4,
  },
  loginBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.cyan,
  },
});
