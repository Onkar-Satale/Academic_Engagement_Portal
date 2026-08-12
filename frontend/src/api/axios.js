import axios from "axios";

const rawUrl = process.env.REACT_APP_BACKEND_URL;
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear expired credentials if unauthenticated
      const isAuthEndpoint = error.config?.url?.includes("/auth/");
      if (!isAuthEndpoint && localStorage.getItem("token")) {
        console.warn("Session expired or invalid token. Redirecting to login...");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
