import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import Collectibles from '../screens/Collectibles';
import DataEntry from '../screens/DataEntry';

// Type annotations are removed for JavaScript
const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Collectibles" 
          component={Collectibles} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="DataEntry" 
          component={DataEntry} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
