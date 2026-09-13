<template>
  <div class="mb-4">
    <h1 class="text-3xl text-neutral-400 font-bold text-start">
      All Transactions
    </h1>
  </div>

  <!-- filter (mobile) -->
  <div class="md:hidden flex flex-col gap-4 mb-6 mt-6">
    <!-- Search -->
    <input
      v-model="searchQuery"
      type="text"
      placeholder="Search..."
      class="rounded p-2 bg-neutral-800 border border-neutral-700 text-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />

    <button
      @click="showFilterModal = true"
      class="relative bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-center gap-2"
    >
      <font-awesome-icon icon="fa-solid fa-filter" />
      Filter
      <span
        v-if="activeFilterCount"
        class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
      >
        {{ activeFilterCount }}
      </span>
    </button>
  </div>

  <!-- filter (desktop) -->
  <div class="hidden md:grid md:grid-cols-5 gap-4 mb-6 mt-6">
    <!-- Search -->
    <input
      v-model="searchQuery"
      type="text"
      placeholder="Search..."
      class="rounded p-2 bg-neutral-800 border border-neutral-700 text-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />

    <TransactionFilterFields
      class="contents"
      v-model:type="selectedType"
      v-model:category="selectedCategory"
      v-model:month="selectedMonth"
      v-model:date="selectedDate"
      :categories="categories"
    />
  </div>

  <p v-if="activeFilterText" class="text-sm text-neutral-400 mb-4">
    {{ activeFilterText }}
  </p>

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
              <th class="p-2 text-center"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, i) in filteredTransactions"
              :key="item.id ?? i"
              class="border-b border-neutral-700 hover:bg-neutral-700/40"
            >
              <td class="p-2 w-28">
                <span>
                  {{ formatDate(item.date) }}
                </span>
              </td>
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
              <td class="p-2 text-center">
                <div class="flex justify-center gap-4">
                  <button
                    class="text-blue-400 hover:text-blue-300"
                    @click="openModal(item)"
                  >
                    <font-awesome-icon icon="fa-solid fa-eye" />
                  </button>
                  <button
                    class="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="deletingId === item.id"
                    @click="removeTransaction(item)"
                  >
                    <font-awesome-icon icon="fa-solid fa-trash" />
                  </button>
                </div>
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

  <!-- Modal -->
  <div
    v-if="showModal"
    class="fixed inset-0 flex items-center justify-center bg-black/60 z-50"
  >
    <div class="bg-neutral-800 text-white p-6 rounded-2xl w-96 shadow-lg">
      <h2 class="text-xl font-semibold mb-3">Transaction Detail</h2>
      <hr class="py-2 opacity-50" />
      <p class="mb-2">
        <strong>Date</strong> <br />
        {{ formatDate(selectedItem.date) }}
      </p>
      <p class="mb-2">
        <strong>Type</strong> <br />
        {{ selectedItem.type }}
      </p>
<p class="mb-2">
          <strong>Category</strong> <br />
          {{ selectedItem.category_name }}
        </p>
      <p class="mb-2">
        <strong>Nominal</strong> <br />
        {{ formatRupiah(selectedItem.nominal) }}
      </p>
      <p class="mt-3"><strong>Description</strong> <br /></p>
      <p class="text-neutral-300">{{ selectedItem.description }}</p>

      <div class="mt-5 flex justify-end gap-2">
        <button
          class="px-4 py-1 bg-red-500 hover:bg-red-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="deletingId === selectedItem.id"
          @click="removeTransaction(selectedItem)"
        >
          <font-awesome-icon icon="fa-solid fa-trash" class="mr-1" />
          Delete
        </button>
        <button
          class="px-4 py-1 bg-neutral-600 hover:bg-neutral-500 rounded-md"
          @click="closeModal"
        >
          Close
        </button>
      </div>
    </div>
  </div>

  <!-- Filter Modal (mobile) -->
  <div
    v-if="showFilterModal"
    class="fixed inset-0 flex items-center justify-center bg-black/60 z-50 md:hidden"
  >
    <div class="bg-neutral-800 text-white p-6 rounded-2xl w-96 shadow-lg">
      <h2 class="text-xl font-semibold mb-3">Filter</h2>
      <hr class="py-2 opacity-50" />

      <TransactionFilterFields
        class="flex flex-col gap-4"
        v-model:type="selectedType"
        v-model:category="selectedCategory"
        v-model:month="selectedMonth"
        v-model:date="selectedDate"
        :categories="categories"
      />

      <div class="mt-5 flex justify-end gap-2">
        <button
          class="px-4 py-1 bg-neutral-600 hover:bg-neutral-500 rounded-md"
          @click="resetFilters"
        >
          Reset
        </button>
        <button
          class="px-4 py-1 bg-indigo-500 hover:bg-indigo-600 rounded-md"
          @click="showFilterModal = false"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import api, { getErrorMessage } from "../services/api";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import TransactionFilterFields from "./TransactionFilterFields.vue";

