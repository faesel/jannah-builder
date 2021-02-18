import * as React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { Text, View } from '../components/Themed';
import Colors from '../constants/Colors'
import useColorScheme from '../hooks/useColorScheme';
import { AntDesign } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { StackScreenProps } from '@react-navigation/stack';

import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
  ContributionGraph,
  StackedBarChart
} from "react-native-chart-kit";
import { Dimensions } from 'react-native';
import { AbstractChartConfig } from 'react-native-chart-kit/dist/AbstractChart';

export default function SawabTab({ navigation }: StackScreenProps<RootStackParamList>) {
  const colorScheme = useColorScheme();

  const commitsData = [
    { date: "2017-01-02", count: 1 },
    { date: "2017-01-03", count: 2 },
    { date: "2017-01-04", count: 3 },
    { date: "2017-01-05", count: 4 },
    { date: "2017-01-06", count: 5 },
    { date: "2017-01-30", count: 2 },
    { date: "2017-01-31", count: 3 },
    { date: "2017-03-01", count: 2 },
    { date: "2017-04-02", count: 4 },
    { date: "2017-03-05", count: 2 },
    { date: "2017-02-30", count: 4 }
  ];
  

  const data = {
    labels: ["Prayer", "Quran", "Zakat"], // optional
    data: [0.4, 0.6, 0.8],
    colors: ["#dfe4ea", "#ced6e0", "#a4b0be"]
  };
  const screenWidth = Dimensions.get("window").width;

  return (
    <View style={styles.container}>


      <View
        lightColor={Colors[colorScheme].surface}
        darkColor={Colors[colorScheme].surface}
        style={{
          flexDirection: "column",
          display: "flex",
          margin: 20,
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
            style={{ fontSize: 20, paddingBottom: 10 }}>
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

          <TouchableOpacity onPress={() => navigation.navigate('Prayer')}>
              <Text
              lightColor={Colors[colorScheme].onSurface}
              darkColor={Colors[colorScheme].onSurface}>
              Go to prayer screen!
            </Text>
            </TouchableOpacity>


        </View>

      </View>

      <View
        lightColor={Colors[colorScheme].surface}
        darkColor={Colors[colorScheme].surface}
        style={{
          flexDirection: "column",
          display: "flex",
          margin: 20,
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
              style={{ fontSize: 20 }}>
              Quran
            </Text>

          </View>

      </View>

      <View
        lightColor={Colors[colorScheme].surface}
        darkColor={Colors[colorScheme].surface}
        style={{
          flexDirection: "column",
          display: "flex",
          margin: 20,
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
              style={{ fontSize: 20 }}>
              Zakat
            </Text>

          </View>
      </View>



      <View
        lightColor={Colors[colorScheme].surface}
        darkColor={Colors[colorScheme].surface}
        style={{
          flexDirection: "column",
          display: "flex",
          margin: 20,
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
              style={{ fontSize: 20 }}>
              Total: 100 
            </Text>

          </View>
      </View>


      <View
        style={{
          flexDirection: "column",
          display: "flex",
          margin: 20,
          marginTop: 0
        }}>
          
         

<ContributionGraph
  values={commitsData}
  endDate={new Date("2017-04-01")}
  numDays={105}
  width={screenWidth}
  height={220}
  chartConfig={{
    backgroundColor: Colors.light.background,
    backgroundGradientFrom: Colors.light.background,
    backgroundGradientTo: Colors.light.background,
    decimalPlaces: 2, // optional, defaults to 2dp
    color: (opacity = 1) => `rgba(0, 255, 47, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: Colors.dark.primary
    }
  }}
/>



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
