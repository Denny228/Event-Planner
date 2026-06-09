<template>
  <b-card class="mb-3">
    <div class="d-flex justify-content-between align-items-start flex-wrap">
      <div class="mb-2 mb-md-0 flex-grow-1">
        <h5 class="mb-1 font-weight-bold">{{ dogadaj.naziv }}</h5>

        <p class="mb-2">
          <b-badge variant="info" class="mr-1">{{ prikazVrste }}</b-badge>
          <b-badge :class="statusKlasa">{{ dogadaj.status }}</b-badge>
        </p>

        <!-- Promjena faze realizacije -->
        <b-form-group
          label="Faza"
          :label-for="'status-' + dogadaj.id"
          class="mb-2 status-odabir"
        >
          <b-form-select
            :id="'status-' + dogadaj.id"
            :value="dogadaj.status"
            :options="fazeOpcije"
            size="sm"
            :disabled="spremanjeStatusa"
            @change="promijeniStatus"
          />
        </b-form-group>

        <p class="mb-0 small text-muted">
          <strong>Lokacija:</strong>
          {{ lokacija }}
        </p>
        <p class="mb-0 small text-muted">
          <strong>Datum:</strong> {{ prikazDatuma }}
        </p>

        <!-- Checklist zadataka — expand/collapse -->
        <b-button
          variant="link"
          class="checklist-gumb p-0 mt-2"
          :aria-expanded="prikaziZadatke ? 'true' : 'false'"
          @click="prikaziZadatke = !prikaziZadatke"
        >
          {{ tekstGumbaZadaci }}
          <b-icon
            :icon="prikaziZadatke ? 'chevron-up' : 'chevron-down'"
            class="ml-1"
          />
        </b-button>
      </div>

      <div class="d-flex flex-shrink-0">
        <b-button
          variant="outline-primary"
          size="sm"
          class="mr-2"
          @click="$emit('uredi', dogadaj)"
        >
          Uredi
        </b-button>
        <b-button
          variant="outline-danger"
          size="sm"
          @click="$emit('obrisi', dogadaj)"
        >
          Obriši
        </b-button>
      </div>
    </div>

    <b-collapse v-model="prikaziZadatke" class="checklist-sekcija">
      <div class="pt-3 mt-2 border-top">
        <p v-if="lokalniZadaci.length > 0" class="small text-muted mb-2">
          Napredak: {{ brojGotovih }}/{{ ukupnoZadataka }} gotovo
        </p>

        <div v-if="lokalniZadaci.length === 0" class="text-muted small mb-3">
          Nema zadataka.
        </div>

        <div
          v-for="(zadatak, indeks) in lokalniZadaci"
          :key="indeks"
          class="d-flex align-items-start mb-2 zadatak-red"
        >
          <b-form-checkbox
            v-model="lokalniZadaci[indeks].gotovo"
            class="flex-grow-1 zadatak-checkbox"
            :disabled="spremanjeZadataka"
            @change="spremiTrenutneZadatke"
          >
            <span :class="{ 'zadatak-gotov': zadatak.gotovo }">
              {{ zadatak.tekst }}
            </span>
          </b-form-checkbox>

          <b-button
            variant="outline-danger"
            size="sm"
            class="ml-2 flex-shrink-0"
            :disabled="spremanjeZadataka"
            @click="obrisiZadatak(indeks)"
          >
            Obriši
          </b-button>
        </div>

        <b-form @submit.prevent="dodajZadatak" class="mt-3">
          <b-input-group size="sm">
            <b-form-input
              v-model="noviZadatakTekst"
              placeholder="Novi zadatak..."
              :disabled="spremanjeZadataka"
            />
            <b-input-group-append>
              <b-button
                type="submit"
                variant="primary"
                :disabled="spremanjeZadataka || !noviZadatakTekst.trim()"
              >
                Dodaj
              </b-button>
            </b-input-group-append>
          </b-input-group>
        </b-form>
      </div>
    </b-collapse>
  </b-card>
</template>

<script>
import { db } from "@/firebase";

