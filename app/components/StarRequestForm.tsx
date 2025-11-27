'use client';

import { useState } from 'react';

export default function StarRequestForm() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateUrl = (url: string): boolean => {
    const pattern = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/;
    return pattern.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateUrl(repoUrl)) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        setError('Not authenticated. Please log in.');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/star-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ repoUrl })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit request');
        return;
      }

      setSuccess(`Successfully submitted ${data.repository.name} for star exchange!`);
      setRepoUrl('');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="star-request-form">
      <h2>Submit Repository for Star Exchange</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="repoUrl">GitHub Repository URL</label>
          <input
            id="repoUrl"
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            disabled={loading}
            required
          />
        </div>
        
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Repository'}
        </button>
      </form>
      
      <p className="info">
        Maximum 5 submissions per hour. Your repository must be public and accessible.
      </p>
    </div>
  );
}
