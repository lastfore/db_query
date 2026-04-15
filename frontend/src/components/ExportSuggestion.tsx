/** Dismissible export hint after NL-generated queries return rows. */

import type { CSSProperties, FC } from "react";
import { Button, Typography } from "antd";
import { CloseOutlined } from "@ant-design/icons";

const { Text } = Typography;

const motherDuckButtonStyle: CSSProperties = {
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  borderWidth: 2,
  borderColor: "#000000",
};

export interface ExportSuggestionProps {
  visible: boolean;
  onExportCsv: () => void;
  onExportJson: () => void;
  onDismiss: () => void;
}

export const ExportSuggestion: FC<ExportSuggestionProps> = ({
  visible,
  onExportCsv,
  onExportJson,
  onDismiss,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <div
      style={{
        marginBottom: 16,
        padding: "14px 16px",
        background: "#FFDE00",
        border: "2px solid #000000",
        borderRadius: 2,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <Text
          strong
          style={{
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "#000000",
            flex: 1,
          }}
        >
          Need to export these query results to CSV or JSON?
        </Text>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onDismiss}
          aria-label="Dismiss export suggestion"
          style={{ color: "#000000", fontWeight: 700 }}
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Button onClick={onExportCsv} style={motherDuckButtonStyle}>
          EXPORT CSV
        </Button>
        <Button onClick={onExportJson} style={motherDuckButtonStyle}>
          EXPORT JSON
        </Button>
      </div>
    </div>
  );
};
