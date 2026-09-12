<template>
  <div>
    <!-- Type -->
    <select
      v-model="type"
      class="rounded p-2 bg-neutral-800 border border-neutral-700 text-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <option value="">All Types</option>
      <option value="income">Income</option>
      <option value="outcome">Outcome</option>
    </select>

    <!-- Category -->
    <select
      v-model="category"
      class="rounded p-2 bg-neutral-800 border border-neutral-700 text-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <option value="">All Categories</option>
      <option v-for="cat in categories" :key="cat.name" :value="cat.name">
        {{ cat.name }}
      </option>
    </select>

    <!-- Month -->
    <input
      v-model="month"
      type="month"
      style="color-scheme: dark"
      class="rounded w-full p-2 bg-neutral-800 border border-neutral-700 text-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>
</template>

<script setup>
defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
});

const type = defineModel("type");
const category = defineModel("category");
const month = defineModel("month");
</script>
