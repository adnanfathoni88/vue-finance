import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router";

import FontAwesomeIcon from "./plugins/fontawesome.js";

const app = createApp(App);
app.component("font-awesome-icon", FontAwesomeIcon); // daftarkan global
app.use(router);
app.mount("#app");
