import React, { RefObject } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import PagerView from 'react-native-pager-view'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import type { LoginScreenTheme } from '../../customthemes/login'

type AuthMode = 'login' | 'register'

type LoginFormCardProps = {
  theme: LoginScreenTheme
  mode: AuthMode
  pagerRef: RefObject<PagerView | null>
  onModeChange: (mode: AuthMode) => void
  onPageSelected: (index: number) => void
  login: {
    email: string
    password: string
    error: string | null
    loading: boolean
    onEmailChange: (value: string) => void
    onPasswordChange: (value: string) => void
    onSubmit: () => void
  }
  register: {
    displayName: string
    email: string
    password: string
    error: string | null
    loading: boolean
    enabled: boolean
    checkingAvailability: boolean
    onDisplayNameChange: (value: string) => void
    onEmailChange: (value: string) => void
    onPasswordChange: (value: string) => void
    onSubmit: () => void
  }
}

export function LoginFormCard({
  theme,
  mode,
  pagerRef,
  onModeChange,
  onPageSelected,
  login,
  register,
}: LoginFormCardProps) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.cardBackground,
          borderColor: theme.colors.cardBorder,
        },
      ]}
    >
      <View
        style={[
          styles.segmentedWrap,
          {
            backgroundColor: theme.colors.segmentedBackground,
            borderColor: theme.colors.segmentedBorder,
          },
        ]}
      >
        <SegmentButton
          theme={theme}
          active={mode === 'login'}
          label="Sign in"
          onPress={() => onModeChange('login')}
        />
        <SegmentButton
          theme={theme}
          active={mode === 'register'}
          label="Create account"
          onPress={() => onModeChange('register')}
        />
      </View>

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(event) => onPageSelected(event.nativeEvent.position)}
      >
        <View key="login" style={styles.page}>
          <AuthPanel
            theme={theme}
            title="Sign in"
            description="Connect to your Finance Tracker account and continue where your cashflow left off."
            error={login.error}
            fields={
              <>
                <Field
                  label="Email or username"
                  theme={theme}
                  value={login.email}
                  onChangeText={login.onEmailChange}
                  editable={!login.loading}
                  placeholder="owner@financetracker.local"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Field
                  label="Password"
                  theme={theme}
                  value={login.password}
                  onChangeText={login.onPasswordChange}
                  editable={!login.loading}
                  placeholder="Enter your password"
                  secureTextEntry
                />
              </>
            }
            footer={
              <View style={styles.metaRow}>
                <View style={styles.keepSignedInRow}>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: theme.colors.accentSurface,
                        borderColor: theme.colors.accentBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.checkboxTick, { color: theme.colors.accentIcon }]}>✓</Text>
                  </View>
                  <Text style={[styles.metaText, { color: theme.colors.body }]}>
                    {theme.keepSignedInLabel}
                  </Text>
                </View>

                <TouchableOpacity activeOpacity={0.75}>
                  <Text style={[styles.metaAction, { color: theme.colors.accentIcon }]}>
                    {theme.forgotPasswordLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            }
            submitLabel={theme.submitLabel}
            submitDisabled={!login.email.trim() || !login.password || login.loading}
            submitLoading={login.loading}
            onSubmit={login.onSubmit}
          />
        </View>

        <View key="register" style={styles.page}>
          <AuthPanel
            theme={theme}
            title="Create account"
            description="Create your Finance Tracker account and start managing your money flow from one place."
            error={
              !register.checkingAvailability && !register.enabled
                ? 'Public registration is currently disabled'
                : register.error
            }
            fields={
              <>
                <Field
                  label="Display name"
                  theme={theme}
                  value={register.displayName}
                  onChangeText={register.onDisplayNameChange}
                  editable={!register.loading && register.enabled}
                  placeholder="Andre"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <Field
                  label="Email"
                  theme={theme}
                  value={register.email}
                  onChangeText={register.onEmailChange}
                  editable={!register.loading && register.enabled}
                  placeholder="owner@financetracker.local"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Field
                  label="Password"
                  theme={theme}
                  value={register.password}
                  onChangeText={register.onPasswordChange}
                  editable={!register.loading && register.enabled}
                  placeholder="Choose a secure password"
                  secureTextEntry
                />
              </>
            }
            footer={
              <View style={styles.swipeHintWrap}>
                <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
                <Text style={[styles.swipeHint, { color: theme.colors.muted }]}>
                  Swipe back to sign in
                </Text>
                <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
              </View>
            }
            submitLabel="Create account"
            submitDisabled={
              !register.enabled ||
              register.loading ||
              !register.displayName.trim() ||
              !register.email.trim() ||
              !register.password
            }
            submitLoading={register.loading}
            onSubmit={register.onSubmit}
          />
        </View>
      </PagerView>
    </View>
  )
}

