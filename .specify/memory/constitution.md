<!--
Sync Impact Report
==================
Version change: N/A (initial) → 1.0.0
Modified principles: N/A (first ratification)
Added sections:
  - Core Principles: Code Quality, Testing Standards, UX Consistency,
    Performance Requirements
  - Security & Data Integrity
  - Development Workflow & Quality Gates
  - Governance
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md — ✅ compatible (Constitution Check
    section already references constitution gates)
  - .specify/templates/spec-template.md — ✅ compatible (success criteria
    and requirements sections align with principles)
  - .specify/templates/tasks-template.md — ✅ compatible (phase structure
    supports testing-first and polish phases)
Follow-up TODOs: None
-->

# Database Query Tool Constitution

## Core Principles

### I. Code Quality (NON-NEGOTIABLE)

All code committed to this repository MUST meet the following standards:

- **Type Safety**: Backend code MUST pass mypy strict mode. Frontend code
  MUST pass TypeScript strict mode with zero type errors.
- **Linting**: All Python code MUST pass Ruff checks (100 char line limit).
  All TypeScript code MUST pass ESLint with no warnings or errors.
- **API Contract Consistency**: Every Pydantic schema MUST use camelCase
  aliases for JSON serialization. Every corresponding TypeScript type
  MUST mirror the Pydantic schema exactly. Changes to one MUST be
  reflected in the other before merge.
- **Adapter Pattern Compliance**: All database adapters MUST implement
  the `BaseAdapter` abstract class completely. No adapter MAY bypass
  the registry or instantiate connections outside the adapter system.
- **No Dead Code**: Unused imports, variables, functions, and files MUST
  be removed. No commented-out code blocks MAY be committed.
- **Async Discipline**: All I/O-bound operations (database queries,
  external API calls) MUST use async/await. Synchronous blocking calls
  in async code paths are prohibited.

**Rationale**: A full-stack application with multiple database adapters
and a shared API contract requires strict consistency to prevent drift
between frontend and backend, and between database dialects.

### II. Testing Standards

All features and bug fixes MUST include appropriate test coverage:

- **Backend Coverage**: New backend services and API endpoints MUST have
  corresponding pytest tests. Tests MUST cover the happy path and at
  least one error/edge case per endpoint.
- **Frontend Coverage**: New React components with logic (state changes,
  API calls, conditional rendering) MUST have Vitest tests using React
  Testing Library.
- **Adapter Tests**: Any new database adapter or modification to an
  existing adapter MUST include tests that verify query execution,
  metadata extraction, and error handling for that adapter.
- **Integration Points**: Changes to the NL-to-SQL pipeline MUST include
  tests that validate prompt construction and response parsing (mock
  the OpenAI API, do not make live calls in tests).
- **Test Isolation**: Tests MUST NOT depend on external databases or
  services being available. Use in-memory SQLite, mocks, or fixtures.
  Tests MUST be runnable via `make test` with no additional setup.
- **No Skipped Tests**: Tests marked `@pytest.mark.skip` or
  `test.skip()` without an associated tracking issue are prohibited.

**Rationale**: The application connects to multiple database engines
and an external LLM API. Without disciplined test isolation, CI
becomes fragile and developers cannot trust test results.

### III. User Experience Consistency

All user-facing changes MUST conform to the MotherDuck design system
and established interaction patterns:

