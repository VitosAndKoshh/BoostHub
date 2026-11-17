import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function TabBar({ activeTab, onSelectTab, unreadChatCount = 0, activeOrdersCount = 0 }) {
  const tabs = [
    { id: 'home', label: 'Бустинг', icon: 'flash', iconOutline: 'flash-outline' },
    { id: 'orders', label: 'Замовлення', icon: 'cube', iconOutline: 'cube-outline', badge: activeOrdersCount },
    { id: 'chat', label: 'Live Чат', icon: 'chatbubbles', iconOutline: 'chatbubbles-outline', badge: unreadChatCount },
    { id: 'profile', label: 'Профіль', icon: 'person', iconOutline: 'person-outline' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const iconName = isActive ? tab.icon : tab.iconOutline;
        const color = isActive ? colors.cyan : colors.textDim;

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabItem}
            onPress={() => onSelectTab(tab.id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={iconName} size={22} color={color} />
              {Boolean(tab.badge && tab.badge > 0) && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge > 9 ? '9+' : tab.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, { color }, isActive && styles.activeTabLabel]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#0c0e15',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingBottom: 20,
    paddingTop: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  activeTabLabel: {
    fontWeight: '800',
    color: colors.cyan,
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.cyan,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
  },
});
