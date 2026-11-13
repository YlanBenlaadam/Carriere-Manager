// Script HORS-LIGNE : à lancer à la main (npm run generate) pour (re)générer les
// effectifs de tous les clubs et les écrire dans src/data/effectifs.json.
// Ce fichier ne fait PAS partie du jeu livré : il sert juste à produire la data.

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { CLUBS } from '../src/data/clubs'
import { genererEffectif } from '../src/generation/genererEffectif'
import { creerRng } from '../src/game/rng'
import type { Player } from '../src/game/types'

// Graine fixe : relancer le script redonne EXACTEMENT les mêmes joueurs.
// (On pourra la changer un jour si on veut repartir sur un nouveau lot.)
const GRAINE = 20260101

// Un seul générateur aléatoire partagé, consommé club après club dans l'ordre du
// fichier clubs.json. L'ordre étant fixe, le résultat est reproductible.
const rng = creerRng(GRAINE)

// On construit un dictionnaire { idDuClub: [ses 20 joueurs] }.
const effectifs: Record<string, Player[]> = {}
for (const club of CLUBS) {
  effectifs[club.id] = genererEffectif(club.id, club.prestige, rng)
}

// Chemin de sortie, calculé à partir de l'emplacement de CE script (robuste quel
// que soit le dossier depuis lequel on lance la commande) :
// scripts/ -> on remonte d'un cran -> src/data/effectifs.json
const dossierScript = dirname(fileURLToPath(import.meta.url))
const cheminSortie = join(dossierScript, '..', 'src', 'data', 'effectifs.json')

// On écrit le JSON joliment indenté (2 espaces) pour qu'il reste lisible.
writeFileSync(cheminSortie, JSON.stringify(effectifs, null, 2), 'utf-8')

// Petit compte-rendu dans le terminal.
const nbClubs = CLUBS.length
const nbJoueurs = nbClubs * 20
console.log(`✓ Effectifs générés : ${nbClubs} clubs, ${nbJoueurs} joueurs → ${cheminSortie}`)
