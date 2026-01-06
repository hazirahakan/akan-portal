import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

type SidebarProps = {
  collapsed: boolean;
};

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  display: "block",
  padding: "10px 12px",
  borderRadius: 8,
  textDecoration: "none",
  color: isActive ? "white" : "#111827",
  background: isActive ? "#003825" : "transparent",
  fontWeight: isActive ? 700 : 500,
});

function SectionHeader({
  title,
  open,
  onToggle,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: "100%",
        marginTop: 8,
        padding: "6px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        border: "none",
        background: "transparent",
        color: "#6b7280",
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      <span>{title}</span>
      <span style={{ fontSize: 14 }}>{open ? "▾" : "▸"}</span>
    </button>
  );
}

export default function Sidebar({ collapsed }: SidebarProps) {
  // 🔥 THIS IS THE KEY LINE
  if (collapsed) return null;

  const location = useLocation();

  const [open, setOpen] = useState({
    home: true,
    registration: true,
    schedule: false,
    settlement: false,
    invoice: false,
    info: false,
    ledger: false,
  });

  useEffect(() => {
    const p = location.pathname;
    setOpen((prev) => ({
      ...prev,
      home: true,
      registration: prev.registration || p.startsWith("/registration"),
      schedule: prev.schedule || p.startsWith("/schedule"),
      settlement: prev.settlement || p.startsWith("/settlement"),
      invoice: prev.invoice || p.startsWith("/invoice"),
      info: prev.info || p.startsWith("/info"),
      ledger: prev.ledger || p.startsWith("/ledger"),
    }));
  }, [location.pathname]);

  return (
    <div
      style={{
        width: 260,
        background: "white",
        borderRight: "1px solid #e5e7eb",
        padding: 12,
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 18, padding: "10px 12px" }}>
        아칸(Portal)
      </div>

      <SectionHeader
        title="홈"
        open={open.home}
        onToggle={() => setOpen((p) => ({ ...p, home: !p.home }))}
      />
      {open.home && (
        <NavLink to="/dashboard" style={linkStyle}>
          대시보드
        </NavLink>
      )}

      <SectionHeader
        title="등록"
        open={open.registration}
        onToggle={() => setOpen((p) => ({ ...p, registration: !p.registration }))}
      />
      {open.registration && (
        <>
          <NavLink to="/registration/patients" style={linkStyle}>
            환자 등록
          </NavLink>
          <NavLink to="/registration/requests" style={linkStyle}>
            환자 의뢰 등록
          </NavLink>
          <NavLink to="/registration/hotels" style={linkStyle}>
            환자 호텔 등록
          </NavLink>
          <NavLink to="/registration/schedules" style={linkStyle}>
            환자 일정 등록
          </NavLink>
          <NavLink to="/registration/transports" style={linkStyle}>
            환자 교통 등록
          </NavLink>
          <NavLink to="/registration/interpreters" style={linkStyle}>
            환자 통역 일지
          </NavLink>
          <NavLink to="/registration/prepayments" style={linkStyle}>
            선결제 등록
          </NavLink>
          <NavLink to="/registration/caregivers" style={linkStyle}>
            개인사업자 비용 등록
          </NavLink>
          <NavLink to="/registration/medicalsupplies" style={linkStyle}>
            환자 진료지원비 등록
          </NavLink>
        </>
      )}

      {/* 일정 */}
      <SectionHeader
        title="일정"
        open={open.schedule}
        onToggle={() => setOpen((p) => ({ ...p, schedule: !p.schedule }))}
      />
      {open.schedule && (
        <>
          {/* 나중에 routes 만들면 여기에 추가 */}
          {/* <NavLink to="/schedule/calendar" style={linkStyle}>캘린더</NavLink> */}
        </>
      )}

      {/* 정산 */}
      <SectionHeader
        title="정산"
        open={open.settlement}
        onToggle={() => setOpen((p) => ({ ...p, settlement: !p.settlement }))}
      />
      {open.settlement && <></>}

      {/* 인보이스 */}
      <SectionHeader
        title="인보이스"
        open={open.invoice}
        onToggle={() => setOpen((p) => ({ ...p, invoice: !p.invoice }))}
      />
      {open.invoice && <></>}

      {/* 정보 */}
      <SectionHeader
        title="정보"
        open={open.info}
        onToggle={() => setOpen((p) => ({ ...p, info: !p.info }))}
      />
      {open.info && <></>}

      {/* 대장부 */}
      <SectionHeader
        title="대장부"
        open={open.ledger}
        onToggle={() => setOpen((p) => ({ ...p, ledger: !p.ledger }))}
      />
      {open.ledger && <></>}
    </div>
  );
}
