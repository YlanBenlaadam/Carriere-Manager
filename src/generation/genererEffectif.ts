import type { Player, Poste } from '../game/types'
import type { Rng } from '../game/rng'
import { genererJoueur } from './genererJoueur'

// Composition d'un effectif : 20 joueurs répartis par poste (2 G, 6 D, 7 M, 5 A).
// De quoi aligner un XI et avoir de la rotation + des choix de composition.
const COMPOSITION: Poste[] = [
  'G', 'G',
  'D', 'D', 'D', 'D', 'D', 'D',
  'M', 'M', 'M', 'M', 'M', 'M', 'M',
  'A', 'A', 'A', 'A', 'A',
]

// Convertit le prestige d'un club (0-100) en niveau moyen visé pour son effectif.
// Formule validée : prestige 100 → moyenne 80 ; prestige 25 → moyenne 50.
function niveauMoyenDepuisPrestige(prestige: number): number {
  return 40 + prestige * 0.4
}

export function genererEffectif(clubId: string, prestige: number, rng: Rng): Player[] {
  // Niveau moyen autour duquel les joueurs de ce club seront générés.
  const niveauMoyen = niveauMoyenDepuisPrestige(prestige)

  // On construit l'effectif poste par poste, en suivant la composition ci-dessus.
  const effectif: Player[] = []
  for (let i = 0; i < COMPOSITION.length; i++) {
    const poste = COMPOSITION[i]

    // Id unique et lisible, préfixé par le club (ex. "lyon-1", "lyon-2"...).
    // i commence à 0, donc on ajoute 1 pour numéroter à partir de 1.
    const id = clubId + '-' + (i + 1)

    const joueur = genererJoueur({ id, poste, niveauMoyen }, rng)
    effectif.push(joueur)
  }

  return effectif
}
