import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

export type OrionInsight = {
  id: string
  title: string
  detail: string
  tone: 'info' | 'bill' | 'income'
}

type Props = {
  insights: OrionInsight[]
}

function getToneColors(tone: OrionInsight['tone']) {
  if (tone === 'bill') {
    return {
      accent: '#f3bf62',
      soft: 'rgba(243,191,98,0.16)',
      icon: 'wallet-outline' as const,
    }
  }

  if (tone === 'income') {
    return {
      accent: '#74db9d',
      soft: 'rgba(116,219,157,0.16)',
      icon: 'arrow-up-outline' as const,
    }
  }

  return {
    accent: '#72dcff',
    soft: 'rgba(114,220,255,0.16)',
    icon: 'sparkles-outline' as const,
  }
}

export function TimelineOrionInsights({ insights }: Props) {
  if (insights.length === 0) {
    return null
  }

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={['rgba(22,20,36,0.98)', 'rgba(10,12,20,0.96)']} style={styles.card}>
        <LinearGradient colors={['rgba(101,77,190,0.18)', 'transparent']} style={styles.bloom} />
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="planet-outline" size={14} color="#72dcff" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>ORION MODE</Text>
            <Text style={styles.title}>Analyst readout</Text>
          </View>
        </View>

        <View style={styles.list}>
          {insights.map((insight) => {
            const tone = getToneColors(insight.tone)
            return (
              <View key={insight.id} style={styles.row}>
                <View style={[styles.rowIconWrap, { backgroundColor: tone.soft, borderColor: `${tone.accent}33` }]}>
                  <Ionicons name={tone.icon} size={15} color={tone.accent} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{insight.title}</Text>
                  <Text style={styles.rowDetail}>{insight.detail}</Text>
                </View>
              </View>
            )
          })}
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    marginTop: 18,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  bloom: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(114,220,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(114,220,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: 'rgba(114,220,255,0.7)',
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: 'DMSans_700Bold',
  },
  title: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  rowIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  rowDetail: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.46)',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'DMSans_500Medium',
  },
})
