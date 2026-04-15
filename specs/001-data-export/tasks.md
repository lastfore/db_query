# Tasks: Data Export

**Input**: Design documents from `/specs/001-data-export/`  
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md); optional: [data-model.md](data-model.md), [research.md](research.md), [quickstart.md](quickstart.md), [contracts/README.md](contracts/README.md)

**Tests**: Included per [plan.md](plan.md) Phase 4 (Vitest + RTL for new utils and component).

**Organization**: Tasks are grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label ([US1], [US2], [US3])
- Descriptions include exact file paths

## Path Conventions

Web app: `frontend/src/`, tests under `frontend/src/__tests__/`. No backend code changes per [contracts/README.md](contracts/README.md).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm environment and baseline code before refactor.

- [X] T001 Verify install and DB setup per `specs/001-data-export/quickstart.md` by running `make install` and `make setup` from repository root
- [X] T002 [P] Review current manual export and query types in `frontend/src/pages/Home.tsx` (export handlers ~lines 139–222) and shared types in `frontend/src/types/query.ts` against `specs/001-data-export/data-model.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Confirm no API work and test runner layout before user stories.

**CRITICAL**: Complete before starting user-story implementation.

- [X] T003 [P] Confirm no new export endpoints are required by reconciling `specs/001-data-export/contracts/README.md` with existing routes in `backend/app/api/v1/queries.py` (read-only; no edits expected)

**Checkpoint**: Foundation ready — user story work may begin (US1 first for shared export utilities).

---

## Phase 3: User Story 1 - Export Query Results to File (Priority: P1) — MVP

**Goal**: Refine CSV/JSON export (BOM, NULL handling, RFC 4180, filenames) and keep manual export UX in the results area.

**Independent Test**: Execute a query with rows → export CSV/JSON → verify file content, BOM, NULLs, escaping; zero rows → message and no file ([spec.md](spec.md) US1).

### Implementation for User Story 1

- [X] T004 [P] [US1] Implement `exportQueryResultToCsv`, `exportQueryResultToJson`, shared `downloadFile` / filename builder in `frontend/src/utils/export.ts` per `specs/001-data-export/data-model.md` (UTF-8 BOM on CSV, empty CSV fields for NULL, JSON `null`, RFC 4180 quoting, `{databaseName}_{YYYYMMDD}_{HHMMSS}.{ext}`)
- [X] T005 [US1] Refactor `frontend/src/pages/Home.tsx` to import `QueryResult` from `frontend/src/types/query.ts`, replace inline CSV/JSON export with calls to `frontend/src/utils/export.ts`, and remove duplicate local `QueryResult` interface
- [X] T006 [US1] Preserve large-result `Modal.confirm` warning for exports when `queryResult.rows.length > 10000` in `frontend/src/pages/Home.tsx` wired to the new export helpers
- [X] T007 [US1] Ensure empty-result path shows a clear message and does not create a download in `frontend/src/pages/Home.tsx` per FR-007

**Checkpoint**: Manual export from results matches FR-001–FR-007 and data-model transforms.

---

## Phase 4: User Story 2 - One-Click Query and Export (Priority: P2)

**Goal**: Manual SQL tab only — run query then auto-download CSV or JSON in one flow; errors skip export.

**Independent Test**: Manual tab → valid SQL → Execute & Export → file downloads; invalid SQL → error only; NL tab → no Execute & Export control ([spec.md](spec.md) US2).

### Implementation for User Story 2

- [X] T008 [US2] Add `handleExecuteAndExport` in `frontend/src/pages/Home.tsx` that POSTs to `/api/v1/dbs/${selectedDatabase}/query` with current SQL, updates `queryResult` on success, then calls `frontend/src/utils/export.ts` for the chosen format; on failure show error and do not export
- [X] T009 [US2] Add MotherDuck-styled `Dropdown` / `Dropdown.Button` (uppercase, bold, 2px black border) for “EXECUTE & EXPORT” with “Export as CSV” and “Export as JSON” next to the existing execute control in `frontend/src/pages/Home.tsx`
- [X] T010 [US2] Show Execute & Export only when `activeTab === 'manual'` in `frontend/src/pages/Home.tsx` per FR-008
- [X] T011 [US2] Apply loading/disabled state to Execute & Export while the query request is in flight in `frontend/src/pages/Home.tsx` per UX feedback in `specs/001-data-export/plan.md`

**Checkpoint**: P2 acceptance scenarios pass independently of P3 UI.

---

## Phase 5: User Story 3 - AI Assistant Suggests Export (Priority: P3)

**Goal**: After NL-generated SQL runs with non-empty results, show dismissible suggestion card with CSV/JSON actions; hide for zero rows and non-NL runs.

**Independent Test**: NL generate → execute with rows → suggestion visible → export works; zero rows or manual SQL → no suggestion ([spec.md](spec.md) US3).

### Implementation for User Story 3

- [X] T012 [P] [US3] Create `frontend/src/components/ExportSuggestion.tsx` with copy “Need to export these query results to CSV or JSON?”, EXPORT CSV / EXPORT JSON actions, dismiss control, `visible` prop, MotherDuck styling (Sunbeam accent, 2px black border)
- [X] T013 [US3] Add `isNlGenerated` (set `true` in `handleGenerateSQL` in `frontend/src/pages/Home.tsx`, reset `false` when user edits SQL via `SqlEditor` / `setSql` paths) and state for suggestion visibility/dismiss
- [X] T014 [US3] After successful execute, render `ExportSuggestion` from `frontend/src/components/ExportSuggestion.tsx` when `isNlGenerated && queryResult && queryResult.rows.length > 0` inside `frontend/src/pages/Home.tsx` per FR-009 and FR-010
- [X] T015 [US3] Wire suggestion buttons to `frontend/src/utils/export.ts` using current `queryResult` and `selectedDatabase` in `frontend/src/pages/Home.tsx`, including large-result confirm if still applicable

**Checkpoint**: P3 scenarios pass; US1/US2 remain intact.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Tests, quality gates, manual validation, performance note from plan.

- [X] T016 [P] Add `frontend/src/__tests__/utils/export.test.ts` covering CSV BOM, NULL/escaping, JSON `null`, empty results (no file), and filename pattern per `specs/001-data-export/plan.md`
- [X] T017 [P] Add `frontend/src/__tests__/components/ExportSuggestion.test.tsx` for visible/hidden states, button callbacks, and dismiss per `specs/001-data-export/plan.md`
- [ ] T018 Run `make lint`, `make test-frontend`, and `make frontend-build` from repository root per `specs/001-data-export/quickstart.md`
- [ ] T019 Execute manual scenarios P1–P3 in `specs/001-data-export/quickstart.md` in the browser at `http://localhost:5173`
- [X] T020 [P] Confirm production bundle size remains within the goal in `specs/001-data-export/plan.md` after `make frontend-build` (review `frontend/dist/` assets)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → **User stories (Phases 3–5)** → **Polish (Phase 6)**
- **US2** and **US3** depend on **US1** (shared `frontend/src/utils/export.ts` and integrated `frontend/src/pages/Home.tsx` behavior)

