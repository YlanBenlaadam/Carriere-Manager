// Note de fin de saison : a-t-on fait aussi bien (ou mieux) que ce que la force de
// l'effectif laissait attendre ? On compare le rang réel au rang attendu.

import type { Rng } from './rng'
import type {Trophee,TypeTrophee} from './types'

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

// Note de fin de saison /10, qui mélange DEUX choses :
//   - la PLACE absolue au classement (finir haut = mieux) ;
//   - la SURPERFORMANCE (a-t-on fait mieux que le rang attendu ?).
// Ainsi, finir 9e en "faisant le job" reste moyen, mais grimper bien au-dessus de
// l'attendu donne une excellente note. Réglages (poids, paliers) à affiner au playtest.
export function noteSurperformance(
  rangReel: number,
  rangAttendu: number,
  nbClubs: number,
  rng: Rng,
): number {
  // 1) Note ABSOLUE : 1er → 10, dernier → ~3 (réparti linéairement).
  let noteAbsolue = 10
  if (nbClubs > 1) {
    noteAbsolue = 10 - ((rangReel - 1) / (nbClubs - 1)) * 7
  }

  // 2) Note RELATIVE : écart entre le rang attendu et le rang réel.
  const ecart = rangAttendu - rangReel
  let noteRelative: number
  if (ecart >= 0) {
    noteRelative = 7 + Math.min(ecart, 3) // au niveau attendu (7) → gros dépassement (10)
  } else if (ecart >= -3) {
    noteRelative = 5 // 1 à 3 places sous l'attendu
  } else {
    noteRelative = 3 // bien en dessous de l'attendu
  }

  // 3) Mélange : 40 % place absolue + 60 % surperformance, + un léger hasard.
  let note = noteAbsolue * 0.4 + noteRelative * 0.6 + (rng() - 0.5) * 0.6

  // Bornes [1, 10] et arrondi à une décimale.
  if (note < 1) {
    note = 1
  }
  if (note > 10) {
    note = 10
  }
  return Math.round(note * 10) / 10
}
// Poids d'un trophée sur la note de saison (comme +0.6/but, +0.4/passe du joueur).
// championnat = 0 : finir 1er est DÉJÀ récompensé par la surperformance (sinon on
// compterait la même chose deux fois). À TOI d'ajuster ces poids au playtest.
const POIDS_TROPHEE: Record<TypeTrophee, number> = {
  championnat: 0,
  coupe_nationale: 0.5,
  europa: 0.8,
  ldc: 1.3,
}


export function bonusPalmaresSaison(trophees: Trophee[]): number {
  let bonus = 0 
	for(let i = 0; i<trophees.length; i++){
		const competition = trophees[i].competition ;
		bonus+= POIDS_TROPHEE[competition];
	}
	return bonus
}