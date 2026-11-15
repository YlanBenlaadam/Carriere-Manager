// Note de fin de saison : a-t-on fait aussi bien (ou mieux) que ce que la force de
// l'effectif laissait attendre ? On compare le rang réel au rang attendu.

import type { Rng } from './rng'

// Classement ATTENDU : les clubs triés par force décroissante (le plus fort 1er).
// Entrée : un dictionnaire { clubId: force globale }. Sortie : les ids ordonnés.
export function classementAttendu(forcesParClub: Record<string, number>): string[] {
  const ids = Object.keys(forcesParClub)
  // Tri décroissant : la plus grosse force passe en premier.
  ids.sort((a, b) => forcesParClub[b] - forcesParClub[a])
  return ids
}

// Rang (position à partir de 1) d'un club dans une liste ordonnée d'ids.
// Renvoie -1 si le club n'est pas trouvé.
export function rangDe(classementIds: string[], clubId: string): number {
  const index = classementIds.indexOf(clubId) // indexOf renvoie l'index de l'élément dans le tableau, ou -1 s'il n'est pas trouvé
  if (index === -1) {
    return -1
  }
  return index + 1 // index 0 = 1re place
}

// Transforme l'écart (rang attendu − rang réel) en une note /10, par PALIERS :
//   - finir au rang attendu OU mieux (ecart >= 0) → excellente saison : 7 à 10
//   - 1 à 3 places sous l'attendu                 → saison moyenne     : 5 à 6
//   - plus de 3 places sous l'attendu             → saison ratée       : 2 à 4.5
// Dans chaque palier, on tire une valeur au hasard (via rng) pour varier la note.
export function noteSurperformance(rangReel: number, rangAttendu: number, rng: Rng): number {
  const ecart = rangAttendu - rangReel // > 0 = mieux que prévu, < 0 = moins bien

  let note: number
  if (ecart >= 0) {
    note = 7 + rng() * 3 // 7 à 10
  } else if (ecart >= -3) {
    note = 5 + rng() * 1 // 5 à 6
  } else {
    note = 2 + rng() * 2.5 // 2 à 4.5
  }

  // Arrondi à une décimale.
  return Math.round(note * 10) / 10
}
