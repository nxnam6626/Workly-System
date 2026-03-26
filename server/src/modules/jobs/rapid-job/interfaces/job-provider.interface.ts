import { Observable } from 'rxjs';
import { MappedJobData } from './rapid-job.interface';

export interface IJobProvider {
  fetchJobs(params: Record<string, any>): Observable<any>;
  mapToJobData(apiData: any): MappedJobData;
}
