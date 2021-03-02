import React from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const defaultSettings: SawabSettings = {
  QuranGoal: 5,
  ZakatGoal: 5,
  ZakatCurrency: '£',
  DhikrGoal: 5,
  GoodDeedGoal: 5
}

export type SawabSettings = {
    QuranGoal: number,
    ZakatGoal: number,
    ZakatCurrency: string,
    DhikrGoal: number,
    GoodDeedGoal: number
};

const SAWAB_KEY = 'SawabGoal'

export function useGetSawabSettings (): [SawabSettings, string | null, boolean] {
  const [state, setState] = React.useState({
    value: { ...defaultSettings },
    error: null,
    isPending: true
  })

  React.useEffect(() => {
    const getItem = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(SAWAB_KEY)

        if (jsonValue) {
          const jsonObject = jsonValue != null ? JSON.parse(jsonValue) as SawabSettings : {} as SawabSettings
          setState({ value: jsonObject, error: null, isPending: false })
        } else {
          setState({ ...state, error: null, isPending: false })
        }
      } catch (error) {
        setState({ ...state, error: error.toString(), isPending: false })
      }
    }
    getItem()
  }, [])

  const { value, error, isPending } = state
  return [value, error, isPending]
}

export function useSaveSawabSettings (
  newSettings: SawabSettings
): [SawabSettings, string | null, boolean] {
  const [state, setState] = React.useState({
    value: newSettings,
    error: null,
    isPending: false
  })

  React.useEffect(() => {
    const saveItem = async () => {
      try {
        if (newSettings !== defaultSettings) {
          setState({ value: state.value, error: null, isPending: true })

          const jsonValue = JSON.stringify(newSettings)
          await AsyncStorage.setItem(SAWAB_KEY, jsonValue)

          setState({ value: newSettings, error: null, isPending: false })
        }
      } catch (error) {
        setState({ ...state, error: error.toString(), isPending: false })
      }
    }

    saveItem()
  }, [newSettings])

  const { value, error, isPending } = state
  return [value, error, isPending]
}
