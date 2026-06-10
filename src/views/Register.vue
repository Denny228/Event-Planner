<template>
  <div class="auth-stranica">
    <b-card class="auth-kartica">
      <div class="logo-eventplanner auth-logo">
        <span class="logo-event">Event</span><span class="logo-planner">Planner</span>
      </div>

      <h1 class="auth-naslov">Registracija</h1>
      <p class="auth-podnaslov">Kreiraj svoj račun</p>

      <b-form @submit.prevent="registracija">
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
            placeholder="Najmanje 6 znakova"
          />
        </b-form-group>

        <b-alert v-if="greskaPoruka" show variant="danger">
          {{ greskaPoruka }}
        </b-alert>

        <b-button type="submit" variant="primary" block :disabled="ucitavanje">
          {{ ucitavanje ? "Registracija..." : "Registriraj se" }}
        </b-button>
      </b-form>

      <p class="auth-link">
        Već imaš račun?
        <router-link to="/login">Prijavi se</router-link>
      </p>
    </b-card>
  </div>
</template>

<script>
import { auth } from "@/firebase";

export default {
  name: "StranicaRegistracija",
  data() {
    return {
      email: "",
      lozinka: "",
      greskaPoruka: "",
      ucitavanje: false,
    };
  },
  methods: {
    async registracija() {
      this.greskaPoruka = "";
      this.ucitavanje = true;

      try {
        await auth.createUserWithEmailAndPassword(this.email, this.lozinka);
        this.$router.push("/");
      } catch (greska) {
        this.greskaPoruka = this.pretvoriGresku(greska);
      } finally {
        this.ucitavanje = false;
      }
    },

    pretvoriGresku(greska) {
      const poruke = {
        "auth/email-already-in-use": "Email adresa je već registrirana.",
        "auth/invalid-email": "Neispravan format email adrese.",
        "auth/weak-password": "Lozinka mora imati najmanje 6 znakova.",
        "auth/missing-password": "Unesi lozinku.",
        "auth/operation-not-allowed": "Registracija emailom nije omogućena.",
      };

      if (poruke[greska.code]) {
        return poruke[greska.code];
      }

      if (this.jeCitljivaPoruka(greska.message)) {
        return greska.message;
      }

      return "Registracija nije uspjela. Pokušaj ponovno.";
    },

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
