import * as React from 'react';
import { StyleSheet } from 'react-native';

import { Text, View } from '../components/Themed';
import Colors from '../constants/Colors'
import useColorScheme from '../hooks/useColorScheme';
import { AntDesign } from '@expo/vector-icons';

export default function SawabTab() {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>


      <View
        lightColor={Colors[colorScheme].lightGray}
        darkColor={Colors[colorScheme].babyPowder}
        style={{
          flexDirection: "column",
          display: "flex",
          margin: 20,
          borderRadius: 15,
          padding: 10
        }}>

        <View
          lightColor={Colors[colorScheme].lightGray}
          darkColor={Colors[colorScheme].babyPowder}
          style={{
            flexDirection: "column",
            display: "flex",
            padding: 10
          }}>
          <Text
            lightColor={Colors[colorScheme].richBlack}
            darkColor={Colors[colorScheme].richBlack}
            style={{ fontSize: 20, paddingBottom: 10 }}>
            Prayers
            </Text>


          <View
            lightColor={Colors[colorScheme].lightGray}
            darkColor={Colors[colorScheme].babyPowder}
            style={{
              flexDirection: "row",
              display: "flex",
            }}>

            <Text
              lightColor={Colors[colorScheme].richBlack}
              darkColor={Colors[colorScheme].richBlack}
              style={{ paddingRight: 5 }}>
              Fajar
            </Text>

            <AntDesign name="checkcircle" size={15} style={{ paddingRight: 10 }} color="green" />

            <Text
              lightColor={Colors[colorScheme].richBlack}
              darkColor={Colors[colorScheme].richBlack}
              style={{ paddingRight: 5 }}>
              Dhuhr
            </Text>

            <AntDesign name="checkcircle" size={15} style={{ paddingRight: 10 }} color="green" />

            <Text
              lightColor={Colors[colorScheme].richBlack}
              darkColor={Colors[colorScheme].richBlack}
              style={{ paddingRight: 5 }}>
              Asr
            </Text>

            <AntDesign name="checkcircle" size={15} style={{ paddingRight: 10 }} color="gray" />

            <Text
              lightColor={Colors[colorScheme].richBlack}
              darkColor={Colors[colorScheme].richBlack}
              style={{ paddingRight: 5 }}>
              Maghrib
            </Text>

            <AntDesign name="checkcircle" size={15} style={{ paddingRight: 10 }} color="green" />

            <Text
              lightColor={Colors[colorScheme].richBlack}
              darkColor={Colors[colorScheme].richBlack}
              style={{ paddingRight: 5 }}>
              Isha
            </Text>

            <AntDesign name="checkcircle" size={15} style={{ paddingRight: 10 }} color="gray" />
          </View>




        </View>

      </View>

      <View
        lightColor={Colors[colorScheme].lightGray}
        darkColor={Colors[colorScheme].babyPowder}
        style={{
          flexDirection: "column",
          display: "flex",
          margin: 20,
          borderRadius: 15,
          padding: 10,
          marginTop: 0,
        }}>
              <View
          lightColor={Colors[colorScheme].lightGray}
          darkColor={Colors[colorScheme].babyPowder}
          style={{
            flexDirection: "column",
            display: "flex",
            padding: 10
          }}>
            <Text
              lightColor={Colors[colorScheme].richBlack}
              darkColor={Colors[colorScheme].richBlack}
              style={{ fontSize: 20 }}>
              Quran
            </Text>

          </View>

      </View>

      <View
        lightColor={Colors[colorScheme].lightGray}
        darkColor={Colors[colorScheme].babyPowder}
        style={{
          flexDirection: "column",
          display: "flex",
          margin: 20,
          padding: 10,
          borderRadius: 15,
          marginTop: 0
        }}>
           <View
          lightColor={Colors[colorScheme].lightGray}
          darkColor={Colors[colorScheme].babyPowder}
          style={{
            flexDirection: "column",
            display: "flex",
            padding: 10
          }}>
            <Text
              lightColor={Colors[colorScheme].richBlack}
              darkColor={Colors[colorScheme].richBlack}
              style={{ fontSize: 20 }}>
              Zakat
            </Text>

          </View>
      </View>



      <View
        lightColor={Colors[colorScheme].lightGray}
        darkColor={Colors[colorScheme].babyPowder}
        style={{
          flexDirection: "column",
          display: "flex",
          margin: 20,
          padding: 10,
          borderRadius: 15,
          marginTop: 0
        }}>
           <View
          lightColor={Colors[colorScheme].lightGray}
          darkColor={Colors[colorScheme].babyPowder}
          style={{
            flexDirection: "column",
            display: "flex",
            padding: 10
          }}>
            <Text
              lightColor={Colors[colorScheme].richBlack}
              darkColor={Colors[colorScheme].richBlack}
              style={{ fontSize: 20 }}>
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
