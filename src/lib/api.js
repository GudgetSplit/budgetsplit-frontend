import axios from "axios";

// Pick the API base from env, fallback to localhost for local dev
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Helpful: log what the app is using in the browser console
if (typeof window !== "undefined") {
  console.log("API_BASE =", API_BASE);
  // expose for quick checks in DevTools
  window._API_BASE_ = API_BASE;
}

export const api = axios.create({
  baseURL: API_BASE,
});

// Auto-attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = Bearer ${token};
  return config;
});