- **Design Tokens**: UI components MUST use the defined design tokens:
  Sunbeam Yellow (#FFDE00) primary, 2px solid black borders, white
  (#FFFFFF) card backgrounds, beige (#F4EFEA) page background,
  uppercase bold labels with 0.04em letter spacing.
- **Layout Integrity**: The 3-column layout (sidebar, metadata tree,
  editor+results) MUST be preserved. New features MUST integrate into
  the existing layout rather than introducing new page structures
  unless explicitly approved.
- **Feedback & Loading States**: Every user-initiated action that
  involves an API call MUST display a loading indicator. Errors MUST
  be surfaced to the user with actionable messages (not raw stack
  traces or generic "something went wrong").
- **Export Consistency**: All data export operations (CSV, JSON) MUST
  follow the same pattern: trigger from the results table, execute
  client-side, and handle large datasets gracefully (warn if >10k
  rows).
- **Responsive Behavior**: The application MUST remain functional at
  viewport widths down to 1024px. Below that, graceful degradation
  is acceptable but the query editor and results table MUST remain
  usable.

**Rationale**: A database tool used frequently by developers and data
scientists MUST present a predictable, consistent interface. Deviation
from the design system creates cognitive friction and erodes trust.

### IV. Performance Requirements

All features MUST meet the following performance baselines:

- **Query Execution Timeout**: No single query execution MAY exceed
  60 seconds (configurable via `DB_POOL_COMMAND_TIMEOUT`). The UI
  MUST handle timeout gracefully with a clear message.
- **API Response Time**: Backend API endpoints (excluding query
  execution against target databases) MUST respond within 500ms at
  p95 under normal load (single concurrent user).
- **Connection Pool Discipline**: Database connections MUST be acquired
  from and returned to the pool. Leaked connections are a critical
  bug. Connection pool size MUST respect the configured
  `DB_POOL_MAX_SIZE` (default 5).
- **Metadata Cache Utilization**: Schema metadata MUST be served from
  cache when available (24-hour TTL). Metadata endpoints MUST NOT
  query the target database on every request.
- **Frontend Bundle Size**: The production build MUST NOT exceed 1.5MB
  gzipped. New dependencies MUST be justified and their bundle impact
  documented in the PR description.
- **Memory Boundaries**: Client-side data operations (result rendering,
  CSV/JSON export) MUST NOT attempt to hold more than 10,000 rows in
  memory simultaneously. Results exceeding this limit MUST be
  paginated or streamed.

**Rationale**: A database query tool that is itself slow or resource-
hungry undermines its core value proposition. Strict performance
boundaries prevent gradual degradation as features accumulate.

## Security & Data Integrity

The following constraints apply to all code changes:

- **SQL Injection Prevention**: All SQL executed against target databases
  MUST use parameterized queries. String interpolation into SQL
  statements is prohibited.
- **SELECT-Only Enforcement**: The SQL validator MUST reject any query
  that is not a SELECT statement. This validation MUST occur server-
  side; client-side validation alone is insufficient.
- **Credential Handling**: Database connection URLs (which contain
  credentials) MUST NOT be logged at INFO level or above. Credential
  values MUST NOT appear in API responses except the dedicated
  connection detail endpoint.
- **CORS Policy**: The CORS configuration MUST be set to the specific
  frontend origin in production. Wildcard (`*`) is acceptable only
  in development.
- **Dependency Hygiene**: New dependencies MUST NOT have known critical
  or high CVEs at time of introduction. `pip audit` and `npm audit`
  MUST pass with zero high/critical findings before merge.

## Development Workflow & Quality Gates

The following gates MUST pass before any code is merged:

1. **Lint Gate**: `make lint` MUST pass with zero errors and zero
   warnings.
2. **Type Check Gate**: mypy (backend) and TypeScript compiler
   (frontend) MUST report zero errors.
3. **Test Gate**: `make test` MUST pass with all tests green. No
   skipped tests without a tracking issue.
4. **Build Gate**: `make frontend-build` MUST succeed, producing a
   production bundle within the size budget.
5. **Contract Gate**: If API schemas changed, both backend Pydantic
   models and frontend TypeScript types MUST be updated in the same
   changeset.
6. **Review Gate**: All PRs MUST include a description of what changed,
   why, and how to test it. PRs touching adapters or the NL-to-SQL
   pipeline MUST include manual test evidence or new automated tests.

## Governance

This constitution is the authoritative source of non-negotiable
standards for the Database Query Tool project. It supersedes informal
conventions, outdated documentation, and individual preferences.

- **Amendment Process**: Any change to this constitution MUST be
  proposed as a dedicated PR with a clear rationale. Amendments MUST
  update the version number following semantic versioning:
  - MAJOR: Principle removal or redefinition that changes compliance
    requirements.
  - MINOR: New principle or section added, or material expansion of
    existing guidance.
  - PATCH: Clarifications, wording fixes, non-semantic refinements.
- **Compliance Review**: Every PR review MUST verify that changes do
  not violate any principle in this constitution. The Constitution
  Check section in implementation plans MUST reference the current
  version.
- **Conflict Resolution**: If a technical decision conflicts with a
  principle, the principle prevails unless an explicit exception is
  documented in the PR with justification and an expiration date.
- **Runtime Guidance**: Day-to-day development guidance (commands,
  setup, conventions) lives in `CLAUDE.md`. This constitution governs
  the non-negotiable standards that `CLAUDE.md` guidance must respect.

**Version**: 1.0.0 | **Ratified**: 2026-04-14 | **Last Amended**: 2026-04-14
