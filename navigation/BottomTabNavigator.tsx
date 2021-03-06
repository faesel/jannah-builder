import { MaterialIcons, Octicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { TouchableOpacity } from 'react-native'
import Colors from '../constants/Colors'
import useColorScheme from '../hooks/useColorScheme'
import SawabTab from '../screens/SawabTab'
import Prayer from '../screens/PrayerScreen'
import SawabSettingsScreen from '../screens/SawabSettingsScreen'
import ProgressTab from '../screens/ProgressTab'
import JannahTab from '../screens/JannahTab'

import { BottomTabParamList, TabOneParamList, TabTwoParamList, TabThreeParamList, SettingsParamList } from '../types'

const BottomTab = createBottomTabNavigator<BottomTabParamList>()

// You can explore the built-in icon families and icons on the web at:
// https://icons.expo.fyi/
function TabBarIconMaterial (props: { name: React.ComponentProps<typeof MaterialIcons>['name']; color: string }) {
  return <MaterialIcons size={30} style={{ marginBottom: -3 }} {...props} />
}

function TabBarIconOcticons (props: { name: React.ComponentProps<typeof Octicons>['name']; color: string }) {
  return <Octicons size={30} style={{ marginBottom: -3 }} {...props} />
}

// Each tab has its own navigation stack, you can read more about this pattern here:
// https://reactnavigation.org/docs/tab-based-navigation#a-stack-navigator-for-each-tab
const TabOneStack = createStackNavigator<TabOneParamList>()

function SawabSettings ({ navigation }: StackScreenProps<SettingsParamList>, colorScheme: string) {
  return (
    <TouchableOpacity onPress={() => navigation.navigate('SawabSettings')}>
      <MaterialCommunityIcons name="dots-vertical" style={{ marginRight: 5 }} size={40} color={colorScheme} />
    </TouchableOpacity>
  )
}

function TabOneNavigator (navigationProps: StackScreenProps<SettingsParamList>) {
  const colorScheme = useColorScheme()

  return (
    <TabOneStack.Navigator>
      <TabOneStack.Screen
        name="TabOneScreen"
        component={SawabTab}
        options={{
          headerTitle: 'Sawab Top-Up',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 25 },
          headerRight: () => SawabSettings(navigationProps, Colors[colorScheme].primaryVariant)
        }}
      />
      <TabOneStack.Screen name="Prayer" component={Prayer} options={{ title: 'Prayer', headerTitleStyle: { fontWeight: 'bold', fontSize: 25 } }} />
      <TabOneStack.Screen name="SawabSettings" component={SawabSettingsScreen} options={{ title: 'Sawab Settings', headerTitleStyle: { fontWeight: 'bold', fontSize: 25 } }} />
    </TabOneStack.Navigator>
  )
}

const TabTwoStack = createStackNavigator<TabTwoParamList>()

function TabTwoNavigator () {
  return (
    <TabTwoStack.Navigator>
      <TabTwoStack.Screen
        name="TabTwoScreen"
        component={ProgressTab}
        options={{ headerTitle: 'Progress Report Stats', headerTitleStyle: { fontWeight: 'bold', fontSize: 25 } }}
      />
    </TabTwoStack.Navigator>
  )
}

const TabThreeStack = createStackNavigator<TabThreeParamList>()

function TabThreeNavigator () {
  return (
    <TabThreeStack.Navigator>
      <TabThreeStack.Screen
        name="TabThreeScreen"
        component={JannahTab}
        options={{ headerTitle: 'Jannah Builder', headerTitleStyle: { fontWeight: 'bold', fontSize: 25 } }}
      />
    </TabThreeStack.Navigator>
  )
}

export default function BottomTabNavigator () {
  const colorScheme = useColorScheme()

  return (
    <BottomTab.Navigator
      initialRouteName="Sawab"
      tabBarOptions={{
        activeTintColor: Colors[colorScheme].primary,
        style: { minHeight: 60 }
      }}>
      <BottomTab.Screen
        name="Sawab"
        component={TabOneNavigator}
        options={{
          tabBarIcon: () => TabBarIconMaterial({ name: 'add-task', color: Colors[colorScheme].primaryVariant })
        }}
      />
      <BottomTab.Screen
        name="Progress"
        component={TabTwoNavigator}
        options={{
          tabBarIcon: () => TabBarIconOcticons({ name: 'graph', color: Colors[colorScheme].primaryVariant })
        }}
      />
      <BottomTab.Screen
        name="Jannah"
        component={TabThreeNavigator}
        options={{
          tabBarIcon: () => TabBarIconOcticons({ name: 'home', color: Colors[colorScheme].primaryVariant })
        }}
      />

    </BottomTab.Navigator>
  )
}
