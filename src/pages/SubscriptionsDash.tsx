import React, { useCallback, useEffect, useState } from 'react'
import { SubscriptionLedger } from '@/components/subscriptions/SubscriptionLedger'
import { SubscriptionSummaryCards } from '@/components/subscriptions/SubscriptionSummaryCards'
import { SubscriptionDashboardPanel } from '@/components/subscriptions/SubscriptionDashboardPanel'
// HUD utilities (monospaced font, status-dot helpers) are still leveraged
// on this page via hud.css, but the top-level scan-line animation has been
// intentionally omitted to keep the subscriptions dashboard visually
// quieter.
import '@/styles/hud.css'
import { SubscriptionModal } from '@/components/subscriptions/SubscriptionModal'
import { subscriptionApi, type CreateSubscriptionPayload } from '@/services/subscriptionApi'
import { trackEvent } from '@/services/telemetry'
import { ConfirmModal } from '@/components/ConfirmModal'
import { AppToast } from '@/components/RecurringAutomationToast'
import type { Subscription, SubscriptionStatus } from '@/types/subscription'

export const SubscriptionsDash: React.FC = () => {
  const [toastMessage, setToastMessage] = useState('')
  const [toastVariant, setToastVariant] = useState<'success' | 'error' | 'info'>('success')
  const [pendingDelete, setPendingDelete] = useState<Subscription | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null)

  const handleAddClick = () => {
    setEditingSubscription(null)
    setIsModalOpen(true)
  }

  const loadSubscriptions = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const rows = await subscriptionApi.list()
      setSubscriptions(rows)
      trackEvent('subscriptions_load_success', { count: rows.length })
    } catch (error) {
      trackEvent('subscriptions_load_error', {
        message: error instanceof Error ? error.message : 'unknown_error',
      })
      setLoadError(error instanceof Error ? error.message : 'Could not load subscriptions')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSubscriptions()
  }, [loadSubscriptions])

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription)
    setIsModalOpen(true)
  }

  const handleRequestDelete = (subscription: Subscription) => {
    setPendingDelete(subscription)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return

    setIsDeleting(true)
    try {
      await subscriptionApi.delete(pendingDelete.id)
      setSubscriptions((current) => current.filter((s) => s.id !== pendingDelete.id))
      setToastVariant('success')
      setToastMessage('Subscription deleted')
      trackEvent('subscription_delete_success', { id: pendingDelete.id })
      setPendingDelete(null)
    } catch (error) {
      trackEvent('subscription_delete_error', {
        id: pendingDelete.id,
        message: error instanceof Error ? error.message : 'unknown_error',
      })
      setToastVariant('error')
      setToastMessage(error instanceof Error ? error.message : 'Failed to delete')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleStatus = async (subscription: Subscription) => {
    const wasActive = subscription.status === 'active'
    const nextStatus: SubscriptionStatus = wasActive ? 'paused' : 'active'

    setPendingToggleId(subscription.id)
    try {
      const updated = await subscriptionApi.toggleStatus(subscription.id, { status: nextStatus })
      setSubscriptions((current) =>
        current.map((s) => {
          if (s.id !== updated.id) return s
          return updated
        }),
      )
      setToastVariant('success')
      setToastMessage(`Status changed to ${updated.status}`)
      trackEvent('subscription_toggle_success', {
        id: subscription.id,
        nextStatus: updated.status,
      })
    } catch (error) {
      trackEvent('subscription_toggle_error', {
        id: subscription.id,
        message: error instanceof Error ? error.message : 'unknown_error',
      })
      setToastVariant('error')
      setToastMessage(error instanceof Error ? error.message : 'Could not update status')
    } finally {
      setPendingToggleId(null)
    }
  }

  const handleSave = async (payload: CreateSubscriptionPayload) => {
    try {
      const saved = editingSubscription
        ? await subscriptionApi.update(editingSubscription.id, payload)
        : await subscriptionApi.create(payload)

      setSubscriptions((current) => {
        const index = current.findIndex((s) => s.id === saved.id)
        if (index === -1) return [saved, ...current]
        const next = current.slice()
        next[index] = saved
        return next
      })

      setToastVariant('success')
      setToastMessage(editingSubscription ? 'Subscription updated' : 'Subscription added')
      trackEvent(editingSubscription ? 'subscription_update_success' : 'subscription_create_success', {
        id: saved.id,
      })
      setIsModalOpen(false)
      setEditingSubscription(null)
    } catch (error) {
      setToastVariant('error')
      const message = error instanceof Error ? error.message : 'Could not save subscription'
      setToastMessage(message)
      trackEvent(editingSubscription ? 'subscription_update_error' : 'subscription_create_error', {
        message,
      })
      throw error
    }
  }

  return (
    <div className="relative min-h-screen pt-12 overflow-hidden bg-[var(--app-bg)]">
      <div className="vacation-hud-grid relative z-10 mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <SubscriptionDashboardPanel
          subscriptions={subscriptions}
          isLoading={isLoading}
          loadError={loadError}
        />

        <SubscriptionSummaryCards
          subscriptions={subscriptions}
          isLoading={isLoading}
          loadError={loadError}
        />

        <SubscriptionLedger
          subscriptions={subscriptions}
          isLoading={isLoading}
          loadError={loadError}
          onRetryLoad={loadSubscriptions}
          onEdit={handleEdit}
          onAdd={handleAddClick}
          onToggleStatus={handleToggleStatus}
          onDelete={handleRequestDelete}
          pendingToggleId={pendingToggleId}
        />

        <SubscriptionModal
          isOpen={isModalOpen}
          subscription={editingSubscription}
          onClose={() => {
            setIsModalOpen(false)
            setEditingSubscription(null)
          }}
          onSave={handleSave}
        />

        <ConfirmModal
          isOpen={Boolean(pendingDelete)}
          title="Delete subscription?"
          body={
            pendingDelete
              ? `Are you sure you want to delete "${pendingDelete.name}"?`
              : 'Are you sure you want to delete this subscription?'
          }
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
          isConfirming={isDeleting}
        />

        {toastMessage ? (
          <AppToast
            message={toastMessage}
            variant={toastVariant}
            onClose={() => setToastMessage('')}
          />
        ) : null}
      </div>
    </div>
  )
}

export default SubscriptionsDash
