/**
 * Service for integrating with Nexacro PI02Servlet
 * Handles conversion between React state and Nexacro PlatformData XML format
 */

interface PatientData {
  PI_ID?: number;
  PI_02_ID?: number;
  AKAN_NO?: string;
  AKAN_DATE?: string;
  COUNTRY: string;
  COUNTRY_NAME?: string;
  GOP: string;
  GOP_NO?: string;
  PATIENT_NAME: string;
  PATIENT_NAME_KR?: string;
  DOB: string;
  GENDER: string;
  CONTACT_NO?: string;
  INQUIRY_PIC?: string;
  REQUEST?: string;
  HOTEL?: string;
  TRANSPORT?: string;
  SCHEDULE?: string;
}

interface SaveResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Convert patient data array to Nexacro PlatformData XML format
 * This matches what PI02Servlet expects
 */
function buildNexacroPlatformXML(
  patients: PatientData[],
  rowTypes: Map<number, "insert" | "update" | "delete">
): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<Root xmlns="http://www.nexacroplatform.com/platform/dataset">\n';
  
  // Dataset definition
  xml += '<Dataset id="ds_patient">\n';
  
  // Column info
  xml += '<ColumnInfo>\n';
  const columns = [
    'PI_ID', 'PI_02_ID', 'AKAN_NO', 'AKAN_DATE', 'COUNTRY', 'COUNTRY_NAME',
    'GOP', 'GOP_NO', 'PATIENT_NAME', 'PATIENT_NAME_KR', 'DOB', 'GENDER',
    'CONTACT_NO', 'INQUIRY_PIC', 'REQUEST', 'HOTEL', 'TRANSPORT', 'SCHEDULE'
  ];
  
  columns.forEach(col => {
    const type = (col === 'PI_ID' || col === 'PI_02_ID') ? 'INT' : 'STRING';
    xml += `<Column id="${col}" type="${type}" size="256"/>\n`;
  });
  xml += '</ColumnInfo>\n';
  
  // Rows
  xml += '<Rows>\n';
  
  patients.forEach((patient, index) => {
    const rowType = rowTypes.get(index) || 'update';
    const rowTypeAttr = rowType === 'insert' 
      ? ' type="insert"' 
      : rowType === 'delete' 
      ? ' type="delete"' 
      : ' type="update"';
    
    xml += `<Row${rowTypeAttr}>\n`;
    
    columns.forEach(col => {
      const value = patient[col as keyof PatientData] || '';
      const escapedValue = escapeXml(String(value));
      xml += `<Col id="${col}">${escapedValue}</Col>\n`;
    });
    
    xml += '</Row>\n';
  });
  
  xml += '</Rows>\n';
  xml += '</Dataset>\n';
  xml += '</Root>';
  
  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Parse Nexacro response XML
 */
function parseNexacroResponse(xmlText: string): SaveResponse {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  const errorCode = xmlDoc.querySelector("Parameter[id='ErrorCode']")?.textContent;
  const errorMsg = xmlDoc.querySelector("Parameter[id='ErrorMsg']")?.textContent;
  
  if (errorCode && errorCode !== '0') {
    return {
      success: false,
      error: errorMsg || 'Unknown error occurred'
    };
  }
  
  return {
    success: true,
    message: errorMsg || 'Success'
  };
}

/**
 * Save patients to database via PI02ReactServlet
 * Sends JSON format (not Nexacro XML)
 */
export async function savePatients(
  patients: PatientData[],
  rowTypes: Map<number, "insert" | "update" | "delete">
): Promise<SaveResponse> {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const url = `${baseUrl}/PI02ReactServlet`; // ✅ Use new servlet
    
    // ✅ Build JSON format (not XML)
    const rowTypesObject: Record<string, string> = {};
    rowTypes.forEach((type, index) => {
      rowTypesObject[index] = type;
    });
    
    const jsonData = {
      patients: patients,
      rowTypes: rowTypesObject
    };
    
    console.log('📤 Sending to PI02ReactServlet:', JSON.stringify(jsonData).substring(0, 300));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(jsonData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const responseJson = await response.json();
    console.log('📥 Response from PI02ReactServlet:', responseJson);
    
    return {
      success: responseJson.success || false,
      message: responseJson.message,
      error: responseJson.error
    };
    
  } catch (error) {
    console.error('❌ Error saving patients:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Save a single patient (convenience method)
 */
export async function savePatient(
  patient: PatientData,
  isNew: boolean = false
): Promise<SaveResponse> {
  const rowTypes = new Map<number, "insert" | "update" | "delete">();
  rowTypes.set(0, isNew ? 'insert' : 'update');
  
  return savePatients([patient], rowTypes);
}

/**
 * Delete patients
 */
export async function deletePatients(
  patients: PatientData[]
): Promise<SaveResponse> {
  const rowTypes = new Map<number, "insert" | "update" | "delete">();
  patients.forEach((_, index) => {
    rowTypes.set(index, 'delete');
  });
  
  return savePatients(patients, rowTypes);
}

/**
 * Helper to track changed rows in AG Grid
 * Call this when user edits cells or adds/deletes rows
 */
export class PatientChangeTracker {
  private changes = new Map<number, "insert" | "update" | "delete">();
  private originalData: PatientData[] = [];
  
  constructor(initialData: PatientData[]) {
    this.originalData = JSON.parse(JSON.stringify(initialData));
  }
  
  markAsInsert(index: number) {
    this.changes.set(index, 'insert');
  }
  
  markAsUpdate(index: number) {
    if (this.changes.get(index) !== 'insert') {
      this.changes.set(index, 'update');
    }
  }
  
  markAsDelete(index: number) {
    this.changes.set(index, 'delete');
  }
  
  getChanges(): Map<number, "insert" | "update" | "delete"> {
    return this.changes;
  }
  
  getChangedRows(allData: PatientData[]): PatientData[] {
    return allData.filter((_, index) => this.changes.has(index));
  }
  
  hasChanges(): boolean {
    return this.changes.size > 0;
  }
  
  reset() {
    this.changes.clear();
  }
}

export default {
  savePatients,
  savePatient,
  deletePatients,
  PatientChangeTracker
};