import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExportSuggestion } from "../../components/ExportSuggestion";

describe("ExportSuggestion", () => {
  it("renders message and export buttons when visible", () => {
    const onCsv = vi.fn();
    const onJson = vi.fn();
    const onDismiss = vi.fn();

    render(
      <ExportSuggestion
        visible
        onExportCsv={onCsv}
        onExportJson={onJson}
        onDismiss={onDismiss}
      />
    );

    expect(
      screen.getByText("Need to export these query results to CSV or JSON?")
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /export csv/i }));
    fireEvent.click(screen.getByRole("button", { name: /export json/i }));
    expect(onCsv).toHaveBeenCalledOnce();
    expect(onJson).toHaveBeenCalledOnce();
  });

  it("renders nothing when visible is false", () => {
    const { container } = render(
      <ExportSuggestion
        visible={false}
        onExportCsv={vi.fn()}
        onExportJson={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("dismiss button calls onDismiss", () => {
    const onDismiss = vi.fn();
    render(
      <ExportSuggestion
        visible
        onExportCsv={vi.fn()}
        onExportJson={vi.fn()}
        onDismiss={onDismiss}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /dismiss export suggestion/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
