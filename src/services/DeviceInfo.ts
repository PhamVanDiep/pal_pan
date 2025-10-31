import DeviceInfo from 'react-native-device-info';
import {Platform} from 'react-native';

export interface DeviceInformation {
  // Basic Info
  deviceName: string;
  deviceModel: string;
  deviceBrand: string;
  deviceId: string;
  uniqueId: string;

  // System Info
  systemName: string;
  systemVersion: string;
  buildNumber: string;
  appVersion: string;
  bundleId: string;

  // Hardware Info
  totalMemory: string;
  usedMemory: string;
  totalDiskCapacity: string;
  freeDiskStorage: string;

  // Display Info
  hasNotch: boolean;
  deviceType: string;
  isTablet: boolean;

  // Network Info
  carrier: string;
  ipAddress: string;

  // Other
  isEmulator: boolean;
  installerPackageName: string;
}

class DeviceInfoService {
  /**
   * Lấy tất cả thông tin thiết bị
   */
  async getAllDeviceInfo(): Promise<DeviceInformation> {
    try {
      const [
        deviceName,
        model,
        brand,
        deviceId,
        uniqueId,
        systemName,
        systemVersion,
        buildNumber,
        appVersion,
        bundleId,
        totalMemory,
        usedMemory,
        totalDiskCapacity,
        freeDiskStorage,
        hasNotch,
        deviceType,
        isTablet,
        carrier,
        ipAddress,
        isEmulator,
        installerPackageName,
      ] = await Promise.all([
        DeviceInfo.getDeviceName(),
        DeviceInfo.getModel(),
        DeviceInfo.getBrand(),
        DeviceInfo.getDeviceId(),
        DeviceInfo.getUniqueId(),
        DeviceInfo.getSystemName(),
        DeviceInfo.getSystemVersion(),
        DeviceInfo.getBuildNumber(),
        DeviceInfo.getVersion(),
        DeviceInfo.getBundleId(),
        DeviceInfo.getTotalMemory(),
        DeviceInfo.getUsedMemory(),
        DeviceInfo.getTotalDiskCapacity(),
        DeviceInfo.getFreeDiskStorage(),
        DeviceInfo.hasNotch(),
        DeviceInfo.getDeviceType(),
        DeviceInfo.isTablet(),
        DeviceInfo.getCarrier(),
        DeviceInfo.getIpAddress(),
        DeviceInfo.isEmulator(),
        DeviceInfo.getInstallerPackageName(),
      ]);

      return {
        deviceName,
        deviceModel: model,
        deviceBrand: brand,
        deviceId,
        uniqueId,
        systemName,
        systemVersion,
        buildNumber,
        appVersion,
        bundleId,
        totalMemory: this.formatBytes(totalMemory),
        usedMemory: this.formatBytes(usedMemory),
        totalDiskCapacity: this.formatBytes(totalDiskCapacity),
        freeDiskStorage: this.formatBytes(freeDiskStorage),
        hasNotch,
        deviceType,
        isTablet,
        carrier: carrier || 'Không xác định',
        ipAddress: ipAddress || 'Không xác định',
        isEmulator,
        installerPackageName: installerPackageName || 'Không xác định',
      };
    } catch (error) {
      console.error('Error getting device info:', error);
      throw error;
    }
  }

  /**
   * Lấy thông tin cơ bản về thiết bị
   */
  async getBasicInfo() {
    const deviceName = await DeviceInfo.getDeviceName();
    const model = DeviceInfo.getModel();
    const brand = DeviceInfo.getBrand();
    const systemVersion = DeviceInfo.getSystemVersion();

    return {
      deviceName,
      model,
      brand,
      systemVersion,
      platform: Platform.OS,
    };
  }

  /**
   * Lấy thông tin về ứng dụng
   */
  async getAppInfo() {
    const appVersion = DeviceInfo.getVersion();
    const buildNumber = DeviceInfo.getBuildNumber();
    const bundleId = DeviceInfo.getBundleId();

    return {
      appVersion,
      buildNumber,
      bundleId,
    };
  }

  /**
   * Lấy thông tin về bộ nhớ
   */
  async getMemoryInfo() {
    const totalMemory = await DeviceInfo.getTotalMemory();
    const usedMemory = await DeviceInfo.getUsedMemory();

    return {
      totalMemory: this.formatBytes(totalMemory),
      usedMemory: this.formatBytes(usedMemory),
      freeMemory: this.formatBytes(totalMemory - usedMemory),
      usagePercent: ((usedMemory / totalMemory) * 100).toFixed(1) + '%',
    };
  }

  /**
   * Lấy thông tin về dung lượng lưu trữ
   */
  async getStorageInfo() {
    const totalDiskCapacity = await DeviceInfo.getTotalDiskCapacity();
    const freeDiskStorage = await DeviceInfo.getFreeDiskStorage();

    return {
      totalDiskCapacity: this.formatBytes(totalDiskCapacity),
      freeDiskStorage: this.formatBytes(freeDiskStorage),
      usedDiskStorage: this.formatBytes(totalDiskCapacity - freeDiskStorage),
      usagePercent:
        (((totalDiskCapacity - freeDiskStorage) / totalDiskCapacity) * 100).toFixed(1) + '%',
    };
  }

  /**
   * Định dạng bytes thành chuỗi dễ đọc
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Kiểm tra xem có phải là thiết bị thật không
   */
  async isRealDevice(): Promise<boolean> {
    const isEmulator = await DeviceInfo.isEmulator();
    return !isEmulator;
  }

  /**
   * Lấy ID duy nhất của thiết bị
   */
  async getDeviceUniqueId(): Promise<string> {
    return await DeviceInfo.getUniqueId();
  }
}

export default new DeviceInfoService();
