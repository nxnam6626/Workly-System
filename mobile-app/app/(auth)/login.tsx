import React, { useState } from 'react';
import { IS_RECRUITER_APP, APP_NAME } from '../../lib/config';
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
import { COLORS, SPACING, RADIUS } from '../../lib/constants';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }
    setLoading(true);
    try {
      const user = await login({ email: email.trim(), password });
      
      const isAdmin = !!(user?.roles?.includes('ADMIN') || user?.admin);
      const isRecruiter = !!(user?.recruiter || user?.roles?.includes('RECRUITER'));

      // Role check based on app variant
      if (IS_RECRUITER_APP) {
        if (!isRecruiter && !isAdmin) {
          throw new Error('Tài khoản này không có quyền truy cập vào ứng dụng Nhà tuyển dụng');
        }
        router.replace('/(recruiter-tabs)' as any);
      } else {
        // Candidate App
        if (isAdmin) {
          router.replace('/(admin)' as any);
        } else {
          router.replace('/(tabs)' as any);
        }
      }
    } catch (e: any) {
      let msg = 'Sai email hoặc mật khẩu';
      
      if (!e.response) {
        // Lỗi kết nối (Network Error)
        msg = `Không thể kết nối tới máy chủ.\n\nĐịa chỉ hiện tại: ${process.env.EXPO_PUBLIC_API_URL}\n\nHướng dẫn: Đảm bảo IP máy tính chính xác trong file .env và server đang chạy.`;
      } else if (e.message === 'Tài khoản này không có quyền truy cập vào ứng dụng Nhà tuyển dụng') {
        msg = e.message;
      } else if (e.response.data?.message) {
        msg = e.response.data.message;
      }
      
      Alert.alert('Đăng nhập thất bại', msg);
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
             <Ionicons name={IS_RECRUITER_APP ? "briefcase-outline" : "people-outline"} size={50} color={COLORS.primary} />
             <Text style={styles.brandName}>Work<Text style={{color: COLORS.text}}>ly</Text> {IS_RECRUITER_APP && <Text style={{fontSize: 20}}>(Recruit)</Text>}</Text>
             <Text style={styles.tagline}>{IS_RECRUITER_APP ? 'Dashboard Tuyển Dụng Thông Minh' : 'Smart Recruitment Platform'}</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Đăng nhập nhanh bằng</Text>
          
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
            <Input
              placeholder="Email"
              icon="person-outline"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              placeholder="Nhập mật khẩu"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <Button
            title="Đăng nhập"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginBtn}
          />



          <Button
            title="Trải nghiệm không cần đăng ký"
            variant="ghost"
            textStyle={styles.guestText}
          />

          <View style={styles.footer}>
             <Text style={styles.footerText}>Bạn chưa có tài khoản? </Text>
             <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
               <Text style={styles.registerLink}>Đăng ký ngay</Text>
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
    paddingTop: 60,
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
  forgotBtn: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.xl,
  },
  forgotText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  loginBtn: {
    marginTop: SPACING.md,
  },

  guestText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xxl,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  registerLink: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
