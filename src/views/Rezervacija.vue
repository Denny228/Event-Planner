<template>
  <div class="container py-4">
    <h1 class="mb-2">Moje rezervacije</h1>
    <p class="text-muted mb-4">
      Pošalji upit za termin snimanja i prati status odgovora fotografa.
    </p>

    <b-alert v-if="greskaPoruka" show variant="danger" dismissible @dismissed="greskaPoruka = ''">
      {{ greskaPoruka }}
    </b-alert>

    <b-alert v-if="uspjehPoruka" show variant="success" dismissible @dismissed="uspjehPoruka = ''">
      {{ uspjehPoruka }}
    </b-alert>

    <!-- Forma za novi upit -->
    <b-card class="mb-4">
      <h5 class="mb-3">Novi upit za rezervaciju</h5>

      <b-form @submit.prevent="posaljiUpit">
        <b-row>
          <b-col md="6">
            <b-form-group label="Ime i prezime *" label-for="ime">
              <b-form-input
                id="ime"
                v-model="noviUpit.ime"
                required
                placeholder="npr. Ana Horvat"
              />
            </b-form-group>
          </b-col>

          <b-col md="6">
            <b-form-group label="Telefon" label-for="telefon">
              <b-form-input
                id="telefon"
                v-model="noviUpit.telefon"
                placeholder="npr. 091 234 5678"
              />
            </b-form-group>
          </b-col>
        </b-row>

        <b-row>
          <b-col md="6">
            <b-form-group label="Email" label-for="email">
              <b-form-input
                id="email"
                :value="emailKorisnika"
                type="email"
                readonly
              />
            </b-form-group>
          </b-col>

          <b-col md="6">
            <b-form-group label="Datum snimanja *" label-for="datum">
              <b-form-input
                id="datum"
                v-model="noviUpit.datum"
                type="date"
                required
              />
            </b-form-group>
          </b-col>
        </b-row>

        <b-row>
          <b-col md="6">
            <b-form-group label="Vrsta snimanja *" label-for="vrsta">
              <b-form-select
                id="vrsta"
                v-model="noviUpit.vrsta"
                :options="vrstaOpcije"
                required
              />
            </b-form-group>
          </b-col>
        </b-row>

        <b-form-group label="Napomena" label-for="napomena">
          <b-form-textarea
            id="napomena"
            v-model="noviUpit.napomena"
            rows="3"
            placeholder="Dodatne informacije o terminu, lokaciji, željama..."
          />
        </b-form-group>

        <b-button type="submit" variant="primary" :disabled="spremanje">
          {{ spremanje ? "Slanje..." : "Pošalji upit" }}
        </b-button>
      </b-form>
    </b-card>

    <!-- Lista vlastitih upita -->
    <h5 class="mb-3">Moji upiti</h5>

    <div v-if="ucitavanjeListe" class="text-center text-muted py-4">
      <b-spinner small class="mr-2" />
      Učitavanje upita...
    </div>

    <div v-else-if="upiti.length === 0" class="text-center text-muted py-4">
      <p class="mb-0">Još nemaš poslanih upita.</p>
      <p class="small">Ispuni formu iznad i pošalji prvi upit.</p>
    </div>

    <upit-kartica
      v-for="upit in upiti"
      :key="upit.id"
      :upit="upit"
    />
  </div>
</template>

<script>
import firebase from "firebase/app";
import { db, auth } from "@/firebase";
import UpitKartica from "@/components/UpitKartica.vue";

export default {
  name: "StranicaRezervacija",
  components: {
    UpitKartica,
  },
  data() {
    return {
      mojUid: null,
      emailKorisnika: "",
      upiti: [],
      odjavaSnapshot: null,
      ucitavanjeListe: true,
      spremanje: false,
      greskaPoruka: "",
      uspjehPoruka: "",

      noviUpit: {
        ime: "",
        telefon: "",
        datum: "",
        vrsta: null,
        napomena: "",
      },

      vrstaOpcije: [
        { value: null, text: "Odaberi vrstu...", disabled: true },
        { value: "vjenčanje", text: "Vjenčanje" },
        { value: "rođendan", text: "Rođendan" },
        { value: "event", text: "Event" },
        { value: "promo", text: "Promo" },
        { value: "fotografiranje", text: "Fotografiranje" },
        { value: "ostalo", text: "Ostalo" },
      ],
    };
  },
  mounted() {
    const korisnik = auth.currentUser;
    if (!korisnik) {
      this.ucitavanjeListe = false;
      return;
    }

    this.mojUid = korisnik.uid;
    this.emailKorisnika = korisnik.email || "";
    this.pokreniSlusacUpita();
  },
  beforeDestroy() {
    if (this.odjavaSnapshot) {
      this.odjavaSnapshot();
    }
  },
  methods: {
    pokreniSlusacUpita() {
      // onSnapshot — klijent vidi promjenu statusa bez refresha
      this.odjavaSnapshot = db
        .collection("dogadaji")
        .where("uid", "==", this.mojUid)
        .onSnapshot(
          (snapshot) => {
            this.upiti = snapshot.docs
              .map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }))
              .sort((a, b) => this.vrijemeZaSortiranje(b) - this.vrijemeZaSortiranje(a));

            this.ucitavanjeListe = false;
          },
          (greska) => {
            this.greskaPoruka =
              "Greška pri učitavanju upita: " + greska.message;
            this.ucitavanjeListe = false;
          }
        );
    },

    vrijemeZaSortiranje(upit) {
      if (upit.vrijemeUnosa && upit.vrijemeUnosa.seconds) {
        return upit.vrijemeUnosa.seconds;
      }
      return 0;
    },

    async posaljiUpit() {
      if (!this.noviUpit.ime.trim() || !this.noviUpit.vrsta || !this.noviUpit.datum) {
        this.greskaPoruka = "Ime, vrsta snimanja i datum su obavezni.";
        return;
      }

      this.greskaPoruka = "";
      this.uspjehPoruka = "";
      this.spremanje = true;

      const ime = this.noviUpit.ime.trim();

      try {
        await db.collection("dogadaji").add({
          uid: this.mojUid,
          ime,
          naziv: ime,
          vrsta: this.noviUpit.vrsta,
          datum: this.noviUpit.datum,
          napomena: this.noviUpit.napomena.trim(),
          telefon: this.noviUpit.telefon.trim(),
          email: this.emailKorisnika,
          status: "Upit",
          zadaci: [],
          vrijemeUnosa: firebase.firestore.FieldValue.serverTimestamp(),
        });

        this.ocistiFormu();
        this.uspjehPoruka = "Upit je uspješno poslan. Čeka se odgovor fotografa.";
      } catch (greska) {
        this.greskaPoruka = "Greška pri slanju upita: " + greska.message;
      } finally {
        this.spremanje = false;
      }
    },

    ocistiFormu() {
      this.noviUpit = {
        ime: "",
        telefon: "",
        datum: "",
        vrsta: null,
        napomena: "",
      };
    },
  },
};
</script>
