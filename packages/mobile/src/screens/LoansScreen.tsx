// @ts-nocheck
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { loanApi, type Loan, type LoanSummary } from '../services/loanApi'
import { AddLoanModal } from '../components/AddLoanModal'
import { EditLoanModal } from '../components/EditLoanModal'
import { ConfirmModal } from '../components/ConfirmModal'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

type TabKey = 'mine' | 'lent'

const STATUS_CONFIG = {
  due_soon: {
    label: 'Forfaller snart',
    color: '#b45309',
    bg: '#fef3c7',
    dot: '#f59e0b',
  },
  outstanding: {
    label: 'Utestaende',
    color: '#475569',
    bg: '#e2e8f0',
    dot: '#94a3b8',
  },
  overdue: {
    label: 'Forfalt',
    color: '#b91c1c',
    bg: '#fee2e2',
    dot: '#ef4444',
  },
  repaid: {
    label: 'Tilbakebetalt',
    color: '#047857',
    bg: '#d1fae5',
    dot: '#10b981',
  },
} as const

function formatNOK(n: number) {
  return `NOK ${n.toLocaleString('nb-NO')}`
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return 'Ikke satt'
  try {
    return new Date(dateString).toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function avatarColor(name: string) {
  const colors = ['#6366f1', '#ec4899', '#f97316', '#14b8a6', '#8b5cf6', '#0ea5e9']
  let hash = 0
  for (const char of name) hash = (hash + char.charCodeAt(0)) % colors.length
  return colors[hash]
}

function getDaysRemaining(loan: Loan) {
  if (loan.status === 'repaid' || loan.daysRemaining === null) return '--'
  return Math.max(0, loan.daysRemaining)
}

function getLoanNotes(loan: Loan) {
  return loan.notes?.trim() || ''
}

function LentLoanCard({
  loan,
  onEdit,
  onMarkRepaid,
}: {
  loan: Loan
  onEdit: (loan: Loan) => void
  onMarkRepaid: (loan: Loan) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const status = STATUS_CONFIG[loan.status] ?? STATUS_CONFIG.outstanding
  const avatar = avatarColor(loan.recipient)

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpanded((prev) => !prev)
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={toggleExpanded}
      style={[
        styles.loanCard,
        expanded ? styles.loanCardExpanded : null,
        loan.status === 'repaid' ? styles.loanCardRepaid : null,
      ]}
    >
      <View style={styles.loanTopRow}>
        <View style={styles.loanIdentity}>
          <View style={[styles.avatar, { backgroundColor: avatar }]}>
            <Text style={styles.avatarText}>{getInitials(loan.recipient)}</Text>
          </View>
          <View style={styles.loanIdentityText}>
            <Text style={styles.loanName}>{loan.recipient}</Text>
            <Text style={styles.loanSubtext}>Gitt {formatDate(loan.dateGiven)}</Text>
          </View>
        </View>

        <View style={styles.loanRightBlock}>
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
            <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.remainingAmount}>{formatNOK(loan.amount)}</Text>
        </View>
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Belop</Text>
          <Text style={styles.metricValue}>{formatNOK(loan.amount)}</Text>
        </View>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Forfall</Text>
          <Text style={styles.metricValue}>{formatDate(loan.expectedRepaymentDate)}</Text>
        </View>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Dager igjen</Text>
          <Text
            style={[
              styles.metricValue,
              loan.status !== 'repaid' && typeof loan.daysRemaining === 'number' && loan.daysRemaining <= 7
                ? styles.metricValueWarning
                : null,
            ]}
          >
            {getDaysRemaining(loan)}
          </Text>
        </View>
      </View>

      {getLoanNotes(loan) ? (
        <View style={styles.notesBanner}>
          <Ionicons name="chatbubble-ellipses-outline" size={14} color="#a78bfa" />
          <Text style={styles.notesText} numberOfLines={2}>
            {getLoanNotes(loan)}
          </Text>
        </View>
      ) : null}

      {expanded ? (
        <View style={styles.loanExpandedSection}>
          <View style={styles.loanExpandedGrid}>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Opprettet</Text>
              <Text style={styles.detailValue}>{formatDate(loan.createdAt)}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Oppdatert</Text>
              <Text style={styles.detailValue}>{formatDate(loan.updatedAt)}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Tilbakebetalt</Text>
              <Text style={styles.detailValue}>{formatDate(loan.repaidAt)}</Text>
            </View>
          </View>

          {loan.status !== 'repaid' ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={() => onEdit(loan)}
                activeOpacity={0.8}
              >
                <Ionicons name="pencil" size={15} color="#475569" />
                <Text style={styles.secondaryActionText}>Rediger</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={() => onMarkRepaid(loan)}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.primaryActionText}>Marker tilbakebetalt</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : null}
    </TouchableOpacity>
  )
}

function MineLoansPlaceholder() {
  return (
    <View style={styles.placeholderCard}>
      <View style={styles.placeholderIcon}>
        <Ionicons name="business-outline" size={22} color="#1d4ed8" />
      </View>
      <Text style={styles.placeholderTitle}>Mine lan er ikke koblet til backend ennå</Text>
      <Text style={styles.placeholderText}>
        Prototypen hadde en egen seksjon for personlige banklan. Denne appen har forelopig bare
        ekte data og handlinger for utlante lan, sa jeg lot designet bli, men uten hardkodet
        demo-innhold.
      </Text>
    </View>
  )
}

export function LoansScreen() {
  const [tab, setTab] = useState<TabKey>('lent')
  const [loans, setLoans] = useState<Loan[]>([])
  const [summary, setSummary] = useState<LoanSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refetching, setRefetching] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ type: 'repaid'; loan: Loan } | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [repaidExpanded, setRepaidExpanded] = useState(false)

  const fetchLoans = async () => {
    try {
      setError('')
      const [loansData, summaryData] = await Promise.all([loanApi.list(), loanApi.getSummary()])
      setLoans(loansData)
      setSummary(summaryData)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load loans'
      setError(msg)
      console.error('Error loading loans:', msg)
    } finally {
      setLoading(false)
      setRefetching(false)
    }
  }

  useEffect(() => {
    fetchLoans()
  }, [])

  const onRefresh = async () => {
    setRefetching(true)
    await fetchLoans()
  }

  const handleAddLoan = async (payload) => {
    await loanApi.create(payload)
    setIsAddModalOpen(false)
    await fetchLoans()
  }

  const handleEditLoan = async (id, payload) => {
    await loanApi.update(id, payload)
    setEditingLoan(null)
    await fetchLoans()
  }

  const handleConfirmAction = async () => {
    if (!confirmModal) return
    setIsConfirming(true)
    try {
      await loanApi.markRepaid(confirmModal.loan.id)
      setConfirmModal(null)
      await fetchLoans()
    } catch (e) {
      console.error('Confirm action failed:', e)
    } finally {
      setIsConfirming(false)
    }
  }

  const toggleRepaid = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setRepaidExpanded((prev) => !prev)
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    )
  }

  const activeLoans = loans.filter((loan) => loan.status !== 'repaid')
  const repaidLoans = loans.filter((loan) => loan.status === 'repaid')
  const totalLent = summary?.totalOutstandingAmount ?? activeLoans.reduce((sum, loan) => sum + loan.amount, 0)

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refetching} onRefresh={onRefresh} tintColor="#1d4ed8" />
        }
      >
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroEyebrow}>Oversikt</Text>
              <Text style={styles.heroTitle}>Lan</Text>
            </View>
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={styles.heroIconButton}
                onPress={onRefresh}
                disabled={refetching}
                activeOpacity={0.8}
              >
                {refetching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="refresh" size={18} color="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.heroIconButton, styles.heroAddButton]}
                onPress={() => setIsAddModalOpen(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color="#0f172a" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryTileLabel}>Mine lan</Text>
              <Text style={styles.summaryTileValue}>Ikke koblet</Text>
              <Text style={styles.summaryTileMeta}>Venter pa ekte datakilde</Text>
            </View>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryTileLabel}>Utlaant</Text>
              <Text style={styles.summaryTileValue}>{formatNOK(totalLent)}</Text>
              <Text style={styles.summaryTileMeta}>{activeLoans.length} aktive</Text>
            </View>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#991b1b" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.tabWrap}>
          {[
            { key: 'mine' as const, label: 'Mine lan', icon: 'business-outline' as const },
            { key: 'lent' as const, label: 'Utlaant', icon: 'swap-horizontal-outline' as const },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.tabButton, tab === item.key ? styles.tabButtonActive : null]}
              onPress={() => setTab(item.key)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={item.icon}
                size={16}
                color={tab === item.key ? '#0f172a' : '#64748b'}
              />
              <Text style={[styles.tabLabel, tab === item.key ? styles.tabLabelActive : null]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'mine' ? (
          <View style={styles.section}>
            <Text style={styles.sectionHint}>Prototype-layout beholdt uten demo-data</Text>
            <MineLoansPlaceholder />
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionHint}>{activeLoans.length} aktive utlån</Text>
                <Text style={styles.sectionTitle}>Utlaante lan</Text>
              </View>
              <TouchableOpacity
                style={styles.inlineAddButton}
                onPress={() => setIsAddModalOpen(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={15} color="#fff" />
                <Text style={styles.inlineAddButtonText}>Nytt lan</Text>
              </TouchableOpacity>
            </View>

            {activeLoans.length > 0 ? (
              activeLoans.map((loan) => (
                <LentLoanCard
                  key={loan.id}
                  loan={loan}
                  onEdit={setEditingLoan}
                  onMarkRepaid={(selectedLoan) =>
                    setConfirmModal({ type: 'repaid', loan: selectedLoan })
                  }
                />
              ))
            ) : !error ? (
              <View style={styles.placeholderCard}>
                <Ionicons name="document-text-outline" size={36} color="#cbd5e1" />
                <Text style={styles.placeholderTitle}>Ingen aktive utlån</Text>
                <Text style={styles.placeholderText}>
                  Legg til ditt forste utlån for a begynne a spore forfall og tilbakebetalinger.
                </Text>
              </View>
            ) : null}

            {repaidLoans.length > 0 ? (
              <View style={styles.repaidSection}>
                <TouchableOpacity
                  style={styles.repaidHeader}
                  onPress={toggleRepaid}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={styles.sectionHint}>Historikk</Text>
                    <Text style={styles.sectionTitle}>Tilbakebetalte lan ({repaidLoans.length})</Text>
                  </View>
                  <Ionicons
                    name={repaidExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#64748b"
                  />
                </TouchableOpacity>

                {repaidExpanded
                  ? repaidLoans.map((loan) => (
                      <LentLoanCard
                        key={loan.id}
                        loan={loan}
                        onEdit={setEditingLoan}
                        onMarkRepaid={(selectedLoan) =>
                          setConfirmModal({ type: 'repaid', loan: selectedLoan })
                        }
                      />
                    ))
                  : null}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      <AddLoanModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddLoan}
      />

      <EditLoanModal
        isOpen={editingLoan !== null}
        loan={editingLoan}
        onClose={() => setEditingLoan(null)}
        onSubmit={handleEditLoan}
      />

      <ConfirmModal
        isOpen={confirmModal !== null}
        title="Marker som tilbakebetalt?"
        body={`Er du sikker pa at lanet til ${confirmModal?.loan.recipient ?? ''} er tilbakebetalt?`}
        confirmText="Marker tilbakebetalt"
        cancelText="Avbryt"
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal(null)}
        isConfirming={isConfirming}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingBottom: 28,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  hero: {
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: '#0f172a',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroEyebrow: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: '#94a3b8',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#f8fafc',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  heroIconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroAddButton: {
    backgroundColor: '#e2e8f0',
    borderColor: '#e2e8f0',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryTile: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  summaryTileLabel: {
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 8,
  },
  summaryTileValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  summaryTileMeta: {
    marginTop: 6,
    fontSize: 11,
    color: '#94a3b8',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '600',
  },
  tabWrap: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabLabelActive: {
    color: '#0f172a',
  },
  section: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  sectionHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  inlineAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    gap: 6,
  },
  inlineAddButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  loanCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  loanCardExpanded: {
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  loanCardRepaid: {
    opacity: 0.82,
  },
  loanTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  loanIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  loanIdentityText: {
    flex: 1,
  },
  loanName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  loanSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  loanRightBlock: {
    alignItems: 'flex-end',
    gap: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  remainingAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 16,
  },
  metricBlock: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
  },
  metricLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  metricValueWarning: {
    color: '#d97706',
  },
  notesBanner: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  loanExpandedSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#eef2f7',
  },
  loanExpandedGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  detailCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
  },
  detailLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  primaryAction: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: '#ecfdf5',
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  placeholderCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    alignItems: 'center',
  },
  placeholderIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  placeholderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: '#64748b',
    textAlign: 'center',
  },
  repaidSection: {
    marginTop: 10,
  },
  repaidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
})
