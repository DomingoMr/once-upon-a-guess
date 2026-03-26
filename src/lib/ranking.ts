export type RankingEntry = {
  name: string;
  score: number;
  isUser?: boolean;
};

export type GameMode = 'classic' | 'emoji' | 'silhouette' | 'song' | 'card';

export function calculateScore(attempts: number): number {
  if (attempts === 0) return 0;
  if (attempts === 1) return 1000;
  if (attempts === 2) return 850;
  if (attempts === 3) return 700;
  if (attempts === 4) return 500;
  if (attempts === 5) return 300;
  return 100;
}

export const MockRankingService = {
  getDailyRanking(mode: GameMode, userScore: number, userName: string | null): RankingEntry[] {
    const entries: RankingEntry[] = [];
    
    if (userName && userScore > 0) {
      entries.push({ name: userName, score: userScore, isUser: true });
    }

    return entries.sort((a, b) => b.score - a.score);
  },

  getGlobalRanking(allScores: Record<string, number>, userName: string | null): RankingEntry[] {
    const userTotal = Object.values(allScores).reduce((sum, s) => sum + s, 0);
    const baseBoard: RankingEntry[] = [];

    if (userName && userTotal > 0) {
      baseBoard.push({ name: userName, score: userTotal, isUser: true });
    }

    return baseBoard;
  }
};
