import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import ImageService, {ImageItem} from '../services/ImageService';
import {useLoading} from '../context/LoadingContext';
import {useToast} from '../context/ToastContext';

interface ImageViewerScreenProps {
  navigation: any;
  route: any;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const ImageViewerScreen: React.FC<ImageViewerScreenProps> = ({
  navigation,
  route,
}) => {
  const {imageId, images} = route.params;
  const initialIndex = images.findIndex((img: ImageItem) => img.id === imageId);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const {showLoading, hideLoading} = useLoading();
  const {showSuccess, showError} = useToast();

  const currentImage = images[currentIndex];

  const handleDelete = () => {
    Alert.alert('Xóa ảnh', 'Bạn có chắc muốn xóa ảnh này?', [
      {text: 'Hủy', style: 'cancel'},
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          showLoading('Đang xóa...');
          try {
            await ImageService.deleteImage(currentImage.id);
            hideLoading();
            showSuccess('Đã xóa ảnh');

            // Navigate back if this was the last image
            if (images.length === 1) {
              navigation.goBack();
            } else {
              // Remove from local images array
              const newImages = images.filter(
                (img: ImageItem) => img.id !== currentImage.id,
              );
              // Adjust current index if needed
              const newIndex = currentIndex >= newImages.length ? newImages.length - 1 : currentIndex;
              setCurrentIndex(newIndex);
              // Update the images in route params
              navigation.setParams({images: newImages});
            }
          } catch (error) {
            hideLoading();
            showError('Không thể xóa ảnh');
          }
        },
      },
    ]);
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < images.length) {
      setCurrentIndex(index);
    }
  };

  const renderImageItem = ({item}: {item: ImageItem}) => {
    const imageUri =
      Platform.OS === 'android'
        ? `file://${item.localPath}`
        : item.localPath;

    return (
      <View style={styles.imageContainer}>
        <Image
          source={{uri: imageUri}}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top + 10}]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.headerButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {currentIndex + 1} / {images.length}
        </Text>

        <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
          <Text style={styles.headerButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Image Viewer */}
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={renderImageItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {/* Footer - Image Info */}
      <View style={styles.footer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tên file:</Text>
          <Text style={styles.infoValue}>{currentImage.fileName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Kích thước:</Text>
          <Text style={styles.infoValue}>
            {ImageService.formatFileSize(currentImage.fileSize)}
          </Text>
        </View>
        {currentImage.width && currentImage.height && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Độ phân giải:</Text>
            <Text style={styles.infoValue}>
              {currentImage.width} × {currentImage.height}
            </Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ngày thêm:</Text>
          <Text style={styles.infoValue}>
            {formatDate(currentImage.uploadedAt)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingBottom: 15,
    paddingHorizontal: 16,
  },
  headerButton: {
    padding: 8,
    minWidth: 40,
  },
  headerButtonText: {
    color: '#FFF',
    fontSize: 24,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  footer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#AAA',
    fontSize: 14,
  },
  infoValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ImageViewerScreen;
