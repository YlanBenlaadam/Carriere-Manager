// Démo HORS-LIGNE : joue un match entre deux vrais clubs avec les effectifs
// générés, et affiche le résultat + le récit. Sert juste à VOIR le moteur vivre.
// (npm run demo)

import { CLUBS } from '../src/data/clubs'
import { EFFECTIFS } from '../src/data/effectifs'
import { jouerMatch } from '../src/game/match'
import { raconterMatch } from '../src/game/recit'
import { creerRng } from '../src/game/rng'
import { meilleurOnze } from '../src/game/compo'

// Retrouve un club par son id (on sait qu'il existe, d'où le "!").
function club(id: string) {
  return CLUBS.find((c) => c.id === id)!
}

// --- On choisit l'affiche : un modeste (Reims) reçoit un géant (PSG) ---
const nous = club('reims')
const adversaire = club('psg')

const nosTitulaires = meilleurOnze(EFFECTIFS[nous.id])
const titulairesAdverses = meilleurOnze(EFFECTIFS[adversaire.id])

// --- Aperçu de quelques joueurs générés de notre club ---
console.log(`\n=== Effectif de ${nous.nom} (aperçu) ===`)
for (const j of nosTitulaires.slice(0, 5)) {
  console.log(`  ${j.poste}  ${j.prenom} ${j.nom}, ${j.age} ans — niveau ${j.niveau}, potentiel ${j.potentiel}`)
}

// --- On joue le match (seed fixe pour une démo reproductible) ---
const rng = creerRng(777)
const resultat = jouerMatch(nosTitulaires, titulairesAdverses, rng)

const prono = resultat.pronostic
const pourcent = (p: number) => Math.round(p * 100) + '%'

console.log(`\n=== ${nous.nom}  vs  ${adversaire.nom} ===`)
console.log(`Pronostic : victoire ${pourcent(prono.victoire)} | nul ${pourcent(prono.nul)} | défaite ${pourcent(prono.defaite)}`)
console.log(`Score     : ${resultat.butsPour} - ${resultat.butsContre}`)
console.log(`Récit     : ${raconterMatch(resultat, nosTitulaires)}`)
console.log('')
