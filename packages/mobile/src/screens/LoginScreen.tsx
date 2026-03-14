// @ts-nocheck
import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

import { useAuth } from '../auth/AuthContext'
import { LoginBackgroundScene } from '../components/login/LoginBackgroundScene'
import { LoginFormCard } from '../components/login/LoginFormCard'
import { useLoginScreenTheme } from '../customthemes/login'

export function LoginScreen() {
  const { signIn } = useAuth()
  const loginTheme = useLoginScreenTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async () => {
    try {
      setLoading(true)
      setError(null)
      await signIn({ email: email.trim(), password })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={loginTheme.colors.screenGradient} style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sceneShell}>
          <LoginBackgroundScene theme={loginTheme} />

          {loginTheme.eventLabel ? (
            <View style={styles.eventPill}>
              <Text style={styles.eventPillText}>{loginTheme.eventLabel}</Text>
            </View>
          ) : null}

          <View style={styles.content}>
            <View style={styles.contentSpacer} />
            <LoginFormCard
              theme={loginTheme}
              email={email}
              password={password}
              error={error}
              loading={loading}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={onSubmit}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  sceneShell: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 0,
    backgroundColor: '#0a0a0e',
  },
  eventPill: {
    position: 'absolute',
    top: 18,
    right: 16,
    zIndex: 3,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  eventPillText: {
    color: '#d8deef',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: 'DMSans_500Medium',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
    paddingTop: 18,
    paddingHorizontal: 16,
  },
  contentSpacer: {
    height: 195,
  },
})
