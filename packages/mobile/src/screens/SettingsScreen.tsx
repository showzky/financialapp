import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Constants from 'expo-constants'
import { useAuth } from '../auth/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { ScreenHero } from '../components/ScreenHero'
import { customThemeOrder, customThemeRegistry, useScreenPalette } from '../customthemes'

export function SettingsScreen() {
  const { signOut } = useAuth()
  const {
    disablePushNotifications,
    enablePushNotifications,
    expoPushToken,
    isReady,
    permissionState,
    preferences,
    setTopicEnabled,
  } = useNotifications()
  const {
    activeTheme,
    activeThemeId,
    manualThemeId,
    resolvedThemeId,
    source,
    selectTheme,
    clearManualTheme,
  } = useScreenPalette()
  const [darkMode, setDarkMode] = useState(false)

  const handleNotificationsToggle = (nextValue: boolean) => {
    if (!nextValue) {
      void disablePushNotifications()
      return
    }

    void enablePushNotifications().then((enabled) => {
      if (!enabled) {
        Alert.alert(
          'Notifications not enabled',
          'Permission was not granted. You can try again later from Settings.',
        )
      }
    })
  }

  const handleTopicToggle = (topic: 'loans' | 'wishlist' | 'vacations') => (nextValue: boolean) => {
    if (!preferences.enabled && nextValue) {
      Alert.alert('Enable push notifications first', 'Turn on push notifications before enabling topics.')
      return
    }

    void setTopicEnabled(topic, nextValue)
  }

  const pushNotificationDescription = !isReady
    ? 'Loading notification settings...'
    : preferences.enabled && permissionState === 'granted'
      ? expoPushToken
        ? 'Ready for local reminders and remote push'
        : 'Ready for local reminders'
      : permissionState === 'denied'
        ? 'Permission denied. You can try again later.'
        : 'Receive app notifications'

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Logout',
        onPress: () => {
          void signOut()
        },
        style: 'destructive',
      },
    ])
  }

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'This action cannot be undone. Are you sure?', [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Delete',
        onPress: () => {
          console.log('Account deleted')
        },
        style: 'destructive',
      },
    ])
  }

  const renderLinkRow = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    description: string,
    options?: { danger?: boolean; onPress?: () => void },
  ) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        {
          backgroundColor: activeTheme.colors.surface,
          borderColor: activeTheme.colors.surfaceBorder,
        },
      ]}
      onPress={options?.onPress}
      activeOpacity={0.85}
    >
      <View style={styles.settingLeft}>
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: options?.danger ? `${activeTheme.colors.danger}1A` : activeTheme.colors.accentSoft },
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={options?.danger ? activeTheme.colors.danger : activeTheme.colors.accent}
          />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingLabel, { color: options?.danger ? activeTheme.colors.danger : activeTheme.colors.text }]}>
            {label}
          </Text>
          <Text style={[styles.settingDesc, { color: activeTheme.colors.mutedText }]}>{description}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={activeTheme.colors.subtleText} />
    </TouchableOpacity>
  )

  const renderToggleRow = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    disabled?: boolean,
  ) => (
    <View
      style={[
        styles.settingItem,
        {
          backgroundColor: activeTheme.colors.surface,
          borderColor: activeTheme.colors.surfaceBorder,
        },
      ]}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconBadge, { backgroundColor: activeTheme.colors.accentSoft }]}>
          <Ionicons name={icon} size={18} color={activeTheme.colors.accent} />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingLabel, { color: activeTheme.colors.text }]}>{label}</Text>
          <Text style={[styles.settingDesc, { color: activeTheme.colors.mutedText }]}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: activeTheme.colors.surfaceBorderStrong, true: activeTheme.colors.secondaryLine }}
        thumbColor={value ? activeTheme.colors.secondary : activeTheme.colors.surfaceAlt}
        disabled={disabled}
      />
    </View>
  )

  return (
    <ScrollView style={[styles.container, { backgroundColor: activeTheme.colors.screenBackground }]}>
      <ScreenHero
        eyebrow="Preferences"
        title="Settings"
        subtitle="Control reminders, themes, and app behavior in one place."
        theme={{
          gradient: activeTheme.colors.heroGradient,
          eyebrow: activeTheme.colors.heroEyebrow,
          title: activeTheme.colors.heroTitle,
          subtitle: activeTheme.colors.heroSubtitle,
        }}
      />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: activeTheme.colors.mutedText }]}>Theme</Text>

        <TouchableOpacity
          style={[
            styles.autoCard,
            {
              backgroundColor: activeTheme.colors.surface,
              borderColor: source === 'auto' ? activeTheme.colors.accentLine : activeTheme.colors.surfaceBorder,
            },
          ]}
          activeOpacity={0.85}
          onPress={clearManualTheme}
        >
          <View style={styles.autoCardHeader}>
            <View>
              <Text style={[styles.autoCardLabel, { color: activeTheme.colors.text }]}>Automatic seasonal mode</Text>
              <Text style={[styles.autoCardDescription, { color: activeTheme.colors.mutedText }]}>
                Currently matching {customThemeRegistry[resolvedThemeId].label}.
              </Text>
            </View>
            <View
              style={[
                styles.activeBadge,
                {
                  backgroundColor: source === 'auto' ? activeTheme.colors.accentSoft : activeTheme.colors.surfaceAlt,
                  borderColor: source === 'auto' ? activeTheme.colors.accentLine : activeTheme.colors.surfaceBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.activeBadgeText,
                  { color: source === 'auto' ? activeTheme.colors.accent : activeTheme.colors.mutedText },
                ]}
              >
                {source === 'auto' ? 'Active' : 'Auto'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.themeGrid}>
          {customThemeOrder.map((themeId) => {
            const option = customThemeRegistry[themeId]
            const isActive = activeThemeId === themeId && source === 'manual'

            return (
              <TouchableOpacity
                key={themeId}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: option.colors.surface,
                    borderColor: isActive ? option.colors.accentLine : option.colors.surfaceBorder,
                  },
                ]}
                activeOpacity={0.88}
                onPress={() => selectTheme(themeId)}
              >
                <View style={styles.themeCardTop}>
                  <Text style={[styles.themeCardTitle, { color: option.colors.text }]}>{option.label}</Text>
                  {isActive ? (
                    <View style={[styles.activeBadge, { backgroundColor: option.colors.accentSoft, borderColor: option.colors.accentLine }]}>
                      <Text style={[styles.activeBadgeText, { color: option.colors.accent }]}>Selected</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.themeCardDesc, { color: option.colors.mutedText }]} numberOfLines={2}>
                  {option.description}
                </Text>
                <View style={styles.swatchRow}>
                  {option.swatches.map((swatch) => (
                    <View key={`${themeId}-${swatch}`} style={[styles.swatch, { backgroundColor: swatch }]} />
                  ))}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {manualThemeId ? (
          <TouchableOpacity
            style={[
              styles.resetButton,
              {
                backgroundColor: activeTheme.colors.accentSoft,
                borderColor: activeTheme.colors.accentLine,
              },
            ]}
            activeOpacity={0.85}
            onPress={clearManualTheme}
          >
            <Text style={[styles.resetButtonText, { color: activeTheme.colors.accent }]}>Back to auto</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: activeTheme.colors.mutedText }]}>Account</Text>
        {renderLinkRow('person', 'Profile Information', 'Edit your profile details')}
        {renderLinkRow('key', 'Password', 'Change your password')}
        {renderLinkRow('lock-closed', 'Privacy & Security', 'Manage your privacy settings')}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: activeTheme.colors.mutedText }]}>Notifications</Text>
        {renderToggleRow('notifications', 'Push Notifications', pushNotificationDescription, preferences.enabled, handleNotificationsToggle, !isReady)}
        {renderToggleRow('alert-circle', 'Loan Notifications', 'Due soon, overdue, and repaid updates', preferences.topics.loans, handleTopicToggle('loans'), !preferences.enabled)}
        {renderToggleRow('heart', 'Wishlist Notifications', 'Future wishlist reminders and alerts', preferences.topics.wishlist, handleTopicToggle('wishlist'), !preferences.enabled)}
        {renderToggleRow('airplane', 'Vacation Reminders', 'Future travel countdown reminders', preferences.topics.vacations, handleTopicToggle('vacations'), !preferences.enabled)}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: activeTheme.colors.mutedText }]}>Display</Text>
        {renderLinkRow('language', 'Language', 'English (US)')}
        {renderToggleRow('moon', 'Dark Mode', 'Coming soon', darkMode, setDarkMode, true)}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: activeTheme.colors.mutedText }]}>App</Text>
        {renderLinkRow('information-circle', 'About', `v${Constants.expoConfig?.version ?? '1.0.3'} Beta`)}
        {renderLinkRow('document-text', 'Terms of Service', 'Read our terms')}
        {renderLinkRow('shield-checkmark', 'Privacy Policy', 'Read our privacy policy')}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: activeTheme.colors.danger }]}>Danger Zone</Text>
        {renderLinkRow('log-out', 'Logout', 'Sign out of this device', { danger: true, onPress: handleLogout })}
        {renderLinkRow('trash', 'Delete Account', 'This action cannot be undone', { danger: true, onPress: handleDeleteAccount })}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    paddingHorizontal: 2,
  },
  autoCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  autoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  autoCardLabel: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
  },
  autoCardDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'DMSans_500Medium',
  },
  activeBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeBadgeText: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  themeGrid: {
    gap: 10,
  },
  themeCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  themeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  themeCardTitle: {
    fontSize: 20,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  themeCardDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'DMSans_500Medium',
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  swatch: {
    height: 8,
    flex: 1,
    borderRadius: 999,
  },
  resetButton: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  settingDesc: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'DMSans_500Medium',
  },
})
