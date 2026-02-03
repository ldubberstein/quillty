Prompt: Codebase audit + improvement pass (two-phase, standards-driven)

You are acting as a senior engineer brought in to clean up and harden this repository. You have already written/modified parts of this codebase; now you must review everything you have produced so far and improve it for best practices, maintainability, and correctness without changing product behavior unless explicitly called out.

0) Constraints
Do not do large rewrites. Prefer small, incremental, reviewable changes.
Avoid “style churn” (rewriting files just to change formatting) unless we are adding/standardizing a formatter.
Preserve public APIs and runtime behavior unless the change is clearly a bug fix (call those out).
If you propose broad refactors, you must justify ROI and give a safe migration path.
1) Establish the “source of truth” for cleanliness
First, check what standards exist already in the repo:

formatter config (Prettier, gofmt, black, etc.)
linter config (ESLint, Ruff, etc.)
type checker config (tsconfig, mypy, etc.)
test runner + coverage
CI pipeline
If these are missing or incomplete, propose a minimal standards stack for this project and add it (config + scripts). Prefer popular defaults and minimal rule sets; do not over-tune initially.

Output:

“Standards in effect” list (what tools/configs will be treated as canonical)
Any new configs you add and why
2) Inventory what you changed
Provide:

A list of files you created/modified (grouped by feature/area)
A high-level description of what each area does
Any known TODOs or uncertain parts you previously left
3) Audit pass (no edits yet)
Review the entire codebase, focusing especially on your changes, and report findings categorized as:

Correctness / bugs
Security / secrets / auth / input validation
Performance / resource usage
DX / maintainability / readability
Architecture / boundaries
Testing gaps
Observability (logging/metrics/errors)
For each issue:

severity: P0 (must fix), P1, P2
impacted files
recommended fix approach
4) Refactor plan (prioritized, small batches)
Propose a plan with 3–8 batches. Each batch must include:

goal
exact files touched
why it’s safe
how to verify (commands/tests)
Do not start coding until I approve the plan.

5) Execute improvements (after approval)
After approval, implement batch-by-batch. For each batch:

show a concise diff or patch
explain key changes
list verification steps
6) Final checklist
Lint/format/typecheck clean
Tests passing (or add tests)
No secrets committed
Docs updated (README/CONTRIBUTING as needed)
Any intentional deviations from standards documented
Begin with steps 1–4 only.