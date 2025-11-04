import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Text, Platform} from 'react-native';
import PDFExampleScreen from '../screens/PDFExampleScreen';
import PDFViewerScreen from '../screens/PDFViewerScreen';
import ImageGalleryScreen from '../screens/ImageGalleryScreen';
import ImageViewerScreen from '../screens/ImageViewerScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack Navigator cho PDF Tab
const PDFStack = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="PDFList" component={PDFExampleScreen} />
      <Stack.Screen name="PDFViewer" component={PDFViewerScreen} />
    </Stack.Navigator>
  );
};

// Stack Navigator cho Image Tab
const ImageStack = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="ImageGallery" component={ImageGalleryScreen} />
      <Stack.Screen name="ImageViewer" component={ImageViewerScreen} />
    </Stack.Navigator>
  );
};

const BottomTabNavigatorExample: React.FC = () => {
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
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tab.Screen
        name="PDFTab"
        component={PDFStack}
        options={{
          tabBarLabel: 'PDF',
          tabBarIcon: ({color, size}) => (
            <Text style={{fontSize: 24}}>📄</Text>
          ),
        }}
      />
      <Tab.Screen
        name="ImageTab"
        component={ImageStack}
        options={{
          tabBarLabel: 'Ảnh',
          tabBarIcon: ({color, size}) => (
            <Text style={{fontSize: 24}}>🖼️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigatorExample;
