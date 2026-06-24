<template>
  <b-card class="mb-3 upit-kartica">
    <div class="d-flex justify-content-between align-items-start flex-wrap">
      <div class="mb-2 mb-md-0">
        <h6 class="mb-1 font-weight-bold">{{ upit.ime }}</h6>
        <p class="mb-1">
          <b-badge variant="info" class="mr-1">{{ prikazVrste }}</b-badge>
          <b-badge :class="statusInfo.klasa">{{ statusInfo.tekst }}</b-badge>
        </p>
        <p class="mb-0 small text-muted">
          <strong>Datum snimanja:</strong> {{ prikazDatuma }}
        </p>
        <p v-if="upit.telefon" class="mb-0 small text-muted">
          <strong>Telefon:</strong> {{ upit.telefon }}
        </p>
        <p v-if="upit.napomena" class="mb-0 small text-muted mt-1">
          <strong>Napomena:</strong> {{ upit.napomena }}
        </p>
      </div>
      <p class="mb-0 small text-muted text-md-right">
        Poslano: {{ prikazVremenaUnosa }}
      </p>
    </div>
  </b-card>
</template>

<script>
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
};

export default {
  name: "UpitKartica",
  props: {
    upit: {
      type: Object,
      required: true,
    },
  },
  computed: {
    prikazVrste() {
      return OZNAKE_VRSTA[this.upit.vrsta] || this.upit.vrsta;
    },
    statusInfo() {
      return (
        STATUSI[this.upit.status] || {
          tekst: this.upit.status,
          klasa: "badge-status-ceka",
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
</style>
