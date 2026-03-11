import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Eye, EyeOff, KeyRound, Settings2, ShieldAlert, UserRound, X } from 'lucide-react'
import { authApi } from '@/services/authApi'
import { userApi } from '@/services/userApi'
import { useCurrentUser } from '@/context/CurrentUserContext'
import { useBudgets } from '@/hooks/useBudgets'

type UserSettingsModalProps = {
  isOpen: boolean
  onClose: () => void
}

const fieldClass =
  'w-full rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[#111114] px-4 py-3.5 text-sm text-[#f0ede8] outline-none transition placeholder:text-[#4d4b47] hover:border-[rgba(255,255,255,0.12)] focus:border-[rgba(201,168,76,0.30)] focus:ring-1 focus:ring-[rgba(201,168,76,0.24)]'

const sectionKickerClass =
  "mb-1.5 block font-['DM_Mono',monospace] text-[10px] uppercase tracking-[0.14em] text-[#6b6862]"

const statusMessageClass = 'mt-4 rounded-[10px] border px-3.5 py-2.5 text-sm'

export const UserSettingsModal = ({ isOpen, onClose }: UserSettingsModalProps) => {
  const { currentUser, setCurrentUser } = useCurrentUser()
  const { resetDashboard } = useBudgets()
  const [displayName, setDisplayName] = useState(currentUser.displayName)
  const [email, setEmail] = useState(currentUser.email)
  const [accountError, setAccountError] = useState('')
  const [accountSuccess, setAccountSuccess] = useState('')
  const [isAccountSaving, setIsAccountSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)
  const [isResetConfirming, setIsResetConfirming] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [inlineNotice, setInlineNotice] = useState('')

  useEffect(() => {
    if (!isOpen) return

    setDisplayName(currentUser.displayName)
    setEmail(currentUser.email)
    setAccountError('')
    setAccountSuccess('')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setPasswordSuccess('')
    setIsPasswordVisible(false)
    setIsResetConfirming(false)
    setResetMessage('')
    if (!inlineNotice) {
      setInlineNotice('')
    }
  }, [currentUser.displayName, currentUser.email, inlineNotice, isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!inlineNotice) return

    const timer = window.setTimeout(() => {
      setInlineNotice('')
    }, 3200)

    return () => {
      window.clearTimeout(timer)
    }
  }, [inlineNotice])

  const accountDirty = useMemo(() => {
    return displayName.trim() !== currentUser.displayName || email.trim().toLowerCase() !== currentUser.email
  }, [currentUser.displayName, currentUser.email, displayName, email])

  if (!isOpen) {
    return null
  }

  const handleSaveAccount = async () => {
    const nextDisplayName = displayName.trim()
    const nextEmail = email.trim().toLowerCase()

    if (!nextDisplayName) {
      setAccountError('Display name is required.')
      setAccountSuccess('')
      return
    }

    if (!nextEmail) {
      setAccountError('Email is required.')
      setAccountSuccess('')
      return
    }

    setIsAccountSaving(true)
    setAccountError('')
    setAccountSuccess('')

    try {
      const updated = await userApi.updateMe({
        displayName: nextDisplayName,
        email: nextEmail,
      })

      setCurrentUser(updated)
      setAccountSuccess('Account details updated.')
      setInlineNotice('Account details updated.')
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Unable to save account details.')
    } finally {
      setIsAccountSaving(false)
    }
  }

  const handleSavePassword = async () => {
    setPasswordError('')
    setPasswordSuccess('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required.')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password must match.')
      return
    }

    setIsPasswordSaving(true)

    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      })

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess('Password updated successfully.')
      setInlineNotice('Password updated successfully.')
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Unable to change password.')
    } finally {
      setIsPasswordSaving(false)
    }
  }

  const handleConfirmReset = () => {
    resetDashboard()
    setIsResetConfirming(false)
    setResetMessage('All dashboard data has been cleared.')
    setInlineNotice('All dashboard data has been cleared.')
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close account settings"
        className="absolute inset-0 bg-[rgba(5,5,7,0.74)] backdrop-blur-[5px]"
        onClick={onClose}
      />

      <div className="relative z-[1] max-h-[calc(100vh-2rem)] w-full max-w-[760px] overflow-y-auto rounded-[18px] border border-[rgba(201,168,76,0.22)] bg-[#111114] shadow-[0_0_0_1px_#2a2a32,0_32px_90px_rgba(0,0,0,0.72),0_0_50px_rgba(201,168,76,0.06)]">
        <div className="relative overflow-hidden border-b border-[#2a2a32] bg-gradient-to-br from-[#18181c] to-[#111114] px-6 py-6">
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.12)_0%,transparent_70%)]" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(201,168,76,0.22)] bg-[rgba(201,168,76,0.10)] px-2.5 py-1 font-['DM_Mono',monospace] text-[10px] font-semibold uppercase tracking-[0.12em] text-[#c9a84c]">
                <Settings2 size={12} strokeWidth={1.8} />
                Account Settings
              </div>
              <h2 className="text-[26px] font-semibold tracking-[0.01em] text-[#f0ede8]">Private account control</h2>
              <p className="mt-1.5 max-w-[42rem] text-[13px] leading-5 text-[#6b6862]">
                Refine your identity details, rotate credentials, and keep destructive actions isolated behind an extra confirmation.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#2a2a32] bg-[#18181c] text-[#a09d98] transition hover:border-[rgba(255,255,255,0.12)] hover:text-[#f0ede8]"
            >
              <X size={16} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {inlineNotice ? (
            <div className="flex items-start gap-3 rounded-[14px] border border-[rgba(94,189,151,0.22)] bg-[linear-gradient(180deg,rgba(94,189,151,0.12),rgba(94,189,151,0.06))] px-4 py-3.5 text-[#d9f5e8] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[rgba(94,189,151,0.24)] bg-[rgba(94,189,151,0.10)] text-[#5ebd97]">
                <CheckCircle2 size={16} strokeWidth={1.9} />
              </span>
              <div>
                <p className="font-['DM_Mono',monospace] text-[10px] uppercase tracking-[0.14em] text-[#8fd3b4]">
                  Update Applied
                </p>
                <p className="mt-1 text-sm text-[#dff7eb]">{inlineNotice}</p>
              </div>
            </div>
          ) : null}

          <section className="rounded-[16px] border border-[rgba(255,255,255,0.055)] bg-[#18181c] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[rgba(201,168,76,0.22)] bg-[rgba(201,168,76,0.10)] text-[#c9a84c]">
                <UserRound size={16} strokeWidth={1.8} />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-[#f0ede8]">Account</h3>
                <p className="text-[12px] leading-5 text-[#6b6862]">Your visible name and the email used for sign-in.</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className={sectionKickerClass}>
                  Display name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className={sectionKickerClass}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>

            {accountError ? (
              <p className={`${statusMessageClass} border-[rgba(201,107,107,0.22)] bg-[rgba(201,107,107,0.08)] text-[#c96b6b]`}>
                {accountError}
              </p>
            ) : null}
            {accountSuccess ? (
              <p className={`${statusMessageClass} border-[rgba(94,189,151,0.22)] bg-[rgba(94,189,151,0.10)] text-[#5ebd97]`}>
                {accountSuccess}
              </p>
            ) : null}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAccount}
                disabled={!accountDirty || isAccountSaving}
                className="rounded-[11px] border border-[#c9a84c] bg-[#c9a84c] px-4 py-2.5 text-sm font-semibold text-[#0a0a0b] transition hover:border-[#e2c06a] hover:bg-[#e2c06a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAccountSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </section>

          <section className="rounded-[16px] border border-[rgba(255,255,255,0.055)] bg-[#18181c] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[rgba(91,163,201,0.22)] bg-[rgba(91,163,201,0.10)] text-[#5ba3c9]">
                <KeyRound size={16} strokeWidth={1.8} />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-[#f0ede8]">Password</h3>
                <p className="text-[12px] leading-5 text-[#6b6862]">Change your sign-in password with one visible confirmation pass.</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className={sectionKickerClass}>
                  Current password
                </label>
                <input
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className={fieldClass}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={sectionKickerClass}>
                    New password
                  </label>
                  <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={sectionKickerClass}>
                    Confirm password
                  </label>
                  <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsPasswordVisible((current) => !current)}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[#2a2a32] bg-[#111114] px-3 py-2.5 text-sm text-[#b8b4ae] transition hover:border-[rgba(255,255,255,0.12)] hover:text-[#f0ede8]"
              >
                {isPasswordVisible ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
                {isPasswordVisible ? 'Hide fields' : 'Show fields'}
              </button>

              <button
                type="button"
                onClick={handleSavePassword}
                disabled={isPasswordSaving}
                className="rounded-[11px] border border-[#5ba3c9] bg-[rgba(91,163,201,0.10)] px-4 py-2.5 text-sm font-semibold text-[#5ba3c9] transition hover:bg-[rgba(91,163,201,0.16)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPasswordSaving ? 'Saving...' : 'Save password'}
              </button>
            </div>

            {passwordError ? (
              <p className={`${statusMessageClass} border-[rgba(201,107,107,0.22)] bg-[rgba(201,107,107,0.08)] text-[#c96b6b]`}>
                {passwordError}
              </p>
            ) : null}
            {passwordSuccess ? (
              <p className={`${statusMessageClass} border-[rgba(94,189,151,0.22)] bg-[rgba(94,189,151,0.10)] text-[#5ebd97]`}>
                {passwordSuccess}
              </p>
            ) : null}
          </section>

          <section className="rounded-[16px] border border-[rgba(201,107,107,0.22)] bg-[rgba(201,107,107,0.05)] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[rgba(201,107,107,0.22)] bg-[rgba(201,107,107,0.10)] text-[#c96b6b]">
                <ShieldAlert size={16} strokeWidth={1.8} />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-[#f0ede8]">Danger zone</h3>
                <p className="text-[12px] leading-5 text-[#b68a8a]">Clear dashboard categories, transactions, income, and recurring rules in one destructive action.</p>
              </div>
            </div>

            {!isResetConfirming ? (
              <button
                type="button"
                onClick={() => {
                  setIsResetConfirming(true)
                  setResetMessage('')
                }}
                className="inline-flex items-center gap-2 rounded-[11px] border border-[rgba(201,107,107,0.26)] bg-[rgba(201,107,107,0.08)] px-4 py-2.5 text-sm font-semibold text-[#c96b6b] transition hover:bg-[rgba(201,107,107,0.14)]"
              >
                <AlertTriangle size={15} strokeWidth={1.8} />
                Reset all data
              </button>
            ) : (
              <div className="rounded-[14px] border border-[rgba(201,107,107,0.22)] bg-[rgba(10,10,11,0.45)] p-4">
                <p className="text-sm leading-6 text-[#f1c3c3]">This action cannot be undone. Continue only if you want a clean financial slate.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIsResetConfirming(false)}
                    className="rounded-[11px] border border-[#2a2a32] bg-[#111114] px-4 py-2.5 text-sm font-semibold text-[#b8b4ae] transition hover:border-[rgba(255,255,255,0.12)] hover:text-[#f0ede8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReset}
                    className="rounded-[11px] border border-[rgba(201,107,107,0.26)] bg-[rgba(201,107,107,0.12)] px-4 py-2.5 text-sm font-semibold text-[#c96b6b] transition hover:bg-[rgba(201,107,107,0.18)]"
                  >
                    Confirm reset
                  </button>
                </div>
              </div>
            )}

            {resetMessage ? (
              <p className={`${statusMessageClass} border-[rgba(94,189,151,0.22)] bg-[rgba(94,189,151,0.10)] text-[#5ebd97]`}>
                {resetMessage}
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  )
}
