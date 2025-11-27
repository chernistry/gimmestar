const SCOPES = ['read:user', 'read:repo', 'write:star'];

function getClientId(): string {
  return process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';
}

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}

export function generateOAuthURL(): string {
  const state = Math.random().toString(36).substring(7);
  sessionStorage.setItem('oauth_state', state);
  
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: `${getApiUrl()}/callback`,
    scope: SCOPES.join(' '),
    state,
  });
  
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export function validateState(state: string): boolean {
  const stored = sessionStorage.getItem('oauth_state');
  sessionStorage.removeItem('oauth_state');
  return stored === state;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await fetch(`${getApiUrl()}/api/auth/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  
  if (!response.ok) throw new Error('Failed to exchange code for token');
  
  const { access_token } = await response.json();
  return access_token;
}
