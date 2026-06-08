import Vue from "vue";
import VueRouter from "vue-router";
import { auth } from "@/firebase";

import Login from "@/views/Login.vue";
import Register from "@/views/Register.vue";
import Home from "@/views/Home.vue";
import Dogadaji from "@/views/Dogadaji.vue";
import Statistika from "@/views/Statistika.vue";
import Profil from "@/views/Profil.vue";

Vue.use(VueRouter);

const routes = [
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  { path: "/", component: Home, meta: { traziPrijavu: true } },
  { path: "/dogadaji", component: Dogadaji, meta: { traziPrijavu: true } },
  { path: "/statistika", component: Statistika, meta: { traziPrijavu: true } },
  { path: "/profil", component: Profil, meta: { traziPrijavu: true } },
];

const router = new VueRouter({
  mode: "history",
  routes,
});

// auth.currentUser je null dok Firebase ne potvrdi stanje — čekamo prvi onAuthStateChanged
let trenutniKorisnik = null;
let authInicijaliziran = false;
let authInicijalizacija = null;

function inicijalizirajAuth() {
  if (!authInicijalizacija) {
    authInicijalizacija = new Promise((resolve) => {
      auth.onAuthStateChanged((korisnik) => {
        trenutniKorisnik = korisnik;
        if (!authInicijaliziran) {
          authInicijaliziran = true;
          resolve();
        }
      });
    });
  }
  return authInicijalizacija;
}

router.beforeEach(async (to, from, next) => {
  await inicijalizirajAuth();

  const traziPrijavu = to.matched.some((ruta) => ruta.meta.traziPrijavu);
  const prijavljen = trenutniKorisnik !== null;

  if (traziPrijavu && !prijavljen) {
    next("/login");
  } else if (prijavljen && (to.path === "/login" || to.path === "/register")) {
    next("/");
  } else {
    next();
  }
});

export default router;
