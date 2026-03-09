// @ts-nocheck
import React from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type Props = {
  isOpen: boolean
  title: string
  body: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => Promise<void> | void
  onCancel: () => void
  isConfirming?: boolean
  confirmDestructive?: boolean
  theme?: {
    overlayColor?: string
    cardBackground?: string
    borderColor?: string
    titleColor?: string
    bodyColor?: string
    cancelBackground?: string
    cancelBorder?: string
    cancelTextColor?: string
    confirmBackground?: string
    destructiveBackground?: string
    confirmTextColor?: string
    iconNeutralBackground?: string
    iconNeutralColor?: string
    iconDestructiveBackground?: string
    iconDestructiveColor?: string
  }
}

// Why a shared ConfirmModal? Reuse for Mark Repaid, Delete, and any future
// two-step action — avoids scattered Alert.alert() calls that are hard to style.
export function ConfirmModal({
  isOpen,
  title,
  body,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isConfirming = false,
  confirmDestructive = false,
  theme,
}: Props) {
  const iconBackground = confirmDestructive
    ? theme?.iconDestructiveBackground ?? '#fef2f2'
    : theme?.iconNeutralBackground ?? '#eff6ff'
  const iconColor = confirmDestructive
    ? theme?.iconDestructiveColor ?? '#dc2626'
    : theme?.iconNeutralColor ?? '#3b82f6'

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={[styles.overlay, theme?.overlayColor ? { backgroundColor: theme.overlayColor } : null]}
        activeOpacity={1}
        onPress={onCancel}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.card,
            theme?.cardBackground ? { backgroundColor: theme.cardBackground } : null,
            theme?.borderColor ? { borderColor: theme.borderColor, borderWidth: 1 } : null,
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconWrapper, { backgroundColor: iconBackground }]}> 
            <Ionicons
              name={confirmDestructive ? 'trash-outline' : 'checkmark-circle-outline'}
              size={28}
              color={iconColor}
            />
          </View>

          <Text style={[styles.title, theme?.titleColor ? { color: theme.titleColor } : null]}>{title}</Text>
          <Text style={[styles.body, theme?.bodyColor ? { color: theme.bodyColor } : null]}>{body}</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                theme?.cancelBackground ? { backgroundColor: theme.cancelBackground } : null,
                theme?.cancelBorder ? { borderColor: theme.cancelBorder } : null,
              ]}
              onPress={onCancel}
              disabled={isConfirming}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  theme?.cancelTextColor ? { color: theme.cancelTextColor } : null,
                ]}
              >
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                confirmDestructive
                  ? [styles.confirmButtonRed, theme?.destructiveBackground ? { backgroundColor: theme.destructiveBackground } : null]
                  : [styles.confirmButtonBlue, theme?.confirmBackground ? { backgroundColor: theme.confirmBackground } : null],
                isConfirming ? styles.confirmButtonDisabled : null,
              ]}
              onPress={onConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <ActivityIndicator size="small" color={theme?.confirmTextColor ?? '#fff'} />
              ) : (
                <Text
                  style={[
                    styles.confirmButtonText,
                    theme?.confirmTextColor ? { color: theme.confirmTextColor } : null,
                  ]}
                >
                  {confirmText}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderColor: 'transparent',
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonBlue: {
    backgroundColor: '#3b82f6',
  },
  confirmButtonRed: {
    backgroundColor: '#ef4444',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
})
