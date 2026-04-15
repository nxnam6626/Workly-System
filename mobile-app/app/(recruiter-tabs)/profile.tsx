import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
  ActivityIndicator, RefreshControl, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface CompanyData {
  companyId: string;
  companyName: string;
  taxCode: string | null;
  verifyStatus: number;
  logoUrl: string | null;
  bannerUrl: string | null;
  websiteUrl: string | null;
}

const MenuItem = ({ icon, label, onPress, danger }: { icon: string; label: string; onPress: () => void; danger?: boolean }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
      <Ionicons name={icon as any} size={20} color={danger ? COLORS.error : '#fff'} />
    </View>
    <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
    <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
  </TouchableOpacity>
);

export default function RecruiterProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const fetchCompany = useCallback(async () => {
    try {
      const { data } = await api.get('/companies/my-company');
      setCompany(data);
    } catch {
      // Could be no company attached yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCompany();
    setRefreshing(false);
  }, [fetchCompany]);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  const pickImage = async (type: 'logo' | 'banner') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadMedia(result.assets[0].uri, type);
    }
  };

  const uploadMedia = async (uri: string, type: 'logo' | 'banner') => {
    if (type === 'logo') setUploadingLogo(true);
    else setUploadingBanner(true);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        type: 'image/jpeg',
        name: `${type}.jpg`,
      } as any);

      await api.patch(`/companies/my-company/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchCompany();
      Alert.alert('Thành công', `Cập nhật ${type} thành công`);
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || `Không thể cập nhật ${type}`);
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingBanner(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bgDark, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Banner */}
        <View style={styles.bannerWrap}>
          {company?.bannerUrl ? (
            <Image source={{ uri: company.bannerUrl }} style={styles.bannerImage} />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Ionicons name="image-outline" size={32} color={COLORS.textMuted} />
            </View>
          )}
          <TouchableOpacity 
            style={styles.editBannerBtn} 
            onPress={() => pickImage('banner')}
            disabled={uploadingBanner}
          >
            {uploadingBanner ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={16} color="#fff" />}
          </TouchableOpacity>
        </View>

        {/* Info Area */}
        <View style={styles.infoArea}>
          {/* Logo */}
          <TouchableOpacity 
            style={styles.logoWrap} 
            onPress={() => pickImage('logo')}
            disabled={uploadingLogo}
            activeOpacity={0.8}
          >
            {company?.logoUrl ? (
              <Image source={{ uri: company.logoUrl }} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoPlaceholderText}>
                  {company?.companyName?.slice(0, 2).toUpperCase() || 'C'}
                </Text>
              </View>
            )}
            <View style={styles.editLogoBadge}>
              {uploadingLogo ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={12} color="#fff" />}
            </View>
          </TouchableOpacity>

          {/* Texts */}
          <Text style={styles.companyName}>{company?.companyName || 'Chưa cập nhật tên công ty'}</Text>
          
          {company?.verifyStatus === 1 ? (
             <View style={styles.verifiedBadge}>
               <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
               <Text style={styles.verifiedText}>Đã xác thực VietQR</Text>
             </View>
          ) : (
             <View style={[styles.verifiedBadge, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
               <Ionicons name="warning-outline" size={14} color="#f59e0b" />
               <Text style={[styles.verifiedText, { color: '#f59e0b' }]}>Chưa xác thực thuế</Text>
             </View>
          )}

          <Text style={styles.userEmail}>Quản lý bởi: {user?.email}</Text>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quản lý Công ty</Text>
          <MenuItem icon="business-outline" label="Chỉnh sửa thông tin" onPress={() => Alert.alert('Thông báo', 'Đang cập nhật luồng edit trực tiếp trên mobile')} />
          {company?.taxCode ? (
            <MenuItem icon="receipt-outline" label={`Mã số thuế: ${company.taxCode}`} onPress={() => {}} />
          ) : null}
          {company?.websiteUrl ? (
            <MenuItem icon="globe-outline" label={company.websiteUrl} onPress={() => {}} />
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản Của Bạn</Text>
          <MenuItem icon="lock-closed-outline" label="Đổi mật khẩu" onPress={() => {}} />
          <MenuItem icon="help-circle-outline" label="Lịch sử giao dịch (Wallet)" onPress={() => router.push('/(recruiter-tabs)/wallet')} />
          <MenuItem icon="log-out-outline" label="Đăng xuất" onPress={handleLogout} danger />
        </View>

        <Text style={styles.version}>Workly Recruiter v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  bannerWrap: { position: 'relative', width: '100%', height: 160, backgroundColor: 'rgba(255,255,255,0.02)' },
  bannerImage: { width: '100%', height: '100%', opacity: 0.8 },
  bannerPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  editBannerBtn: {
    position: 'absolute', top: SPACING.md, right: SPACING.md, zIndex: 10,
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
  },

  infoArea: { alignItems: 'center', paddingHorizontal: SPACING.md, marginTop: -40, marginBottom: SPACING.xl },
  logoWrap: { position: 'relative', zIndex: 20 },
  logoImage: { width: 88, height: 88, borderRadius: RADIUS.xl, borderWidth: 4, borderColor: COLORS.bgDark, backgroundColor: COLORS.cardDark },
  logoPlaceholder: {
    width: 88, height: 88, borderRadius: RADIUS.xl, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: COLORS.bgDark
  },
  logoPlaceholderText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  editLogoBadge: {
    position: 'absolute', bottom: -4, right: -4, zIndex: 30,
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.bgDark
  },

  companyName: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: SPACING.md, textAlign: 'center' },
  userEmail: { fontSize: 13, color: COLORS.textMuted, marginTop: 12 },
  
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(34,197,94,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.full, marginTop: 8 },
  verifiedText: { color: COLORS.success, fontSize: 12, fontWeight: '700' },

  section: { marginHorizontal: SPACING.md, marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.cardDark, padding: SPACING.md,
    borderRadius: RADIUS.lg, marginBottom: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  menuIconDanger: { backgroundColor: 'rgba(239,68,68,0.1)' },
  menuLabel: { flex: 1, fontSize: 14, color: '#fff', fontWeight: '500' },
  menuLabelDanger: { color: COLORS.error },
  version: { textAlign: 'center', color: COLORS.textMuted, fontSize: 12, paddingVertical: SPACING.lg },
});
