import React from 'react'
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { AccountTypeOption } from './accountTypes'

type Props = {
  visible: boolean
  options: AccountTypeOption[]
  selectedId: string | null
  onClose: () => void
  onSelect: (option: AccountTypeOption) => void
}

export function AccountTypePickerModal({
  visible,
  options,
  selectedId,
  onClose,
  onSelect,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <Text style={styles.title}>Account type</Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const selected = option.id === selectedId
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.row, selected && styles.rowSelected]}
                  activeOpacity={0.86}
                  onPress={() => {
                    onSelect(option)
                    onClose()
                  }}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: option.iconBackground },
                    ]}
                  >
                    <Ionicons name={option.iconName} size={18} color={option.iconColor} />
                  </View>
                  <View style={styles.textWrap}>
                    <Text style={styles.label}>{option.label}</Text>
                    <Text style={styles.subtitle}>{option.subtitle}</Text>
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={18} color="#6DB2FF" />
                  ) : null}
                </TouchableOpacity>
              )
            })}
          </ScrollView>
          <TouchableOpacity style={styles.cancelButton} activeOpacity={0.85} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4,6,10,0.58)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  panel: {
    borderRadius: 24,
    backgroundColor: '#2A2F39',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  title: {
    color: '#F5F8FD',
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
    marginBottom: 14,
  },
  list: {
    maxHeight: 360,
  },
  row: {
    minHeight: 66,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowSelected: {
    borderColor: 'rgba(109,178,255,0.28)',
    backgroundColor: 'rgba(109,178,255,0.08)',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  label: {
    color: '#F4F7FB',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  subtitle: {
    color: 'rgba(244,247,251,0.5)',
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'DMSans_500Medium',
  },
  cancelButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  cancelText: {
    color: 'rgba(245,248,253,0.82)',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
})
