import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { QueryResult } from "../../types/query";
import {
  buildExportFilename,
  formatCsvField,
  queryResultToCsvString,
  queryResultToJsonString,
  exportQueryResultToCsv,
  exportQueryResultToJson,
} from "../../utils/export";

const sampleResult: QueryResult = {
  columns: [
    { name: "id", dataType: "integer" },
    { name: "note", dataType: "text" },
  ],
  rows: [
    { id: 1, note: "plain" },
    { id: null, note: 'say "quote"' },
    { id: 3, note: "a,b" },
  ],
  rowCount: 3,
  executionTimeMs: 12,
  sql: "SELECT1",
};

describe("export utils", () => {
  it("buildExportFilename uses local YYYYMMDD_HHMMSS", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T14:30:22"));
    expect(buildExportFilename("my_postgres", "csv")).toBe("my_postgres_20260415_143022.csv");
    expect(buildExportFilename("my_postgres", "json")).toBe("my_postgres_20260415_143022.json");
    vi.useRealTimers();
  });

  it("formatCsvField leaves plain values unquoted; null/undefined empty", () => {
    expect(formatCsvField(null)).toBe("");
    expect(formatCsvField(undefined)).toBe("");
    expect(formatCsvField(42)).toBe("42");
    expect(formatCsvField("x")).toBe("x");
  });

  it("formatCsvField quotes commas, quotes, newlines per RFC 4180", () => {
    expect(formatCsvField("a,b")).toBe('"a,b"');
    expect(formatCsvField('say "hi"')).toBe('"say ""hi"""');
    expect(formatCsvField("line\nbreak")).toBe('"line\nbreak"');
  });

  it("queryResultToCsvString joins headers and rows", () => {
    const csv = queryResultToCsvString(sampleResult);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("id,note");
    expect(lines[1]).toBe("1,plain");
    expect(lines[2]).toBe(',"say ""quote"""');
    expect(lines[3]).toBe('3,"a,b"');
  });

  it("queryResultToJsonString uses JSON null for SQL null / missing keys", () => {
    const sparse: QueryResult = {
      columns: [{ name: "a", dataType: "int" }],
      rows: [{ a: null }, {}],
      rowCount: 2,
      executionTimeMs: 1,
      sql: "s",
    };
    const parsed = JSON.parse(queryResultToJsonString(sparse)) as unknown[];
    expect(parsed).toEqual([{ a: null }, { a: null }]);
  });

  describe("download triggers", () => {
    const mockLink = () => {
      const el = {
        href: "",
        download: "",
        click: vi.fn(),
      };
      return el;
    };

    beforeEach(() => {
      vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
      vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("exportQueryResultToCsv prepends BOM and sets filename", async () => {
      const link = mockLink();
      vi.spyOn(document, "createElement").mockReturnValue(link as unknown as HTMLAnchorElement);

      exportQueryResultToCsv(sampleResult, "dbx");

      expect(link.download).toMatch(/^dbx_\d{8}_\d{6}\.csv$/);
      expect(link.click).toHaveBeenCalledOnce();

      const blobArg = vi.mocked(URL.createObjectURL).mock.calls[0]![0] as Blob;
      const bytes = new Uint8Array(await blobArg.arrayBuffer());
      // UTF-8 encoding of U+FEFF (Blob.text() often strips this BOM when decoding)
      expect(bytes[0]).toBe(0xef);
      expect(bytes[1]).toBe(0xbb);
      expect(bytes[2]).toBe(0xbf);
      const body = new TextDecoder("utf-8").decode(bytes.slice(3));
      expect(body).toBe(queryResultToCsvString(sampleResult));
    });

    it("exportQueryResultToJson sets .json filename", async () => {
      const link = mockLink();
      vi.spyOn(document, "createElement").mockReturnValue(link as unknown as HTMLAnchorElement);

      exportQueryResultToJson(sampleResult, "dbx");

      expect(link.download).toMatch(/^dbx_\d{8}_\d{6}\.json$/);
      const blob = vi.mocked(URL.createObjectURL).mock.calls[0]![0] as Blob;
      expect(JSON.parse(await blob.text())).toEqual(JSON.parse(queryResultToJsonString(sampleResult)));
    });

    it("export functions return false and skip download for zero rows", () => {
      const empty: QueryResult = {
        columns: [{ name: "x", dataType: "int" }],
        rows: [],
        rowCount: 0,
        executionTimeMs: 0,
        sql: "s",
      };
      const createElement = vi.spyOn(document, "createElement");

      expect(exportQueryResultToCsv(empty, "db")).toBe(false);
      expect(exportQueryResultToJson(empty, "db")).toBe(false);
      expect(createElement).not.toHaveBeenCalled();
    });
  });
});
