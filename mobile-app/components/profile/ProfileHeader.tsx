import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface ProfileHeaderProps {
  name: string;
  email: string;
  major?: string;
  avatar: string | null;
  isOpenToWork: boolean;
  updatingAvatar: boolean;
  onAvatarPress: () => void;
  onToggleOpenToWork: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  email,
  major,
  avatar,
  isOpenToWork,
  updatingAvatar,
  onAvatarPress,
  onToggleOpenToWork,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.8}>
        <View style={styles.avatarWrap}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {name?.slice(0, 2).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          {updatingAvatar ? (
            <View style={[StyleSheet.absoluteFill, styles.avatarOverlay]}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : (
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          )}
        </View>
      </TouchableOpacity>

      <Text style={styles.name}>{name || 'Ứng viên'}</Text>
      <Text style={styles.email}>{email}</Text>
      {major && <Text style={styles.major}>{major}</Text>}

      {/* Open to Work Toggle */}
      <View style={styles.toggleCard}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleTitle}>Sẵn sàng làm việc</Text>
          <Text style={[styles.toggleStatus, { color: isOpenToWork ? COLORS.success : COLORS.textMuted }]}>
             {isOpenToWork ? 'Đang hiển thị hồ sơ với nhà tuyển dụng' : 'Đang ẩn hồ sơ'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.switch, isOpenToWork ? styles.switchOn : styles.switchOff]}
          onPress={onToggleOpenToWork}
          activeOpacity={0.9}
        >
          <View style={[styles.knob, isOpenToWork ? styles.knobOn : styles.knobOff]} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#fff',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#f8f9fa',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#f8f9fa',
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
  },
  avatarOverlay: {
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  major: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  toggleStatus: {
    fontSize: 12,
  },
  switch: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  switchOn: {
    backgroundColor: COLORS.success,
  },
  switchOff: {
    backgroundColor: '#e9ecef',
  },
  knob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  knobOn: {
    alignSelf: 'flex-end',
  },
  knobOff: {
    alignSelf: 'flex-start',
  },
});
