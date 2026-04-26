import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface User {
  userId: string;
  email: string;
  status: 'ACTIVE' | 'LOCKED';
  userRoles?: { role: { roleName: string } }[];
  createdAt: string;
  candidate?: { fullName: string };
}

const UserRow = React.memo(({ item, onToggle }: { item: User; onToggle: () => void }) => {
  const rolesList = item.userRoles?.map(ur => ur.role.roleName) || [];
  const name = item.candidate?.fullName || item.email;
  const isActive = item.status === 'ACTIVE';

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.email.slice(0, 2).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {rolesList.map((r, i) => (
            <View key={i} style={[styles.rolePill, r === 'ADMIN' && { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
              <Text style={[styles.roleText, r === 'ADMIN' && { color: COLORS.error }]}>{r}</Text>
            </View>
          ))}
        </View>
      </View>
      <TouchableOpacity
        style={[styles.toggleBtn, isActive ? styles.toggleActive : styles.toggleInactive]}
        onPress={onToggle}
      >
        <Ionicons name={isActive ? 'lock-open' : 'lock-closed'} size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
});

export default function AdminUsersScreen() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Create Admin
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const isSupremeAdmin = currentUser?.admin?.permissions?.includes('SUPER_ADMIN');

  const fetchUsers = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const params: any = { take: 50 };
      if (q) params.search = q;
      const { data } = await api.get('/users', { params });
      setUsers(data.data || data || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => fetchUsers(search), 500);
    return () => clearTimeout(delay);
  }, [search, fetchUsers]);

  const toggleUser = (userId: string, isActive: boolean) => {
    const action = isActive ? 'Khóa' : 'Mở khóa';
    Alert.alert(`${action} tài khoản`, `Bạn có chắc muốn ${action.toLowerCase()} tài khoản này?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: action,
        style: isActive ? 'destructive' : 'default',
        onPress: async () => {
          try {
            const apiPath = `/users/${userId}/${isActive ? 'lock' : 'unlock'}`;
            await api.patch(apiPath);
            setUsers((prev) => prev.map((u) => u.userId === userId ? { ...u, status: isActive ? 'LOCKED' : 'ACTIVE' } : u));
            Alert.alert('Thành công', `Đã ${action.toLowerCase()} tài khoản!`);
          } catch (e: any) { 
            Alert.alert('Lỗi', e.response?.data?.message || 'Không thể thực hiện thao tác'); 
          }
        },
      },
    ]);
  };

  const handleCreateAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }
    setCreating(true);
    try {
      await api.post('/users', {
        email: newAdminEmail,
        password: newAdminPassword,
        role: 'ADMIN',
        permissions: [] // or ['ALL'] if creating supreme
      });
      Alert.alert('Thành công', 'Đã tạo tài khoản Quản trị viên mới');
      setIsCreateModalOpen(false);
      setNewAdminEmail('');
      setNewAdminPassword('');
      fetchUsers(search);
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể tạo Admin');
    } finally {
      setCreating(false);
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: User }) => (
      <UserRow item={item} onToggle={() => toggleUser(item.userId, item.status === 'ACTIVE')} />
    ),
    []
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm email, tên người dùng..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {isSupremeAdmin && (
          <TouchableOpacity style={styles.createBtn} onPress={() => setIsCreateModalOpen(true)}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} size="large" />
      ) : (
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={{ padding: SPACING.md }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Không tìm thấy người dùng</Text>
            </View>
          }
        />
      )}

      {/* Modal Tạo Admin */}
      <Modal visible={isCreateModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo Quản trị viên</Text>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="admin@workly.com"
                placeholderTextColor={COLORS.textMuted}
                value={newAdminEmail}
                onChangeText={setNewAdminEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              
              <Text style={[styles.inputLabel, { marginTop: SPACING.md }]}>Mật khẩu khởi tạo</Text>
              <TextInput
                style={styles.input}
                placeholder="********"
                placeholderTextColor={COLORS.textMuted}
                value={newAdminPassword}
                onChangeText={setNewAdminPassword}
                secureTextEntry
              />
              
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateAdmin} disabled={creating}>
                {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Tạo Tài Khoản</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  topBar: { flexDirection: 'row', alignItems: 'center', margin: SPACING.md, gap: 8 },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.cardDark,
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, height: 44,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  createBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.cardDark, borderRadius: RADIUS.lg,
    padding: SPACING.sm, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  avatar: {
    width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: 'rgba(30,90,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: COLORS.primary, fontWeight: '800', fontSize: 16 },
  name: { fontSize: 14, fontWeight: '700', color: '#fff' },
  email: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  rolePill: { backgroundColor: 'rgba(30,90,255,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  roleText: { fontSize: 10, color: COLORS.primary, fontWeight: '700' },
  
  toggleBtn: { width: 36, height: 36, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  toggleActive: { backgroundColor: 'rgba(255,255,255,0.05)' },
  toggleInactive: { backgroundColor: COLORS.error },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textMuted, fontSize: 15, marginTop: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.bgDark, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  modalBody: { padding: SPACING.lg, paddingBottom: 40 },
  inputLabel: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { height: 48, backgroundColor: COLORS.cardDark, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  submitBtn: { backgroundColor: COLORS.primary, height: 48, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xl },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
