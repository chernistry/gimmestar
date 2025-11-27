import { db } from '../../config/database.js';
import { users, repositories, starRequests, rateLimits } from '../../db/schema.js';
import { eq, and, gte } from 'drizzle-orm';
import { Request, Response, Handler } from '../types.js';
import { GitHubClient } from '../../lib/github-client.js';
import { decrypt } from '../../utils/encryption.js';

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_HOUR = 5;

async function checkRateLimit(userId: number): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW);
  
  const [limit] = await db
    .select()
    .from(rateLimits)
    .where(
      and(
        eq(rateLimits.userId, userId),
        eq(rateLimits.action, 'star_request'),
        gte(rateLimits.windowStart, windowStart)
      )
    );

  if (limit && limit.count >= MAX_REQUESTS_PER_HOUR) {
    return false;
  }

  if (limit) {
    await db
      .update(rateLimits)
      .set({ count: limit.count + 1 })
      .where(eq(rateLimits.id, limit.id));
  } else {
    await db.insert(rateLimits).values({
      userId,
      action: 'star_request',
      count: 1,
      windowStart: new Date()
    });
  }

  return true;
}

export const submitStarRequest: Handler = async (req: Request, res: Response) => {
  const { repoUrl } = req.body;
  const userId = req.user!.userId;

  // Rate limiting
  const allowed = await checkRateLimit(userId);
  if (!allowed) {
    res.error('Rate limit exceeded. Maximum 5 submissions per hour.', 429);
    return;
  }

  // Validate URL format
  const repoMatch = repoUrl.match(/^https:\/\/github\.com\/([\w-]+)\/([\w.-]+)$/);
  if (!repoMatch) {
    res.error('Invalid GitHub repository URL format', 400);
    return;
  }

  const [owner, repoName] = [repoMatch[1], repoMatch[2]];
  const githubRepoId = `${owner}/${repoName}`;

  try {
    // Get user's encrypted token from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      res.error('User not found', 404);
      return;
    }

    const token = decrypt(user.encryptedToken);

    // Verify repository exists via GitHub API
    const client = new GitHubClient({ token });
    const repoData = await client.getRepo(owner, repoName);
    
    if (!repoData) {
      res.error('Repository not found or not accessible', 404);
      return;
    }

    // Check for duplicate submission
    const existing = await db
      .select()
      .from(repositories)
      .where(
        and(
          eq(repositories.githubRepoId, githubRepoId),
          eq(repositories.userId, userId)
        )
      );

    if (existing.length > 0) {
      res.error('Repository already submitted', 409);
      return;
    }

    // Insert repository
    const [repo] = await db
      .insert(repositories)
      .values({
        userId,
        githubRepoId,
        repoName,
        repoUrl,
        starsCount: repoData.stargazers_count || 0
      })
      .returning();

    // Create star request
    const [request] = await db
      .insert(starRequests)
      .values({
        userId,
        repositoryId: repo.id,
        status: 'pending'
      })
      .returning();

    res.json({
      success: true,
      requestId: request.id,
      repository: {
        name: repoName,
        url: repoUrl
      },
      status: request.status
    }, 201);
  } catch (error: any) {
    console.error('Submit star request error:', error);
    if (error.message?.includes('404')) {
      res.error('Repository not found', 404);
    } else {
      res.error('Failed to submit star request', 500);
    }
  }
};
