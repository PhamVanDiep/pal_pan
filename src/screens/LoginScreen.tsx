import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useLoading} from '../context/LoadingContext';
import {useToast} from '../context/ToastContext';
import BiometricAuthService from '../services/BiometricAuth';
import { BiometryTypes } from 'react-native-biometrics';

const PRIMARY_COLOR = '#3B5998';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({onLoginSuccess}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryTypes | undefined>();
  const {showLoading, hideLoading} = useLoading();
  const {showError, showSuccess} = useToast();

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const capabilities = await BiometricAuthService.isBiometricAvailable();
      setBiometricAvailable(capabilities.available);
      setBiometryType(capabilities.biometryType);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  };

  const getBiometricIcon = () => {
    if (!biometricAvailable) return null;

    // For iOS: Show face icon for FaceID, fingerprint for TouchID
    if (Platform.OS === 'ios') {
      if (biometryType === BiometryTypes.FaceID) {
        return '👤'; // Face icon for iOS FaceID
      } else if (biometryType === BiometryTypes.TouchID) {
        return '👆'; // Fingerprint icon for iOS TouchID
      }
    }

    // For Android: Always show fingerprint icon
    if (Platform.OS === 'android') {
      return '👆'; // Fingerprint icon for Android
    }

    return null;
  };

  const handleBiometricLogin = async () => {
    if (!biometricAvailable) return;

    showLoading('Đang xác thực...');
    try {
      const result = await BiometricAuthService.authenticate('Xác thực để đăng nhập');

      if (result.success) {
        await AsyncStorage.setItem('isLoggedIn', 'true');
        await AsyncStorage.setItem('username', 'Admin User');
        hideLoading();
        showSuccess('Đăng nhập thành công bằng sinh trắc học!');

        setTimeout(() => {
          onLoginSuccess();
        }, 500);
      } else {
        hideLoading();
        showError(result.error || 'Xác thực không thành công');
      }
    } catch (error) {
      hideLoading();
      showError('Lỗi xác thực sinh trắc học');
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showError('Vui lòng nhập email và mật khẩu');
      return;
    }

    // Simple demo authentication
    if (email === 'admin@example.com' && password === 'password') {
      showLoading('Đang đăng nhập...');
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        await AsyncStorage.setItem('isLoggedIn', 'true');
        await AsyncStorage.setItem('username', 'Admin User');
        hideLoading();
        showSuccess('Đăng nhập thành công!');

        // Delay to show success toast
        setTimeout(() => {
          onLoginSuccess();
        }, 500);
      } catch (error) {
        hideLoading();
        showError('Không thể lưu thông tin đăng nhập');
      }
    } else {
      showError('Email hoặc mật khẩu không đúng. Demo: admin@example.com / password');
    }
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password logic
    console.log('Forgot password pressed');
  };

  const handleSignUp = () => {
    // TODO: Implement sign up navigation
    console.log('Sign up pressed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_COLOR} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
              />
            </View>

            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <View style={styles.loginButtonContainer}>
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>Log In</Text>
              </TouchableOpacity>

              {biometricAvailable && (
                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricLogin}>
                  <Text style={styles.biometricIcon}>{getBiometricIcon()}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    color: '#333',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: PRIMARY_COLOR,
    fontSize: 14,
    fontWeight: '600',
  },
  loginButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  loginButton: {
    flex: 1,
    height: 50,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PRIMARY_COLOR,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  biometricButton: {
    width: 50,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  biometricIcon: {
    fontSize: 24,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    color: '#666',
    fontSize: 14,
  },
  signUpLink: {
    color: PRIMARY_COLOR,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
