import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

export interface UploadedFile {
  id: string;
  fileName: string;
  originalPath: string;
  storedPath: string;
  fileSize: number;
  mimeType?: string;
  uploadedAt: string;
  thumbnail?: string;
  width?: number;
  height?: number;
}

class FileUploadService {
  private uploadedFiles: UploadedFile[] = [];
  private readonly UPLOADED_FILES_KEY = '@uploaded_files';
  private readonly UPLOAD_DIR = `${RNFS.DocumentDirectoryPath}/uploads`;

  /**
   * Initialize upload directory
   */
  async initializeUploadDir(): Promise<void> {
    try {
      const exists = await RNFS.exists(this.UPLOAD_DIR);
      if (!exists) {
        await RNFS.mkdir(this.UPLOAD_DIR);
      }
    } catch (error) {
      console.error('Error initializing upload directory:', error);
    }
  }

  /**
   * Load danh sách file đã upload từ AsyncStorage
   */
  async loadUploadedFiles(): Promise<UploadedFile[]> {
    try {
      const data = await AsyncStorage.getItem(this.UPLOADED_FILES_KEY);
      if (data) {
        this.uploadedFiles = JSON.parse(data);
        return this.uploadedFiles;
      }
      return [];
    } catch (error) {
      console.error('Error loading uploaded files:', error);
      return [];
    }
  }

  /**
   * Lưu danh sách file vào AsyncStorage
   */
  private async saveUploadedFiles(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.UPLOADED_FILES_KEY,
        JSON.stringify(this.uploadedFiles),
      );
    } catch (error) {
      console.error('Error saving uploaded files:', error);
    }
  }

  /**
   * Upload file vào thư mục uploads
   */
  async uploadFile(
    sourceUri: string,
    fileName: string,
    fileSize: number,
    mimeType?: string,
    width?: number,
    height?: number,
  ): Promise<UploadedFile> {
    try {
      await this.initializeUploadDir();

      const timestamp = Date.now();
      const fileExtension = fileName.split('.').pop() || 'file';
      const newFileName = `upload_${timestamp}.${fileExtension}`;
      const destinationPath = `${this.UPLOAD_DIR}/${newFileName}`;

      // Copy file to upload directory using react-native-fs
      await RNFS.copyFile(sourceUri, destinationPath);

      // Create thumbnail for images
      let thumbnailPath: string | undefined;
      if (mimeType && mimeType.startsWith('image/')) {
        const thumbFileName = `thumb_${timestamp}.${fileExtension}`;
        thumbnailPath = `${this.UPLOAD_DIR}/${thumbFileName}`;
        await RNFS.copyFile(sourceUri, thumbnailPath);
      }

      const uploadedFile: UploadedFile = {
        id: `file_${timestamp}`,
        fileName: newFileName,
        originalPath: sourceUri,
        storedPath: destinationPath,
        fileSize,
        mimeType,
        uploadedAt: new Date().toISOString(),
        thumbnail: thumbnailPath,
        width,
        height,
      };

      this.uploadedFiles.unshift(uploadedFile);
      await this.saveUploadedFiles();

      return uploadedFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Lấy tất cả file đã upload
   */
  async getAllFiles(): Promise<UploadedFile[]> {
    if (this.uploadedFiles.length === 0) {
      await this.loadUploadedFiles();
    }
    return this.uploadedFiles;
  }

  /**
   * Lấy file theo ID
   */
  getFileById(id: string): UploadedFile | undefined {
    return this.uploadedFiles.find(file => file.id === id);
  }

  /**
   * Xóa file
   */
  async deleteFile(id: string): Promise<boolean> {
    try {
      const index = this.uploadedFiles.findIndex(file => file.id === id);
      if (index === -1) {
        return false;
      }

      const file = this.uploadedFiles[index];

      // Delete main file using react-native-fs
      if (file.storedPath) {
        const exists = await RNFS.exists(file.storedPath);
        if (exists) {
          await RNFS.unlink(file.storedPath);
        }
      }

      // Delete thumbnail
      if (file.thumbnail) {
        const thumbExists = await RNFS.exists(file.thumbnail);
        if (thumbExists) {
          await RNFS.unlink(file.thumbnail);
        }
      }

      this.uploadedFiles.splice(index, 1);
      await this.saveUploadedFiles();

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Xóa tất cả file
   */
  async clearAllFiles(): Promise<void> {
    try {
      for (const file of this.uploadedFiles) {
        if (file.storedPath) {
          const exists = await RNFS.exists(file.storedPath);
          if (exists) {
            await RNFS.unlink(file.storedPath);
          }
        }
        if (file.thumbnail) {
          const thumbExists = await RNFS.exists(file.thumbnail);
          if (thumbExists) {
            await RNFS.unlink(file.thumbnail);
          }
        }
      }

      this.uploadedFiles = [];
      await this.saveUploadedFiles();
    } catch (error) {
      console.error('Error clearing files:', error);
    }
  }

  /**
   * Get số lượng file
   */
  getFilesCount(): number {
    return this.uploadedFiles.length;
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get total storage used
   */
  getTotalStorageUsed(): number {
    return this.uploadedFiles.reduce((total, file) => total + file.fileSize, 0);
  }

  /**
   * Get upload directory path
   */
  getUploadDirPath(): string {
    return this.UPLOAD_DIR;
  }

  /**
   * Get directory info
   */
  async getDirectoryInfo(): Promise<{
    exists: boolean;
    path: string;
    fileCount: number;
  }> {
    try {
      const exists = await RNFS.exists(this.UPLOAD_DIR);
      return {
        exists,
        path: this.UPLOAD_DIR,
        fileCount: this.uploadedFiles.length,
      };
    } catch (error) {
      console.error('Error getting directory info:', error);
      return {
        exists: false,
        path: this.UPLOAD_DIR,
        fileCount: 0,
      };
    }
  }
}

export default new FileUploadService();
