<template>
  <b-card class="mb-3 admin-upit-kartica">
    <div class="d-flex justify-content-between align-items-start flex-wrap">
      <div class="mb-2 mb-md-0 flex-grow-1">
        <h6 class="mb-1 font-weight-bold">{{ upit.ime || upit.naziv }}</h6>

        <p class="mb-1">
          <b-badge variant="info" class="mr-1">{{ prikazVrste }}</b-badge>
          <b-badge :class="statusInfo.klasa">{{ statusInfo.tekst }}</b-badge>
        </p>

        <p class="mb-0 small text-muted">
          <strong>Email:</strong> {{ upit.email || "—" }}
        </p>
        <p class="mb-0 small text-muted">
          <strong>Telefon:</strong> {{ upit.telefon || "—" }}
        </p>
        <p class="mb-0 small text-muted">
          <strong>Datum snimanja:</strong> {{ prikazDatuma }}
        </p>
        <p v-if="upit.napomena" class="mb-0 small text-muted mt-1">
          <strong>Napomena:</strong> {{ upit.napomena }}
        </p>
        <p class="mb-0 small text-muted mt-1">
          <strong>Poslano:</strong> {{ prikazVremenaUnosa }}
        </p>
      </div>

      <!-- Akcije za nove upite -->
      <div v-if="tipPrikaza === 'novi'" class="admin-akcije flex-shrink-0">
        <b-button
          variant="success"
          size="sm"
          class="mr-2 mb-2"
          :disabled="spremanje"
          @click="promijeniStatus('Potvrđeno')"
        >
          Potvrdi
        </b-button>
        <b-button
          variant="danger"
          size="sm"
          class="mb-2"
          :disabled="spremanje"
          @click="promijeniStatus('Odbijeno')"
        >
          Odbij
        </b-button>
      </div>

      <!-- Interni tijek na aktivnim potvrđenim upitima -->
      <div
        v-if="tipPrikaza === 'potvrdeni'"
        class="admin-faza flex-shrink-0"
      >
        <b-form-group
          label="Interna faza"
          :label-for="'faza-' + upit.id"
          class="mb-0 faza-odabir"
        >
          <b-form-select
            :id="'faza-' + upit.id"
            :value="upit.status"
            :options="fazeOpcijeAktivni"
            size="sm"
            :disabled="spremanje"
            @change="promijeniStatus"
          />
        </b-form-group>
      </div>

      <!-- Vraćanje faze na odrađenim poslovima -->
      <div
        v-if="tipPrikaza === 'odradeni'"
        class="admin-faza flex-shrink-0"
      >
        <b-form-group
          label="Vrati na fazu"
          :label-for="'vrati-' + upit.id"
          class="mb-0 faza-odabir"
        >
          <b-form-select
            :id="'vrati-' + upit.id"
            :value="upit.status"
            :options="fazeOpcijeVracanje"
            size="sm"
            :disabled="spremanje"
            @change="promijeniStatus"
          />
        </b-form-group>
      </div>
    </div>
  </b-card>
</template>

<script>
import { db } from "@/firebase";

const OZNAKE_VRSTA = {
  vjenčanje: "Vjenčanje",
  rođendan: "Rođendan",
  event: "Event",
  promo: "Promo",
  fotografiranje: "Fotografiranje",
  ostalo: "Ostalo",
};

const STATUSI = {
  Upit: { tekst: "Čeka odgovor", klasa: "badge-status-ceka" },
  Potvrđeno: { tekst: "Potvrđeno", klasa: "badge-status-potvrdeno" },
  Odbijeno: { tekst: "Odbijeno", klasa: "badge-status-odbijeno" },
  Snimanje: { tekst: "Snimanje", klasa: "badge-status-potvrdeno" },
  Obrada: { tekst: "Obrada", klasa: "badge-status-potvrdeno" },
  Isporučeno: { tekst: "Isporučeno", klasa: "badge-status-odradeno" },
};

export default {
  name: "AdminUpitKartica",
  props: {
    upit: {
      type: Object,
      required: true,
    },
    tipPrikaza: {
      type: String,
      required: true,
      validator(vrijednost) {
        return ["novi", "potvrdeni", "odradeni", "odbijeni"].includes(vrijednost);
      },
    },
  },
  data() {
    return {
      spremanje: false,
      fazeOpcijeAktivni: [
        { value: "Potvrđeno", text: "Potvrđeno" },
        { value: "Snimanje", text: "Snimanje" },
        { value: "Obrada", text: "Obrada" },
        { value: "Isporučeno", text: "Isporučeno" },
      ],
      fazeOpcijeVracanje: [
        { value: "Isporučeno", text: "Isporučeno (trenutno)" },
        { value: "Obrada", text: "Obrada" },
        { value: "Snimanje", text: "Snimanje" },
        { value: "Potvrđeno", text: "Potvrđeno" },
      ],
    };
  },
  computed: {
    prikazVrste() {
      return OZNAKE_VRSTA[this.upit.vrsta] || this.upit.vrsta;
    },
    statusInfo() {
      return (
        STATUSI[this.upit.status] || {
          tekst: this.upit.status,
          klasa: "badge-status-odradeno",
        }
      );
    },
    prikazDatuma() {
      const datum = this.upit.datum;
      if (!datum) {
        return "—";
      }
      const dijelovi = String(datum).split("-");
      if (dijelovi.length === 3) {
        return `${dijelovi[2]}.${dijelovi[1]}.${dijelovi[0]}.`;
      }
      return datum;
    },
    prikazVremenaUnosa() {
      const vrijeme = this.upit.vrijemeUnosa;
      if (!vrijeme || !vrijeme.toDate) {
        return "—";
      }
      return vrijeme.toDate().toLocaleDateString("hr-HR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
  methods: {
    async promijeniStatus(noviStatus) {
      if (noviStatus === this.upit.status) {
        return;
      }

      this.spremanje = true;

      try {
        await db.collection("dogadaji").doc(this.upit.id).update({
          status: noviStatus,
        });
      } catch (greska) {
        this.$emit(
          "greska",
          "Greška pri promjeni statusa: " + greska.message
        );
      } finally {
        this.spremanje = false;
      }
    },
  },
};
</script>

<style scoped>
.badge-status-ceka {
  background-color: #eab308;
  color: #1e293b;
}

.badge-status-potvrdeno {
  background-color: #059669;
  color: #ffffff;
}

.badge-status-odbijeno {
  background-color: #dc2626;
  color: #ffffff;
}

.badge-status-odradeno {
  background-color: #475569;
  color: #ffffff;
}

.faza-odabir {
  min-width: 180px;
}

.admin-akcije {
  min-width: 140px;
}
</style>
