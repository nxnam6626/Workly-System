export interface MatchingResult {
  score: number;
  details?: any;
}

export interface IMatchingStrategy {
  calculate(source: any, target: any): Promise<MatchingResult>;
}
