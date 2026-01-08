import apiClient, { ApiResponse } from "./client";

// Type definitions matching database schema
export interface Patient {
  PI_ID?: number;
  COUNTRY: string;
  COUNTRY_NAME?: string;
  PATIENT_NAME: string;
  PATIENT_NAME_KR?: string;
  DOB: string;
  GENDER: string;
  CREATED_AT?: string;
}

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
  REQUEST?: string;
  HOTEL?: string;
  TRANSPORT?: string;
  SCHEDULE?: string;
  GOP_EXPIRY_DATE?: string;
  CREATED_AT?: string;
}

export interface PatientSearchParams {
  akanNo?: string;
  patientName?: string;
  country?: string;
  gop?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Patient API service
export const patientApi = {
  /**
   * Get list of patients with optional filters
   * Maps to: GET /api/patients or POST /api/patients/search
   */
  async getPatients(
    params?: PatientSearchParams
  ): Promise<ApiResponse<PaginatedResponse<PatientDetail>>> {
    try {
      const response = await apiClient.get("/patients", { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get single patient by ID
   * Maps to: GET /api/patients/{id}
   */
  async getPatientById(id: number): Promise<ApiResponse<PatientDetail>> {
    try {
      const response = await apiClient.get(`/patients/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create new patient
   * Maps to: POST /api/patients
   */
  async createPatient(
    patient: Partial<PatientDetail>
  ): Promise<ApiResponse<PatientDetail>> {
    try {
      const response = await apiClient.post("/patients", patient);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update existing patient
   * Maps to: PUT /api/patients/{id}
   */
  async updatePatient(
    id: number,
    patient: Partial<PatientDetail>
  ): Promise<ApiResponse<PatientDetail>> {
    try {
      const response = await apiClient.put(`/patients/${id}`, patient);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete patient(s)
   * Maps to: DELETE /api/patients/{id} or POST /api/patients/delete-batch
   */
  async deletePatient(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`/patients/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Batch delete patients
   */
  async deletePatientsBatch(ids: number[]): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post("/patients/delete-batch", { ids });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Export patients to Excel
   * Maps to: GET /api/patients/export
   */
  async exportPatients(params?: PatientSearchParams): Promise<Blob> {
    try {
      const response = await apiClient.get("/patients/export", {
        params,
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Import patients from Excel
   * Maps to: POST /api/patients/import
   */
  async importPatients(file: File): Promise<ApiResponse<{ imported: number; errors: any[] }>> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await apiClient.post("/patients/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Generate next AKAN number
   * Maps to: GET /api/patients/next-akan-no
   */
  async getNextAkanNo(country: string): Promise<ApiResponse<string>> {
    try {
      const response = await apiClient.get("/patients/next-akan-no", {
        params: { country },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default patientApi;