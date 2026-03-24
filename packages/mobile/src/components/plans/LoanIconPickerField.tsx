import React, { useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { accountAssetApi } from '../../services/accountAssetApi'

export type LoanIconValue = { label: string; imageUrl: string }

type Props = {
  value: LoanIconValue | null
  onSelect: (icon: LoanIconValue | null) => void
}

export function LoanIconPickerField({ value, onSelect }: Props) {
  const [searchVisible, setSearchVisible] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LoanIconValue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const handleSearch = async () => {
    const normalized = query.trim()
    if (normalized.length < 2) {
      setResults([])
      setError('Enter at least 2 characters to search')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const rows = await accountAssetApi.searchIcons(normalized)
      setResults(rows)
      setImageErrors({})
      if (rows.length === 0) setError('No logos found — try a different spelling')
    } catch (err) {
      setResults([])
      setError(err instanceof Error ? err.message : 'Could not search for logos')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSearchVisible(false)
    setQuery('')
    setResults([])
    setError(null)
  }

  return (
    <>
      <TouchableOpacity style={styles.trigger} activeOpacity={0.85} onPress={() => setSearchVisible(true)}>
        {value ? (
          imageErrors[value.imageUrl] ? (
            <View style={styles.triggerPlaceholder}>
              <Text style={styles.fallbackInitial}>{value.label[0]?.toUpperCase()}</Text>
            </View>
          ) : (
            <Image
              source={{ uri: value.imageUrl }}
              style={styles.triggerLogo}
              onError={() => setImageErrors(prev => ({ ...prev, [value.imageUrl]: true }))}
            />
          )
        ) : (
          <View style={styles.triggerPlaceholder}>
            <Ionicons name="image-outline" size={15} color="rgba(255,255,255,0.3)" />
          </View>
        )}
        <Text style={[styles.triggerLabel, !value && styles.triggerPlaceholderLabel]} numberOfLines={1}>
          {value ? value.label : 'Search bank or company logo'}
        </Text>
        <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.36)" />
      </TouchableOpacity>

      <Modal visible={searchVisible} transparent animationType="fade" onRequestClose={handleClose}>
        <View style={styles.backdrop}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Company Logo</Text>
            <Text style={styles.panelSubtitle}>
              Search for your bank or institution's logo to use as an icon
            </Text>

            <View style={styles.searchRow}>
              <Ionicons name="search" size={17} color="rgba(255,255,255,0.38)" />
              <TextInput
                value={query}
                onChangeText={(v) => {
                  setQuery(v)
                  if (error) setError(null)
                }}
                placeholder="e.g. DNB, Santander, Sparebank 1"
                placeholderTextColor="rgba(255,255,255,0.24)"
                style={styles.searchInput}
                autoCapitalize="none"
                returnKeyType="search"
                onSubmitEditing={() => void handleSearch()}
              />
              {query.length > 0 ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    setQuery('')
                    setResults([])
                    setError(null)
                  }}
                >
                  <Ionicons name="close" size={17} color="rgba(255,255,255,0.44)" />
                </TouchableOpacity>
              ) : null}
            </View>

            {loading ? (
              <View style={styles.stateBox}>
                <ActivityIndicator size="small" color="#6DB2FF" />
                <Text style={styles.stateText}>Searching logos...</Text>
              </View>
            ) : results.length > 0 ? (
              <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
                {results.map((item) => (
                  <TouchableOpacity
                    key={`${item.label}-${item.imageUrl}`}
                    style={styles.resultRow}
                    activeOpacity={0.85}
                    onPress={() => {
                      onSelect(item)
                      handleClose()
                    }}
                  >
                    {imageErrors[item.imageUrl] ? (
                      <View style={[styles.resultLogo, styles.resultLogoFallback]}>
                        <Text style={styles.fallbackInitial}>{item.label[0]?.toUpperCase()}</Text>
                      </View>
                    ) : (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.resultLogo}
                        onError={() => setImageErrors(prev => ({ ...prev, [item.imageUrl]: true }))}
                      />
                    )}
                    <Text style={styles.resultLabel} numberOfLines={1}>{item.label}</Text>
                    <Ionicons name="checkmark" size={16} color="rgba(109,178,255,0.7)" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : error ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateError}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.footer}>
              <View style={styles.footerLeft}>
                {value ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      onSelect(null)
                      handleClose()
                    }}
                  >
                    <Text style={styles.removeText}>Remove icon</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={styles.footerRight}>
                <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.85} onPress={handleClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.searchBtn} activeOpacity={0.9} onPress={() => void handleSearch()}>
                  <Text style={styles.searchBtnText}>Search</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  triggerLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  triggerPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerLabel: {
    flex: 1,
    color: '#EDF2FA',
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  triggerPlaceholderLabel: {
    color: 'rgba(255,255,255,0.24)',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.64)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  panel: {
    backgroundColor: '#181B28',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  panelTitle: {
    color: '#F4F7FB',
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
    marginBottom: 4,
  },
  panelSubtitle: {
    color: 'rgba(255,255,255,0.44)',
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    marginBottom: 16,
    lineHeight: 18,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 12,
    minHeight: 46,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: '#F4F7FB',
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
  },
  stateBox: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  stateText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
  },
  stateError: {
    color: 'rgba(210,120,120,0.9)',
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
  },
  resultsList: {
    maxHeight: 200,
    marginBottom: 4,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  resultLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  resultLogoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackInitial: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  resultLabel: {
    flex: 1,
    color: '#EDF2FA',
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  footerLeft: {
    flex: 1,
  },
  footerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  removeText: {
    color: 'rgba(200,80,90,0.85)',
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  cancelText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },
  searchBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#4C89E8',
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
  },
})
