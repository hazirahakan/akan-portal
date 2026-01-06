import { useNavigate } from "react-router-dom";

export type OpenTab = { id: string; title: string; path: string };

export default function TabBar({
  tabs,
  activePath,
  onClose,
}: {
  tabs: OpenTab[];
  activePath: string;
  onClose: (path: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        height: 44,
        display: "flex",
        alignItems: "stretch",
        gap: 6,
        padding: "0 10px",
        borderBottom: "1px solid #e5e7eb",
        background: "white",
        overflowX: "auto",
        whiteSpace: "nowrap",
      }}
    >
      {tabs.map((t) => {
        const active = t.path === activePath;
        return (
          <div
            key={t.path}
            style={{
              display: "inline-flex",
              alignItems: "center",
              border: "1px solid #e5e7eb",
              borderBottom: active ? "2px solid #003825" : "1px solid #e5e7eb",
              background: active ? "#f9fafb" : "white",
              borderRadius: 8,
              padding: "0 10px",
              cursor: "pointer",
              margin: "6px 0",
              gap: 10,
            }}
            onClick={() => navigate(t.path)}
            title={t.title}
          >
            <span style={{ fontSize: 13, fontWeight: active ? 700 : 600 }}>
              {t.title}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(t.path);
              }}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 16,
                lineHeight: "16px",
                padding: 0,
                opacity: 0.7,
              }}
              aria-label="Close tab"
              title="Close"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
