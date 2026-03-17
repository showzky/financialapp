import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

import { BalanceEmptyIllustration } from './BalanceEmptyIllustration'

type Props = {
  onAddAccount?: () => void
}

export function BalanceEmptyState({ onAddAccount }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.illustrationShell}>
        <BalanceEmptyIllustration />
      </View>

      <Text style={styles.title}>No saved accounts</Text>
      <Text style={styles.subtitle}>
        Connect your first account to start building your live balance layer inside OrionLedger.
      </Text>

      <TouchableOpacity activeOpacity={0.88} onPress={onAddAccount}>
        <LinearGradient colors={['#6DB2FF', '#4C89E8']} style={styles.primaryCta}>
          <Ionicons name="add" size={18} color="#08101A" />
          <Text style={styles.primaryCtaText}>Tap to create</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.secondaryCard} activeOpacity={0.85}>
          <Text style={styles.secondaryLabel}>Manual account</Text>
          <Text style={styles.secondaryHint}>Placeholder</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryCard} activeOpacity={0.85}>
          <Text style={styles.secondaryLabel}>Link bank</Text>
          <Text style={styles.secondaryHint}>Coming later</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 34,
  },
  illustrationShell: {
    borderRadius: 34,
    overflow: 'hidden',
    marginBottom: 14,
  },
  title: {
    color: '#F5F7FA',
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
  },
  subtitle: {
    marginTop: 10,
    color: 'rgba(226,232,245,0.56)',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 292,
    fontFamily: 'DMSans_500Medium',
  },
  primaryCta: {
    marginTop: 22,
    minWidth: 180,
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryCtaText: {
    color: '#08101A',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  quickRow: {
    width: '100%',
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  secondaryCard: {
    flex: 1,
    minHeight: 78,
    borderRadius: 22,
    backgroundColor: 'rgba(19,23,34,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  secondaryLabel: {
    color: '#EDF2FA',
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  secondaryHint: {
    marginTop: 4,
    color: 'rgba(237,242,250,0.42)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
})
