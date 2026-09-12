<template>
  <div class="bg-neutral-900 min-h-screen text-white">
    <Header v-if="!isLoginPage" />

    <main class="p-6 flex justify-center">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import Header from "./components/Header.vue";

const route = useRoute();
const isLoginPage = computed(() => route.name === "Login");
</script>
