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
import ImageService, {ImageItem} from '../services/ImageService';
import {useLoading} from '../context/LoadingContext';
import {useToast} from '../context/ToastContext';

interface ImageGalleryScreenProps {
  navigation: any;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_SIZE = (SCREEN_WIDTH - 48) / 3; // 3 columns with padding

const ImageGalleryScreen: React.FC<ImageGalleryScreenProps> = ({
  navigation,
}) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const {showLoading, hideLoading} = useLoading();
  const {showSuccess, showError} = useToast();

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    const allImages = await ImageService.getAllImages();
    setImages(allImages);
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
        showLoading('Đang tải ảnh...');

        try {
          for (const asset of result.assets) {
            if (asset.uri) {
              await ImageService.addImage(
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
          showSuccess(`Đã thêm ${result.assets.length} ảnh`);
          await loadImages();
        } catch (error) {
          hideLoading();
          showError('Không thể lưu ảnh');
          console.error('Error saving images:', error);
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
        showLoading('Đang lưu ảnh...');

        try {
          const asset = result.assets[0];
          if (asset.uri) {
            await ImageService.addImage(
              asset.uri,
              asset.fileName || 'camera.jpg',
              asset.fileSize || 0,
              asset.type,
              asset.width,
              asset.height,
            );
          }

          hideLoading();
          showSuccess('Đã chụp và lưu ảnh');
          await loadImages();
        } catch (error) {
          hideLoading();
          showError('Không thể lưu ảnh');
          console.error('Error saving photo:', error);
        }
      }
    } catch (error) {
      showError('Lỗi khi chụp ảnh');
      console.error('Error taking photo:', error);
    }
  };

  const handleAddImage = () => {
    Alert.alert('Thêm ảnh', 'Chọn nguồn ảnh', [
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

  const handleImagePress = (image: ImageItem) => {
    if (isSelectionMode) {
      toggleImageSelection(image.id);
    } else {
      navigation.navigate('ImageViewer', {
        imageId: image.id,
        images: images,
      });
    }
  };

  const handleImageLongPress = (image: ImageItem) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      toggleImageSelection(image.id);
    }
  };

  const toggleImageSelection = (id: string) => {
    const newSelection = new Set(selectedImages);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedImages(newSelection);

    if (newSelection.size === 0) {
      setIsSelectionMode(false);
    }
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      'Xóa ảnh',
      `Bạn có chắc muốn xóa ${selectedImages.size} ảnh đã chọn?`,
      [
        {text: 'Hủy', style: 'cancel'},
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            showLoading('Đang xóa...');
            try {
              for (const id of selectedImages) {
                await ImageService.deleteImage(id);
              }
              hideLoading();
              showSuccess(`Đã xóa ${selectedImages.size} ảnh`);
              setSelectedImages(new Set());
              setIsSelectionMode(false);
              await loadImages();
            } catch (error) {
              hideLoading();
              showError('Không thể xóa ảnh');
            }
          },
        },
      ],
    );
  };

  const handleClearAll = () => {
    Alert.alert('Xóa tất cả', 'Bạn có chắc muốn xóa tất cả ảnh?', [
      {text: 'Hủy', style: 'cancel'},
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          showLoading('Đang xóa...');
          try {
            await ImageService.clearAllImages();
            hideLoading();
            showSuccess('Đã xóa tất cả ảnh');
            setImages([]);
            setSelectedImages(new Set());
            setIsSelectionMode(false);
          } catch (error) {
            hideLoading();
            showError('Không thể xóa ảnh');
          }
        },
      },
    ]);
  };

  const renderImageItem = ({item}: {item: ImageItem}) => {
    const isSelected = selectedImages.has(item.id);
    const imageUri = Platform.OS === 'android'
      ? `file://${item.thumbnail || item.localPath}`
      : item.thumbnail || item.localPath;

    return (
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={() => handleImagePress(item)}
        onLongPress={() => handleImageLongPress(item)}>
        <Image source={{uri: imageUri}} style={styles.image} />
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
    const storageUsed = ImageService.getTotalStorageUsed();

    return (
      <View style={styles.headerInfo}>
        <Text style={styles.headerInfoText}>
          {images.length} ảnh • {ImageService.formatFileSize(storageUsed)}
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🖼️</Text>
      <Text style={styles.emptyTitle}>Chưa có ảnh nào</Text>
      <Text style={styles.emptyText}>
        Nhấn nút + để thêm ảnh từ thư viện hoặc chụp ảnh mới
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
              setSelectedImages(new Set());
            }}>
            <Text style={styles.backButtonText}>✕</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.title, !isSelectionMode && styles.titleCenter]}>
          {isSelectionMode ? `${selectedImages.size} đã chọn` : '🖼️ Image Gallery'}
        </Text>

        {!isSelectionMode && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddImage}>
            <Text style={styles.addButtonText}>+</Text>
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
        data={images}
        renderItem={renderImageItem}
        keyExtractor={item => item.id}
        numColumns={3}
        ListHeaderComponent={images.length > 0 ? renderHeader : null}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
      />

      {images.length > 0 && !isSelectionMode && (
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
  addButton: {
    padding: 4,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  addButtonText: {
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
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
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

export default ImageGalleryScreen;
