export type RankingEntry = {
  name: string;
  score: number;
  playerId: string;
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

export const ApiRankingService = {
  async getRanking(mode: string): Promise<RankingEntry[]> {
    try {
      const date = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/rankings?mode=${mode}&date=${date}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data;
    } catch {
      return [];
    }
  },

  async saveScore(mode: string, score: number, name: string, playerId: string): Promise<RankingEntry[]> {
    try {
      const date = new Date().toISOString().split('T')[0];
      const res = await fetch('/api/rankings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          mode,
          score,
          date,
          playerId
        })
      });
      if (!res.ok) throw new Error('Failed to save score');
      const data = await res.json();
      return data;
    } catch {
      return [];
    }
  }
};
