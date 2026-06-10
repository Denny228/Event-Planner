<template>
  <div class="container py-4">
    <div class="mb-4">
      <h1 class="mb-1">Dobrodošao</h1>
      <p v-if="emailKorisnika" class="text-muted mb-0">{{ emailKorisnika }}</p>
    </div>

    <b-alert v-if="greskaPoruka" show variant="danger" dismissible @dismissed="greskaPoruka = ''">
      {{ greskaPoruka }}
    </b-alert>

    <div v-if="ucitavanje" class="text-center text-muted py-5">
      <b-spinner small class="mr-2" />
      Učitavanje podataka...
    </div>

    <template v-else>
      <!-- Sažetak statusa -->
      <b-row class="mb-4">
        <b-col md="4" class="mb-3 mb-md-0">
          <b-card class="text-center sazetak-kartica">
            <p class="sazetak-broj mb-1">{{ ukupnoDogadaja }}</p>
            <p class="sazetak-naziv mb-0">Ukupno događaja</p>
          </b-card>
        </b-col>
        <b-col md="4" class="mb-3 mb-md-0">
          <b-card class="text-center sazetak-kartica">
            <p class="sazetak-broj mb-1 text-indigo">{{ brojPlaniranih }}</p>
            <p class="sazetak-naziv mb-0">Planirani</p>
          </b-card>
        </b-col>
        <b-col md="4">
          <b-card class="text-center sazetak-kartica">
            <p class="sazetak-broj mb-1 text-zavrseno">{{ brojZavrsenih }}</p>
            <p class="sazetak-naziv mb-0">Završeni</p>
          </b-card>
        </b-col>
      </b-row>

      <!-- Nadolazeći događaji -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">Nadolazeći događaji</h5>
        <b-button to="/dogadaji" variant="outline-primary" size="sm">
          Svi događaji
        </b-button>
      </div>

      <div
        v-if="prikazNadolazece.length === 0"
        class="text-center text-muted py-4 mb-3"
      >
        <p class="mb-0">Nemaš nadolazećih događaja.</p>
      </div>

      <b-list-group v-else class="mb-3">
        <b-list-group-item
          v-for="dogadaj in prikazNadolazece"
          :key="dogadaj.id"
          class="nadolazeci-stavka"
        >
          <div class="d-flex justify-content-between align-items-start flex-wrap">
            <div class="mb-2 mb-md-0">
              <h6 class="mb-1 font-weight-bold">{{ dogadaj.naziv }}</h6>
              <p class="mb-1">
                <b-badge variant="info" class="mr-1">
                  {{ prikazVrste(dogadaj.vrsta) }}
                </b-badge>
                <b-badge :class="statusKlasa(dogadaj.status)">
                  {{ dogadaj.status }}
                </b-badge>
              </p>
              <p class="mb-0 small text-muted">
                <strong>Datum:</strong> {{ formatirajDatum(dogadaj.datum) }}
                <span v-if="lokacija(dogadaj)">
                  · {{ lokacija(dogadaj) }}
                </span>
              </p>
            </div>
          </div>
        </b-list-group-item>
      </b-list-group>
    </template>
  </div>
</template>

<script>
import { db, auth } from "@/firebase";

const OZNAKE_VRSTA = {
  vjenčanje: "Vjenčanje",
  rođendan: "Rođendan",
  event: "Event",
  promo: "Promo",
};

export default {
  name: "StranicaPocetna",
  data() {
    return {
      dogadaji: [],
      emailKorisnika: "",
      ucitavanje: true,
      greskaPoruka: "",
    };
  },
  computed: {
    // Današnji datum u formatu YYYY-MM-DD za usporedbu s poljem datum
    danas() {
      const datum = new Date();
      const godina = datum.getFullYear();
      const mjesec = String(datum.getMonth() + 1).padStart(2, "0");
      const dan = String(datum.getDate()).padStart(2, "0");
      return `${godina}-${mjesec}-${dan}`;
    },
    ukupnoDogadaja() {
      return this.dogadaji.length;
    },
    brojPlaniranih() {
      return this.dogadaji.filter(
        (dogadaj) => dogadaj.status !== "Isporučeno"
      ).length;
    },
    brojZavrsenih() {
      return this.dogadaji.filter(
        (dogadaj) => dogadaj.status === "Isporučeno"
      ).length;
    },
    // Filtriranje i sortiranje na klijentu — bez Firestore indeksa
    nadolazeciDogadaji() {
      return this.dogadaji
        .filter((dogadaj) => {
          if (!dogadaj.datum) {
            return false;
          }
          if (dogadaj.status === "Isporučeno") {
            return false;
          }
          return dogadaj.datum >= this.danas;
        })
        .sort((a, b) => a.datum.localeCompare(b.datum));
    },
    prikazNadolazece() {
      return this.nadolazeciDogadaji.slice(0, 5);
    },
  },
  mounted() {
    const korisnik = auth.currentUser;
    if (korisnik) {
      this.emailKorisnika = korisnik.email || "";
    }
    this.ucitajDogadaje();
  },
  methods: {
    async ucitajDogadaje() {
      const korisnik = auth.currentUser;
      if (!korisnik) {
        this.ucitavanje = false;
        return;
      }

      try {
        const snapshot = await db
          .collection("dogadaji")
          .where("uid", "==", korisnik.uid)
          .get();

        this.dogadaji = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (greska) {
        this.greskaPoruka =
          "Greška pri učitavanju događaja: " + greska.message;
      } finally {
        this.ucitavanje = false;
      }
    },

    prikazVrste(vrsta) {
      return OZNAKE_VRSTA[vrsta] || vrsta;
    },

    formatirajDatum(datum) {
      if (!datum) {
        return "—";
      }
      const dijelovi = String(datum).split("-");
      if (dijelovi.length === 3) {
        return `${dijelovi[2]}.${dijelovi[1]}.${dijelovi[0]}.`;
      }
      return datum;
    },

    lokacija(dogadaj) {
      const dijelovi = [dogadaj.grad, dogadaj.drzava].filter(Boolean);
      return dijelovi.join(", ");
    },

    // Ista logika boja kao na DogadajKartica.vue
    statusKlasa(status) {
      if (status === "Isporučeno") {
        return "badge-status-isporuceno";
      }
      if (status === "Upit") {
        return "badge-status-neutral";
      }
      return "badge-status-indigo";
    },
  },
};
</script>

<style scoped>
.sazetak-kartica {
  padding: 0.25rem 0;
}

.sazetak-broj {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
}

.sazetak-naziv {
  color: #64748b;
  font-size: 0.95rem;
}

.text-zavrseno {
  color: #059669 !important;
}

.nadolazeci-stavka {
  border-left: 3px solid #4f46e5;
}

.badge-status-isporuceno {
  background-color: #059669;
  color: #ffffff;
}

.badge-status-indigo {
  background-color: #4f46e5;
  color: #ffffff;
}

.badge-status-neutral {
  background-color: #64748b;
  color: #ffffff;
}
</style>
