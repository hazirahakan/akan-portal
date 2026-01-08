// ============================================================
// DATABASE ENTITY TYPES
// ============================================================

// Patient Basic Info (pi_01 table)
export interface PatientBasic {
  PI_ID?: number;
  COUNTRY: string;
  COUNTRY_NAME?: string;
  PATIENT_NAME: string;
  PATIENT_NAME_KR?: string;
  DOB: string;
  GENDER: "M" | "F";
  CREATED_AT?: string;
}

// Patient Detail Info (pi_02 table)
export interface PatientDetail {
  PI_02_ID?: number;
  PI_ID?: number;
  AKAN_NO: string;
  PATIENT_NAME: string;
  DOB: string;
  COUNTRY: string;
  GOP: string;
  GOP_NO?: string;
  CONTACT_NO?: string;
  INQUIRY_PIC?: string;
  REQUEST?: "Y" | "N" | "";
  HOTEL?: "Y" | "N" | "";
  TRANSPORT?: "Y" | "N" | "";
  SCHEDULE?: "Y" | "N" | "";
  GOP_EXPIRY_DATE?: string;
  CREATED_AT?: string;
}

// Patient Schedule (pi_03 table)
export interface PatientSchedule {
  PI_03_ID?: number;
  PI_02_ID: number;
  PI_ID: number;
  PATIENT_NAME?: string;
  PATIENT_STAGE?: string;
  AKAN_DATE?: string;
  CONFIRMED?: "Y" | "N" | "";
  AGE?: string;
  MEMO?: string;
  CAR_TYPE?: string;
  CREATED_AT?: string;
}

// Hotel Lodging
export interface HotelLodging {
  LODGING_ID?: number;
  COUNTRY?: string;
  GOP?: string;
  HOSPITAL_NAME?: string;
  ARRIVAL_DATE?: string;
  DEPARTURE_DATE?: string;
  DEPARTED?: string;
  PATIENT_NAME?: string;
  PATIENT_NAME_KR?: string;
  NUMBER_GUEST?: string;
  HOTEL_NAME?: string;
  BEDROOM_TYPE?: string;
  BEDROOM_NUMBER?: string;
  CHKIN_DATE?: string;
  CHKOUT_DATE?: string;
  PERIOD_STAY?: string;
  PRICE_ROOM?: string;
  NET_PRICE?: string;
  AMOUNT_PAID?: string;
  RESERVATION_NAME?: string;
  COMMISSION?: string;
  MEMO?: string;
}

// Employee Info (ei_01 table)
export interface Employee {
  EMP_ID?: number;
  EMP_NO?: string;
  EMP_NAME_KR?: string;
  EMP_NAME_EN?: string;
  GENDER?: "M" | "F";
  DOB?: string;
  WORK_CONTACT_NO?: string;
  POSITION?: string;
  JOINED_DATE?: string;
  RESIGN_DATE?: string;
  PAY_GRADE?: string;
  PROMOTED_DATE?: string;
  EMAIL?: string;
  MEMO?: string;
  WORKING_STATUS?: string;
  CREATED_AT?: string;
  PHOTO_PATH?: string;
}

// Caregiver (cv_01 table)
export interface Caregiver {
  CV_01_ID?: number;
  PI_02_ID: number;
  PI_ID: number;
  PS_01_ID: number;
  BUDGET?: string;
  CAREGIVER_NAME?: string;
  START_DATE?: string;
  END_DATE?: string;
  PERIOD?: string;
  AMOUNT?: string;
  TOTAL_AMOUNT?: string;
  TAX_INCLUDED?: "Y" | "N";
  INCOME_TAX?: string;
  RESIDENT_TAX?: string;
  DEPOSIT_AMOUNT?: string;
  DEPOSIT?: "Y" | "N";
  DEPOSIT_DATE?: string;
  CANCEL?: "Y" | "N";
  SELFPAY?: "Y" | "";
  SETTLEMENT?: string;
  AMOUNT_SUPPLY?: string;
  CREATED_AT?: string;
}

// ============================================================
// FORM & UI TYPES
// ============================================================

export interface SearchFilters {
  akanNo?: string;
  patientName?: string;
  hospital?: string;
  country?: string;
  gop?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================
// DROPDOWN OPTIONS
// ============================================================

export const COUNTRY_OPTIONS = ["UAE", "QATAR", "ETC"] as const;
export type CountryType = (typeof COUNTRY_OPTIONS)[number];

export const GOP_OPTIONS = [
  "IPC",
  "ZMH",
  "DHA",
  "EMBASSY",
  "SELFPAY",
  "ETC",
] as const;
export type GOPType = (typeof GOP_OPTIONS)[number];

export const GENDER_OPTIONS = [
  { value: "M", label: "남" },
  { value: "F", label: "여" },
] as const;

export const PATIENT_STAGE_OPTIONS = [
  "공식의료",
  "2차소견",
  "국내2차",
  "해외2차",
  "국내",
  "전원",
] as const;

export const HOSPITAL_OPTIONS = [
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
] as const;

export const HOTEL_OPTIONS = [
  "강남아르누보",
  "그랜드 머큐어",
  "라코지 스테이 서울",
  "롯데호텔서울",
  "명동 롯데호텔",
  "바비엥1",
  "바비엥2",
  "소피텔",
  "스위스그랜드",
  "신라 스테이 역삼",
  "엠쉐르빌",
  "오라카이 스위츠",
  "오크우드 프리미어",
  "용산 ibis styles",
  "포시즌스",
  "프레이저플레이스(센트럴)",
  "프레이저플레이스남대문",
  "동대문 노보텔",
] as const;

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// ============================================================
// AUTH TYPES
// ============================================================

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

export type UserRole = "admin" | "freelancer" | "staff";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  user: User;
}

// ============================================================
// FILE UPLOAD TYPES
// ============================================================

export interface FileUploadResponse {
  success: boolean;
  fileId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedAt: string;
}

export interface ImportResult {
  imported: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  error: string;
  data?: any;
}