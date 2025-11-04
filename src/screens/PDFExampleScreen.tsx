import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import PDFService, {PDFDocument} from '../services/PDFService';
import DocumentPicker from '../services/DocumentPicker';
import {useLoading} from '../context/LoadingContext';
import {useToast} from '../context/ToastContext';

interface PDFExampleScreenProps {
  navigation: any;
}

const PDFExampleScreen: React.FC<PDFExampleScreenProps> = ({navigation}) => {
  const [pdfList, setPdfList] = useState<PDFDocument[]>([]);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfTitle, setPdfTitle] = useState('');
  const insets = useSafeAreaInsets();
  const {showLoading, hideLoading} = useLoading();
  const {showSuccess, showError} = useToast();

  useEffect(() => {
    loadPDFList();
  }, []);

  const loadPDFList = async () => {
    const allPDFs = await PDFService.getAllPDFs();
    setPdfList(allPDFs);
    setUploadedCount(PDFService.getUploadedCount());
  };

  const handleOpenPDF = (pdf: PDFDocument) => {
    navigation.navigate('PDFViewer', {pdf});
  };

  const handleDownloadPDF = async (pdf: PDFDocument) => {
    if (PDFService.isDownloaded(pdf.url)) {
      showSuccess('File đã được tải về trước đó');
      return;
    }

    showLoading('Đang tải xuống PDF...');
    try {
      const fileName = `${pdf.id}_${pdf.title.replace(/\s+/g, '_')}.pdf`;
      await PDFService.downloadPDF(
        pdf.url,
        fileName,
        (progress) => {
          console.log('Download progress:', progress);
        },
      );
      hideLoading();
      showSuccess('Tải xuống thành công!');
    } catch (error) {
      hideLoading();
      showError('Không thể tải xuống PDF');
      console.error('Download error:', error);
    }
  };

  const handleUploadPDF = () => {
    Alert.alert(
      'Upload PDF',
      'Chọn nguồn file PDF',
      [
        {
          text: 'Từ thiết bị',
          onPress: handlePickDocument,
        },
        {
          text: 'Từ URL',
          onPress: handleUploadFromURL,
        },
        {
          text: 'Hủy',
          style: 'cancel',
        },
      ],
    );
  };

  const handleUploadFromURL = () => {
    setUploadModalVisible(true);
    // Preset some example URLs
    setPdfUrl('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
    setPdfTitle('My PDF Document');
  };

  const handlePickDocument = async () => {
    try {
      const file = await DocumentPicker.pickPDF();
      showLoading('Đang upload PDF...');

      try {
        // Get file path (remove file:// prefix if exists)
        let filePath = file.fileCopyUri || file.uri;
        if (filePath.startsWith('file://')) {
          filePath = filePath.substring(7);
        }

        await PDFService.addUploadedPDF(
          filePath,
          file.name || 'document.pdf',
          file.size || 0,
        );

        hideLoading();
        showSuccess('Đã upload PDF thành công!');
        await loadPDFList();
      } catch (error) {
        hideLoading();
        showError('Không thể upload PDF');
        console.error('Error uploading PDF:', error);
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled
        return;
      }
      showError('Không thể chọn file PDF');
      console.error('DocumentPicker error:', err);
    }
  };

  const handleConfirmUpload = async () => {
    if (!pdfUrl.trim()) {
      showError('Vui lòng nhập URL PDF');
      return;
    }

    if (!pdfTitle.trim()) {
      showError('Vui lòng nhập tiêu đề');
      return;
    }

    setUploadModalVisible(false);
    showLoading('Đang tải PDF...');

    try {
      await PDFService.uploadPDFFromURL(
        pdfUrl.trim(),
        pdfTitle.trim(),
        (progress) => {
          console.log('Upload progress:', progress);
        },
      );

      hideLoading();
      showSuccess('Đã upload PDF thành công!');

      // Reset form
      setPdfUrl('');
      setPdfTitle('');

      // Reload list
      await loadPDFList();
    } catch (error) {
      hideLoading();
      showError('Không thể tải PDF. Vui lòng kiểm tra URL.');
      console.error('Upload error:', error);
    }
  };

  const handleCancelUpload = () => {
    setUploadModalVisible(false);
    setPdfUrl('');
    setPdfTitle('');
  };

  const handleDeletePDF = (pdf: PDFDocument) => {
    if (!pdf.isUploaded) {
      showError('Chỉ có thể xóa file đã upload');
      return;
    }

    Alert.alert(
      'Xóa file PDF',
      `Bạn có chắc muốn xóa "${pdf.title}"?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            showLoading('Đang xóa...');
            try {
              await PDFService.deleteUploadedPDF(pdf.id);
              hideLoading();
              showSuccess('Đã xóa file');
              await loadPDFList();
            } catch (error) {
              hideLoading();
              showError('Không thể xóa file');
            }
          },
        },
      ],
    );
  };

  const handleClearDownloads = () => {
    Alert.alert(
      'Xóa tất cả file đã tải',
      'Bạn có chắc muốn xóa tất cả file PDF đã tải về?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            showLoading('Đang xóa...');
            try {
              await PDFService.clearAllDownloads();
              hideLoading();
              showSuccess('Đã xóa tất cả file đã tải');
            } catch (error) {
              hideLoading();
              showError('Không thể xóa file');
            }
          },
        },
      ],
    );
  };

  const handleClearUploaded = () => {
    Alert.alert(
      'Xóa tất cả file đã upload',
      'Bạn có chắc muốn xóa tất cả file PDF đã upload?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            showLoading('Đang xóa...');
            try {
              await PDFService.clearAllUploaded();
              hideLoading();
              showSuccess('Đã xóa tất cả file đã upload');
              await loadPDFList();
            } catch (error) {
              hideLoading();
              showError('Không thể xóa file');
            }
          },
        },
      ],
    );
  };

  const renderPDFItem = (pdf: PDFDocument) => {
    const isDownloaded = PDFService.isDownloaded(pdf.url);
    const isUploaded = pdf.isUploaded || false;

    return (
      <View key={pdf.id} style={styles.pdfItem}>
        <TouchableOpacity
          style={styles.pdfItemContent}
          onPress={() => handleOpenPDF(pdf)}>
          <View style={styles.pdfIcon}>
            <Text style={styles.pdfIconText}>
              {isUploaded ? '📤' : '📄'}
            </Text>
          </View>

          <View style={styles.pdfInfo}>
            <Text style={styles.pdfTitle}>{pdf.title}</Text>
            {pdf.description && (
              <Text style={styles.pdfDescription}>{pdf.description}</Text>
            )}
            <View style={styles.pdfMeta}>
              {pdf.size && (
                <Text style={styles.pdfMetaText}>📦 {pdf.size}</Text>
              )}
              {isUploaded && (
                <Text style={styles.uploadedBadge}>⬆️ Đã upload</Text>
              )}
              {!isUploaded && isDownloaded && (
                <Text style={styles.downloadedBadge}>✓ Đã tải</Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => handleOpenPDF(pdf)}>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        <View style={styles.pdfActions}>
          {isUploaded ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonDanger]}
                onPress={() => handleDeletePDF(pdf)}>
                <Text style={styles.actionButtonTextPrimary}>Xóa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonPrimary]}
                onPress={() => handleOpenPDF(pdf)}>
                <Text style={styles.actionButtonTextPrimary}>Xem ngay</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isDownloaded && styles.actionButtonDisabled,
                ]}
                onPress={() => handleDownloadPDF(pdf)}
                disabled={isDownloaded}>
                <Text
                  style={[
                    styles.actionButtonText,
                    isDownloaded && styles.actionButtonTextDisabled,
                  ]}>
                  {isDownloaded ? 'Đã tải xuống' : 'Tải xuống'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonPrimary]}
                onPress={() => handleOpenPDF(pdf)}>
                <Text style={styles.actionButtonTextPrimary}>Xem ngay</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top + 10}]}>
        <Text style={styles.title}>📄 PDF Manager</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>📚 Thư viện PDF mẫu</Text>
          <Text style={styles.infoText}>
            Upload file PDF từ thiết bị của bạn hoặc xem các file PDF mẫu với
            tính năng lazy loading cho file có kích thước lớn.
          </Text>
        </View>

        {/* Upload Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadPDF}>
            <Text style={styles.uploadButtonIcon}>📤</Text>
            <Text style={styles.uploadButtonText}>Upload PDF</Text>
          </TouchableOpacity>
          <Text style={styles.uploadHintText}>
            Chọn từ thiết bị hoặc tải từ URL
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh Sách PDF</Text>
          {pdfList.map(renderPDFItem)}
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearDownloads}>
            <Text style={styles.clearButtonText}>
              🗑️ Xóa tất cả file đã tải
            </Text>
          </TouchableOpacity>

          {uploadedCount > 0 && (
            <TouchableOpacity
              style={[styles.clearButton, styles.clearButtonDanger]}
              onPress={handleClearUploaded}>
              <Text style={styles.clearButtonText}>
                🗑️ Xóa tất cả file đã upload
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.featureSection}>
          <Text style={styles.featureSectionTitle}>✨ Tính năng</Text>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureText}>
              Lazy loading - Tải từng trang khi cần
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💾</Text>
            <Text style={styles.featureText}>
              Cache - Lưu file đã tải để xem offline
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔍</Text>
            <Text style={styles.featureText}>
              Zoom & Pan - Phóng to và di chuyển
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📖</Text>
            <Text style={styles.featureText}>
              Page Navigation - Điều hướng giữa các trang
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureText}>
              Progress - Hiển thị tiến trình tải
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🗑️</Text>
            <Text style={styles.featureText}>
              Delete - Xóa file đã download
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📤</Text>
            <Text style={styles.featureText}>
              Upload - Từ thiết bị (document-picker) hoặc từ URL
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Upload Modal */}
      <Modal
        visible={uploadModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelUpload}>
        <View style={styles.modalOverlay}>
          <View style={styles.uploadModal}>
            <Text style={styles.modalTitle}>Upload PDF từ URL</Text>

            <Text style={styles.inputLabel}>Tiêu đề PDF</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: React Native Guide"
              placeholderTextColor="#999"
              value={pdfTitle}
              onChangeText={setPdfTitle}
            />

            <Text style={styles.inputLabel}>URL PDF</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/file.pdf"
              placeholderTextColor="#999"
              value={pdfUrl}
              onChangeText={setPdfUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <Text style={styles.hintText}>
              💡 Nhập URL của file PDF để tải về và lưu vào thiết bị
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={handleCancelUpload}>
                <Text style={styles.modalButtonCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={handleConfirmUpload}>
                <Text style={styles.modalButtonConfirmText}>Upload</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B5998',
    paddingBottom: 15,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  infoSection: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B5998',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  pdfItem: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pdfItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  pdfIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pdfIconText: {
    fontSize: 24,
  },
  pdfInfo: {
    flex: 1,
  },
  pdfTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  pdfDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  pdfMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pdfMetaText: {
    fontSize: 12,
    color: '#999',
  },
  downloadedBadge: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  uploadedBadge: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  arrowButton: {
    padding: 8,
  },
  arrowIcon: {
    fontSize: 24,
    color: '#999',
    fontWeight: '300',
  },
  pdfActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    padding: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  actionButtonPrimary: {
    backgroundColor: '#3B5998',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  actionButtonTextDisabled: {
    color: '#999',
  },
  actionButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  actionButtonDanger: {
    backgroundColor: '#FF3B30',
  },
  uploadButton: {
    marginHorizontal: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  uploadButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  uploadHintText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadModal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#F9F9F9',
  },
  hintText: {
    fontSize: 13,
    color: '#666',
    marginTop: 12,
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  modalButtonConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  clearButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FF9800',
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonDanger: {
    backgroundColor: '#FF3B30',
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  featureSection: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  featureSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});

export default PDFExampleScreen;
