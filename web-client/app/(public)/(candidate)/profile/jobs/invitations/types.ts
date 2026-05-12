export interface Invitation {
  invitationId: string;
  applicationId?: string | null;
  invType?: "INTERVIEW" | "JOB_APPLICATION";
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
