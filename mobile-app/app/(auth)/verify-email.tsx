import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const { user } = useAuthStore();
  const targetEmail = emailParam || user?.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const inputRefs = useRef<TextInput[]>([]);
  const successAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (success) {
      Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 6 }).start();
    }
  }, [success]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleOtpChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (!digit && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số');
      shake();
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-email', { email: targetEmail, token: code });
      setSuccess(true);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn');
      shake();
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email: targetEmail });
      Alert.alert('Đã gửi lại!', 'Mã OTP mới đã được gửi về email của bạn.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      Alert.alert('Lỗi', 'Không thể gửi lại mã. Vui lòng thử lại.');
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.successCard, {
          opacity: successAnim,
          transform: [{ scale: successAnim }],
        }]}>
          <View style={styles.successIcon}>
            <Ionicons name="shield-checkmark" size={64} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Tuyệt vời! 🎉</Text>
          <Text style={styles.successDesc}>
            Email của bạn đã được xác minh thành công. Bây giờ bạn có thể trải nghiệm toàn bộ tính năng của Workly.
          </Text>
          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => router.replace('/(tabs)/profile')}
          >
            <Text style={styles.successBtnText}>Đến trang cá nhân</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/index' as any)} style={{ marginTop: 16 }}>
            <Text style={{ color: COLORS.textMuted, fontWeight: '600', textAlign: 'center' }}>
              Quay về trang chủ
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.iconBox}>
        <Ionicons name="mail" size={40} color={COLORS.primary} />
      </View>

      <Text style={styles.title}>Xác minh tài khoản</Text>
      <Text style={styles.subtitle}>
        Mã xác minh đã được gửi tới:{'\n'}
        <Text style={styles.email}>{targetEmail}</Text>
      </Text>

      {/* OTP Boxes */}
      <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={ref => { if (ref) inputRefs.current[i] = ref; }}
            style={[styles.otpBox, digit && styles.otpBoxFilled, error && styles.otpBoxError]}
            value={digit}
            onChangeText={text => handleOtpChange(text, i)}
            keyboardType="numeric"
            maxLength={1}
            textAlign="center"
            selectTextOnFocus
          />
        ))}
      </Animated.View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.verifyBtn, (loading || otp.join('').length !== 6) && styles.verifyBtnDisabled]}
        onPress={handleVerify}
        disabled={loading || otp.join('').length !== 6}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.verifyBtnText}>Xác nhận danh tính</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.resendBox}>
        <Ionicons name="shield-outline" size={16} color={COLORS.accent} />
        <View style={{ flex: 1 }}>
          <Text style={styles.resendHint}>Bạn không nhận được mã?</Text>
          <TouchableOpacity onPress={handleResend} disabled={resending}>
            <Text style={styles.resendLink}>
              {resending ? 'Đang gửi...' : 'Gửi lại mã tại đây'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: SPACING.lg },
  header: { paddingTop: SPACING.sm, marginBottom: SPACING.lg },
  backBtn: {
    width: 40, height: 40, borderRadius: RADIUS.full,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  iconBox: {
    width: 80, height: 80, backgroundColor: '#eff6ff',
    borderRadius: RADIUS.xl, justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: SPACING.lg,
  },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: SPACING.sm },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xl },
  email: { color: COLORS.text, fontWeight: '700' },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: SPACING.md },
  otpBox: {
    width: 48, height: 60, backgroundColor: '#fff',
    borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border,
    fontSize: 26, fontWeight: '800', color: COLORS.text,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  otpBoxFilled: { borderColor: COLORS.primary, backgroundColor: '#eff6ff' },
  otpBoxError: { borderColor: COLORS.error, backgroundColor: '#fff5f5' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center', marginBottom: SPACING.sm },
  errorText: { fontSize: 12, color: COLORS.error, fontWeight: '600' },
  verifyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.primary, borderRadius: RADIUS.xl,
    paddingVertical: 16, marginTop: SPACING.md,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  verifyBtnDisabled: { opacity: 0.4 },
  verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  resendBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#fffbeb', borderRadius: RADIUS.md,
    padding: SPACING.md, marginTop: SPACING.xl, borderWidth: 1, borderColor: '#fde68a',
  },
  resendHint: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  resendLink: { fontSize: 13, color: COLORS.primary, fontWeight: '700', marginTop: 2 },
  // Success
  successCard: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.lg,
  },
  successIcon: {
    width: 120, height: 120, backgroundColor: '#22c55e',
    borderRadius: RADIUS.full, justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.xl,
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  successTitle: { fontSize: 32, fontWeight: '900', color: COLORS.text, marginBottom: SPACING.sm },
  successDesc: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xl },
  successBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.text, paddingVertical: 16, paddingHorizontal: 32,
    borderRadius: RADIUS.xl, width: '100%', justifyContent: 'center',
  },
  successBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
