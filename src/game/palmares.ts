import type { Palmares, Trophee } from './types'

// Ajoute un trophée au palmarès et renvoie un NOUVEAU palmarès (fonction pure :
// on ne modifie pas l'ancien tableau, on en crée un nouveau avec le trophée en plus).
// Rappel : Palmares = Trophee[] et Trophee = { saison, competition } (types.ts).
export function ajouterTrophee(palmares: Palmares, trophee: Trophee): Palmares {
  return [...palmares, trophee]
}

// Compte combien de trophées d'un type donné figurent au palmarès
// (ex. combien de titres de champion). Pratique pour l'affichage de fin de partie.
export function compterTrophees(palmares: Palmares, competition: Trophee['competition']): number {
  return palmares.filter((t) => t.competition === competition).length
}
