<template>
  <div class="bg-neutral-900 p-4 rounded-xl">
    <h2 class="text-lg font-semibold text-white mb-4">Outcome by Category</h2>
    <apexchart
      width="100%"
      height="320"
      type="pie"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>

<script setup>
import { computed } from "vue";
import ApexCharts from "vue3-apexcharts";

const props = defineProps({
  transactions: {
    type: Array,
    required: true,
  },
});

// 🔹 Filter hanya Outcome
const outcomeData = computed(() =>
  props.transactions.filter((tx) => tx.type === "Outcome")
);

// 🔹 Kelompokkan total per kategori
const grouped = computed(() => {
  const result = {};
  outcomeData.value.forEach((tx) => {
    const cat = tx.category || "Uncategorized";
    const nominal = parseInt(tx.nominal) || 0;
    result[cat] = (result[cat] || 0) + nominal;
  });
  return result;
});

// 🔹 Label & nilai untuk chart
const labels = computed(() => Object.keys(grouped.value));
const series = computed(() => Object.values(grouped.value));

// 🔹 Opsi Chart
const chartOptions = computed(() => ({
  // outline border stroke none

  chart: {
    background: "transparent",
    toolbar: { show: false },
  },
  stroke: { show: false },
  labels: labels.value,
  legend: {
    position: "bottom",
    labels: { colors: "#ccc" },
    strokeWidth: 0,
  },
  tooltip: {
    y: {
      formatter: (val) => `Rp ${new Intl.NumberFormat("id-ID").format(val)}`,
    },
  },
  dataLabels: {
    formatter: (val) => `${val.toFixed(1)}%`,
    style: { colors: ["#fff"] },
  },
  colors: [
    "#6366F1", // Indigo
    "#10B981", // Emerald
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#3B82F6", // Blue
    "#8B5CF6", // Violet
  ],
}));
</script>

<script>
export default {
  components: {
    apexchart: ApexCharts,
  },
};
</script>
