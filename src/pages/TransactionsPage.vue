<template>
  <div class="min-h-screen md:w-3/4 w-full bg-neutral-900 text-white py-6">
    <h1 class="text-3xl text-neutral-400 font-bold mb-6 text-center">
      Transactions
    </h1>
    <TransactionForm @added="fetchTransactions" />
  </div>
</template>

<script setup>
import axios from "axios";
import TransactionForm from "../components/TransactionForm.vue";
</script>
