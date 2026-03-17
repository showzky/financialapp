import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { PlansEmptyIllustration } from './PlansEmptyIllustration'

type Props = {
  message: string
  onCreate: () => void
}

export function PlansEmptyState({ message, onCreate }: Props) {
  return (
    <View style={styles.wrap}>
      <PlansEmptyIllustration />
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity activeOpacity={0.85} onPress={onCreate}>
        <Text style={styles.cta}>Tap to create</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: 72,
    paddingHorizontal: 22,
  },
  message: {
    marginTop: 12,
    color: 'rgba(240,244,252,0.42)',
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
    textAlign: 'center',
  },
  cta: {
    marginTop: 10,
    color: '#6DB2FF',
    fontSize: 22,
    fontFamily: 'DMSerifDisplay_400Regular',
    textAlign: 'center',
  },
})
