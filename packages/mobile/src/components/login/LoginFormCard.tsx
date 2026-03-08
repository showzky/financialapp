import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import type { LoginScreenTheme } from '../../customthemes/login'

type LoginFormCardProps = {
  theme: LoginScreenTheme
  email: string
  password: string
  error: string | null
  loading: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: () => void
}

export function LoginFormCard({
  theme,
  email,
  password,
  error,
  loading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginFormCardProps) {
  const canSubmit = Boolean(email.trim() && password && !loading)

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
      {theme.badgeLabel ? (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.cardChipBackground,
              borderColor: theme.colors.cardChipBorder,
            },
          ]}
        >
          <View style={styles.badgeDot} />
          <Text style={[styles.badgeText, { color: theme.colors.muted }]}>{theme.badgeLabel}</Text>
        </View>
      ) : null}

      <Text style={[styles.title, { color: theme.colors.title }]}>{theme.title}</Text>
      <Text style={[styles.subtitle, { color: theme.colors.body }]}>
        {theme.subtitleLead ? <Text style={[styles.subtitleLead, { color: theme.colors.title }]}>{theme.subtitleLead} </Text> : null}
        {theme.subtitle}
      </Text>

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
          <Ionicons name="alert-circle" size={18} color={theme.colors.errorText} />
          <Text style={[styles.errorText, { color: theme.colors.errorText }]}>{error}</Text>
        </View>
      ) : null}

      <Field
        label="Email or Username"
        value={email}
        onChangeText={onEmailChange}
        editable={!loading}
        placeholder="Enter your email or username"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        theme={theme}
      />

      <Field
        label="Password"
        value={password}
        onChangeText={onPasswordChange}
        editable={!loading}
        placeholder="Enter your password"
        secureTextEntry
        theme={theme}
      />

      <View style={styles.metaRow}>
        <Text style={[styles.metaText, { color: theme.colors.body }]}>{theme.keepSignedInLabel}</Text>
        <TouchableOpacity activeOpacity={0.75}>
          <Text style={[styles.metaAction, { color: theme.id === 'easter-renewal' ? '#ddd3ff' : theme.colors.title }]}>
            {theme.forgotPasswordLabel}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity activeOpacity={0.9} onPress={onSubmit} disabled={!canSubmit}>
        <LinearGradient
          colors={canSubmit ? theme.colors.buttonGradient : theme.colors.buttonDisabled}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.submitButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>{theme.submitLabel}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <Text style={[styles.secondaryText, { color: theme.colors.body }]}>
        {theme.secondaryPrompt}{' '}
        <Text style={[styles.secondaryActionText, { color: theme.id === 'easter-renewal' ? '#eab7c8' : theme.colors.title }]}>
          {theme.secondaryActionLabel}
        </Text>
      </Text>
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
    borderRadius: 28,
    padding: 18,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 14,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#f3d27a',
  },
  badgeText: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: 'DMSans_700Bold',
  },
  title: {
    fontSize: 34,
    letterSpacing: -1.4,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 24,
    fontFamily: 'DMSans_500Medium',
  },
  subtitleLead: {
    fontFamily: 'DMSans_700Bold',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },
  field: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 7,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: 'DMSans_700Bold',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 16,
    gap: 12,
  },
  metaText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },
  metaAction: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
  },
  submitButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'DMSans_800ExtraBold',
  },
  secondaryText: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },
  secondaryActionText: {
    fontFamily: 'DMSans_700Bold',
  },
})
