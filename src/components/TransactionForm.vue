<template>
  <form @submit.prevent="addTransaction" class="p-4 rounded-xl">
    <div class="grid gap-3">
      <!-- date -->
      <div class="flex flex-col gap-2">
        <label class="text-neutral-400 text-sm p-0 m-0 font-semibold"
          >Date</label
        >
        <input
          v-model="date"
          type="date"
          required
          style="color-scheme: dark"
          class="text-neutral-400 bg-neutral-950 rounded p-2 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-500"
        />
      </div>

      <!-- type -->
      <div class="flex flex-col gap-2">
        <label class="text-neutral-400 text-sm p-0 m-0 font-semibold"
          >Type</label
        >
        <select
          v-model="type"
          required
          class="text-neutral-400 bg-neutral-950 rounded p-2 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-500"
        >
          <option value="Income">Income</option>
          <option value="Outcome">Outcome</option>
        </select>
      </div>

      <!-- category -->
      <div class="flex flex-col gap-2">
        <label class="text-neutral-400 text-sm p-0 m-0 font-semibold"
          >Category</label
        >
        <select
          v-model="category"
          required
          class="text-neutral-400 bg-neutral-950 rounded p-2 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-500"
        >
          <option disabled value="">Select Category</option>
          <option v-for="item in categories" :key="item.id" :value="item.name">
            {{ item.name }}
          </option>
        </select>
      </div>

      <!-- Nominal -->
      <div class="flex flex-col gap-2">
        <label class="text-neutral-400 text-sm p-0 m-0 font-semibold"
          >Nominal</label
        >
        <input
          v-model="displayNominal"
          type="text"
          placeholder="Nominal"
          required
          @input="formatNominal"
          class="text-neutral-400 bg-neutral-950 rounded p-2 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-500"
        />
      </div>

      <!-- Tombol simpan -->
      <button
        type="submit"
        :disabled="isSubmitting"
        class="bg-indigo-500 mt-4 text-white py-2 rounded hover:bg-primary-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isSubmitting ? "Saving..." : "Save" }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

// date now
const currentDate = new Date().toISOString().split("T")[0];
const currentType = "Outcome";

const date = ref(currentDate);
const type = ref(currentType);
const nominal = ref("");
const displayNominal = ref("");
const categories = ref([]);
const category = ref("");
const isSubmitting = ref(false);

const SHEETDB_API = import.meta.env.VITE_SHEETDB_API;

async function addTransaction() {
  if (isSubmitting.value) return;

  isSubmitting.value = true;

  const newData = {
    date: date.value,
    type: type.value,
    nominal: nominal.value,
    category: category.value,
  };

  try {
    await axios.post(SHEETDB_API, { data: [newData] });

    // save to localstorage
    const cached = JSON.parse(localStorage.getItem("transactionData")) || [];
    cached.push(newData);
    localStorage.setItem("transactionData", JSON.stringify(cached));

    // reset form
    date.value = "";
    type.value = "";
    nominal.value = "";
    displayNominal.value = "";
    category.value = "";

    alert("Data successfully saved");
  } catch (err) {
    console.error(err);
    alert("Failed to save data");
  } finally {
    isSubmitting.value = false; // selesai loading
  }
}

function formatNominal(e) {
  const raw = e.target.value.replace(/\D/g, "");
  nominal.value = raw;
  displayNominal.value = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

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

onMounted(() => {
  getCategory();
});
</script>
