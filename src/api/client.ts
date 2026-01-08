import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";

// API base configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

// Create axios instance with default config
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for session-based auth
});

// Request interceptor - add auth token if available
apiClient.interceptors.request.use(
  (config) => {
    // Get JWT token from localStorage or sessionStorage
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in dev mode
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    // Log response in dev mode
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    // Handle common errors
    if (error.response) {
      const status = error.response.status;
      
      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem("auth_token");
        window.location.href = "/login";
      } else if (status === 403) {
        // Forbidden - show permission error
        alert("권한이 없습니다.");
      } else if (status === 404) {
        console.error("API endpoint not found:", error.config?.url);
      } else if (status >= 500) {
        alert("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    } else if (error.request) {
      // Request made but no response
      alert("네트워크 오류가 발생했습니다. 연결을 확인해주세요.");
    }
    
    return Promise.reject(error);
  }
);

// Generic API response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Generic API error type
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export default apiClient;