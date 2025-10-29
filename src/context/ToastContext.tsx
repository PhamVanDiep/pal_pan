import React, {createContext, useContext, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  opacity: Animated.Value;
}

const {width} = Dimensions.get('window');

export const ToastProvider: React.FC<ToastProviderProps> = ({children}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3000) => {
      const id = Date.now().toString();
      const opacity = new Animated.Value(0);

      const newToast: ToastItem = {
        id,
        message,
        type,
        opacity,
      };

      setToasts(prev => [...prev, newToast]);

      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto hide after duration
      setTimeout(() => {
        hideToast(id, opacity);
      }, duration);
    },
    [],
  );

  const hideToast = (id: string, opacity: Animated.Value) => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    });
  };

  const showSuccess = useCallback(
    (message: string) => showToast(message, 'success'),
    [showToast],
  );

  const showError = useCallback(
    (message: string) => showToast(message, 'error'),
    [showToast],
  );

  const showWarning = useCallback(
    (message: string) => showToast(message, 'warning'),
    [showToast],
  );

  const showInfo = useCallback(
    (message: string) => showToast(message, 'info'),
    [showToast],
  );

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {backgroundColor: '#4CAF50', icon: '✓'};
      case 'error':
        return {backgroundColor: '#F44336', icon: '✕'};
      case 'warning':
        return {backgroundColor: '#FF9800', icon: '⚠'};
      case 'info':
      default:
        return {backgroundColor: '#2196F3', icon: 'ℹ'};
    }
  };

  return (
    <ToastContext.Provider
      value={{showToast, showSuccess, showError, showWarning, showInfo}}>
      {children}
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map(toast => {
          const style = getToastStyle(toast.type);
          return (
            <Animated.View
              key={toast.id}
              style={[
                styles.toast,
                {backgroundColor: style.backgroundColor, opacity: toast.opacity},
              ]}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => hideToast(toast.id, toast.opacity)}
                style={styles.toastContent}>
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>{style.icon}</Text>
                </View>
                <Text style={styles.toastMessage} numberOfLines={3}>
                  {toast.message}
                </Text>
                <TouchableOpacity
                  onPress={() => hideToast(toast.id, toast.opacity)}
                  style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    minWidth: width - 40,
    maxWidth: width - 40,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toastMessage: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    opacity: 0.8,
  },
});
