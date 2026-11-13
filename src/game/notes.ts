import type { Player, Score } from './types'
import type { Rng } from './rng'

// Base d'équipe selon le résultat (réglable).
const BASE_VICTOIRE = 6.5
const BASE_NUL = 5.5
const BASE_DEFAITE = 4.5

// Bonus accordés aux joueurs décisifs (réglables).
const BOOST_BUT = 1.5 // pour avoir marqué un but
const BOOST_PASSE = 0.8 // pour une passe décisive

export function genererNotes(
  joueurs: Player[],
  score: Score,
  rng: Rng,
): Record<string, number> {
  // Base commune à toute l'équipe, déduite du résultat.
  let base: number
  if (score.butsPour > score.butsContre) base = BASE_VICTOIRE
  else if (score.butsPour === score.butsContre) base = BASE_NUL
  else base = BASE_DEFAITE

  // 1) Note brute de chaque joueur = base + écart individuel aléatoire [-4, +4].
  //    On NE clampe/arrondit PAS encore : on ajoute d'abord les bonus décisifs.
  //    Sa ns permet d'avoir une large variete de notes en cas de victoire on a pas que des 10/10 et pr defaite vice versa
  // On ajoute a note a l'id de chaque joueur sa note dans le matchh
  const notes: Record<string, number> = {}
  for (const p of joueurs) {
    const ecart = rng() * 8 - 4
    notes[p.id] = base + ecart
  }

  // 2) Pour chaque but marqué, un joueur de champ tiré au sort reçoit le bonus
  //    buteur, et un autre (tiré au sort aussi) le bonus passeur décisif.
  //    Le gardien ne marque pas → on l'exclut du tirage.
  const joueursDeChamp = joueurs.filter((p) => p.poste !== 'G')
  if (joueursDeChamp.length > 0) {
    for (let but = 0; but < score.butsPour; but++) {
      const buteur = joueursDeChamp[Math.floor(rng() * joueursDeChamp.length)]
      notes[buteur.id] += BOOST_BUT

      const passeur = joueursDeChamp[Math.floor(rng() * joueursDeChamp.length)]
      notes[passeur.id] += BOOST_PASSE
    }
  }

  // 3) Finalisation : on clampe dans [1, 10] puis on arrondit à 1 décimale.
  for (const id in notes) {
    const clampee = Math.max(1, Math.min(10, notes[id]))
    notes[id] = Math.round(clampee * 10) / 10
  }

  return notes
}
