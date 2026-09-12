<template>
  <header class="border-b border-neutral-700">
    <!-- desktop -->
    <nav class="hidden md:flex justify-center gap-6 p-4">
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="text-neutral-400 hover:text-indigo-400 font-semibold"
        active-class="text-indigo-400"
      >
        {{ link.label }}
      </RouterLink>
    </nav>

    <!-- mobile -->
    <div class="md:hidden flex justify-end p-4">
      <button
        class="text-neutral-400 hover:text-indigo-400 focus:outline-none"
        @click="isMenuOpen = !isMenuOpen"
      >
        <font-awesome-icon
          :icon="isMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'"
        />
      </button>
    </div>

    <nav
      v-if="isMenuOpen"
      class="md:hidden flex flex-col border-t border-neutral-700"
    >
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="text-neutral-400 hover:text-indigo-400 font-semibold p-4"
        active-class="text-indigo-400"
        @click="isMenuOpen = false"
      >
        {{ link.label }}
      </RouterLink>
    </nav>
  </header>
</template>

<script setup>
import { ref } from "vue";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/transactions", label: "Transactions" },
  { to: "/all-transactions", label: "All Transactions" },
  { to: "/categories", label: "Categories" },
];

const isMenuOpen = ref(false);
</script>
