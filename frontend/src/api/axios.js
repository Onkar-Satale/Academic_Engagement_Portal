import axios from "axios";

const rawUrl = process.env.REACT_APP_BACKEND_URL|| "http://localhost:5000";
const cleanUrl = rawUrl.replace(/\/+$/, "").replace(/\/api$/, "");

const api = axios.create({
  baseURL: `${cleanUrl}/api`
});

export const BACKEND_URL = cleanUrl;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
