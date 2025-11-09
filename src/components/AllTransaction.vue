<template>
  <div class="flex justify-between items-center mb-4">
    <h1 class="text-3xl text-neutral-400 font-bold text-center">
      All Transactions
    </h1>

    <button
      @click="isFilter = !isFilter"
      class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <font-awesome-icon icon="fa-solid fa-filter" />
    </button>
  </div>

  <!-- filter -->
  <div
    v-if="isFilter"
    class="grid md:grid-cols-4 sm:grid-cols-2 gap-4 mb-6 mt-6"
  >
    <!-- Search -->
    <input
      v-model="searchQuery"
      type="text"
      placeholder="Search..."
      class="rounded p-2 bg-neutral-800 border border-neutral-700 text-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />

    <!-- Type -->
    <select
      v-model="selectedType"
      class="rounded p-2 bg-neutral-800 border border-neutral-700 text-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <option value="">All Types</option>
      <option value="Income">Income</option>
      <option value="Outcome">Outcome</option>
    </select>

    <!-- Category -->
    <select
      v-model="selectedCategory"
      class="rounded p-2 bg-neutral-800 border border-neutral-700 text-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <option value="">All Categories</option>
      <option v-for="cat in categories" :key="cat.name" :value="cat.name">
        {{ cat.name }}
      </option>
    </select>

    <!-- Month -->
    <input
      v-model="selectedMonth"
      type="month"
      class="rounded p-2 bg-neutral-800 border border-neutral-700 text-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>

  <!-- History Table -->
  <div class="min-h-screen bg-neutral-900 text-white py-6">
    <div class="bg-neutral-800 rounded-xl p-4 shadow">
      <div
        class="flex justify-between items-center border-b border-neutral-700 mb-4 pb-2"
      >
        <h2 class="text-xl font-semibold">Transactions</h2>
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
              v-for="(item, i) in filteredTransactions"
              :key="i"
              class="border-b border-neutral-700 hover:bg-neutral-700/40"
            >
              <td class="p-2 w-28">{{ item.date }}</td>
              <td
                class="p-2 font-medium"
                :class="{
                  'text-green-400': item.type === 'Income',
                  'text-red-400': item.type === 'Outcome',
                }"
              >
                <span v-if="item.type === 'Income'">In</span>
                <span v-else>Out</span>
              </td>
              <td class="p-2">{{ item.category }}</td>
              <td class="p-2 text-right">
                {{ formatRupiah(item.nominal) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p
        v-if="!filteredTransactions.length"
        class="text-neutral-500 text-center mt-4"
      >
        No transactions yet.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const SHEETDB_API = import.meta.env.VITE_SHEETDB_API;

const transactions = ref([]);
const categories = ref([]);
const isFilter = ref(false);

// filter
const searchQuery = ref("");
const selectedType = ref("");
const selectedCategory = ref("");
const selectedMonth = ref("");

console.log("selectedCategory:", selectedCategory);

// Fetch data
async function fetchTransactions() {
  try {
    const cached = localStorage.getItem("transactionData");
    if (cached) {
      transactions.value = JSON.parse(cached);
      transactions.value.sort((a, b) => (a.date < b.date ? 1 : -1));
    } else {
      const res = await axios.get(`${SHEETDB_API}?sheet=transactions`);
      transactions.value = res.data;
      transactions.value.sort((a, b) => (a.date < b.date ? 1 : -1));
      localStorage.setItem("transactionData", JSON.stringify(res.data));
    }
  } catch (err) {
    console.error("Failed to fetch transactions:", err);
  }
}

// filter
const filteredTransactions = computed(() => {
  return transactions.value.filter((tx) => {
    const matchSearch =
      tx.category?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      tx.type?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      tx.date?.includes(searchQuery.value) ||
      tx.nominal?.includes(searchQuery.value);

    const matchType = !selectedType.value || tx.type === selectedType.value;
    const matchCategory =
      !selectedCategory.value || tx.category === selectedCategory.value;

    const matchMonth =
      !selectedMonth.value || tx.date.startsWith(selectedMonth.value);

    return matchSearch && matchType && matchCategory && matchMonth;
  });
});

// get category
async function getCategory() {
  const cachedCategories = localStorage.getItem("categoriesData");
  if (cachedCategories) {
    categories.value = JSON.parse(cachedCategories);
    console.log("Categories loaded from cache:", categories.value);
    return;
  }

  axios
    .get(`${SHEETDB_API}?sheet=categories`)
    .then((response) => {
      console.log("Categories fetched:", response.data);
      categories.value = response.data;
      localStorage.setItem("categoriesData", JSON.stringify(response.data));
    })
    .catch((error) => {
      console.error("Error fetching categories:", error);
    });
}

onMounted(fetchTransactions);
onMounted(getCategory);

// Format ke Rupiah
function formatRupiah(value) {
  if (!value) return "0";
  return Number(value).toLocaleString("id-ID", {
    minimumFractionDigits: 0,
  });
}
</script>
