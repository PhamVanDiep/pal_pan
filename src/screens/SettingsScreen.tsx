import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, {AuthorizationStatus} from '@notifee/react-native';
import {useLoading} from '../context/LoadingContext';
import {useToast} from '../context/ToastContext';

interface SettingsScreenProps {
  onLogout: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({onLogout}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [dailyReminder, setDailyReminder] = useState(false);
  const [username, setUsername] = useState('');
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const {showLoading, hideLoading} = useLoading();
  const {showSuccess, showError, showInfo, showWarning} = useToast();

  useEffect(() => {
    loadSettings();
    checkNotificationPermission();
  }, []);

  const loadSettings = async () => {
    try {
      const [savedNotif, savedReminder, savedUsername] = await Promise.all([
        AsyncStorage.getItem('notificationsEnabled'),
        AsyncStorage.getItem('dailyReminder'),
        AsyncStorage.getItem('username'),
      ]);

      if (savedNotif !== null) {
        setNotificationsEnabled(savedNotif === 'true');
      }
      if (savedReminder !== null) {
        setDailyReminder(savedReminder === 'true');
      }
      if (savedUsername) {
        setUsername(savedUsername);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const checkNotificationPermission = async () => {
    try {
      const settings = await notifee.getNotificationSettings();
      if (settings.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
        setNotificationsEnabled(true);
      } else {
        setNotificationsEnabled(false);
      }
    } catch (error) {
      console.error('Error checking notification permission:', error);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const settings = await notifee.requestPermission();

      if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
        setNotificationsEnabled(true);
        await AsyncStorage.setItem('notificationsEnabled', 'true');
        showSuccess('Đã bật thông báo');

        // Create a notification channel for Android
        await notifee.createChannel({
          id: 'default',
          name: 'Default Channel',
          importance: 4,
        });
      } else {
        setNotificationsEnabled(false);
        await AsyncStorage.setItem('notificationsEnabled', 'false');
        showWarning('Bạn cần cấp quyền thông báo trong cài đặt hệ thống');
        setTimeout(() => {
          Linking.openSettings();
        }, 2000);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      showError('Không thể yêu cầu quyền thông báo');
    }
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      await requestNotificationPermission();
    } else {
      setNotificationsEnabled(false);
      await AsyncStorage.setItem('notificationsEnabled', 'false');

      // Disable daily reminder as well
      setDailyReminder(false);
      await AsyncStorage.setItem('dailyReminder', 'false');
    }
  };

  const toggleDailyReminder = async (value: boolean) => {
    if (value && !notificationsEnabled) {
      showError('Vui lòng bật thông báo trước');
      return;
    }

    setDailyReminder(value);
    await AsyncStorage.setItem('dailyReminder', value.toString());

    if (value) {
      // Schedule daily reminder (example: every day at 9 AM)
      showSuccess('Đã bật nhắc nhở hàng ngày lúc 9:00 sáng');
    } else {
      showInfo('Đã tắt nhắc nhở hàng ngày');
    }
  };

  const showLogoutConfirm = () => {
    setLogoutConfirmVisible(true);
  };

  const handleLogout = async () => {
    setLogoutConfirmVisible(false);
    showLoading('Đang đăng xuất...');

    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 500));

    await AsyncStorage.removeItem('isLoggedIn');
    await AsyncStorage.removeItem('username');
    hideLoading();
    onLogout();
  };

  const cancelLogout = () => {
    setLogoutConfirmVisible(false);
  };

  const testNotification = async () => {
    if (!notificationsEnabled) {
      showError('Vui lòng bật thông báo trước');
      return;
    }

    try {
      await notifee.displayNotification({
        title: 'PalPan Thông báo thử nghiệm',
        body: 'Đây là thông báo thử nghiệm từ ứng dụng PalPan của bạn',
        android: {
          channelId: 'default',
          smallIcon: 'ic_launcher',
          pressAction: {
            id: 'default',
          },
        },
      });
      showSuccess('Đã gửi thông báo thử nghiệm');
    } catch (error) {
      console.error('Error displaying notification:', error);
      showError('Không thể hiển thị thông báo');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cài Đặt</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài Khoản</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Người dùng</Text>
            <Text style={styles.settingValue}>{username || 'admin'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông Báo</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Cho phép thông báo</Text>
              <Text style={styles.settingDescription}>
                Nhận thông báo từ ứng dụng
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{false: '#DDD', true: '#8AB4F8'}}
              thumbColor={notificationsEnabled ? '#3B5998' : '#F4F4F4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text
                style={[
                  styles.settingLabel,
                  !notificationsEnabled && styles.disabledText,
                ]}>
                Nhắc nhở hàng ngày
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  !notificationsEnabled && styles.disabledText,
                ]}>
                Nhận nhắc nhở về công việc mỗi ngày
              </Text>
            </View>
            <Switch
              value={dailyReminder}
              onValueChange={toggleDailyReminder}
              disabled={!notificationsEnabled}
              trackColor={{false: '#DDD', true: '#8AB4F8'}}
              thumbColor={dailyReminder ? '#3B5998' : '#F4F4F4'}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              !notificationsEnabled && styles.buttonDisabled,
            ]}
            onPress={testNotification}
            disabled={!notificationsEnabled}>
            <Text
              style={[
                styles.buttonText,
                !notificationsEnabled && styles.buttonTextDisabled,
              ]}>
              Thử thông báo
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Về Ứng Dụng</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Phiên bản</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={showLogoutConfirm}>
          <Text style={styles.logoutButtonText}>Đăng Xuất</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={logoutConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelLogout}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Đăng xuất</Text>
            <Text style={styles.confirmMessage}>
              Bạn có chắc muốn đăng xuất?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmButtonCancel}
                onPress={cancelLogout}>
                <Text style={styles.confirmButtonCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButtonLogout}
                onPress={handleLogout}>
                <Text style={styles.confirmButtonLogoutText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#3B5998',
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    backgroundColor: '#FFF',
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#999',
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  disabledText: {
    color: '#BBB',
  },
  button: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#3B5998',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#DDD',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: '#999',
  },
  logoutButton: {
    margin: 20,
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  confirmButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  confirmButtonLogout: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
  },
  confirmButtonLogoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
});

export default SettingsScreen;
