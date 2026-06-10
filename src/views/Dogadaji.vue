<template>
  <div class="container py-4">
    <h1 class="mb-4">Događaji</h1>

    <b-alert v-if="greskaPoruka" show variant="danger" dismissible @dismissed="greskaPoruka = ''">
      {{ greskaPoruka }}
    </b-alert>

    <!-- Forma za kreiranje novog događaja -->
    <b-card class="mb-4">
      <h5 class="mb-3">Novi događaj</h5>

      <b-form @submit.prevent="dodajDogadaj">
        <b-row>
          <b-col md="6">
            <b-form-group label="Naziv *" label-for="novi-naziv">
              <b-form-input
                id="novi-naziv"
                v-model="noviDogadaj.naziv"
                required
                placeholder="npr. Vjenčanje Ana & Marko"
              />
            </b-form-group>
          </b-col>

          <b-col md="6">
            <b-form-group label="Vrsta snimanja *" label-for="novi-vrsta">
              <b-form-select
                id="novi-vrsta"
                v-model="noviDogadaj.vrsta"
                :options="vrstaOpcije"
                required
              />
            </b-form-group>
          </b-col>
        </b-row>

        <b-row>
          <b-col md="6">
            <b-form-group label="Grad" label-for="novi-grad">
              <b-form-input
                id="novi-grad"
                v-model="noviDogadaj.grad"
                placeholder="Grad"
              />
            </b-form-group>
          </b-col>

          <b-col md="6">
            <b-form-group label="Država" label-for="novi-drzava">
              <b-form-input
                id="novi-drzava"
                v-model="noviDogadaj.drzava"
                placeholder="Država"
              />
            </b-form-group>
          </b-col>
        </b-row>

        <b-row>
          <b-col md="4">
            <b-form-group label="Datum" label-for="novi-datum">
              <b-form-input
                id="novi-datum"
                v-model="noviDogadaj.datum"
                type="date"
                :min="minDatum"
              />
            </b-form-group>
          </b-col>
        </b-row>

        <b-button type="submit" variant="primary" :disabled="spremanje">
          {{ spremanje ? "Spremanje..." : "Dodaj događaj" }}
        </b-button>
      </b-form>
    </b-card>

    <!-- Lista događaja korisnika -->
    <h5 class="mb-3">Moji događaji</h5>

    <div v-if="dogadaji.length === 0" class="text-center text-muted py-5">
      <p class="mb-0">Još nemaš događaja.</p>
      <p class="small">Dodaj prvi događaj pomoću forme iznad.</p>
    </div>

    <template v-else>
      <!-- Filtar po statusu — computed nad već dohvaćenom listom -->
      <b-button-group class="mb-3">
        <b-button
          :variant="aktivniFiltar === 'planirani' ? 'primary' : 'outline-primary'"
          @click="aktivniFiltar = 'planirani'"
        >
          Planirani
        </b-button>
        <b-button
          :variant="aktivniFiltar === 'zavrseni' ? 'primary' : 'outline-primary'"
          @click="aktivniFiltar = 'zavrseni'"
        >
          Završeni
        </b-button>
        <b-button
          :variant="aktivniFiltar === 'svi' ? 'primary' : 'outline-primary'"
          @click="aktivniFiltar = 'svi'"
        >
          Svi
        </b-button>
      </b-button-group>

      <div
        v-if="filtriraniDogadaji.length === 0"
        class="text-center text-muted py-4"
      >
        <p class="mb-0">{{ porukaPraznogFiltra }}</p>
      </div>

      <dogadaj-kartica
        v-for="dogadaj in filtriraniDogadaji"
        :key="dogadaj.id"
        :dogadaj="dogadaj"
        :vrsta-opcije="vrstaOpcije"
        @uredi="otvoriUredivanje"
        @obrisi="otvoriBrisanje"
        @greska="prikaziGresku"
      />
    </template>

    <!-- Modal za uređivanje -->
    <b-modal
      id="modal-uredi"
      v-model="prikaziModalUredivanja"
      title="Uredi događaj"
      ok-title="Spremi"
      cancel-title="Odustani"
      :ok-disabled="spremanje"
      @ok="spremiUredivanje"
    >
      <b-form @submit.stop.prevent="spremiUredivanje">
        <b-form-group label="Naziv *" label-for="uredi-naziv">
          <b-form-input
            id="uredi-naziv"
            v-model="formaUredivanja.naziv"
            required
          />
        </b-form-group>

        <b-form-group label="Vrsta snimanja *" label-for="uredi-vrsta">
          <b-form-select
            id="uredi-vrsta"
            v-model="formaUredivanja.vrsta"
            :options="vrstaOpcije"
            required
          />
        </b-form-group>

        <b-form-group label="Grad" label-for="uredi-grad">
          <b-form-input id="uredi-grad" v-model="formaUredivanja.grad" />
        </b-form-group>

        <b-form-group label="Država" label-for="uredi-drzava">
          <b-form-input id="uredi-drzava" v-model="formaUredivanja.drzava" />
        </b-form-group>

        <b-form-group label="Datum" label-for="uredi-datum">
          <b-form-input
            id="uredi-datum"
            v-model="formaUredivanja.datum"
            type="date"
            :min="minDatum"
          />
        </b-form-group>
      </b-form>
    </b-modal>

    <!-- Modal za potvrdu brisanja -->
    <b-modal
      id="modal-obrisi"
      v-model="prikaziModalBrisanja"
      title="Obriši događaj"
      ok-title="Obriši"
      ok-variant="danger"
      cancel-title="Odustani"
      :ok-disabled="spremanje"
      @ok="potvrdiBrisanje"
    >
      <p v-if="dogadajZaBrisanje">
        Jeste li sigurni da želite obrisati događaj
        <strong>{{ dogadajZaBrisanje.naziv }}</strong>?
        Ova radnja se ne može poništiti.
      </p>
    </b-modal>
  </div>
