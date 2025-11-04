import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Pdf from 'react-native-pdf';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useLoading} from '../context/LoadingContext';
import {useToast} from '../context/ToastContext';
import PDFService, {PDFDocument} from '../services/PDFService';

interface PDFViewerScreenProps {
  navigation: any;
  route: {
    params: {
      pdf: PDFDocument;
    };
  };
}

const PDFViewerScreen: React.FC<PDFViewerScreenProps> = ({
  navigation,
  route,
}) => {
  const {pdf} = route.params;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isChangingPage, setIsChangingPage] = useState(false);
  const insets = useSafeAreaInsets();
  const {showLoading, hideLoading} = useLoading();
  const {showError, showSuccess} = useToast();

  useEffect(() => {
    navigation.setOptions({
      title: pdf.title || 'PDF Viewer',
    });
  }, [pdf.title, navigation]);

  const handleLoadComplete = (numberOfPages: number) => {
    setTotalPages(numberOfPages);
    setIsLoading(false);
    hideLoading();
  };

  const handlePageChanged = (page: number) => {
    setCurrentPage(page);
  };

  const handleError = (error: any) => {
    console.error('PDF Error:', error);
    setError('Không thể tải PDF. Vui lòng thử lại.');
    setIsLoading(false);
    hideLoading();
    showError('Lỗi khi tải PDF');
  };

  const handleLoadProgress = (percent: number) => {
    setDownloadProgress(percent);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && !isChangingPage) {
      setIsChangingPage(true);
      setCurrentPage(page);
      // Reset after animation completes
      setTimeout(() => {
        setIsChangingPage(false);
      }, 300);
    }
  };

  const previousPage = () => {
    if (currentPage > 1 && !isChangingPage) {
      goToPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages && !isChangingPage) {
      goToPage(currentPage + 1);
    }
  };

  const source = pdf.isLocal && pdf.localPath
    ? {uri: pdf.localPath, cache: true}
    : {uri: pdf.url, cache: true};

  return (
    <View style={styles.container}>
      {/* Header with back button and page info */}
      <View style={[styles.header, {paddingTop: insets.top + 10}]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.title} numberOfLines={1}>
            {pdf.title}
          </Text>
          {totalPages > 0 && (
            <Text style={styles.pageInfo}>
              Trang {currentPage} / {totalPages}
            </Text>
          )}
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {/* PDF Viewer */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setIsLoading(true);
            }}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Pdf
            source={source}
            page={currentPage}
            onLoadComplete={handleLoadComplete}
            onPageChanged={handlePageChanged}
            onError={handleError}
            onLoadProgress={handleLoadProgress}
            style={styles.pdf}
            trustAllCerts={false}
            enablePaging={true}
            // Lazy loading settings
            renderActivityIndicator={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B5998" />
                {downloadProgress > 0 && downloadProgress < 100 && (
                  <Text style={styles.loadingText}>
                    Đang tải: {downloadProgress.toFixed(0)}%
                  </Text>
                )}
              </View>
            )}
            // Performance optimization for large files
            spacing={10}
            // Enable horizontal scrolling
            horizontal={false}
            // Cache settings
            cachePolicy="default"
          />

          {/* Navigation Controls */}
          {totalPages > 0 && (
            <View style={styles.controls}>
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  (currentPage === 1 || isChangingPage) && styles.controlButtonDisabled,
                ]}
                onPress={previousPage}
                disabled={currentPage === 1 || isChangingPage}>
                <Text
                  style={[
                    styles.controlButtonText,
                    (currentPage === 1 || isChangingPage) && styles.controlButtonTextDisabled,
                  ]}>
                  ← Trước
                </Text>
              </TouchableOpacity>

              <View style={styles.pageIndicator}>
                <Text style={styles.pageIndicatorText}>
                  {currentPage} / {totalPages}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.controlButton,
                  (currentPage === totalPages || isChangingPage) && styles.controlButtonDisabled,
                ]}
                onPress={nextPage}
                disabled={currentPage === totalPages || isChangingPage}>
                <Text
                  style={[
                    styles.controlButtonText,
                    (currentPage === totalPages || isChangingPage) &&
                      styles.controlButtonTextDisabled,
                  ]}>
                  Sau →
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  pageInfo: {
    fontSize: 13,
    color: '#E0E0E0',
  },
  headerSpacer: {
    width: 44,
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B5998',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  controlButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#3B5998',
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  controlButtonDisabled: {
    backgroundColor: '#DDD',
  },
  controlButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  controlButtonTextDisabled: {
    color: '#999',
  },
  pageIndicator: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  pageIndicatorText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
});

export default PDFViewerScreen;
