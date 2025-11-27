const STORAGE_KEY = 'gh_token';

export function encryptToken(token: string): string {
  return btoa(token);
}

export function decryptToken(encrypted: string): string {
  return atob(encrypted);
}

export function storeToken(token: string): void {
  const encrypted = encryptToken(token);
  localStorage.setItem(STORAGE_KEY, encrypted);
}

export function getToken(): string | null {
  const encrypted = localStorage.getItem(STORAGE_KEY);
  if (!encrypted) return null;
  return decryptToken(encrypted);
}

export function clearToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}
