export interface CompanySection {
  id: string;
  title: string;
  content: string;
  type: string;
  displayOrder: number;
}

export interface CompanyBenefit {
  id: string;
  title: string;
  icon?: string;
}

export interface CompanyHistory {
  id: string;
  year: string;
  event: string;
}

export interface CompanyBranch {
  branchId: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  isVerified: boolean;
}

export interface Company {
  companyId: string;
  companyName: string;
  shortName?: string;
  internationalName?: string;
  description?: string;
  logo?: string;
  banner?: string;
  websiteUrl?: string;
  address?: string;
  companySize?: string;
  mainIndustry?: string;
  branches?: CompanyBranch[];
  sections?: CompanySection[];
  benefits?: CompanyBenefit[];
  history?: CompanyHistory[];
  cultureContent?: any; 
  jobPostings?: any[];
}
