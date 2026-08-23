import axios from "axios";

const RAW_URL = process.env.NEXT_PUBLIC_API_URL || "";

function getApiBase() {
  if (!RAW_URL) {
    return typeof window !== "undefined" ? "/api" : "http://localhost:5000/api";
  }
  if (RAW_URL.startsWith("http://") || RAW_URL.startsWith("https://")) {
    return RAW_URL.endsWith("/api") ? RAW_URL : `${RAW_URL.replace(/\/$/, "")}/api`;
  }
  if (RAW_URL.startsWith("/")) {
    return RAW_URL.endsWith("/api") ? RAW_URL : `${RAW_URL.replace(/\/$/, "")}/api`;
  }
  if (typeof window !== "undefined") {
    return "/api";
  }
  return `http://${RAW_URL}/api`;
}

const API_BASE = getApiBase();

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
