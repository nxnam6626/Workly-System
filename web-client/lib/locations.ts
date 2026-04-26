import subVn from "sub-vn";

export interface Province {
  code: string;
  name: string;
  districts: string[];
}

// Hàm làm sạch tên (Ví dụ: "Thành phố Hà Nội" -> "Hà Nội", "Tỉnh Hà Giang" -> "Hà Giang")
const cleanName = (name: string) => {
  return name
    .replace(/^Thành phố /, "")
    .replace(/^Tỉnh /, "")
    .trim();
};

export const VIETNAM_LOCATIONS: Province[] = subVn.getProvinces().map((p: any) => ({
  code: p.code,
  name: cleanName(p.name),
  districts: subVn.getDistrictsByProvinceCode(p.code).map((d: any) => d.name),
}));

// Ưu tiên hiển thị Hà Nội, HCM, Đà Nẵng lên đầu
const PRIORITY = ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng"];
VIETNAM_LOCATIONS.sort((a, b) => {
  const aIdx = PRIORITY.indexOf(a.name);
  const bIdx = PRIORITY.indexOf(b.name);
  
  if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
  if (aIdx !== -1) return -1;
  if (bIdx !== -1) return 1;
  
  return a.name.localeCompare(b.name, "vi");
});
