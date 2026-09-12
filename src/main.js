import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import { useAuth } from "./composables/useAuth";
import { setUnauthorizedHandler } from "./services/api";

import FontAwesomeIcon from "./plugins/fontawesome.js";

const app = createApp(App);
app.component("font-awesome-icon", FontAwesomeIcon); // daftarkan global
app.use(router);

const { clear } = useAuth();
let redirecting = false;

setUnauthorizedHandler(() => {
  clear();

  const current = router.currentRoute.value;
  if (redirecting || current.name === "Login") return;

  redirecting = true;
  router
    .replace({ name: "Login", query: { redirect: current.fullPath } })
    .finally(() => {
      redirecting = false;
    });
});

app.mount("#app");
