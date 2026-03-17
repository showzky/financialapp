import React, { useEffect, useState } from 'react'
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

type Props = {
  visible: boolean
  onClose: () => void
  onCreate: (name: string) => void | Promise<void>
}

export function CreateAccountCategoryModal({ visible, onClose, onCreate }: Props) {
  const [name, setName] = useState('')

  useEffect(() => {
    if (!visible) {
      setName('')
    }
  }, [visible])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <TouchableOpacity style={styles.closeButton} activeOpacity={0.85} onPress={onClose}>
            <Ionicons name="close" size={18} color="rgba(245,248,253,0.6)" />
          </TouchableOpacity>
          <Text style={styles.title}>Create account category</Text>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Category name"
            placeholderTextColor="rgba(255,255,255,0.22)"
            style={styles.input}
          />
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.85}
              onPress={onClose}
            >
              <Text style={styles.secondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                const normalized = name.trim()
                if (!normalized) return
                onCreate(normalized)
                onClose()
              }}
            >
              <LinearGradient colors={['#6DB2FF', '#4C89E8']} style={styles.primaryButton}>
                <Text style={styles.primaryText}>Create</Text>
              </LinearGradient>
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
    backgroundColor: 'rgba(4,6,10,0.56)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  panel: {
    borderRadius: 24,
    backgroundColor: '#232833',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 16,
  },
  closeButton: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#F5F8FD',
    fontSize: 24,
    textAlign: 'center',
    fontFamily: 'DMSans_700Bold',
    marginTop: 14,
  },
  label: {
    marginTop: 22,
    marginBottom: 8,
    color: 'rgba(235,240,248,0.42)',
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
  },
  input: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    color: '#F5F8FD',
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  footer: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryButton: {
    minWidth: 96,
    minHeight: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: 'rgba(245,248,253,0.82)',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  primaryButton: {
    minWidth: 126,
    minHeight: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  primaryText: {
    color: '#F8FBFF',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
})
