import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

interface MainNavigatorProps {
  onLogout: () => void;
}

const MainNavigator: React.FC<MainNavigatorProps> = ({onLogout}) => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B5998',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Công Việc',
          tabBarIcon: ({color, size}) => (
            <HomeIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Lịch',
          tabBarIcon: ({color, size}) => (
            <CalendarIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        options={{
          tabBarLabel: 'Cài Đặt',
          tabBarIcon: ({color, size}) => (
            <SettingsIcon color={color} size={size} />
          ),
        }}>
        {() => <SettingsScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

// Simple icon components (you can replace these with react-native-vector-icons later)
const HomeIcon = ({color, size}: {color: string; size: number}) => (
  <HomeIconSvg color={color} size={size} />
);

const CalendarIcon = ({color, size}: {color: string; size: number}) => (
  <CalendarIconSvg color={color} size={size} />
);

const SettingsIcon = ({color, size}: {color: string; size: number}) => (
  <SettingsIconSvg color={color} size={size} />
);

// Simple SVG-like components using Text (fallback)
import {View, Text} from 'react-native';

const HomeIconSvg = ({color, size}: {color: string; size: number}) => (
  <View
    style={{
      width: size,
      height: size,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
    <Text style={{color, fontSize: size * 0.8}}>🏠</Text>
  </View>
);

const CalendarIconSvg = ({color, size}: {color: string; size: number}) => (
  <View
    style={{
      width: size,
      height: size,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
    <Text style={{color, fontSize: size * 0.8}}>📅</Text>
  </View>
);

const SettingsIconSvg = ({color, size}: {color: string; size: number}) => (
  <View
    style={{
      width: size,
      height: size,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
    <Text style={{color, fontSize: size * 0.8}}>⚙️</Text>
  </View>
);

export default MainNavigator;
