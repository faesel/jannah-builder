import * as React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { Text, View } from '../components/Themed';
import Colors from '../constants/Colors'
import useColorScheme from '../hooks/useColorScheme';
import { AntDesign } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { StackScreenProps } from '@react-navigation/stack';

export default function SawabTab({ navigation }: StackScreenProps<RootStackParamList>) {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>

      <TouchableOpacity onPress={() => navigation.navigate('Prayer')}>
        <View
          lightColor={Colors[colorScheme].surface}
          darkColor={Colors[colorScheme].surface}
          style={{
            flexDirection: "column",
            display: "flex",
            margin: 10,
            borderRadius: 15,
            padding: 10
          }}>

          <View
            lightColor={Colors[colorScheme].surface}
            darkColor={Colors[colorScheme].surface}
            style={{
              flexDirection: "column",
              display: "flex",
              padding: 10
            }}>
            <Text
              lightColor={Colors[colorScheme].onSurface}
              darkColor={Colors[colorScheme].onSurface}
              style={{ fontSize: 20, fontWeight: 'bold', paddingBottom: 10 }}>
              Prayers
            </Text>

            <View
              lightColor={Colors[colorScheme].surface}
              darkColor={Colors[colorScheme].surface}
              style={{
                flexDirection: "row",
                display: "flex",
              }}>

              <Text
                lightColor={Colors[colorScheme].onSurface}
                darkColor={Colors[colorScheme].onSurface}
                style={{ paddingRight: 5 }}>
                Fajar
            </Text>

              <AntDesign name="checkcircle" size={15} style={{ paddingRight: 10 }} color={Colors[colorScheme].secondary} />

              <Text
                lightColor={Colors[colorScheme].onSurface}
                darkColor={Colors[colorScheme].onSurface}
                style={{ paddingRight: 5 }}>
                Dhuhr
            </Text>

              <AntDesign name="checkcircle" size={15} style={{ paddingRight: 10 }} color={Colors[colorScheme].secondary} />

              <Text
                lightColor={Colors[colorScheme].onSurface}
                darkColor={Colors[colorScheme].onSurface}
                style={{ paddingRight: 5 }}>
                Asr
            </Text>

              <AntDesign name="checkcircle" size={15} style={{ paddingRight: 10 }} color="gray" />

              <Text
                lightColor={Colors[colorScheme].onSurface}
                darkColor={Colors[colorScheme].onSurface}
                style={{ paddingRight: 5 }}>
                Maghrib
            </Text>

              <AntDesign name="checkcircle" size={15} style={{ paddingRight: 10 }} color={Colors[colorScheme].secondary} />

              <Text
                lightColor={Colors[colorScheme].onSurface}
                darkColor={Colors[colorScheme].onSurface}
                style={{ paddingRight: 5 }}>
                Isha
            </Text>

              <AntDesign name="checkcircle" size={15} style={{ paddingRight: 10 }} color={Colors[colorScheme].secondary} />


            </View>
          </View>

        </View>
      </TouchableOpacity>

      <View
        lightColor={Colors[colorScheme].surface}
        darkColor={Colors[colorScheme].surface}
        style={{
          flexDirection: "column",
          display: "flex",
          margin: 10,
          borderRadius: 15,
          padding: 10,
          marginTop: 0,
        }}>
        <View
          lightColor={Colors[colorScheme].surface}
          darkColor={Colors[colorScheme].surface}
          style={{
            flexDirection: "column",
            display: "flex",
            padding: 10
          }}>
            <Text
              lightColor={Colors[colorScheme].onSurface}
              darkColor={Colors[colorScheme].onSurface}
              style={{ fontSize: 20, fontWeight: "bold" }}>
              Quran
            </Text>

          <View
            lightColor={Colors[colorScheme].secondary}
            darkColor={Colors[colorScheme].secondary}
            style={{ width: 300, maxHeight: 40, minHeight: 40, marginTop:10 }}
          >
              <Text
                style={{padding: 10}}
              >50%</Text>
          </View>


        </View>

      </View>

      <View
        lightColor={Colors[colorScheme].surface}
        darkColor={Colors[colorScheme].surface}
        style={{
          flexDirection: "column",
          display: "flex",
          margin: 10,
          padding: 10,
          borderRadius: 15,
          marginTop: 0
        }}>
        <View
          lightColor={Colors[colorScheme].surface}
          darkColor={Colors[colorScheme].surface}
          style={{
            flexDirection: "column",
            display: "flex",
            padding: 10
          }}>
          <Text
            lightColor={Colors[colorScheme].onSurface}
            darkColor={Colors[colorScheme].onSurface}
            style={{ fontSize: 20, fontWeight: "bold" }}>
            Zakat
            </Text>

            <View
            lightColor={Colors[colorScheme].secondary}
            darkColor={Colors[colorScheme].secondary}
            style={{ width: 200, maxHeight: 40, minHeight: 40, marginTop:10 }}
          >
              <Text
                style={{padding: 10}}
              >$30</Text>
          </View>


        </View>
      </View>



      <View
        lightColor={Colors[colorScheme].surface}
        darkColor={Colors[colorScheme].surface}
        style={{
          flexDirection: "column",
          display: "flex",
          margin: 10,
          padding: 10,
          borderRadius: 15,
          marginTop: 0
        }}>
        <View
          lightColor={Colors[colorScheme].surface}
          darkColor={Colors[colorScheme].surface}
          style={{
            flexDirection: "column",
            display: "flex",
            padding: 10
          }}>
          <Text
            lightColor={Colors[colorScheme].onSurface}
            darkColor={Colors[colorScheme].onSurface}
            style={{ fontSize: 20, fontWeight: "bold" }}>
            Total: 100
            </Text>

        </View>
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
