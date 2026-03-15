import React from 'react'
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideOutLeft } from 'react-native-reanimated'

type ProfileAction = {
  id: string
  label: string
  icon: keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap
  iconSet?: 'ion' | 'material'
}

type Props = {
  visible: boolean
  displayName: string
  email: string
  avatarSeed: string
  onOpenSettings: () => void
  onClose: () => void
  onSignOut: () => void
}

const PLACEHOLDER_ACTIONS: ProfileAction[] = [
  { id: 'profile', label: 'Profile details', icon: 'person-outline' },
  { id: 'categories', label: 'Categories', icon: 'grid-outline' },
  { id: 'currency', label: 'Currency', icon: 'cash-outline' },
  { id: 'export', label: 'Export / Import data', icon: 'swap-horizontal-outline' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
  { id: 'settings', label: 'Settings', icon: 'cog-outline', iconSet: 'material' },
]

function renderIcon(action: ProfileAction) {
  if (action.iconSet === 'material') {
    return <MaterialCommunityIcons name={action.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={18} color="rgba(255,255,255,0.78)" />
  }

  return <Ionicons name={action.icon as keyof typeof Ionicons.glyphMap} size={18} color="rgba(255,255,255,0.78)" />
}

export function DashboardProfileModal({
  visible,
  displayName,
  email,
  avatarSeed,
  onOpenSettings,
  onClose,
  onSignOut,
}: Props) {
  const handleActionPress = (action: ProfileAction) => {
    if (action.id === 'settings') {
      onOpenSettings()
    }
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>
      <Animated.View entering={SlideInLeft.duration(260)} exiting={SlideOutLeft.duration(220)} style={styles.root}>
        <LinearGradient colors={['#151422', '#0b0c14']} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={['rgba(112,84,180,0.2)', 'transparent']} style={styles.bloom} />

        <View style={styles.header}>
          <TouchableOpacity style={styles.chromeButton} onPress={onClose} activeOpacity={0.86}>
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.72)" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.chromeButton} activeOpacity={0.86}>
            <Ionicons name="refresh-outline" size={18} color="rgba(255,255,255,0.72)" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileBlock}>
          <Image
            source={{ uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(avatarSeed)}` }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.actionList}>
            {PLACEHOLDER_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionRow}
                activeOpacity={0.88}
                onPress={() => handleActionPress(action)}
              >
                <View style={styles.actionLeft}>
                  <View style={styles.actionIconWrap}>{renderIcon(action)}</View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.34)" />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.cloudText}>Your data is stored in the cloud</Text>

          <TouchableOpacity style={styles.logoutRow} onPress={onSignOut} activeOpacity={0.88}>
            <View style={styles.actionLeft}>
              <View style={styles.logoutIconWrap}>
                <Ionicons name="log-out-outline" size={18} color="#ef6a71" />
              </View>
              <Text style={styles.logoutLabel}>Log out</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.34)" />
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,5,10,0.58)',
  },
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: '#0a0a0e',
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  bloom: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chromeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  profileBlock: {
    alignItems: 'center',
    marginTop: 26,
    marginBottom: 24,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 14,
  },
  name: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  email: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 13,
    marginTop: 4,
  },
  actionList: {
    gap: 10,
  },
  scrollContent: {
    paddingBottom: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    backgroundColor: 'rgba(32,34,53,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 15,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  actionLabel: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 15,
    fontWeight: '700',
  },
  cloudText: {
    marginTop: 'auto',
    marginBottom: 16,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.24)',
    fontSize: 12,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    backgroundColor: 'rgba(32,34,53,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 15,
  },
  logoutIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,106,113,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,106,113,0.18)',
  },
  logoutLabel: {
    color: '#ef6a71',
    fontSize: 15,
    fontWeight: '800',
  },
})
