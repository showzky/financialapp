import React, { useMemo, useRef, useState } from 'react'
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import type { BalanceCategory, BalanceCategorySort, FinancialAccount } from './types'
import { BalanceAccountCard } from './BalanceAccountCard'
import { BalanceCategorySortPanel } from './BalanceCategorySortPanel'
import { CategorySettingsModal } from './CategorySettingsModal'
import { RenameCategoryModal } from './RenameCategoryModal'

type Props = {
  category: BalanceCategory
  accounts: FinancialAccount[]
  showInChart?: boolean
  onToggleShowInChart?: (val: boolean) => void
  onPressAccount?: (account: FinancialAccount) => void
  onRenameCategory?: (newName: string) => void | Promise<void>
  onMoveCategoryToBottom?: () => void | Promise<void>
}

const formatCurrency = (value: number) =>
  `kr ${Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

export function BalanceCategorySection({
  category,
  accounts,
  showInChart = true,
  onToggleShowInChart,
  onPressAccount,
  onRenameCategory,
  onMoveCategoryToBottom,
}: Props) {
  const [sortValue, setSortValue] = useState<BalanceCategorySort>('custom')
  const [sortVisible, setSortVisible] = useState(false)
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [renameVisible, setRenameVisible] = useState(false)
  const [anchorTop, setAnchorTop] = useState(0)
  const menuButtonRef = useRef<View>(null)

  const screenWidth = Dimensions.get('window').width

  const handleMenuPress = () => {
    menuButtonRef.current?.measure((_x, _y, width, _height, pageX, pageY) => {
      const right = screenWidth - pageX - width
      setAnchorTop(pageY)
      setSettingsVisible(true)
      // suppress unused warning — right is used below via state
      setAnchorRight(right)
    })
  }

  const [anchorRight, setAnchorRight] = useState(16)

  const total = useMemo(
    () => accounts.reduce((sum, account) => sum + account.amount, 0),
    [accounts],
  )

  const sortedAccounts = useMemo(() => {
    const rows = [...accounts]
    if (sortValue === 'balance') {
      return rows.sort((left, right) => Math.abs(right.amount) - Math.abs(left.amount))
    }
    if (sortValue === 'name') {
      return rows.sort((left, right) => left.name.localeCompare(right.name))
    }
    return rows
  }, [accounts, sortValue])

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          activeOpacity={0.85}
          onPress={() => setSortVisible((current) => !current)}
        >
          <Ionicons name="funnel-outline" size={14} color="rgba(240,244,252,0.52)" />
          <Text style={styles.categoryName}>{category.name}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          ref={menuButtonRef}
          style={styles.menuButton}
          activeOpacity={0.84}
          onPress={handleMenuPress}
        >
          <Ionicons name="ellipsis-vertical" size={15} color="rgba(240,244,252,0.52)" />
        </TouchableOpacity>
      </View>

      <View style={styles.totalRow}>
        <Ionicons name="sparkles-outline" size={12} color="rgba(233,239,250,0.48)" />
        <Text style={styles.total}>{`${total < 0 ? '-' : ''}${formatCurrency(total)}`}</Text>
      </View>

      {sortVisible ? <BalanceCategorySortPanel value={sortValue} onChange={setSortValue} /> : null}

      {sortedAccounts.length > 0 ? (
        <View style={styles.list}>
          {sortedAccounts.map((account) => (
            <BalanceAccountCard
              key={account.id}
              account={account}
              onPress={() => onPressAccount?.(account)}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>empty</Text>
      )}

      <CategorySettingsModal
        visible={settingsVisible}
        anchorTop={anchorTop}
        anchorRight={anchorRight}
        showInChart={showInChart}
        onToggleShowInChart={(val) => onToggleShowInChart?.(val)}
        onRename={() => setRenameVisible(true)}
        onMoveToBottom={() => {
          void onMoveCategoryToBottom?.()
        }}
        onClose={() => setSettingsVisible(false)}
      />

      <RenameCategoryModal
        visible={renameVisible}
        currentName={category.name}
        onClose={() => setRenameVisible(false)}
        onRename={(newName) => {
          void onRenameCategory?.(newName)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryName: {
    color: '#EAF0FA',
    fontSize: 16,
    textTransform: 'lowercase',
    fontFamily: 'DMSans_700Bold',
  },
  menuButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  total: {
    marginTop: 4,
    color: 'rgba(233,239,250,0.72)',
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
  },
  list: {
    marginTop: 12,
    gap: 10,
  },
  empty: {
    marginTop: 20,
    color: 'rgba(233,239,250,0.28)',
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },
})