const transactions = ref([]);
const categories = ref([]);

// filter
const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(
  now.getMonth() + 1
).padStart(2, "0")}`;

const searchQuery = ref("");
const selectedType = ref("");
const selectedCategory = ref("");
const selectedMonth = ref(currentMonth);
const selectedDate = ref("");
const showFilterModal = ref(false);
const showModal = ref(false);
const selectedItem = ref(null);
const deletingId = ref(null);

function resetFilters() {
  selectedType.value = "";
  selectedCategory.value = "";
  selectedMonth.value = currentMonth;
  selectedDate.value = "";
}

const activeFilterCount = computed(
  () =>
    [selectedType.value, selectedCategory.value, selectedDate.value].filter(
      Boolean
    ).length
);

function openModal(item) {
  selectedItem.value = item;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  selectedItem.value = null;
}

async function removeTransaction(item) {
  if (deletingId.value) return;

  const category = item.category_name ?? "No category";
  const confirmed = confirm(
    `Delete transaction "${category}"?\n\nDate: ${formatDate(item.date)}\nAmount: Rp${formatRupiah(item.nominal)}`
  );
  if (!confirmed) return;

  deletingId.value = item.id;

  try {
    await api.delete(`/transactions/${item.id}`);
    alert("Transaction successfully deleted");
    if (selectedItem.value?.id === item.id) closeModal();
    await fetchTransactions();
  } catch (err) {
    console.error("Error:", err);
    alert(getErrorMessage(err, "Failed to delete transaction"));
  } finally {
    deletingId.value = null;
  }
}

// Fetch data
async function fetchTransactions() {
  try {
    const res = await api.get("/transactions");
    transactions.value = res.data;
    transactions.value.sort((a, b) => (a.date < b.date ? 1 : -1));
  } catch (err) {
    console.error("Failed to fetch transactions:", err);
  }
}

// filter
const filteredTransactions = computed(() => {
  return transactions.value.filter((tx) => {
    const matchSearch =
      tx.category_name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      tx.type?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      tx.date?.includes(searchQuery.value) ||
      String(tx.nominal ?? "").includes(searchQuery.value);

    const matchType = !selectedType.value || tx.type === selectedType.value;
    const matchCategory =
      !selectedCategory.value || tx.category_name === selectedCategory.value;

    const matchDate = selectedDate.value
      ? tx.date.startsWith(selectedDate.value)
      : tx.date.startsWith(selectedMonth.value);

    return matchSearch && matchType && matchCategory && matchDate;
  });
});

// ringkasan filter yang sedang aktif
const activeFilterText = computed(() => {
  const parts = [];

  if (searchQuery.value) parts.push(`Search: "${searchQuery.value}"`);
  if (selectedType.value)
    parts.push(`Type: ${selectedType.value === "income" ? "Income" : "Outcome"}`);
  if (selectedCategory.value)
    parts.push(`Category: ${selectedCategory.value}`);
  if (selectedDate.value) {
    const label = new Date(selectedDate.value).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    parts.push(`Date: ${label}`);
  } else if (selectedMonth.value) {
    const [year, month] = selectedMonth.value.split("-");
    const label = new Date(Number(year), Number(month) - 1).toLocaleString(
      "en-US",
      { month: "long", year: "numeric" }
    );
    parts.push(`Period: ${label}`);
  }

  return parts.length ? `Filter By — ${parts.join(" ; ")}` : "";
});

// get category
async function getCategory() {
  api
    .get("/categories")
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

// format tanggal 2025-11-11T00:00:00.000Z => 11-11-2025
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
</script>
