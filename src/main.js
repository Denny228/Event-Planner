import Vue from "vue";
import App from "./App.vue";
import router from "./router";

// Bootstrap stilovi (mora biti prije mount-a)
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
// Globalni EventPlanner stilovi — moraju biti nakon Bootstrapa da override radi
import "@/assets/stilovi.css";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

// Firebase initializeApp — izvršava se pri učitavanju modula
import "./firebase";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

Vue.config.productionTip = false;

new Vue({
  router,
  render: (h) => h(App),
}).$mount("#app");
