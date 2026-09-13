<template>
  <div class="p-4 rounded-xl">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">Category List</h2>

      <button
        @click="openCreate"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-2"
      >
        <font-awesome-icon icon="fa-solid fa-plus" />
        Add Category
      </button>
    </div>

    <div class="bg-neutral-800 rounded-xl p-4 shadow">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-neutral-400 text-sm border-b border-neutral-700">
              <th class="p-2 w-20">ID</th>
              <th class="p-2">Name</th>
              <th class="p-2 w-28">Type</th>
              <th class="p-2 text-center w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in categories"
              :key="item.id"
              class="border-b border-neutral-700 hover:bg-neutral-700/40"
            >
              <td class="p-2">{{ item.id }}</td>
              <td class="p-2">{{ item.name }}</td>
              <td class="p-2">
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-semibold"
                  :class="
                    item.type === 'income'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  "
                >
                  {{ item.type === "income" ? "Income" : "Outcome" }}
                </span>
              </td>
              <td class="p-2 text-center">
                <div class="flex justify-center gap-4">
                  <button
                    class="text-blue-400 hover:text-blue-300"
                    @click="openEdit(item)"
                  >
                    <font-awesome-icon icon="fa-solid fa-pen" />
                  </button>
                  <button
                    class="text-red-400 hover:text-red-300"
                    @click="removeCategory(item)"
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
        v-if="!categories.length"
        class="text-neutral-500 text-center mt-4"
      >
        No categories yet.
      </p>
    </div>
  </div>

  <!-- Modal -->
  <div
    v-if="showModal"
    class="fixed inset-0 flex items-center justify-center bg-black/60 z-50"
  >
    <div class="bg-neutral-800 text-white p-6 rounded-2xl w-96 shadow-lg">
      <h2 class="text-xl font-semibold mb-3">
        {{ editing ? "Edit Category" : "Add Category" }}
      </h2>
      <hr class="py-2 opacity-50" />

      <div class="flex flex-col gap-2">
        <label class="text-neutral-400 text-sm font-semibold">Name</label>
        <input
          v-model="formName"
          type="text"
          maxlength="100"
          required
          placeholder="Category name"
          class="text-neutral-400 bg-neutral-950 rounded p-2 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-500"
          @keyup.enter="saveCategory"
        />

        <label class="text-neutral-400 text-sm font-semibold mt-2">Type</label>
        <select
          v-model="formType"
          class="text-neutral-400 bg-neutral-950 rounded p-2 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-500"
        >
          <option value="income">Income</option>
          <option value="outcome">Outcome</option>
        </select>
      </div>

      <div class="mt-5 flex justify-end gap-2">
        <button
          class="px-4 py-1 bg-neutral-600 hover:bg-neutral-500 rounded-md"
          @click="closeModal"
        >
          Cancel
        </button>
        <button
          :disabled="isSubmitting"
          class="px-4 py-1 bg-indigo-500 hover:bg-indigo-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          @click="saveCategory"
        >
          {{ isSubmitting ? "Saving..." : "Save" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api, { getErrorMessage } from "../services/api";

const categories = ref([]);
const showModal = ref(false);
const editing = ref(null);
const formName = ref("");
const formType = ref("outcome");
const isSubmitting = ref(false);

function cacheCategories() {
  localStorage.setItem("categoriesData", JSON.stringify(categories.value));
}

async function fetchCategories() {
  try {
    const res = await api.get("/categories");
    categories.value = res.data;
    cacheCategories();
  } catch (err) {
    console.error("Failed to fetch categories:", err);
    alert(getErrorMessage(err, "Failed to load categories"));
  }
}

function openCreate() {
  editing.value = null;
  formName.value = "";
  formType.value = "outcome";
  showModal.value = true;
}

function openEdit(item) {
  editing.value = item;
  formName.value = item.name;
  formType.value = item.type ?? "outcome";
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editing.value = null;
  formName.value = "";
  formType.value = "outcome";
}

async function saveCategory() {
  if (isSubmitting.value) return;

  const name = formName.value.trim();
  if (!name) {
    alert("Name is required");
    return;
  }

  if (!["income", "outcome"].includes(formType.value)) {
    alert("Type is required");
    return;
  }

  isSubmitting.value = true;

  try {
    if (editing.value) {
      await api.put(`/categories/${editing.value.id}`, {
        name,
        type: formType.value,
      });
      alert("Category successfully updated");
    } else {
      await api.post("/categories", { name, type: formType.value });
      alert("Category successfully saved");
    }

    closeModal();
    await fetchCategories();
  } catch (err) {
    console.error("Error:", err);
    alert(getErrorMessage(err, "Failed to save category"));
  } finally {
    isSubmitting.value = false;
  }
}

async function removeCategory(item) {
  if (!confirm(`Delete category "${item.name}"?`)) return;

  try {
    await api.delete(`/categories/${item.id}`);
    alert("Category successfully deleted");
    await fetchCategories();
  } catch (err) {
    console.error("Error:", err);
    alert(getErrorMessage(err, "Failed to delete category"));
  }
}

onMounted(fetchCategories);
</script>
