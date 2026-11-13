import type { Player, Forces } from './types'

export function calculerForces(titulaires: Player[]): Forces {
  // Garde-fou : liste vide → on évite la division par 0 en renvoyant des forces nulles.
  if (titulaires.length === 0) {
    return { attaque: 0, defense: 0 }
  }

  // Accumulateurs : pour chaque secteur, le numérateur (Σ niveau×poids)
  // et le dénominateur (Σ poids) de la moyenne pondérée.
  let numAttaque = 0
  let denAttaque = 0
  let numDefense = 0
  let denDefense = 0

  for (const p of titulaires) {
    if (p.poste === 'G') {
      // Gardien : poids 0 en attaque (il n'attaque pas), poids 1 en défense.
      numAttaque += p.niveau * 0
      denAttaque += 0
      numDefense += p.niveau * 1
      denDefense += 1
    } else if (p.poste === 'D') {
      // Défenseur : surtout défensif (0.8), un peu offensif (0.2).
      numAttaque += p.niveau * 0.2
      denAttaque += 0.2
      numDefense += p.niveau * 0.8
      denDefense += 0.8
    } else if (p.poste === 'M') {
      // Milieu : équilibré, il pèse autant en attaque qu'en défense (0.5 / 0.5).
      numAttaque += p.niveau * 0.5
      denAttaque += 0.5
      numDefense += p.niveau * 0.5
      denDefense += 0.5
    } else if (p.poste === 'A') {
      // Attaquant : surtout offensif (0.8), peu défensif (0.2).
      numAttaque += p.niveau * 0.8
      denAttaque += 0.8
      numDefense += p.niveau * 0.2
      denDefense += 0.2
    }
  }

  // Moyenne pondérée finale de chaque secteur, sur l'échelle 0-100 comme le niveau.
  // on retourne les 2 valeurs calculer d'apres type c le format attendu pour un objet de type Forces

  return {
    attaque: numAttaque / denAttaque,
    defense: numDefense / denDefense,
  }
}
