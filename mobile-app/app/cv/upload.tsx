import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { WebView } from 'react-native-webview';
import api from '../../lib/api';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';
import { useAuthStore } from '../../stores/auth';

export default function UploadCVScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // validate size (max 5MB)
        if (result.assets[0].size && result.assets[0].size > 5 * 1024 * 1024) {
          Alert.alert('Lỗi', 'File PDF không được vượt quá 5MB');
          return;
        }
        setFile(result.assets[0]);
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể chọn file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name || 'cv.pdf',
        type: file.mimeType || 'application/pdf',
      } as any);

      // We send it to backend
      const { data } = await api.post('/cv/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Thành công', 'Đã tải lên CV của bạn', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Lỗi Tải lên', 'Máy chủ xử lý thất bại');
    } finally {
      setUploading(false);
    }
  };

  const viewCurrentCV = async () => {
    try {
      const { data } = await api.get('/cv/my-cv');
      if (data.url) {
        setPreviewUrl(data.url);
      } else {
        Alert.alert('Thông báo', 'Bạn chưa tải lên CV nào');
      }
    } catch {
      Alert.alert('Thông báo', 'Bạn chưa tải lên CV nào');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý CV</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={24} color={COLORS.success} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Bảo mật dữ liệu</Text>
            <Text style={styles.infoDesc}>CV của bạn được số hóa và bảo mật bởi AI. Chỉ những nhà tuyển dụng bạn ứng tuyển trực tiếp mới có thể xem CV gốc.</Text>
          </View>
        </View>

        <View style={styles.uploadCard}>
          {file ? (
            <View style={{ alignItems: 'center', gap: 12 }}>
              <Ionicons name="document-text" size={56} color={COLORS.primary} />
              <Text style={styles.fileName}>{file.name}</Text>
              <Text style={styles.fileSize}>{(file.size! / 1024 / 1024).toFixed(2)} MB</Text>
              
              <TouchableOpacity style={styles.repickBtn} onPress={pickDocument}>
                <Text style={styles.repickText}>Chọn file khác</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadArea} onPress={pickDocument}>
              <View style={styles.iconWrap}>
                <Ionicons name="cloud-upload" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.uploadTitle}>Tải lên CV (PDF)</Text>
              <Text style={styles.uploadSub}>Dung lượng tối đa 5MB</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Actions */}
        <View style={{ gap: SPACING.md, marginTop: SPACING.xl, paddingHorizontal: SPACING.md }}>
          <TouchableOpacity
            style={[styles.btn, (!file || uploading) && styles.btnDisabled]}
            disabled={!file || uploading}
            onPress={handleUpload}
          >
            {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Cập nhật CV Mới</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.outlineBtn} onPress={viewCurrentCV}>
            <Ionicons name="eye-outline" size={18} color="#fff" />
            <Text style={styles.outlineBtnText}>Xem CV Hiện Tại</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Preview Modal */}
      <Modal visible={!!previewUrl} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Preview CV</Text>
            <TouchableOpacity onPress={() => setPreviewUrl(null)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {previewUrl && (
            <WebView
              source={{ uri: previewUrl }}
              style={{ flex: 1, backgroundColor: '#f0f0f0' }}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { flex: 1, paddingVertical: SPACING.lg },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    marginHorizontal: SPACING.md, marginBottom: SPACING.xl,
    backgroundColor: 'rgba(34,197,94,0.1)', padding: SPACING.md, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
  },
  infoTitle: { color: COLORS.success, fontWeight: '700', fontSize: 14, marginBottom: 4 },
  infoDesc: { color: COLORS.textMuted, fontSize: 13, lineHeight: 20 },
  uploadCard: { marginHorizontal: SPACING.md },
  uploadArea: {
    height: 220, backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.xl, borderWidth: 2, borderColor: 'rgba(30,90,255,0.3)', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', gap: 10,
  },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(30,90,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  uploadTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  uploadSub: { fontSize: 13, color: COLORS.textMuted },
  fileName: { fontSize: 16, color: '#fff', fontWeight: '600', textAlign: 'center', marginTop: 12 },
  fileSize: { fontSize: 13, color: COLORS.textMuted },
  repickBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.1)' },
  repickText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  btn: {
    height: 54, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  outlineBtn: {
    height: 54, backgroundColor: 'transparent', borderRadius: RADIUS.lg,
    justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  outlineBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  closeBtn: { padding: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.full },
});
