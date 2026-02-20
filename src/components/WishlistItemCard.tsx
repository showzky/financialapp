import { type WishlistItem } from '@/types/wishlist'

type WishlistItemCardProps = {
  item: WishlistItem
  formatWishlistPrice: (price: number | null) => string
  getDomainFromUrl: (value: string) => string
  onRefresh: (itemId: string) => void
  isRefreshing: boolean
  refreshError: string
  onDeposit: (itemId: string) => void
  onMarkPurchased: (item: WishlistItem) => void
  onRestorePurchased: (itemId: string) => void
  onVisitEdit: (item: WishlistItem) => void
  onDelete: (itemId: string) => void
}

export const WishlistItemCard = ({
  item,
  formatWishlistPrice,
  getDomainFromUrl,
  onRefresh,
  isRefreshing,
  refreshError,
  onDeposit,
  onMarkPurchased,
  onRestorePurchased,
  onVisitEdit,
  onDelete,
}: WishlistItemCardProps) => {
  const priorityVisuals = {
    High: {
      dotClassName: 'bg-red-500',
      badgeClassName: 'bg-red-100 text-red-700',
    },
    Medium: {
      dotClassName: 'bg-amber-500',
      badgeClassName: 'bg-amber-100 text-amber-700',
    },
    Low: {
      dotClassName: 'bg-emerald-500',
      badgeClassName: 'bg-emerald-100 text-emerald-700',
    },
  } as const

  const priorityVisual = priorityVisuals[item.priority]
  const metadataStatusVisuals = {
    fresh: 'bg-emerald-100 text-emerald-700',
    stale: 'bg-amber-100 text-amber-700',
    unknown: 'bg-slate-200 text-slate-700',
  } as const

  const metadataStatusLabel = {
    fresh: 'Metadata: Fresh',
    stale: 'Metadata: Stale',
    unknown: 'Metadata: Unknown',
  } as const

  const metadataCheckedAtLabel = item.metadataLastCheckedAt
    ? `Checked ${new Date(item.metadataLastCheckedAt).toLocaleDateString()}`
    : 'Not checked yet'

  const trendVisuals = {
    up: 'bg-red-100 text-red-700',
    down: 'bg-emerald-100 text-emerald-700',
    flat: 'bg-slate-200 text-slate-700',
    unknown: 'bg-slate-200 text-slate-700',
  } as const

  const trendLabel = {
    up: 'Price trend: Up',
    down: 'Price trend: Down',
    flat: 'Price trend: Flat',
    unknown: 'Price trend: Unknown',
  } as const

  const trendPercentLabel =
    item.priceTrendPercent === null ? null : `${Math.abs(item.priceTrendPercent).toFixed(2)}%`

  // ADD THIS: keep category tag placement consistent even when category is missing
  const categoryLabel = item.category.trim() === '' ? 'Uncategorized' : item.category.trim()

  const targetPrice = item.price !== null && item.price > 0 ? item.price : null
  const hasTargetPrice = targetPrice !== null
  const isPurchased = item.status === 'purchased'
  const progressPercent = hasTargetPrice ? Math.min(100, Math.max(0, (item.savedAmount / targetPrice) * 100)) : 0
  const isReadyToBuy = hasTargetPrice && item.savedAmount >= targetPrice
  const remainingAmountToTarget = hasTargetPrice ? Math.max(0, targetPrice - item.savedAmount) : null
  const purchasedAtLabel = item.purchasedAt ? new Date(item.purchasedAt).toLocaleDateString() : null
  // ADD THIS: stable labels for accessible action controls
  const itemTitleForAction = item.title.trim() === '' ? 'item' : item.title.trim()

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-2xl shadow-neo-sm ${
        isReadyToBuy ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'bg-surface'
      }`}
    >
      <div className="grid h-36 place-items-center border-b border-slate-200 bg-slate-50 p-3">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="h-full w-full rounded-lg object-contain" loading="lazy" />
        ) : (
          <div className="grid place-items-center gap-3 text-text-muted">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-surface shadow-neo-inset">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M14 5h5v5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 14 19 5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 13v6H5V5h6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm">Product Placeholder</p>
          </div>
        )}
      </div>

      {/* ADD THIS: flexible card body to keep action rows aligned at the bottom */}
      <div className="flex flex-1 flex-col space-y-3 p-4">
        <h3 className="line-clamp-2 text-2xl font-semibold text-text-primary">{item.title}</h3>
        <p className="text-lg font-semibold text-text-primary">{formatWishlistPrice(item.price)}</p>

        {/* ADD THIS: position tags under price and above progress for clearer reading flow */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${priorityVisual.badgeClassName}`}
          >
            <span className={`h-2 w-2 rounded-full ${priorityVisual.dotClassName}`} aria-hidden="true" />
            {item.priority} priority
          </span>

          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${metadataStatusVisuals[item.metadataStatus]}`}
            title={metadataCheckedAtLabel}
          >
            {metadataStatusLabel[item.metadataStatus]}
          </span>

          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="inline-block mr-1 h-4 w-4 text-slate-500"
              fill="none"
              viewBox="0 0 20 20"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path d="M17.707 10.293l-8-8A1 1 0 008.586 2H3a1 1 0 00-1 1v5.586a1 1 0 00.293.707l8 8a1 1 0 001.414 0l6-6a1 1 0 000-1.414z" />
              <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor" />
            </svg>
            {categoryLabel}
          </span>

          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${trendVisuals[item.priceTrendDirection]}`}
            title={
              item.previousTrackedPrice !== null && item.latestTrackedPrice !== null
                ? `From ${formatWishlistPrice(item.previousTrackedPrice)} to ${formatWishlistPrice(item.latestTrackedPrice)}`
                : 'Trend will appear after at least two tracked prices.'
            }
          >
            {trendLabel[item.priceTrendDirection]}
            {trendPercentLabel ? <span>({trendPercentLabel})</span> : null}
          </span>

          {isPurchased ? (
            // ADD THIS: explicit archive badge so purchased items are instantly recognizable
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Purchased
            </span>
          ) : null}
        </div>

        {hasTargetPrice ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <p className="font-medium text-slate-700">Saved: {formatWishlistPrice(item.savedAmount)}</p>
              <p className="text-slate-600">{Math.round(progressPercent)}%</p>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all ${isReadyToBuy ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {isReadyToBuy ? <p className="text-sm font-medium text-emerald-700">Ready to buy</p> : null}
          </div>
        ) : (
          <p className="text-sm text-text-muted">Set a product price to track deposit progress.</p>
        )}

        {isPurchased ? (
          <p className="text-sm font-medium text-emerald-700">
            Purchased{purchasedAtLabel ? ` on ${purchasedAtLabel}` : ''}
            {item.purchasedAmount !== null ? ` · ${formatWishlistPrice(item.purchasedAmount)}` : ''}
          </p>
        ) : null}

        {/* ADD THIS: bottom action block pinned to the end for row alignment */}
        <div className="mt-auto space-y-3">
          <p className="inline-flex items-center gap-2 text-sm text-text-muted">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M14 5h5v5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 14 19 5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19 13v6H5V5h6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {getDomainFromUrl(item.url)}
          </p>

          {/* ADD THIS: tighter, wrapping action row so all buttons stay visible */}
          <div className="flex flex-wrap items-center gap-1.5">
            {isPurchased ? (
              <button
                type="button"
                onClick={() => onRestorePurchased(item.id)}
                aria-label={`Restore ${itemTitleForAction} to active wishlist`}
                className="rounded-xl bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200"
              >
                Restore
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onRefresh(item.id)}
                  disabled={isRefreshing}
                  aria-label={`Refresh metadata for ${itemTitleForAction}`}
                  className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRefreshing ? 'Refreshing…' : 'Refresh'}
                </button>

                <button
                  type="button"
                  onClick={() => onDeposit(item.id)}
                  aria-label={`Add funds to ${itemTitleForAction}`}
                  className="rounded-xl bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  Deposit
                </button>

                {isReadyToBuy ? (
                  <button
                    type="button"
                    onClick={() => onMarkPurchased(item)}
                    aria-label={`Mark ${itemTitleForAction} as purchased`}
                    className="rounded-xl bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200"
                  >
                    Mark purchased
                  </button>
                ) : null}
              </>
            )}

            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Visit product page for ${itemTitleForAction}`}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M14 5h5v5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 14 19 5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 13v6H5V5h6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Visit
            </a>

            {!isPurchased ? (
              <>
                <button
                  type="button"
                  aria-label={`Edit ${itemTitleForAction}`}
                  onClick={() => onVisitEdit(item)}
                  className="grid h-9 w-9 place-items-center rounded-lg text-blue-600 transition hover:bg-blue-50"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="m13.5 5.5 5 5" strokeLinecap="round" strokeLinejoin="round" />
                    <path
                      d="M4 20h4l10-10a1.8 1.8 0 0 0-4-4L4 16v4Z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  aria-label={`Delete ${itemTitleForAction}`}
                  onClick={() => onDelete(item.id)}
                  className="grid h-9 w-9 place-items-center rounded-lg text-red-600 transition hover:bg-red-50"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 6V4h8v2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </>
            ) : null}
          </div>

          {!isPurchased && hasTargetPrice && !isReadyToBuy && remainingAmountToTarget !== null ? (
            // ADD THIS: keep next-step guidance visible when purchase action is not yet available
            <p className="text-xs text-text-muted" aria-live="polite">
              Add {formatWishlistPrice(remainingAmountToTarget)} more to unlock “Mark purchased”.
            </p>
          ) : null}

          {!isPurchased && !hasTargetPrice ? (
            // ADD THIS: explain why purchase action is unavailable when target price is missing
            <p className="text-xs text-text-muted" aria-live="polite">
              Set a target price to unlock “Mark purchased”.
            </p>
          ) : null}

          {refreshError ? <p className="text-xs text-red-600">{refreshError}</p> : null}
        </div>
      </div>
    </article>
  )
}
