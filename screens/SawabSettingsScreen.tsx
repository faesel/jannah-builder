import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { RootStackParamList } from '../types'

export default function SawabSettings ({
  navigation
}: StackScreenProps<RootStackParamList>) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>This is the settings screen.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold'
  }
})
