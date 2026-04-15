import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../stores/auth';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRealtime } from '../hooks/useRealtime';

function RealtimeProvider() {
  useRealtime();
  return null;
}

export default function RootLayout() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RealtimeProvider />
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(recruiter-tabs)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="jobs/[id]" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="chat/[conversationId]" options={{ presentation: 'card', headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
