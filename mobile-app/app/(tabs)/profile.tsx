import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { StatusBar } from 'expo-status-bar';

import api from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

// Extracted Components
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { CvCard } from '../../components/profile/CvCard';
import { CvUploadButton } from '../../components/profile/CvUploadButton';
import { MenuOption } from '../../components/profile/MenuOption';
import { Button } from '../../components/ui/Button';

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
    const performLogout = async () => {
      await logout();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      if (confirm('Bạn có chắc muốn đăng xuất?')) {
        performLogout();
      }
    } else {
      Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: performLogout,
        },
      ]);
    }
  };

  const toggleOpenToWork = async () => {
    if (!profile?.candidate) return;
    const currentStatus = profile.candidate.isOpenToWork;

    // Optimistic update
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            candidate: { ...prev.candidate!, isOpenToWork: !currentStatus },
          }
        : prev
    );

    try {
      await api.patch('/users/me/profile', {
        isOpenToWork: !currentStatus,
        fullName: profile.candidate.fullName,
        phone: profile.phoneNumber || '',
      });
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
      // Revert on error
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              candidate: { ...prev.candidate!, isOpenToWork: currentStatus },
            }
          : prev
      );
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

      const { data } = await api.patch('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      updateUser({ avatar: data.avatarUrl });
      fetchProfile();
      Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công');
    } catch (e: any) {
      Alert.alert(
        'Lỗi',
        e.response?.data?.message ||
          'Không thể cập nhật ảnh đại diện. Vui lòng đảm bảo ảnh rõ khuôn mặt.'
      );
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleCvUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
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
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setParsedCvData(data.parsedData);
      setReviewModalVisible(true);
      fetchProfile();
    } catch (e: any) {
      Alert.alert(
        'Lỗi AI',
        e.response?.data?.message || 'Không thể upload CV. Vui lòng thử lại.'
      );
    } finally {
      setUploadingCv(false);
    }
  };

  const handleDeleteCv = async (cvId: string) => {
    Alert.alert('Xóa CV', 'Bạn có chắc chắn muốn xóa CV này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/candidates/cv/${cvId}`);
            fetchProfile();
            Alert.alert('Thành công', 'Đã xóa CV');
          } catch {
            Alert.alert('Lỗi', 'Không thể xóa CV');
          }
        },
      },
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
      <View style={styles.centerContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  const candidate = profile?.candidate;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header Section */}
        <ProfileHeader
          name={candidate?.fullName || 'Người dùng Workly'}
          email={profile?.email || ''}
          major={candidate?.major || undefined}
          avatar={profile?.avatar || null}
          isOpenToWork={candidate?.isOpenToWork || false}
          updatingAvatar={updatingAvatar}
          onAvatarPress={handleAvatarSelect}
          onToggleOpenToWork={toggleOpenToWork}
        />

        {/* Education & Skills */}
        {!isAdmin && candidate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Học vấn & Kỹ năng</Text>
            <View style={styles.contentCard}>
              <View style={styles.eduRow}>
                <View style={styles.iconBox}>
                  <Ionicons name="school-outline" size={20} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eduTitle}>
                    {candidate.university || 'Chưa cập nhật trường học'}
                  </Text>
                  {candidate.gpa && <Text style={styles.eduSubtitle}>GPA: {candidate.gpa}/4.0</Text>}
                </View>
              </View>

              {candidate.skills && candidate.skills.length > 0 && (
                <View style={styles.skillsList}>
                  {candidate.skills.slice(0, 10).map((s, i) => (
                    <View key={i} style={styles.skillPill}>
                      <Text style={styles.skillText}>{s.skillName}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* CV Management */}
        {!isAdmin && candidate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quản lý CV</Text>
            <CvUploadButton onPress={handleCvUpload} loading={uploadingCv} />

            {(candidate.cvs || []).map((cv) => (
              <CvCard
                key={cv.cvId}
                cvId={cv.cvId}
                title={cv.cvTitle}
                date={new Date(cv.createdAt).toLocaleDateString('vi-VN')}
                isMain={cv.isMain}
                onDelete={() => handleDeleteCv(cv.cvId)}
                onSetMain={() => handleSetMainCv(cv.cvId)}
              />
            ))}
          </View>
        )}

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt & Hỗ trợ</Text>
          <View style={styles.menuCard}>
            {!user?.isEmailVerified && (
              <MenuOption
                label="Xác minh Email"
                icon="shield-checkmark-outline"
                backgroundColor="#FFF9DB"
                color="#856404"
                badge="Cần xác thực"
                onPress={() =>
                  router.push({ pathname: '/(auth)/verify-email', params: { email: profile?.email } })
                }
              />
            )}
            <MenuOption
              label="Thông báo"
              icon="notifications-outline"
              onPress={() => router.push('/(tabs)/notifications')}
            />
            <MenuOption
              label="Hỗ trợ & Phản hồi"
              icon="chatbubble-ellipses-outline"
              onPress={() => router.push('/(tabs)/support')}
            />
            <MenuOption
              label="Điều khoản sử dụng"
              icon="document-lock-outline"
              onPress={() => {}}
            />
            <MenuOption
              label="Đăng xuất"
              icon="log-out-outline"
              color={COLORS.error}
              backgroundColor="#FFF5F5"
              onPress={handleLogout}
              showChevron={false}
            />
          </View>
        </View>

        <Text style={styles.version}>Workly App v1.2.0 • AI Powered</Text>
      </ScrollView>

      {/* AI CV Extraction Modal */}
      <Modal visible={reviewModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Phân tích hồ sơ AI</Text>
              <TouchableOpacity
                onPress={() => setReviewModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.aiAlert}>
                <Ionicons name="sparkles" size={20} color={COLORS.primary} />
                <Text style={styles.aiAlertText}>
                  AI đã tự động bóc tách thông tin từ CV của bạn và cập nhật vào hệ thống.
                </Text>
              </View>

              {parsedCvData?.skills?.length > 0 && (
                <View style={styles.reviewGroup}>
                  <Text style={styles.reviewLabel}>Kỹ năng đúc kết</Text>
                  <View style={styles.skillsList}>
                    {parsedCvData.skills.map((s: any, i: number) => (
                      <View key={i} style={styles.skillPill}>
                        <Text style={styles.skillText}>{s.skillName}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {parsedCvData?.education?.length > 0 && (
                <View style={styles.reviewGroup}>
                  <Text style={styles.reviewLabel}>Học vấn</Text>
                  {parsedCvData.education.map((edu: any, i: number) => (
                    <View key={i} style={styles.reviewItem}>
                       <Ionicons name="school" size={16} color={COLORS.textMuted} />
                       <Text style={styles.reviewText}>{edu.institution} - {edu.major}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Đã hiểu" onPress={() => setReviewModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  section: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 4,
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  eduRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(25, 103, 210, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eduTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  eduSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillPill: {
    backgroundColor: 'rgba(25, 103, 210, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(25, 103, 210, 0.1)',
  },
  skillText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  version: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 12,
    paddingVertical: SPACING.xl,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: SPACING.md,
  },
  aiAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(25, 103, 210, 0.05)',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  aiAlertText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.primary,
    lineHeight: 20,
    fontWeight: '600',
  },
  reviewGroup: {
    marginBottom: SPACING.xl,
  },
  reviewLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  modalFooter: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
});
