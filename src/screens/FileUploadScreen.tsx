import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import FileUploadService, {UploadedFile} from '../services/FileUploadService';
import {useLoading} from '../context/LoadingContext';
import {useToast} from '../context/ToastContext';

interface FileUploadScreenProps {
  navigation: any;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_SIZE = (SCREEN_WIDTH - 48) / 3;

const FileUploadScreen: React.FC<FileUploadScreenProps> = ({navigation}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const {showLoading, hideLoading} = useLoading();
  const {showSuccess, showError} = useToast();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    const allFiles = await FileUploadService.getAllFiles();
    setFiles(allFiles);
  };

  const handleUploadImage = () => {
    Alert.alert('Upload ảnh', 'Chọn nguồn ảnh', [
      {
        text: 'Thư viện',
        onPress: handlePickFromGallery,
      },
      {
        text: 'Chụp ảnh',
        onPress: handleTakePhoto,
      },
      {
        text: 'Hủy',
        style: 'cancel',
      },
    ]);
  };

  const handlePickFromGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 10,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        showError('Không thể chọn ảnh: ' + result.errorMessage);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        showLoading('Đang upload...');

        try {
          for (const asset of result.assets) {
            if (asset.uri) {
              await FileUploadService.uploadFile(
                asset.uri,
                asset.fileName || 'image.jpg',
                asset.fileSize || 0,
                asset.type,
                asset.width,
                asset.height,
              );
            }
          }

          hideLoading();
          showSuccess(`Đã upload ${result.assets.length} ảnh`);
          await loadFiles();
        } catch (error) {
          hideLoading();
          showError('Không thể upload ảnh');
          console.error('Error uploading images:', error);
        }
      }
    } catch (error) {
      showError('Lỗi khi chọn ảnh');
      console.error('Error picking images:', error);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        showError('Không thể chụp ảnh: ' + result.errorMessage);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        showLoading('Đang upload...');

        try {
          const asset = result.assets[0];
          if (asset.uri) {
            await FileUploadService.uploadFile(
              asset.uri,
              asset.fileName || 'camera.jpg',
              asset.fileSize || 0,
              asset.type,
              asset.width,
              asset.height,
            );
          }

          hideLoading();
          showSuccess('Đã chụp và upload ảnh');
          await loadFiles();
        } catch (error) {
          hideLoading();
          showError('Không thể upload ảnh');
          console.error('Error uploading photo:', error);
        }
      }
    } catch (error) {
      showError('Lỗi khi chụp ảnh');
      console.error('Error taking photo:', error);
    }
  };

  const handleFilePress = (file: UploadedFile) => {
    if (isSelectionMode) {
      toggleFileSelection(file.id);
    } else {
      // Navigate to viewer if it's an image
      if (file.mimeType && file.mimeType.startsWith('image/')) {
        navigation.navigate('FileViewer', {
          fileId: file.id,
          files: files.filter(f => f.mimeType?.startsWith('image/')),
        });
      }
    }
  };

  const handleFileLongPress = (file: UploadedFile) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      toggleFileSelection(file.id);
    }
  };

  const toggleFileSelection = (id: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedFiles(newSelection);

    if (newSelection.size === 0) {
      setIsSelectionMode(false);
    }
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      'Xóa file',
      `Bạn có chắc muốn xóa ${selectedFiles.size} file đã chọn?`,
      [
        {text: 'Hủy', style: 'cancel'},
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            showLoading('Đang xóa...');
            try {
              for (const id of selectedFiles) {
                await FileUploadService.deleteFile(id);
              }
              hideLoading();
              showSuccess(`Đã xóa ${selectedFiles.size} file`);
              setSelectedFiles(new Set());
              setIsSelectionMode(false);
              await loadFiles();
            } catch (error) {
              hideLoading();
              showError('Không thể xóa file');
            }
          },
        },
      ],
    );
  };

  const handleClearAll = () => {
    Alert.alert('Xóa tất cả', 'Bạn có chắc muốn xóa tất cả file?', [
      {text: 'Hủy', style: 'cancel'},
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          showLoading('Đang xóa...');
          try {
            await FileUploadService.clearAllFiles();
            hideLoading();
            showSuccess('Đã xóa tất cả file');
            setFiles([]);
            setSelectedFiles(new Set());
            setIsSelectionMode(false);
          } catch (error) {
            hideLoading();
            showError('Không thể xóa file');
          }
        },
      },
    ]);
  };

  const renderFileItem = ({item}: {item: UploadedFile}) => {
    const isSelected = selectedFiles.has(item.id);
    const isImage = item.mimeType && item.mimeType.startsWith('image/');

    let fileUri = '';
    if (Platform.OS === 'android') {
      fileUri = `file://${item.thumbnail || item.storedPath}`;
    } else {
      fileUri = item.thumbnail || item.storedPath;
    }

    return (
      <TouchableOpacity
        style={styles.fileContainer}
        onPress={() => handleFilePress(item)}
        onLongPress={() => handleFileLongPress(item)}>
        {isImage ? (
          <Image source={{uri: fileUri}} style={styles.fileImage} />
        ) : (
          <View style={styles.filePlaceholder}>
            <Text style={styles.filePlaceholderText}>📄</Text>
            <Text style={styles.fileExtension} numberOfLines={1}>
              {item.fileName.split('.').pop()?.toUpperCase()}
            </Text>
          </View>
        )}
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>✓</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    const storageUsed = FileUploadService.getTotalStorageUsed();

    return (
      <View style={styles.headerInfo}>
        <Text style={styles.headerInfoText}>
          {files.length} file • {FileUploadService.formatFileSize(storageUsed)}
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📁</Text>
      <Text style={styles.emptyTitle}>Chưa có file nào</Text>
      <Text style={styles.emptyText}>
        Nhấn nút + để upload ảnh từ thư viện hoặc chụp ảnh mới
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {isSelectionMode && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setIsSelectionMode(false);
              setSelectedFiles(new Set());
            }}>
            <Text style={styles.backButtonText}>✕</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.title, !isSelectionMode && styles.titleCenter]}>
          {isSelectionMode ? `${selectedFiles.size} đã chọn` : '📤 File Upload'}
        </Text>

        {!isSelectionMode && (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadImage}>
            <Text style={styles.uploadButtonText}>+</Text>
          </TouchableOpacity>
        )}

        {isSelectionMode && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteSelected}>
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={files}
        renderItem={renderFileItem}
        keyExtractor={item => item.id}
        numColumns={3}
        ListHeaderComponent={files.length > 0 ? renderHeader : null}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
      />

      {files.length > 0 && !isSelectionMode && (
        <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAll}>
          <Text style={styles.clearAllButtonText}>Xóa tất cả</Text>
        </TouchableOpacity>
      )}
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
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
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
  titleCenter: {
    textAlign: 'center',
    flex: 0,
  },
  uploadButton: {
    padding: 4,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  uploadButtonText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '300',
  },
  deleteButton: {
    padding: 4,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 24,
  },
  headerInfo: {
    padding: 16,
    alignItems: 'center',
  },
  headerInfoText: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 8,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
  },
  fileContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  fileImage: {
    width: '100%',
    height: '100%',
  },
  filePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  filePlaceholderText: {
    fontSize: 48,
    marginBottom: 4,
  },
  fileExtension: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(59, 89, 152, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B5998',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  clearAllButton: {
    margin: 16,
    padding: 14,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    alignItems: 'center',
  },
  clearAllButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default FileUploadScreen;
