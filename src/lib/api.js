import axios from "axios";

// Hardcode the live backend API
const API_BASE = "https://gudgetsplit.onrender.com";

if (typeof window !== "undefined") {
  console.log("✅ Using API_BASE =", API_BASE);
  window._API_BASE_ = API_BASE;
}

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});