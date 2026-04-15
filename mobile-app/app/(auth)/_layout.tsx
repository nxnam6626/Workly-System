import { useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../stores/auth';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../../lib/constants';

export default function AuthLayout() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgDark }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (isAuthenticated) {
    if (user?.roles?.includes('ADMIN') || user?.admin) {
      return <Redirect href="/(admin)" />;
    }
    if (user?.recruiter) {
      return <Redirect href={'/(recruiter-tabs)/index' as any} />;
    }
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
