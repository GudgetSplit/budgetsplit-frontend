import axios from "axios";

// Pick the API base from Vercel env var, or fall back to local dev
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Log which API is being used
if (typeof window !== "undefined") {
  console.log("✅ Using API_BASE =", API_BASE);
  window._API_BASE_ = API_BASE; // helpful for DevTools check
}

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE,
});

// Automatically attach auth token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = Bearer ${token};
  return config;
});