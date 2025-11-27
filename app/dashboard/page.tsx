'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface Repository {
  id: number;
  repoName: string;
  repoUrl: string;
  starsCount: number;
  enrolled: boolean;
}

interface StarRequest {
  id: number;
  repositoryName: string;
  status: string;
  createdAt: string;
}

interface Match {
  id: number;
  yourRepo: string;
  theirRepo: string;
  matchedAt: string;
  status: string;
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [requests, setRequests] = useState<StarRequest[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch dashboard data');

        const data = await response.json();
        setRepos(data.repositories || []);
        setRequests(data.requests || []);
        setMatches(data.matches || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, token, router]);

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Dashboard</h1>

      <section style={{ marginBottom: '40px' }}>
        <h2>Your Repositories</h2>
        {repos.length === 0 ? (
          <p>No repositories enrolled yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {repos.map((repo) => (
              <div key={repo.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
                <h3>{repo.repoName}</h3>
                <p>Stars: {repo.starsCount}</p>
                <p>Status: {repo.enrolled ? '✓ Enrolled' : '○ Not enrolled'}</p>
                <a href={repo.repoUrl} target="_blank" rel="noopener noreferrer">View on GitHub</a>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Star Requests</h2>
        {requests.length === 0 ? (
          <p>No star requests yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {requests.map((req) => (
              <div key={req.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
                <h3>{req.repositoryName}</h3>
                <p>Status: <span style={{ fontWeight: 'bold' }}>{req.status}</span></p>
                <p>Created: {new Date(req.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Match History</h2>
        {matches.length === 0 ? (
          <p>No matches yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {matches.map((match) => (
              <div key={match.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
                <p><strong>Your repo:</strong> {match.yourRepo}</p>
                <p><strong>Their repo:</strong> {match.theirRepo}</p>
                <p>Status: {match.status}</p>
                <p>Matched: {new Date(match.matchedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
