import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity,
  TextInput, Alert, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import api from '../../lib/api';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface Candidate {
  candidateId: string;
  fullName: string;
  major: string | null;
  university: string | null;
  gpa: number | null;
  matchScore: number;
  bestMatchJob?: string;
  isUnlocked: boolean;
  user?: { avatar: string | null };
  skills: { skillName: string }[];
  cvs: { fileUrl: string }[];
}

export default function RecruiterCandidatesScreen() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [major, setMajor] = useState('');
  const [skills, setSkills] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Broadcast
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const [candRes, savedRes] = await Promise.all([
        api.get('/candidates', { params: { search, major, skills } }),
        api.get('/candidates/saved').catch(() => ({ data: [] }))
      ]);
      setCandidates(Array.isArray(candRes.data?.data) ? candRes.data.data : []);
      if (Array.isArray(savedRes.data)) {
        setSavedIds(savedRes.data.map((c: any) => c.candidateId));
      }
    } catch {}
    finally { setLoading(false); }
  }, [search, major, skills]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCandidates();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchCandidates]);

  const toggleSave = async (id: string, currentlySaved: boolean) => {
    try {
      const { data } = await api.post(`/candidates/${id}/save`);
      if (data.saved) {
        setSavedIds(prev => [...prev, id]);
        Alert.alert('Thành công', 'Đã lưu ứng viên!');
      } else {
        setSavedIds(prev => prev.filter(x => x !== id));
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra khi lưu ứng viên');
    }
  };

  const toggleSelect = (candidate: Candidate) => {
    if (!candidate.isUnlocked) {
      Alert.alert('Chưa mở khóa', 'Vui lòng dùng tính năng AI Matching để mở khóa CV và gửi tin nhắn.');
      return;
    }
    const id = candidate.candidateId;
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim() || selectedIds.length === 0) return;
    setSending(true);
    try {
      await api.post('/messages/broadcast', {
        candidateIds: selectedIds,
        content: broadcastMessage
      });
      Alert.alert('Thành công', 'Gửi tin nhắn thành công!');
      setIsBroadcastOpen(false);
      setBroadcastMessage('');
      setSelectedIds([]);
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Lỗi khi gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  const handleOpenCv = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url.startsWith('http') ? url : `https://workly.com/files/${url}`);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể mở CV lúc này');
    }
  };

  const renderItem = useCallback(({ item }: { item: Candidate }) => {
    const isSelected = selectedIds.includes(item.candidateId);
    const isSaved = savedIds.includes(item.candidateId);

    return (
      <TouchableOpacity 
        style={[styles.card, isSelected && styles.cardSelected]} 
        onPress={() => toggleSelect(item)}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarWrap}>
            {item.user?.avatar ? (
              <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarText}>{item.fullName?.charAt(0).toUpperCase() || 'U'}</Text>
            )}
          </View>
          <View style={{ flex: 1, paddingLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.name} numberOfLines={1}>{item.fullName}</Text>
              {!item.isUnlocked && (
                <View style={styles.lockedBadge}>
                  <Text style={styles.lockedBadgeText}>Chưa mở</Text>
                </View>
              )}
            </View>
            <Text style={styles.major} numberOfLines={1}>{item.major || 'Software Engineer'}</Text>
          </View>
          <TouchableOpacity onPress={() => toggleSave(item.candidateId, isSaved)} style={styles.saveBtn} hitSlop={8}>
            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={22} color={isSaved ? COLORS.primary : COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="school-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{item.university || 'Đại học ẩn'}</Text>
            {item.gpa && <Text style={styles.gpaText}>{item.gpa} GPA</Text>}
          </View>
          
          {item.matchScore > 0 && (
            <View style={styles.matchPill}>
              <Text style={styles.matchPillText}>Phù hợp {item.matchScore}% với {item.bestMatchJob}</Text>
            </View>
          )}

          {item.skills && item.skills.length > 0 && (
            <View style={styles.skillsRow}>
              {item.skills.slice(0, 3).map((s, idx) => (
                <View key={idx} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{s.skillName}</Text>
                </View>
              ))}
              {item.skills.length > 3 && <Text style={styles.skillMore}>+{item.skills.length - 3}</Text>}
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.actionBtn, !item.isUnlocked && styles.actionBtnDisabled]}
            disabled={!item.isUnlocked}
            onPress={(e) => {
              e.stopPropagation(); // Avoid triggering select
              if (item.isUnlocked && item.cvs && item.cvs[0]) {
                handleOpenCv(item.cvs[0].fileUrl);
              } else if (!item.isUnlocked) {
                Alert.alert('Từ chối', 'Ứng viên chưa được mở khóa.');
              } else {
                Alert.alert('Thông báo', 'Ứng viên không có CV');
              }
            }}
          >
            <Ionicons name={!item.isUnlocked ? "lock-closed" : "document-text"} size={16} color={!item.isUnlocked ? COLORS.textMuted : "#fff"} />
            <Text style={[styles.actionBtnText, !item.isUnlocked && { color: COLORS.textMuted }]}>
              {!item.isUnlocked ? 'Đã ẩn CV' : 'Xem CV'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Checkbox Overlay */}
        {isSelected && (
          <View style={styles.checkboxSelected}>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [selectedIds, savedIds]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Tìm Kiếm Ứng Viên</Text>
          <Text style={styles.headerSubtitle}>Khám phá nhân tài phù hợp với doanh nghiệp</Text>
        </View>
      </View>

      <View style={styles.searchBlock}>
        <View style={styles.searchRow}>
          <View style={styles.inputWrap}>
            <Ionicons name="search" size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Nhập tên, từ khóa..."
              placeholderTextColor={COLORS.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity 
            style={[styles.filterToggle, showFilters && styles.filterToggleActive]} 
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options-outline" size={20} color={showFilters ? '#fff' : COLORS.textMuted} />
          </TouchableOpacity>
        </View>
        
        {showFilters && (
          <View style={styles.filtersExt}>
            <View style={styles.inputWrapSmall}>
              <Ionicons name="school-outline" size={14} color={COLORS.textMuted} />
              <TextInput
                style={styles.inputSmall}
                placeholder="Chuyên ngành..."
                placeholderTextColor={COLORS.textMuted}
                value={major}
                onChangeText={setMajor}
              />
            </View>
            <View style={styles.inputWrapSmall}>
              <Ionicons name="flash-outline" size={14} color={COLORS.textMuted} />
              <TextInput
                style={styles.inputSmall}
                placeholder="Kỹ năng cụ thể..."
                placeholderTextColor={COLORS.textMuted}
                value={skills}
                onChangeText={setSkills}
              />
            </View>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} size="large" />
      ) : (
        <FlatList
          data={candidates}
          renderItem={renderItem}
          keyExtractor={(item) => item.candidateId}
          contentContainerStyle={{ padding: SPACING.md }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Không tìm thấy ứng viên nào</Text>
            </View>
          }
        />
      )}

      {/* Broadcast FAB */}
      {selectedIds.length > 0 && (
        <View style={styles.fabWrap}>
          <TouchableOpacity style={styles.fabBtn} onPress={() => setIsBroadcastOpen(true)} activeOpacity={0.9}>
            <Ionicons name="send" size={20} color="#fff" />
            <Text style={styles.fabText}>Gửi Tin Gọi ({selectedIds.length})</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Broadcast Modal */}
      <Modal visible={isBroadcastOpen} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gửi tin cho {selectedIds.length} ứng viên</Text>
              <TouchableOpacity onPress={() => setIsBroadcastOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <TextInput
                style={styles.broadcastInput}
                placeholder="Xin chào, chúng tôi có vị trí này đang tuyển dụng..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={6}
                value={broadcastMessage}
                onChangeText={setBroadcastMessage}
                textAlignVertical="top"
              />
              <TouchableOpacity 
                style={[styles.sendModalBtn, (!broadcastMessage.trim() || sending) && { opacity: 0.5 }]} 
                onPress={handleBroadcast}
                disabled={!broadcastMessage.trim() || sending}
              >
                {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendModalBtnText}>Gửi Tin Nhắn</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: { paddingHorizontal: SPACING.md, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  
  searchBlock: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  searchRow: { flexDirection: 'row', gap: 8 },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardDark, borderRadius: RADIUS.lg, paddingHorizontal: 12, height: 48, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  input: { flex: 1, color: '#fff', marginLeft: 8, fontSize: 15 },
  filterToggle: { width: 48, height: 48, borderRadius: RADIUS.lg, backgroundColor: COLORS.cardDark, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  filterToggleActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  
  filtersExt: { flexDirection: 'row', gap: 8, marginTop: 8 },
  inputWrapSmall: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.md, paddingHorizontal: 10, height: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  inputSmall: { flex: 1, color: '#fff', marginLeft: 6, fontSize: 13 },

  card: { backgroundColor: COLORS.cardDark, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', position: 'relative' },
  cardSelected: { borderColor: COLORS.primary, backgroundColor: 'rgba(30,90,255,0.05)' },
  
  cardHeader: { flexDirection: 'row', marginBottom: SPACING.sm },
  avatarWrap: { width: 48, height: 48, borderRadius: RADIUS.md, backgroundColor: 'rgba(30,90,255,0.1)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  avatarText: { color: COLORS.primary, fontSize: 18, fontWeight: '800' },
  name: { fontSize: 16, fontWeight: '700', color: '#fff', flexShrink: 1 },
  lockedBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  lockedBadgeText: { color: COLORS.textMuted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  major: { fontSize: 13, color: COLORS.primary, fontWeight: '500', marginTop: 2 },
  saveBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'flex-end' },
  
  cardBody: { paddingBottom: SPACING.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  infoText: { fontSize: 13, color: COLORS.textMuted, flex: 1 },
  gpaText: { fontSize: 12, fontWeight: '600', color: COLORS.primary, backgroundColor: 'rgba(30,90,255,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  matchPill: { backgroundColor: 'rgba(16,185,129,0.1)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm, marginBottom: 8 },
  matchPillText: { color: COLORS.success, fontSize: 11, fontWeight: '700' },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  skillBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full },
  skillText: { color: COLORS.textSecondary, fontSize: 11 },
  skillMore: { color: COLORS.textMuted, fontSize: 11, alignSelf: 'center', marginLeft: 4 },
  
  cardActions: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: SPACING.sm, marginTop: SPACING.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary, paddingVertical: 10, borderRadius: RADIUS.md },
  actionBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.05)' },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  
  checkboxSelected: { position: 'absolute', top: -6, left: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.bgDark },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textMuted, fontSize: 15, marginTop: 12 },

  fabWrap: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },
  fabBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: RADIUS.full, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.cardDark, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  modalBody: { padding: SPACING.md },
  broadcastInput: { height: 120, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg, padding: SPACING.sm, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: SPACING.md },
  sendModalBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: RADIUS.lg, alignItems: 'center' },
  sendModalBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
