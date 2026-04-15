import { Redirect, Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../stores/auth';
import { COLORS } from '../../lib/constants';

export default function AdminLayout() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgDark }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Deep link guard: workly://admin — only ADMIN role permitted
  const isAdmin = isAuthenticated && (user?.roles?.includes('ADMIN') || !!user?.admin);
  if (!isAdmin) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '800', fontSize: 18 },
        headerBackTitle: 'Quay lại',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="jobs" options={{ title: 'Quản lý Tin tuyển dụng' }} />
      <Stack.Screen name="users" options={{ title: 'Quản lý người dùng' }} />
      <Stack.Screen name="support" options={{ title: 'Hỗ trợ người dùng' }} />
      <Stack.Screen name="revenue" options={{ title: 'Doanh thu' }} />
    </Stack>
  );
}
