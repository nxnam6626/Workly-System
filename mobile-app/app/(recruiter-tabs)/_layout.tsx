import { Tabs, Redirect } from 'expo-router';
import { Platform, TouchableOpacity, View, Text, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/auth';
import { useMessageStore } from '../../stores/message';
import { COLORS, RADIUS, SPACING } from '../../lib/constants';

const MORE_ITEMS = [
  { icon: 'document-text', label: 'Đơn ứng tuyển', route: '/(recruiter-tabs)/applications', color: COLORS.primary },
  { icon: 'people', label: 'Ứng viên', route: '/(recruiter-tabs)/candidates', color: COLORS.success },
  { icon: 'brain', label: 'AI Insights', route: '/(recruiter-tabs)/ai-insight', color: '#a78bfa' },
  { icon: 'business', label: 'Gói dịch vụ', route: '/(recruiter-tabs)/billing', color: COLORS.accent },
  { icon: 'person', label: 'Hồ sơ', route: '/(recruiter-tabs)/profile', color: COLORS.textMuted },
] as const;

function MoreSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <TouchableOpacity style={sheet.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={sheet.container}>
        <View style={sheet.handle} />
        <Text style={sheet.title}>Thêm</Text>
        <View style={sheet.grid}>
          {MORE_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={sheet.item}
              onPress={() => { onClose(); router.push(item.route as any); }}
              activeOpacity={0.75}
            >
              <View style={[sheet.icon, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={sheet.label}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const sheet = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  container: {
    backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SPACING.lg, paddingBottom: 40,
  },
  handle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.md },
  title: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: SPACING.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  item: { width: '28%', alignItems: 'center', gap: 8 },
  icon: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '600', textAlign: 'center' },
});

export default function RecruiterTabsLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const { unreadCount } = useMessageStore();
  const [moreVisible, setMoreVisible] = useState(false);

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (!user?.recruiter) return <Redirect href="/(tabs)" />;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0f172a',
            borderTopColor: 'rgba(255,255,255,0.08)',
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 88 : 64,
            paddingBottom: Platform.OS === 'ios' ? 28 : 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: '#64748b',
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Tổng quan',
            tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="jobs"
          options={{
            title: 'Tin đăng',
            tabBarIcon: ({ color, size }) => <Ionicons name="briefcase" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="ai-chat"
          options={{
            title: 'AI',
            tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Tin nhắn',
            tabBarIcon: ({ color, size }) => (
              <View>
                <Ionicons name="chatbubbles" size={size} color={color} />
                {unreadCount > 0 && (
                  <View style={{ position: 'absolute', top: -3, right: -6, backgroundColor: COLORS.error, borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: 'Ví',
            tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="more-button"
          options={{
            title: 'Thêm',
            tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} />,
            tabBarButton: () => (
              <TouchableOpacity
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: Platform.OS === 'ios' ? 18 : 0 }}
                onPress={() => setMoreVisible(true)}
              >
                <Ionicons name="grid" size={24} color="#64748b" />
                <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', marginTop: 2 }}>Thêm</Text>
              </TouchableOpacity>
            ),
          }}
        />

        {/* Hidden screens — accessible via More sheet */}
        {['applications', 'candidates', 'ai-insight', 'billing', 'profile', 'post-job'].map((name) => (
          <Tabs.Screen
            key={name}
            name={name}
            options={{ href: null }}
          />
        ))}
      </Tabs>

      <MoreSheet visible={moreVisible} onClose={() => setMoreVisible(false)} />
    </>
  );
}
