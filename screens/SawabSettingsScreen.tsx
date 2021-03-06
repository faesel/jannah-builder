import * as React from 'react'
import { StyleSheet, NativeSyntheticEvent, TextInputChangeEventData, ActivityIndicator } from 'react-native'
import Colors from '../constants/Colors'
import { useGetSawabSettings } from '../hooks/useSawabGoal'
import { Text, View, TextInput, Picker, IPickerItem } from '../components/Themed'
import useColorScheme from '../hooks/useColorScheme'
import { Currency } from '../constants/Currency'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    padding: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  textInput: {
    borderStyle: 'solid',
    fontSize: 20,
    padding: 10,
    borderBottomWidth: 5,
    marginBottom: 10
  },
  pickerStyle: {
    borderStyle: 'solid',
    borderBottomWidth: 5,
    marginBottom: 10
  }
})

const handleNewQuranGoal = (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
  console.log(event)
}

export default function SawabSettingsScreen () {
  const [currency, setCurrency] = React.useState('GBP')
  const colorScheme = useColorScheme()
  const [value, error, isPending] = useGetSawabSettings()

  return (
    <View
      lightColor={Colors[colorScheme].surface}
      darkColor={Colors[colorScheme].surface}
      style={styles.container}>
      {isPending && <ActivityIndicator size="large" />}
      {error && <Text>Ops failed to get your previous goal settings.</Text>}
      {!isPending &&
        <>
          <Text
            lightColor={Colors[colorScheme].onSurface}
            darkColor={Colors[colorScheme].onSurface}
            style={{ marginBottom: 10 }}>Set your goals here, each goal is intended to be achievable within a day.</Text>

          <Text
            lightColor={Colors[colorScheme].onSurface}
            darkColor={Colors[colorScheme].onSurface}
            style={styles.title}>Quran Goal (Minutes per day)</Text>

          <TextInput
            lightColor={Colors[colorScheme].onSurface}
            darkColor={Colors[colorScheme].onSurface}
            style={{ ...styles.textInput, borderBottomColor: Colors[colorScheme].secondary }} keyboardType='number-pad' onChange={handleNewQuranGoal} value={value.QuranGoal?.toString()}></TextInput>

          <Text
            lightColor={Colors[colorScheme].onSurface}
            darkColor={Colors[colorScheme].onSurface}
            style={styles.title}>Zakat Currency</Text>

          <View
            lightColor={Colors[colorScheme].surface}
            darkColor={Colors[colorScheme].surface}
            style={{
              ...styles.pickerStyle, borderBottomColor: Colors[colorScheme].secondary
            }}>
            <Picker
              lightColor={Colors[colorScheme].onSurface}
              darkColor={Colors[colorScheme].onSurface}
              selectedValue={currency}
              onValueChange={newValue => setCurrency(newValue.toString())}
              pickerItems={Currency.map(c => ({
                label: `${c.currency} (${c.symbol})`,
                value: c.abbreviation
              } as IPickerItem))}></Picker>
          </View>

          <Text
            lightColor={Colors[colorScheme].onSurface}
            darkColor={Colors[colorScheme].onSurface} style={styles.title}>Zakat Goal (Minutes per day)</Text>

          <TextInput
            lightColor={Colors[colorScheme].onSurface}
            darkColor={Colors[colorScheme].onSurface} style={{ ...styles.textInput, borderBottomColor: Colors[colorScheme].secondary }} onChange={handleNewQuranGoal} value={value.ZakatGoal?.toString()}></TextInput>

          <Text
            lightColor={Colors[colorScheme].onSurface}
            darkColor={Colors[colorScheme].onSurface}
            style={styles.title}>Dhikr Goal (Minutes per day)</Text>

          <TextInput
            lightColor={Colors[colorScheme].onSurface}
            darkColor={Colors[colorScheme].onSurface}
            style={{ ...styles.textInput, borderBottomColor: Colors[colorScheme].secondary }} onChange={handleNewQuranGoal} value={value.DhikrGoal?.toString()}></TextInput>

          <Text
            lightColor={Colors[colorScheme].onSurface}
            darkColor={Colors[colorScheme].onSurface}
            style={styles.title}>Good Deeds Goal</Text>

          <TextInput
            lightColor={Colors[colorScheme].onSurface}
            darkColor={Colors[colorScheme].onSurface}
            style={{ ...styles.textInput, borderBottomColor: Colors[colorScheme].secondary }} onChange={handleNewQuranGoal} value={value.GoodDeedGoal?.toString()}></TextInput>
        </>
      }
    </View>
  )
}
