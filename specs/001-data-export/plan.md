# Implementation Plan: Data Export

**Branch**: `001-data-export` | **Date**: 2026-04-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-data-export/spec.md`

## Summary

Add data export enhancements to the existing database query tool: refine existing CSV/JSON export with proper NULL handling and UTF-8 BOM, add a combined "Execute & Export" action in the Manual SQL tab, and implement an AI assistant export suggestion after natural language query results. All changes are frontend-only — no backend API changes required.

## Technical Context

**Language/Version**: Python 3.12 (backend, unchanged), TypeScript + React 18 (frontend, primary)
**Primary Dependencies**: React, Ant Design, Vite, Axios (frontend); FastAPI (backend, unchanged)
**Storage**: N/A (export is client-side, in-memory)
**Testing**: Vitest + React Testing Library (frontend)
**Target Platform**: Web browser (Chrome, Firefox, Edge, Safari)
**Project Type**: Web application (full-stack, frontend-only changes)
**Performance Goals**: Export ≤3s for 1,000 rows; AI suggestion appears <1s after results
**Constraints**: Frontend bundle <1.5MB gzipped; <10,000 rows in memory
**Scale/Scope**: Single user, typical export ≤1,000 rows

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality — Type Safety | PASS | All new code in TypeScript strict mode |
| I. Code Quality — Linting | PASS | ESLint rules apply to all new files |
| I. Code Quality — API Contract | PASS | No API schema changes; frontend-only |
| I. Code Quality — Adapter Pattern | PASS | No adapter changes |
| I. Code Quality — No Dead Code | PASS | Existing export code refactored, not duplicated |
| I. Code Quality — Async Discipline | PASS | No new I/O operations; export is synchronous client-side |
| II. Testing — Frontend Coverage | PASS | New export utility and suggestion component will have Vitest tests |
| II. Testing — Test Isolation | PASS | No external service dependencies in tests |
| III. UX — Design Tokens | PASS | MotherDuck design tokens applied to new UI elements |
| III. UX — Layout Integrity | PASS | Integrates into existing Results Card; no new pages |
| III. UX — Feedback & Loading | PASS | Execute & Export shows loading during query execution |
| III. UX — Export Consistency | PASS | Follows constitution: trigger from results, client-side, warn >10k rows |
| III. UX — Responsive | PASS | New buttons integrate into existing responsive layout |
| IV. Performance — Bundle Size | PASS | No new dependencies; pure code additions |
| IV. Performance — Memory | PASS | Uses existing result data in memory; no additional buffering |
| Security — SQL Injection | PASS | No new SQL execution paths |
| Security — Credentials | PASS | No credential handling changes |
| Workflow — All Gates | PASS | lint + typecheck + test + build must pass before merge |

**Gate Result**: ALL PASS — no violations, no complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-data-export/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (empty — no API changes)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── pages/
│   │   └── Home.tsx                    # MODIFY: Add Execute & Export button, NL query source tracking, AI suggestion
│   ├── components/
│   │   ├── ResultTable.tsx             # UNCHANGED (display-only component)
│   │   ├── NaturalLanguageInput.tsx    # UNCHANGED
│   │   └── ExportSuggestion.tsx        # NEW: AI assistant export suggestion component
│   └── utils/
│       └── export.ts                   # NEW: Extract & enhance export logic (CSV with BOM, JSON with null, shared helpers)
└── src/__tests__/
    ├── utils/
    │   └── export.test.ts              # NEW: Unit tests for export utilities
    └── components/
        └── ExportSuggestion.test.tsx   # NEW: Component tests for AI suggestion
```

**Structure Decision**: Web application structure (frontend/ + backend/). All changes are in `frontend/src/`. Export logic extracted from Home.tsx into a dedicated utility module for testability. AI suggestion is a new component for separation of concerns.

## Implementation Details

### Phase 1: Core Export Enhancement (P1)

**Goal**: Refine existing CSV/JSON export with proper NULL handling and UTF-8 BOM.

