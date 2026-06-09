/**
 * Predlošci checklista po vrsti događaja.
 * Ključevi moraju odgovarati vrijednostima vrste u formi (s hrvatskim znakovima).
 */
export const predlosci = {
  vjenčanje: [
    { tekst: "Sastanak s mladencima", gotovo: false },
    { tekst: "Dogovor lokacije i rasporeda dana", gotovo: false },
    { tekst: "Priprema opreme", gotovo: false },
    { tekst: "Snimanje ceremonije", gotovo: false },
    { tekst: "Snimanje proslave", gotovo: false },
    { tekst: "Obrada fotografija / videa", gotovo: false },
    { tekst: "Isporuka galerije", gotovo: false },
  ],
  rođendan: [
    { tekst: "Dogovor s klijentom o programu", gotovo: false },
    { tekst: "Provjera lokacije i rasvjete", gotovo: false },
    { tekst: "Priprema opreme", gotovo: false },
    { tekst: "Snimanje proslave", gotovo: false },
    { tekst: "Snimanje torte i posebnih trenutaka", gotovo: false },
    { tekst: "Obrada materijala", gotovo: false },
    { tekst: "Isporuka galerije", gotovo: false },
  ],
  event: [
    { tekst: "Briefing s organizatorom", gotovo: false },
    { tekst: "Obilazak lokacije", gotovo: false },
    { tekst: "Priprema opreme", gotovo: false },
    { tekst: "Snimanje eventa", gotovo: false },
    { tekst: "Snimanje keynote / panela", gotovo: false },
    { tekst: "Obrada materijala", gotovo: false },
    { tekst: "Isporuka materijala klijentu", gotovo: false },
  ],
  promo: [
    { tekst: "Dogovor koncepta snimanja", gotovo: false },
    { tekst: "Priprema scenografije / rekvizita", gotovo: false },
    { tekst: "Priprema opreme", gotovo: false },
    { tekst: "Snimanje promo materijala", gotovo: false },
    { tekst: "Snimanje B-roll kadrova", gotovo: false },
    { tekst: "Obrada i montaža", gotovo: false },
    { tekst: "Isporuka finalnog materijala", gotovo: false },
  ],
};

/**
 * Vraća kopiju predloška zadataka za vrstu — svaki događaj dobiva vlastiti niz.
 */
export function zadaciZaVrstu(vrsta) {
  const predlozak = predlosci[vrsta];
  if (!predlozak) {
    return [];
  }
  return predlozak.map((zadatak) => ({
    tekst: zadatak.tekst,
    gotovo: zadatak.gotovo,
  }));
}
