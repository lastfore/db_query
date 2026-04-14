/** Axios API client instance. */

import axios from "axios";

/** Backend origin only; do not append /api/v1 (request paths include it). */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      const message =
        error.response.data?.detail || error.response.data?.error || "An error occurred";
      console.error("API Error:", message);
    }
    return Promise.reject(error);
  }
);
