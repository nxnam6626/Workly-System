import { Injectable, Logger } from '@nestjs/common';
import { CandidateSearchService } from './candidate-search.service';
import { CandidateManagementService } from './candidate-management.service';
import { CandidateInteractionService } from './candidate-interaction.service';

@Injectable()
export class CandidateProfileService {
  private readonly logger = new Logger(CandidateProfileService.name);

  constructor(
    private readonly searchService: CandidateSearchService,
    private readonly managementService: CandidateManagementService,
    private readonly interactionService: CandidateInteractionService,
  ) {}

  async findAll(query: any, recruiterUserId?: string) {
    return this.searchService.findAll(query, recruiterUserId);
  }

  async findOne(candidateId: string, recruiterUserId?: string) {
    return this.searchService.findOne(candidateId, recruiterUserId);
  }

  async findByUserId(userId: string) {
    return this.searchService.findByUserId(userId);
  }

  async create(createCandidateDto: any) {
    return this.managementService.create(createCandidateDto);
  }

  async update(candidateId: string, updateCandidateDto: any) {
    return this.managementService.update(candidateId, updateCandidateDto);
  }

  async remove(candidateId: string) {
    return this.managementService.remove(candidateId);
  }

  async toggleSave(candidateId: string, userId: string) {
    return this.interactionService.toggleSave(candidateId, userId);
  }

  async getSavedCandidates(userId: string) {
    return this.interactionService.getSavedCandidates(userId);
  }
}
