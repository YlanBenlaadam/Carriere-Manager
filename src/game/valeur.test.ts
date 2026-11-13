import { describe, it, expect } from 'vitest'
import { estimerValeur } from './valeur'
import type { Player } from './types'

// Joueur paramétrable sur les champs qui comptent pour la valeur.
function joueur(over: Partial<Player>): Player {
  return {
    id: 'x',
    prenom: '',
    nom: '',
    age: 26,
    poste: 'M',
    niveau: 70,
    potentiel: 70,
    mental: 50,
    forme: 1,
    fraicheur: 100,
    moral: 50,
    statut: 'apte',
    finContrat: 2030,
    ...over,
  }
}

describe('estimerValeur', () => {
  it('un meilleur niveau vaut plus cher (et de façon non-linéaire)', () => {
    const moyen = estimerValeur(joueur({ niveau: 60 }), 1)
    const bon = estimerValeur(joueur({ niveau: 80 }), 1)
    const crack = estimerValeur(joueur({ niveau: 95 }), 1)
    expect(bon).toBeGreaterThan(moyen)
    expect(crack).toBeGreaterThan(bon)
    // Non-linéaire : l'écart 80→95 est plus grand que l'écart 60→80.
    expect(crack - bon).toBeGreaterThan(bon - moyen)
  })

  it('un vétéran vaut moins qu’un joueur dans la force de l’âge (même niveau)', () => {
    const prime = estimerValeur(joueur({ age: 26 }), 1)
    const vieux = estimerValeur(joueur({ age: 34 }), 1)
    expect(vieux).toBeLessThan(prime)
  })

  it('un jeune à gros potentiel vaut plus qu’un jeune sans marge', () => {
    const crack = estimerValeur(joueur({ age: 19, niveau: 60, potentiel: 90 }), 1)
    const plafonne = estimerValeur(joueur({ age: 19, niveau: 60, potentiel: 60 }), 1)
    expect(crack).toBeGreaterThan(plafonne)
  })

  it('un contrat en fin de course fait baisser la valeur', () => {
    // finContrat 2 : il reste 1 saison si on est en saison 1.
    const finBientot = estimerValeur(joueur({ finContrat: 2 }), 1)
    const longContrat = estimerValeur(joueur({ finContrat: 5 }), 1)
    expect(finBientot).toBeLessThan(longContrat)
  })

  it('la valeur est toujours au moins 1', () => {
    const faible = estimerValeur(joueur({ niveau: 30, age: 36, finContrat: 1 }), 5)
    expect(faible).toBeGreaterThanOrEqual(1)
  })
})
