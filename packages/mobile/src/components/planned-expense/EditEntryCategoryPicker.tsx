import React from 'react'
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

export type EditEntryCategoryOption = {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
}

type Props = {
  visible: boolean
  title: string
  options: EditEntryCategoryOption[]
  selectedLabel: string
  onClose: () => void
  onSelect: (option: EditEntryCategoryOption) => void
}

export function EditEntryCategoryPicker({
  visible,
  title,
  options,
  selectedLabel,
  onClose,
  onSelect,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetWrap}>
          <LinearGradient colors={['#1b1a2a', '#11111b']} style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.85}>
                <Ionicons name="close" size={18} color="rgba(255,255,255,0.76)" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option, index) => {
                const selected = option.label === selectedLabel
                return (
                  <TouchableOpacity
                    key={`${option.label}-${index}`}
                    style={[styles.row, index < options.length - 1 && styles.rowBorder]}
                    onPress={() => {
                      onSelect(option)
                      onClose()
                    }}
                    activeOpacity={0.88}
                  >
                    <View
                      style={[
                        styles.iconWrap,
                        {
                          backgroundColor: `${option.color}20`,
                          borderColor: `${option.color}4a`,
                        },
                      ]}
                    >
                      <Ionicons name={option.icon} size={16} color={option.color} />
                    </View>
                    <Text style={styles.rowText}>{option.label}</Text>
                    {selected ? <Ionicons name="checkmark" size={18} color="#78d89c" /> : null}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(4,4,10,0.42)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetWrap: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  sheet: {
    maxHeight: '72%',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 10,
  },
  title: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontFamily: 'DMSans_600SemiBold',
  },
})
