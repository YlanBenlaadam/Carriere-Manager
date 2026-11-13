// Note de fin de saison = SURPERFORMANCE : a-t-on fait mieux que ce que la force
// de l'effectif laissait attendre ? (Finir 8e avec le 14e budget > finir 3e avec
// le 1er budget.) On compare le rang réel au rang attendu.

// Réglages centraux du jeu (à affiner au playtest) :
const NOTE_BASE = 5.5 // note quand on finit EXACTEMENT au rang attendu
const POINTS_PAR_PLACE = 0.5 // ce que vaut chaque place gagnée/perdue vs l'attendu

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
  const index = classementIds.indexOf(clubId)
  if (index === -1) {
    return -1
  }
  return index + 1 // index 0 = 1re place
}

// Transforme l'écart (rang attendu vs rang réel) en une note /10.
// ecart > 0  = on a fini PLUS HAUT que prévu (surperformance) → note au-dessus de la base.
// ecart < 0  = on a déçu → note en dessous.
export function noteSurperformance(rangReel: number, rangAttendu: number): number {
  const ecart = rangAttendu - rangReel // + = mieux que prévu
  let note = NOTE_BASE + ecart * POINTS_PAR_PLACE

  // On garde la note dans [0, 10].
  if (note < 0) {
    note = 0
  }
  if (note > 10) {
    note = 10
  }

  // Arrondi à une décimale (comme les notes de joueurs).
  return Math.round(note * 10) / 10
}
