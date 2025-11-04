/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {LoadingProvider} from './src/context/LoadingContext';
import {ToastProvider} from './src/context/ToastContext';
import LoginScreen from './src/screens/LoginScreen';
import MainNavigator from './src/navigation/MainNavigator';
import linking from './src/config/linking';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const loggedIn = await AsyncStorage.getItem('isLoggedIn');
      setIsLoggedIn(loggedIn === 'true');
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <LoadingProvider>
          <NavigationContainer linking={linking} fallback={null}>
            {isLoggedIn ? (
              <MainNavigator onLogout={handleLogout} />
            ) : (
              <LoginScreen onLoginSuccess={handleLoginSuccess} />
            )}
          </NavigationContainer>
        </LoadingProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

export default App;
