import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/auth';
import { View, ActivityIndicator, Text } from 'react-native';
import { COLORS } from '../lib/constants';
import { IS_RECRUITER_APP } from '../lib/config';

/**
 * Root Index Component
 * Handles initial routing logic based on the build variant and authentication state.
 */
export default function Index() {
  const { isAuthenticated, isLoading, user, logout } = useAuthStore();

  // 1. Loading State
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // 2. Unauthenticated State
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // 3. Variant-based Authorization Check
  // Ensure user has the correct role for the current app variant
  const hasRecruiterRole = !!(user?.recruiter || user?.roles?.includes('RECRUITER'));
  
  if (IS_RECRUITER_APP && !hasRecruiterRole) {
    // If in Recruiter App but user is only a Candidate
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>
          Tài khoản này chưa đăng ký quyền Nhà tuyển dụng. Vui lòng sử dụng ứng dụng Workly dành cho ứng viên.
        </Text>
        <Text onPress={() => logout()} style={{ color: COLORS.primary, fontWeight: '700' }}>
          Đăng xuất
        </Text>
      </View>
    );
  }

  // 4. Role-based Redirection (Priority given to Admin if in Candidate app)
  const isAdmin = user?.roles?.includes('ADMIN') || user?.admin;

  if (IS_RECRUITER_APP) {
    return <Redirect href="/(recruiter-tabs)" />;
  }

  if (isAdmin) return <Redirect href="/(admin)" />;
  
  return <Redirect href="/(tabs)" />;
}
