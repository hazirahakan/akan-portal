import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridReadyEvent } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import SearchPatientPopup from "../components/SearchPatientPopup";
import { savePatients, PatientChangeTracker } from "../services/patientService";

// Type definitions
interface PatientRow {
  AKAN_NO: string;
  AKAN_DATE: string;
  COUNTRY: string;
  COUNTRY_NAME: string;
  GOP: string;
  GOP_NO: string;
  PATIENT_NAME: string;
  PATIENT_NAME_KR?: string;
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
  GOP: string;  // ✅ Changed from hospitalName to GOP
  country: string;
}

const GOP_OPTIONS = ["IPC", "ZMH", "DHA", "EMBASSY", "SELFPAY", "ETC"];
const COUNTRY_OPTIONS = ["전체", "UAE", "QATAR", "ETC"];
const HOSPITAL_OPTIONS = [
  "전체",
  "EU 구강안면외과",
  "JK",
  "강남JS",
  "강남세브란스",
  "고대안암",
  "분당서울대",
  "삼성",
  "서울대치과",
  "성모",
  "세브헬스체크업",
  "신촌세브란스",
  "아산",
  "우리들",
  "자생한방",
  "혜화서울대",
];

export default function PatientReg() {
  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientRow | null>(null);
  const changeTrackerRef = useRef<PatientChangeTracker>(new PatientChangeTracker([]));
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    akanNo: "",
    patientName: "",
    GOP: "",  // ✅ Changed from hospitalName
    country: "전체",
  });

  // Parse XML response
  const parseXmlResponse = (xmlText: string): PatientRow[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    const errorCode = xmlDoc.querySelector("Parameter[id='ErrorCode']")?.textContent;
    if (errorCode && errorCode !== "0") {
      const errorMsg =
        xmlDoc.querySelector("Parameter[id='ErrorMsg']")?.textContent ||
        "Unknown error";
      throw new Error(errorMsg);
    }

    const rows: PatientRow[] = [];
    const rowElements = xmlDoc.querySelectorAll("Dataset[id='output'] Row");

    rowElements.forEach((row) => {
      const getCol = (id: string) =>
        row.querySelector(`Col[id='${id}']`)?.textContent || "";

      rows.push({
        AKAN_NO: getCol("AKAN_NO"),
        AKAN_DATE: getCol("AKAN_DATE"),
        COUNTRY: getCol("COUNTRY"),
        COUNTRY_NAME: getCol("COUNTRY_NAME"),
        GOP: getCol("GOP"),
        GOP_NO: getCol("GOP_NO"),
        PATIENT_NAME: getCol("PATIENT_NAME"),
        PATIENT_NAME_KR: getCol("PATIENT_NAME_KR"),
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

  // Fetch patients
  const fetchPatients = useCallback(async (filters: SearchFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.akanNo) params.append("akanNo", filters.akanNo);
      if (filters.patientName) params.append("patientName", filters.patientName);
      if (filters.GOP && filters.GOP !== "") params.append("GOP", filters.GOP); // ✅ Added GOP filter
      if (filters.country && filters.country !== "전체")
        params.append("COUNTRY", filters.country);

      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
      const url = `${baseUrl}/PI01Servlet?${params.toString()}`;

      console.log("🌐 Fetching:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "text/xml" },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const xmlText = await response.text();
      const patients = parseXmlResponse(xmlText);
      setRowData(patients);
      // Initialize change tracker with loaded data
      changeTrackerRef.current = new PatientChangeTracker(patients);
      console.log(`✅ Loaded ${patients.length} patients`);
    } catch (error) {
      console.error("❌ Error fetching patients:", error);
      alert("데이터를 불러오는 중 오류가 발생했습니다.");
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
        headerName: "환자명 (영문)",
        field: "PATIENT_NAME",
        width: 220,
        flex: 1,
      },
      {
        headerName: "환자명 (국문)",
        field: "PATIENT_NAME_KR",
        width: 200,
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
        cellRenderer: (params: any) => (params.value === "Y" ? "✓" : ""),
      },
      {
        headerName: "호텔",
        field: "HOTEL",
        width: 70,
        cellRenderer: (params: any) => (params.value === "Y" ? "✓" : ""),
      },
      {
        headerName: "교통",
        field: "TRANSPORT",
        width: 70,
        cellRenderer: (params: any) => (params.value === "Y" ? "✓" : ""),
      },
      {
        headerName: "일정",
        field: "SCHEDULE",
        width: 70,
        cellRenderer: (params: any) => (params.value === "Y" ? "✓" : ""),
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

  // Event handlers
  const handleSearch = useCallback(() => {
    fetchPatients(searchFilters);
  }, [searchFilters, fetchPatients]);

  const handleAdd = () => {
    setShowPopup(true);
  };

  const handleSave = async () => {
    const tracker = changeTrackerRef.current;
    
    if (!tracker.hasChanges()) {
      alert("변경된 데이터가 없습니다.");
      return;
    }
    
    // ✅ Validate required fields
    const changedRows = tracker.getChangedRows(rowData);
    for (const row of changedRows) {
      if (!row.COUNTRY || !row.GOP) {
        alert("국적과 기관은 필수입니다!");
        return;
      }
      if (!row.PATIENT_NAME || !row.DOB) {
        alert("환자명과 생년월일은 필수입니다!");
        return;
      }
    }
    
    setLoading(true);
    try {
      const changes = tracker.getChanges();
      
      console.log("💾 Saving changes:", changedRows);
      
      const result = await savePatients(changedRows, changes);
      
      if (result.success) {
        alert("저장되었습니다!");
        tracker.reset();
        // Reload data to get updated AKAN_NO and IDs
        fetchPatients(searchFilters);
      } else {
        alert(`저장 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ Save error:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const selectedRows = gridRef.current?.api.getSelectedRows();
    if (selectedRows && selectedRows.length > 0) {
      if (confirm(`${selectedRows.length}건을 삭제하시겠습니까?`)) {
        setLoading(true);
        try {
          // Mark rows as deleted
          selectedRows.forEach((row) => {
            const index = rowData.indexOf(row);
            if (index !== -1) {
              changeTrackerRef.current.markAsDelete(index);
            }
          });
          
          // Send to server
          const tracker = changeTrackerRef.current;
          const result = await savePatients(selectedRows, tracker.getChanges());
          
          if (result.success) {
            // Remove from UI
            setRowData((prev) => prev.filter((row) => !selectedRows.includes(row)));
            alert("삭제되었습니다.");
            tracker.reset();
          } else {
            alert(`삭제 실패: ${result.error}`);
          }
        } catch (error) {
          console.error("❌ Delete error:", error);
          alert("삭제 중 오류가 발생했습니다.");
        } finally {
          setLoading(false);
        }
      }
    } else {
      alert("삭제할 행을 선택해주세요.");
    }
  };

  const handleExport = () => {
    gridRef.current?.api.exportDataAsExcel({
      fileName: `환자등록_${new Date().toISOString().split("T")[0]}.xlsx`,
    });
  };

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    const newIndex = rowData.length;
    setRowData((prev) => [patient, ...prev]);
    // Mark as new insert
    changeTrackerRef.current.markAsInsert(0);
  };

  const handleRowClick = (event: any) => {
    setSelectedPatient(event.data);
  };

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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ minWidth: 80, fontWeight: 600 }}>아칸번호</label>
            <input
              type="text"
              value={searchFilters.akanNo}
              onChange={(e) =>
                setSearchFilters((prev) => ({ ...prev, akanNo: e.target.value }))
              }
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
              onChange={(e) =>
                setSearchFilters((prev) => ({
                  ...prev,
                  GOP: e.target.value,
                }))
              }
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
            <label style={{ minWidth: 80, fontWeight: 600 }}>국적</label>
            <div style={{ display: "flex", gap: 12, flex: 1 }}>
              {COUNTRY_OPTIONS.map((country) => (
                <label
                  key={country}
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  <input
                    type="radio"
                    name="country"
                    value={country}
                    checked={searchFilters.country === country}
                    onChange={(e) =>
                      setSearchFilters((prev) => ({
                        ...prev,
                        country: e.target.value,
                      }))
                    }
                  />
                  <span>{country}</span>
                </label>
              ))}
            </div>
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
      </div>

      {/* Grid */}
      <div
        className="ag-theme-alpine"
        style={{ flex: 1, minHeight: 300, marginBottom: 12 }}
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
          onRowClicked={handleRowClick}
          localeText={{
            page: "페이지",
            of: "/",
            noRowsToShow: "데이터가 없습니다",
            loadingOoo: "로딩중...",
          }}
          onGridReady={(params: GridReadyEvent) => {
            params.api.sizeColumnsToFit();
          }}
        />
      </div>

      {/* Detail Form */}
      {selectedPatient && (
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 20,
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700 }}>
            환자 상세 정보
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px 24px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                아칸번호
              </label>
              <input
                type="text"
                value={selectedPatient.AKAN_NO}
                readOnly
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 4,
                  background: "#f9fafb",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                환자명 (영문)
              </label>
              <input
                type="text"
                value={selectedPatient.PATIENT_NAME}
                readOnly
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 4,
                  background: "#f9fafb",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                국적
              </label>
              <input
                type="text"
                value={selectedPatient.COUNTRY}
                readOnly
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 4,
                  background: "#f9fafb",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                기관
              </label>
              <input
                type="text"
                value={selectedPatient.GOP}
                readOnly
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 4,
                  background: "#f9fafb",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                기관번호
              </label>
              <input
                type="text"
                value={selectedPatient.GOP_NO}
                readOnly
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 4,
                  background: "#f9fafb",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                생년월일
              </label>
              <input
                type="text"
                value={selectedPatient.DOB}
                readOnly
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 4,
                  background: "#f9fafb",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                성별
              </label>
              <input
                type="text"
                value={selectedPatient.GENDER === "M" ? "남" : "여"}
                readOnly
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 4,
                  background: "#f9fafb",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                연락처
              </label>
              <input
                type="text"
                value={selectedPatient.CONTACT_NO}
                readOnly
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 4,
                  background: "#f9fafb",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                문의경로
              </label>
              <input
                type="text"
                value={selectedPatient.INQUIRY_PIC}
                readOnly
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 4,
                  background: "#f9fafb",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
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

      <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
        총 {rowData.length}건
      </div>

      {/* Search Patient Popup */}
      <SearchPatientPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        onSelectPatient={handleSelectPatient}
      />
    </div>
  );
}