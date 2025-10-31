import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import BiometricAuthService from '../services/BiometricAuth';
import { BiometryTypes } from 'react-native-biometrics';

interface BiometricLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const BiometricLogin: React.FC<BiometricLoginProps> = ({
  onSuccess,
  onError,
}) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [biometryTypeEnum, setBiometryTypeEnum] = useState<BiometryTypes | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    setIsLoading(true);
    try {
      const capabilities = await BiometricAuthService.isBiometricAvailable();
      setIsAvailable(capabilities.available);

      if (capabilities.available) {
        const typeName = await BiometricAuthService.getBiometricTypeName();
        setBiometricType(typeName);
        setBiometryTypeEnum(capabilities.biometryType);
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBiometricIcon = () => {
    // For iOS: Show face icon for FaceID, fingerprint for TouchID
    if (Platform.OS === 'ios') {
      if (biometryTypeEnum === BiometryTypes.FaceID) {
        return '👤'; // Face icon for iOS FaceID
      } else if (biometryTypeEnum === BiometryTypes.TouchID) {
        return '👆'; // Fingerprint icon for iOS TouchID
      }
    }

    // For Android: Always show fingerprint icon
    if (Platform.OS === 'android') {
      return '👆'; // Fingerprint icon for Android
    }

    // Fallback
    return '🔐';
  };

  const handleBiometricAuth = async () => {
    setIsAuthenticating(true);
    try {
      const result = await BiometricAuthService.authenticate(
        `Xác thực bằng ${biometricType}`
      );

      if (result.success) {
        Alert.alert(
          'Thành công',
          'Đăng nhập thành công!',
          [
            {
              text: 'OK',
              onPress: () => onSuccess?.(),
            },
          ]
        );
      } else {
        const errorMessage = result.error || 'Xác thực không thành công';
        Alert.alert('Lỗi', errorMessage);
        onError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      Alert.alert('Lỗi', errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang kiểm tra sinh trắc học...</Text>
      </View>
    );
  }

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <Text style={styles.unavailableText}>
          Thiết bị không hỗ trợ xác thực sinh trắc học
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isAuthenticating && styles.buttonDisabled]}
        onPress={handleBiometricAuth}
        disabled={isAuthenticating}
      >
        {isAuthenticating ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.buttonIcon}>{getBiometricIcon()}</Text>
            <Text style={styles.buttonText}>
              Đăng nhập bằng {biometricType}
            </Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={styles.infoText}>
        Sử dụng {biometricType} để đăng nhập nhanh chóng và bảo mật
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#999999',
  },
  buttonIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    marginTop: 15,
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666666',
  },
  unavailableText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});

export default BiometricLogin;
