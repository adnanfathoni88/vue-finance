<template>
  <div class="bg-neutral-900 min-h-screen text-white">
    <Header />

    <main class="p-6 flex justify-center">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import Header from "./components/Header.vue";
</script>
