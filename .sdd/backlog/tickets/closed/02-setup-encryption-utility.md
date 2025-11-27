# Ticket: 001 Implement Token Encryption Utility

Spec version: v1.0 / Initial Implementation

## User Problem
- GitHub OAuth tokens must be stored securely to comply with GDPR/PII requirements
- Plaintext token storage exposes users to security risks
- Need a reusable encryption/decryption module for sensitive data

## Outcome / Success Signals
- GitHub tokens are encrypted at rest
- Decryption only occurs when needed for API calls
- Encryption key management is secure and documented
- Module is testable and reusable for other sensitive data

## Post-Release Observations
- Monitor for decryption failures
- Track encryption/decryption performance impact
- Verify no plaintext tokens in logs or error messages

## Context
- Addresses hard constraint: "GDPR/PII: Encrypt GitHub tokens"
- Foundation for secure token storage in user database
- Required before implementing GitHub OAuth flow

## Objective & Definition of Done
Create a secure encryption/decryption utility module that handles GitHub OAuth tokens using industry-standard encryption (AES-256-GCM). The module must support encrypting tokens before storage and decrypting them for API usage.

**Definition of Done:**
- Encryption utility module created with encrypt/decrypt functions
- Uses AES-256-GCM or equivalent secure algorithm
- Encryption key loaded from environment variable
- Error handling for invalid keys or corrupted data
- Unit tests achieve >90% coverage
- Documentation includes usage examples and key management guidelines
- All tests pass
- Changes committed to git

## Steps
1. Create `src/utils/encryption.ts` (or appropriate language/path)
2. Implement `encrypt(plaintext: string): string` function using AES-256-GCM
3. Implement `decrypt(ciphertext: string): string` function
4. Add error handling for missing encryption key, invalid input, decryption failures
5. Load encryption key from environment variable (e.g., `ENCRYPTION_KEY`)
6. Add input validation (non-empty strings, proper encoding)
7. Create `tests/utils/encryption.test.ts`
8. Write unit tests:
   - Test successful encryption/decryption round-trip
   - Test decryption of previously encrypted data
   - Test error handling for missing key
   - Test error handling for corrupted ciphertext
   - Test error handling for invalid input types
9. Add `.env.example` entry for `ENCRYPTION_KEY` with generation instructions
10. Document key generation command (e.g., `openssl rand -base64 32`)
11. Run tests and verify all pass
12. Commit changes to git with message: "feat: add token encryption utility with AES-256-GCM"

## Affected files/modules
- `src/utils/encryption.ts` (new)
- `tests/utils/encryption.test.ts` (new)
- `.env.example` (update)
- `README.md` or `docs/security.md` (add key management section)

## Tests
- Unit tests for encryption/decryption functions
- Test commands:
  - `npm test` (Node.js/TypeScript)
  - `pytest tests/utils/test_encryption.py` (Python)
  - `go test ./utils/...` (Go)
- Verify test coverage >90% for encryption module

## Risks & Edge Cases
- **Missing encryption key**: Application should fail fast on startup if key not set
- **Key rotation**: Current implementation doesn't support key rotation (document as future work)
- **Corrupted ciphertext**: Handle gracefully with clear error messages
- **Performance**: Encryption/decryption adds latency; acceptable for token operations
- **Key exposure**: Ensure key never logged or exposed in error messages
- **Encoding issues**: Ensure consistent encoding (UTF-8, Base64) across encrypt/decrypt

## Dependencies
- **Upstream tickets**: None (foundational ticket)
- **Downstream tickets**: 
  - GitHub OAuth implementation
  - User token storage in database
  - Token refresh mechanism