// @ts-nocheck
import React, { useMemo } from 'react'
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'

const monthLabelFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
})

const normalizeMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1)

const isSameMonth = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth()

const buildMonthRange = (count: number): Date[] => {
  const currentMonth = normalizeMonth(new Date())
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(currentMonth)
    date.setMonth(currentMonth.getMonth() - index)
    return date
  })
}

type MonthPickerModalProps = {
  visible: boolean
  selectedMonth: Date
  onClose: () => void
  onSelectMonth: (month: Date) => void
}

export const MonthPickerModal = ({
  visible,
  selectedMonth,
  onClose,
  onSelectMonth,
}: MonthPickerModalProps) => {
  const options = useMemo(() => buildMonthRange(12), [])

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.header}>
                <Text style={styles.title}>Select month</Text>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.cancel}>Cancel</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.grid}>
                {options.map((monthOption) => {
                  const active = isSameMonth(monthOption, selectedMonth)
                  return (
                    <TouchableOpacity
                      key={monthOption.toISOString()}
                      style={[styles.monthButton, active ? styles.monthButtonActive : undefined]}
                      onPress={() => onSelectMonth(monthOption)}
                    >
                      <Text style={[styles.monthText, active ? styles.monthTextActive : undefined]}>
                        {monthLabelFormatter.format(monthOption)}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  cancel: {
    color: '#3b82f6',
    fontSize: 15,
    fontWeight: '600',
  },
  grid: {
    gap: 8,
  },
  monthButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  monthButtonActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  monthText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  monthTextActive: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
})
