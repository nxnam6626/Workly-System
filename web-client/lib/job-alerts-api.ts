import api from './api';

export interface JobAlert {
  jobAlertId: string;
  userId: string;
  keywords: string;
  createdAt: string;
}

export const jobAlertsApi = {
  getAlerts: (): Promise<JobAlert[]> =>
    api.get('/job-alerts').then((r) => r.data),

  createAlert: (keywords: string): Promise<JobAlert> =>
    api.post('/job-alerts', { keywords }).then((r) => r.data),

  deleteAlert: (id: string): Promise<any> =>
    api.delete(`/job-alerts/${id}`).then((r) => r.data),
};
