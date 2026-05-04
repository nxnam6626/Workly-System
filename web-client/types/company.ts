export interface CompanySection {
  id: string;
  title: string;
  content: string;
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
  id: string;
  address: string;
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
  jobPostings?: any[]; // We can refine this later if needed
}
