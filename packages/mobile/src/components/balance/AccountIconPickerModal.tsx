import React, { useState, type ComponentProps } from 'react'
import {
  ActivityIndicator,
  Alert,
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
import * as ImagePicker from 'expo-image-picker'

import type { AccountIconChoice } from '../../shared/contracts/accounts'
import { accountAssetApi, type AccountIconSearchResult } from '../../services/accountAssetApi'

type Props = {
  visible: boolean
  selectedIcon: AccountIconChoice | null
  fallbackIcon?: {
    name: ComponentProps<typeof Ionicons>['name']
    color: string
    backgroundColor: string
  } | null
  onClose: () => void
  onReset: () => void
  onSelectIcon: (icon: AccountIconChoice) => void
}

export function AccountIconPickerModal({
  visible,
  selectedIcon,
  fallbackIcon,
  onClose,
  onReset,
  onSelectIcon,
}: Props) {
  const [menuVisible, setMenuVisible] = useState(false)
  const [searchVisible, setSearchVisible] = useState(false)
  const [companyQuery, setCompanyQuery] = useState('')
  const [results, setResults] = useState<AccountIconSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentLabel = selectedIcon?.label ?? 'Choose an icon'

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        Alert.alert(
          'Allow photo access',
          'Photo access is needed so you can use one of your own images as the account icon.',
        )
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        selectionLimit: 1,
      })

      if (result.canceled || result.assets.length === 0) {
        return
      }

      const asset = result.assets[0]
      onSelectIcon({
        kind: 'image',
        label: 'Custom image',
        imageUrl: asset.uri,
      })
      setMenuVisible(false)
    } catch {
      Alert.alert('Could not open photos', 'Try again in a moment.')
    }
  }

  const handleSearch = async () => {
    const normalizedQuery = companyQuery.trim()
    if (normalizedQuery.length < 2) {
      setResults([])
      setError('Enter at least 2 letters to search')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const rows = await accountAssetApi.searchIcons(normalizedQuery)
      setResults(rows)
      if (rows.length === 0) {
        setError('No logos found yet')
      }
    } catch (searchError) {
      const message =
        searchError instanceof Error ? searchError.message : 'Could not search for logos'
      setResults([])
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <TouchableOpacity activeOpacity={0.85} onPress={() => setMenuVisible(true)}>
        <View style={styles.trigger}>
          <View style={styles.triggerContent}>
            {selectedIcon?.imageUrl ? (
              <Image source={{ uri: selectedIcon.imageUrl }} style={styles.triggerAvatar} />
            ) : fallbackIcon ? (
              <View
                style={[
                  styles.triggerAvatarPlaceholder,
                  { backgroundColor: fallbackIcon.backgroundColor, borderColor: 'transparent' },
                ]}
              >
                <Ionicons name={fallbackIcon.name} size={14} color={fallbackIcon.color} />
              </View>
            ) : (
              <View style={styles.triggerAvatarPlaceholder}>
                <Ionicons name="image-outline" size={14} color="rgba(255,255,255,0.34)" />
              </View>
            )}
            <Text style={styles.triggerText}>{currentLabel}</Text>
          </View>
          <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.4)" />
        </View>
      </TouchableOpacity>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.overlayTap} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.85} onPress={() => void handlePickImage()}>
              <Text style={styles.menuText}>Set image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.85}
              onPress={() => {
                setMenuVisible(false)
                setSearchVisible(true)
              }}
            >
              <Text style={styles.menuText}>Add icon</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.85}
              onPress={() => {
                setMenuVisible(false)
                onReset()
              }}
            >
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={searchVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSearchVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.searchPanel}>
            <Text style={styles.searchTitle}>Choose an icon</Text>
            <Text style={styles.searchSubtitle}>
              Here you can find the logo of your bank or other company and use it as an icon
            </Text>

            <View style={styles.searchInputWrap}>
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.42)" />
              <TextInput
                value={companyQuery}
                onChangeText={(value) => {
                  setCompanyQuery(value)
                  if (error) setError(null)
                }}
                placeholder="Enter company name"
                placeholderTextColor="rgba(255,255,255,0.26)"
                style={styles.searchInput}
              />
              {companyQuery.length > 0 ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    setCompanyQuery('')
                    setResults([])
                    setError(null)
                  }}
                >
                  <Ionicons name="close" size={18} color="rgba(255,255,255,0.46)" />
                </TouchableOpacity>
              ) : null}
            </View>

            {loading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="small" color="#6DB2FF" />
                <Text style={styles.loadingText}>Searching logos...</Text>
              </View>
            ) : results.length > 0 ? (
              <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
                {results.map((company) => (
                  <TouchableOpacity
                    key={`${company.domain}-${company.label}`}
                    style={styles.resultRow}
                    activeOpacity={0.86}
                    onPress={() => {
                      onSelectIcon({
                        kind: 'company',
                        label: company.label,
                        imageUrl: company.imageUrl,
                        companyQuery: company.domain,
                      })
                      setSearchVisible(false)
                    }}
                  >
                    <Image source={{ uri: company.imageUrl }} style={styles.resultLogo} />
                    <Text style={styles.resultText}>{company.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : error ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.searchFooter}>
              <TouchableOpacity
                style={styles.footerTextButton}
                activeOpacity={0.85}
                onPress={() => {
                  setCompanyQuery('')
                  setResults([])
                  setError(null)
                  onReset()
                }}
              >
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.footerTextButton}
                activeOpacity={0.85}
                onPress={() => setSearchVisible(false)}
              >
                <Text style={styles.footerText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.searchAction} activeOpacity={0.9} onPress={handleSearch}>
                <Text style={styles.searchActionText}>Search</Text>
              </TouchableOpacity>
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
    justifyContent: 'space-between',
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  triggerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  triggerAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerText: {
    color: '#EDF2FA',
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    flexShrink: 1,
  },
  overlayTap: {
    flex: 1,
    backgroundColor: 'rgba(4,6,10,0.12)',
  },
  menu: {
    marginTop: 350,
    marginLeft: 'auto',
    marginRight: 18,
    width: 156,
    borderRadius: 18,
    backgroundColor: '#232833',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  menuItem: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  menuText: {
    color: '#F4F7FB',
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  resetText: {
    color: '#F26F75',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4,6,10,0.56)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  searchPanel: {
    borderRadius: 24,
    backgroundColor: '#2A2F39',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  searchTitle: {
    color: '#F5F8FD',
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
  },
  searchSubtitle: {
    marginTop: 8,
    color: 'rgba(245,248,253,0.5)',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'DMSans_500Medium',
  },
  searchInputWrap: {
    marginTop: 16,
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
  searchInput: {
    flex: 1,
    color: '#F5F8FD',
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  results: {
    maxHeight: 240,
    marginTop: 14,
  },
  resultRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  resultLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  resultText: {
    color: '#F4F7FB',
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
  },
  noResults: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  loadingState: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: 'rgba(245,248,253,0.56)',
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  noResultsText: {
    color: 'rgba(245,248,253,0.46)',
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  searchFooter: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  footerTextButton: {
    minHeight: 42,
    justifyContent: 'center',
  },
  footerText: {
    color: 'rgba(245,248,253,0.8)',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  searchAction: {
    minWidth: 84,
    minHeight: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchActionText: {
    color: '#F5F8FD',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
})