export default {
  name: "DogadajKartica",
  props: {
    dogadaj: {
      type: Object,
      required: true,
    },
    vrstaOpcije: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      spremanjeStatusa: false,
      spremanjeZadataka: false,
      prikaziZadatke: false,
      noviZadatakTekst: "",
      lokalniZadaci: [],
      fazeOpcije: [
        { value: "Upit", text: "Upit" },
        { value: "Potvrđeno", text: "Potvrđeno" },
        { value: "Snimanje", text: "Snimanje" },
        { value: "Obrada", text: "Obrada" },
        { value: "Isporučeno", text: "Isporučeno" },
      ],
    };
  },
  computed: {
    prikazVrste() {
      const opcija = this.vrstaOpcije.find(
        (o) => o.value === this.dogadaj.vrsta
      );
      return opcija ? opcija.text : this.dogadaj.vrsta;
    },
    lokacija() {
      const dijelovi = [this.dogadaj.grad, this.dogadaj.drzava].filter(Boolean);
      return dijelovi.length ? dijelovi.join(", ") : "—";
    },
    prikazDatuma() {
      const datum = this.dogadaj.datum;
      if (!datum) return "—";
      const dijelovi = String(datum).split("-");
      if (dijelovi.length === 3) {
        return `${dijelovi[2]}.${dijelovi[1]}.${dijelovi[0]}.`;
      }
      return datum;
    },
    statusKlasa() {
      if (this.dogadaj.status === "Isporučeno") {
        return "badge-status-isporuceno";
      }
      if (this.dogadaj.status === "Upit") {
        return "badge-status-neutral";
      }
      return "badge-status-indigo";
    },
    ukupnoZadataka() {
      return this.lokalniZadaci.length;
    },
    brojGotovih() {
      return this.lokalniZadaci.filter((zadatak) => zadatak.gotovo).length;
    },
    tekstGumbaZadaci() {
      if (this.ukupnoZadataka === 0) {
        return "Zadaci";
      }
      return `Zadaci (${this.brojGotovih}/${this.ukupnoZadataka})`;
    },
  },
  watch: {
    // Sinkronizacija s propom nakon onSnapshot u roditelju — ne mutiramo prop izravno
    "dogadaj.zadaci": {
      immediate: true,
      deep: true,
      handler(zadaci) {
        this.lokalniZadaci = this.kopirajZadatke(zadaci);
      },
    },
  },
  methods: {
    kopirajZadatke(zadaci) {
      if (!Array.isArray(zadaci)) {
        return [];
      }
      return zadaci.map((zadatak) => ({
        tekst: zadatak.tekst || "",
        gotovo: !!zadatak.gotovo,
      }));
    },

    async spremiZadace(novoPolje) {
      this.spremanjeZadataka = true;

      try {
        await db.collection("dogadaji").doc(this.dogadaj.id).update({
          zadaci: novoPolje,
        });
      } catch (greska) {
        this.lokalniZadaci = this.kopirajZadatke(this.dogadaj.zadaci);
        this.$emit(
          "greska",
          "Greška pri spremanju zadataka: " + greska.message
        );
      } finally {
        this.spremanjeZadataka = false;
      }
    },

    async spremiTrenutneZadatke() {
      await this.spremiZadace(this.kopirajZadatke(this.lokalniZadaci));
    },

    async dodajZadatak() {
      const tekst = this.noviZadatakTekst.trim();
      if (!tekst) {
        return;
      }

      const novoPolje = [
        ...this.kopirajZadatke(this.lokalniZadaci),
        { tekst, gotovo: false },
      ];

      this.noviZadatakTekst = "";
      await this.spremiZadace(novoPolje);
    },

    async obrisiZadatak(indeks) {
      const novoPolje = this.lokalniZadaci
        .filter((_, i) => i !== indeks)
        .map((zadatak) => ({ tekst: zadatak.tekst, gotovo: zadatak.gotovo }));

      await this.spremiZadace(novoPolje);
    },

    async promijeniStatus(novaVrijednost) {
      if (novaVrijednost === this.dogadaj.status) {
        return;
      }

      this.spremanjeStatusa = true;

      try {
        await db.collection("dogadaji").doc(this.dogadaj.id).update({
          status: novaVrijednost,
        });
      } catch (greska) {
        this.$emit(
          "greska",
          "Greška pri promjeni faze: " + greska.message
        );
      } finally {
        this.spremanjeStatusa = false;
      }
    },
  },
};
</script>

<style scoped>
.status-odabir {
  max-width: 220px;
}

.checklist-gumb {
  color: #4f46e5;
  font-weight: 500;
  text-decoration: none;
}

.checklist-gumb:hover {
  color: #4338ca;
  text-decoration: none;
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

.zadatak-gotov {
  text-decoration: line-through;
  color: #64748b;
}

.zadatak-checkbox {
  margin-bottom: 0;
}
</style>
