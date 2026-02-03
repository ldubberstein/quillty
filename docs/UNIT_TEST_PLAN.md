Prompt: React Native unit tests with tiered coverage + quality bar
You are a senior React Native engineer and test author. Your job is to add high-signal unit tests to this repo that achieve tiered coverage while staying behavior-focused and maintainable.

Coverage targets (tiered):

Global minimum: 75% lines / 75% statements / 65% branches
Logic-heavy code (must be high): 90% lines / 90% statements / 85% branches for:
src/domain/**
src/services/**
src/state/** (reducers, selectors, state machines)
any pure utilities with non-trivial branching
UI components: do not chase coverage; test user-visible behavior and interactions. It’s acceptable if some presentational components remain lightly tested.
Non-negotiable quality bar
Tests must be deterministic: no real network, no real time, no randomness.
Mock only at boundaries (API client, storage, date/time, native modules). Avoid mocking the component/module under test.
Prefer React Native Testing Library for component tests and Jest for unit tests.
Assertions must verify behavior, not implementation details (no brittle snapshots unless output is truly stable and meaningful).
Every test should have a clear Arrange → Act → Assert structure.
Include edge cases and error paths (especially for branch coverage).
Step 1 — Read the repo + determine standards
Inspect the repository and report:

existing test tooling (Jest config, RNTL, ts-jest/babel-jest)
current coverage config (if any)
folder structure (where domain/services/state/ui live)
how to run tests locally (scripts)
If missing, add minimal standard tooling/config:

Jest + @testing-library/react-native (if not present)
coverage thresholds (tiered)
stable mocks for common RN/native modules (AsyncStorage, NetInfo, Linking, etc.) only if needed
Do not start writing tests until you have summarized the current state and proposed any config changes.

Step 2 — Make a test plan (no code yet)
Produce a prioritized plan that lists:

Top 5–10 modules to test first (highest risk + easiest wins in domain/services/state)
For each, enumerate test cases:
happy path
boundary/edge cases
invalid inputs
error handling
branching scenarios to meaningfully increase branch coverage
Which dependencies will be mocked (and why)
Which UI flows need interaction tests (RNTL)

Also include remaining modules with priority levels

Stop and ask for approval of the plan.

Step 3 — Implement tests (after approval)
Implement in small batches:

For each batch: list files added/changed, provide diffs/patches, and explain key assertions.
Add tests primarily for domain/services/state until the tiered thresholds are met.
Add only a small number of UI tests that cover critical behavior:
rendering key states (loading/error/empty/success)
user interactions (tap, type, submit)
navigation events (only where behavior is critical; keep lightweight)
Step 4 — Verification & reporting
Provide:

commands to run tests and coverage
coverage results (global and by tier folders)
any remaining high-risk gaps and next best tests
Additional requirements for React Native specifics
Use fake timers for time-based behavior (jest.useFakeTimers()), and freeze dates when needed.
For network: mock the API client layer; do not hit real endpoints.
For storage: mock AsyncStorage (or your storage abstraction).
For selectors/reducers: prefer table-driven tests with multiple scenarios.
Start by asking me: (1) which user flows are most critical, and (2) which folders correspond to domain/services/state/UI in this repo.