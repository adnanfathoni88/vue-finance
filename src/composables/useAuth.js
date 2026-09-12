import { reactive, computed } from "vue";
import {
  login as apiLogin,
  logout as apiLogout,
  me as apiMe,
} from "../services/api";

const state = reactive({
  user: null,
  loading: false,
  checked: false,
});

let sessionPromise = null;

const isAuthenticated = computed(() => !!state.user);

function applySession(data) {
  state.user = {
    sub: data.sub,
    iat: data.iat,
    exp: data.exp,
  };
}

export function useAuth() {
  async function login(password) {
    state.loading = true;
    try {
      const { data } = await apiLogin(password);
      applySession(data);
      state.checked = true;
      return data;
    } finally {
      state.loading = false;
    }
  }

  async function logout() {
    try {
      await apiLogout();
    } finally {
      clear();
    }
  }

  async function ensureSession() {
    if (state.checked) return state.user;
    if (sessionPromise) return sessionPromise;

    sessionPromise = (async () => {
      try {
        const { data } = await apiMe();
        applySession(data);
      } catch {
        state.user = null;
      } finally {
        state.checked = true;
        sessionPromise = null;
      }
      return state.user;
    })();

    return sessionPromise;
  }

  function setUser(user) {
    state.user = user;
  }

  function clear() {
    state.user = null;
    state.checked = false;
  }

  return {
    state,
    isAuthenticated,
    login,
    logout,
    ensureSession,
    setUser,
    clear,
  };
}
