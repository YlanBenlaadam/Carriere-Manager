import type { Player } from './types'

// Réglages de progression / déclin (à affiner au playtest) :
const AGE_FIN_PROGRESSION = 27 // jusqu'à cet âge inclus, un joueur peut progresser
const AGE_DEBUT_DECLIN = 31 // à partir de cet âge, il commence à décliner
const PART_ECART_COMBLE = 0.25 // part de l'écart vers le potentiel comblée par saison
const NIVEAU_MINIMUM = 30 // plancher de niveau (comme à la génération)

// Fait vieillir UN joueur d'une saison : âge +1, puis le niveau évolue.
// Fonction pure : renvoie un nouveau joueur, sans modifier l'original.
export function faireVieillirJoueur(joueur: Player): Player {
  const age = joueur.age + 1
  let niveau = joueur.niveau

  if (age <= AGE_FIN_PROGRESSION && niveau < joueur.potentiel) {
    // PROGRESSION : on comble une fraction de l'écart restant vers le potentiel.
    // Math.max(1, ...) garantit au moins +1, sinon un petit écart ne bougerait jamais.
    const ecart = joueur.potentiel - niveau
    const gain = Math.max(1, Math.round(ecart * PART_ECART_COMBLE))
    // On ne dépasse jamais le potentiel.
    niveau = Math.min(joueur.potentiel, niveau + gain)
  } else if (age >= AGE_DEBUT_DECLIN) {
    // DÉCLIN : la baisse s'accentue avec l'âge (31 → -1, 32 → -2, 35 → -5...).
    const perte = age - (AGE_DEBUT_DECLIN - 1)
    // On ne descend jamais sous le plancher.
    niveau = Math.max(NIVEAU_MINIMUM, niveau - perte)
  }
  // Entre 28 et 30 ans, ou déjà au potentiel : le niveau reste stable.

  return { ...joueur, age, niveau }
}

// Fait vieillir TOUT un effectif d'une saison (nouvel effectif, fonction pure).
export function faireVieillirEffectif(effectif: Player[]): Player[] {
  return effectif.map((joueur) => faireVieillirJoueur(joueur))
}
