<template>
  <div class="container py-4">
    <h1 class="mb-2">Statistika</h1>
    <p class="text-muted mb-4">
      Pregled svih upita klijenata po stanju i vrsti snimanja.
    </p>

    <b-alert v-if="greskaPoruka" show variant="danger" dismissible @dismissed="greskaPoruka = ''">
      {{ greskaPoruka }}
    </b-alert>

    <div v-if="ucitavanje" class="text-center text-muted py-5">
      <b-spinner small class="mr-2" />
      Učitavanje podataka...
    </div>

    <div v-else-if="upiti.length === 0" class="text-center text-muted py-5">
      <p class="mb-0">Još nema upita za prikaz.</p>
    </div>

    <div v-else>
      <!-- Sažetak — 5 kartica -->
      <b-row class="mb-4">
        <b-col cols="6" lg class="mb-3 mb-lg-0">
          <b-card class="text-center sazetak-kartica">
            <p class="sazetak-broj mb-1">{{ ukupnoUpita }}</p>
            <p class="sazetak-naziv mb-0">Ukupno upita</p>
          </b-card>
        </b-col>
        <b-col cols="6" lg class="mb-3 mb-lg-0">
          <b-card class="text-center sazetak-kartica">
            <p class="sazetak-broj mb-1 text-novi">{{ brojNovih }}</p>
            <p class="sazetak-naziv mb-0">Novi</p>
          </b-card>
        </b-col>
        <b-col cols="6" lg class="mb-3 mb-lg-0">
          <b-card class="text-center sazetak-kartica">
            <p class="sazetak-broj mb-1 text-aktivni">{{ brojAktivnih }}</p>
            <p class="sazetak-naziv mb-0">Aktivni</p>
          </b-card>
        </b-col>
        <b-col cols="6" lg class="mb-3 mb-lg-0">
          <b-card class="text-center sazetak-kartica">
            <p class="sazetak-broj mb-1 text-odradeno">{{ brojOdrađenih }}</p>
            <p class="sazetak-naziv mb-0">Odrađeno</p>
          </b-card>
        </b-col>
        <b-col cols="6" lg class="mb-3 mb-lg-0">
          <b-card class="text-center sazetak-kartica">
            <p class="sazetak-broj mb-1 text-odbijeno">{{ brojOdbijenih }}</p>
            <p class="sazetak-naziv mb-0">Odbijeno</p>
          </b-card>
        </b-col>
      </b-row>

      <!-- Grafovi -->
      <b-row>
        <b-col lg="6" class="mb-4">
          <b-card>
            <h5 class="mb-3">Upiti po stanju</h5>
            <div class="graf-wrap">
              <graf-faze :podaci="podaciGrafStanja" :opcije="opcijeGrafa" />
            </div>
          </b-card>
        </b-col>

        <b-col lg="6" class="mb-4">
          <b-card>
            <h5 class="mb-3">Upiti po vrsti snimanja</h5>
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
import { db } from "@/firebase";
import GrafFaze from "@/components/GrafFaze.vue";
import GrafVrste from "@/components/GrafVrste.vue";

// 4 grupe stanja — mora odgovarati admin panelu i statusima u bazi
const GRUPE_STANJA = [
  { naziv: "Novi", statusi: ["Upit"] },
  { naziv: "Aktivni", statusi: ["Potvrđeno", "Snimanje", "Obrada"] },
  { naziv: "Odrađeni", statusi: ["Isporučeno"] },
  { naziv: "Odbijeni", statusi: ["Odbijeno"] },
];

const VRSTE = [
  "vjenčanje",
  "rođendan",
  "event",
  "promo",
  "fotografiranje",
  "ostalo",
];

const OZNAKE_VRSTA = {
  vjenčanje: "Vjenčanje",
  rođendan: "Rođendan",
  event: "Event",
  promo: "Promo",
  fotografiranje: "Fotografiranje",
  ostalo: "Ostalo",
};

// Boje usklađene s admin panelom
const BOJE_STANJA = ["#eab308", "#059669", "#475569", "#dc2626"];
const BOJE_VRSTE = [
  "#4f46e5",
  "#6366f1",
  "#4338ca",
  "#f59e0b",
  "#64748b",
  "#94a3b8",
];

export default {
  name: "StranicaStatistika",
  components: {
    GrafFaze,
    GrafVrste,
  },
  data() {
    return {
      upiti: [],
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
    ukupnoUpita() {
      return this.upiti.length;
    },
    brojNovih() {
      return this.brojPoStatusima(["Upit"]);
    },
    brojAktivnih() {
      return this.brojPoStatusima(["Potvrđeno", "Snimanje", "Obrada"]);
    },
    brojOdrađenih() {
      return this.brojPoStatusima(["Isporučeno"]);
    },
    brojOdbijenih() {
      return this.brojPoStatusima(["Odbijeno"]);
    },
    brojeviPoGrupamaStanja() {
      return GRUPE_STANJA.map((grupa) => ({
        naziv: grupa.naziv,
        broj: this.brojPoStatusima(grupa.statusi),
      }));
    },
    brojeviPoVrstama() {
      const brojevi = {};
      VRSTE.forEach((vrsta) => {
        brojevi[vrsta] = 0;
      });

      this.upiti.forEach((upit) => {
        if (Object.prototype.hasOwnProperty.call(brojevi, upit.vrsta)) {
          brojevi[upit.vrsta]++;
        }
      });

      return brojevi;
    },
    podaciGrafStanja() {
      return {
        labels: this.brojeviPoGrupamaStanja.map((grupa) => grupa.naziv),
        datasets: [
          {
            label: "Broj upita",
            backgroundColor: BOJE_STANJA,
            data: this.brojeviPoGrupamaStanja.map((grupa) => grupa.broj),
          },
        ],
      };
    },
    podaciGrafVrste() {
      return {
        labels: VRSTE.map((vrsta) => OZNAKE_VRSTA[vrsta]),
        datasets: [
          {
            label: "Broj upita",
            backgroundColor: BOJE_VRSTE,
            data: VRSTE.map((vrsta) => this.brojeviPoVrstama[vrsta]),
          },
        ],
      };
    },
  },
  mounted() {
    this.ucitajUpite();
  },
  methods: {
    brojPoStatusima(statusi) {
      return this.upiti.filter((upit) => statusi.includes(upit.status)).length;
    },

    async ucitajUpite() {
      try {
        // Admin vidi SVE upite — bez uid filtra
        const snapshot = await db.collection("dogadaji").get();

        this.upiti = snapshot.docs.map((doc) => ({
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

.text-novi {
  color: #ca8a04 !important;
}

.text-aktivni {
  color: #059669 !important;
}

.text-odradeno {
  color: #475569 !important;
}

.text-odbijeno {
  color: #dc2626 !important;
}
</style>
