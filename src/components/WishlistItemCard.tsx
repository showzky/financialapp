import { useState } from 'react'
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

const priorityVisuals = {
  High: {
    dotClassName: 'bg-red-500',
    badgeClassName: 'bg-red-50 text-red-700 border border-red-100',
  },
  Medium: {
    dotClassName: 'bg-amber-500',
    badgeClassName: 'bg-amber-50 text-amber-700 border border-amber-100',
  },
  Low: {
    dotClassName: 'bg-emerald-500',
    badgeClassName: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  },
} as const

const metadataStatusVisuals = {
  fresh: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  stale: 'bg-amber-50 text-amber-700 border border-amber-100',
  unknown: 'bg-slate-100 text-slate-700 border border-slate-200',
} as const

const metadataStatusLabel = {
  fresh: 'Fresh',
  stale: 'Stale',
  unknown: 'Unknown',
} as const

const trendVisuals = {
  up: 'bg-red-50 text-red-700 border border-red-100',
  down: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  flat: 'bg-slate-100 text-slate-700 border border-slate-200',
  unknown: 'bg-slate-100 text-slate-700 border border-slate-200',
} as const

const trendLabel = {
  up: 'Up',
  down: 'Down',
  flat: 'Flat',
  unknown: 'Unknown',
} as const

type IconActionProps = {
  ariaLabel: string
  title: string
  onClick?: () => void
  href?: string
  disabled?: boolean
  tone?: 'default' | 'primary' | 'positive' | 'danger'
  children: React.ReactNode
}

const IconAction = ({
  ariaLabel,
  title,
  onClick,
  href,
  disabled = false,
  tone = 'default',
  children,
}: IconActionProps) => {
  const toneClassMap = {
    default: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    primary: 'border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100',
    positive: 'border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    danger: 'border-red-100 bg-red-50 text-red-700 hover:bg-red-100',
  } as const

  const buttonClassName = `grid h-8 w-8 place-items-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${toneClassMap[tone]} disabled:cursor-not-allowed disabled:opacity-50`

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={ariaLabel}
        title={title}
        className={buttonClassName}
      >
        {children}
      </a>
    )
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={buttonClassName}
    >
      {children}
    </button>
  )
}

type ImageSectionProps = {
  title: string
  imageUrl: string
  isPurchased: boolean
  isReadyToBuy: boolean
  imageBadgeLabel: string
  badgeClassName: string
}

const ImageSection = ({
  title,
  imageUrl,
  isPurchased,
  isReadyToBuy,
  imageBadgeLabel,
  badgeClassName,
}: ImageSectionProps) => (
  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100">
    {imageUrl ? (
      <img
        src={imageUrl}
        alt={title}
        loading="lazy"
        className="h-full w-full object-cover transition duration-300 md:group-hover:scale-[1.02]"
      />
    ) : (
      <div className="grid h-full place-items-center text-text-muted">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <path d="M14 5h5v5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 14 19 5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 13v6H5V5h6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )}

    <span
      className={`absolute left-2 top-2 inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${
        isPurchased || isReadyToBuy ? 'bg-emerald-100 text-emerald-700' : badgeClassName
      }`}
    >
      {imageBadgeLabel}
    </span>
  </div>
)

type MetadataRowProps = {
  priority: WishlistItem['priority']
  dotClassName: string
  badgeClassName: string
  categoryLabel: string
  metadataStatus: WishlistItem['metadataStatus']
  metadataCheckedAtLabel: string
}

const MetadataRow = ({
  priority,
  dotClassName,
  badgeClassName,
  categoryLabel,
  metadataStatus,
  metadataCheckedAtLabel,
}: MetadataRowProps) => (
  <div className="flex flex-wrap items-center gap-1.5">
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${badgeClassName}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClassName}`} aria-hidden="true" />
      {priority}
    </span>

    <span className="inline-flex max-w-[42%] items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-700">
      <span className="truncate">{categoryLabel}</span>
    </span>

    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${metadataStatusVisuals[metadataStatus]}`}
      title={metadataCheckedAtLabel}
    >
      {metadataStatusLabel[metadataStatus]}
    </span>
  </div>
)

type SavingsProgressProps = {
  hasTargetPrice: boolean
  savedAmount: number
  roundedProgressPercent: number
  isReadyToBuy: boolean
  progressPercent: number
  formatWishlistPrice: (price: number | null) => string
}

const SavingsProgress = ({
  hasTargetPrice,
  savedAmount,
  roundedProgressPercent,
  isReadyToBuy,
  progressPercent,
  formatWishlistPrice,
}: SavingsProgressProps) =>
  hasTargetPrice ? (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[0.72rem] font-medium text-slate-600">
        <p className="truncate">Saved {formatWishlistPrice(savedAmount)}</p>
        <p>{roundedProgressPercent}%</p>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all ${isReadyToBuy ? 'bg-emerald-500' : 'bg-blue-500'}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  ) : (
    <p className="text-[0.72rem] text-text-muted">Set a target price to track progress.</p>
  )

