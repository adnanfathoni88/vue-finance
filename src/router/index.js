import { createRouter, createWebHistory } from "vue-router";
import DashboardPage from "../pages/DashboardPage.vue";
import TransactionsPage from "../pages/TransactionsPage.vue";
import AllTransaction from "../pages/AllTransaction.vue";
import CategoriesPage from "../pages/CategoriesPage.vue";

const routes = [
  { path: "/", name: "Dashboard", component: DashboardPage },
  { path: "/transactions", name: "Transactions", component: TransactionsPage },
  {
    path: "/all-transactions",
    name: "AllTransactions",
    component: AllTransaction,
  },
  { path: "/categories", name: "Categories", component: CategoriesPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
