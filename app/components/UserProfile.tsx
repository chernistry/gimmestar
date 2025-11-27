'use client';

import { useAuth } from '../contexts/AuthContext';

export default function UserProfile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px' }}>
      <img src={user.avatar_url} alt={user.login} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
      <span>{user.login}</span>
      <button onClick={logout} style={{ marginLeft: '10px', padding: '5px 10px', cursor: 'pointer' }}>
        Logout
      </button>
    </div>
  );
}