type NotesSectionProps = {
  hasNotes: boolean
  displayedNotes: string
  shouldTruncateNotes: boolean
  isNotesExpanded: boolean
  onToggleExpanded: () => void
}

const NotesSection = ({
  hasNotes,
  displayedNotes,
  shouldTruncateNotes,
  isNotesExpanded,
  onToggleExpanded,
}: NotesSectionProps) => {
  if (!hasNotes) {
    return null
  }

  return (
    <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-2">
      <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">Notes</p>
      <p className="whitespace-pre-line break-words text-[0.72rem] text-slate-700">
        {displayedNotes}
      </p>
      {shouldTruncateNotes ? (
        <button
          type="button"
          onClick={onToggleExpanded}
          className="text-[0.72rem] font-semibold text-blue-700 hover:text-blue-800"
        >
          {isNotesExpanded ? 'Show less' : 'Show more'}
        </button>
      ) : null}
    </div>
  )
}

type ActionsRowProps = {
  isPurchased: boolean
  itemTitleForAction: string
  onRestorePurchased: (itemId: string) => void
  itemId: string
  isRefreshing: boolean
  onRefresh: (itemId: string) => void
  isReadyToBuy: boolean
  onMarkPurchased: (item: WishlistItem) => void
  item: WishlistItem
  onDeposit: (itemId: string) => void
  onVisitEdit: (item: WishlistItem) => void
  onDelete: (itemId: string) => void
}

