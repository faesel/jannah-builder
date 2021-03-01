import * as React from 'react'
import { StyleSheet, Text, View, TextInput, NativeSyntheticEvent, TextInputChangeEventData, ActivityIndicator } from 'react-native'
import { useGetSawabSettings } from '../hooks/useSawabGoal'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold'
  }
})

const handleNewQuranGoal = (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
  console.log(event)
}

export default function SawabSettingsScreen () {
  const [value, error, isPending] = useGetSawabSettings()

  return (
    <View style={styles.container}>
      {isPending && <ActivityIndicator size="large" />}
      {error && <Text>Ops failed to get your previous goal settings.</Text>}
      {!isPending &&
        <>
          <Text style={styles.title}>Quran Goal</Text>
          <TextInput onChange={handleNewQuranGoal} value={value.QuranGoal?.toString()}></TextInput>
        </>
      }
    </View>
  )
}
