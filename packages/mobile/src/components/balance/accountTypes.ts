import type { ComponentProps } from 'react'
import { Ionicons } from '@expo/vector-icons'
import type { AccountMode } from '../../shared/contracts/accounts'

export type AccountTypeIconName = ComponentProps<typeof Ionicons>['name']

export type AccountTypeOption = {
  id: string
  mode: AccountMode
  label: string
  subtitle: string
  iconName: AccountTypeIconName
  iconColor: string
  iconBackground: string
}

export const accountTypeOptions: AccountTypeOption[] = [
  {
    id: 'orion-credit',
    mode: 'credit',
    label: 'Orion Credit',
    subtitle: 'Main credit line',
    iconName: 'card-outline',
    iconColor: '#FF8672',
    iconBackground: 'rgba(255,134,114,0.18)',
  },
  {
    id: 'visa-credit',
    mode: 'credit',
    label: 'Visa Credit',
    subtitle: 'Everyday card',
    iconName: 'card',
    iconColor: '#6DB2FF',
    iconBackground: 'rgba(109,178,255,0.18)',
  },
  {
    id: 'business-credit',
    mode: 'credit',
    label: 'Business Credit',
    subtitle: 'Work spending',
    iconName: 'briefcase-outline',
    iconColor: '#F1C35E',
    iconBackground: 'rgba(241,195,94,0.18)',
  },
  {
    id: 'travel-credit',
    mode: 'credit',
    label: 'Travel Card',
    subtitle: 'Trips and flights',
    iconName: 'airplane-outline',
    iconColor: '#8BC7FF',
    iconBackground: 'rgba(139,199,255,0.18)',
  },
  {
    id: 'store-credit',
    mode: 'credit',
    label: 'Store Credit',
    subtitle: 'Retail financing',
    iconName: 'bag-handle-outline',
    iconColor: '#D78EFF',
    iconBackground: 'rgba(215,142,255,0.18)',
  },
  {
    id: 'main-bank',
    mode: 'balance',
    label: 'Bank Account',
    subtitle: 'Main spending account',
    iconName: 'business-outline',
    iconColor: '#70D7A2',
    iconBackground: 'rgba(112,215,162,0.18)',
  },
  {
    id: 'savings-vault',
    mode: 'balance',
    label: 'Savings Vault',
    subtitle: 'Cash reserve',
    iconName: 'wallet-outline',
    iconColor: '#6DB2FF',
    iconBackground: 'rgba(109,178,255,0.18)',
  },
  {
    id: 'cash-wallet',
    mode: 'balance',
    label: 'Cash Wallet',
    subtitle: 'Physical money',
    iconName: 'cash-outline',
    iconColor: '#70D7A2',
    iconBackground: 'rgba(112,215,162,0.18)',
  },
  {
    id: 'stocks-portfolio',
    mode: 'balance',
    label: 'Stocks Portfolio',
    subtitle: 'Investments',
    iconName: 'trending-up-outline',
    iconColor: '#F1C35E',
    iconBackground: 'rgba(241,195,94,0.18)',
  },
  {
    id: 'crypto-wallet',
    mode: 'balance',
    label: 'Crypto Wallet',
    subtitle: 'Digital assets',
    iconName: 'logo-bitcoin',
    iconColor: '#FFB14A',
    iconBackground: 'rgba(255,177,74,0.18)',
  },
  {
    id: 'joint-account',
    mode: 'balance',
    label: 'Joint Account',
    subtitle: 'Shared expenses',
    iconName: 'people-outline',
    iconColor: '#E78EFF',
    iconBackground: 'rgba(231,142,255,0.18)',
  },
]

export const getAccountTypeOptionsForMode = (mode: AccountMode) =>
  accountTypeOptions.filter((option) => option.mode === mode)

