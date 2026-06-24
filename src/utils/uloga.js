import { ADMIN_EMAIL } from "@/config";

/**
 * Provjera je li Firebase korisnik admin (fotograf).
 */
export function jeAdmin(korisnik) {
  if (!korisnik || !korisnik.email) {
    return false;
  }

  return korisnik.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Vraća ulogu prijavljenog korisnika ili null ako nije prijavljen.
 */
export function ulogaKorisnika(korisnik) {
  if (!korisnik) {
    return null;
  }

  return jeAdmin(korisnik) ? "admin" : "klijent";
}

/**
 * Početna ruta nakon prijave — ovisno o ulozi.
 */
export function pocetnaRutaZaKorisnika(korisnik) {
  return jeAdmin(korisnik) ? "/admin" : "/rezervacija";
}
