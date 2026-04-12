export const ACTIVE_PREVIEW_LIMIT = 3

type GroupWithItems<TItem> = {
  items: readonly TItem[]
}

type VisibleGroup<TGroup, TItem> = Omit<TGroup, 'items'> & {
  items: TItem[]
}

export type ActiveListPreview<TItem> = {
  visibleItems: TItem[]
  totalCount: number
  visibleCount: number
  hiddenCount: number
  hasOverflow: boolean
  showAllItems: boolean
}

export type GroupedActiveListPreview<TGroup, TItem> = {
  visibleGroups: Array<VisibleGroup<TGroup, TItem>>
  totalCount: number
  visibleCount: number
  hiddenCount: number
  hasOverflow: boolean
  showAllItems: boolean
}

function resolvePreviewState(totalCount: number, expanded: boolean, limit: number) {
  const normalizedLimit = Math.max(limit, 0)
  const hasOverflow = totalCount > normalizedLimit

  return {
    normalizedLimit,
    hasOverflow,
    showAllItems: expanded || !hasOverflow,
  }
}

export function resolveActiveListPreview<TItem>(
  items: readonly TItem[],
  expanded: boolean,
  limit = ACTIVE_PREVIEW_LIMIT,
): ActiveListPreview<TItem> {
  const { normalizedLimit, hasOverflow, showAllItems } = resolvePreviewState(items.length, expanded, limit)
  const visibleItems = showAllItems ? [...items] : items.slice(0, normalizedLimit)

  return {
    visibleItems,
    totalCount: items.length,
    visibleCount: visibleItems.length,
    hiddenCount: Math.max(items.length - visibleItems.length, 0),
    hasOverflow,
    showAllItems,
  }
}

function cloneGroupWithItems<TItem, TGroup extends GroupWithItems<TItem>>(
  group: TGroup,
  items: TItem[],
): VisibleGroup<TGroup, TItem> {
  return {
    ...group,
    items,
  }
}

export function resolveGroupedActiveListPreview<TItem, TGroup extends GroupWithItems<TItem>>(
  groups: readonly TGroup[],
  expanded: boolean,
  limit = ACTIVE_PREVIEW_LIMIT,
): GroupedActiveListPreview<TGroup, TItem> {
  const totalCount = groups.reduce((sum, group) => sum + group.items.length, 0)
  const { normalizedLimit, hasOverflow, showAllItems } = resolvePreviewState(totalCount, expanded, limit)

  if (showAllItems) {
    const visibleGroups = groups.map((group) => cloneGroupWithItems(group, [...group.items]))

    return {
      visibleGroups,
      totalCount,
      visibleCount: totalCount,
      hiddenCount: 0,
      hasOverflow,
      showAllItems,
    }
  }

  let remaining = normalizedLimit
  const visibleGroups: Array<VisibleGroup<TGroup, TItem>> = []

  for (const group of groups) {
    if (remaining <= 0) {
      break
    }

    const visibleItems = group.items.slice(0, remaining)

    if (visibleItems.length === 0) {
      continue
    }

    visibleGroups.push(cloneGroupWithItems(group, [...visibleItems]))
    remaining -= visibleItems.length
  }

  const visibleCount = visibleGroups.reduce((sum, group) => sum + group.items.length, 0)

  return {
    visibleGroups,
    totalCount,
    visibleCount,
    hiddenCount: Math.max(totalCount - visibleCount, 0),
    hasOverflow,
    showAllItems,
  }
}