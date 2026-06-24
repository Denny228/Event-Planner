<template>
  <div class="container py-4">
    <h1 class="mb-2">Admin panel</h1>
    <p class="text-muted mb-4">
      Pregled i upravljanje upitima svih klijenata.
    </p>

    <b-alert v-if="greskaPoruka" show variant="danger" dismissible @dismissed="greskaPoruka = ''">
      {{ greskaPoruka }}
    </b-alert>

    <div v-if="ucitavanje" class="text-center text-muted py-5">
      <b-spinner small class="mr-2" />
      Učitavanje upita...
    </div>

    <template v-else>
      <!-- Tabovi po statusu — novi upiti su glavni fokus -->
      <b-button-group class="mb-4">
        <b-button
          :variant="aktivniTab === 'novi' ? 'primary' : 'outline-primary'"
          @click="aktivniTab = 'novi'"
        >
          Novi upiti
          <b-badge v-if="brojNovih" variant="light" class="ml-1 text-dark">
            {{ brojNovih }}
          </b-badge>
        </b-button>
        <b-button
          :variant="aktivniTab === 'potvrdeni' ? 'primary' : 'outline-primary'"
          @click="aktivniTab = 'potvrdeni'"
        >
          Potvrđeni
          <b-badge v-if="brojPotvrdenih" variant="light" class="ml-1 text-dark">
            {{ brojPotvrdenih }}
          </b-badge>
        </b-button>
        <b-button
          :variant="aktivniTab === 'odradeni' ? 'primary' : 'outline-primary'"
          @click="aktivniTab = 'odradeni'"
        >
          Odrađeni
          <b-badge v-if="brojOdrađenih" variant="light" class="ml-1 text-dark">
            {{ brojOdrađenih }}
          </b-badge>
        </b-button>
        <b-button
          :variant="aktivniTab === 'odbijeni' ? 'primary' : 'outline-primary'"
          @click="aktivniTab = 'odbijeni'"
        >
          Odbijeni
          <b-badge v-if="brojOdbijenih" variant="light" class="ml-1 text-dark">
            {{ brojOdbijenih }}
          </b-badge>
        </b-button>
      </b-button-group>

      <!-- Novi upiti (status Upit) -->
      <div v-if="aktivniTab === 'novi'">
        <div v-if="noviUpiti.length === 0" class="text-center text-muted py-4">
          <p class="mb-0">Nema novih upita za obradu.</p>
        </div>

        <admin-upit-kartica
          v-for="upit in noviUpiti"
          :key="upit.id"
          :upit="upit"
          tip-prikaza="novi"
          @greska="prikaziGresku"
        />
      </div>

      <!-- Aktivni potvrđeni (Potvrđeno, Snimanje, Obrada) -->
      <div v-if="aktivniTab === 'potvrdeni'">
        <div v-if="potvrdeniUpiti.length === 0" class="text-center text-muted py-4">
          <p class="mb-0">Nema aktivnih potvrđenih upita.</p>
        </div>

        <admin-upit-kartica
          v-for="upit in potvrdeniUpiti"
          :key="upit.id"
          :upit="upit"
          tip-prikaza="potvrdeni"
          @greska="prikaziGresku"
        />
      </div>

      <!-- Završeni poslovi (Isporučeno) -->
      <div v-if="aktivniTab === 'odradeni'">
        <div v-if="odrađeniUpiti.length === 0" class="text-center text-muted py-4">
          <p class="mb-0">Nema odrađenih poslova.</p>
        </div>

        <admin-upit-kartica
          v-for="upit in odrađeniUpiti"
          :key="upit.id"
          :upit="upit"
          tip-prikaza="odradeni"
          @greska="prikaziGresku"
        />
      </div>

      <!-- Odbijeni upiti -->
      <div v-if="aktivniTab === 'odbijeni'">
        <div v-if="odbijeniUpiti.length === 0" class="text-center text-muted py-4">
          <p class="mb-0">Nema odbijenih upita.</p>
        </div>

        <admin-upit-kartica
          v-for="upit in odbijeniUpiti"
          :key="upit.id"
          :upit="upit"
          tip-prikaza="odbijeni"
          @greska="prikaziGresku"
        />
      </div>
    </template>
  </div>
</template>

<script>
import { db } from "@/firebase";
import AdminUpitKartica from "@/components/AdminUpitKartica.vue";

// Raspored statusa po tabovima — hrvatski znakovi moraju ostati konzistentni
const AKTIVNE_FAZE = ["Potvrđeno", "Snimanje", "Obrada"];
const ODRADEN_STATUS = "Isporučeno";

export default {
  name: "StranicaAdminPanel",
  components: {
    AdminUpitKartica,
  },
  data() {
    return {
      sviUpiti: [],
      odjavaSnapshot: null,
      ucitavanje: true,
      greskaPoruka: "",
      aktivniTab: "novi",
    };
  },
  computed: {
    noviUpiti() {
      return this.sviUpiti.filter((upit) => upit.status === "Upit");
    },
    potvrdeniUpiti() {
      return this.sviUpiti.filter((upit) =>
        AKTIVNE_FAZE.includes(upit.status)
      );
    },
    odrađeniUpiti() {
      return this.sviUpiti.filter((upit) => upit.status === ODRADEN_STATUS);
    },
    odbijeniUpiti() {
      return this.sviUpiti.filter((upit) => upit.status === "Odbijeno");
    },
    brojNovih() {
      return this.noviUpiti.length;
    },
    brojPotvrdenih() {
      return this.potvrdeniUpiti.length;
    },
    brojOdrađenih() {
      return this.odrađeniUpiti.length;
    },
    brojOdbijenih() {
      return this.odbijeniUpiti.length;
    },
  },
  mounted() {
    this.pokreniSlusacUpita();
  },
  beforeDestroy() {
    if (this.odjavaSnapshot) {
      this.odjavaSnapshot();
    }
  },
  methods: {
    pokreniSlusacUpita() {
      // Admin vidi SVE upite — bez uid filtra
      this.odjavaSnapshot = db.collection("dogadaji").onSnapshot(
        (snapshot) => {
          this.sviUpiti = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .sort(
              (a, b) => this.vrijemeZaSortiranje(b) - this.vrijemeZaSortiranje(a)
            );

          this.ucitavanje = false;
        },
        (greska) => {
          this.greskaPoruka =
            "Greška pri učitavanju upita: " + greska.message;
          this.ucitavanje = false;
        }
      );
    },

    vrijemeZaSortiranje(upit) {
      if (upit.vrijemeUnosa && upit.vrijemeUnosa.seconds) {
        return upit.vrijemeUnosa.seconds;
      }
      return 0;
    },

    prikaziGresku(poruka) {
      this.greskaPoruka = poruka;
    },
  },
};
</script>