### User Story Completion Order

```text
              US1 (P1)
                 |
 +--------+--------+
        v v
   US2 (P2)          US3 (P3)
        +--------+--------+
                 v
        Polish (Phase 6)
```

- **US1**: Start after Phase 2 — no dependency on US2/US3
- **US2**: Start after US1 — needs export helpers and stable manual export path
- **US3**: Start after US1 — needs export helpers; can run in parallel with US2 if staffed (coordinate `frontend/src/pages/Home.tsx` merges)

### Within Each User Story

- **US1**: Implement `frontend/src/utils/export.ts` before or while wiring `frontend/src/pages/Home.tsx` (T005–T007 follow T004)
- **US2**: Handler (T008) before UI wiring (T009–T011)
- **US3**: Component file (T012) before Home integration (T013–T015)

### Parallel Opportunities

- **Phase 1**: T002 in parallel with environment work (T001 is sequential gate)
- **Phase 2**: T003 standalone [P] with other audits if added
- **US1**: T004 [P] vs preparatory reading (T002 already done)
- **US3**: T012 [P] while US2 is finishing Home.tsx (resolve merge conflicts carefully)
- **Polish**: T016, T017, T020 [P] after Phases 3–5; T018–T019 sequential validation

---

## Parallel Example: User Story 1

```bash
# After Phase 2, implement the shared module before Home refactor:
Task T004: Implement `frontend/src/utils/export.ts`
# Then sequentially on Home.tsx:
Task T005 → T006 → T007
```

## Parallel Example: User Stories 2 and 3 (after US1)

```bash
# Developer A: T008–T011 in `frontend/src/pages/Home.tsx` (Execute & Export)
# Developer B: T012 `frontend/src/components/ExportSuggestion.tsx`, then join for T013–T015
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2  
2. Complete Phase 3 (US1)  
3. **STOP and validate** with `specs/001-data-export/quickstart.md` P1 checks  
4. Demo or release MVP

### Incremental Delivery

1. US1 → validate manual export  
2. US2 → validate Execute & Export (manual tab only)  
3. US3 → validate NL suggestion flow  
4. Polish → tests + gates + manual full pass  

### Parallel Team Strategy

1. Shared: Phases 1–2, then US1  
2. Split: US2 and US3 in parallel with clear ownership of `frontend/src/pages/Home.tsx` sections or short-lived branches with frequent rebases  

---

## Notes

- [P] = different files or independent verification; same-file tasks are not marked [P] together  
- All tasks use checklist format with Task IDs and story labels where required  
- No new backend files; contract is unchanged per `specs/001-data-export/contracts/README.md`  
