import React from 'react'
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type Props = {
  visible: boolean
  selectedDay: number | null
  onClose: () => void
  onSelectDay: (day: number) => void
  onClear: () => void
}

const DAYS = Array.from({ length: 31 }, (_, index) => index + 1)

export function PaymentDatePickerModal({
  visible,
  selectedDay,
  onClose,
  onSelectDay,
  onClear,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Payment date</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.85}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.78)" />
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {DAYS.map((day) => {
              const selected = selectedDay === day
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayCell, selected && styles.dayCellActive]}
                  activeOpacity={0.88}
                  onPress={() => onSelectDay(day)}
                >
                  <Text style={[styles.dayText, selected && styles.dayTextActive]}>{day}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClear} activeOpacity={0.85}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4,6,10,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  panel: {
    borderRadius: 28,
    backgroundColor: '#202631',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    color: '#F6F8FD',
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayCell: {
    width: '12.8%',
    aspectRatio: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellActive: {
    backgroundColor: '#58A5FF',
  },
  dayText: {
    color: 'rgba(245,248,252,0.78)',
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
  },
  dayTextActive: {
    color: '#08101A',
  },
  footer: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  deleteText: {
    color: '#F26F75',
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
  },
  cancelText: {
    color: 'rgba(245,248,252,0.82)',
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
  },
})
