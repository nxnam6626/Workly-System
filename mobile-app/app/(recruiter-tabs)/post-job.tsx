import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { COLORS, SPACING, RADIUS, LOCATIONS } from '../../lib/constants';

const JOB_TYPES = ['FULLTIME', 'PARTTIME', 'INTERNSHIP'];
const JOB_TYPE_LABEL: Record<string, string> = {
  FULLTIME: 'Toàn thời gian',
  PARTTIME: 'Bán thời gian',
  INTERNSHIP: 'Thực tập',
};

const JOB_TIERS = [
  { value: 'BASIC', label: 'Cơ bản', desc: 'Hiển thị thường', color: COLORS.textMuted },
  { value: 'PROFESSIONAL', label: 'Chuyên nghiệp', desc: 'Ưu tiên hiển thị', color: COLORS.primary },
  { value: 'URGENT', label: 'Gấp', desc: 'Hiển thị hàng đầu', color: COLORS.error },
];

interface PickerRowProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}

function PickerRow({ label, options, value, onChange }: PickerRowProps) {
  return (
    <View style={pickerStyles.container}>
      <Text style={pickerStyles.label}>{label}</Text>
      <View style={pickerStyles.row}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[pickerStyles.chip, value === opt.value && pickerStyles.chipActive]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[pickerStyles.chipText, value === opt.value && pickerStyles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  container: { marginBottom: SPACING.md },
  label: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600', marginBottom: SPACING.xs },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: RADIUS.full, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: COLORS.cardDark,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: 'transparent' },
  chipText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
});

export default function PostJobScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    benefits: '',
    salaryMin: '',
    salaryMax: '',
    jobType: 'FULLTIME',
    locationCity: 'Hà Nội',
    experience: '',
    vacancies: '1',
    jobTier: 'BASIC',
  });

  const update = useCallback((key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!form.title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên vị trí tuyển dụng');
      return;
    }
    if (!form.description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả công việc');
      return;
    }

    setLoading(true);
    try {
      await api.post('/jobs', {
        title: form.title.trim(),
        description: form.description.trim(),
        requirements: form.requirements.trim(),
        benefits: form.benefits.trim(),
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        jobType: form.jobType,
        locationCity: form.locationCity,
        experience: form.experience.trim(),
        vacancies: Number(form.vacancies) || 1,
        jobTier: form.jobTier,
      });

      Alert.alert(
        '✅ Đăng tin thành công!',
        'Tin tuyển dụng đang chờ Admin duyệt. Bạn sẽ nhận thông báo khi được phê duyệt.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể đăng tin. Vui lòng thử lại.';
      Alert.alert('Lỗi', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setLoading(false);
    }
  }, [form, router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đăng tin tuyển dụng</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Basic info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Thông tin cơ bản</Text>

            <Text style={styles.fieldLabel}>Tên vị trí tuyển dụng *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Senior React Developer"
              placeholderTextColor={COLORS.textMuted}
              value={form.title}
              onChangeText={(v) => update('title', v)}
            />

            <Text style={styles.fieldLabel}>Mô tả công việc *</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Mô tả chi tiết công việc, trách nhiệm..."
              placeholderTextColor={COLORS.textMuted}
              value={form.description}
              onChangeText={(v) => update('description', v)}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Yêu cầu</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Kỹ năng, bằng cấp, kinh nghiệm yêu cầu..."
              placeholderTextColor={COLORS.textMuted}
              value={form.requirements}
              onChangeText={(v) => update('requirements', v)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Phúc lợi</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Lương tháng 13, bảo hiểm, team building..."
              placeholderTextColor={COLORS.textMuted}
              value={form.benefits}
              onChangeText={(v) => update('benefits', v)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Salary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Mức lương (VND)</Text>
            <View style={styles.salaryRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Từ</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 15000000"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={form.salaryMin}
                  onChangeText={(v) => update('salaryMin', v.replace(/\D/g, ''))}
                />
              </View>
              <Text style={[styles.fieldLabel, { alignSelf: 'center', marginTop: 16 }]}>—</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Đến</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 25000000"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={form.salaryMax}
                  onChangeText={(v) => update('salaryMax', v.replace(/\D/g, ''))}
                />
              </View>
            </View>
          </View>

          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Chi tiết</Text>

            <PickerRow
              label="Hình thức làm việc"
              options={JOB_TYPES.map((t) => ({ value: t, label: JOB_TYPE_LABEL[t] }))}
              value={form.jobType}
              onChange={(v) => update('jobType', v)}
            />

            <Text style={styles.fieldLabel}>Địa điểm</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {LOCATIONS.slice(0, 8).map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={[pickerStyles.chip, form.locationCity === loc && pickerStyles.chipActive]}
                    onPress={() => update('locationCity', loc)}
                  >
                    <Text style={[pickerStyles.chipText, form.locationCity === loc && pickerStyles.chipTextActive]}>
                      {loc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.fieldLabel}>Kinh nghiệm yêu cầu</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 2+ năm kinh nghiệm React"
              placeholderTextColor={COLORS.textMuted}
              value={form.experience}
              onChangeText={(v) => update('experience', v)}
            />

            <Text style={styles.fieldLabel}>Số lượng tuyển</Text>
            <TextInput
              style={[styles.input, { width: 100 }]}
              keyboardType="numeric"
              value={form.vacancies}
              onChangeText={(v) => update('vacancies', v.replace(/\D/g, ''))}
            />
          </View>

          {/* Job tier */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Loại tin đăng</Text>
            {JOB_TIERS.map((tier) => (
              <TouchableOpacity
                key={tier.value}
                style={[styles.tierCard, form.jobTier === tier.value && { borderColor: tier.color, borderWidth: 2 }]}
                onPress={() => update('jobTier', tier.value)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.tierLabel}>{tier.label}</Text>
                  <Text style={styles.tierDesc}>{tier.desc}</Text>
                </View>
                {form.jobTier === tier.value && <Ionicons name="checkmark-circle" size={20} color={tier.color} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.submitText}>Gửi tin tuyển dụng</Text>
                </>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff', flex: 1, textAlign: 'center' },
  content: { padding: SPACING.md, paddingBottom: 32 },
  section: {
    backgroundColor: COLORS.cardDark, borderRadius: RADIUS.xl, padding: SPACING.md,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: SPACING.md },
  fieldLabel: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 12, color: '#fff', fontSize: 15,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: SPACING.md,
  },
  textarea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  salaryRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  tierCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  tierLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
  tierDesc: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, height: 56,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    marginTop: SPACING.md,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
