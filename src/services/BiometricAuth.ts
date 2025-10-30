import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics({
  allowDeviceCredentials: true,
});

export interface BiometricCapabilities {
  available: boolean;
  biometryType: BiometryTypes | undefined;
  error?: string;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

class BiometricAuthService {
  /**
   * Kiểm tra xem thiết bị có hỗ trợ xác thực sinh trắc học không
   */
  async isBiometricAvailable(): Promise<BiometricCapabilities> {
    try {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      return {
        available,
        biometryType,
      };
    } catch (error) {
      return {
        available: false,
        biometryType: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Lấy tên loại sinh trắc học được hỗ trợ (Face ID, Touch ID, Biometrics)
   */
  async getBiometricTypeName(): Promise<string> {
    const { available, biometryType } = await this.isBiometricAvailable();

    if (!available) {
      return 'Không khả dụng';
    }

    switch (biometryType) {
      case BiometryTypes.FaceID:
        return 'Face ID';
      case BiometryTypes.TouchID:
        return 'Touch ID';
      case BiometryTypes.Biometrics:
        return 'Vân tay';
      default:
        return 'Sinh trắc học';
    }
  }

  /**
   * Thực hiện xác thực sinh trắc học
   */
  async authenticate(promptMessage: string = 'Xác thực để đăng nhập'): Promise<BiometricAuthResult> {
    try {
      const { available } = await this.isBiometricAvailable();

      if (!available) {
        return {
          success: false,
          error: 'Thiết bị không hỗ trợ xác thực sinh trắc học',
        };
      }

      const { success } = await rnBiometrics.simplePrompt({
        promptMessage,
        cancelButtonText: 'Hủy',
      });

      if (success) {
        return {
          success: true,
        };
      } else {
        return {
          success: false,
          error: 'Xác thực không thành công',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Lỗi xác thực',
      };
    }
  }

  /**
   * Tạo cặp khóa để sử dụng cho xác thực nâng cao (optional)
   */
  async createKeys(): Promise<{ publicKey: string } | null> {
    try {
      const { publicKey } = await rnBiometrics.createKeys();
      return { publicKey };
    } catch (error) {
      console.error('Error creating biometric keys:', error);
      return null;
    }
  }

  /**
   * Xóa khóa đã tạo
   */
  async deleteKeys(): Promise<boolean> {
    try {
      const { keysDeleted } = await rnBiometrics.deleteKeys();
      return keysDeleted;
    } catch (error) {
      console.error('Error deleting biometric keys:', error);
      return false;
    }
  }
}

export default new BiometricAuthService();
