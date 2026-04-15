export const COLORS = {
  primary: '#1e5aff',
  primaryDark: '#1248d4',
  accent: '#f59e0b',
  urgent: '#ef4444',
  professional: '#f59e0b',
  bg: '#f4f7f6',
  bgDark: '#0f172a',
  card: '#ffffff',
  cardDark: '#1e293b',
  text: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  success: '#22c55e',
  error: '#ef4444',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const JOB_TYPE_LABEL: Record<string, string> = {
  FULLTIME: 'Toàn thời gian',
  PARTTIME: 'Bán thời gian',
  INTERNSHIP: 'Thực tập',
  // Legacy / fallback
  FULL_TIME: 'Toàn thời gian',
  PART_TIME: 'Bán thời gian',
  CONTRACT: 'Hợp đồng',
  FREELANCE: 'Freelance',
  REMOTE: 'Remote',
};

export const INDUSTRIES = [
  'CNTT / Phần mềm',
  'Marketing / Truyền thông',
  'Tài chính / Kế toán / Ngân hàng',
  'Nhân sự / Hành chính / Pháp lý',
  'Kinh doanh / Bán hàng',
  'Thiết kế / Sáng tạo',
  'Kỹ thuật / Cơ khí / Sản xuất',
  'Xây dựng / Kiến trúc',
  'Y tế / Dược phẩm',
  'Giáo dục / Đào tạo',
  'Nhà hàng / Khách sạn / Du lịch',
  'Logistics / Chuỗi cung ứng',
  'Bất động sản',
];

export const LOCATIONS = [
  'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng',
  'Bình Dương', 'Đồng Nai', 'Bà Rịa - Vũng Tàu', 'Hưng Yên',
  'Quảng Ninh', 'Thái Nguyên', 'Toàn quốc',
];

export const formatSalary = (
  min: number | null,
  max: number | null,
  currency = 'VND'
): string => {
  if (!min && !max) return 'Thỏa thuận';
  const fmt = (n: number) =>
    currency === 'VND'
      ? `${(n / 1_000_000).toFixed(0)}M`
      : `$${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `Từ ${fmt(min)}`;
  return `Đến ${fmt(max!)}`;
};
