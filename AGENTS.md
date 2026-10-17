# FlockMitra — Project Instructions

## Product
FlockMitra is an Android-first poultry farm management app for India.
Tagline: "Your trusted companion for smarter poultry farming."

Support multiple poultry types, Marathi and English, farm owners and
workers, and farms with unreliable internet connectivity.

## Current stack
- React Native
- Expo
- TypeScript
- Expo SQLite for local persistence
- Supabase/PostgreSQL for cloud sync and authentication (when introduced)
- i18next for Marathi and English (when introduced)

Do not add dependencies until the feature needs them. Check compatibility
with the installed Expo SDK before installing React Native packages.

## Architecture principles
1. Offline-first: essential farm operations must work without internet.
2. Local records are the source for immediate UI updates.
3. Queue cloud changes for retry when connectivity returns.
4. Design synchronization for retries, duplicate delivery and conflicts.
5. Use UUIDs for records created offline.
6. Never use last-write-wins blindly for money, bird movements or stock movements.
7. Keep business rules and calculations separate from UI components.
8. Use TypeScript strictness and explicit types.
9. Keep components small and easy to test.
10. Support Marathi and English without hardcoding user-facing strings.

## Poultry data integrity
Calculate closing bird count as:

closing = opening + additions + transfers_in
          - deaths - culls - sales - transfers_out

Validate movements and prevent impossible negative stock or bird counts.
Use transactions when a logical operation updates multiple related records.
Store dates and units consistently; make timezone and unit assumptions explicit.

## Batch-entry and daily-report workflow
- Enter initial batch details once, when the batch is created (poultry type,
  source, initial bird count, start date, and other static attributes).
- A daily report references an existing batch. Never ask the user to re-enter
  static batch information on daily forms; read it from the batch record.
- The first day's opening bird count comes from the batch's initial bird count.
- Later opening counts derive from the previous day's saved closing count.
  Handle gaps and corrections explicitly:
  - Missing past report: the next report must not silently treat the missing
    day as zero. Flag the gap and let the user fill it in or consciously
    carry the count forward.
  - Correction to a past report: recalculate affected later opening/closing
    counts and surface the impact; never rewrite history silently.
- Closing count is always calculated with the formula above from recorded
  movements. Never silently accept negative stock.
- Daily reports capture only relevant daily changes and observations
  (movements, mortality, feed, production, health notes) — not batch-level
  static data.
- This workflow is offline-first: all entry, validation and recalculation
  must work without network, consistent with the architecture, security,
  localization and testing rules above.

## Batch closure and final reporting
- Batch lifecycle: active → closing review → completed/archived.
- Closing a batch requires explicit user confirmation and a review of final
  bird counts and any outstanding inconsistencies.
- After closure, generate a batch summary covering the full lifecycle:
  bird movements, daily report history, mortality and survival, feed and
  production metrics where applicable, health/vaccination history, expenses,
  sales revenue, and profit/loss based on recorded data.
- Summary metrics are conditional on the data available and the poultry
  type. Never fabricate missing values and never interpret missing reports
  as zero; mark unknown values as unknown.
- Completed batches are read-only by default. They remain inspectable and
  searchable; corrections go through an explicit, auditable correction
  workflow.
- Reconcile final bird counts and financial totals before presenting the
  report. Show unresolved discrepancies rather than hiding them.
- Support viewing the report in-app; plan PDF or spreadsheet export later.

## Security
- Never commit API secrets, passwords, private keys or real farm data.
- Never ship a Supabase service-role key in the mobile app.
- Enforce authorization on the server/database, not only in the UI.
- Scope farm data to the authenticated user's authorized farm membership.
- Validate all input at trust boundaries.
- Do not log sensitive farm or user information unnecessarily.

## AI features
- AI is optional assistance, not a dependency for essential calculations.
- Treat model output as untrusted and validate structured responses.
- Do not claim a poultry disease diagnosis from a photo or symptoms.
- Explain uncertainty and recommend a qualified veterinarian for serious
  illness, sudden mortality or urgent animal-welfare concerns.
- Never execute AI-proposed database changes without validation and
  appropriate user confirmation.
- Confirm extracted invoice or receipt details before saving them.

## Development workflow
- Inspect existing code before editing it.
- Prefer small, focused changes over broad rewrites.
- Do not replace the app scaffold without a clear reason.
- Do not silently change dependencies, architecture or database schemas.
- Add tests for calculations, validation and synchronization logic.
- Run relevant tests, TypeScript checks and Expo Doctor after meaningful changes.
- Report what changed, commands run, results, and remaining risks honestly.
- Ask before destructive operations or changes involving credentials or external
  services.
- Do not commit changes unless explicitly asked.

## Working with agents
- Architect: review design and identify risks before major implementation.
- Mobile: own Expo, React Native, UI and mobile integration.
- Backend/data: own schema, validation, persistence and synchronization.
- AI: own model integration, structured outputs and safety boundaries.
- QA/security: independently review correctness, tests and security.
- Coordinate shared files and avoid simultaneous conflicting edits.
