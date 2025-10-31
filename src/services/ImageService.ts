import ReactNativeBlobUtil from 'react-native-blob-util';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ImageItem {
  id: string;
  uri: string;
  localPath: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  width?: number;
  height?: number;
  uploadedAt: string;
  thumbnail?: string;
}

class ImageService {
  private images: ImageItem[] = [];
  private readonly IMAGES_KEY = '@uploaded_images';

  /**
   * Load danh sách ảnh đã upload từ AsyncStorage
   */
  async loadImages(): Promise<ImageItem[]> {
    try {
      const data = await AsyncStorage.getItem(this.IMAGES_KEY);
      if (data) {
        this.images = JSON.parse(data);
        return this.images;
      }
      return [];
    } catch (error) {
      console.error('Error loading images:', error);
      return [];
    }
  }

  /**
   * Lưu danh sách ảnh vào AsyncStorage
   */
  private async saveImages(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.IMAGES_KEY, JSON.stringify(this.images));
    } catch (error) {
      console.error('Error saving images:', error);
    }
  }

  /**
   * Thêm ảnh mới
   */
  async addImage(
    sourceUri: string,
    fileName: string,
    fileSize: number,
    mimeType?: string,
    width?: number,
    height?: number,
  ): Promise<ImageItem> {
    try {
      const {dirs} = ReactNativeBlobUtil.fs;
      const dirPath = Platform.OS === 'ios' ? dirs.DocumentDir : dirs.CacheDir;
      const timestamp = Date.now();
      const fileExtension = fileName.split('.').pop() || 'jpg';
      const newFileName = `img_${timestamp}.${fileExtension}`;
      const newFilePath = `${dirPath}/${newFileName}`;

      // Copy file to app directory
      await ReactNativeBlobUtil.fs.cp(sourceUri, newFilePath);

      // Create thumbnail (smaller version for grid view)
      const thumbnailPath = `${dirPath}/thumb_${timestamp}.${fileExtension}`;
      await ReactNativeBlobUtil.fs.cp(sourceUri, thumbnailPath);

      const imageItem: ImageItem = {
        id: `img_${timestamp}`,
        uri: newFilePath,
        localPath: newFilePath,
        fileName: newFileName,
        fileSize,
        mimeType,
        width,
        height,
        uploadedAt: new Date().toISOString(),
        thumbnail: thumbnailPath,
      };

      this.images.unshift(imageItem);
      await this.saveImages();

      return imageItem;
    } catch (error) {
      console.error('Error adding image:', error);
      throw error;
    }
  }

  /**
   * Lấy tất cả ảnh
   */
  async getAllImages(): Promise<ImageItem[]> {
    if (this.images.length === 0) {
      await this.loadImages();
    }
    return this.images;
  }

  /**
   * Lấy ảnh theo ID
   */
  getImageById(id: string): ImageItem | undefined {
    return this.images.find(img => img.id === id);
  }

  /**
   * Xóa ảnh
   */
  async deleteImage(id: string): Promise<boolean> {
    try {
      const index = this.images.findIndex(img => img.id === id);
      if (index === -1) {
        return false;
      }

      const image = this.images[index];

      // Delete main file
      if (image.localPath) {
        const exists = await ReactNativeBlobUtil.fs.exists(image.localPath);
        if (exists) {
          await ReactNativeBlobUtil.fs.unlink(image.localPath);
        }
      }

      // Delete thumbnail
      if (image.thumbnail) {
        const thumbExists = await ReactNativeBlobUtil.fs.exists(image.thumbnail);
        if (thumbExists) {
          await ReactNativeBlobUtil.fs.unlink(image.thumbnail);
        }
      }

      this.images.splice(index, 1);
      await this.saveImages();

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  /**
   * Xóa tất cả ảnh
   */
  async clearAllImages(): Promise<void> {
    try {
      for (const image of this.images) {
        if (image.localPath) {
          const exists = await ReactNativeBlobUtil.fs.exists(image.localPath);
          if (exists) {
            await ReactNativeBlobUtil.fs.unlink(image.localPath);
          }
        }
        if (image.thumbnail) {
          const thumbExists = await ReactNativeBlobUtil.fs.exists(
            image.thumbnail,
          );
          if (thumbExists) {
            await ReactNativeBlobUtil.fs.unlink(image.thumbnail);
          }
        }
      }

      this.images = [];
      await this.saveImages();
    } catch (error) {
      console.error('Error clearing images:', error);
    }
  }

  /**
   * Lấy số lượng ảnh
   */
  getImagesCount(): number {
    return this.images.length;
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
    return this.images.reduce((total, img) => total + img.fileSize, 0);
  }
}

export default new ImageService();
