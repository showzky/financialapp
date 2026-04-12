import { expect, test } from 'vitest'

import {
  ACTIVE_PREVIEW_LIMIT,
  resolveActiveListPreview,
  resolveGroupedActiveListPreview,
} from './activePreview'

test('resolveActiveListPreview leaves short lists fully visible', () => {
  const preview = resolveActiveListPreview(['first', 'second', 'third'], false)

  expect(preview).toEqual({
    visibleItems: ['first', 'second', 'third'],
    totalCount: 3,
    visibleCount: 3,
    hiddenCount: 0,
    hasOverflow: false,
    showAllItems: true,
  })
})

test('resolveActiveListPreview caps collapsed lists at the preview limit', () => {
  const preview = resolveActiveListPreview(['first', 'second', 'third', 'fourth', 'fifth'], false)

  expect(preview).toEqual({
    visibleItems: ['first', 'second', 'third'],
    totalCount: 5,
    visibleCount: ACTIVE_PREVIEW_LIMIT,
    hiddenCount: 2,
    hasOverflow: true,
    showAllItems: false,
  })
})

test('resolveActiveListPreview returns all items when expanded', () => {
  const preview = resolveActiveListPreview(['first', 'second', 'third', 'fourth'], true)

  expect(preview).toEqual({
    visibleItems: ['first', 'second', 'third', 'fourth'],
    totalCount: 4,
    visibleCount: 4,
    hiddenCount: 0,
    hasOverflow: true,
    showAllItems: true,
  })
})

test('resolveGroupedActiveListPreview preserves group order while collapsing', () => {
  const preview = resolveGroupedActiveListPreview(
    [
      {
        key: 'tech',
        total: 2,
        items: ['camera', 'phone'],
      },
      {
        key: 'travel',
        total: 2,
        items: ['bag', 'passport-holder'],
      },
      {
        key: 'home',
        total: 1,
        items: ['lamp'],
      },
    ],
    false,
  )

  expect(preview).toEqual({
    visibleGroups: [
      {
        key: 'tech',
        total: 2,
        items: ['camera', 'phone'],
      },
      {
        key: 'travel',
        total: 2,
        items: ['bag'],
      },
    ],
    totalCount: 5,
    visibleCount: 3,
    hiddenCount: 2,
    hasOverflow: true,
    showAllItems: false,
  })
})

test('resolveGroupedActiveListPreview returns full groups when expanded', () => {
  const preview = resolveGroupedActiveListPreview(
    [
      {
        key: 'tech',
        total: 2,
        items: ['camera', 'phone'],
      },
      {
        key: 'travel',
        total: 2,
        items: ['bag', 'passport-holder'],
      },
    ],
    true,
  )

  expect(preview).toEqual({
    visibleGroups: [
      {
        key: 'tech',
        total: 2,
        items: ['camera', 'phone'],
      },
      {
        key: 'travel',
        total: 2,
        items: ['bag', 'passport-holder'],
      },
    ],
    totalCount: 4,
    visibleCount: 4,
    hiddenCount: 0,
    hasOverflow: true,
    showAllItems: true,
  })
})