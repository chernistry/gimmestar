```markdown
# Architect Specification: gimmestar (GitHub Star Exchange)

## Hard Constraints (if applicable)
- GitHub ToS compliance: No direct "star-for-star" pairing; use randomized matching; no automation beyond authorized scopes (`read:user`, `read:repo`, `write:star`, `write:follow` equivalents); exponential backoff on API calls to avoid bans.
- GDPR/PII: Encrypt GitHub tokens

> [!WARNING]
> This document may be incomplete or truncated. Please review manually.