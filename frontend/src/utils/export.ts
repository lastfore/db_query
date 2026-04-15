/** Client-side CSV/JSON export helpers for query results. */

import type { QueryResult } from "../types/query";

const CSV_BOM = "\uFEFF";

export function buildExportFilename(databaseName: string, ext: "csv" | "json"): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${databaseName}_${y}${m}${day}_${h}${min}${s}.${ext}`;
}

/** Format one CSV field per RFC 4180; NULL/undefined → empty field. */
export function formatCsvField(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const stringValue = String(value);
  if (/[",\r\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function queryResultToCsvString(result: QueryResult): string {
  const headers = result.columns.map((c) => c.name);
  const lines = [headers.join(",")];
  for (const row of result.rows) {
    const values = headers.map((h) => formatCsvField(row[h]));
    lines.push(values.join(","));
  }
  return lines.join("\n");
}

export function queryResultToJsonString(result: QueryResult): string {
  const keys = result.columns.map((c) => c.name);
  const objects = result.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    for (const key of keys) {
      const v = row[key];
      obj[key] = v === undefined || v === null ? null : v;
    }
    return obj;
  });
  return JSON.stringify(objects, null, 2);
}

export function downloadFile(content: BlobPart, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportQueryResultToCsv(result: QueryResult, databaseName: string): boolean {
  if (result.rows.length === 0) {
    return false;
  }
  const csv = CSV_BOM + queryResultToCsvString(result);
  downloadFile(csv, buildExportFilename(databaseName, "csv"), "text/csv;charset=utf-8;");
  return true;
}

export function exportQueryResultToJson(result: QueryResult, databaseName: string): boolean {
  if (result.rows.length === 0) {
    return false;
  }
  const json = queryResultToJsonString(result);
  downloadFile(json, buildExportFilename(databaseName, "json"), "application/json;charset=utf-8;");
  return true;
}