function SegmentButton({
  theme,
  active,
  label,
  onPress,
}: {
  theme: LoginScreenTheme
  active: boolean
  label: string
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={styles.segmentButton}>
      {active ? (
        <LinearGradient
          colors={theme.colors.segmentedThumb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.segmentThumb,
            {
              shadowColor: theme.colors.segmentedThumbShadow,
            },
          ]}
        >
          <Text style={[styles.segmentTextActive, { color: theme.colors.segmentedActiveText }]}>
            {label}
          </Text>
        </LinearGradient>
      ) : (
        <View style={styles.segmentThumbIdle}>
          <Text style={[styles.segmentTextIdle, { color: theme.colors.segmentedInactiveText }]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  )
}

function AuthPanel({
  theme,
  title,
  description,
  error,
  fields,
  footer,
  submitLabel,
  submitDisabled,
  submitLoading,
  onSubmit,
}: {
  theme: LoginScreenTheme
  title: string
  description: string
  error: string | null
  fields: React.ReactNode
  footer: React.ReactNode
  submitLabel: string
  submitDisabled: boolean
  submitLoading: boolean
  onSubmit: () => void
}) {
  return (
    <View style={styles.panel}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: theme.colors.eyebrow }]}>Secure access</Text>
          <Text style={[styles.title, { color: theme.colors.title }]}>{title}</Text>
          <Text style={[styles.description, { color: theme.colors.body }]}>{description}</Text>
        </View>

        <View
          style={[
            styles.accentBadge,
            {
              backgroundColor: theme.colors.accentSurface,
              borderColor: theme.colors.accentBorder,
            },
          ]}
        >
          <Ionicons name="sparkles" size={16} color={theme.colors.accentIcon} />
        </View>
      </View>

      {error ? (
        <View
          style={[
            styles.errorBox,
            {
              backgroundColor: theme.colors.errorBackground,
              borderColor: theme.colors.errorBorder,
            },
          ]}
        >
          <Text style={[styles.errorText, { color: theme.colors.errorText }]}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.fields}>{fields}</View>

      {footer}

      <TouchableOpacity activeOpacity={0.92} onPress={onSubmit} disabled={submitDisabled}>
        <LinearGradient
          colors={submitDisabled ? theme.colors.buttonDisabled : theme.colors.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.submitButton,
            {
              shadowColor: theme.colors.buttonShadow,
            },
          ]}
        >
          {submitLoading ? (
            <ActivityIndicator size="small" color={theme.colors.buttonText} />
          ) : (
            <Text style={[styles.submitButtonText, { color: theme.colors.buttonText }]}>
              {submitLabel}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

function Field({
  label,
  theme,
  ...inputProps
}: React.ComponentProps<typeof TextInput> & { label: string; theme: LoginScreenTheme }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.colors.muted }]}>{label}</Text>
      <TextInput
        {...inputProps}
        placeholderTextColor={theme.colors.inputPlaceholder}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.inputBackground,
            borderColor: theme.colors.inputBorder,
            color: theme.colors.inputText,
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 34,
    padding: 14,
    overflow: 'hidden',
  },
  segmentedWrap: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderRadius: 28,
    padding: 10,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
  },
  segmentThumb: {
    minHeight: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.32,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  segmentThumbIdle: {
    minHeight: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTextActive: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  segmentTextIdle: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  pager: {
    minHeight: 610,
  },
  page: {
    flex: 1,
  },
  panel: {
    flex: 1,
    paddingHorizontal: 6,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 22,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 3.6,
    textTransform: 'uppercase',
    fontFamily: 'DMSans_600SemiBold',
    marginBottom: 12,
  },
  title: {
    fontSize: 40,
    letterSpacing: -1.8,
    fontFamily: 'DMSans_700Bold',
  },
  description: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 31,
    fontFamily: 'DMSans_500Medium',
    maxWidth: 320,
  },
  accentBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  fields: {
    marginBottom: 6,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    marginBottom: 9,
    fontSize: 12,
    letterSpacing: 3.2,
    textTransform: 'uppercase',
    fontFamily: 'DMSans_700Bold',
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginBottom: 22,
  },
  keepSignedInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxTick: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
  },
  metaText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  metaAction: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  submitButton: {
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  submitButtonText: {
    fontSize: 17,
    fontFamily: 'DMSans_700Bold',
  },
  swipeHintWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 22,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  swipeHint: {
    fontSize: 12,
    letterSpacing: 2.8,
    textTransform: 'uppercase',
    fontFamily: 'DMSans_600SemiBold',
  },
})
