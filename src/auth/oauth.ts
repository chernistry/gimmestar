import { randomBytes, createHash } from 'crypto';

const GITHUB_OAUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const SCOPES = ['read:user', 'read:repo', 'write:star'];

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

interface OAuthState {
  state: string;
  codeVerifier: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

function getConfig(): OAuthConfig {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL;

  if (!clientId || !clientSecret || !callbackUrl) {
    throw new Error('GitHub OAuth configuration missing');
  }

  return { clientId, clientSecret, callbackUrl };
}

function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

export function initiateOAuth(): { url: string; state: OAuthState } {
  const config = getConfig();
  const state = randomBytes(16).toString('hex');
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    scope: SCOPES.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return {
    url: `${GITHUB_OAUTH_URL}?${params.toString()}`,
    state: { state, codeVerifier },
  };
}

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<string> {
  const config = getConfig();

  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.callbackUrl,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    throw new Error(`OAuth token exchange failed: ${response.status}`);
  }

  const data = (await response.json()) as TokenResponse;

  if (!data.access_token) {
    throw new Error('No access token in response');
  }

  return data.access_token;
}
