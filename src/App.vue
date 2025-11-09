<template>
  <div class="bg-neutral-900 min-h-screen text-white">
    <nav class="flex justify-center gap-6 p-4 border-b border-neutral-700">
      <RouterLink
        to="/"
        class="text-neutral-400 hover:text-indigo-400 font-semibold"
        active-class="text-indigo-400"
      >
        Dashboard
      </RouterLink>
      <RouterLink
        to="/transactions"
        class="text-neutral-400 hover:text-indigo-400 font-semibold"
        active-class="text-indigo-400"
      >
        Transactions
      </RouterLink>

      <RouterLink
        to="/all-transactions"
        class="text-neutral-400 hover:text-indigo-400 font-semibold"
        active-class="text-indigo-400"
      >
        All Transactions
      </RouterLink>
    </nav>

    <main class="p-6 flex justify-center">
      <RouterView />
    </main>
  </div>
</template>

<script setup></script>
