import React from 'react'
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type Props = {
  visible: boolean
  title?: string
  options: string[]
  selectedValue: string
  onClose: () => void
  onSelect: (value: string) => void
}

export function CreatePlanCategoryPickerModal({
  visible,
  title = 'Category',
  options,
  selectedValue,
  onClose,
  onSelect,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <Text style={styles.title}>{title}</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const selected = option === selectedValue
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.row, selected ? styles.rowSelected : undefined]}
                  activeOpacity={0.88}
                  onPress={() => {
                    onSelect(option)
                    onClose()
                  }}
                >
                  <Text style={[styles.rowText, selected ? styles.rowTextSelected : undefined]}>
                    {option}
                  </Text>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={18} color="#72d39f" />
                  ) : null}
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} activeOpacity={0.85} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
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
    maxHeight: '70%',
    borderRadius: 24,
    backgroundColor: '#181c27',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
  },
  title: {
    color: '#F5F8FD',
    fontSize: 20,
    textAlign: 'center',
    fontFamily: 'DMSans_700Bold',
  },
  list: {
    marginTop: 14,
  },
  row: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.025)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rowSelected: {
    borderColor: 'rgba(109,178,255,0.42)',
    backgroundColor: 'rgba(109,178,255,0.08)',
  },
  rowText: {
    color: '#F5F8FD',
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
  },
  rowTextSelected: {
    color: '#FFFFFF',
  },
  closeButton: {
    minHeight: 46,
    marginTop: 2,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: 'rgba(245,248,253,0.82)',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
})
