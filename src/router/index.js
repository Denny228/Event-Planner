import Vue from "vue";
import VueRouter from "vue-router";
import { auth } from "@/firebase";
import { jeAdmin, pocetnaRutaZaKorisnika } from "@/utils/uloga";
import { postaviSigurnuNavigaciju } from "@/utils/routerNavigacija";

import Login from "@/views/Login.vue";
import Register from "@/views/Register.vue";
import Home from "@/views/Home.vue";
import Dogadaji from "@/views/Dogadaji.vue";
import Statistika from "@/views/Statistika.vue";
import Profil from "@/views/Profil.vue";
import AdminPanel from "@/views/AdminPanel.vue";
import Rezervacija from "@/views/Rezervacija.vue";

Vue.use(VueRouter);

const routes = [
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  { path: "/", component: Home, meta: { traziPrijavu: true } },
  { path: "/dogadaji", component: Dogadaji, meta: { traziPrijavu: true } },
  { path: "/statistika", component: Statistika, meta: { traziPrijavu: true } },
  { path: "/profil", component: Profil, meta: { traziPrijavu: true } },
  {
    path: "/admin",
    component: AdminPanel,
    meta: { traziPrijavu: true, traziAdmin: true },
  },
  {
    path: "/rezervacija",
    component: Rezervacija,
    meta: { traziPrijavu: true, traziKlijent: true },
  },
];

const router = new VueRouter({
  mode: "history",
  routes,
});

postaviSigurnuNavigaciju(router);

function preusmjeri(next, trenutnaPutanja, ciljnaPutanja) {
  if (trenutnaPutanja === ciljnaPutanja) {
    next();
    return;
  }

  next(ciljnaPutanja);
}

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

  // auth.currentUser je odmah dostupan nakon prijave; listener može kasniti
  const korisnik = auth.currentUser || trenutniKorisnik;
  const traziPrijavu = to.matched.some((ruta) => ruta.meta.traziPrijavu);
  const traziAdminUlogu = to.matched.some((ruta) => ruta.meta.traziAdmin);
  const traziKlijentUlogu = to.matched.some((ruta) => ruta.meta.traziKlijent);
  const prijavljen = korisnik !== null;
  const jeAdminKorisnik = jeAdmin(korisnik);
  const pocetnaRuta = pocetnaRutaZaKorisnika(korisnik);

  if (traziPrijavu && !prijavljen) {
    next("/login");
    return;
  }

  if (prijavljen && (to.path === "/login" || to.path === "/register")) {
    preusmjeri(next, to.path, pocetnaRuta);
    return;
  }

  // Admin rute — klijent ne smije pristupiti ni direktnim URL-om
  if (traziAdminUlogu && !jeAdminKorisnik) {
    preusmjeri(next, to.path, "/rezervacija");
    return;
  }

  // Klijentske rute — admin ide na svoj panel
  if (traziKlijentUlogu && jeAdminKorisnik) {
    preusmjeri(next, to.path, "/admin");
    return;
  }

  // Početna ruta preusmjerava na pogled uloge
  if (prijavljen && to.path === "/") {
    preusmjeri(next, to.path, pocetnaRuta);
    return;
  }

  next();
});

export default router;
