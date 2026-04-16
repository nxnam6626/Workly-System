import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
  ActivityIndicator, RefreshControl, Modal, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface ProfileData {
  userId: string;
  email: string;
  phoneNumber: string | null;
  avatar: string | null;
  candidate?: {
    candidateId: string;
    fullName: string;
    university: string | null;
    major: string | null;
    gpa: number | null;
    isOpenToWork: boolean;
    skills: { skillName: string; level: string }[];
    cvs: {
      cvId: string;
      cvTitle: string;
      fileUrl: string;
      isMain: boolean;
      createdAt: string;
      parsedData: any;
    }[];
  };
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [parsedCvData, setParsedCvData] = useState<any>(null);

  const isAdmin = user?.roles?.includes('ADMIN') || !!user?.admin;

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/users/me');
      setProfile(data);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải thông tin cá nhân');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  const toggleOpenToWork = async () => {
    if (!profile?.candidate) return;
    const currentStatus = profile.candidate.isOpenToWork;
    
    // Optimistic un-update
    setProfile(prev => prev ? {
      ...prev,
      candidate: { ...prev.candidate!, isOpenToWork: !currentStatus }
    } : prev);

    try {
      await api.patch('/users/me/profile', {
        isOpenToWork: !currentStatus,
        fullName: profile.candidate.fullName,
        phone: profile.phoneNumber || '',
      });
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
      // Revert on error
      setProfile(prev => prev ? {
        ...prev,
        candidate: { ...prev.candidate!, isOpenToWork: currentStatus }
      } : prev);
    }
  };

  const handleAvatarSelect = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    setUpdatingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      // Sẽ gọi qua Backend có validation AI
      const { data } = await api.patch('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      updateUser({ avatar: data.avatarUrl });
      fetchProfile();
      Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công');
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể cập nhật ảnh đại diện. Vui lòng đảm bảo ảnh có chứa chân dung gốc, không vi phạm quy định.');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleCvUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        uploadCv(result.assets[0]);
      }
    } catch (error) {
      console.log('Document picker err', error);
    }
  };

  const uploadCv = async (fileAsset: any) => {
    setUploadingCv(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: fileAsset.uri,
        type: fileAsset.mimeType || 'application/pdf',
        name: fileAsset.name || 'cv.pdf',
      } as any);

      const { data } = await api.post('/candidates/cv/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setParsedCvData(data.parsedData);
      setReviewModalVisible(true);
      fetchProfile(); // Refresh list background
    } catch (e: any) {
      Alert.alert('Lỗi AI Bóc Tách', e.response?.data?.message || 'Không thể upload và phân tích CV. Vui lòng thử file PDF khác.');
    } finally {
      setUploadingCv(false);
    }
  };

  const handleDeleteCv = async (cvId: string) => {
    Alert.alert('Xóa CV', 'Bạn có chắc chắn muốn xóa CV này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/candidates/cv/${cvId}`);
          fetchProfile();
          Alert.alert('Thành công', 'Đã xóa CV');
        } catch {
          Alert.alert('Lỗi', 'Không thể xóa CV');
        }
      }}
    ]);
  };

  const handleSetMainCv = async (cvId: string) => {
    try {
      await api.patch(`/candidates/cv/${cvId}/set-main`);
      fetchProfile();
    } catch {
      Alert.alert('Lỗi', 'Không thể thiết lập CV mặc định');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bgDark, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  const candidate = profile?.candidate;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Avatar + Main Info */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={handleAvatarSelect} activeOpacity={0.8}>
            <View style={styles.avatarWrap}>
              {profile?.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {candidate?.fullName?.slice(0, 2).toUpperCase() || profile?.email?.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              {updatingAvatar ? (
                <View style={[StyleSheet.absoluteFill, styles.avatarOverlay]}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : (
                <View style={styles.avatarBadge}>
                  <Ionicons name="camera" size={12} color="#fff" />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{candidate?.fullName || 'Ứng viên'}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
          <Text style={styles.major}>{candidate?.major || 'Chưa cập nhật chuyên ngành'}</Text>

          {/* Toggle Sẵn sàng làm việc */}
          {candidate && !isAdmin && (
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleTitle}>Sẵn sàng làm việc</Text>
                <Text style={[styles.toggleSubtitle, { color: candidate.isOpenToWork ? COLORS.urgent : COLORS.textMuted }]}>
                  {candidate.isOpenToWork ? 'Đang bật tìm việc' : 'Đang ẩn thông tin'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.toggleBtn, candidate.isOpenToWork ? styles.toggleBtnOn : styles.toggleBtnOff]}
                onPress={toggleOpenToWork}
                activeOpacity={0.8}
              >
                <View style={[styles.toggleKnob, candidate.isOpenToWork ? styles.toggleKnobOn : styles.toggleKnobOff]} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {!isAdmin && candidate && (
          <>
            {/* Học vấn & Kỹ năng */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Học vấn & Kỹ năng</Text>
              </View>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="school-outline" size={18} color={COLORS.textMuted} style={styles.infoIcon} />
                  <View>
                    <Text style={styles.infoTitle}>{candidate.university || 'Chưa cập nhật trường học'}</Text>
                    {candidate.gpa && <Text style={styles.infoSubtitle}>GPA: {candidate.gpa}/4.0</Text>}
                  </View>
                </View>
                {candidate.skills && candidate.skills.length > 0 && (
                  <View style={styles.skillsWrap}>
                    {candidate.skills.slice(0, 10).map((s, i) => (
                      <View key={i} style={styles.skillPill}>
                        <Text style={styles.skillText}>{s.skillName}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Quản lý CV */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quản lý CV</Text>
              
              {/* Nút Tải mới */}
              <TouchableOpacity style={styles.uploadBtn} onPress={handleCvUpload} disabled={uploadingCv}>
                {uploadingCv ? (
                  <ActivityIndicator color={COLORS.primary} size="small" />
                ) : (
                  <>
                    <View style={styles.uploadIconWrap}>
                      <Ionicons name="cloud-upload-outline" size={24} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.uploadTitle}>Tải lên CV (PDF)</Text>
                      <Text style={styles.uploadSubtitle}>Hệ thống AI sẽ tự động phân tích CV</Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>

              {/* Danh sách CV */}
              {(candidate.cvs || []).map((cv) => (
                <View key={cv.cvId} style={styles.cvCard}>
                  <View style={styles.cvInfo}>
                    <Ionicons name="document-text" size={24} color={COLORS.textMuted} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cvTitle} numberOfLines={1}>{cv.cvTitle}</Text>
                      <Text style={styles.cvDate}>{new Date(cv.createdAt).toLocaleDateString('vi-VN')}</Text>
                    </View>
                    {cv.isMain && (
                      <View style={styles.mainBadge}>
                        <Text style={styles.mainBadgeText}>Mặc định</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cvActions}>
                    {!cv.isMain && (
                      <TouchableOpacity style={styles.cvBtn} onPress={() => handleSetMainCv(cv.cvId)}>
                        <Text style={[styles.cvBtnText, { color: COLORS.primary }]}>Đặt mặc định</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.cvBtnDanger} onPress={() => handleDeleteCv(cv.cvId)}>
                      <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt tài khoản</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={[styles.menuIcon, styles.menuIconDanger]}>
              <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
            </View>
            <Text style={[styles.menuLabel, { color: COLORS.error }]}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Workly Mobile v1.0.0</Text>
      </ScrollView>

      {/* Review CV Modal */}
      <Modal visible={reviewModalVisible} animationType="slide" presentationStyle="pageSheet" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Bóc Tách CV</Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.alertBox}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.alertText}>AI đã phân tích thành công CV của bạn. Thông tin này sẽ giúp nhà tuyển dụng tìm thấy bạn dễ hơn!</Text>
              </View>

              {parsedCvData?.skills?.length > 0 && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewSectionTitle}>Kỹ năng đúc kết ({parsedCvData.skills.length})</Text>
                  <View style={styles.skillsWrap}>
                    {parsedCvData.skills.map((s: any, i: number) => (
                      <View key={i} style={styles.skillPill}>
                        <Text style={styles.skillText}>{s.skillName}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {parsedCvData?.education?.length > 0 && (
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewSectionTitle}>Học vấn</Text>
                  {parsedCvData.education.map((edu: any, i: number) => (
                    <Text key={i} style={styles.reviewListText}>• {edu.institution} ({edu.major})</Text>
                  ))}
                </View>
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.confirmBtn} onPress={() => setReviewModalVisible(false)}>
                <Text style={styles.confirmBtnText}>Hoàn tất</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  profileCard: { alignItems: 'center', paddingVertical: SPACING.xl, paddingHorizontal: SPACING.md },
  avatarWrap: { position: 'relative', marginBottom: SPACING.md },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: COLORS.cardDark },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
    borderWidth: 3, borderColor: COLORS.cardDark,
  },
  avatarOverlay: { borderRadius: 48, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  avatarBadge: {
    position: 'absolute', bottom: 2, right: 2, zIndex: 10,
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.bgDark,
  },
  name: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  email: { fontSize: 15, color: COLORS.textMuted, marginBottom: 2 },
  major: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', backgroundColor: COLORS.cardDark, padding: SPACING.lg, borderRadius: RADIUS.xl,
    marginTop: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)'
  },
  toggleTitle: { fontSize: 15, color: '#fff', fontWeight: '700', marginBottom: 4 },
  toggleSubtitle: { fontSize: 13, fontWeight: '600' },
  toggleBtn: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 2 },
  toggleBtnOn: { backgroundColor: COLORS.urgent },
  toggleBtnOff: { backgroundColor: 'rgba(255,255,255,0.2)' },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  toggleKnobOn: { alignSelf: 'flex-end' },
  toggleKnobOff: { alignSelf: 'flex-start' },

  section: { marginHorizontal: SPACING.md, marginBottom: SPACING.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  
  infoCard: { backgroundColor: COLORS.cardDark, borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SPACING.sm },
  infoIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', textAlign: 'center', lineHeight: 32 },
  infoTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  infoSubtitle: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACING.sm },
  skillPill: { backgroundColor: 'rgba(30,90,255,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(30,90,255,0.2)' },
  skillText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(30,90,255,0.08)', borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(30,90,255,0.2)', marginBottom: SPACING.md, borderStyle: 'dashed'
  },
  uploadTitle: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  uploadSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  uploadIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(30,90,255,0.1)', justifyContent: 'center', alignItems: 'center' },

  cvCard: { backgroundColor: COLORS.cardDark, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cvInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  cvTitle: { fontSize: 14, color: '#fff', fontWeight: '600', marginBottom: 2 },
  cvDate: { fontSize: 12, color: COLORS.textMuted },
  mainBadge: { backgroundColor: 'rgba(34,197,94,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.sm, marginLeft: 8 },
  mainBadgeText: { color: COLORS.success, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  cvActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 },
  cvBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.05)' },
  cvBtnText: { fontSize: 12, fontWeight: '600' },
  cvBtnDanger: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)', justifyContent: 'center', alignItems: 'center' },

  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.cardDark, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  menuIconDanger: { backgroundColor: 'rgba(239,68,68,0.1)' },
  menuLabel: { flex: 1, fontSize: 15, color: '#fff', fontWeight: '600' },
  version: { textAlign: 'center', color: COLORS.textMuted, fontSize: 12, paddingVertical: SPACING.xl },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.bgDark, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  modalTitle: { fontSize: 18, color: '#fff', fontWeight: '800' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  modalBody: { padding: SPACING.md },
  alertBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)', padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.lg },
  alertText: { flex: 1, color: COLORS.success, fontSize: 13, lineHeight: 20 },
  reviewSection: { marginBottom: SPACING.lg, padding: SPACING.md, backgroundColor: COLORS.cardDark, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  reviewSectionTitle: { fontSize: 14, color: '#fff', fontWeight: '700', marginBottom: SPACING.md },
  reviewListText: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 8, lineHeight: 20 },
  modalFooter: { padding: SPACING.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  confirmBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: RADIUS.lg, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
