import React, { useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native'
import PagerView from 'react-native-pager-view'
import { LinearGradient } from 'expo-linear-gradient'

import { useAuth } from '../auth/AuthContext'
import { LoginBackgroundScene } from '../components/login/LoginBackgroundScene'
import { LoginFormCard } from '../components/login/LoginFormCard'
import { useLoginScreenTheme } from '../customthemes/login'
import { authApi } from '../services/authApi'

type AuthMode = 'login' | 'register'

export function LoginScreen() {
  const { signIn, signUp } = useAuth()
  const loginTheme = useLoginScreenTheme()
  const pagerRef = useRef<PagerView>(null)

  const [mode, setMode] = useState<AuthMode>('login')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const [registerDisplayName, setRegisterDisplayName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [registrationEnabled, setRegistrationEnabled] = useState(true)
  const [checkingRegistrationStatus, setCheckingRegistrationStatus] = useState(true)

  useEffect(() => {
    let isMounted = true

    void authApi
      .getRegistrationStatus()
      .then((result) => {
        if (!isMounted) return
        setRegistrationEnabled(result.publicRegistrationEnabled)
      })
      .catch(() => {
        if (!isMounted) return
        setRegistrationEnabled(true)
      })
      .finally(() => {
        if (!isMounted) return
        setCheckingRegistrationStatus(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const syncMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    pagerRef.current?.setPage(nextMode === 'login' ? 0 : 1)
  }

  const onLoginSubmit = async () => {
    try {
      setLoginLoading(true)
      setLoginError(null)
      await signIn({ email: email.trim(), password })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setLoginError(message)
    } finally {
      setLoginLoading(false)
    }
  }

  const onRegisterSubmit = async () => {
    if (!registrationEnabled) {
      setRegisterError('Public registration is currently disabled')
      return
    }

    try {
      setRegisterLoading(true)
      setRegisterError(null)
      await signUp({
        displayName: registerDisplayName.trim(),
        email: registerEmail.trim().toLowerCase(),
        password: registerPassword,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setRegisterError(message)
    } finally {
      setRegisterLoading(false)
    }
  }

  return (
    <LinearGradient colors={loginTheme.colors.screenGradient} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sceneShell}>
          <LoginBackgroundScene theme={loginTheme} />

          {loginTheme.eventLabel ? (
            <View style={styles.eventPill}>
              <Text style={styles.eventPillText}>{loginTheme.eventLabel}</Text>
            </View>
          ) : null}

          <View style={styles.content}>
            <LoginFormCard
              theme={loginTheme}
              mode={mode}
              pagerRef={pagerRef}
              onModeChange={syncMode}
              onPageSelected={(index) => {
                setMode(index === 0 ? 'login' : 'register')
                setLoginError(null)
                setRegisterError(null)
              }}
              login={{
                email,
                password,
                error: loginError,
                loading: loginLoading,
                onEmailChange: setEmail,
                onPasswordChange: setPassword,
                onSubmit: onLoginSubmit,
              }}
              register={{
                displayName: registerDisplayName,
                email: registerEmail,
                password: registerPassword,
                error: registerError,
                loading: registerLoading,
                enabled: registrationEnabled,
                checkingAvailability: checkingRegistrationStatus,
                onDisplayNameChange: setRegisterDisplayName,
                onEmailChange: setRegisterEmail,
                onPasswordChange: setRegisterPassword,
                onSubmit: onRegisterSubmit,
              }}
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
    backgroundColor: '#08101f',
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
    paddingHorizontal: 16,
    paddingTop: 42,
    paddingBottom: 24,
    justifyContent: 'center',
  },
})
