import { createRouter, createWebHistory } from "vue-router";
import DashboardPage from "../pages/DashboardPage.vue";
import TransactionsPage from "../pages/TransactionsPage.vue";
import AllTransaction from "../pages/AllTransaction.vue";
import CategoriesPage from "../pages/CategoriesPage.vue";
import LoginPage from "../pages/LoginPage.vue";
import { useAuth } from "../composables/useAuth";

const routes = [
  {
    path: "/",
    name: "Dashboard",
    component: DashboardPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/transactions",
    name: "Transactions",
    component: TransactionsPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/all-transactions",
    name: "AllTransactions",
    component: AllTransaction,
    meta: { requiresAuth: true },
  },
  {
    path: "/categories",
    name: "Categories",
    component: CategoriesPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
    meta: { guestOnly: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const { ensureSession, isAuthenticated } = useAuth();

  if (to.meta.requiresAuth || to.meta.guestOnly) {
    await ensureSession();
  }

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: "Login", query: { redirect: to.fullPath } };
  }

  if (to.meta.guestOnly && isAuthenticated.value) {
    return { name: "Dashboard" };
  }

  return true;
});

export default router;
