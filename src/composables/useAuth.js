import { reactive, computed } from "vue";
import {
  login as apiLogin,
  logout as apiLogout,
} from "../services/api";

const state = reactive({
  user: null,
  loading: false,
});

const isAuthenticated = computed(() => !!state.user);

export function useAuth() {
  async function login(password) {
    state.loading = true;
    try {
      const { data } = await apiLogin(password);
      state.user = {
        sub: data.sub,
        iat: data.iat,
        exp: data.exp,
      };
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

  function setUser(user) {
    state.user = user;
  }

  function clear() {
    state.user = null;
  }

  return {
    state,
    isAuthenticated,
    login,
    logout,
    setUser,
    clear,
  };
}
