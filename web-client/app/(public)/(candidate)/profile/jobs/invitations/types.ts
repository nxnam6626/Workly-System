export interface Invitation {
  invitationId: string;
  jobPostingId: string;
  message?: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
  jobPosting: {
    title: string;
    salaryMin: number;
    salaryMax: number;
    currency: string;
    locationCity: string;
    jobType?: string;
    company: {
      companyName: string;
      logo: string | null;
      industry?: string;
    };
  };
}
