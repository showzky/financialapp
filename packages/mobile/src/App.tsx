import React, { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { DefaultTheme, NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { FontAwesome5, Ionicons } from '@expo/vector-icons'
import { useFonts } from 'expo-font'
import * as SystemUI from 'expo-system-ui'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
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
import { TimelineScreen } from './screens/TimelineScreen'
import { BudgetCategoryAnalyticsScreen } from './screens/BudgetCategoryAnalyticsScreen'
import { PlannedExpenseScreen } from './screens/PlannedExpenseScreen'
import { EditPlannedExpenseScreen } from './screens/EditPlannedExpenseScreen'
import { IncomeEntryScreen } from './screens/IncomeEntryScreen'
import { BalanceScreen } from './screens/BalanceScreen'
import { PlansScreen } from './screens/PlansScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { LoginScreen } from './screens/LoginScreen'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()
const AuthStack = createNativeStackNavigator()
const APP_BG = '#0a0a0e'

function renderTabIcon(routeName: string, focused: boolean) {
  const inactiveColor = 'rgba(255,255,255,0.2)'
  const activeColor = APP_BG

  switch (routeName) {
    case 'Home':
      return <FontAwesome5 name="home" size={14} color={focused ? activeColor : inactiveColor} />
    case 'Plans':
      return <Ionicons name="sparkles-outline" size={17} color={focused ? activeColor : inactiveColor} />
    case 'Balance':
      return <Ionicons name="card-outline" size={18} color={focused ? activeColor : inactiveColor} />
    case 'Timeline':
      return <Ionicons name="calendar-outline" size={17} color={focused ? activeColor : inactiveColor} />
    default:
      return <Ionicons name="ellipse-outline" size={16} color={focused ? activeColor : inactiveColor} />
  }
}

function getTabLabel(routeName: string) {
  switch (routeName) {
    case 'Home':
      return 'Dashboard'
    case 'Plans':
      return 'Plans'
    case 'Balance':
      return 'Balance'
    case 'Timeline':
      return 'Timeline'
    default:
      return routeName
  }
}

function PrototypeTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const bottomInset = Math.max(insets.bottom, 10)

  return (
    <Animated.View
      pointerEvents="box-none"
      entering={FadeInDown.duration(380)}
      style={[styles.navWrap, { bottom: bottomInset }]}
    >
      <View style={styles.navBar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index
          const { options } = descriptors[route.key]

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name)
            }
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.navItem}
              activeOpacity={0.85}
            >
              {focused ? (
                <View style={styles.activeTab}>{renderTabIcon(route.name, true)}</View>
              ) : (
                renderTabIcon(route.name, false)
              )}
              <Text style={[styles.navLabel, focused && styles.navLabelActive]}>{getTabLabel(route.name)}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </Animated.View>
  )
}

function AuthFlow() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: APP_BG },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  )
}

function HomeTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <PrototypeTabBar {...props} />}
      sceneContainerStyle={{ backgroundColor: APP_BG }}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Plans" component={PlansScreen} />
      <Tab.Screen name="Balance" component={BalanceScreen} />
      <Tab.Screen name="Timeline" component={TimelineScreen} />
    </Tab.Navigator>
  )
}

function RootNavigator() {
  const { status } = useAuth()

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: APP_BG },
      }}
    >
      {status === 'signedIn' ? (
        <>
          <Stack.Screen name="MainTabs" component={HomeTabs} />
          <Stack.Screen name="BudgetCategoryAnalytics" component={BudgetCategoryAnalyticsScreen} />
          <Stack.Screen name="PlannedExpense" component={PlannedExpenseScreen} />
          <Stack.Screen name="IncomeEntry" component={IncomeEntryScreen} />
          <Stack.Screen name="EditPlannedExpense" component={EditPlannedExpenseScreen} />
          <Stack.Screen
            name="SettingsDetail"
            component={SettingsScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthFlow} />
      )}
    </Stack.Navigator>
  )
}

function AppShell() {
  const { activeTheme, isHydrated } = useCustomTheme()
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    DMSerifDisplay_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
  })

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(APP_BG)
  }, [])

  if (!fontsLoaded || !isHydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: APP_BG,
        }}
      >
        <ActivityIndicator size="large" color={activeTheme.colors.accent} />
      </View>
    )
  }

  return (
    <BottomSheetModalProvider>
      <Animated.View entering={FadeInUp.duration(320)} style={{ flex: 1 }}>
        <NavigationContainer
          theme={{
            ...DefaultTheme,
            colors: {
              ...DefaultTheme.colors,
              background: APP_BG,
              card: APP_BG,
              border: 'rgba(255,255,255,0.06)',
              primary: activeTheme.colors.tabBarActive,
              text: 'rgba(255,255,255,0.92)',
            },
          }}
        >
          <RootNavigator />
        </NavigationContainer>
      </Animated.View>
    </BottomSheetModalProvider>
  )
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CustomThemeProvider>
          <NotificationProvider>
            <PeriodProvider>
              <AppShell />
            </PeriodProvider>
          </NotificationProvider>
        </CustomThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  navWrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 88,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(10,10,14,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  activeTab: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(201,168,76,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
  },
  navLabelActive: {
    color: 'rgba(201,168,76,0.95)',
    fontFamily: 'DMSans_600SemiBold',
  },
})
