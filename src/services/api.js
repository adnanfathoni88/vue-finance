import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true,
});

export function getErrorMessage(err, fallback) {
  return err.response?.data?.error?.message || fallback;
}

export function login(password) {
  return api.post("/login", { password });
}

export function logout() {
  return api.post("/logout");
}

export function me() {
  return api.get("/me");
}

export default api;
