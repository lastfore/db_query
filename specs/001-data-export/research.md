# Research: Data Export

**Feature**: 001-data-export | **Date**: 2026-04-15

## Research Summary

No NEEDS CLARIFICATION items were identified in the Technical Context — the existing codebase provides all necessary information. Research focused on best practices for the three implementation areas.

## Decision 1: Export Architecture (Client-Side vs Server-Side)

**Decision**: Client-side only. No new backend endpoints.

**Rationale**:
- Existing CSV/JSON export in `Home.tsx` (lines 139-222) already works client-side
- Query results are already fully loaded in browser memory (up to 1,000 rows default limit)
- No benefit to round-tripping data to server for formatting when it's already available in browser
- Constitution (Section III) explicitly states: "trigger from the results table, execute client-side"
- Eliminates backend complexity, testing burden, and API contract changes

**Alternatives considered**:
- Server-side export endpoint (POST /api/v1/dbs/{name}/query/export): Rejected — adds unnecessary backend complexity, doesn't improve UX for the current data volume cap
- Streaming server-side export for large datasets: Rejected — current 1,000-row default limit makes this unnecessary; if limit increases in future, can revisit

## Decision 2: UTF-8 BOM for CSV

**Decision**: Prepend UTF-8 BOM (`\uFEFF`) to all CSV exports.

**Rationale**:
- Microsoft Excel requires BOM to correctly detect UTF-8 encoding for CSV files
- Without BOM, Excel defaults to ANSI encoding, causing garbled characters for non-ASCII data (Chinese, Japanese, accented characters)
- BOM is invisible in UTF-8 text and ignored by most other tools (Google Sheets, pandas, Numbers)
- Spec FR-004 explicitly requires "UTF-8 encoding with BOM for spreadsheet compatibility"

**Alternatives considered**:
- No BOM: Rejected — Excel compatibility is critical for the target user base (data scientists, analysts)
- Optional BOM toggle: Rejected — unnecessary complexity; BOM causes no issues in non-Excel tools

## Decision 3: NULL Value Representation

**Decision**: CSV: empty field (`,,`); JSON: `null` literal.

**Rationale**:
- Per spec clarification (Session 2026-04-15), user confirmed this approach
- Empty CSV fields are the standard representation for missing data (RFC 4180 compatible)
- JSON `null` is the native way to represent absence of a value
- Current code (`Home.tsx` line 29-40) renders NULL as styled "NULL" text in the UI table, but export should use data-standard representations

**Alternatives considered**:
- CSV: literal "NULL" string: Rejected — ambiguous with actual string value "NULL"
- JSON: omit key entirely: Rejected — downstream tools expect consistent key presence across all rows

## Decision 4: "Execute & Export" UI Pattern

**Decision**: Ant Design `Dropdown` with two menu items attached to a secondary button next to the existing EXECUTE button.

**Rationale**:
- Fits naturally alongside the existing EXECUTE button without disrupting the current layout
- Dropdown allows format selection (CSV/JSON) as part of the click action
- Uses existing Ant Design components — no new dependency
- Manual SQL tab only (per spec clarification)

**Alternatives considered**:
- Modal dialog after clicking a single "Execute & Export" button: Rejected — adds an extra click, contradicts "one-click" spec requirement
- Two separate buttons ("Execute & Export CSV", "Execute & Export JSON"): Rejected — takes too much horizontal space and clutters the UI

## Decision 5: AI Export Suggestion UI Pattern

**Decision**: Inline alert-style card rendered between the results table and the export buttons, with two action buttons and a dismiss option.

**Rationale**:
- Appears contextually near the results (where the user is already looking)
- Non-intrusive (not a modal or toast) — user can ignore and continue
- Dismissible — respects user control
- Only shown for NL-generated queries with results (per spec FR-009, FR-010)
- Tracks NL origin via frontend state flag (`isNlGenerated`), avoiding backend changes

**Alternatives considered**:
- Toast notification: Rejected — transient; user might miss it
- Modal dialog: Rejected — too intrusive for a suggestion
- Chat-bubble AI assistant UI: Rejected — no existing chat UI pattern in the app; would be a significant new UI component
