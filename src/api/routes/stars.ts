import { db } from '../../config/database.js';
import { repositories, starRequests, matchingQueue } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { Request, Response, Handler } from '../types.js';

export const createStarRequest: Handler = async (req: Request, res: Response) => {
  const { repoUrl } = req.body;
  const userId = req.user!.userId;

  try {
    const repoMatch = repoUrl.match(/github\.com\/([\w-]+)\/([\w.-]+)/);
    if (!repoMatch) {
      res.error('Invalid GitHub repository URL', 400);
      return;
    }

    const [owner, repoName] = [repoMatch[1], repoMatch[2]];
    const githubRepoId = `${owner}/${repoName}`;

    const [repo] = await db
      .insert(repositories)
      .values({
        userId,
        githubRepoId,
        repoName,
        repoUrl,
      })
      .onConflictDoNothing()
      .returning();

    const repoId = repo?.id || (await db.select().from(repositories).where(eq(repositories.githubRepoId, githubRepoId)))[0].id;

    const [request] = await db
      .insert(starRequests)
      .values({
        userId,
        repositoryId: repoId,
        status: 'pending',
      })
      .returning();

    res.json({ requestId: request.id, status: request.status }, 201);
  } catch (error) {
    console.error('Create star request error:', error);
    res.error('Failed to create star request', 500);
  }
};

export const getMatches: Handler = async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  try {
    const userRequests = await db
      .select()
      .from(starRequests)
      .where(eq(starRequests.userId, userId));

    const requestIds = userRequests.map((r: any) => r.id);

    const matches = await db
      .select({
        id: matchingQueue.id,
        requestId: matchingQueue.requestId,
        matchedWithRequestId: matchingQueue.matchedWithRequestId,
        matchedAt: matchingQueue.matchedAt,
        status: starRequests.status,
      })
      .from(matchingQueue)
      .leftJoin(starRequests, eq(matchingQueue.requestId, starRequests.id))
      .where(
        and(
          eq(matchingQueue.requestId, requestIds[0])
        )
      );

    res.json({ matches });
  } catch (error) {
    console.error('Get matches error:', error);
    res.error('Failed to retrieve matches', 500);
  }
};
