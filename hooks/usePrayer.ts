import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const defaultPrayer: Prayer = {};

export type Prayer = {
  title?: string;
};

export function useGetPrayer<Prayer>(
  defaultValue: Prayer
): [Prayer, string | null, boolean] {
  const [state, setState] = React.useState({
    value: defaultValue,
    error: null,
    isPending: true
  });

  React.useEffect(() => {

      const getItem = async () => {
        try {
          const jsonValue = await AsyncStorage.getItem('object');
          const jsonObject =  jsonValue != null ? JSON.parse(jsonValue) as Prayer : {} as Prayer;

          setState({ value: jsonObject, error: null, isPending: false })
        } catch (error) {
          setState({ value: defaultValue, error: error.toString(), isPending: false })
        }
      };

      getItem();

  }, []);

  const { value, error, isPending } = state;
  return [value, error, isPending];
}

export function useSavePrayer<Prayer>(
  newPrayer: Prayer
): [Prayer, string | null, boolean] {
  const [state, setState] = React.useState({
    value: newPrayer,
    error: null,
    isPending: false
  });

  React.useEffect(() => {

      const saveItem = async () => {
        try {
          if(newPrayer !== defaultPrayer)
          {
            setState({ value: state.value, error: null, isPending: true })

            console.log('updating');

            console.log(newPrayer);

            const jsonValue = JSON.stringify(newPrayer)
            await AsyncStorage.setItem('object', jsonValue )

            setState({ value: newPrayer, error: null, isPending: false })
          }
          else {
            console.log('stale');
            console.log(newPrayer);
          }
        } catch (error) {
          setState({ value: newPrayer, error: error.toString(), isPending: false })
        }
      }

      saveItem();

  }, [newPrayer]);

  const { value, error, isPending } = state;
  return [value, error, isPending];
}
