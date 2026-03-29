export function formatSalary(min: number | null, max: number | null, currency: string | null) {
  if (!min && !max) return "Thỏa thuận";
  const fmt = (v: number) =>
    currency === "VND"
      ? `${(v / 1_000_000).toFixed(0)} triệu`
      : `$${v.toLocaleString()}`;
  if (min && !max) return `Từ ${fmt(min)}`;
  if (!min && max) return `Đến ${fmt(max)}`;
  return `${fmt(min!)} - ${fmt(max!)}`;
}

export function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hôm nay";
  if (days < 7) return `${days} ngày trước`;
  if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
  return `${Math.floor(days / 30)} tháng trước`;
}

export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
