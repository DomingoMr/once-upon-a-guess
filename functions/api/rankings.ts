/// <reference types="@cloudflare/workers-types" />

export interface Env {
  RANKINGS: KVNamespace;
}

export type RankingEntry = {
  name: string;
  score: number;
  playerId: string;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const mode = url.searchParams.get('mode') || 'classic';
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  const key = `ranking:${date}:${mode}`;
  const data = await context.env.RANKINGS.get(key);

  if (!data) {
    return Response.json([]);
  }

  return new Response(data, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json<{
      name: string;
      mode: string;
      score: number;
      date: string;
      playerId: string;
    }>();

    if (!body.name || !body.mode || typeof body.score !== 'number' || !body.date || !body.playerId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const key = `ranking:${body.date}:${body.mode}`;

    // Get existing rankings
    const existingData = await context.env.RANKINGS.get(key);
    let rankings: RankingEntry[] = existingData ? JSON.parse(existingData) : [];

    // Find if user already exists
    const existingIndex = rankings.findIndex(r => r.playerId === body.playerId);

    if (existingIndex >= 0) {
      // Always update name, update score if higher (or for 'global' we just overwrite with latest total)
      rankings[existingIndex].name = body.name;
      if (body.score > rankings[existingIndex].score) {
        rankings[existingIndex].score = body.score;
      }
    } else {
      // Add new entry
      rankings.push({
        name: body.name,
        score: body.score,
        playerId: body.playerId
      });
    }

    // Sort descending by score
    rankings.sort((a, b) => b.score - a.score);

    // Keep top 100
    rankings = rankings.slice(0, 100);

    // Save back to KV
    await context.env.RANKINGS.put(key, JSON.stringify(rankings));

    return Response.json(rankings);
  } catch (err: any) {
    return Response.json({ error: 'Internal Server Error', message: err.message, stack: err.stack }, { status: 500 });
  }
};
