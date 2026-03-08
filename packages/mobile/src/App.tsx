// @ts-nocheck
import React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useFonts } from 'expo-font'
import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display'
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  DMSans_800ExtraBold,
} from '@expo-google-fonts/dm-sans'

import { AuthProvider, useAuth } from './auth/AuthContext'
import { CustomThemeProvider, useCustomTheme } from './customthemes'
import { NotificationProvider } from './context/NotificationContext'
import { PeriodProvider } from './context/PeriodContext'
import { HomeScreen } from './screens/HomeScreen'
import { LoansScreen } from './screens/LoansScreen'
import { WishlistScreen } from './screens/WishlistScreen'
import { IndicatorsScreen } from './screens/IndicatorsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { LoginScreen } from './screens/LoginScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()
const AuthStack = createNativeStackNavigator()

function AuthFlow() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    </AuthStack.Navigator>
  )
}

function HomeTabs() {
  const { activeTheme } = useCustomTheme()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home'

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline'
          } else if (route.name === 'Loans') {
            iconName = focused ? 'document-text' : 'document-text-outline'
          } else if (route.name === 'Wishlist') {
            iconName = focused ? 'heart' : 'heart-outline'
          } else if (route.name === 'Indicators') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline'
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: activeTheme.colors.tabBarActive,
        tabBarInactiveTintColor: activeTheme.colors.tabBarInactive,
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: {
          backgroundColor: activeTheme.colors.tabBarBackground,
          borderTopColor: activeTheme.colors.surfaceBorder,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Loans" component={LoansScreen} options={{ title: 'Loans' }} />
      <Tab.Screen name="Wishlist" component={WishlistScreen} options={{ title: 'Wishlist' }} />
      <Tab.Screen name="Indicators" component={IndicatorsScreen} options={{ title: 'Overview' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  )
}

function RootNavigator() {
  const { status } = useAuth()

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {status === 'signedIn' ? (
        <Stack.Screen name="MainTabs" component={HomeTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthFlow} />
      )}
    </Stack.Navigator>
  )
}

function AppShell() {
  const { activeTheme } = useCustomTheme()
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    DMSerifDisplay_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
  })

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: activeTheme.colors.screenBackground,
        }}
      >
        <ActivityIndicator size="large" color={activeTheme.colors.accent} />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CustomThemeProvider>
        <NotificationProvider>
          <PeriodProvider>
            <AppShell />
          </PeriodProvider>
        </NotificationProvider>
      </CustomThemeProvider>
    </AuthProvider>
  )
}
