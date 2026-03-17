import React from 'react'
import { Modal, StyleSheet, Switch, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'

type Props = {
  visible: boolean
  anchorTop: number
  anchorRight: number
  showInChart: boolean
  onToggleShowInChart: (value: boolean) => void
  onRename: () => void
  onMoveToBottom: () => void
  onClose: () => void
}

export function CategorySettingsModal({
  visible,
  anchorTop,
  anchorRight,
  showInChart,
  onToggleShowInChart,
  onRename,
  onMoveToBottom,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={StyleSheet.absoluteFill}>
          <TouchableWithoutFeedback>
            <View style={[styles.panel, { top: anchorTop, right: anchorRight }]}>
              <View style={styles.row}>
                <Text style={styles.label}>Show in chart</Text>
                <Switch
                  value={showInChart}
                  onValueChange={onToggleShowInChart}
                  trackColor={{ false: 'rgba(255,255,255,0.12)', true: '#8A5CF6' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="rgba(255,255,255,0.12)"
                />
              </View>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.75}
                onPress={() => {
                  onClose()
                  setTimeout(onRename, 180)
                }}
              >
                <Text style={styles.label}>Rename</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.75}
                onPress={() => {
                  onClose()
                  onMoveToBottom()
                }}
              >
                <Text style={styles.label}>Move to bottom</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    minWidth: 190,
    borderRadius: 16,
    backgroundColor: '#1E2230',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.36,
    shadowRadius: 20,
    elevation: 12,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 24,
  },
  label: {
    color: '#EEF2FB',
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 0,
  },
})
