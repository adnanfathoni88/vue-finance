<template>
  <div class="min-h-screen md:w-3/4 w-full bg-neutral-900 text-white py-6">
    <h1 class="text-3xl text-neutral-400 font-bold mb-6 text-center">
      Categories
    </h1>
    <CategoryManager />
  </div>
</template>

<script setup>
import CategoryManager from "../components/CategoryManager.vue";
</script>
