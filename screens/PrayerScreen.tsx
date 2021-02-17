import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { RootStackParamList } from '../types';
import { useGetPrayer, useSavePrayer, defaultPrayer } from '../hooks/usePrayer'

import { DraxProvider, DraxView } from 'react-native-drax';

export default function PrayerScreen({
  navigation,
}: StackScreenProps<RootStackParamList>) {
  const [value, error, isPending] = useGetPrayer(defaultPrayer);
  const [newPrayer, setPrayer] = React.useState(defaultPrayer);

  if(isPending) {
    console.log('LOADING..')
  }

  const [savedValue, saveError, isSaving] = useSavePrayer(newPrayer);

  if(isSaving) {
    console.log('SAVING..')
  }

  const handlePress = () => {
    var random = `test${new Date().toLocaleString()}`;
    var prayer = {...value, title: random};
    setPrayer(prayer);
  }

  return (
    <>
    <View style={styles.container}>
      <Text style={styles.title}>This is the prayer screen.</Text>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.link}>
        <Text style={styles.linkText}>Back!</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handlePress} style={styles.link}>
        <Text style={styles.linkText}>Store Value</Text>
      </TouchableOpacity>
      <Text>{ newPrayer !== defaultPrayer ? newPrayer.title : value.title }</Text>
    </View>
    <DraxProvider>
          <View style={styles.container}>
              <DraxView
                  style={styles.draggable}
                  onDragStart={() => {
                      console.log('start drag');
                  }}
                  payload="world"
              />
              <DraxView
                  style={styles.receiver}
                  onReceiveDragEnter={({ dragged: { payload } }) => {
                      console.log(`hello ${payload}`);
                  }}
                  onReceiveDragExit={({ dragged: { payload } }) => {
                      console.log(`goodbye ${payload}`);
                  }}
                  onReceiveDragDrop={({ dragged: { payload } }) => {
                      console.log(`received ${payload}`);
                  }}
              />
          </View>
      </DraxProvider>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
draggable: {
    width: 100,
    height: 100,
    backgroundColor: 'blue',
},
receiver: {
    width: 100,
    height: 100,
    backgroundColor: 'green',
},
});
