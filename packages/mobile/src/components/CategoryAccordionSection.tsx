// @ts-nocheck
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type Props = {
  title: string
  subtitle: string
  totalLabel: string
  accentColor: string
  previewLabels: string[]
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}

export function CategoryAccordionSection({
  title,
  subtitle,
  totalLabel,
  accentColor,
  previewLabels,
  isOpen,
  onToggle,
  children,
}: Props) {
  return (
    <View style={styles.group}>
      <TouchableOpacity
        style={styles.header}
        onPress={onToggle}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
      >
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <View style={[styles.dot, { backgroundColor: accentColor }]} />
            <Text style={styles.title}>{title}</Text>
          </View>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={[styles.total, { color: accentColor }]}>{totalLabel}</Text>
          <View style={styles.chevronWrap}>
            <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#6b7280" />
          </View>
        </View>
      </TouchableOpacity>

      {!isOpen && previewLabels.length > 0 ? (
        <TouchableOpacity
          style={styles.previewRow}
          onPress={onToggle}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`${title} preview`}
        >
          {previewLabels.map((label, index) => (
            <View key={`${label}-${index}`} style={styles.previewChip}>
              <Text style={styles.previewText}>{label}</Text>
            </View>
          ))}
        </TouchableOpacity>
      ) : null}

      {isOpen ? <View style={styles.body}>{children}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  total: {
    fontSize: 13,
    fontWeight: '900',
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  previewChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  previewText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
  },
  body: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
})