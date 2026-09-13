<template>
  <div class="min-h-[70vh] flex items-center justify-center">
    <form
      @submit.prevent="onSubmit"
      class="w-full max-w-sm bg-neutral-800 p-6 rounded-2xl shadow"
    >
      <h1 class="text-2xl font-semibold mb-4 text-center">Login</h1>

      <label
        for="password"
        class="text-neutral-400 text-sm font-semibold"
      >
        Password
      </label>
      <div class="relative mt-1">
        <input
          id="password"
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          required
          class="w-full text-neutral-200 bg-neutral-950 rounded p-2 pr-10 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="button"
          @click="showPassword = !showPassword"
          :aria-label="showPassword ? 'Hide password' : 'Show password'"
          :aria-pressed="showPassword"
          class="absolute inset-y-0 right-0 px-3 flex items-center text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <font-awesome-icon
            :icon="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"
          />
        </button>
      </div>

      <p v-if="errorMessage" class="text-red-400 text-sm mt-3">
        {{ errorMessage }}
      </p>

      <button
        type="submit"
        :disabled="state.loading"
        class="mt-5 w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ state.loading ? "Signing in..." : "Sign in" }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";
import { getErrorMessage } from "../services/api";

const route = useRoute();
const router = useRouter();
const { state, login } = useAuth();

const password = ref("");
const showPassword = ref(false);
const errorMessage = ref("");

function resolveRedirect(value) {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/";
}

async function onSubmit() {
  if (state.loading) return;
  errorMessage.value = "";

  try {
    await login(password.value);
    router.replace(resolveRedirect(route.query.redirect));
  } catch (err) {
    errorMessage.value = getErrorMessage(err, "Login failed");
  }
}
</script>
