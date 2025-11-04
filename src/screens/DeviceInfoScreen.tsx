import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import DeviceInfoService, {DeviceInformation} from '../services/DeviceInfo';
import {useLoading} from '../context/LoadingContext';
import {useToast} from '../context/ToastContext';

interface DeviceInfoScreenProps {
  navigation: any;
}

const DeviceInfoScreen: React.FC<DeviceInfoScreenProps> = ({navigation}) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInformation | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const {showLoading, hideLoading} = useLoading();
  const {showError} = useToast();

  useEffect(() => {
    loadDeviceInfo();
  }, []);

  const loadDeviceInfo = async () => {
    try {
      showLoading('Đang tải thông tin thiết bị...');
      const info = await DeviceInfoService.getAllDeviceInfo();
      setDeviceInfo(info);
    } catch (error) {
      console.error('Error loading device info:', error);
      showError('Không thể tải thông tin thiết bị');
    } finally {
      hideLoading();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const info = await DeviceInfoService.getAllDeviceInfo();
      setDeviceInfo(info);
    } catch (error) {
      console.error('Error refreshing device info:', error);
      showError('Không thể làm mới thông tin thiết bị');
    } finally {
      setRefreshing(false);
    }
  };

  const renderInfoItem = (label: string, value: string | boolean) => (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>
        {typeof value === 'boolean' ? (value ? 'Có' : 'Không') : value}
      </Text>
    </View>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={[styles.header, {paddingTop: insets.top + 10}]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Thông Tin Thiết Bị</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {deviceInfo ? (
          <>
            {renderSection(
              'Thông Tin Cơ Bản',
              <>
                {renderInfoItem('Tên thiết bị', deviceInfo.deviceName)}
                {renderInfoItem('Model', deviceInfo.deviceModel)}
                {renderInfoItem('Hãng', deviceInfo.deviceBrand)}
                {renderInfoItem('Loại thiết bị', deviceInfo.deviceType)}
                {renderInfoItem('Là máy tính bảng', deviceInfo.isTablet)}
                {renderInfoItem('Có tai thỏ', deviceInfo.hasNotch)}
              </>,
            )}

            {renderSection(
              'Thông Tin Hệ Thống',
              <>
                {renderInfoItem('Hệ điều hành', deviceInfo.systemName)}
                {renderInfoItem('Phiên bản OS', deviceInfo.systemVersion)}
                {renderInfoItem('Là giả lập', deviceInfo.isEmulator)}
              </>,
            )}

            {renderSection(
              'Thông Tin Ứng Dụng',
              <>
                {renderInfoItem('Phiên bản ứng dụng', deviceInfo.appVersion)}
                {renderInfoItem('Build number', deviceInfo.buildNumber)}
                {renderInfoItem('Bundle ID', deviceInfo.bundleId)}
                {renderInfoItem(
                  'Cài đặt từ',
                  deviceInfo.installerPackageName,
                )}
              </>,
            )}

            {renderSection(
              'Bộ Nhớ',
              <>
                {renderInfoItem('Tổng dung lượng RAM', deviceInfo.totalMemory)}
                {renderInfoItem('RAM đang dùng', deviceInfo.usedMemory)}
              </>,
            )}

            {renderSection(
              'Lưu Trữ',
              <>
                {renderInfoItem(
                  'Tổng dung lượng',
                  deviceInfo.totalDiskCapacity,
                )}
                {renderInfoItem('Còn trống', deviceInfo.freeDiskStorage)}
              </>,
            )}

            {renderSection(
              'Mạng',
              <>
                {renderInfoItem('Nhà mạng', deviceInfo.carrier)}
                {renderInfoItem('Địa chỉ IP', deviceInfo.ipAddress)}
              </>,
            )}

            {renderSection(
              'ID Thiết Bị',
              <>
                {renderInfoItem('Device ID', deviceInfo.deviceId)}
                {renderInfoItem('Unique ID', deviceInfo.uniqueId)}
              </>,
            )}
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang tải thông tin...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3B5998',
    paddingBottom: 15,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
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
  sectionContent: {
    paddingBottom: 5,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    color: '#666',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
});

export default DeviceInfoScreen;
