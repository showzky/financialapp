export type WishlistProgressSnapshot = {
  hasTargetPrice: boolean
  targetPrice: number | null
  savedAmount: number
  progressPercent: number
  roundedProgressPercent: number
  isReadyToBuy: boolean
  remainingAmountToTarget: number | null
}

export const getWishlistProgressSnapshot = (
  savedAmount: number,
  price: number | null | undefined,
): WishlistProgressSnapshot => {
  const targetPrice = price !== null && price !== undefined && Number.isFinite(price) && price > 0 ? price : null
  const normalizedSavedAmount = Number.isFinite(savedAmount) ? Math.max(0, savedAmount) : 0

  if (targetPrice === null) {
    return {
      hasTargetPrice: false,
      targetPrice: null,
      savedAmount: normalizedSavedAmount,
      progressPercent: 0,
      roundedProgressPercent: 0,
      isReadyToBuy: false,
      remainingAmountToTarget: null,
    }
  }

  const progressPercent = Math.min(100, Math.max(0, (normalizedSavedAmount / targetPrice) * 100))
  const remainingAmountToTarget = Math.max(0, targetPrice - normalizedSavedAmount)

  return {
    hasTargetPrice: true,
    targetPrice,
    savedAmount: normalizedSavedAmount,
    progressPercent,
    roundedProgressPercent: Math.round(progressPercent),
    isReadyToBuy: normalizedSavedAmount >= targetPrice,
    remainingAmountToTarget,
  }
}