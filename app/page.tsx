'use client';

import Link from 'next/link';
import ProtectedRoute from './components/ProtectedRoute';
import UserProfile from './components/UserProfile';

export default function HomePage() {
  return (
    <ProtectedRoute>
      <div style={{ padding: '20px' }}>
        <UserProfile />
        <h1>Welcome to gimmestar</h1>
        <p>GitHub Star Exchange Platform</p>
        <nav style={{ marginTop: '20px' }}>
          <Link href="/dashboard" style={{ padding: '10px 20px', background: '#0070f3', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
            Go to Dashboard
          </Link>
        </nav>
      </div>
    </ProtectedRoute>
  );
}
