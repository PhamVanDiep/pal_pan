import ReactNativeBlobUtil from 'react-native-blob-util';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PDFDocument {
  id: string;
  title: string;
  description?: string;
  url: string;
  size?: string;
  pages?: number;
  isLocal: boolean;
  localPath?: string;
  uploadedAt?: string;
  isUploaded?: boolean;
}

class PDFService {
  private downloadedFiles: Map<string, string> = new Map();
  private uploadedPDFs: PDFDocument[] = [];
  private readonly UPLOADED_PDFS_KEY = '@uploaded_pdfs';

  /**
   * Lấy danh sách PDF mẫu
   */
  getSamplePDFs(): PDFDocument[] {
    return [
      {
        id: '1',
        title: 'React Native Guide',
        description: 'Hướng dẫn React Native cơ bản',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        size: '13.4 KB',
        isLocal: false,
      },
      {
        id: '2',
        title: 'Sample PDF Document',
        description: 'File PDF mẫu để test',
        url: 'http://www.africau.edu/images/default/sample.pdf',
        size: '3.2 MB',
        isLocal: false,
      },
      {
        id: '3',
        title: 'Lorem Ipsum PDF',
        description: 'Lorem Ipsum text document',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        size: '13.4 KB',
        isLocal: false,
      },
    ];
  }

