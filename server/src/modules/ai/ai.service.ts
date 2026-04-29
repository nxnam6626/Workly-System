import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AiExtractionService } from './services/ai-extraction.service';
import { AiMatchingService } from './ai-matching.service';
import { AiModerationService } from './ai-moderation.service';
import { AiInsightsService } from './ai-insights.service';
import { AiChatService } from './ai-chat.service';
import { AiJdService } from './services/ai-jd.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly aiExtractionService: AiExtractionService,
    private readonly aiMatchingService: AiMatchingService,
    private readonly aiModerationService: AiModerationService,
    private readonly aiInsightsService: AiInsightsService,
    private readonly aiChatService: AiChatService,
    private readonly aiJdService: AiJdService,
    @InjectQueue('matching') private readonly matchingQueue: Queue,
  ) {
    this.logger.log('AiService Facade initialized');
  }

  // --- Extraction ---
  async moderateChatImageBuffer(buffer: Buffer, mimeType: string) {
    return this.aiModerationService.moderateChatImageBuffer(buffer, mimeType);
  }

  async extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
    return this.aiExtractionService.extractTextFromBuffer(buffer, mimeType);
  }

  async extractTextFromLocalFile(fileUrl: string): Promise<string> {
    return this.aiExtractionService.extractTextFromLocalFile(fileUrl);
  }

  async extractTextFromPdfUrl(fileUrl: string): Promise<string> {
    return this.aiExtractionService.extractTextFromPdfUrl(fileUrl);
  }

  // --- Matching ---
  async evaluateMatch(cvText: string, jobTitle: string, jobRequirements: string): Promise<number> {
    return this.aiMatchingService.evaluateMatch(cvText, jobTitle, jobRequirements);
  }

  async extractFocusSkills(jobTitle: string, jobRequirements: string): Promise<string[]> {
    return this.aiMatchingService.extractFocusSkills(jobTitle, jobRequirements);
  }

  async expandJobKeywords(jobTitle: string, hardSkills: string[]): Promise<Record<string, string[]>> {
    return this.aiMatchingService.expandJobKeywords(jobTitle, hardSkills);
  }

  async calculateSemanticSimilarity(text1: string, text2: string): Promise<number> {
    return this.aiMatchingService.calculateSemanticSimilarity(text1, text2);
  }

  // --- Insights ---
  async generateRecruiterInsights(userId: string, forceRefresh: boolean = false): Promise<any> {
    return this.aiInsightsService.generateRecruiterInsights(userId, forceRefresh);
  }

  // --- Moderation ---
  async moderateJobContent(title: string, description: string, requirements?: string, benefits?: string, hardSkills?: string[], jobTier?: string) {
    return this.aiModerationService.moderateJobContent(title, description, requirements, benefits, hardSkills, jobTier);
  }

  async moderateImage(imageInput: string, mimeType?: string, expectedType?: 'face_only' | 'face_or_logo' | 'any') {
    return this.aiModerationService.moderateImage(imageInput, mimeType, expectedType);
  }

  // --- Chat & RAG ---
  async generateResponse(message: string): Promise<string> {
    return this.aiChatService.generateResponse(message);
  }

  async *generateStreamResponse(message: string, userId?: string, roles?: string[], contextMode?: string) {
    yield* this.aiChatService.generateStreamResponse(message, userId, roles, contextMode);
  }

  async getCandidateRagContext(userId: string): Promise<string> {
    return this.aiChatService.getCandidateRagContext(userId);
  }

  async expandSearchQuery(message: string): Promise<string[]> {
    return this.aiChatService.expandSearchQuery(message);
  }

  async *processChatWithRAGStream(message: string, context?: any) {
    yield* this.aiChatService.processChatWithRAGStream(message, context);
  }

  // --- JD Operations ---
  async autoFixJob(userId: string, jobId: string, insightInstruction: string) {
    return this.aiJdService.autoFixJob(userId, jobId, insightInstruction, this.matchingQueue);
  }

  async generateJdFromPrompt(userId: string, promptInfo: string) {
    return this.aiJdService.generateJdFromPrompt(userId, promptInfo);
  }
}
