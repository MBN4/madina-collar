import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import SplashScreen from '../screens/SplashScreen';
import AuthScreen from '../screens/AuthScreen';
import QualityScreen from '../screens/QualityScreen';
import SizeSelectionScreen from '../screens/SizeSelectionScreen';
import ConfirmOrderScreen from '../screens/ConfirmOrderScreen';
import { useAuthStore } from '../store/useAuthStore';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          cardStyle: { backgroundColor: '#0F0F0F' } 
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Quality" component={QualityScreen} />
            <Stack.Screen name="SizeSelection" component={SizeSelectionScreen} />
            <Stack.Screen name="ConfirmOrder" component={ConfirmOrderScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}