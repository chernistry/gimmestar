'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { validateState, exchangeCodeForToken } from '../utils/github-oauth';

function CallbackContent() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code || !state) {
        setError('Missing code or state parameter');
        return;
      }

      if (!validateState(state)) {
        setError('Invalid state parameter');
        return;
      }

      try {
        const token = await exchangeCodeForToken(code);
        await login(token);
        router.push('/');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    }

    handleCallback();
  }, [searchParams, login, router]);

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <button onClick={() => router.push('/login')}>Try Again</button>
      </div>
    );
  }

  return <div style={{ padding: '20px', textAlign: 'center' }}>Authenticating...</div>;
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
