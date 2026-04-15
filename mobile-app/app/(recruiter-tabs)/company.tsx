import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, RefreshControl, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface CompanyData {
  companyName: string;
  taxCode: string;
  address: string;
  websiteUrl: string;
  companySize: number | null;
  description: string;
  logo: string | null;
  banner: string | null;
  verifyStatus: number;
}

const defaultForm: CompanyData = {
  companyName: '', taxCode: '', address: '', websiteUrl: '',
  companySize: null, description: '', logo: null, banner: null, verifyStatus: 0,
};

export default function CompanyProfileScreen() {
  const router = useRouter();
  const [form, setForm] = useState<CompanyData>(defaultForm);
  const [original, setOriginal] = useState<CompanyData>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCompany = useCallback(async () => {
    try {
      const { data } = await api.get('/companies/my-company');
      const d: CompanyData = {
        companyName: data.companyName || '',
        taxCode: data.taxCode || '',
        address: data.address || '',
        websiteUrl: data.websiteUrl || '',
        companySize: data.companySize || null,
        description: data.description || '',
        logo: data.logo || null,
        banner: data.banner || null,
        verifyStatus: data.verifyStatus || 0,
      };
      setForm(d); setOriginal(d);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải thông tin công ty');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompany(); }, [fetchCompany]);

  const onRefresh = async () => { setRefreshing(true); await fetchCompany(); setRefreshing(false); };

  const handleVerifyTax = async () => {
    if (!form.taxCode || !form.companyName) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập Tên công ty và Mã số thuế trước');
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch(`https://api.vietqr.io/v2/business/${form.taxCode}`);
      const data = await res.json();
      if (data.code === '00' && data.data) {
        const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const apiName = norm(data.data.name);
        const inputName = norm(form.companyName);
        if (apiName.includes(inputName) || inputName.includes(apiName)) {
          setForm(p => ({ ...p, verifyStatus: 1 }));
          Alert.alert('✅ Xác thực thành công', `Doanh nghiệp: ${data.data.name}`);
        } else {
          setForm(p => ({ ...p, verifyStatus: -1 }));
          Alert.alert('❌ Không khớp', `Tên đăng ký: ${data.data.name}`);
        }
      } else {
        setForm(p => ({ ...p, verifyStatus: -1 }));
        Alert.alert('Lỗi', 'Mã số thuế không tồn tại');
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể tra cứu mã số thuế');
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = { ...form };
      delete payload.banner;
      Object.keys(payload).forEach(k => { if (payload[k] === '' && k !== 'companyName') payload[k] = null; });
      await api.patch('/companies/my-company', payload);
      setOriginal(form);
      Alert.alert('✅ Thành công', 'Đã cập nhật thông tin công ty!');
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handlePickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền thư viện ảnh'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;

    setUploadingLogo(true);
    try {
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('file', { uri: asset.uri, type: 'image/jpeg', name: 'logo.jpg' } as any);
      const { data } = await api.patch('/companies/my-company/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(p => ({ ...p, logo: data.url }));
      setOriginal(p => ({ ...p, logo: data.url }));
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const isChanged = JSON.stringify(form) !== JSON.stringify(original);

  const verifyBadge = () => {
    if (form.verifyStatus === 1) return { label: '✓ Đã xác thực', bg: '#dcfce7', text: '#15803d' };
    if (form.verifyStatus === -1) return { label: '✗ Không hợp lệ', bg: '#fee2e2', text: '#dc2626' };
    return { label: '⚠ Chưa xác thực', bg: '#fef3c7', text: '#92400e' };
  };
  const badge = verifyBadge();

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ Sơ Doanh Nghiệp</Text>
        {isChanged ? (
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Lưu</Text>}
          </TouchableOpacity>
        ) : <View style={{ width: 60 }} />}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING.md, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <TouchableOpacity onPress={handlePickLogo} style={styles.logoWrap}>
            {form.logo ? (
              <Image source={{ uri: form.logo }} style={{ width: 80, height: 80 }} contentFit="contain" />
            ) : (
              <Text style={styles.logoPlaceholder}>{form.companyName.charAt(0) || 'C'}</Text>
            )}
            {uploadingLogo ? (
              <View style={styles.logoOverlay}><ActivityIndicator color="#fff" /></View>
            ) : (
              <View style={styles.logoOverlay}><Ionicons name="camera" size={20} color="#fff" /></View>
            )}
          </TouchableOpacity>
          <View>
            <Text style={styles.logoHint}>Nhấn để đổi logo công ty</Text>
            <Text style={styles.logoSub}>Định dạng JPG, PNG (nên vuông)</Text>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông Tin Cơ Bản</Text>

          <Text style={styles.label}>Tên Công Ty <Text style={{ color: COLORS.error }}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={form.companyName}
            onChangeText={v => setForm(p => ({ ...p, companyName: v, verifyStatus: 0 }))}
            placeholder="Ví dụ: Công ty TNHH ABC"
            placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.label}>Mã Số Thuế</Text>
          <View style={styles.taxRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={form.taxCode}
              onChangeText={v => setForm(p => ({ ...p, taxCode: v, verifyStatus: 0 }))}
              placeholder="Nhập mã số thuế"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.verifyBtn, verifying && { opacity: 0.5 }]}
              onPress={handleVerifyTax}
              disabled={verifying}
            >
              {verifying ? <ActivityIndicator color={COLORS.primary} size="small" /> : <Text style={styles.verifyBtnText}>Kiểm tra</Text>}
            </TouchableOpacity>
          </View>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>

          <Text style={styles.label}>Địa Chỉ</Text>
          <TextInput
            style={styles.input}
            value={form.address}
            onChangeText={v => setForm(p => ({ ...p, address: v }))}
            placeholder="Địa chỉ trụ sở chính"
            placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.label}>Website URL</Text>
          <TextInput
            style={styles.input}
            value={form.websiteUrl}
            onChangeText={v => setForm(p => ({ ...p, websiteUrl: v }))}
            placeholder="https://example.com"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="url"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Quy Mô Nhân Sự</Text>
          <TextInput
            style={styles.input}
            value={form.companySize ? String(form.companySize) : ''}
            onChangeText={v => setForm(p => ({ ...p, companySize: v ? Number(v) : null }))}
            placeholder="Số lượng nhân viên"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô Tả Doanh Nghiệp</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={form.description}
            onChangeText={v => setForm(p => ({ ...p, description: v }))}
            placeholder="Giới thiệu về tầm nhìn, sứ mệnh, môi trường làm việc..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {isChanged && (
          <TouchableOpacity style={styles.saveBtnFull} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.saveBtnFullText}>Lưu Thay Đổi</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: RADIUS.full,
    backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  saveBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  logoSection: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.lg },
  logoWrap: {
    width: 80, height: 80, borderRadius: RADIUS.lg, backgroundColor: COLORS.text,
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.border,
  },
  logoPlaceholder: { fontSize: 28, fontWeight: '800', color: '#fff' },
  logoOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 28,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  logoHint: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  logoSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  section: {
    backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 4, marginTop: SPACING.sm },
  input: {
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14, color: COLORS.text, marginBottom: SPACING.sm,
  },
  textarea: { minHeight: 120, paddingTop: 12 },
  taxRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: SPACING.xs },
  verifyBtn: {
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: RADIUS.md,
    backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
  },
  verifyBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, alignSelf: 'flex-start', marginBottom: SPACING.sm },
  badgeText: { fontSize: 11, fontWeight: '700' },
  saveBtnFull: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingVertical: 16,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  saveBtnFullText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
