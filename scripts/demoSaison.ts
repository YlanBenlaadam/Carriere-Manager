// Démo HORS-LIGNE : simule une saison complète du Championnat de France et affiche
// le classement final + le bilan d'un club modeste. (npm run demo:saison)

import { CLUBS } from '../src/data/clubs'
import { EFFECTIFS } from '../src/data/effectifs'
import { simulerSaison, forceGlobale, faireBilan } from '../src/game/saison'
import { creerRng } from '../src/game/rng'
import type { Player, Jauges } from '../src/game/types'

// Nom lisible d'un club à partir de son id.
function nomDe(id: string): string {
  return CLUBS.find((c) => c.id === id)!.nom
}

// --- On ne garde que les clubs du Championnat de France ---
const clubsFrance = CLUBS.filter((c) => c.championnat === 'France')
const clubIds = clubsFrance.map((c) => c.id)

// Dictionnaire { idDuClub: ses joueurs } pour ces clubs.
const effectifs: Record<string, Player[]> = {}
for (const id of clubIds) {
  effectifs[id] = EFFECTIFS[id]
}

// Force globale de chaque club → servira au classement ATTENDU.
const forces: Record<string, number> = {}
for (const id of clubIds) {
  forces[id] = forceGlobale(EFFECTIFS[id])
}

// --- On simule toute la saison (seed fixe = reproductible) ---
const rng = creerRng(2026)
const { classement } = simulerSaison(clubIds, effectifs, rng)

// --- Affichage du classement final ---
console.log('\n=== Classement final — Championnat de France ===')
classement.forEach((ligne, index) => {
  const rang = (index + 1).toString().padStart(2)
  const nom = nomDe(ligne.clubId).padEnd(26)
  const diff = (ligne.difference >= 0 ? '+' : '') + ligne.difference
  console.log(`${rang}. ${nom} ${ligne.points} pts  (${ligne.gagnes}V ${ligne.nuls}N ${ligne.perdus}D, diff ${diff})`)
})

// --- Bilan pour un club modeste (Reims) ---
const monClub = 'reims'
const jauges: Jauges = { direction: 50, vestiaire: 50, fans: 50, tresorerie: 50 }
const bilan = faireBilan(monClub, classement, forces, jauges, rng)

console.log(`\n=== Bilan de ${nomDe(monClub)} ===`)
console.log(`Rang réel : ${bilan.rangReel}e  |  Rang attendu : ${bilan.rangAttendu}e`)
console.log(`Note de surperformance : ${bilan.note}/10`)
console.log(`Licencié : ${bilan.licencie ? 'oui' : 'non'}`)
console.log('')
