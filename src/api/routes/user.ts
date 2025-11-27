import { db } from '../../config/database.js';
import { users, starRequests } from '../../db/schema.js';
import { eq, count } from 'drizzle-orm';
import { Request, Response, Handler } from '../types.js';

export const getProfile: Handler = async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  try {
    const [user] = await db
      .select({
        id: users.id,
        githubUsername: users.githubUsername,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      res.error('User not found', 404);
      return;
    }

    const [stats] = await db
      .select({ totalRequests: count() })
      .from(starRequests)
      .where(eq(starRequests.userId, userId));

    res.json({
      user: {
        id: user.id,
        username: user.githubUsername,
        memberSince: user.createdAt,
      },
      stats: {
        totalRequests: stats.totalRequests || 0,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.error('Failed to retrieve profile', 500);
  }
};
