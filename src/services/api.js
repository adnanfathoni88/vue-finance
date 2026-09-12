import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true,
});

const AUTH_PATHS = ["/login", "/logout", "/me"];

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const isAuthRequest = AUTH_PATHS.some((path) => url?.startsWith(path));

    if (status === 401 && !isAuthRequest && unauthorizedHandler) {
      unauthorizedHandler(error);
    }

    return Promise.reject(error);
  }
);

export default api;
