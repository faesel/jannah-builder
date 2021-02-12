import AsyncStorage from '@react-native-async-storage/async-storage';

const storeValue = async (storageKey:string, value: any) => {
    try {
      await AsyncStorage.setItem(storageKey, value)
    } catch (e) {
      console.log(e);
    }
  }

  const storeObject = async (storageKey:string, value: any) => {
    try {
      const jsonValue = JSON.stringify(value)
      await AsyncStorage.setItem(storageKey, jsonValue)
    } catch (e) {
        console.log(e);
    }
  }

  const getValueData = async (storageKey: string) => {
    try {
      const value = await AsyncStorage.getItem(storageKey)
      if(value !== null) {
        return value;
      }
    } catch(e) {
        console.log(e);
    }
  }

  const getObjectData = async function<T>(storageKey: string): Promise<T> {
    const jsonValue = await AsyncStorage.getItem(storageKey)
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  }

export {
    getObjectData,
    storeObject
}