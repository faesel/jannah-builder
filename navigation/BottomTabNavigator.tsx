import { Ionicons, MaterialIcons, Octicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';

import Colors from '../constants/Colors';
import useColorScheme from '../hooks/useColorScheme';
import SawabTab from '../screens/SawabTab';
import Prayer from '../screens/PrayerScreen';
import ProgressTab from '../screens/ProgressTab';
import JannahTab from '../screens/JannahTab';
import { BottomTabParamList, TabOneParamList, TabTwoParamList, TabThreeParamList } from '../types';

const BottomTab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator() {
  const colorScheme = useColorScheme();

  return (
    <BottomTab.Navigator
      initialRouteName="Sawab"
      tabBarOptions={{ activeTintColor: Colors[colorScheme].primary }}>
      <BottomTab.Screen
        name="Sawab"
        component={TabOneNavigator}
        options={{
          tabBarIcon: ({ color }) => <TabBarIconMaterial name="add-task" color={Colors[colorScheme].primaryVariant} />,
        }}
      />
      <BottomTab.Screen
        name="Progress"
        component={TabTwoNavigator}
        options={{
          tabBarIcon: ({ color }) => <TabBarIconOcticons name="graph" color={Colors[colorScheme].primaryVariant} />,
        }}
      />
      <BottomTab.Screen
        name="Jannah"
        component={TabThreeNavigator}
        options={{
          tabBarIcon: ({ color }) => <TabBarIconMaterial name="house" color={Colors[colorScheme].primaryVariant} />,
        }}
      />

    </BottomTab.Navigator>
  );
}

// You can explore the built-in icon families and icons on the web at:
// https://icons.expo.fyi/
function TabBarIcon(props: { name: React.ComponentProps<typeof Ionicons>['name']; color: string }) {
  return <Ionicons size={30} style={{ marginBottom: -3 }} {...props} />;
}

function TabBarIconMaterial(props: { name: React.ComponentProps<typeof MaterialIcons>['name']; color: string }) {
  return <MaterialIcons size={30} style={{ marginBottom: -3 }} {...props} />;
}

function TabBarIconOcticons(props: { name: React.ComponentProps<typeof Octicons>['name']; color: string }) {
  return <Octicons size={30} style={{ marginBottom: -3 }} {...props} />;
}

// Each tab has its own navigation stack, you can read more about this pattern here:
// https://reactnavigation.org/docs/tab-based-navigation#a-stack-navigator-for-each-tab
const TabOneStack = createStackNavigator<TabOneParamList>();

function TabOneNavigator() {
  return (
    <TabOneStack.Navigator>
      <TabOneStack.Screen
        name="TabOneScreen"
        component={SawabTab}
        options={{ headerTitle: 'Sawab Top-Up' }}
      />
      <TabOneStack.Screen name="Prayer" component={Prayer} options={{ title: 'Prayer' }} />
    </TabOneStack.Navigator>
  );
}

const TabTwoStack = createStackNavigator<TabTwoParamList>();

function TabTwoNavigator() {
  return (
    <TabTwoStack.Navigator>
      <TabTwoStack.Screen
        name="TabTwoScreen"
        component={ProgressTab}
        options={{ headerTitle: 'Progress Report Stats' }}
      />
    </TabTwoStack.Navigator>
  );
}

const TabThreeStack = createStackNavigator<TabThreeParamList>();

function TabThreeNavigator() {
  return (
    <TabThreeStack.Navigator>
      <TabThreeStack.Screen
        name="TabThreeScreen"
        component={JannahTab}
        options={{ headerTitle: 'Jannah Builder' }}
      />
    </TabThreeStack.Navigator>
  );
}
