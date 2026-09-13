<template>
  <form @submit.prevent="addTransaction" class="p-4 rounded-xl">
    <div class="grid gap-3">
      <!-- date -->
      <div class="flex flex-col gap-2 w-full">
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
          <option value="income">Income</option>
          <option value="outcome">Outcome</option>
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
          <option
            v-for="item in availableCategories"
            :key="item.id"
            :value="item.id"
          >
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

      <!-- desc -->
      <div class="flex flex-col gap-2 w-full">
        <label class="text-neutral-400 text-sm p-0 m-0 font-semibold"
          >Description</label
        >
        <textarea
          v-model="description"
          type="text"
          placeholder="Description (optional)"
          rows="3"
          class="text-neutral-400 bg-neutral-950 rounded p-2 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-500"
        ></textarea>
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
import { ref, computed, watch, onMounted } from "vue";
import api, { getErrorMessage } from "../services/api";

// date now
const currentDate = new Date().toISOString().split("T")[0];
const currentType = "outcome";

const date = ref(currentDate);
const type = ref(currentType);
const nominal = ref("");
const displayNominal = ref("");
const description = ref("");
const categories = ref([]);
const category = ref("");
const isSubmitting = ref(false);

const availableCategories = computed(() =>
  categories.value.filter((item) => item.type === type.value)
);

watch(type, () => {
  if (!availableCategories.value.some((item) => item.id === category.value)) {
    category.value = "";
  }
});

async function addTransaction() {
  if (isSubmitting.value) return;

  isSubmitting.value = true;

  const newData = {
    date: date.value,
    type: type.value,
    category_id: category.value,
    nominal: Number(nominal.value),
    description: description.value.trim() || null,
  };

  try {
    const response = await api.post("/transactions", newData);

    console.log("Success:", response.data);
    alert("Data successfully saved");

    // reset form
    date.value = "";
    type.value = currentType;
    nominal.value = "";
    displayNominal.value = "";
    category.value = "";
    description.value = "";
  } catch (err) {
    console.error("Error:", err);
    alert(getErrorMessage(err, "Failed to save data"));
  } finally {
    isSubmitting.value = false;
  }
}

function formatNominal(e) {
  const raw = e.target.value.replace(/\D/g, "");
  nominal.value = raw;
  displayNominal.value = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

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

onMounted(() => {
  getCategory();
});
</script>
