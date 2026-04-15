import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

type Role = 'CANDIDATE' | 'RECRUITER';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [role, setRole] = useState<Role>('CANDIDATE');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu tối thiểu 6 ký tự');
      return;
    }
    setLoading(true);
    try {
      await register({ name, email: email.trim(), password, role });
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Đăng ký thất bại', e?.response?.data?.message || 'Có lỗi xảy ra, thử lại sau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.brand}>Tạo tài khoản</Text>
          <Text style={styles.tagline}>Bắt đầu hành trình sự nghiệp</Text>
        </View>

        <View style={styles.card}>
          {/* Role Selector */}
          <Text style={styles.label}>Bạn là</Text>
          <View style={styles.roleRow}>
            {(['CANDIDATE', 'RECRUITER'] as Role[]).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                onPress={() => setRole(r)}
              >
                <Ionicons
                  name={r === 'CANDIDATE' ? 'person-outline' : 'business-outline'}
                  size={18}
                  color={role === r ? '#fff' : COLORS.textMuted}
                />
                <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                  {r === 'CANDIDATE' ? 'Ứng viên' : 'Nhà tuyển dụng'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Inputs */}
          {[
            { icon: 'person-outline', placeholder: 'Họ và tên', value: name, setter: setName, type: 'default' },
            { icon: 'mail-outline', placeholder: 'Email', value: email, setter: setEmail, type: 'email-address' },
            { icon: 'lock-closed-outline', placeholder: 'Mật khẩu (tối thiểu 6 ký tự)', value: password, setter: setPassword, type: 'default', secure: true },
          ].map((field) => (
            <View key={field.placeholder} style={styles.inputWrap}>
              <Ionicons name={field.icon as any} size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={field.placeholder}
                placeholderTextColor={COLORS.textMuted}
                keyboardType={field.type as any}
                autoCapitalize={field.type === 'email-address' ? 'none' : 'words'}
                secureTextEntry={field.secure}
                value={field.value}
                onChangeText={field.setter}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Đăng ký</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginBtn} onPress={() => router.back()}>
            <Text style={styles.loginText}>
              Đã có tài khoản? <Text style={styles.loginLink}>Đăng nhập</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  header: { paddingTop: 60, paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },
  backBtn: { width: 44, height: 44, justifyContent: 'center', marginBottom: SPACING.md },
  brand: { fontSize: 28, fontWeight: '800', color: '#fff' },
  tagline: { fontSize: 15, color: COLORS.textMuted, marginTop: 4 },
  card: {
    marginHorizontal: SPACING.md,
    backgroundColor: COLORS.cardDark,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  label: { color: COLORS.textMuted, fontSize: 13, marginBottom: SPACING.sm, fontWeight: '600' },
  roleRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  roleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 48, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)',
  },
  roleBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleText: { color: COLORS.textMuted, fontWeight: '600', fontSize: 14 },
  roleTextActive: { color: '#fff' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: SPACING.sm, height: 52,
  },
  inputIcon: { marginRight: SPACING.xs },
  input: { flex: 1, color: '#fff', fontSize: 15 },
  btn: {
    height: 52, backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center', marginTop: SPACING.sm,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginBtn: { alignItems: 'center', paddingVertical: SPACING.md },
  loginText: { color: COLORS.textMuted, fontSize: 14 },
  loginLink: { color: COLORS.primary, fontWeight: '700' },
});
