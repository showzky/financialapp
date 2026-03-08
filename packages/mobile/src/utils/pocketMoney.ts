import type { CategoryWithSpent } from '../services/dashboardApi'

export type PocketMoneyRole = 'bills' | 'essential' | 'savings' | 'pocket'
export type PocketMoneyEssentialBucket = 'food' | 'fuel' | 'other'

type CategoryLike = {
  name: string
  type: 'budget' | 'fixed'
}

const normalizeName = (name: string) => name.trim().toLowerCase()

export const inferPocketMoneyRole = (category: CategoryLike): PocketMoneyRole => {
  if (category.type === 'fixed') {
    return 'bills'
  }

  const normalizedName = normalizeName(category.name)

  if (/(fun|personal|pocket|leisure|hobby|entertainment|play|fritid|lommepenger)/.test(normalizedName)) {
    return 'pocket'
  }

  if (/(saving|savings|buffer|emergency|invest|retire|fund|fond)/.test(normalizedName)) {
    return 'savings'
  }

  return 'essential'
}

export const inferEssentialBucket = (categoryName: string): PocketMoneyEssentialBucket => {
  const normalizedName = normalizeName(categoryName)

  if (/(food|grocer|grocery|mat|meal|restaurant|snack)/.test(normalizedName)) {
    return 'food'
  }

  if (/(fuel|drivstoff|gas|diesel|transport|uber|taxi|bus|train|parking|toll)/.test(normalizedName)) {
    return 'fuel'
  }

  return 'other'
}

export const getPocketMoneyRoleLabel = (role: PocketMoneyRole): string => {
  switch (role) {
    case 'bills':
      return 'Bills'
    case 'essential':
      return 'Essential'
    case 'savings':
      return 'Savings'
    case 'pocket':
      return 'Pocket money'
  }
}

export const summarizePocketMoneyCategory = (category: CategoryWithSpent) => {
  const role = inferPocketMoneyRole(category)
  return {
    role,
    bucket: role === 'essential' ? inferEssentialBucket(category.name) : role,
  }
}
