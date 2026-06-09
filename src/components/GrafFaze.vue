<script>
import { Bar } from "vue-chartjs";

export default {
  name: "GrafFaze",
  extends: Bar,
  props: {
    podaci: {
      type: Object,
      required: true,
    },
    opcije: {
      type: Object,
      default() {
        return {};
      },
    },
  },
  mounted() {
    this.renderChart(this.podaci, this.opcije);
  },
  watch: {
    // Ponovno crtanje kad roditelj ažurira podatke
    podaci: {
      deep: true,
      handler(noviPodaci) {
        if (this._chart) {
          this._chart.destroy();
        }
        this.renderChart(noviPodaci, this.opcije);
      },
    },
  },
  beforeDestroy() {
    if (this._chart) {
      this._chart.destroy();
    }
  },
};
</script>
