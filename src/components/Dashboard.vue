<template>
  <div class="min-h-screen bg-neutral-900 text-white py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl text-neutral-400 font-bold">
        Dashboard
      </h1>

      <!-- filter bulan tahun -->
      <div class="flex items-center space-x-2">
        <select
          id="month"
          v-model="thisMonth"
          class="bg-neutral-800 text-white p-1 rounded"
        >
          <option v-for="m in 12" :key="m" :value="m">
            {{ new Date(0, m - 1).toLocaleString("en-US", { month: "long" }) }}
          </option>
        </select>

        <select
          id="year"
          v-model="thisYear"
          class="bg-neutral-800 text-white p-1 rounded"
        >
          <option v-for="y in 5" :key="y" :value="2021 + y">
            {{ 2021 + y }}
          </option>
        </select>
      </div>
    </div>


    <!-- Summary -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="relative bg-neutral-800 p-4 rounded-xl shadow text-center">
        <!-- icon up -->
        <div class="absolute right-4 top-4 p-2 rounded-full">
          <font-awesome-icon
            class="text-green-600"
            icon="fa-solid fa-arrow-up"
          />
        </div>

        <h2 class="text-md opacity-70">Total Income</h2>
        <p class="text-2xl font-bold mt-2 text-neutral-200">
          {{ formatRupiah(totalIncome) }}
        </p>
      </div>
      <div class="relative bg-neutral-800 p-4 rounded-xl shadow text-center">
        <!-- icon down -->
        <div class="absolute right-4 top-4 p-2 rounded-full">
          <font-awesome-icon
            class="text-red-600"
            icon="fa-solid fa-arrow-down"
          />
        </div>

        <h2 class="text-md opacity-70">Total Outcome</h2>
        <p class="text-2xl font-bold mt-2 text-neutral-200">
          {{ formatRupiah(totalOutcome) }}
        </p>
      </div>
      <div class="bg-neutral-800 p-4 rounded-xl shadow text-center">
        <h2 class="text-md opacity-70">Balance</h2>
        <p class="text-2xl font-bold mt-2 text-neutral-200">
          {{ formatRupiah(balance) }}
        </p>
      </div>
    </div>

    <!-- History Table -->
    <div class="bg-neutral-800 rounded-xl p-4 shadow">
      <div
        class="flex justify-between items-center border-b border-neutral-700 mb-4 pb-2"
      >
        <h2 class="text-xl font-semibold">Latest Transactions</h2>

        <router-link
          to="/all-transactions"
          class="text-indigo-500 hover:underline text-sm"
          >View All</router-link
        >
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-neutral-400 text-sm border-b border-neutral-700">
              <th class="p-2">Date</th>
              <th class="p-2">Type</th>
              <th class="p-2">Category</th>
              <th class="p-2 text-right">Nominal</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, i) in latestTransactions"
              :key="i"
              class="border-b border-neutral-700 hover:bg-neutral-700/40"
            >
              <td class="p-2">{{ formatDate(item.date) }}</td>
              <td
                class="p-2 font-medium"
                :class="{
                  'text-green-400': item.type === 'income',
                  'text-red-400': item.type === 'outcome',
                }"
              >
                <span v-if="item.type === 'income'">In</span>
                <span v-else>Out</span>
              </td>
              <td class="p-2">{{ item.category_name }}</td>
              <td class="p-2 text-right">
                {{ formatRupiah(item.nominal) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="!transactions.length" class="text-neutral-500 text-center mt-4">
        No transactions yet.
      </p>
    </div>

    <!-- chart -->
    <CategoryPieChart :transactions="transactions" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import CategoryPieChart from "./CategoryPieChart.vue";
import api from "../services/api";

const allTransactions = ref([]);
const thisMonth = ref(new Date().getMonth() + 1);
const thisYear = ref(new Date().getFullYear());

// Fetch all transactions
async function fetchTransactions() {
  try {
    const res = await api.get("/transactions");
    allTransactions.value = res.data;
  } catch (err) {
    console.error("Failed to fetch transactions:", err);
  }
}

// Filter transactions by selected month and year
const transactions = computed(() => {
  return allTransactions.value.filter((tx) => {
    const txDate = new Date(tx.date);
    return (
      txDate.getMonth() + 1 === thisMonth.value &&
      txDate.getFullYear() === thisYear.value
    );
  });
});

// Watch for month/year changes and log
watch([thisMonth, thisYear], () => {
  console.log(`Filtering: Month ${thisMonth.value}, Year ${thisYear.value}`);
});

onMounted(fetchTransactions);

// Perhitungan
const totalIncome = computed(() => {
  return transactions.value
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.nominal || 0), 0);
});

const totalOutcome = computed(() => {
  return transactions.value
    .filter((t) => t.type === "outcome")
    .reduce((sum, t) => sum + Number(t.nominal || 0), 0);
});

const balance = computed(() => totalIncome.value - totalOutcome.value);

// Tampilkan hanya 5 transaksi terakhir
const latestTransactions = computed(() => {
  return [...transactions.value]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
});

// Format ke Rupiah
function formatRupiah(value) {
  if (!value) return "0";
  return Number(value).toLocaleString("id-ID", {
    minimumFractionDigits: 0,
  });
}

// format tanggal 2025-11-11T00:00:00.000Z => 11-11-2025
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
</script>
