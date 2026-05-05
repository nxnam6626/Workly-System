import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth';
import { COLORS, SPACING } from '../../lib/constants';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { IS_RECRUITER_APP } from '../../lib/config';

type Role = 'CANDIDATE' | 'RECRUITER';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [role, setRole] = useState<Role>(IS_RECRUITER_APP ? 'RECRUITER' : 'CANDIDATE');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu tối thiểu 6 ký tự');
      return;
    }
    if (!agreed) {
      Alert.alert('Lỗi', 'Vui lòng đồng ý với điều khoản sử dụng');
      return;
    }
    setLoading(true);
    try {
      await register({ name, email: email.trim(), password, role });
      
      // Redirect based on role
      if (role === 'RECRUITER') {
        router.replace('/(recruiter-tabs)' as any);
      } else {
        router.replace('/(tabs)' as any);
      }
    } catch (e: any) {
      Alert.alert('Đăng ký thất bại', e?.response?.data?.message || 'Có lỗi xảy ra, thử lại sau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header - Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons 
              name={IS_RECRUITER_APP ? "business-outline" : "people-outline"} 
              size={50} 
              color={COLORS.primary} 
            />
            <Text style={styles.brandName}>Work<Text style={{color: COLORS.text}}>ly</Text></Text>
            <Text style={styles.tagline}>
              {IS_RECRUITER_APP ? 'Recruiter Dashboard' : 'Smart Recruitment Platform'}
            </Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Đăng ký tài khoản {IS_RECRUITER_APP ? 'Nhà tuyển dụng' : 'Ứng viên'}</Text>

          {/* Social Logins */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialCircle}>
              <Ionicons name="logo-facebook" size={32} color={COLORS.facebook} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialCircle}>
              <Ionicons name="logo-google" size={30} color={COLORS.google} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputs}>
            {/* Role Selector hidden - auto assigned by app variant */}

            <Input
              placeholder="Họ và tên"
              icon="person-outline"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <Input
              placeholder="Nhập địa chỉ email"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Input
              placeholder="Nhập lại mật khẩu"
              icon="lock-closed-outline"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.agreementRow}>
            <TouchableOpacity
              style={[styles.checkbox, agreed && styles.checkboxChecked]}
              onPress={() => setAgreed(!agreed)}
            >
              {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
            </TouchableOpacity>
            <Text style={styles.agreementText}>
              Tôi đồng ý với <Text style={styles.linkText}>Quy chế hoạt động</Text> và các <Text style={styles.linkText}>Điều khoản, Chính sách</Text> của Workly
            </Text>
          </View>

          <Button
            title="Đăng ký"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerBtn}
          />

          <Button
            title="Trải nghiệm không cần đăng ký"
            variant="ghost"
            textStyle={styles.guestText}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Bạn đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, paddingBottom: SPACING.xl },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: SPACING.lg,
  },
  logoContainer: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 8,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  formContainer: {
    paddingHorizontal: SPACING.xl,
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  socialCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputs: {
    marginBottom: SPACING.sm,
  },
  roleRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  roleBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#fff',
  },

  agreementRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
    paddingRight: SPACING.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  agreementText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  registerBtn: {
    // Standard state
  },
  guestText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
