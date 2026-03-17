import React from 'react'
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { FinancialAccount } from '../../shared/contracts/accounts'

type Props = {
  visible: boolean
  accounts: FinancialAccount[]
  selectedAccountId: string | null
  onClose: () => void
  onSelect: (account: FinancialAccount | null) => void
}

export function FinancialAccountPickerModal({
  visible,
  accounts,
  selectedAccountId,
  onClose,
  onSelect,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <Text style={styles.title}>Choose account</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.row, !selectedAccountId ? styles.rowSelected : undefined]}
              activeOpacity={0.88}
              onPress={() => onSelect(null)}
            >
              <View style={styles.rowLeft}>
                <View style={styles.noneIcon}>
                  <Ionicons name="remove-outline" size={16} color="rgba(245,248,253,0.62)" />
                </View>
                <View>
                  <Text style={styles.rowTitle}>None</Text>
                  <Text style={styles.rowSubtitle}>Do not link this entry to an account</Text>
                </View>
              </View>
              {!selectedAccountId ? (
                <Ionicons name="checkmark-circle" size={18} color="#72d39f" />
              ) : null}
            </TouchableOpacity>

            {accounts.map((account) => {
              const selected = account.id === selectedAccountId
              return (
                <TouchableOpacity
                  key={account.id}
                  style={[styles.row, selected ? styles.rowSelected : undefined]}
                  activeOpacity={0.88}
                  onPress={() => onSelect(account)}
                >
                  <View style={styles.rowLeft}>
                    <View style={styles.accountIcon}>
                      <Ionicons
                        name={account.mode === 'credit' ? 'card-outline' : 'wallet-outline'}
                        size={16}
                        color="rgba(245,248,253,0.82)"
                      />
                    </View>
                    <View>
                      <Text style={styles.rowTitle}>{account.name}</Text>
                      <Text style={styles.rowSubtitle}>{account.categoryName}</Text>
                    </View>
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={18} color="#72d39f" />
                  ) : null}
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} activeOpacity={0.88} onPress={onClose}>
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
    maxHeight: '72%',
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
    minHeight: 62,
    borderRadius: 18,
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
    borderColor: 'rgba(114,211,159,0.42)',
    backgroundColor: 'rgba(114,211,159,0.06)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  noneIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  accountIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(109,178,255,0.16)',
  },
  rowTitle: {
    color: '#F5F8FD',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  rowSubtitle: {
    marginTop: 2,
    color: 'rgba(245,248,253,0.36)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  closeButton: {
    minHeight: 46,
    marginTop: 4,
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
