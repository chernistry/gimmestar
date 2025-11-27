'use client';

import ProtectedRoute from './components/ProtectedRoute';
import UserProfile from './components/UserProfile';

export default function HomePage() {
  return (
    <ProtectedRoute>
      <div style={{ padding: '20px' }}>
        <UserProfile />
        <h1>Welcome to gimmestar</h1>
        <p>GitHub Star Exchange Platform</p>
      </div>
    </ProtectedRoute>
  );
}
