import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StarRequestForm from '../components/StarRequestForm';

describe('StarRequestForm', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    localStorage.clear();
  });

  it('renders form with input and submit button', () => {
    render(<StarRequestForm />);
    
    expect(screen.getByLabelText(/GitHub Repository URL/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Submit Repository/i })).toBeTruthy();
  });

  it('validates GitHub URL format on submit', async () => {
    render(<StarRequestForm />);
    
    const input = screen.getByLabelText(/GitHub Repository URL/i);
    const button = screen.getByRole('button', { name: /Submit Repository/i });
    
    fireEvent.change(input, { target: { value: 'invalid-url' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid GitHub repository URL/i)).toBeTruthy();
    });
  });

  it('shows error when not authenticated', async () => {
    render(<StarRequestForm />);
    
    const input = screen.getByLabelText(/GitHub Repository URL/i);
    const button = screen.getByRole('button', { name: /Submit Repository/i });
    
    fireEvent.change(input, { target: { value: 'https://github.com/owner/repo' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Not authenticated/i)).toBeTruthy();
    });
  });

  it('submits valid repository URL', async () => {
    localStorage.setItem('github_token', 'test-token');
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        repository: { name: 'repo' }
      })
    });
    
    render(<StarRequestForm />);
    
    const input = screen.getByLabelText(/GitHub Repository URL/i);
    const button = screen.getByRole('button', { name: /Submit Repository/i });
    
    fireEvent.change(input, { target: { value: 'https://github.com/owner/repo' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Successfully submitted/i)).toBeTruthy();
    });
  });

  it('displays error message on API failure', async () => {
    localStorage.setItem('github_token', 'test-token');
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Rate limit exceeded' })
    });
    
    render(<StarRequestForm />);
    
    const input = screen.getByLabelText(/GitHub Repository URL/i);
    const button = screen.getByRole('button', { name: /Submit Repository/i });
    
    fireEvent.change(input, { target: { value: 'https://github.com/owner/repo' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Rate limit exceeded/i)).toBeTruthy();
    });
  });

  it('clears form after successful submission', async () => {
    localStorage.setItem('github_token', 'test-token');
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        repository: { name: 'repo' }
      })
    });
    
    render(<StarRequestForm />);
    
    const input = screen.getByLabelText(/GitHub Repository URL/i) as HTMLInputElement;
    const button = screen.getByRole('button', { name: /Submit Repository/i });
    
    fireEvent.change(input, { target: { value: 'https://github.com/owner/repo' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });
});
