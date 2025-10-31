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
import FileUploadService, {UploadedFile} from '../services/FileUploadService';
import {useLoading} from '../context/LoadingContext';
import {useToast} from '../context/ToastContext';

interface FileViewerScreenProps {
  navigation: any;
  route: any;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const FileViewerScreen: React.FC<FileViewerScreenProps> = ({
  navigation,
  route,
}) => {
  const {fileId, files} = route.params;
  const initialIndex = files.findIndex((f: UploadedFile) => f.id === fileId);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);
  const {showLoading, hideLoading} = useLoading();
  const {showSuccess, showError} = useToast();

  const currentFile = files[currentIndex];

  const handleDelete = () => {
    Alert.alert('Xóa file', 'Bạn có chắc muốn xóa file này?', [
      {text: 'Hủy', style: 'cancel'},
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          showLoading('Đang xóa...');
          try {
            await FileUploadService.deleteFile(currentFile.id);
            hideLoading();
            showSuccess('Đã xóa file');

            if (files.length === 1) {
              navigation.goBack();
            } else {
              const newFiles = files.filter(
                (f: UploadedFile) => f.id !== currentFile.id,
              );
              const newIndex =
                currentIndex >= newFiles.length
                  ? newFiles.length - 1
                  : currentIndex;
              setCurrentIndex(newIndex);
              navigation.setParams({files: newFiles});
            }
          } catch (error) {
            hideLoading();
            showError('Không thể xóa file');
          }
        },
      },
    ]);
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < files.length) {
      setCurrentIndex(index);
    }
  };

  const renderFileItem = ({item}: {item: UploadedFile}) => {
    const fileUri =
      Platform.OS === 'android' ? `file://${item.storedPath}` : item.storedPath;

    return (
      <View style={styles.fileContainer}>
        <Image
          source={{uri: fileUri}}
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.headerButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {currentIndex + 1} / {files.length}
        </Text>

        <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
          <Text style={styles.headerButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* File Viewer */}
      <FlatList
        ref={flatListRef}
        data={files}
        renderItem={renderFileItem}
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

      {/* Footer - File Info */}
      <View style={styles.footer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tên file:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {currentFile.fileName}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Kích thước:</Text>
          <Text style={styles.infoValue}>
            {FileUploadService.formatFileSize(currentFile.fileSize)}
          </Text>
        </View>
        {currentFile.width && currentFile.height && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Độ phân giải:</Text>
            <Text style={styles.infoValue}>
              {currentFile.width} × {currentFile.height}
            </Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Đường dẫn:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {currentFile.storedPath}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ngày upload:</Text>
          <Text style={styles.infoValue}>
            {formatDate(currentFile.uploadedAt)}
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
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
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
  fileContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 250,
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
    marginRight: 8,
  },
  infoValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
});

export default FileViewerScreen;
