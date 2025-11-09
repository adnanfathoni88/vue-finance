import { createRouter, createWebHistory } from "vue-router";
import DashboardPage from "../pages/DashboardPage.vue";
import TransactionsPage from "../pages/TransactionsPage.vue";
import AllTransaction from "../pages/AllTransaction.vue";

const routes = [
  { path: "/", name: "Dashboard", component: DashboardPage },
  { path: "/transactions", name: "Transactions", component: TransactionsPage },
  {
    path: "/all-transactions",
    name: "AllTransactions",
    component: AllTransaction,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
