// @ts-nocheck
import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../auth/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { ScreenHero } from '../components/ScreenHero'
import { screenThemes } from '../theme/screenThemes'

export function SettingsScreen() {
  const theme = screenThemes.settings
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
  const [darkMode, setDarkMode] = useState(false)

  // ADDED THIS
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

  // ADDED THIS
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.screenBackground }]}>
      <ScreenHero
        eyebrow="Preferences"
        title="Settings"
        subtitle="Control reminders, account preferences, and the app behavior in one place."
        theme={theme.hero}
      />

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionContent}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="person" size={20} color="#3b82f6" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Profile Information</Text>
                <Text style={styles.settingDesc}>Edit your profile details</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="key" size={20} color="#3b82f6" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Password</Text>
                <Text style={styles.settingDesc}>Change your password</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, styles.lastItem]}>
            <View style={styles.settingLeft}>
              <Ionicons name="lock" size={20} color="#3b82f6" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Privacy & Security</Text>
                <Text style={styles.settingDesc}>Manage your privacy settings</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.sectionContent}>
          <View style={styles.toggleItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={20} color="#3b82f6" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDesc}>{pushNotificationDescription}</Text>
              </View>
            </View>
            <Switch
              value={preferences.enabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: '#e5e7eb', true: '#86efac' }}
              thumbColor={preferences.enabled ? '#22c55e' : '#d1d5db'}
              disabled={!isReady}
            />
          </View>

          <View style={styles.toggleItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="alert-circle" size={20} color="#3b82f6" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Loan Notifications</Text>
                <Text style={styles.settingDesc}>Due soon, overdue, and repaid updates</Text>
              </View>
            </View>
            <Switch
              value={preferences.topics.loans}
              onValueChange={handleTopicToggle('loans')}
              trackColor={{ false: '#e5e7eb', true: '#86efac' }}
              thumbColor={preferences.topics.loans ? '#22c55e' : '#d1d5db'}
              disabled={!preferences.enabled}
            />
          </View>

          <View style={styles.toggleItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="heart" size={20} color="#3b82f6" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Wishlist Notifications</Text>
                <Text style={styles.settingDesc}>Future wishlist reminders and alerts</Text>
              </View>
            </View>
            <Switch
              value={preferences.topics.wishlist}
              onValueChange={handleTopicToggle('wishlist')}
              trackColor={{ false: '#e5e7eb', true: '#86efac' }}
              thumbColor={preferences.topics.wishlist ? '#22c55e' : '#d1d5db'}
              disabled={!preferences.enabled}
            />
          </View>

          <View style={[styles.toggleItem, styles.lastItem]}>
            <View style={styles.settingLeft}>
              <Ionicons name="airplane" size={20} color="#3b82f6" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Vacation Reminders</Text>
                <Text style={styles.settingDesc}>Future travel countdown reminders</Text>
              </View>
            </View>
            <Switch
              value={preferences.topics.vacations}
              onValueChange={handleTopicToggle('vacations')}
              trackColor={{ false: '#e5e7eb', true: '#86efac' }}
              thumbColor={preferences.topics.vacations ? '#22c55e' : '#d1d5db'}
              disabled={!preferences.enabled}
            />
          </View>
        </View>
      </View>

      {/* Display Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display</Text>
        <View style={styles.sectionContent}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="language" size={20} color="#3b82f6" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Language</Text>
                <Text style={styles.settingDesc}>English (US)</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <View style={[styles.toggleItem, styles.lastItem]}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon" size={20} color="#3b82f6" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Text style={styles.settingDesc}>Coming soon</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              disabled={true}
              trackColor={{ false: '#e5e7eb', true: '#86efac' }}
              thumbColor={'#d1d5db'}
            />
          </View>
        </View>
      </View>

      {/* App Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <View style={styles.sectionContent}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>About</Text>
                <Text style={styles.settingDesc}>v1.0.0</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="document-text" size={20} color="#3b82f6" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Terms of Service</Text>
                <Text style={styles.settingDesc}>Read our terms</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, styles.lastItem]}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark" size={20} color="#3b82f6" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Privacy Policy</Text>
                <Text style={styles.settingDesc}>Read our privacy policy</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
        <View style={styles.sectionContent}>
          <TouchableOpacity style={[styles.settingItem, styles.lastItem]} onPress={handleLogout}>
            <View style={styles.settingLeft}>
              <Ionicons name="log-out" size={20} color="#ef4444" />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, styles.dangerText]}>Logout</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, styles.lastItem]}
            onPress={handleDeleteAccount}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="trash" size={20} color="#ef4444" />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, styles.dangerText]}>Delete Account</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  dangerTitle: {
    color: '#ef4444',
  },
  sectionContent: {
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  settingItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  toggleItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  settingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dangerText: {
    color: '#ef4444',
  },
  settingDesc: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
})
