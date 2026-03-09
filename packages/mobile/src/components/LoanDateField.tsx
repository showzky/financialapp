import React, { useMemo, useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'

import { useScreenPalette } from '../customthemes'

type Props = {
  label: string
  value: string
  placeholder: string
  error?: string
  onChange: (value: string) => void
}

function parseStorageDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date()
  }

  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatStorageDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDisplayDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const date = parseStorageDate(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function LoanDateField({ label, value, placeholder, error, onChange }: Props) {
  const { activeTheme, colors } = useScreenPalette()
  const [iosPickerOpen, setIosPickerOpen] = useState(false)
  const selectedDate = useMemo(() => parseStorageDate(value), [value])
  const displayValue = value ? formatDisplayDate(value) : ''

  const styles = useMemo(
    () =>
      StyleSheet.create({
        field: {
          marginBottom: 16,
        },
        label: {
          fontSize: 13,
          fontWeight: '600',
          color: activeTheme.colors.text,
          marginBottom: 6,
        },
        inputLike: {
          borderWidth: 1,
          borderColor: error ? activeTheme.colors.danger : activeTheme.colors.surfaceBorder,
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          minHeight: 47,
          backgroundColor: error ? `${activeTheme.colors.danger}10` : colors.inputBackground,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        },
        inputText: {
          flex: 1,
          fontSize: 15,
          color: displayValue ? activeTheme.colors.text : activeTheme.colors.subtleText,
        },
        errorText: {
          marginTop: 4,
          fontSize: 12,
          color: activeTheme.colors.danger,
        },
        iosPickerCard: {
          marginTop: 10,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: activeTheme.colors.surfaceBorder,
          backgroundColor: activeTheme.colors.surface,
          overflow: 'hidden',
        },
        iosPickerToolbar: {
          flexDirection: 'row',
          justifyContent: 'flex-end',
          paddingHorizontal: 12,
          paddingTop: 10,
        },
        iosDoneText: {
          fontSize: 13,
          fontWeight: '700',
          color: activeTheme.colors.accent,
        },
      }),
    [activeTheme.colors, colors.inputBackground, displayValue, error],
  )

  const handleSelect = (_event: unknown, date?: Date) => {
    if (!date) {
      return
    }

    onChange(formatStorageDate(date))
  }

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode: 'date',
        value: selectedDate,
        onChange: (_event, date) => {
          if (date) {
            onChange(formatStorageDate(date))
          }
        },
      })
      return
    }

    setIosPickerOpen(true)
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.inputLike} onPress={openPicker}>
        <Text style={styles.inputText}>{displayValue || placeholder}</Text>
        <Ionicons name="calendar-outline" size={18} color={activeTheme.colors.mutedText} />
      </Pressable>

      {iosPickerOpen && Platform.OS === 'ios' ? (
        <View style={styles.iosPickerCard}>
          <View style={styles.iosPickerToolbar}>
            <Pressable onPress={() => setIosPickerOpen(false)}>
              <Text style={styles.iosDoneText}>Done</Text>
            </Pressable>
          </View>
          <DateTimePicker mode="date" display="spinner" value={selectedDate} onChange={handleSelect} />
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  )
}
