import React, { useEffect, useMemo, useState } from 'react'
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import type { AccountMode } from '../../shared/contracts/accounts'

type Props = {
  visible: boolean
  mode: AccountMode
  value: number
  onClose: () => void
  onSave: (value: number) => void
}

const keypadRows = [
  ['1', '2', '3', '÷', 'C'],
  ['4', '5', '6', '×', '%'],
  ['7', '8', '9', '-', 'save'],
  ['.', '0', 'back', '+'],
] as const

const formatPreview = (raw: string, mode: AccountMode) => {
  const numeric = Number(raw)
  if (!Number.isFinite(numeric)) return mode === 'credit' ? '-$0.00' : '$0.00'
  const prefix = mode === 'credit' ? '-' : ''
  return `${prefix}$${Math.abs(numeric).toFixed(2)}`
}

export function AdjustBalanceModal({ visible, mode, value, onClose, onSave }: Props) {
  const [raw, setRaw] = useState('0')

  useEffect(() => {
    if (visible) {
      setRaw(String(Math.abs(value)))
    }
  }, [visible, value])

  const preview = useMemo(() => formatPreview(raw, mode), [raw, mode])

  const handlePress = (key: string) => {
    if (key === 'C') {
      setRaw('0')
      return
    }
    if (key === 'back') {
      setRaw((current) => {
        const next = current.slice(0, -1)
        return next.length > 0 ? next : '0'
      })
      return
    }
    if (key === 'save') {
      const parsed = Number(raw)
      onSave(Number.isFinite(parsed) ? Math.abs(parsed) : 0)
      onClose()
      return
    }
    if (['÷', '×', '%', '+', '-'].includes(key)) return

    setRaw((current) => {
      if (key === '.' && current.includes('.')) return current
      if (current === '0' && key !== '.') return key
      return `${current}${key}`
    })
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Adjust balance</Text>
          <View style={styles.previewRow}>
            <Ionicons name="calculator-outline" size={18} color="rgba(255,255,255,0.55)" />
            <Text style={styles.preview}>{preview}</Text>
          </View>
          <View style={styles.keypad}>
            {keypadRows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.keypadRow}>
                {row.map((key) =>
                  key === 'save' ? (
                    <TouchableOpacity
                      key={key}
                      style={styles.saveKey}
                      activeOpacity={0.88}
                      onPress={() => handlePress(key)}
                    >
                      <LinearGradient colors={['#6DB2FF', '#4C89E8']} style={styles.saveKeyFill}>
                        <Ionicons name="checkmark" size={24} color="#F8FBFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      key={key}
                      style={styles.key}
                      activeOpacity={0.88}
                      onPress={() => handlePress(key)}
                    >
                      <Text style={styles.keyText}>
                        {key === 'back' ? '⌫' : key}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4,6,10,0.62)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#1B202B',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 20,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignSelf: 'center',
  },
  title: {
    marginTop: 18,
    textAlign: 'center',
    color: '#F5F8FD',
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
  },
  previewRow: {
    marginTop: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preview: {
    color: '#F5F8FD',
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
  },
  keypad: {
    gap: 10,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 10,
  },
  key: {
    flex: 1,
    minHeight: 64,
    borderRadius: 18,
    backgroundColor: '#232833',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    color: '#F5F8FD',
    fontSize: 26,
    fontFamily: 'DMSans_500Medium',
  },
  saveKey: {
    flex: 1,
    minHeight: 138,
    borderRadius: 18,
    overflow: 'hidden',
  },
  saveKeyFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
