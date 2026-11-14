import type { Player, Score, StatsMatch } from './types'
import type { Rng } from './rng'

// Base d'équipe selon le résultat (réglable). Volontairement proches : un match
// "moyen" tourne autour de 5-6.
const BASE_VICTOIRE = 6.3
const BASE_NUL = 5.5
const BASE_DEFAITE = 4.7

// Amplitude de l'écart aléatoire autour de la base. 5 → écart dans [-2.5, +2.5],
// et comme on utilise une courbe "en cloche" (moyenne de 2 tirages), les valeurs
// restent le plus souvent proches de la base (les 1-2 et 9-10 deviennent rares).
const AMPLITUDE_ECART = 5

// Planchers pour les joueurs décisifs : avoir marqué/passé garantit une bonne note.
const PLANCHER_BUTEUR = 8 // un buteur a au moins 8...
const BONUS_BUT_SUP = 0.6 // ...+0.6 par but supplémentaire (doublé, triplé...)
const PLANCHER_PASSEUR = 6.8 // un passeur a au moins 6.8 (boost plus petit que le buteur)
const BONUS_PASSE_SUP = 0.4 // ...+0.4 par passe supplémentaire

// Incrémente de 1 un compteur dans un dictionnaire (0 s'il n'existait pas encore).
function incrementer(compteur: Record<string, number>, id: string) {
  if (compteur[id] === undefined) {
    compteur[id] = 0
  }
  compteur[id] = compteur[id] + 1
}

export function genererNotes(joueurs: Player[], score: Score, rng: Rng): StatsMatch {
  let base: number
  if (score.butsPour > score.butsContre) base = BASE_VICTOIRE
  else if (score.butsPour === score.butsContre) base = BASE_NUL
  else base = BASE_DEFAITE

  const notes: Record<string, number> = {}
  const buteurs: Record<string, number> = {}
  const passeurs: Record<string, number> = {}

  // 1) Note de base + écart "en cloche". La moyenne de DEUX tirages aléatoires se
  //    concentre vers le milieu → la plupart des notes restent proches de la base,
  //    et les valeurs extrêmes (très basses / très hautes) sont rares.
  for (const p of joueurs) {
    const tirage = (rng() + rng()) / 2 // 0..1, concentré autour de 0.5
    const ecart = (tirage - 0.5) * AMPLITUDE_ECART // centré sur 0, dans [-2.5, +2.5]
    notes[p.id] = base + ecart
  }

  // 2) On attribue les buts et passes (on NE touche pas encore aux notes).
  //    Le gardien ne marque pas → exclu du tirage.
  const joueursDeChamp = joueurs.filter((p) => p.poste !== 'G')
  if (joueursDeChamp.length > 0) {
    for (let but = 0; but < score.butsPour; but++) {
      const buteur = joueursDeChamp[Math.floor(rng() * joueursDeChamp.length)]
      incrementer(buteurs, buteur.id)

      const passeur = joueursDeChamp[Math.floor(rng() * joueursDeChamp.length)]
      incrementer(passeurs, passeur.id)
    }
  }

  // 3) Planchers décisifs : un buteur (resp. passeur) ne peut pas avoir une mauvaise
  //    note. On remonte sa note AU MOINS au plancher (plus un bonus si plusieurs
  //    buts/passes). Si sa note aléatoire était déjà meilleure, on la garde.
  for (const id in buteurs) {
    const plancher = PLANCHER_BUTEUR + (buteurs[id] - 1) * BONUS_BUT_SUP
    if (notes[id] < plancher) {
      notes[id] = plancher
    }
  }
  for (const id in passeurs) {
    const plancher = PLANCHER_PASSEUR + (passeurs[id] - 1) * BONUS_PASSE_SUP
    if (notes[id] < plancher) {
      notes[id] = plancher
    }
  }

  // 4) Finalisation : clamp dans [1, 10] puis arrondi à 1 décimale.
  for (const id in notes) {
    const clampee = Math.max(1, Math.min(10, notes[id]))
    notes[id] = Math.round(clampee * 10) / 10
  }

  return { notes, buteurs, passeurs }
}
