<template>
  <div class="container py-4">
    <h1 class="mb-4">Profil</h1>

    <b-alert v-if="greskaPoruka" show variant="danger" dismissible @dismissed="greskaPoruka = ''">
      {{ greskaPoruka }}
    </b-alert>

    <div v-if="ucitavanje" class="text-center text-muted py-5">
      <b-spinner small class="mr-2" />
      Učitavanje profila...
    </div>

    <b-card v-else class="profil-kartica">
      <h5 class="mb-4 profil-naslov">Podaci o računu</h5>

      <dl class="row mb-4 profil-podaci">
        <dt class="col-sm-4">Email</dt>
        <dd class="col-sm-8">{{ emailKorisnika || "—" }}</dd>

        <dt class="col-sm-4">Datum registracije</dt>
        <dd class="col-sm-8">{{ datumRegistracije }}</dd>
      </dl>

      <b-button variant="outline-danger" :disabled="odjavaUTijeku" @click="odjava">
        {{ odjavaUTijeku ? "Odjava..." : "Odjava" }}
      </b-button>
    </b-card>
  </div>
</template>

<script>
import { auth } from "@/firebase";

export default {
  name: "StranicaProfil",
  data() {
    return {
      emailKorisnika: "",
      vrijemeRegistracije: null,
      ucitavanje: true,
      odjavaUTijeku: false,
      greskaPoruka: "",
    };
  },
  computed: {
    datumRegistracije() {
      if (!this.vrijemeRegistracije) {
        return "—";
      }

      return this.vrijemeRegistracije.toLocaleDateString("hr-HR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
  mounted() {
    this.ucitajProfil();
  },
  methods: {
    ucitajProfil() {
      const korisnik = auth.currentUser;
      if (!korisnik) {
        this.ucitavanje = false;
        return;
      }

      this.emailKorisnika = korisnik.email || "";
      if (korisnik.metadata && korisnik.metadata.creationTime) {
        this.vrijemeRegistracije = new Date(korisnik.metadata.creationTime);
      }

      this.ucitavanje = false;
    },

    async odjava() {
      this.odjavaUTijeku = true;

      try {
        await auth.signOut();
        this.$router.push("/login");
      } catch (greska) {
        this.greskaPoruka = "Greška pri odjavi: " + greska.message;
        this.odjavaUTijeku = false;
      }
    },
  },
};
</script>

<style scoped>
.profil-kartica {
  border-left: 4px solid #4f46e5;
  max-width: 640px;
}

.profil-naslov {
  color: #1e293b;
  font-weight: 600;
}

.profil-podaci dt {
  color: #64748b;
  font-weight: 500;
}

.profil-podaci dd {
  color: #1e293b;
}
</style>