</template>

<script>
import firebase from "firebase/app";
import { db, auth } from "@/firebase";
import DogadajKartica from "@/components/DogadajKartica.vue";
import { zadaciZaVrstu } from "@/data/predlosci";

export default {
  name: "StranicaDogadaji",
  components: {
    DogadajKartica,
  },
  data() {
    return {
      mojUid: null,
      dogadaji: [],
      odjavaSnapshot: null,
      greskaPoruka: "",
      spremanje: false,

      noviDogadaj: {
        naziv: "",
        vrsta: null,
        grad: "",
        drzava: "",
        datum: "",
      },

      prikaziModalUredivanja: false,
      dogadajZaUredivanje: null,
      formaUredivanja: {
        naziv: "",
        vrsta: null,
        grad: "",
        drzava: "",
        datum: "",
      },

      prikaziModalBrisanja: false,
      dogadajZaBrisanje: null,

      // planirani | zavrseni | svi
      aktivniFiltar: "planirani",

      // Fiksne vrijednosti vrste — hrvatski znakovi moraju ostati konzistentni
      vrstaOpcije: [
        { value: null, text: "Odaberi vrstu...", disabled: true },
        { value: "vjenčanje", text: "Vjenčanje" },
        { value: "rođendan", text: "Rođendan" },
        { value: "event", text: "Event" },
        { value: "promo", text: "Promo" },
      ],
    };
  },
  computed: {
    // Današnji datum u formatu YYYY-MM-DD za min na date inputu
    minDatum() {
      const danas = new Date();
      const godina = danas.getFullYear();
      const mjesec = String(danas.getMonth() + 1).padStart(2, "0");
      const dan = String(danas.getDate()).padStart(2, "0");
      return `${godina}-${mjesec}-${dan}`;
    },

    // Filtriranje liste u memoriji — bez novog Firestore upita
    filtriraniDogadaji() {
      if (this.aktivniFiltar === "svi") {
        return this.dogadaji;
      }

      if (this.aktivniFiltar === "zavrseni") {
        return this.dogadaji.filter(
          (dogadaj) => dogadaj.status === "Isporučeno"
        );
      }

      return this.dogadaji.filter(
        (dogadaj) => dogadaj.status !== "Isporučeno"
      );
    },

    porukaPraznogFiltra() {
      const poruke = {
        planirani: "Nema planiranih događaja.",
        zavrseni: "Nema završenih događaja.",
        svi: "Još nemaš događaja.",
      };
      return poruke[this.aktivniFiltar];
    },
  },
  mounted() {
    const korisnik = auth.currentUser;
    if (!korisnik) {
      return;
    }

    this.mojUid = korisnik.uid;
    this.pokreniSlusacDogadaja();
  },
  beforeDestroy() {
    if (this.odjavaSnapshot) {
      this.odjavaSnapshot();
    }
  },
  methods: {
    prikaziGresku(poruka) {
      this.greskaPoruka = poruka;
    },

    pokreniSlusacDogadaja() {
      // onSnapshot — lista se osvježava uživo
      this.odjavaSnapshot = db
        .collection("dogadaji")
        .where("uid", "==", this.mojUid)
        .onSnapshot(
          (snapshot) => {
            this.dogadaji = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
          },
          (greska) => {
            this.greskaPoruka =
              "Greška pri učitavanju događaja: " + greska.message;
          }
        );
    },

    async dodajDogadaj() {
      if (!this.noviDogadaj.naziv.trim() || !this.noviDogadaj.vrsta) {
        this.greskaPoruka = "Naziv i vrsta snimanja su obavezni.";
        return;
      }

      if (this.datumJeUProslosti(this.noviDogadaj.datum)) {
        this.greskaPoruka = "Datum ne može biti u prošlosti.";
        return;
      }

      this.greskaPoruka = "";
      this.spremanje = true;

      try {
        await db.collection("dogadaji").add({
          uid: this.mojUid,
          naziv: this.noviDogadaj.naziv.trim(),
          vrsta: this.noviDogadaj.vrsta,
          grad: this.noviDogadaj.grad.trim(),
          drzava: this.noviDogadaj.drzava.trim(),
          datum: this.noviDogadaj.datum,
          status: "Upit",
          zadaci: zadaciZaVrstu(this.noviDogadaj.vrsta),
          vrijemeUnosa: firebase.firestore.FieldValue.serverTimestamp(),
        });

        this.ocistiFormuKreiranja();
      } catch (greska) {
        this.greskaPoruka = "Greška pri dodavanju: " + greska.message;
      } finally {
        this.spremanje = false;
      }
    },

    ocistiFormuKreiranja() {
      this.noviDogadaj = {
        naziv: "",
        vrsta: null,
        grad: "",
        drzava: "",
        datum: "",
      };
    },

    datumJeUProslosti(datum) {
      if (!datum) {
        return false;
      }
      return datum < this.minDatum;
    },

    otvoriUredivanje(dogadaj) {
      this.dogadajZaUredivanje = dogadaj;
      this.formaUredivanja = {
        naziv: dogadaj.naziv || "",
        vrsta: dogadaj.vrsta || null,
        grad: dogadaj.grad || "",
        drzava: dogadaj.drzava || "",
        datum: dogadaj.datum || "",
      };
      this.prikaziModalUredivanja = true;
    },

    async spremiUredivanje(bvModalEvent) {
      if (bvModalEvent) {
        bvModalEvent.preventDefault();
      }

      if (!this.formaUredivanja.naziv.trim() || !this.formaUredivanja.vrsta) {
        this.greskaPoruka = "Naziv i vrsta snimanja su obavezni.";
        return;
      }

      if (this.datumJeUProslosti(this.formaUredivanja.datum)) {
        this.greskaPoruka = "Datum ne može biti u prošlosti.";
        return;
      }

      this.greskaPoruka = "";
      this.spremanje = true;

      try {
        await db
          .collection("dogadaji")
          .doc(this.dogadajZaUredivanje.id)
          .update({
            naziv: this.formaUredivanja.naziv.trim(),
            vrsta: this.formaUredivanja.vrsta,
            grad: this.formaUredivanja.grad.trim(),
            drzava: this.formaUredivanja.drzava.trim(),
            datum: this.formaUredivanja.datum,
          });

        this.prikaziModalUredivanja = false;
      } catch (greska) {
        this.greskaPoruka = "Greška pri spremanju: " + greska.message;
      } finally {
        this.spremanje = false;
      }
    },

    otvoriBrisanje(dogadaj) {
      this.dogadajZaBrisanje = dogadaj;
      this.prikaziModalBrisanja = true;
    },

    async potvrdiBrisanje(bvModalEvent) {
      bvModalEvent.preventDefault();
      this.greskaPoruka = "";
      this.spremanje = true;

      try {
        await db
          .collection("dogadaji")
          .doc(this.dogadajZaBrisanje.id)
          .delete();

        this.prikaziModalBrisanja = false;
        this.dogadajZaBrisanje = null;
      } catch (greska) {
        this.greskaPoruka = "Greška pri brisanju: " + greska.message;
      } finally {
        this.spremanje = false;
      }
    },
  },
};
</script>
