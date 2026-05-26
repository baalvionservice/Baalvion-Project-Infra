import axios from "axios";
import { ApiResponse } from "@/types/api";

export const apiClient = axios.create({
  baseURL:  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to handle ApiResponse structure
apiClient.interceptors.response.use(
  (response) => {
    // For successful responses, return as-is since they follow ApiResponse<T> structure
    return response;
  },
  (error) => {
    // For error responses, ensure they follow the ApiResponse structure
    if (error.response?.data) {
      const errorData = error.response.data as ApiResponse<any>;
      // If the error response doesn't follow ApiResponse structure, wrap it
      if (!errorData.hasOwnProperty("success")) {
        error.response.data = {
          success: false,
          statusCode: error.response.status,
          message: errorData.message || error.message || "An error occurred",
          data: null,
          timestamp: new Date().toISOString(),
          path: error.config?.url || "",
        } as ApiResponse<null>;
      }
    }
    return Promise.reject(error);
  }
);
