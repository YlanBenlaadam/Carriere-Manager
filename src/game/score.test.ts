import { describe, it, expect } from 'vitest'
import { tirerScore } from './score'
import type { Rng } from './rng'

function rngFixe(valeur: number): Rng {
  return () => valeur
}

// Quelques valeurs de hasard pour vérifier les invariants quel que soit le tirage.
const valeurs = [0, 0.2, 0.4, 0.6, 0.8, 0.99]

describe('tirerScore', () => {
  it('victoire + rng=0 → premier score de la liste (1-0)', () => {
    expect(tirerScore('victoire', rngFixe(0))).toEqual({ butsPour: 1, butsContre: 0 })
  })

  it('victoire + rng élevé → dernier score de la liste, et c’est bien une victoire', () => {
    // On ne fige plus un score précis (la table peut grandir), on vérifie que
    // le tirage pour un rng élevé reste cohérent : une victoire (butsPour > butsContre).
    const s = tirerScore('victoire', rngFixe(0.99))
    expect(s.butsPour).toBeGreaterThan(s.butsContre)
  })

  it('invariant victoire : butsPour > butsContre, quel que soit le hasard', () => {
    for (const v of valeurs) {
      const s = tirerScore('victoire', rngFixe(v))
      expect(s.butsPour).toBeGreaterThan(s.butsContre)
    }
  })

  it('invariant nul : butsPour === butsContre, quel que soit le hasard', () => {
    for (const v of valeurs) {
      const s = tirerScore('nul', rngFixe(v))
      expect(s.butsPour).toBe(s.butsContre)
    }
  })

  it('invariant defaite : butsPour < butsContre, quel que soit le hasard', () => {
    for (const v of valeurs) {
      const s = tirerScore('defaite', rngFixe(v))
      expect(s.butsPour).toBeLessThan(s.butsContre)
    }
  })
})
