<template>
  <header v-if="isAuthenticated" class="border-b border-neutral-700">
    <!-- desktop -->
    <nav class="hidden md:flex justify-center items-center gap-6 p-4">
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="text-neutral-400 hover:text-indigo-400 font-semibold"
        active-class="text-indigo-400"
      >
        {{ link.label }}
      </RouterLink>

      <button
        class="text-neutral-400 hover:text-red-400 font-semibold flex items-center gap-2 focus:outline-none"
        @click="onLogout"
      >
        <!-- <font-awesome-icon icon="fa-solid fa-right-from-bracket" /> -->
        Logout
      </button>
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

      <button
        class="text-left text-neutral-400 hover:text-red-400 font-semibold p-4 flex items-center gap-2 focus:outline-none"
        @click="onLogout"
      >
        <font-awesome-icon icon="fa-solid fa-right-from-bracket" />
        Logout
      </button>
    </nav>
  </header>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const { isAuthenticated, logout } = useAuth();

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/transactions", label: "Transactions" },
  { to: "/all-transactions", label: "All Transactions" },
  { to: "/categories", label: "Categories" },
];

const isMenuOpen = ref(false);

async function onLogout() {
  isMenuOpen.value = false;
  await logout();
  router.replace("/login");
}
</script>