**Changes**:

1. **Create `frontend/src/utils/export.ts`**:
   - Extract `exportToCSV()` and `exportToJSON()` from Home.tsx (lines 139-222)
   - Add UTF-8 BOM (`\uFEFF`) prefix to CSV output for spreadsheet compatibility
   - Handle NULL values: CSV → empty field; JSON → `null` (not `"null"` string)
   - Ensure RFC 4180 compliance: proper quoting, escaping of commas/quotes/newlines
   - Export shared `downloadFile()` helper (Blob creation, URL.createObjectURL, auto-click)
   - Accept `QueryResult` as input, return void (triggers browser download)
   - Handle empty results: return early with warning message if `rows.length === 0`

2. **Modify `frontend/src/pages/Home.tsx`**:
   - Replace inline export functions with imports from `utils/export.ts`
   - Remove duplicated export logic (~80 lines)
   - Preserve existing large dataset warning (>10k rows) using `Modal.confirm`

### Phase 2: Execute & Export (P2)

**Goal**: Add one-click "Execute & Export" in Manual SQL tab.

**Changes**:

1. **Modify `frontend/src/pages/Home.tsx`**:
   - Add `handleExecuteAndExport(format: 'csv' | 'json')` function:
     1. Execute query via existing API call (reuse `handleExecuteQuery` logic)
     2. On success, automatically trigger export in selected format
     3. On error, show error message (no export)
   - Add "EXECUTE & EXPORT" dropdown button next to existing "EXECUTE" button in Manual SQL tab:
     - Ant Design `Dropdown.Button` or `Button` with dropdown menu
     - Menu items: "Export as CSV", "Export as JSON"
     - Only visible in Manual SQL tab (not in NL tab, per spec FR-008)
   - Styling: MotherDuck design (uppercase, bold, 2px black border)

### Phase 3: AI Assistant Export Suggestion (P3)

**Goal**: Show AI export suggestion after NL-generated query results.

**Changes**:

1. **Create `frontend/src/components/ExportSuggestion.tsx`**:
   - Renders a styled message card: "Need to export these query results to CSV or JSON?"
   - Two action buttons: "EXPORT CSV" and "EXPORT JSON"
   - Props: `onExportCSV`, `onExportJSON`, `visible`
   - Styled per MotherDuck design system (Sunbeam Yellow accent, 2px black border)
   - Dismissible (user can close it)

2. **Modify `frontend/src/pages/Home.tsx`**:
   - Add state: `isNlGenerated: boolean` — set to `true` when NL generates SQL (in `handleGenerateSQL`), reset to `false` on manual SQL edit
   - After query execution succeeds: if `isNlGenerated && queryResult.rows.length > 0`, show `<ExportSuggestion />`
   - Wire `onExportCSV` / `onExportJSON` to export functions from `utils/export.ts`
   - Do NOT show suggestion when zero results (per spec FR-010)

### Phase 4: Testing

**Goal**: Comprehensive test coverage for all new code.

1. **`frontend/src/__tests__/utils/export.test.ts`**:
   - Test CSV export: headers, data rows, proper escaping (commas, quotes, newlines)
   - Test CSV BOM prefix present
   - Test CSV NULL handling (empty field)
   - Test JSON export: valid JSON array, proper null representation
   - Test empty result handling (no file generated, returns early)
   - Test filename format includes timestamp

2. **`frontend/src/__tests__/components/ExportSuggestion.test.tsx`**:
   - Test renders message text
   - Test CSV button calls onExportCSV
   - Test JSON button calls onExportJSON
   - Test hidden when visible=false
   - Test dismiss closes component

### Phase 5: Polish & Validation

**Goal**: Design system compliance, responsive testing, lint/type/build gates.

1. Verify MotherDuck design tokens on all new UI elements
2. Test at 1024px viewport width
3. Run `make lint`, `make test`, `make frontend-build`
4. Manual testing: execute queries, export CSV/JSON, verify file contents
5. Verify bundle size remains <1.5MB gzipped
