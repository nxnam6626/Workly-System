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

interface ExpirationStatus {
  isExpired: boolean;
  expiryDateStr: string | null;
  validityDurationMonths: number | null;
}

export function getCertificateExpirationStatus(cert: {
  name: string;
  issueDate?: string | null;
  aiVerification?: any;
}): ExpirationStatus {
  // 1. Try to read from AI verification if available
  const aiExpiryStr = cert.aiVerification?.extracted_expiry_date || cert.aiVerification?.expiryDate;
  if (aiExpiryStr && typeof aiExpiryStr === 'string' && aiExpiryStr !== 'null') {
    const expiryDate = new Date(aiExpiryStr);
    if (!isNaN(expiryDate.getTime())) {
      const now = new Date();
      return {
        isExpired: expiryDate < now,
        expiryDateStr: expiryDate.toLocaleDateString('vi-VN'),
        validityDurationMonths: null
      };
    }
  }

  // 2. Fallback: Parse issueDate and calculate based on certificate type
  if (!cert.issueDate) {
    return { isExpired: false, expiryDateStr: null, validityDurationMonths: null };
  }

  const nameLower = cert.name.toLowerCase();
  let durationMonths: number | null = null;

  if (
    nameLower.includes("toeic") ||
    nameLower.includes("ielts") ||
    nameLower.includes("toefl") ||
    nameLower.includes("hsk") ||
    nameLower.includes("vstep")
  ) {
    durationMonths = 24; // 2 years
  } else if (
    nameLower.includes("aws") ||
    nameLower.includes("cisco") ||
    nameLower.includes("ccna") ||
    nameLower.includes("ccnp") ||
    nameLower.includes("pmp")
  ) {
    durationMonths = 36; // 3 years
  } else if (
    nameLower.includes("azure") ||
    nameLower.includes("gcp") ||
    nameLower.includes("google cloud")
  ) {
    durationMonths = 24; // 2 years
  }

  if (durationMonths === null) {
    return { isExpired: false, expiryDateStr: "Vĩnh viễn", validityDurationMonths: null };
  }

  // Parse issueDate. Format can be "MM/YYYY", "YYYY/MM/DD", "DD/MM/YYYY", or "YYYY"
  let issueDateObj: Date | null = null;
  const parts = cert.issueDate.split(/[-/]/);
  
  if (parts.length === 2) {
    // MM/YYYY or YYYY/MM
    const p0 = parseInt(parts[0]);
    const p1 = parseInt(parts[1]);
    if (p0 > 12) {
      issueDateObj = new Date(p0, p1 - 1, 1);
    } else {
      issueDateObj = new Date(p1, p0 - 1, 1);
    }
  } else if (parts.length === 3) {
    // YYYY/MM/DD or DD/MM/YYYY
    const p0 = parseInt(parts[0]);
    const p1 = parseInt(parts[1]);
    const p2 = parseInt(parts[2]);
    if (p0 > 31) {
      issueDateObj = new Date(p0, p1 - 1, p2);
    } else {
      issueDateObj = new Date(p2, p1 - 1, p0);
    }
  } else if (parts.length === 1) {
    // YYYY
    const y = parseInt(parts[0]);
    if (!isNaN(y) && y > 1000) {
      issueDateObj = new Date(y, 11, 31);
    }
  }

  if (!issueDateObj || isNaN(issueDateObj.getTime())) {
    return { isExpired: false, expiryDateStr: null, validityDurationMonths: durationMonths };
  }

  const expiryDateObj = new Date(issueDateObj);
  expiryDateObj.setMonth(expiryDateObj.getMonth() + durationMonths);

  const now = new Date();
  return {
    isExpired: expiryDateObj < now,
    expiryDateStr: expiryDateObj.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }),
    validityDurationMonths: durationMonths
  };
}
