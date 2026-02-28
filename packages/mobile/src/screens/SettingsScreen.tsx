// @ts-nocheck
import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface SettingsOption {
  id: string
  label: string
  value?: string | boolean
  icon: string
  onPress?: () => void
}

export function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [budgetAlerts, setBudgetAlerts] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Logout',
        onPress: () => {
          console.log('Logged out')
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
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

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
                <Text style={styles.settingDesc}>Receive app notifications</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#e5e7eb', true: '#86efac' }}
              thumbColor={notificationsEnabled ? '#22c55e' : '#d1d5db'}
            />
          </View>

          <View style={[styles.toggleItem, styles.lastItem]}>
            <View style={styles.settingLeft}>
              <Ionicons name="alert-circle" size={20} color="#3b82f6" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Budget Alerts</Text>
                <Text style={styles.settingDesc}>Notify when budget exceeded</Text>
              </View>
            </View>
            <Switch
              value={budgetAlerts}
              onValueChange={setBudgetAlerts}
              trackColor={{ false: '#e5e7eb', true: '#86efac' }}
              thumbColor={budgetAlerts ? '#22c55e' : '#d1d5db'}
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
          <TouchableOpacity
            style={[styles.settingItem, styles.lastItem]}
            onPress={handleLogout}
          >
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
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
