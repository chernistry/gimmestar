const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'ENCRYPTION_KEY',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'SESSION_SECRET',
] as const;

export function validateEnvironment(): void {
  const missing: string[] = [];

  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check .env.example for required configuration.'
    );
  }

  // Validate ENCRYPTION_KEY format
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey) {
    try {
      const keyBuffer = Buffer.from(encryptionKey, 'base64');
      if (keyBuffer.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be 32 bytes when base64 decoded');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('32 bytes')) {
        throw error;
      }
      throw new Error('ENCRYPTION_KEY must be a valid base64-encoded 32-byte key');
    }
  }

  // Validate SESSION_SECRET format
  const sessionSecret = process.env.SESSION_SECRET;
  if (sessionSecret) {
    let secretBuffer: Buffer;
    try {
      secretBuffer = Buffer.from(sessionSecret, 'base64');
    } catch (error) {
      throw new Error('SESSION_SECRET must be a valid base64-encoded key');
    }
    
    if (secretBuffer.length < 32) {
      throw new Error('SESSION_SECRET must be at least 32 bytes when base64 decoded');
    }
  }
}
