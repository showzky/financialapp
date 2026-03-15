import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import type { BillEntry } from '../../services/dashboardApi'

type Props = {
  billsTotal: number
  transferToBills: number
  billEntries: BillEntry[]
  onPressTimeline: () => void
}

function fmtKr(value: number | null | undefined) {
  const safeValue = Number.isFinite(value) ? Number(value) : 0
  return `KR ${safeValue.toLocaleString('nb-NO')}`
}

export function DashboardBillsCard({
  billsTotal,
  transferToBills,
  billEntries,
  onPressTimeline,
}: Props) {
  const previewItems = billEntries.slice(0, 3)

  return (
    <LinearGradient colors={['rgba(26,24,40,0.98)', 'rgba(14,15,24,0.98)']} style={styles.card}>
      <LinearGradient
        colors={['rgba(96,164,255,0.14)', 'rgba(96,164,255,0.03)', 'transparent']}
        style={styles.cardBloom}
      />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Transfer To Bills</Text>
          <Text style={styles.subtitle}>{billEntries.length > 0 ? `${billEntries.length} bill entries this month` : 'No bills added yet'}</Text>
        </View>
        <TouchableOpacity style={styles.linkButton} onPress={onPressTimeline} activeOpacity={0.85}>
          <Text style={styles.linkText}>Timeline</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.amountRow}>
        <View style={styles.amountBlock}>
          <Text style={styles.amountLabel}>Transfer to bills</Text>
          <Text style={styles.amountValue}>{fmtKr(transferToBills)}</Text>
        </View>
        <View style={styles.pill}>
          <Ionicons name="wallet-outline" size={13} color="rgba(201,168,76,0.9)" />
          <Text style={styles.pillText}>{billEntries.length} bills</Text>
        </View>
      </View>

      <View style={styles.summaryStrip}>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Bills total</Text>
          <Text style={styles.metricValue}>{fmtKr(billsTotal)}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Month</Text>
          <Text style={styles.metricValue}>Current</Text>
        </View>
      </View>

      {previewItems.length > 0 ? (
        <View style={styles.previewList}>
          {previewItems.map((item) => {
            return (
              <View key={item.id} style={styles.previewRow}>
                <View style={styles.previewLeft}>
                  <View style={styles.previewIconWrap}>
                    <Ionicons
                      name={item.isPaid ? 'checkmark-circle' : 'ellipse-outline'}
                      size={15}
                      color={item.isPaid ? '#67d39c' : 'rgba(201,168,76,0.92)'}
                    />
                  </View>
                  <View>
                    <Text style={styles.previewName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.previewMeta}>
                      {item.isPaid ? 'Paid bill' : 'Pending bill'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.previewRight}>{fmtKr(item.amount)}</Text>
              </View>
            )
          })}
        </View>
      ) : null}
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 18,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  cardBloom: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.34)',
    fontSize: 11,
    marginTop: 4,
    maxWidth: 210,
  },
  linkButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.18)',
    backgroundColor: 'rgba(201,168,76,0.09)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  linkText: {
    color: 'rgba(201,168,76,0.9)',
    fontSize: 11,
    fontWeight: '700',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  amountBlock: {
    flex: 1,
    marginRight: 10,
  },
  amountLabel: {
    color: 'rgba(255,255,255,0.36)',
    fontSize: 11,
    marginBottom: 4,
  },
  amountValue: {
    color: 'rgba(255,255,255,0.93)',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  pillText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricBlock: {
    flex: 1,
  },
  metricDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 12,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    marginBottom: 4,
  },
  metricValue: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    fontWeight: '700',
  },
  previewList: {
    marginTop: 14,
    gap: 10,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  previewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  previewIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    fontWeight: '700',
  },
  previewMeta: {
    color: 'rgba(255,255,255,0.32)',
    fontSize: 10,
    marginTop: 2,
  },
  previewRight: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    fontWeight: '800',
  },
})
