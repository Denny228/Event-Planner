<template>
  <div id="app">
    <b-navbar
      v-if="prijavljen"
      toggleable="md"
      type="dark"
      variant="dark"
      class="navbar-eventplanner"
    >
      <b-navbar-toggle target="nav-collapse" />

      <b-collapse id="nav-collapse" is-nav>
        <!-- Tri zone: balans lijevo, centar (linkovi + logo), Profil desno -->
        <div class="navbar-triple w-100">
          <div
            class="navbar-zona navbar-zona-lijevo d-none d-md-block"
            aria-hidden="true"
          ></div>

          <div class="navbar-zona navbar-zona-sredina">
            <!-- Admin: panel + logo + statistika; klijent: samo logo (početna ruta) -->
            <b-navbar-nav v-if="jeAdminKorisnik" class="nav-grupa-centar">
              <b-nav-item to="/admin">Admin panel</b-nav-item>
            </b-navbar-nav>

            <b-navbar-brand :to="pocetnaRuta" class="navbar-brand-centar">
              <span class="logo-eventplanner logo-navbar">
                <span class="logo-event">Event</span><span class="logo-planner">Planner</span>
              </span>
            </b-navbar-brand>

            <b-navbar-nav v-if="jeAdminKorisnik" class="nav-grupa-centar">
              <b-nav-item to="/statistika">Statistika</b-nav-item>
            </b-navbar-nav>
          </div>

          <div class="navbar-zona navbar-zona-desno">
            <b-navbar-nav>
              <b-nav-item to="/profil">Profil</b-nav-item>
            </b-navbar-nav>
          </div>
        </div>
      </b-collapse>
    </b-navbar>

    <router-view />
  </div>
</template>

<script>
import { auth } from "@/firebase";
import { jeAdmin, pocetnaRutaZaKorisnika } from "@/utils/uloga";

export default {
  name: "App",
  data() {
    return {
      prijavljen: false,
      trenutniKorisnik: null,
    };
  },
  computed: {
    jeAdminKorisnik() {
      return jeAdmin(this.trenutniKorisnik);
    },
    pocetnaRuta() {
      return pocetnaRutaZaKorisnika(this.trenutniKorisnik);
    },
  },
  mounted() {
    // Navbar se prikazuje tek kad Firebase potvrdi prijavu
    this.odjavaAuthPromatrac = auth.onAuthStateChanged((korisnik) => {
      this.prijavljen = korisnik !== null;
      this.trenutniKorisnik = korisnik;
    });
  },
  beforeDestroy() {
    if (this.odjavaAuthPromatrac) {
      this.odjavaAuthPromatrac();
    }
  },
  methods: {
    async odjava() {
      await auth.signOut();
      this.$router.push("/login");
    },
  },
};
</script>
