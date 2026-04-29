import { Injectable } from '@nestjs/common';
import { CandidateProfileService } from './services/candidate-profile.service';
import { CandidateCvService } from './services/candidate-cv.service';
import { CandidateMatchingService } from './services/candidate-matching.service';

@Injectable()
export class CandidatesService {
  constructor(
    private readonly profileService: CandidateProfileService,
    private readonly cvService: CandidateCvService,
    private readonly matchingService: CandidateMatchingService,
  ) { }

  // --- Profile Logic ---
  create(createCandidateDto: any) {
    return this.profileService.create(createCandidateDto);
  }

  findAll(query: any, recruiterUserId?: string) {
    return this.profileService.findAll(query, recruiterUserId);
  }

  findOne(candidateId: string, recruiterUserId?: string) {
    return this.profileService.findOne(candidateId, recruiterUserId);
  }

  findByUserId(userId: string) {
    return this.profileService.findByUserId(userId);
  }

  update(candidateId: string, updateCandidateDto: any) {
    return this.profileService.update(candidateId, updateCandidateDto);
  }

  remove(candidateId: string) {
    return this.profileService.remove(candidateId);
  }

  toggleSave(candidateId: string, userId: string) {
    return this.profileService.toggleSave(candidateId, userId);
  }

  getSavedCandidates(userId: string) {
    return this.profileService.getSavedCandidates(userId);
  }

  // --- CV Logic ---
  uploadCvOnly(userId: string, file: Express.Multer.File) {
    return this.cvService.uploadCvOnly(userId, file);
  }

  analyzeCv(userId: string, cvId: string) {
    return this.cvService.analyzeCv(userId, cvId);
  }

  saveCv(userId: string, saveCvDto: any) {
    return this.cvService.saveCv(userId, saveCvDto);
  }

  updateCv(userId: string, cvId: string, updateCvDto: any) {
    return this.cvService.updateCv(userId, cvId, updateCvDto);
  }

  setMainCv(userId: string, cvId: string) {
    return this.cvService.setMainCv(userId, cvId);
  }

  deleteCv(userId: string, cvId: string) {
    return this.cvService.deleteCv(userId, cvId);
  }

  findByHash(candidateId: string, fileHash: string) {
    return this.cvService.findByHash(candidateId, fileHash);
  }

  // --- Matching Logic ---
  getRecommendedJobs(userId: string, page: number = 1, limit: number = 10) {
    return this.matchingService.getRecommendedJobs(userId, page, limit);
  }
}
