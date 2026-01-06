import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar collapsed={collapsed} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            height: 56,
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 16px",
            background: "white",
          }}
        >
          <button
            onClick={() => setCollapsed((v) => !v)}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            ☰
          </button>

          <strong>AKAN Portal</strong>
        </div>

        <div style={{ flex: 1, padding: 16, background: "#f6f7f9" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