  /**
   * Download PDF file về máy với progress callback
   */
  async downloadPDF(
    url: string,
    fileName: string,
    onProgress?: (progress: number) => void,
  ): Promise<string> {
    try {
      // Check if already downloaded
      if (this.downloadedFiles.has(url)) {
        return this.downloadedFiles.get(url)!;
      }

      const {dirs} = ReactNativeBlobUtil.fs;
      const dirPath = Platform.OS === 'ios' ? dirs.DocumentDir : dirs.CacheDir;
      const filePath = `${dirPath}/${fileName}`;

      // Check if file exists
      const exists = await ReactNativeBlobUtil.fs.exists(filePath);
      if (exists) {
        this.downloadedFiles.set(url, filePath);
        return filePath;
      }

      // Download with progress
      const response = await ReactNativeBlobUtil.config({
        fileCache: true,
        path: filePath,
        appendExt: 'pdf',
      }).fetch('GET', url)
        .progress((received, total) => {
          const progress = (received / total) * 100;
          onProgress?.(progress);
        });

      const path = response.path();
      this.downloadedFiles.set(url, path);
      return path;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }

  /**
   * Lấy kích thước file PDF từ URL
   */
  async getPDFSize(url: string): Promise<number> {
    try {
      const response = await fetch(url, {method: 'HEAD'});
      const contentLength = response.headers.get('content-length');
      return contentLength ? parseInt(contentLength, 10) : 0;
    } catch (error) {
      console.error('Error getting PDF size:', error);
      return 0;
    }
  }

  /**
   * Format bytes thành chuỗi dễ đọc
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Xóa PDF đã download
   */
  async deletePDF(filePath: string): Promise<boolean> {
    try {
      const exists = await ReactNativeBlobUtil.fs.exists(filePath);
      if (exists) {
        await ReactNativeBlobUtil.fs.unlink(filePath);

        // Remove from cache
        for (const [url, path] of this.downloadedFiles.entries()) {
          if (path === filePath) {
            this.downloadedFiles.delete(url);
            break;
          }
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting PDF:', error);
      return false;
    }
  }

  /**
   * Xóa tất cả PDF đã download
   */
  async clearAllDownloads(): Promise<void> {
    try {
      for (const filePath of this.downloadedFiles.values()) {
        await this.deletePDF(filePath);
      }
      this.downloadedFiles.clear();
    } catch (error) {
      console.error('Error clearing downloads:', error);
    }
  }

  /**
   * Lấy danh sách các file đã download
   */
  getDownloadedFiles(): Map<string, string> {
    return this.downloadedFiles;
  }

  /**
   * Check xem file đã được download chưa
   */
  isDownloaded(url: string): boolean {
    return this.downloadedFiles.has(url);
  }

  /**
   * Lấy path của file đã download
   */
  getDownloadedPath(url: string): string | undefined {
    return this.downloadedFiles.get(url);
  }

  /**
   * Load danh sách PDF đã upload từ AsyncStorage
   */
  async loadUploadedPDFs(): Promise<PDFDocument[]> {
    try {
      const data = await AsyncStorage.getItem(this.UPLOADED_PDFS_KEY);
      if (data) {
        this.uploadedPDFs = JSON.parse(data);
        return this.uploadedPDFs;
      }
      return [];
    } catch (error) {
      console.error('Error loading uploaded PDFs:', error);
      return [];
    }
  }

  /**
   * Lưu danh sách PDF đã upload vào AsyncStorage
   */
  private async saveUploadedPDFs(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.UPLOADED_PDFS_KEY,
        JSON.stringify(this.uploadedPDFs),
      );
    } catch (error) {
      console.error('Error saving uploaded PDFs:', error);
    }
  }

  /**
   * Thêm PDF từ file picker
   */
  async addUploadedPDF(
    filePath: string,
    fileName: string,
    fileSize: number,
  ): Promise<PDFDocument> {
    try {
      // Copy file to app's directory
      const {dirs} = ReactNativeBlobUtil.fs;
      const dirPath = Platform.OS === 'ios' ? dirs.DocumentDir : dirs.CacheDir;
      const timestamp = Date.now();
      const newFileName = `upload_${timestamp}_${fileName}`;
      const newFilePath = `${dirPath}/${newFileName}`;

      // Copy file
      await ReactNativeBlobUtil.fs.cp(filePath, newFilePath);

      // Create PDF document object
      const pdfDoc: PDFDocument = {
        id: `upload_${timestamp}`,
        title: fileName.replace('.pdf', ''),
        description: 'File đã upload từ thiết bị',
        url: newFilePath,
        size: this.formatFileSize(fileSize),
        isLocal: true,
        localPath: newFilePath,
        uploadedAt: new Date().toISOString(),
        isUploaded: true,
      };

      // Add to list
      this.uploadedPDFs.unshift(pdfDoc); // Add to beginning
      await this.saveUploadedPDFs();

      return pdfDoc;
    } catch (error) {
      console.error('Error adding uploaded PDF:', error);
      throw error;
    }
  }

  /**
   * Upload PDF từ URL (download và lưu như uploaded file)
   */
  async uploadPDFFromURL(
    url: string,
    title: string,
    onProgress?: (progress: number) => void,
  ): Promise<PDFDocument> {
    try {
      const {dirs} = ReactNativeBlobUtil.fs;
      const dirPath = Platform.OS === 'ios' ? dirs.DocumentDir : dirs.CacheDir;
      const timestamp = Date.now();
      const fileName = `upload_${timestamp}_${title.replace(/\s+/g, '_')}.pdf`;
      const filePath = `${dirPath}/${fileName}`;

      // Download with progress
      const response = await ReactNativeBlobUtil.config({
        fileCache: true,
        path: filePath,
      }).fetch('GET', url)
        .progress((received, total) => {
          const progress = (received / total) * 100;
          onProgress?.(progress);
        });

      const path = response.path();

      // Get file size
      const stat = await ReactNativeBlobUtil.fs.stat(path);
      const fileSize = parseInt(stat.size, 10);

      // Create PDF document object
      const pdfDoc: PDFDocument = {
        id: `upload_${timestamp}`,
        title: title,
        description: 'File đã tải về từ URL',
        url: path,
        size: this.formatFileSize(fileSize),
        isLocal: true,
        localPath: path,
        uploadedAt: new Date().toISOString(),
        isUploaded: true,
      };

      // Add to list
      this.uploadedPDFs.unshift(pdfDoc);
      await this.saveUploadedPDFs();

      return pdfDoc;
    } catch (error) {
      console.error('Error uploading PDF from URL:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách tất cả PDF (samples + uploaded)
   */
  async getAllPDFs(): Promise<PDFDocument[]> {
    const samples = this.getSamplePDFs();
    const uploaded = await this.loadUploadedPDFs();
    return [...uploaded, ...samples];
  }

  /**
   * Xóa PDF đã upload
   */
  async deleteUploadedPDF(pdfId: string): Promise<boolean> {
    try {
      const index = this.uploadedPDFs.findIndex(pdf => pdf.id === pdfId);
      if (index === -1) {
        return false;
      }

      const pdf = this.uploadedPDFs[index];

      // Delete file from disk
      if (pdf.localPath) {
        const exists = await ReactNativeBlobUtil.fs.exists(pdf.localPath);
        if (exists) {
          await ReactNativeBlobUtil.fs.unlink(pdf.localPath);
        }
      }

      // Remove from list
      this.uploadedPDFs.splice(index, 1);
      await this.saveUploadedPDFs();

      return true;
    } catch (error) {
      console.error('Error deleting uploaded PDF:', error);
      return false;
    }
  }

  /**
   * Xóa tất cả PDF đã upload
   */
  async clearAllUploaded(): Promise<void> {
    try {
      // Delete all files
      for (const pdf of this.uploadedPDFs) {
        if (pdf.localPath) {
          const exists = await ReactNativeBlobUtil.fs.exists(pdf.localPath);
          if (exists) {
            await ReactNativeBlobUtil.fs.unlink(pdf.localPath);
          }
        }
      }

      // Clear list
      this.uploadedPDFs = [];
      await this.saveUploadedPDFs();
    } catch (error) {
      console.error('Error clearing uploaded PDFs:', error);
    }
  }

  /**
   * Get uploaded PDFs count
   */
  getUploadedCount(): number {
    return this.uploadedPDFs.length;
  }

  /**
   * Check if PDF is uploaded
   */
  isUploadedPDF(pdfId: string): boolean {
    return this.uploadedPDFs.some(pdf => pdf.id === pdfId);
  }
}

export default new PDFService();
