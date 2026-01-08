import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridReadyEvent } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// Type definitions matching your servlet output
interface PatientRow {
  AKAN_NO: string;
  AKAN_DATE: string;
  COUNTRY: string;
  COUNTRY_NAME: string;
  GOP: string;
  GOP_NO: string;
  PATIENT_NAME: string;
  DOB: string;
  GENDER: string;
  CONTACT_NO: string;
  INQUIRY_PIC: string;
  REQUEST: string;
  HOTEL: string;
  TRANSPORT: string;
  SCHEDULE: string;
  PI_ID?: number;
  PI_02_ID?: number;
}

interface SearchFilters {
  akanNo: string;
  patientName: string;
  GOP: string;
  DOB: string;
}

const GOP_OPTIONS = ["IPC", "ZMH", "DHA", "EMBASSY", "SELFPAY", "ETC"];

export default function PatientReg() {
  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    akanNo: "",
    patientName: "",
    GOP: "",
    DOB: "",
  });

  // Parse XML response from your servlet
  const parseXmlResponse = (xmlText: string): PatientRow[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    // Check for errors
    const errorCode = xmlDoc.querySelector("Parameter[id='ErrorCode']")?.textContent;
    if (errorCode && errorCode !== "0") {
      const errorMsg = xmlDoc.querySelector("Parameter[id='ErrorMsg']")?.textContent || "Unknown error";
      throw new Error(errorMsg);
    }

    const rows: PatientRow[] = [];
    const rowElements = xmlDoc.querySelectorAll("Dataset[id='output'] Row");
    
    rowElements.forEach((row) => {
      const getCol = (id: string) => {
        const col = row.querySelector(`Col[id='${id}']`);
        return col?.textContent || "";
      };

      rows.push({
        AKAN_NO: getCol("AKAN_NO"),
        AKAN_DATE: getCol("AKAN_DATE"),
        COUNTRY: getCol("COUNTRY"),
        COUNTRY_NAME: getCol("COUNTRY_NAME"),
        GOP: getCol("GOP"),
        GOP_NO: getCol("GOP_NO"),
        PATIENT_NAME: getCol("PATIENT_NAME"),
        DOB: getCol("DOB"),
        GENDER: getCol("GENDER"),
        CONTACT_NO: getCol("CONTACT_NO"),
        INQUIRY_PIC: getCol("INQUIRY_PIC"),
        REQUEST: getCol("REQUEST"),
        HOTEL: getCol("HOTEL"),
        TRANSPORT: getCol("TRANSPORT"),
        SCHEDULE: getCol("SCHEDULE"),
        PI_ID: parseInt(getCol("PI_ID")) || undefined,
        PI_02_ID: parseInt(getCol("PI_02_ID")) || undefined,
      });
    });

    return rows;
  };

  // Fetch data from your existing servlet
  const fetchPatients = useCallback(async (filters: SearchFilters) => {
    setLoading(true);
    try {
      // Build query string matching your servlet parameters
      const params = new URLSearchParams();
      if (filters.akanNo) params.append("akanNo", filters.akanNo);
      if (filters.patientName) params.append("patientName", filters.patientName);
      if (filters.GOP && filters.GOP !== "") params.append("GOP", filters.GOP);
      if (filters.DOB) params.append("DOB", filters.DOB);

      const url = `http://localhost:10006/AKANPortal/PI01Servlet?${params.toString()}`;
      
      // Debug logging
      console.log("🔍 Search Filters:", filters);
      console.log("🌐 Request URL:", url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "text/xml",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xmlText = await response.text();
      console.log("📄 Raw XML Response (first 500 chars):", xmlText.substring(0, 500));
      
      const patients = parseXmlResponse(xmlText);
      console.log(`✅ Parsed ${patients.length} patients`);
      console.log("📊 First patient:", patients[0]);
      
      setRowData(patients);
      
    } catch (error) {
      console.error("❌ Error fetching patients:", error);
      alert("데이터를 불러오는 중 오류가 발생했습니다: " + error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Column definitions
  const columnDefs = useMemo<ColDef<PatientRow>[]>(
    () => [
      {
        headerName: "아칸번호",
        field: "AKAN_NO",
        width: 130,
        pinned: "left",
        checkboxSelection: true,
        headerCheckboxSelection: true,
      },
      {
        headerName: "아칸일자",
        field: "AKAN_DATE",
        width: 110,
      },
      {
        headerName: "국적",
        field: "COUNTRY",
        width: 90,
      },
      {
        headerName: "국가명",
        field: "COUNTRY_NAME",
        width: 100,
      },
      {
        headerName: "기관",
        field: "GOP",
        width: 110,
      },
      {
        headerName: "기관번호",
        field: "GOP_NO",
        width: 110,
      },
      {
        headerName: "환자명",
        field: "PATIENT_NAME",
        width: 220,
        flex: 1,
      },
      {
        headerName: "생년월일",
        field: "DOB",
        width: 120,
      },
      {
        headerName: "성별",
        field: "GENDER",
        width: 80,
        valueFormatter: (params) => {
          if (params.value === "M") return "남";
          if (params.value === "F") return "여";
          return params.value;
        },
      },
      {
        headerName: "연락처",
        field: "CONTACT_NO",
        width: 130,
      },
      {
        headerName: "문의경로",
        field: "INQUIRY_PIC",
        width: 110,
      },
      {
        headerName: "의뢰",
        field: "REQUEST",
        width: 70,
        cellRenderer: (params: any) => {
          return params.value === "Y" ? "✓" : "";
        },
      },
      {
        headerName: "호텔",
        field: "HOTEL",
        width: 70,
        cellRenderer: (params: any) => {
          return params.value === "Y" ? "✓" : "";
        },
      },
      {
        headerName: "교통",
        field: "TRANSPORT",
        width: 70,
        cellRenderer: (params: any) => {
          return params.value === "Y" ? "✓" : "";
        },
      },
      {
        headerName: "일정",
        field: "SCHEDULE",
        width: 70,
        cellRenderer: (params: any) => {
          return params.value === "Y" ? "✓" : "";
        },
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      suppressMovable: true,
    }),
    []
  );

  const handleSearch = useCallback(() => {
    console.log("🔎 Search button clicked with filters:", searchFilters);
    fetchPatients(searchFilters);
  }, [searchFilters, fetchPatients]);

  const handleDelete = useCallback(() => {
    const selectedRows = gridRef.current?.api.getSelectedRows();
    if (selectedRows && selectedRows.length > 0) {
      if (confirm(`${selectedRows.length}건을 삭제하시겠습니까?`)) {
        alert("삭제 기능은 PI02Servlet에 구현이 필요합니다.");
      }
    } else {
      alert("삭제할 행을 선택해주세요.");
    }
  }, []);

  const handleAdd = useCallback(() => {
    alert("추가 기능은 별도 구현이 필요합니다.");
  }, []);

  const handleSave = useCallback(() => {
    alert("저장 기능은 PI02Servlet에 구현이 필요합니다.");
  }, []);

  const handleExport = useCallback(() => {
    gridRef.current?.api.exportDataAsExcel({
      fileName: `환자등록_${new Date().toISOString().split("T")[0]}.xlsx`,
    });
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchPatients(searchFilters);
  }, []);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Title and Action Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>환자 등록</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleAdd}
            style={{
              padding: "8px 20px",
              background: "#003825",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            추가
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "8px 20px",
              background: "#003825",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            저장
          </button>
        </div>
      </div>

      {/* Search Area */}
      <div
        style={{
          background: "#f0faee",
          padding: "16px 20px",
          borderRadius: 8,
          marginBottom: 16,
          border: "1px solid #d1f0d1",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px 24px",
            alignItems: "center",
          }}
        >
          {/* Row 1 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ minWidth: 80, fontWeight: 600 }}>아칸번호</label>
            <input
              type="text"
              value={searchFilters.akanNo}
              onChange={(e) =>
                setSearchFilters((prev) => ({ ...prev, akanNo: e.target.value }))
              }
              placeholder="예: AUZ"
              style={{
                flex: 1,
                padding: "6px 10px",
                border: "1px solid #d1d5db",
                borderRadius: 4,
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ minWidth: 80, fontWeight: 600 }}>환자명</label>
            <input
              type="text"
              value={searchFilters.patientName}
              onChange={(e) =>
                setSearchFilters((prev) => ({
                  ...prev,
                  patientName: e.target.value,
                }))
              }
              placeholder="예: AHMED"
              style={{
                flex: 1,
                padding: "6px 10px",
                border: "1px solid #d1d5db",
                borderRadius: 4,
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ minWidth: 80, fontWeight: 600 }}>기관명</label>
            <select
              value={searchFilters.GOP}
              onChange={(e) => {
                console.log("GOP filter changed to:", e.target.value);
                setSearchFilters((prev) => ({
                  ...prev,
                  GOP: e.target.value,
                }));
              }}
              style={{
                flex: 1,
                padding: "6px 10px",
                border: "1px solid #d1d5db",
                borderRadius: 4,
              }}
            >
              <option value="">전체</option>
              {GOP_OPTIONS.map((gop) => (
                <option key={gop} value={gop}>
                  {gop}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ minWidth: 80, fontWeight: 600 }}>생년월일</label>
            <input
              type="text"
              value={searchFilters.DOB}
              onChange={(e) =>
                setSearchFilters((prev) => ({
                  ...prev,
                  DOB: e.target.value,
                }))
              }
              placeholder="YYYYMMDD"
              style={{
                flex: 1,
                padding: "6px 10px",
                border: "1px solid #d1d5db",
                borderRadius: 4,
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: "8px 32px",
              background: loading ? "#ccc" : "#003825",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {loading ? "로딩중..." : "조회"}
          </button>
        </div>

        {/* Debug info */}
        <div style={{ marginTop: 8, fontSize: 11, color: "#666" }}>
          Current filters: AKAN={searchFilters.akanNo || "전체"}, 
          Patient={searchFilters.patientName || "전체"}, 
          GOP={searchFilters.GOP || "전체"}, 
          DOB={searchFilters.DOB || "전체"}
        </div>
      </div>

      {/* AG Grid */}
      <div
        className="ag-theme-alpine"
        style={{ flex: 1, minHeight: 400, marginBottom: 12 }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          animateRows={true}
          pagination={true}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          enableRangeSelection={true}
          localeText={{
            page: "페이지",
            of: "/",
            to: "-",
            more: "더보기",
            noRowsToShow: "데이터가 없습니다",
            loadingOoo: "로딩중...",
          }}
          onGridReady={(params: GridReadyEvent) => {
            params.api.sizeColumnsToFit();
          }}
        />
      </div>

      {/* Bottom Action Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleDelete}
            style={{
              padding: "6px 16px",
              background: "white",
              color: "#dc2626",
              border: "1px solid #dc2626",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            삭제
          </button>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleExport}
            style={{
              padding: "6px 16px",
              background: "white",
              color: "#003825",
              border: "1px solid #003825",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Export
          </button>
        </div>
      </div>

      {/* Row count summary */}
      <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
        총 {rowData.length}건
      </div>
    </div>
  );
}