import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import SettingsScreen from '../screens/SettingsScreen';
import DeviceInfoScreen from '../screens/DeviceInfoScreen';

const Stack = createNativeStackNavigator();

interface SettingsStackNavigatorProps {
  onLogout: () => void;
}

const SettingsStackNavigator: React.FC<SettingsStackNavigatorProps> = ({
  onLogout,
}) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="SettingsList">
        {(props) => <SettingsScreen {...props} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="DeviceInfo" component={DeviceInfoScreen} />
    </Stack.Navigator>
  );
};

export default SettingsStackNavigator;
