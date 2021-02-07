import * as React from 'react';
import { StyleSheet } from 'react-native';

import { Text, View } from '../components/Themed';
import Colors from '../constants/Colors'
import useColorScheme from '../hooks/useColorScheme';

export default function SawabTab() {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
          <View
          style={{
            flexDirection: "column",
            display: "flex",
            margin: 20,
            borderRadius: 10,
            padding: 10,
            backgroundColor: "red"
          }}>
            <Text 
              lightColor="rgba(0,0,0,0.8)"
              darkColor="rgba(255,255,255,0.8)"
              style={{marginBottom:10, fontSize:20}}>
              Prayers
            </Text>

            <Text 
              lightColor="rgba(0,0,0,0.8)"
              darkColor="rgba(255,255,255,0.8)">
              FAJAR:
            </Text>

            <Text 
              lightColor="rgba(0,0,0,0.8)"
              darkColor="rgba(255,255,255,0.8)">
              ZAUHAR:
            </Text>

            <Text 
              lightColor="rgba(0,0,0,0.8)"
              darkColor="rgba(255,255,255,0.8)">
              ASR:
            </Text>

            <Text 
              lightColor="rgba(0,0,0,0.8)"
              darkColor="rgba(255,255,255,0.8)">
              MAGHRIB:
            </Text>

            <Text 
              lightColor="rgba(0,0,0,0.8)"
              darkColor="rgba(255,255,255,0.8)">
              ISHA'A:
            </Text>

          </View>

          <View
          style={{
            flexDirection: "column",
            display: "flex",
            height: 100,
            margin: 20,
            padding:10,
            borderRadius: 10,
            marginTop: 0,
            backgroundColor: "yellow"
          }}>
             <Text 
              lightColor="rgba(0,0,0,0.8)"
              darkColor="rgba(255,255,255,0.8)"
              style={{marginBottom:10, fontSize:20}}>
              Quran
            </Text>
          </View>

          <View
          style={{
            flexDirection: "column",
            display: "flex",
            height: 100,
            margin: 20,
            padding:10,
            borderRadius: 10,
            marginTop: 0,
            backgroundColor: "green"
          }}>
             <Text 
              lightColor="rgba(0,0,0,0.8)"
              darkColor="rgba(255,255,255,0.8)"
              style={{marginBottom:10, fontSize:20}}>
              Zakat
            </Text>
          </View>


          <View
          style={{
            flexDirection: "column",
            display: "flex",
            height: 100,
            margin: 20,
            padding:10,
            borderRadius: 10,
            marginTop: 0,
            backgroundColor: "blue"
          }}>
             <Text 
              lightColor="rgba(0,0,0,0.8)"
              darkColor="rgba(255,255,255,0.8)"
              style={{marginBottom:10, fontSize:20}}>
              TOTAL TODAY: 10 SAWAB
            </Text>
          </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
