import axios from "axios";

// TEMP: hard-code your live API to remove any env confusion
const API_BASE = "https://gudgetsplit.onrender.com";

// (Optional) log so we can see it in the browser console
if (typeof window !== "undefined") {
  console.log("API_BASE =", API_BASE);
  window._API_BASE_ = API_BASE;
}

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});