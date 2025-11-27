# Ticket: 01 Implement Randomized Star Matching Algorithm

Spec version: v1.0

## User Problem
- Users want to exchange GitHub stars but direct "star-for-star" pairing violates GitHub ToS
- Need a compliant mechanism that distributes stars fairly without creating direct reciprocal relationships

## Outcome / Success Signals
- Matching algorithm produces random pairings that avoid direct reciprocity
- Algorithm can be audited to demonstrate ToS compliance
- Unit tests verify randomization and non-reciprocal properties

## Post-Release Observations
- Monitor for any patterns that could be interpreted as automated star-for-star
- Track distribution fairness metrics

## Context
- This implements the core matching logic required by the architecture plan
- Must comply with GitHub ToS: no direct star-for-star pairing
- Uses randomized matching to ensure compliance

## Objective & Definition of Done
Implement a matching algorithm that takes a pool of users requesting star exchanges and produces randomized pairings where no user directly stars another user who stars them back in the same cycle. The algorithm must be deterministic for a given seed but produce different results across cycles.

- Matching function accepts list of users with their repositories
- Returns pairings where User A stars User B's repo, but User B does not star User A's repo in same cycle
- Algorithm includes randomization with configurable seed
- Unit tests verify non-reciprocal property
- Unit tests verify randomization works
- Code is committed to git

## Steps
1. Create `src/matching/` directory structure
2. Implement `RandomMatcher` class with `match(users, seed)` method
3. Add shuffle logic using Fisher-Yates with seeded random
4. Implement pairing logic that creates offset matches (e.g., user[i] -> user[(i+offset) % n])
5. Add validation to ensure no direct reciprocal pairs in output
6. Create test file `src/matching/RandomMatcher.test.js` (or appropriate extension)
7. Write tests:
   - Test that no user pairs are reciprocal in same cycle
   - Test that same seed produces same results
   - Test that different seeds produce different results
   - Test edge cases (empty list, single user, two users)
8. Run tests to verify implementation
9. Commit changes to git with message: "feat: implement randomized star matching algorithm"

## Affected files/modules
- `src/matching/RandomMatcher.js` (or .ts/.py depending on stack)
- `src/matching/RandomMatcher.test.js`
- `src/matching/index.js` (exports)

## Tests
- `npm test` or equivalent test runner command
- Test cases:
  - `should not create reciprocal pairs in same cycle`
  - `should produce deterministic results with same seed`
  - `should produce different results with different seeds`
  - `should handle edge cases (0, 1, 2 users)`
  - `should distribute matches evenly across pool`

## Risks & Edge Cases
- Odd number of users: one user may not receive a match in a cycle
- Single user: cannot match with self
- Two users: will always match each other (handle by requiring minimum pool size or multi-cycle rotation)
- Random seed collision: use timestamp + entropy for production seeds
- Pool exhaustion: if same users repeatedly join, rotation strategy needed

## Dependencies
- Upstream tickets: None (this is foundational)
- Downstream tickets: API endpoint to trigger matching, persistence layer for match results, GitHub API integration to execute stars