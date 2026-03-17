import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { FontAwesome5 } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

type Props = {
  bottomOffset: number
  onPress: () => void
}

export function PlansFab({ bottomOffset, onPress }: Props) {
  return (
    <View style={[styles.wrap, { bottom: bottomOffset }]}>
      <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.92}>
        <LinearGradient
          colors={['rgba(92,163,255,0.98)', 'rgba(55,121,217,0.98)']}
          style={styles.gradient}
        >
          <FontAwesome5 name="plus" size={16} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 18,
    zIndex: 30,
  },
  fab: {
    width: 62,
    height: 62,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.26,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
})