const ActionsRow = ({
  isPurchased,
  itemTitleForAction,
  onRestorePurchased,
  itemId,
  isRefreshing,
  onRefresh,
  isReadyToBuy,
  onMarkPurchased,
  item,
  onDeposit,
  onVisitEdit,
  onDelete,
}: ActionsRowProps) => (
  <div className="mt-auto flex items-center justify-between gap-2 pt-1">
    <div className="flex items-center gap-1.5">
      {isPurchased ? (
        <IconAction
          ariaLabel={`Restore ${itemTitleForAction} to active wishlist`}
          title="Restore"
          onClick={() => onRestorePurchased(itemId)}
          tone="positive"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M4 4v6h6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 20v-6h-6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 8a8 8 0 0 0-14-4L4 10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m20 14-2 6a8 8 0 0 1-14-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconAction>
      ) : (
        <>
          <IconAction
            ariaLabel={`Refresh metadata for ${itemTitleForAction}`}
            title={isRefreshing ? 'Refreshing...' : 'Refresh metadata'}
            onClick={() => onRefresh(itemId)}
            disabled={isRefreshing}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M4 4v6h6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 20v-6h-6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 8a8 8 0 0 0-14-4L4 10" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m20 14-2 6a8 8 0 0 1-14-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </IconAction>

          {isReadyToBuy ? (
            <IconAction
              ariaLabel={`Mark ${itemTitleForAction} as purchased`}
              title="Mark purchased"
              onClick={() => onMarkPurchased(item)}
              tone="positive"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </IconAction>
          ) : (
            <IconAction
              ariaLabel={`Add funds to ${itemTitleForAction}`}
              title="Deposit funds"
              onClick={() => onDeposit(itemId)}
              tone="primary"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </IconAction>
          )}
        </>
      )}

      <IconAction
        ariaLabel={`Visit product page for ${itemTitleForAction}`}
        title="Visit product"
        href={item.url}
        tone="default"
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
      </IconAction>
    </div>

    {!isPurchased ? (
      <details className="relative">
        <summary className="grid h-8 w-8 cursor-pointer list-none place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M5 12h14M12 5v14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>

        <div className="absolute right-0 z-50 mt-2 min-w-[8rem] rounded-lg border border-slate-200 bg-white p-1.5 shadow-md">
          <button
            type="button"
            onClick={() => onVisitEdit(item)}
            className="w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-blue-700 transition hover:bg-blue-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(itemId)}
            className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-red-700 transition hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </details>
    ) : null}
  </div>
)

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
  const [isNotesExpanded, setIsNotesExpanded] = useState(false)

  const categoryLabel = item.category.trim() === '' ? 'Uncategorized' : item.category.trim()
  const metadataCheckedAtLabel = item.metadataLastCheckedAt
    ? `Checked ${new Date(item.metadataLastCheckedAt).toLocaleDateString()}`
    : 'Not checked yet'
  const trendPercentLabel =
    item.priceTrendPercent === null ? null : `${Math.abs(item.priceTrendPercent).toFixed(1)}%`
  const targetPrice = item.price !== null && item.price > 0 ? item.price : null
  const hasTargetPrice = targetPrice !== null
  const isPurchased = item.status === 'purchased'
  const progressPercent = hasTargetPrice
    ? Math.min(100, Math.max(0, (item.savedAmount / targetPrice) * 100))
    : 0
  const roundedProgressPercent = Math.round(progressPercent)
  const isReadyToBuy = hasTargetPrice && item.savedAmount >= targetPrice
  const remainingAmountToTarget = hasTargetPrice
    ? Math.max(0, targetPrice - item.savedAmount)
    : null
  const purchasedAtLabel = item.purchasedAt ? new Date(item.purchasedAt).toLocaleDateString() : null
  const itemTitleForAction = item.title.trim() === '' ? 'item' : item.title.trim()
  const priorityVisual = priorityVisuals[item.priority]
  const imageBadgeLabel = isPurchased ? 'Purchased' : isReadyToBuy ? 'Ready' : item.priority
  const notesPreviewCharacterLimit = 200
  const normalizedNotes = item.notes?.trim() ?? ''
  const hasNotes = normalizedNotes.length > 0
  const shouldTruncateNotes = normalizedNotes.length > notesPreviewCharacterLimit
  const displayedNotes =
    hasNotes && !isNotesExpanded && shouldTruncateNotes
      ? `${normalizedNotes.slice(0, notesPreviewCharacterLimit)}...`
      : normalizedNotes

  return (
    <article
      className={`group relative flex h-full min-h-[320px] max-h-[450px] flex-col rounded-2xl border p-3 shadow-sm transition hover:z-30 focus-within:z-30 md:min-h-[400px] md:max-h-[550px] md:p-4 md:hover:scale-[1.02] md:hover:shadow-md ${
        isReadyToBuy || isPurchased
          ? 'border-emerald-200 bg-emerald-50/40'
          : 'border-slate-200 bg-white'
      }`}
    >
      <ImageSection
        title={item.title}
        imageUrl={item.imageUrl}
        isPurchased={isPurchased}
        isReadyToBuy={isReadyToBuy}
        imageBadgeLabel={imageBadgeLabel}
        badgeClassName={priorityVisual.badgeClassName}
      />

      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2.5">
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-base font-semibold leading-tight text-slate-900 md:text-lg">
            {item.title}
          </h3>

          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-text-primary md:text-base">
              {formatWishlistPrice(item.price)}
            </p>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${trendVisuals[item.priceTrendDirection]}`}
              title={
                item.previousTrackedPrice !== null && item.latestTrackedPrice !== null
                  ? `From ${formatWishlistPrice(item.previousTrackedPrice)} to ${formatWishlistPrice(item.latestTrackedPrice)}`
                  : 'Trend appears after at least two tracked prices.'
              }
            >
              {trendLabel[item.priceTrendDirection]}
              {trendPercentLabel ? ` ${trendPercentLabel}` : ''}
            </span>
          </div>
        </div>

        <MetadataRow
          priority={item.priority}
          dotClassName={priorityVisual.dotClassName}
          badgeClassName={priorityVisual.badgeClassName}
          categoryLabel={categoryLabel}
          metadataStatus={item.metadataStatus}
          metadataCheckedAtLabel={metadataCheckedAtLabel}
        />
        <SavingsProgress
          hasTargetPrice={hasTargetPrice}
          savedAmount={item.savedAmount}
          roundedProgressPercent={roundedProgressPercent}
          isReadyToBuy={isReadyToBuy}
          progressPercent={progressPercent}
          formatWishlistPrice={formatWishlistPrice}
        />
        <NotesSection
          hasNotes={hasNotes}
          displayedNotes={displayedNotes}
          shouldTruncateNotes={shouldTruncateNotes}
          isNotesExpanded={isNotesExpanded}
          onToggleExpanded={() => setIsNotesExpanded((current) => !current)}
        />

        <p className="truncate text-[0.72rem] text-text-muted" title={getDomainFromUrl(item.url)}>
          {getDomainFromUrl(item.url)}
        </p>

        {isPurchased ? (
          <p className="text-[0.72rem] font-medium text-emerald-700">
            Purchased{purchasedAtLabel ? ` · ${purchasedAtLabel}` : ''}
            {item.purchasedAmount !== null ? ` · ${formatWishlistPrice(item.purchasedAmount)}` : ''}
          </p>
        ) : null}

        {!isPurchased && hasTargetPrice && !isReadyToBuy && remainingAmountToTarget !== null ? (
          <p className="text-[0.72rem] text-text-muted" aria-live="polite">
            Add {formatWishlistPrice(remainingAmountToTarget)} more to mark purchased.
          </p>
        ) : null}

        {!isPurchased && !hasTargetPrice ? (
          <p className="text-[0.72rem] text-text-muted" aria-live="polite">
            Add a target price to unlock purchased state.
          </p>
        ) : null}

        {refreshError ? <p className="text-[0.72rem] text-red-600">{refreshError}</p> : null}

        <ActionsRow
          isPurchased={isPurchased}
          itemTitleForAction={itemTitleForAction}
          onRestorePurchased={onRestorePurchased}
          itemId={item.id}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
          isReadyToBuy={isReadyToBuy}
          onMarkPurchased={onMarkPurchased}
          item={item}
          onDeposit={onDeposit}
          onVisitEdit={onVisitEdit}
          onDelete={onDelete}
        />
      </div>
    </article>
  )
}
