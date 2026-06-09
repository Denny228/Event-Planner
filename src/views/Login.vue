<template>
  <div class="auth-stranica">
    <b-card class="auth-kartica">
      <!-- Tekstualni logo na vrhu kartice -->
      <div class="logo-eventplanner auth-logo">
        <span class="logo-event">Event</span><span class="logo-planner">Planner</span>
      </div>

      <h1 class="auth-naslov">Prijava</h1>
      <p class="auth-podnaslov">Dobrodošao natrag</p>

      <b-form @submit.prevent="prijava">
        <b-form-group label="Email" label-for="email">
          <b-form-input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="unesi@email.com"
          />
        </b-form-group>

        <b-form-group label="Lozinka" label-for="lozinka">
          <b-form-input
            id="lozinka"
            v-model="lozinka"
            type="password"
            required
            placeholder="Lozinka"
          />
        </b-form-group>

        <b-alert v-if="greskaPoruka" show variant="danger">
          {{ greskaPoruka }}
        </b-alert>

        <b-button type="submit" variant="primary" block :disabled="ucitavanje">
          {{ ucitavanje ? "Prijava..." : "Prijavi se" }}
        </b-button>
      </b-form>

      <p class="auth-link">
        Nemaš račun?
        <router-link to="/register">Registriraj se</router-link>
      </p>
    </b-card>
  </div>
</template>

<script>
import { auth } from "@/firebase";

export default {
  name: "StranicaPrijava",
  data() {
    return {
      email: "",
      lozinka: "",
      greskaPoruka: "",
      ucitavanje: false,
    };
  },
  methods: {
    async prijava() {
      this.greskaPoruka = "";
      this.ucitavanje = true;

      try {
        await auth.signInWithEmailAndPassword(this.email, this.lozinka);
        this.$router.push("/");
      } catch (greska) {
        this.greskaPoruka = this.pretvoriGresku(greska);
      } finally {
        this.ucitavanje = false;
      }
    },

    // Firebase vraća engleske/JSON poruke — mapiramo kodove na hrvatski
    pretvoriGresku(greska) {
      const poruke = {
        "auth/user-not-found": "Korisnik s tim emailom ne postoji.",
        "auth/wrong-password": "Netočna lozinka.",
        "auth/invalid-email": "Neispravan format email adrese.",
        "auth/invalid-credential": "Neispravan email ili lozinka.",
        "auth/invalid-login-credentials": "Neispravan email ili lozinka.",
        "auth/missing-password": "Unesi lozinku.",
        "auth/too-many-requests": "Previše pokušaja. Pokušaj ponovno kasnije.",
      };

      if (poruke[greska.code]) {
        return poruke[greska.code];
      }

      if (this.jeCitljivaPoruka(greska.message)) {
        return greska.message;
      }

      return "Prijava nije uspjela. Provjeri podatke i pokušaj ponovno.";
    },

    // Sprječava prikaz sirovog JSON-a ili tehničkih Firebase poruka
    jeCitljivaPoruka(poruka) {
      if (!poruka || typeof poruka !== "string") {
        return false;
      }

      const ocisceno = poruka.trim();
      if (!ocisceno) {
        return false;
      }

      if (ocisceno.startsWith("{") || ocisceno.startsWith("[")) {
        return false;
      }

      if (/"error"/i.test(ocisceno) || /INVALID_/i.test(ocisceno)) {
        return false;
      }

      return true;
    },
  },
};
</script>
