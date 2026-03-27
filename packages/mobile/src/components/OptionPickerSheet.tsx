import React from 'react'
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

export type PickerOption = {
  value: string
  label: string
  hint?: string
}

type Props = {
  visible: boolean
  title: string
  options: PickerOption[]
  selectedValue: string
  onSelect: (value: string) => void
  onClose: () => void
}

export function OptionPickerSheet({ visible, title, options, selectedValue, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <LinearGradient colors={['#1a1928', '#0d0d18']} style={StyleSheet.absoluteFillObject} />
          <View style={styles.handleArea}>
            <View style={styles.handle} />
          </View>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            {options.map((opt, i) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.row, i < options.length - 1 && styles.rowBorder]}
                onPress={() => {
                  onSelect(opt.value)
                  onClose()
                }}
                activeOpacity={0.8}
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{opt.label}</Text>
                  {opt.hint ? <Text style={styles.rowHint}>{opt.hint}</Text> : null}
                </View>
                {selectedValue === opt.value ? (
                  <Ionicons name="checkmark" size={18} color="rgba(94,189,151,0.9)" />
                ) : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '60%',
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 15,
    fontWeight: '500',
  },
  rowHint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    marginTop: 2,
  },
})
