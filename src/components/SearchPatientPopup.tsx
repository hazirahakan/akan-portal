import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, CellValueChangedEvent } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { savePatients, PatientChangeTracker } from "../services/patientService";

interface PatientRow {
  CHK?: boolean;
  AKAN_NO: string;
  COUNTRY: string;
  COUNTRY_NAME: string;
  GOP: string;
  GOP_NO: string;
  PATIENT_NAME: string;
  PATIENT_NAME_KR: string;
  DOB: string;
  GENDER: string;
  CONTACT_NO: string;
  INQUIRY_PIC: string;
  PI_ID?: number;
  PI_02_ID?: number;
}

interface SearchPatientPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient: (patient: PatientRow) => void;
}

const GOP_OPTIONS = ["IPC", "ZMH", "DHA", "EMBASSY", "SELFPAY", "ETC"];
const COUNTRY_OPTIONS = ["UAE", "QATAR", "ETC"];

export default function SearchPatientPopup({
  isOpen,
  onClose,
  onSelectPatient,
}: SearchPatientPopupProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const changeTrackerRef = useRef<PatientChangeTracker>(new PatientChangeTracker([]));

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
        PI_ID: parseInt(getCol("PI_ID")) || undefined,
        PI_02_ID: parseInt(getCol("PI_02_ID")) || undefined,
      });
    });

    return rows;
  };

  // Fetch all patients for selection
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
      const url = `${baseUrl}/PI01Servlet`;

      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "text/xml" },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const xmlText = await response.text();
      const patients = parseXmlResponse(xmlText);
      setRowData(patients);
      // Initialize change tracker
      changeTrackerRef.current = new PatientChangeTracker(patients);
    } catch (error) {
      console.error("❌ Error fetching patients:", error);
      alert("환자 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data when popup opens
  useEffect(() => {
    if (isOpen) {
      fetchPatients();
    }
  }, [isOpen, fetchPatients]);

  // Handle cell value changes
  const handleCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    const { colDef, data, rowIndex } = event;
    
    // ✅ Auto-fill COUNTRY_NAME when COUNTRY changes
    if (colDef.field === "COUNTRY") {
      const country = data.COUNTRY;
      if (country !== "ETC") {
        data.COUNTRY_NAME = country; // Auto-fill
        event.api.refreshCells({ rowNodes: [event.node], force: true });
      }
    }
    
    // Mark row as updated
    if (rowIndex !== null) {
      changeTrackerRef.current.markAsUpdate(rowIndex);
    }
  }, []);

  // Column definitions matching Nexacro popup
  const columnDefs = useMemo<ColDef<PatientRow>[]>(
    () => [
      {
        headerName: "국적",
        field: "COUNTRY",
        width: 100,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: COUNTRY_OPTIONS },
        checkboxSelection: true,
        headerCheckboxSelection: true,
        editable: true,
      },
      {
        headerName: "",
        field: "COUNTRY_NAME",
        width: 100,
        editable: (params) => params.data?.COUNTRY === "ETC",
      },
      {
        headerName: "기관",
        field: "GOP",
        width: 100,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: GOP_OPTIONS },
        editable: true,
      },
      {
        headerName: "기관번호",
        field: "GOP_NO",
        width: 100,
        editable: true,
      },
      {
        headerName: "환자명 (영문)",
        field: "PATIENT_NAME",
        width: 300,
        editable: true,
      },
      {
        headerName: "환자명 (국문)",
        field: "PATIENT_NAME_KR",
        width: 300,
        editable: true,
      },
      {
        headerName: "생년월일",
        field: "DOB",
        width: 120,
        editable: true,
      },
      {
        headerName: "성별",
        field: "GENDER",
        width: 50,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: ["M", "F"] },
        editable: true,
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
        editable: true,
      },
      {
        headerName: "문의경로",
        field: "INQUIRY_PIC",
        width: 100,
        editable: true,
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

  const handleAddNewPatient = () => {
    const newRow: PatientRow = {
      AKAN_NO: "",
      COUNTRY: "UAE",
      COUNTRY_NAME: "UAE", // ✅ Auto-fill COUNTRY_NAME
      GOP: "SELFPAY",
      GOP_NO: "",
      PATIENT_NAME: "",
      PATIENT_NAME_KR: "",
      DOB: "",
      GENDER: "M",
      CONTACT_NO: "",
      INQUIRY_PIC: "",
    };
    setRowData((prev) => [newRow, ...prev]);
    // Mark as insert
    changeTrackerRef.current.markAsInsert(0);
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
      // ✅ Ensure COUNTRY_NAME is filled
      if (row.COUNTRY !== "ETC" && !row.COUNTRY_NAME) {
        row.COUNTRY_NAME = row.COUNTRY;
      }
    }
    
    setLoading(true);
    try {
      const changes = tracker.getChanges();
      
      const result = await savePatients(changedRows, changes);
      
      if (result.success) {
        alert("저장이 완료되었습니다!");
        tracker.reset();
        fetchPatients(); // Reload
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

  const handleDelete = () => {
    const selectedRows = gridRef.current?.api.getSelectedRows();
    if (selectedRows && selectedRows.length > 0) {
      if (confirm(`${selectedRows.length}건을 삭제하시겠습니까?`)) {
        setRowData((prev) => prev.filter((row) => !selectedRows.includes(row)));
        alert("행이 삭제되었습니다.");
      }
    } else {
      alert("삭제할 행을 선택해주세요.");
    }
  };

  const handleLoadPatient = () => {
    const selectedRows = gridRef.current?.api.getSelectedRows();
    if (selectedRows && selectedRows.length > 0) {
      // ✅ Ensure COUNTRY_NAME is set before loading
      const patient = selectedRows[0];
      if (patient.COUNTRY !== "ETC" && !patient.COUNTRY_NAME) {
        patient.COUNTRY_NAME = patient.COUNTRY;
      }
      onSelectPatient(patient);
      onClose();
    } else {
      alert("환자를 선택해주세요.");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 999,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 990,
          height: 530,
          background: "white",
          borderRadius: 8,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Title Bar */}
        <div
          style={{
            height: 40,
            background: "#003825",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 15px",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16 }}>환자 추가</h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "white",
              fontSize: 24,
              cursor: "pointer",
              padding: 0,
              width: 30,
              height: 30,
            }}
          >
            ×
          </button>
        </div>

        {/* Search/Action Area */}
        <div
          style={{
            background: "#f0faee",
            padding: "10px 20px",
            borderBottom: "1px solid #d1f0d1",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 10, color: "crimson", marginRight: "auto" }}>
            * 국적과 기관을 선택하셔야 아칸번호가 자동 생성됩니다.
          </span>
          <button
            onClick={handleAddNewPatient}
            style={{
              padding: "8px 30px",
              background: "#003825",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            환자 추가
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: "8px 30px",
              background: loading ? "#ccc" : "#003825",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {loading ? "저장중..." : "상태 저장"}
          </button>
        </div>

        {/* Grid Area */}
        <div
          className="ag-theme-alpine"
          style={{ flex: 1, padding: "10px 20px" }}
        >
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowSelection="multiple"
            suppressRowClickSelection={true}
            animateRows={true}
            onCellValueChanged={handleCellValueChanged}
            localeText={{
              noRowsToShow: loading ? "로딩중..." : "데이터가 없습니다",
            }}
          />
        </div>

        {/* Bottom Buttons */}
        <div
          style={{
            padding: "10px 20px",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={handleDelete}
            style={{
              padding: "8px 24px",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: 600,
              marginRight: "auto",
            }}
          >
            삭제
          </button>
          <button
            onClick={handleLoadPatient}
            style={{
              padding: "8px 24px",
              background: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            불러오기
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "8px 24px",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            취소
          </button>
        </div>
      </div>
    </>
  );
}