import { describe, it, expect, beforeEach, vi } from 'vitest';
import './setup';
import { encryptToken, decryptToken, storeToken, getToken, clearToken } from '../utils/auth';
import { generateOAuthURL, validateState } from '../utils/github-oauth';

describe('Token Encryption', () => {
  it('should encrypt and decrypt tokens correctly', () => {
    const token = 'test_token_123';
    const encrypted = encryptToken(token);
    expect(encrypted).not.toBe(token);
    expect(decryptToken(encrypted)).toBe(token);
  });
});

describe('Token Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should store and retrieve tokens', () => {
    const token = 'test_token';
    storeToken(token);
    expect(getToken()).toBe(token);
  });

  it('should clear tokens', () => {
    storeToken('test_token');
    clearToken();
    expect(getToken()).toBeNull();
  });

  it('should return null when no token exists', () => {
    expect(getToken()).toBeNull();
  });
});

describe('OAuth URL Generation', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubEnv('NEXT_PUBLIC_GITHUB_CLIENT_ID', 'test_client_id');
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3000');
  });

  it('should generate OAuth URL with correct parameters', () => {
    const url = generateOAuthURL();
    expect(url).toContain('https://github.com/login/oauth/authorize');
    expect(url).toContain('client_id=test_client_id');
    expect(url).toContain('scope=read%3Auser+read%3Arepo+write%3Astar');
    expect(url).toContain('state=');
  });

  it('should store state in sessionStorage', () => {
    generateOAuthURL();
    expect(sessionStorage.getItem('oauth_state')).toBeTruthy();
  });
});

describe('State Validation', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should validate correct state', () => {
    const state = 'test_state';
    sessionStorage.setItem('oauth_state', state);
    expect(validateState(state)).toBe(true);
  });

  it('should reject incorrect state', () => {
    sessionStorage.setItem('oauth_state', 'correct_state');
    expect(validateState('wrong_state')).toBe(false);
  });

  it('should clear state after validation', () => {
    const state = 'test_state';
    sessionStorage.setItem('oauth_state', state);
    validateState(state);
    expect(sessionStorage.getItem('oauth_state')).toBeNull();
  });
});
