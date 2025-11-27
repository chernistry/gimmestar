import { db } from '../../config/database.js';
import { users, repositories, starRequests, matchingQueue } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { Request, Response, Handler } from '../types.js';

export const getDashboard: Handler = async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  try {
    const userRepos = await db
      .select({
        id: repositories.id,
        repoName: repositories.repoName,
        repoUrl: repositories.repoUrl,
        starsCount: repositories.starsCount,
      })
      .from(repositories)
      .where(eq(repositories.userId, userId));

    const userRequests = await db
      .select({
        id: starRequests.id,
        repositoryId: starRequests.repositoryId,
        status: starRequests.status,
        createdAt: starRequests.createdAt,
      })
      .from(starRequests)
      .where(eq(starRequests.userId, userId));

    const reposWithEnrollment = userRepos.map((repo) => ({
      ...repo,
      enrolled: userRequests.some((req) => req.repositoryId === repo.id),
    }));

    const requestsWithRepoNames = await Promise.all(
      userRequests.map(async (req) => {
        const [repo] = await db
          .select({ repoName: repositories.repoName })
          .from(repositories)
          .where(eq(repositories.id, req.repositoryId));
        return {
          id: req.id,
          repositoryName: repo?.repoName || 'Unknown',
          status: req.status,
          createdAt: req.createdAt,
        };
      })
    );

    const requestIds = userRequests.map((r) => r.id);
    const userMatches = requestIds.length > 0
      ? await db
          .select({
            id: matchingQueue.id,
            requestId: matchingQueue.requestId,
            matchedWithRequestId: matchingQueue.matchedWithRequestId,
            matchedAt: matchingQueue.matchedAt,
          })
          .from(matchingQueue)
          .where(eq(matchingQueue.requestId, requestIds[0]))
      : [];

    const matchesWithDetails = await Promise.all(
      userMatches.map(async (match) => {
        const [yourRequest] = await db
          .select({ repositoryId: starRequests.repositoryId })
          .from(starRequests)
          .where(eq(starRequests.id, match.requestId));

        const [theirRequest] = match.matchedWithRequestId
          ? await db
              .select({ repositoryId: starRequests.repositoryId })
              .from(starRequests)
              .where(eq(starRequests.id, match.matchedWithRequestId))
          : [null];

        const [yourRepo] = yourRequest
          ? await db
              .select({ repoName: repositories.repoName })
              .from(repositories)
              .where(eq(repositories.id, yourRequest.repositoryId))
          : [null];

        const [theirRepo] = theirRequest
          ? await db
              .select({ repoName: repositories.repoName })
              .from(repositories)
              .where(eq(repositories.id, theirRequest.repositoryId))
          : [null];

        return {
          id: match.id,
          yourRepo: yourRepo?.repoName || 'Unknown',
          theirRepo: theirRepo?.repoName || 'Unknown',
          matchedAt: match.matchedAt,
          status: 'completed',
        };
      })
    );

    res.json({
      repositories: reposWithEnrollment,
      requests: requestsWithRepoNames,
      matches: matchesWithDetails,
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.error('Failed to retrieve dashboard data', 500);
  }
};
