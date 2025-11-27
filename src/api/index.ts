import { Server } from './server.js';
import { authenticate } from './middleware/auth.js';
import { validate, rules } from './middleware/validate.js';
import { handleGitHubCallback } from './routes/auth.js';
import { createStarRequest, getMatches } from './routes/stars.js';
import { getProfile } from './routes/user.js';
import { getDashboard } from './routes/dashboard.js';

export function createApp(): Server {
  const app = new Server();

  // Auth routes
  app.post(
    '/api/auth/github',
    validate({
      code: rules.required,
      codeVerifier: rules.required,
    }),
    handleGitHubCallback
  );

  // Star routes (authenticated)
  app.post(
    '/api/stars/request',
    authenticate,
    validate({
      repoUrl: rules.githubRepo,
    }),
    createStarRequest
  );

  app.get('/api/stars/matches', authenticate, getMatches);

  // User routes (authenticated)
  app.get('/api/user/profile', authenticate, getProfile);
  app.get('/api/dashboard', authenticate, getDashboard);

  return app;
}
