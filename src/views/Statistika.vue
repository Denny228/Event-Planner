<template>
  <div class="container py-4">
    <h1 class="mb-4">Statistika</h1>

    <b-alert v-if="greskaPoruka" show variant="danger" dismissible @dismissed="greskaPoruka = ''">
      {{ greskaPoruka }}
    </b-alert>

    <div v-if="ucitavanje" class="text-center text-muted py-5">
      <b-spinner small class="mr-2" />
      Učitavanje podataka...
    </div>

    <div v-else-if="dogadaji.length === 0" class="text-center text-muted py-5">
      <p class="mb-0">Nema podataka za prikaz.</p>
      <p class="small">Dodaj događaje da vidiš statistiku.</p>
    </div>

    <div v-else>
      <!-- Brojčani sažetak -->
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

      <!-- Grafovi -->
      <b-row>
        <b-col lg="6" class="mb-4">
          <b-card>
            <h5 class="mb-3">Događaji po fazama</h5>
            <div class="graf-wrap">
              <graf-faze :podaci="podaciGrafFaze" :opcije="opcijeGrafa" />
            </div>
          </b-card>
        </b-col>

        <b-col lg="6" class="mb-4">
          <b-card>
            <h5 class="mb-3">Događaji po vrstama</h5>
            <div class="graf-wrap">
              <graf-vrste :podaci="podaciGrafVrste" :opcije="opcijeGrafa" />
            </div>
          </b-card>
        </b-col>
      </b-row>
    </div>
  </div>
</template>

<script>
import { db, auth } from "@/firebase";
import GrafFaze from "@/components/GrafFaze.vue";
import GrafVrste from "@/components/GrafVrste.vue";

// Fiksni redoslijed faza i vrsta — mora odgovarati vrijednostima u bazi
const FAZE = ["Upit", "Potvrđeno", "Snimanje", "Obrada", "Isporučeno"];
const VRSTE = ["vjenčanje", "rođendan", "event", "promo"];

const OZNAKE_VRSTA = {
  vjenčanje: "Vjenčanje",
  rođendan: "Rođendan",
  event: "Event",
  promo: "Promo",
};

// Indigo + amber paleta za stupce grafova
const BOJE_FAZE = ["#64748b", "#4f46e5", "#6366f1", "#4338ca", "#059669"];
const BOJE_VRSTE = ["#4f46e5", "#6366f1", "#4338ca", "#f59e0b"];

export default {
  name: "StranicaStatistika",
  components: {
    GrafFaze,
    GrafVrste,
  },
  data() {
    return {
      dogadaji: [],
      ucitavanje: true,
      greskaPoruka: "",
      opcijeGrafa: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: false,
        },
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
                precision: 0,
              },
            },
          ],
        },
      },
    };
  },
  computed: {
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
    brojeviPoFazama() {
      const brojevi = {};
      FAZE.forEach((faza) => {
        brojevi[faza] = 0;
      });

      this.dogadaji.forEach((dogadaj) => {
        if (Object.prototype.hasOwnProperty.call(brojevi, dogadaj.status)) {
          brojevi[dogadaj.status]++;
        }
      });

      return brojevi;
    },
    brojeviPoVrstama() {
      const brojevi = {};
      VRSTE.forEach((vrsta) => {
        brojevi[vrsta] = 0;
      });

      this.dogadaji.forEach((dogadaj) => {
        if (Object.prototype.hasOwnProperty.call(brojevi, dogadaj.vrsta)) {
          brojevi[dogadaj.vrsta]++;
        }
      });

      return brojevi;
    },
    podaciGrafFaze() {
      return {
        labels: FAZE,
        datasets: [
          {
            label: "Broj događaja",
            backgroundColor: BOJE_FAZE,
            data: FAZE.map((faza) => this.brojeviPoFazama[faza]),
          },
        ],
      };
    },
    podaciGrafVrste() {
      return {
        labels: VRSTE.map((vrsta) => OZNAKE_VRSTA[vrsta]),
        datasets: [
          {
            label: "Broj događaja",
            backgroundColor: BOJE_VRSTE,
            data: VRSTE.map((vrsta) => this.brojeviPoVrstama[vrsta]),
          },
        ],
      };
    },
  },
  mounted() {
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
          "Greška pri učitavanju statistike: " + greska.message;
      } finally {
        this.ucitavanje = false;
      }
    },
  },
};
</script>

<style scoped>
.graf-wrap {
  position: relative;
  height: 280px;
}

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
</style>
